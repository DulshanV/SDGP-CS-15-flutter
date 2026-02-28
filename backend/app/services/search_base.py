"""
Abstract base class for search service backends.
All search implementations (FAISS, Typesense, etc.) must implement this interface.
"""

from abc import ABC, abstractmethod
from typing import List, Optional


class BaseSearchService(ABC):
    """Common interface for all search backends."""

    @abstractmethod
    def initialize(self) -> None:
        """Load indexes, models, and any resources needed. Call once at startup."""
        ...

    @abstractmethod
    def search(self, query: str, top_k: int = 10) -> dict:
        """
        Execute a hybrid search.

        Returns:
            {
                "query": str,               # original query
                "corrected_query": str|None, # suggestion (never auto-applied)
                "enrichment_info": str|None, # e.g. "Dilmah is a Sri Lankan tea brand"
                "total_results": int,
                "results": [
                    {
                        "hscode": str,
                        "description": str,
                        "section": str,
                        "level": int,
                        "parent": str|None,
                        "relevance_pct": float,
                        "hierarchy_path": list[str],
                    },
                    ...
                ]
            }
        """
        ...

    @abstractmethod
    def get_hs_code_detail(self, hscode: str) -> Optional[dict]:
        """Get detailed info for a specific HS code, including children and hierarchy."""
        ...

    @abstractmethod
    def get_categories(self) -> List[dict]:
        """Get all HS code sections and their chapter headings for browsing."""
        ...

    @property
    def is_initialized(self) -> bool:
        """Whether the service has been successfully initialized."""
        return getattr(self, "_initialized", False)
