# HS Code Search Engine — Decision Log

## Decision 1: Replace aggressive spell-correction with suggest-only

**Date:** 2026-02-28  
**Status:** Approved  
**Context:** The current search pipeline auto-corrects every query through `pyspellchecker` (distance=2) + `rapidfuzz` (score_cutoff=70). This silently mangles brand names and proper nouns. Example: "Dilmah" → "dil" (destroyed), losing the user's intent entirely.  
**Decision:** Move to a suggest-only ("Did you mean?") model. The original query always executes as-is. Corrections are shown as clickable suggestions, never silently applied.  
**Consequence:** Users keep full control. Brand names like "Dilmah" go through semantic search untouched. If Typesense's typo tolerance proposes a correction, it's shown as a suggestion.

---

## Decision 2: Typesense as primary search backend

**Date:** 2026-02-28  
**Status:** Approved  
**Context:** Evaluated 8 alternatives: Algolia, Meilisearch, Typesense, Weaviate, txtai, LanceDB, Tantivy, Haystack.  
**Decision:** Typesense wins for this project because:
- Built-in hybrid BM25 + vector search (single query does both)
- Auto-embedding with `ts/all-MiniLM-L12-v2` — no separate embedding pipeline needed
- Built-in synonyms API (one-way and multi-way) — perfect for brand→category mappings
- Curation/overrides API for admin pinning
- Typo tolerance built-in, configurable per field
- Self-hosted, single binary, no cloud dependency
- Python SDK available  
**Alternatives rejected:**
- Algolia: SaaS-only, paid, vendor lock-in
- Meilisearch: No native vector search
- Weaviate: Overkill for 16K docs, heavier infra
- txtai: Lightweight but no BM25 hybrid, no synonyms API
- LanceDB: Embedded-only, no BM25
- Tantivy: Rust-native, no Python synonym management
- Haystack: Framework overhead, doesn't add value for simple pipeline

---

## Decision 3: FAISS as fallback search backend

**Date:** 2026-02-28  
**Status:** Approved  
**Context:** User warned about past Typesense/Python SDK compatibility issues. Need a safety net.  
**Decision:** Keep existing FAISS search (renamed to `faiss_search_service.py`) as a drop-in fallback. Both backends share an abstract `BaseSearchService` interface. Toggle via `SEARCH_BACKEND=typesense|faiss` env var. Auto-fallback to FAISS if Typesense connection fails at startup.  
**Consequence:** Zero downtime risk. Can hot-swap backends by changing one env var and restarting.

---

## Decision 4: Gemini Flash for brand/query enrichment

**Date:** 2026-02-28  
**Status:** Approved  
**Context:** No search engine can resolve "Dilmah → tea" because it's a knowledge gap, not a retrieval gap. The embedding model has zero knowledge of brand names. Static synonym dictionaries can't keep up.  
**Decision:** Use Google Gemini Flash (`gemini-2.0-flash`) as an enrichment layer:
1. On low-confidence search results, call Gemini to resolve the unknown term
2. "Dilmah" → Gemini responds "Dilmah is a Sri Lankan tea brand. Keywords: tea, black tea, Ceylon tea"
3. Cache the result permanently as a Typesense synonym: Dilmah → tea
4. Never call the API again for the same term  
**Alternatives rejected:**
- LangChain: Adds complexity for a single API call with caching. No chains needed.
- Static dictionary: Can't scale, can't learn new brands
- Fine-tuning embedding model: 16K docs insufficient, expensive, fragile  
**Cost:** Free tier (15 RPM). Each unknown brand triggers exactly 1 API call ever. After the first occurrence, all future queries use the cached synonym.

---

## Decision 5: Dual-backend architecture with factory pattern

**Date:** 2026-02-28  
**Status:** Approved  
**Context:** Need clean switching between Typesense and FAISS.  
**Decision:** Implement a factory pattern:
- `search_base.py` — ABC with `search()`, `get_hs_code_detail()`, `get_categories()`
- `faiss_search_service.py` — Existing code, implements ABC
- `typesense_search_service.py` — New Typesense implementation
- `search_factory.py` — Reads `SEARCH_BACKEND` env, creates + health-checks the chosen backend
- `enrichment_service.py` — Gemini Flash integration, consumed by Typesense backend  
**Consequence:** Clean separation. Each backend is independently testable. Factory handles fallback logic.

---

## Decision 6: Synonym cache in SQLite

**Date:** 2026-02-28  
**Status:** Approved  
**Context:** Gemini enrichment results need permanent caching to avoid repeated API calls.  
**Decision:** New `synonym_cache` table in existing SQLite DB:
- `id`, `source_term`, `resolved_keywords`, `provider` (gemini/admin), `created_at`
- On startup, load all cached synonyms into Typesense synonyms API
- Admin can CRUD synonyms via REST endpoints
- Gemini results auto-inserted here  
**Consequence:** Single source of truth for synonyms. Survives Typesense restarts. Admin has full control.

---

## Decision 7: Typesense hybrid search configuration

**Date:** 2026-02-28  
**Status:** Approved  
**Context:** Typesense supports tuning the keyword vs. semantic balance.  
**Decision:**
- Collection schema: `hscode` (string, facet), `description` (string, index), `section` (string, facet), `level` (int32, facet), `parent` (string), `embedding` (auto, model: `ts/all-MiniLM-L12-v2`, source: `description`)
- Search: `query_by: "description,embedding"`, default alpha=0.7 (70% keyword, 30% semantic)
- Typo tolerance: enabled, `num_typos: 1` (conservative, not 2)
- Drop tokens threshold: 1 (allow dropping 1 token for partial matches)  
**Consequence:** BM25 handles exact keyword matches well. Semantic handles paraphrases. Conservative typo tolerance prevents brand name mangling.

---

## Implementation Order

1. ✅ Create DECISION_LOG.md
2. Rename `search_service.py` → `faiss_search_service.py`
3. Create `search_base.py` (ABC interface)
4. Create `search_factory.py` (backend selector + fallback)
5. Install Typesense server + Python SDK + google-generativeai
6. Create `index_typesense.py` (collection creation + data import)
7. Create `typesense_search_service.py`
8. Create `enrichment_service.py` (Gemini Flash)
9. Add `SynonymCache` model + admin synonym routes
10. Wire factory into FastAPI routes + update config
11. Update Flutter UI (did-you-mean suggestions, enrichment info)
