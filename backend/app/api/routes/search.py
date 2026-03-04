"""
Search API routes.
Public endpoints (no auth required for search).
"""

from fastapi import APIRouter, Query, Request, HTTPException
from app.services.search_factory import get_search_service
from app.models.schemas import SearchResponse, SearchResult, HSCodeDetail, CategorySummary
from app.core.config import settings
from app.core.limiter import limiter

router = APIRouter(prefix="/api/v1", tags=["search"])


@router.get("/search", response_model=SearchResponse)
@limiter.limit(settings.rate_limit_search)
async def search_hs_codes(
    request: Request,
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results to return"),
):
    """
    Search HS codes using hybrid semantic + fuzzy matching.
    
    - Handles natural language queries: "Samsung S24 Ultra", "laptop computer"
    - Handles HS code lookups: "8517", "0101.21"
    - Typo tolerant: "Samung S24 Ulrta" → corrected and matched
    - Returns results ranked by relevance percentage
    """
    import asyncio
    search_svc = get_search_service()
    result = await asyncio.to_thread(search_svc.search, query=q, top_k=limit)

    return SearchResponse(
        query=result["query"],
        corrected_query=result["corrected_query"],
        enrichment_info=result.get("enrichment_info"),
        total_results=result["total_results"],
        results=[
            SearchResult(
                hscode=r["hscode"],
                description=r["description"],
                section=r["section"],
                level=r["level"],
                parent=r.get("parent"),
                relevance_pct=r["relevance_pct"],
                hierarchy_path=r.get("hierarchy_path", []),
            )
            for r in result["results"]
        ],
    )


@router.get("/hs/{hscode}", response_model=HSCodeDetail)
async def get_hs_code(hscode: str):
    """Get detailed info for a specific HS code, including children and hierarchy."""
    import asyncio
    search_svc = get_search_service()
    detail = await asyncio.to_thread(search_svc.get_hs_code_detail, hscode)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"HS code '{hscode}' not found.")
    return detail


@router.get("/categories", response_model=list[CategorySummary])
async def get_categories():
    """Get all HS code sections and their chapter headings for browsing."""
    import asyncio
    search_svc = get_search_service()
    return await asyncio.to_thread(search_svc.get_categories)
