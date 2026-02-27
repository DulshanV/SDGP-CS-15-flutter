"""
Hybrid Search Service: Semantic (FAISS + sentence-transformers) + Fuzzy (rapidfuzz).

Architecture:
- FAISS handles fast approximate nearest neighbor search on embeddings
- sentence-transformers encodes queries at search time
- rapidfuzz handles word-level typo correction using a vocabulary built from descriptions
- Results are merged and ranked by combined score
"""

import os
import re
import json
import logging
from typing import List, Optional, Dict, Tuple, Set
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from rapidfuzz import fuzz, process
from spellchecker import SpellChecker
from app.core.config import settings
from app.services.search_base import BaseSearchService

logger = logging.getLogger(__name__)


PERSIST_DIR = os.path.abspath(settings.chroma_persist_dir)
INDEX_FILE = os.path.join(PERSIST_DIR, "hs_codes.index")
METADATA_FILE = os.path.join(PERSIST_DIR, "hs_codes_metadata.json")
DESCRIPTIONS_FILE = os.path.join(PERSIST_DIR, "hs_codes_descriptions.json")

# Words too common/generic to be useful for correction
STOP_WORDS: Set[str] = {
    "other", "others", "parts", "thereof", "including", "excluding",
    "with", "without", "than", "more", "less", "not", "and", "for",
    "the", "that", "this", "from", "which", "their", "been", "have",
    "having", "being", "whether", "containing", "used", "made",
}


