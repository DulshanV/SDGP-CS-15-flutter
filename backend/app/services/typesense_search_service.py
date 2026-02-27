"""
Typesense-based hybrid search service.

Uses Typesense's built-in BM25 + vector search with auto-embedding.
Integrates with the Gemini enrichment service for unknown brand/term resolution.
"""

import json
import logging
import re
from typing import List, Optional, Dict

import typesense
from typesense.exceptions import ObjectNotFound, RequestUnauthorized

from app.core.config import settings
from app.services.search_base import BaseSearchService

logger = logging.getLogger(__name__)

COLLECTION_NAME = settings.typesense_collection


class TypesenseSearchService(BaseSearchService):
    """Hybrid BM25 + semantic search via Typesense with Gemini enrichment."""

    def __init__(self):
        self._client: Optional[typesense.Client] = None
        self._enrichment_svc = None  # lazy import
        self._initialized = False

    def _get_client(self) -> typesense.Client:
        """Create or return cached Typesense client."""
        if self._client is None:
            self._client = typesense.Client({
                "nodes": [{
                    "host": settings.typesense_host,
                    "port": str(settings.typesense_port),
                    "protocol": settings.typesense_protocol,
                }],
                "api_key": settings.typesense_api_key,
                "connection_timeout_seconds": 5,
            })
        return self._client

    def initialize(self) -> None:
        """Verify Typesense connection and collection exist."""
        if self._initialized:
            return

        client = self._get_client()

        # Health check
        if not client.operations.is_healthy():
            raise ConnectionError("Typesense server is not healthy")

        # Verify collection exists
        try:
            info = client.collections[COLLECTION_NAME].retrieve()
            logger.info(
                f"Typesense collection '{COLLECTION_NAME}': "
                f"{info['num_documents']} documents"
            )
        except ObjectNotFound:
            raise RuntimeError(
                f"Typesense collection '{COLLECTION_NAME}' not found. "
                "Run: python -m scripts.index_typesense"
            )
        except RequestUnauthorized:
            raise RuntimeError(
                "Typesense API key is invalid. Check TYPESENSE_API_KEY in .env"
            )

        # Lazy-load enrichment service (only if Gemini key is configured)
        if settings.gemini_api_key:
            try:
                from app.services.enrichment_service import enrichment_service
                self._enrichment_svc = enrichment_service
                logger.info("Gemini enrichment service loaded")
            except Exception as e:
                logger.warning(f"Enrichment service unavailable: {e}")

        self._initialized = True
        logger.info("TypesenseSearchService initialized")

    def search(self, query: str, top_k: int = 10) -> dict:
        """
        Execute hybrid BM25 + semantic search via Typesense.

        Steps:
        1. Run hybrid search on the original query
        2. If results are low-confidence, trigger Gemini enrichment
        3. If enrichment provides keywords, re-search with enriched query
        4. Return results with enrichment_info and did-you-mean suggestion
        """
        if not self._initialized:
            self.initialize()

        query = query.strip()
        if not query:
            return {
                "query": query,
                "corrected_query": None,
                "enrichment_info": None,
                "total_results": 0,
                "results": [],
            }

        logger.info(f"Typesense search: '{query}'")

        # ── Step 1: Check if query is an HS code ──
        is_hscode = self._looks_like_hscode(query)

        if is_hscode:
            return self._search_by_hscode(query, top_k)

        # ── Step 2: Hybrid search with original query ──
        results, typo_suggestion, has_text_match = self._typesense_search(query, top_k)

        # ── Step 3: Evaluate confidence and maybe enrich ──
        enrichment_info = None
        if self._should_enrich(results, has_text_match):
            enrichment_info, enriched_keywords = self._try_enrich(query)
            if enriched_keywords:
                # Re-search with enriched query
                enriched_query = f"{query} {enriched_keywords}"
                logger.info(f"Re-searching with enriched query: '{enriched_query}'")
                enriched_results, _, _ = self._typesense_search(enriched_query, top_k)
                if enriched_results and (
                    not results or enriched_results[0]["relevance_pct"] > results[0]["relevance_pct"]
                ):
                    results = enriched_results

        # ── Step 4: Enrich results with hierarchy paths ──
        for r in results:
            r["hierarchy_path"] = self._get_hierarchy_path(r["hscode"])

        return {
            "query": query,
            "corrected_query": typo_suggestion,  # suggest only, never auto-applied
            "enrichment_info": enrichment_info,
            "total_results": len(results),
            "results": results[:top_k],
        }

    def _typesense_search(self, query: str, top_k: int) -> tuple[list, Optional[str], bool]:
        """
        Run a hybrid search on Typesense.
        Returns (results, typo_suggestion, has_text_match).
        """
        client = self._get_client()

        search_params = {
            "q": query,
            "query_by": "description,embedding",
            "prefix": "false,false",          # no prefix matching — require full tokens
            "num_typos": 1,                    # conservative typo tolerance
            "typo_tokens_threshold": 1,        # retry with typos if 0 exact matches
            "drop_tokens_threshold": 0,        # NEVER drop query tokens — prevents
                                               # "mobile phone" matching just "mobile"
            "min_len_1typo": 3,                # allow typo correction for 3-char words
            "per_page": top_k,
            "highlight_full_fields": "description",
            "exclude_fields": "embedding",
        }

        try:
            response = client.collections[COLLECTION_NAME].documents.search(search_params)
        except Exception as e:
            logger.error(f"Typesense search error: {e}")
            return [], None, False

        # Extract typo suggestion from Typesense
        typo_suggestion = None
        # Typesense doesn't return a "did you mean" directly, but we can detect
        # if all results came from a typo-corrected match via highlights
        # For now, we skip auto-correction (by design)

        results = []
        hits = response.get("hits", [])

        # Check if any hit has an actual text token match
        has_text_match = any(
            int(h.get("text_match_info", {}).get("tokens_matched", 0)) > 0
            for h in hits
        )

        def _score(h):
            """Extract numeric score from a hit (Typesense may return strings)."""
            s = h.get("hybrid_search_info", {}).get("rank_fusion_score", 0)
            if not s:
                s = h.get("text_match_info", {}).get("score", 0)
            return float(s) if s else 0.0

        max_score = max((_score(h) for h in hits), default=1.0) or 1.0

        for hit in hits:
            doc = hit["document"]
            raw_score = _score(hit)
            relevance_pct = min(100.0, (raw_score / max_score) * 100.0) if max_score > 0 else 0.0

            results.append({
                "hscode": doc.get("hscode", ""),
                "description": doc.get("description", ""),
                "section": doc.get("section", ""),
                "level": doc.get("level", 0),
                "parent": doc.get("parent", ""),
                "relevance_pct": round(relevance_pct, 1),
                "hierarchy_path": [],
            })

        return results, typo_suggestion, has_text_match

    def _search_by_hscode(self, query: str, top_k: int) -> dict:
        """Direct HS code lookup via Typesense filter."""
        client = self._get_client()
        cleaned = query.strip().replace(" ", "").replace(".", "")

        # Try exact match first
        try:
            search_params = {
                "q": "*",
                "filter_by": f"hscode:={query.strip()}",
                "per_page": 1,
                "exclude_fields": "embedding",
            }
            response = client.collections[COLLECTION_NAME].documents.search(search_params)
            hits = response.get("hits", [])
        except Exception:
            hits = []

        # If no exact match, try prefix search
        if not hits:
            try:
                search_params = {
                    "q": query.strip(),
                    "query_by": "hscode",
                    "prefix": "true",
                    "per_page": top_k,
                    "exclude_fields": "embedding",
                }
                response = client.collections[COLLECTION_NAME].documents.search(search_params)
                hits = response.get("hits", [])
            except Exception:
                hits = []

        results = []
        for i, hit in enumerate(hits):
            doc = hit["document"]
            results.append({
                "hscode": doc.get("hscode", ""),
                "description": doc.get("description", ""),
                "section": doc.get("section", ""),
                "level": doc.get("level", 0),
                "parent": doc.get("parent", ""),
                "relevance_pct": 100.0 if i == 0 else 95.0,
                "hierarchy_path": self._get_hierarchy_path(doc.get("hscode", "")),
            })

        return {
            "query": query,
            "corrected_query": None,
            "enrichment_info": None,
            "total_results": len(results),
            "results": results[:top_k],
        }

    def _should_enrich(self, results: list, has_text_match: bool) -> bool:
        """Decide if Gemini enrichment should be triggered."""
        if not self._enrichment_svc:
            return False
        if not results:
            return True
        # If no token matched in any result, the query term is foreign to the dataset
        if not has_text_match:
            logger.info("No text match found — triggering enrichment")
            return True
        # If the top result's relevance is below threshold, try enrichment
        threshold = settings.enrichment_confidence_threshold * 100
        return results[0]["relevance_pct"] < threshold

    def _try_enrich(self, query: str) -> tuple[Optional[str], Optional[str]]:
        """
        Call the enrichment service to resolve unknown terms.
        Returns (enrichment_info, enriched_keywords) or (None, None).
        """
        if not self._enrichment_svc:
            return None, None

        try:
            result = self._enrichment_svc.resolve_query(query)
            if result:
                info = result.get("explanation", "")
                keywords = result.get("keywords", "")
                # Auto-create synonym in Typesense
                if keywords:
                    self._create_synonym(query, keywords)
                return info, keywords
        except Exception as e:
            logger.warning(f"Enrichment failed for '{query}': {e}")

        return None, None

    def _create_synonym(self, source_term: str, keywords: str):
        """Create a one-way synonym in Typesense so future queries benefit."""
        client = self._get_client()
        synonym_id = f"syn_{re.sub(r'[^a-z0-9]', '_', source_term.lower())}"
        keyword_list = [k.strip().lower() for k in keywords.split(",") if k.strip()]

        if not keyword_list:
            return

        try:
            client.collections[COLLECTION_NAME].synonyms.upsert(synonym_id, {
                "root": source_term.lower(),
                "synonyms": keyword_list,
            })
            logger.info(f"Created synonym: '{source_term}' → {keyword_list}")
        except Exception as e:
            logger.warning(f"Failed to create synonym '{source_term}': {e}")

    def _get_hierarchy_path(self, hscode: str) -> List[str]:
        """Build hierarchy path by fetching parent documents from Typesense."""
        path = []
        current = hscode
        visited = set()
        client = self._get_client()

        while current and current not in visited and len(path) < 10:
            visited.add(current)
            doc_id = current.replace(".", "_")
            try:
                doc = client.collections[COLLECTION_NAME].documents[doc_id].retrieve()
                path.append(f"{doc['hscode']}: {doc['description']}")
                parent = doc.get("parent", "")
                if parent and parent != "nan" and parent != current:
                    # Try to resolve parent (might be dotted or undotted)
                    current = parent if "." in parent else f"{parent[:2]}.{parent[2:]}" if len(parent) == 4 else parent
                else:
                    break
            except Exception:
                break

        path.reverse()
        return path

    @staticmethod
    def _looks_like_hscode(query: str) -> bool:
        """Check if the query looks like an HS code (mostly digits)."""
        digits = sum(c.isdigit() for c in query)
        return digits > 0 and digits > len(query.strip()) * 0.5

    def get_hs_code_detail(self, hscode: str) -> Optional[dict]:
        """Get full details for a specific HS code."""
        if not self._initialized:
            self.initialize()

        client = self._get_client()
        doc_id = hscode.replace(".", "_")

        try:
            doc = client.collections[COLLECTION_NAME].documents[doc_id].retrieve()
        except ObjectNotFound:
            return None
        except Exception as e:
            logger.error(f"Error fetching HS code {hscode}: {e}")
            return None

        # Find children
        hscode_clean = hscode.replace(".", "")
        try:
            child_response = client.collections[COLLECTION_NAME].documents.search({
                "q": "*",
                "filter_by": f"parent:={hscode_clean}",
                "per_page": 100,
                "exclude_fields": "embedding",
            })
            children = [
                {
                    "hscode": h["document"]["hscode"],
                    "description": h["document"]["description"],
                    "level": h["document"]["level"],
                }
                for h in child_response.get("hits", [])
            ]
        except Exception:
            # Also try dotted parent
            try:
                child_response = client.collections[COLLECTION_NAME].documents.search({
                    "q": "*",
                    "filter_by": f"parent:={hscode}",
                    "per_page": 100,
                    "exclude_fields": "embedding",
                })
                children = [
                    {
                        "hscode": h["document"]["hscode"],
                        "description": h["document"]["description"],
                        "level": h["document"]["level"],
                    }
                    for h in child_response.get("hits", [])
                ]
            except Exception:
                children = []

        return {
            "hscode": doc.get("hscode", hscode),
            "description": doc.get("description", ""),
            "section": doc.get("section", ""),
            "level": doc.get("level", 0),
            "parent": doc.get("parent", ""),
            "children": children,
            "hierarchy_path": self._get_hierarchy_path(hscode),
        }

    def get_categories(self) -> List[dict]:
        """Get top-level categories (sections and their chapters)."""
        if not self._initialized:
            self.initialize()

        client = self._get_client()
        sections: Dict[str, dict] = {}

        try:
            # Facet search to get all sections
            response = client.collections[COLLECTION_NAME].documents.search({
                "q": "*",
                "query_by": "description",
                "filter_by": "level:=4",
                "per_page": 250,
                "facet_by": "section",
                "exclude_fields": "embedding",
            })

            for hit in response.get("hits", []):
                doc = hit["document"]
                section = doc.get("section", "Unknown")
                if section not in sections:
                    sections[section] = {"section": section, "chapters": []}
                sections[section]["chapters"].append({
                    "hscode": doc.get("hscode", ""),
                    "description": doc.get("description", ""),
                })

            # If we got fewer than expected, paginate
            found = response.get("found", 0)
            page = 2
            while len(response.get("hits", [])) < found and page <= 10:
                response = client.collections[COLLECTION_NAME].documents.search({
                    "q": "*",
                    "query_by": "description",
                    "filter_by": "level:=4",
                    "per_page": 250,
                    "page": page,
                    "exclude_fields": "embedding",
                })
                for hit in response.get("hits", []):
                    doc = hit["document"]
                    section = doc.get("section", "Unknown")
                    if section not in sections:
                        sections[section] = {"section": section, "chapters": []}
                    sections[section]["chapters"].append({
                        "hscode": doc.get("hscode", ""),
                        "description": doc.get("description", ""),
                    })
                page += 1

        except Exception as e:
            logger.error(f"Error fetching categories: {e}")

        result = sorted(sections.values(), key=lambda x: x["section"])
        for s in result:
            s["chapters"] = sorted(s["chapters"], key=lambda x: x["hscode"])
        return result
