"""
Search backend factory.

Reads SEARCH_BACKEND env var and instantiates the appropriate service.
Supports automatic fallback from Typesense → FAISS on connection failure.
"""

import logging
from app.core.config import settings
from app.services.search_base import BaseSearchService

logger = logging.getLogger(__name__)


def _create_typesense_backend() -> BaseSearchService:
    """Attempt to create and initialize the Typesense search backend."""
    from app.services.typesense_search_service import TypesenseSearchService

    svc = TypesenseSearchService()
    svc.initialize()
    return svc


def _create_faiss_backend() -> BaseSearchService:
    """Create and initialize the FAISS fallback search backend."""
    from app.services.faiss_search_service import FaissSearchService

    svc = FaissSearchService()
    svc.initialize()
    return svc


def create_search_service() -> BaseSearchService:
    """
    Factory: build the search backend selected by SEARCH_BACKEND env var.

    - "typesense" → try Typesense, auto-fallback to FAISS on failure
    - "faiss"     → use FAISS directly (original behaviour)
    """
    backend = getattr(settings, "search_backend", "faiss").lower().strip()
    logger.info(f"Requested search backend: {backend}")

    if backend == "typesense":
        try:
            svc = _create_typesense_backend()
            logger.info("Typesense search backend initialised successfully")
            return svc
        except Exception as exc:
            logger.warning(
                f"Typesense backend failed to initialise: {exc}. "
                "Falling back to FAISS."
            )
            svc = _create_faiss_backend()
            logger.info("FAISS fallback search backend initialised successfully")
            return svc

    # Default: FAISS
    svc = _create_faiss_backend()
    logger.info("FAISS search backend initialised successfully")
    return svc


# ── Module-level singleton ──
# Lazy: created on first import of `search_service` from this module.
search_service: BaseSearchService | None = None


def get_search_service() -> BaseSearchService:
    """Return (or create) the global search service singleton."""
    global search_service
    if search_service is None:
        search_service = create_search_service()
    return search_service
