"""
Multi-provider LLM enrichment service for resolving unknown brands/terms.

Cascade order:  Groq (Llama 3.3 70B)  →  Gemini Flash  →  Cohere Command-R
Each provider is tried in order.  On 429 / network error the next is tried.
Results are cached permanently in SQLite so each term triggers ONE LLM call ever.
"""

import json
import logging
import os
import sqlite3
from typing import Optional, Dict, List, Callable

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Shared system prompt (same for all providers) ──────────────────────────
SYSTEM_PROMPT = """You are an expert in international trade and the Harmonized System (HS) tariff code classification.

When given a query term (which may be a brand name, trade name, product abbreviation, or unfamiliar term), you must:
1. Identify what the term refers to (brand, product type, etc.)
2. Provide a brief one-sentence explanation
3. List the most relevant product category keywords that would appear in HS code descriptions

Respond ONLY in this exact JSON format:
{
    "explanation": "Brief one-sentence explanation of the term",
    "keywords": "comma-separated keywords that match HS code descriptions",
    "confidence": 0.0 to 1.0
}

Examples:
- "Dilmah" → {"explanation": "Dilmah is a Sri Lankan tea brand", "keywords": "tea, black tea, green tea, Ceylon tea", "confidence": 0.95}
- "Samsung S24 Ultra" → {"explanation": "Samsung S24 Ultra is a smartphone model", "keywords": "smartphone, telephone, cellular, mobile phone", "confidence": 0.95}
- "Nespresso" → {"explanation": "Nespresso is a coffee capsule brand by Nestlé", "keywords": "coffee, coffee capsules, coffee machines, beverage preparation", "confidence": 0.9}
- "Gore-Tex" → {"explanation": "Gore-Tex is a waterproof breathable fabric membrane", "keywords": "waterproof fabric, textile membrane, laminated textile, coated fabric", "confidence": 0.9}
- "Premio" → {"explanation": "Premio is a Toyota sedan model (Toyota Premio)", "keywords": "motor vehicle, sedan, passenger car, automobile", "confidence": 0.95}

If you cannot identify the term, respond with:
{"explanation": null, "keywords": null, "confidence": 0.0}
"""

USER_PROMPT_TEMPLATE = 'Resolve this query for HS code classification: "{query}"'


# ── Provider implementations ───────────────────────────────────────────────

def _call_groq(query: str) -> dict:
    """Call Groq (Llama 3.3 70B) — fastest, 30 RPM free tier."""
    from groq import Groq

    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(query=query)},
        ],
        temperature=0.1,
        max_tokens=256,
        response_format={"type": "json_object"},
    )
    text = response.choices[0].message.content.strip()
    return json.loads(text)


def _call_gemini(query: str) -> dict:
    """Call Google Gemini Flash — 15 RPM free tier."""
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        settings.gemini_model,
        system_instruction=SYSTEM_PROMPT,
    )
    response = model.generate_content(
        USER_PROMPT_TEMPLATE.format(query=query),
        generation_config={
            "temperature": 0.1,
            "max_output_tokens": 256,
            "response_mime_type": "application/json",
        },
    )
    text = response.text.strip()
    return json.loads(text)


def _call_cohere(query: str) -> dict:
    """Call Cohere Command-R — 20 RPM free tier."""
    import cohere

    client = cohere.ClientV2(api_key=settings.cohere_api_key)
    response = client.chat(
        model=settings.cohere_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(query=query)},
        ],
        temperature=0.1,
        max_tokens=256,
        response_format={"type": "json_object"},
    )
    text = response.message.content[0].text.strip()
    return json.loads(text)


# ── Main service class ─────────────────────────────────────────────────────