class FaissSearchService(BaseSearchService):
    """FAISS-based hybrid semantic + fuzzy search engine for HS codes (fallback backend)."""

    def __init__(self):
        self._index: Optional[faiss.Index] = None
        self._model: Optional[SentenceTransformer] = None
        self._metadatas: List[dict] = []
        self._descriptions: List[str] = []
        self._hscode_to_idx: Dict[str, int] = {}  # hscode -> index in metadatas
        self._hscode_meta: Dict[str, dict] = {}  # hscode -> metadata
        self._vocabulary: List[str] = []  # unique words from descriptions for typo correction
        self._spell: Optional[SpellChecker] = None  # English dictionary spell checker
        self._enrichment_svc = None  # Gemini enrichment (lazy-loaded)
        self._initialized = False

    def _build_vocabulary(self):
        """
        Extract unique meaningful words from all descriptions to use as
        the dictionary for word-level spell correction.
        Also returns word counts for frequency boosting.
        """
        word_counts: Dict[str, int] = {}
        word_pattern = re.compile(r"[a-zA-Z]{3,}")  # words with 3+ alpha chars

        for desc in self._descriptions:
            for word in word_pattern.findall(desc):
                w = word.lower()
                if w not in STOP_WORDS:
                    word_counts[w] = word_counts.get(w, 0) + 1

        # Keep words that appear at least once and are >= 3 chars
        self._vocabulary = sorted(word_counts.keys())
        self._vocab_counts = word_counts
        logger.info(f"Vocabulary built: {len(self._vocabulary)} unique words")

    def initialize(self):
        """Load FAISS index, metadata, and embedding model. Call once at startup."""
        if self._initialized:
            return

        logger.info(f"Initializing SearchService with FAISS at: {PERSIST_DIR}")

        # Check files exist
        if not os.path.exists(INDEX_FILE):
            raise FileNotFoundError(
                f"FAISS index not found at {INDEX_FILE}. "
                "Run 'python -m scripts.embed_dataset' first."
            )
        if not os.path.exists(METADATA_FILE):
            raise FileNotFoundError(
                f"Metadata file not found at {METADATA_FILE}. "
                "Run 'python -m scripts.embed_dataset' first."
            )

        # Load FAISS index
        self._index = faiss.read_index(INDEX_FILE)
        logger.info(f"FAISS index loaded: {self._index.ntotal} vectors, dim={self._index.d}")

        # Load metadata
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            self._metadatas = json.load(f)
        logger.info(f"Metadata loaded: {len(self._metadatas)} entries")

        # Load descriptions for fuzzy matching
        if os.path.exists(DESCRIPTIONS_FILE):
            with open(DESCRIPTIONS_FILE, "r", encoding="utf-8") as f:
                self._descriptions = json.load(f)
        else:
            self._descriptions = [m.get("description", "") for m in self._metadatas]

        # Build word-level vocabulary for typo correction
        self._build_vocabulary()

        # Initialize English dictionary spell checker with boosted HS vocabulary
        self._spell = SpellChecker(distance=2)
        # Boost HS vocabulary word frequencies so domain words win over generic English
        # e.g., "cotton" should beat "gotten", "rice" should beat "die"
        DOMAIN_BOOST = 1_000_000  # large multiplier to ensure HS words win
        boosted_words = {}
        for word, count in self._vocab_counts.items():
            # Words appearing more in HS descriptions get even higher boost
            boosted_words[word] = count * DOMAIN_BOOST
        self._spell.word_frequency.load_words(self._vocabulary)  # base load
        # Override with high frequencies
        for word, freq in boosted_words.items():
            self._spell.word_frequency._dictionary[word] = freq
        logger.info(f"Spell checker initialized with {len(boosted_words)} boosted HS words")

        # Build lookup indexes
        for idx, meta in enumerate(self._metadatas):
            hscode = meta.get("hscode", "")
            if hscode:
                self._hscode_to_idx[hscode] = idx
                self._hscode_meta[hscode] = meta

        logger.info(f"Lookup index built: {len(self._hscode_meta)} HS codes")

        # Load embedding model for query-time encoding
        logger.info(f"Loading embedding model: {settings.embedding_model}")
        self._model = SentenceTransformer(settings.embedding_model, device="cpu")
        logger.info("Embedding model loaded")

        # Lazy-load enrichment service (if any provider key is configured)
        if settings.groq_api_key or settings.gemini_api_key or settings.cohere_api_key:
            try:
                from app.services.enrichment_service import enrichment_service
                self._enrichment_svc = enrichment_service
                logger.info("Multi-provider enrichment service loaded for FAISS backend")
            except Exception as e:
                logger.warning(f"Enrichment service unavailable: {e}")

        self._initialized = True
        logger.info("SearchService initialized successfully")

    def _encode_query(self, query: str) -> np.ndarray:
        """Encode a query string into a normalized embedding vector."""
        embedding = self._model.encode(
            [query],
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embedding.astype("float32")

    def _fuzzy_correct_word(self, word: str) -> Optional[str]:
        """
        Correct a single misspelled word using a two-tier approach:
        1. HS vocabulary (rapidfuzz) — domain-specific terms like polyethylene, terephthalate
        2. English dictionary (pyspellchecker) — common words like laptop, computer
        When both return matches, pick the one with shorter edit distance.
        If tied, prefer the dictionary correction (more likely to be correct English).
        """
        word_lower = word.lower()

        # If known in the spell checker dictionary, no correction needed
        if self._spell and word_lower in self._spell:
            return None

        # Tier 1: HS vocabulary fuzzy matching
        hs_correction = None
        hs_edit_dist = 999
        if self._vocabulary:
            matches = process.extract(
                word_lower,
                self._vocabulary,
                scorer=fuzz.ratio,
                limit=3,
                score_cutoff=70,
            )
            if matches:
                best_word, best_score, _ = matches[0]
                if best_word != word_lower and best_score >= 75:
                    hs_correction = best_word
                    # Calculate approximate edit distance from fuzz score
                    hs_edit_dist = len(word_lower) - int(len(word_lower) * best_score / 100)
                    logger.debug(f"HS vocab: '{word}' -> '{best_word}' (score: {best_score})")

        # Tier 2: English dictionary spell correction (includes HS vocab words)
        spell_correction = None
        spell_edit_dist = 999
        if self._spell:
            result = self._spell.correction(word_lower)
            if result and result != word_lower:
                spell_correction = result
                # Simple edit distance approximation
                common = sum(1 for a, b in zip(word_lower, result) if a == b)
                spell_edit_dist = max(len(word_lower), len(result)) - common
                logger.debug(f"Spell: '{word}' -> '{result}' (edit_dist ~{spell_edit_dist})")

        # Pick the best correction
        if hs_correction and spell_correction:
            # If spell checker and HS vocab agree or spell has closer edit distance, use spell
            if spell_correction == hs_correction:
                return spell_correction
            if spell_edit_dist < hs_edit_dist:
                return spell_correction
            if hs_edit_dist < spell_edit_dist:
                return hs_correction
            # Tied: prefer spell checker (general English correctness)
            return spell_correction
        elif spell_correction:
            return spell_correction
        elif hs_correction:
            return hs_correction

        return None

    def _fuzzy_correct_query(self, query: str) -> Optional[str]:
        """
        Word-level fuzzy correction of the query.
        Splits query into words, corrects each misspelled word individually
        against the vocabulary, and reassembles the corrected query.
        Returns the corrected query string or None if no corrections were made.
        """
        if not self._vocabulary:
            return None

        words = query.strip().split()
        corrected_words = []
        any_corrected = False

        for word in words:
            # Skip very short words or numbers
            if len(word) < 3 or word.isdigit():
                corrected_words.append(word)
                continue

            correction = self._fuzzy_correct_word(word)
            if correction:
                corrected_words.append(correction)
                any_corrected = True
            else:
                corrected_words.append(word.lower())

        if any_corrected:
            corrected = " ".join(corrected_words)
            logger.info(f"Query corrected: '{query}' -> '{corrected}'")
            return corrected

        return None

    def _search_by_hscode(self, query: str) -> List[dict]:
        """Direct HS code lookup if query looks like an HS code."""
        cleaned = query.strip().replace(" ", "")
        results = []

        # Exact match
        if cleaned in self._hscode_meta:
            meta = self._hscode_meta[cleaned]
            results.append({
                "hscode": meta["hscode"],
                "description": meta["description"],
                "section": meta.get("section", ""),
                "level": meta.get("level", 0),
                "parent": meta.get("parent", ""),
                "relevance_pct": 100.0,
            })

        # Prefix match
        for hscode, meta in self._hscode_meta.items():
            code_clean = hscode.replace(".", "")
            if code_clean.startswith(cleaned) and hscode not in [r["hscode"] for r in results]:
                results.append({
                    "hscode": meta["hscode"],
                    "description": meta["description"],
                    "section": meta.get("section", ""),
                    "level": meta.get("level", 0),
                    "parent": meta.get("parent", ""),
                    "relevance_pct": 95.0,
                })

        return results[:20]

    def _get_hierarchy_path(self, hscode: str) -> List[str]:
        """Build the hierarchy path for an HS code by following parent links."""
        path = []
        current = hscode
        visited = set()

        while current and current not in visited:
            visited.add(current)
            if current in self._hscode_meta:
                meta = self._hscode_meta[current]
                path.append(f"{meta['hscode']}: {meta['description']}")
                parent = meta.get("parent", "")
                if parent and parent != "nan" and parent != current:
                    # Try direct match first
                    if parent in self._hscode_meta:
                        current = parent
                        continue
                    # Try normalised dotted form for all lengths
                    dotted = None
                    if len(parent) == 4:
                        dotted = f"{parent[:2]}.{parent[2:]}"      # 0103 -> 01.03
                    elif len(parent) == 6:
                        dotted = f"{parent[:4]}.{parent[4:]}"      # 870322 -> 8703.22
                    if dotted and dotted in self._hscode_meta:
                        current = dotted
                    else:
                        break
                else:
                    break
            else:
                break

        path.reverse()
        return path

    def _semantic_search(self, query: str, top_k: int) -> List[Tuple[int, float]]:
        """
        Run semantic search using FAISS.
        Returns list of (metadata_index, similarity_score) tuples.
        """
        query_embedding = self._encode_query(query)
        scores, indices = self._index.search(query_embedding, top_k)

        results = []
        for i in range(len(indices[0])):
            idx = int(indices[0][i])
            score = float(scores[0][i])
            if idx >= 0 and idx < len(self._metadatas):
                results.append((idx, score))

        return results

    def search(self, query: str, top_k: int = 10) -> dict:
        """
        Hybrid search: semantic + fuzzy + direct HS code lookup.

        Returns:
            {
                "query": original query,
                "corrected_query": fuzzy-corrected query if different,
                "total_results": count,
                "results": [
                    {
                        "hscode": "8517.13",
                        "description": "Smartphones",
                        "section": "Section XVI",
                        "level": 6,
                        "parent": "8517",
                        "relevance_pct": 92.5,
                        "hierarchy_path": [...]
                    },
                    ...
                ]
            }
        """
        if not self._initialized:
            self.initialize()

        query = query.strip()
        if not query:
            return {
                "query": query,
                "corrected_query": None,
                "total_results": 0,
                "results": [],
            }

        logger.info(f"Search query: '{query}'")

        # ── Step 1: Check if query is an HS code ──
        is_hscode = any(c.isdigit() for c in query) and sum(c.isdigit() for c in query) > len(query) * 0.5
        direct_results = []
        if is_hscode:
            direct_results = self._search_by_hscode(query)

        # ── Step 2: Fuzzy correction ──
        corrected_query = self._fuzzy_correct_query(query)

        # ── Step 3: Semantic search with ORIGINAL query ──
        fetch_k = min(top_k * 3, 50)
        semantic_original = self._semantic_search(query, fetch_k)

        # ── Step 4: Semantic search with CORRECTED query (if different) ──
        semantic_corrected = []
        if corrected_query and corrected_query.lower() != query.lower():
            semantic_corrected = self._semantic_search(corrected_query, fetch_k)

        # ── Step 5: Merge and rank ──
        seen_hscodes = set()
        merged = []

        # Direct HS code lookups first
        for r in direct_results:
            if r["hscode"] not in seen_hscodes:
                seen_hscodes.add(r["hscode"])
                merged.append(r)

        # Determine which semantic results are primary vs secondary
        # If query was corrected, the CORRECTED results are primary
        has_correction = corrected_query and corrected_query.lower() != query.lower()
        if has_correction:
            primary_results = semantic_corrected
            secondary_results = semantic_original
            primary_penalty = 1.0       # corrected results get full score
            secondary_penalty = 0.5     # original garbled results penalized heavily
        else:
            primary_results = semantic_original
            secondary_results = []
            primary_penalty = 1.0
            secondary_penalty = 1.0

        # Primary results
        for idx, score in primary_results:
            meta = self._metadatas[idx]
            hscode = meta.get("hscode", "")
            if hscode in seen_hscodes:
                continue
            seen_hscodes.add(hscode)

            # FAISS inner product score on normalized vectors: -1 to 1
            # Convert to 0-100% relevance
            relevance = max(0.0, score * 100.0) * primary_penalty

            merged.append({
                "hscode": hscode,
                "description": meta.get("description", ""),
                "section": meta.get("section", ""),
                "level": meta.get("level", 0),
                "parent": meta.get("parent", ""),
                "relevance_pct": round(relevance, 1),
            })

        # Secondary results (penalized)
        for idx, score in secondary_results:
            meta = self._metadatas[idx]
            hscode = meta.get("hscode", "")
            if hscode in seen_hscodes:
                continue
            seen_hscodes.add(hscode)

            relevance = max(0.0, score * 100.0) * secondary_penalty
            merged.append({
                "hscode": hscode,
                "description": meta.get("description", ""),
                "section": meta.get("section", ""),
                "level": meta.get("level", 0),
                "parent": meta.get("parent", ""),
                "relevance_pct": round(relevance, 1),
            })

        # Sort by relevance
        merged.sort(key=lambda x: x["relevance_pct"], reverse=True)
        merged = merged[:top_k]

        # ── Step 6: LLM enrichment for unknown / brand terms ──
        # Trigger enrichment when:
        #   a) Top result has low confidence (< threshold), OR
        #   b) The query words don't appear in any top-3 result descriptions
        #      (i.e. FAISS matched on embedding similarity but the term is foreign
        #       to the HS vocabulary — e.g. "oreo" → matched "ores" at ~37%)
        enrichment_info = None
        _should_enrich = False
        if self._enrichment_svc and merged:
            top_score = merged[0]["relevance_pct"]
            if top_score < 35:
                _should_enrich = True
            elif top_score < 55:
                # Check if query terms actually appear in the top results
                q_words = {w.lower() for w in query.split() if len(w) >= 3 and not w.isdigit()}
                top_descs = " ".join(
                    r["description"].lower() for r in merged[:3]
                )
                if q_words and not any(w in top_descs for w in q_words):
                    _should_enrich = True
                    logger.info(f"Query words {q_words} absent from top results — triggering enrichment")
        if _should_enrich:
            logger.info(f"Enrichment triggered (top: {merged[0]['relevance_pct']}%) for '{query}'")
            try:
                result = self._enrichment_svc.resolve_query(query)
                if result and result.get("keywords"):
                    enrichment_info = result.get("explanation", "")
                    enriched_query = result["keywords"]
                    logger.info(f"Gemini resolved '{query}' → '{enriched_query}'")
                    # Re-search with Gemini-provided keywords
                    enriched_semantic = self._semantic_search(enriched_query, fetch_k)
                    enriched_merged = []
                    enriched_seen = set()
                    for idx, score in enriched_semantic:
                        meta = self._metadatas[idx]
                        hscode = meta.get("hscode", "")
                        if hscode in enriched_seen:
                            continue
                        enriched_seen.add(hscode)
                        relevance = max(0.0, score * 100.0)
                        enriched_merged.append({
                            "hscode": hscode,
                            "description": meta.get("description", ""),
                            "section": meta.get("section", ""),
                            "level": meta.get("level", 0),
                            "parent": meta.get("parent", ""),
                            "relevance_pct": round(relevance, 1),
                        })
                    enriched_merged.sort(key=lambda x: x["relevance_pct"], reverse=True)
                    if enriched_merged and enriched_merged[0]["relevance_pct"] > merged[0]["relevance_pct"]:
                        merged = enriched_merged[:top_k]
                        logger.info(f"Enriched results replaced originals (top: {merged[0]['relevance_pct']}%)")
            except Exception as e:
                logger.warning(f"Enrichment failed for '{query}': {e}")

        # Enrich with hierarchy paths
        for result in merged:
            result["hierarchy_path"] = self._get_hierarchy_path(result["hscode"])

        effective_corrected = None
        if corrected_query and corrected_query.lower() != query.lower():
            effective_corrected = corrected_query

        return {
            "query": query,
            "corrected_query": effective_corrected,
            "enrichment_info": enrichment_info,
            "total_results": len(merged),
            "results": merged,
        }

    def get_hs_code_detail(self, hscode: str) -> Optional[dict]:
        """Get full details for a specific HS code."""
        if not self._initialized:
            self.initialize()

        meta = self._hscode_meta.get(hscode)
        if not meta:
            return None

        hscode_clean = hscode.replace(".", "")
        children = []
        for code, m in self._hscode_meta.items():
            parent = m.get("parent", "")
            if parent == hscode_clean or parent == hscode:
                children.append({
                    "hscode": m["hscode"],
                    "description": m["description"],
                    "level": m.get("level", 0),
                })

        return {
            "hscode": meta["hscode"],
            "description": meta["description"],
            "section": meta.get("section", ""),
            "level": meta.get("level", 0),
            "parent": meta.get("parent", ""),
            "children": children,
            "hierarchy_path": self._get_hierarchy_path(hscode),
        }

    def get_categories(self) -> List[dict]:
        """Get top-level categories (sections and their chapters)."""
        if not self._initialized:
            self.initialize()

        sections = {}
        for hscode, meta in self._hscode_meta.items():
            section = meta.get("section", "Unknown")
            level = meta.get("level", 0)

            if section not in sections:
                sections[section] = {"section": section, "chapters": []}

            if level == 4:
                sections[section]["chapters"].append({
                    "hscode": hscode,
                    "description": meta.get("description", ""),
                })

        result = sorted(sections.values(), key=lambda x: x["section"])
        for s in result:
            s["chapters"] = sorted(s["chapters"], key=lambda x: x["hscode"])

        return result


# Singleton instance
faiss_search_service = FaissSearchService()