class EnrichmentService:
    """Multi-provider LLM enrichment with automatic failover + SQLite caching."""

    def __init__(self):
        self._cache: Dict[str, Optional[dict]] = {}  # in-memory cache
        self._db_path: Optional[str] = None
        self._providers: List[tuple] = []  # [(name, callable), ...]
        self._initialized = False

    def _build_provider_chain(self):
        """Register available providers in priority order."""
        self._providers = []
        if settings.groq_api_key:
            self._providers.append(("groq", _call_groq))
            logger.info("  + Groq (Llama 3.3 70B) — primary")
        if settings.gemini_api_key:
            self._providers.append(("gemini", _call_gemini))
            logger.info("  + Gemini Flash — fallback")
        if settings.cohere_api_key:
            self._providers.append(("cohere", _call_cohere))
            logger.info("  + Cohere Command-R — fallback")

        if not self._providers:
            logger.warning("No enrichment providers configured (set GROQ_API_KEY, GEMINI_API_KEY, or COHERE_API_KEY)")

    def _init_db(self):
        """Set up SQLite synonym cache table."""
        db_url = settings.database_url.replace("sqlite+aiosqlite:///", "")
        self._db_path = os.path.abspath(db_url)

        conn = sqlite3.connect(self._db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS synonym_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_term TEXT UNIQUE NOT NULL,
                resolved_keywords TEXT,
                explanation TEXT,
                provider TEXT DEFAULT 'unknown',
                confidence REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

        # Load existing cache into memory
        cursor = conn.execute("SELECT source_term, resolved_keywords, explanation, confidence FROM synonym_cache")
        for row in cursor.fetchall():
            self._cache[row[0].lower()] = {
                "keywords": row[1],
                "explanation": row[2],
                "confidence": row[3] or 0.0,
            }

        conn.close()
        logger.info(f"Synonym cache loaded: {len(self._cache)} entries")

    def initialize(self):
        """Initialize provider chain and load cache."""
        if self._initialized:
            return

        logger.info("Initializing enrichment service (multi-provider cascade):")
        self._build_provider_chain()
        self._init_db()
        self._initialized = True

    def resolve_query(self, query: str) -> Optional[dict]:
        """
        Resolve an unknown query term via cache or LLM provider cascade.

        Returns:
            {"explanation": str, "keywords": str, "confidence": float} or None
        """
        if not self._initialized:
            self.initialize()

        query_lower = query.strip().lower()

        # ── Cache check ──
        if query_lower in self._cache:
            cached = self._cache[query_lower]
            if cached and cached.get("keywords"):
                logger.info(f"Cache hit for '{query}': {cached['keywords']}")
                return cached
            logger.info(f"Cache hit for '{query}': no useful result (previously checked)")
            return None

        # ── Cascade through providers ──
        if not self._providers:
            return None

        last_error = None
        for provider_name, call_fn in self._providers:
            logger.info(f"Trying {provider_name} for '{query}'...")
            try:
                result = call_fn(query)

                explanation = result.get("explanation")
                keywords = result.get("keywords")
                confidence = result.get("confidence", 0.0)

                if not explanation or not keywords or confidence < 0.5:
                    # Low confidence — cache to avoid re-calling
                    self._cache_result(query_lower, None, None, 0.0, provider_name)
                    logger.info(f"{provider_name} returned low confidence for '{query}'")
                    return None

                # Success — cache and return
                self._cache_result(query_lower, keywords, explanation, confidence, provider_name)
                enrichment = {
                    "explanation": explanation,
                    "keywords": keywords,
                    "confidence": confidence,
                }
                logger.info(f"{provider_name} resolved '{query}' -> {keywords} (confidence: {confidence})")
                return enrichment

            except json.JSONDecodeError as e:
                logger.warning(f"{provider_name} returned invalid JSON for '{query}': {e}")
                self._cache_result(query_lower, None, None, 0.0, provider_name)
                return None
            except Exception as e:
                error_str = str(e)
                is_rate_limit = "429" in error_str or "rate" in error_str.lower() or "quota" in error_str.lower()
                if is_rate_limit:
                    logger.warning(f"{provider_name} rate-limited (429) — trying next provider...")
                    last_error = e
                    continue  # try next provider
                else:
                    logger.error(f"{provider_name} error for '{query}': {e}")
                    last_error = e
                    continue  # try next provider on any error

        logger.error(f"All providers failed for '{query}'. Last error: {last_error}")
        return None

    def _cache_result(
        self,
        source_term: str,
        keywords: Optional[str],
        explanation: Optional[str],
        confidence: float,
        provider: str = "unknown",
    ):
        """Store result in both memory and SQLite."""
        self._cache[source_term] = {
            "keywords": keywords,
            "explanation": explanation,
            "confidence": confidence,
        }

        if self._db_path:
            try:
                conn = sqlite3.connect(self._db_path)
                conn.execute(
                    """
                    INSERT OR REPLACE INTO synonym_cache
                    (source_term, resolved_keywords, explanation, provider, confidence)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (source_term, keywords, explanation, provider, confidence),
                )
                conn.commit()
                conn.close()
            except Exception as e:
                logger.warning(f"Failed to cache synonym '{source_term}': {e}")

    # ── Admin / dashboard helpers ──────────────────────────────────────────

    def get_all_synonyms(self) -> list:
        """Return all cached synonyms (for admin dashboard)."""
        if self._db_path and os.path.exists(self._db_path):
            try:
                conn = sqlite3.connect(self._db_path)
                cursor = conn.execute(
                    "SELECT id, source_term, resolved_keywords, explanation, provider, confidence, created_at "
                    "FROM synonym_cache ORDER BY created_at DESC"
                )
                rows = cursor.fetchall()
                conn.close()
                return [
                    {
                        "id": r[0],
                        "source_term": r[1],
                        "resolved_keywords": r[2],
                        "explanation": r[3],
                        "provider": r[4],
                        "confidence": r[5],
                        "created_at": r[6],
                    }
                    for r in rows
                ]
            except Exception as e:
                logger.warning(f"Failed to fetch synonyms: {e}")
        return []

    def add_manual_synonym(self, source_term: str, keywords: str, explanation: str = "") -> dict:
        """Admin-created synonym (provider='admin')."""
        source_lower = source_term.strip().lower()
        self._cache[source_lower] = {
            "keywords": keywords,
            "explanation": explanation,
            "confidence": 1.0,
        }

        if self._db_path:
            conn = sqlite3.connect(self._db_path)
            conn.execute(
                """
                INSERT OR REPLACE INTO synonym_cache
                (source_term, resolved_keywords, explanation, provider, confidence)
                VALUES (?, ?, ?, 'admin', 1.0)
                """,
                (source_lower, keywords, explanation),
            )
            conn.commit()
            conn.close()

        return {"source_term": source_lower, "keywords": keywords, "explanation": explanation}

    def delete_synonym(self, synonym_id: int) -> bool:
        """Delete a synonym by ID."""
        if not self._db_path:
            return False

        conn = sqlite3.connect(self._db_path)
        cursor = conn.execute("SELECT source_term FROM synonym_cache WHERE id = ?", (synonym_id,))
        row = cursor.fetchone()
        if row:
            self._cache.pop(row[0], None)
        cursor = conn.execute("DELETE FROM synonym_cache WHERE id = ?", (synonym_id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted


# Singleton
enrichment_service = EnrichmentService()
