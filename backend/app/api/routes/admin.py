"""
Admin API routes.
Protected endpoints for admin users only.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.core.database import get_db, _is_sqlite
from app.core.auth import require_auth
from app.models.user import User, SearchHistory, UserRole
from app.models.schemas import TrendItem, TrendResponse

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


async def _require_admin_role(
    token_data: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Verify the authenticated user has admin role."""
    result = await db.execute(
        select(User).where(User.firebase_uid == token_data["uid"])
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role != UserRole.admin.value:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


@router.get("/trends", response_model=TrendResponse)
async def get_search_trends(
    days: int = Query(7, ge=1, le=365, description="Lookback period in days"),
    limit: int = Query(20, ge=1, le=100, description="Max trends to return"),
    admin: User = Depends(_require_admin_role),
    db: AsyncSession = Depends(get_db),
):
    """
    Get most searched queries in the past N days.
    Grouped and counted, sorted by frequency.
    """
    if _is_sqlite:
        query = text("""
            SELECT 
                LOWER(TRIM(query_text)) as query_text,
                COUNT(*) as search_count,
                MAX(created_at) as last_searched
            FROM search_history
            WHERE created_at >= datetime('now', :days_interval)
            GROUP BY LOWER(TRIM(query_text))
            ORDER BY search_count DESC
            LIMIT :limit
        """)
        result = await db.execute(
            query,
            {"days_interval": f"-{days} days", "limit": limit},
        )
    else:
        query = text("""
            SELECT 
                LOWER(TRIM(query_text)) as query_text,
                COUNT(*) as search_count,
                MAX(created_at) as last_searched
            FROM search_history
            WHERE created_at >= NOW() - INTERVAL :days_interval
            GROUP BY LOWER(TRIM(query_text))
            ORDER BY search_count DESC
            LIMIT :limit
        """)
        result = await db.execute(
            query,
            {"days_interval": f"{days} days", "limit": limit},
        )
    rows = result.fetchall()

    trends = [
        TrendItem(
            query_text=row.query_text,
            search_count=row.search_count,
            last_searched=row.last_searched,
        )
        for row in rows
    ]

    return TrendResponse(period_days=days, trends=trends)


@router.get("/stats")
async def get_stats(
    admin: User = Depends(_require_admin_role),
    db: AsyncSession = Depends(get_db),
):
    """Get overall platform statistics."""
    # Total users
    user_count = await db.execute(select(func.count(User.id)))
    total_users = user_count.scalar()

    # Total searches
    search_count = await db.execute(select(func.count(SearchHistory.id)))
    total_searches = search_count.scalar()

    # Searches today
    if _is_sqlite:
        today_count = await db.execute(
            text("SELECT COUNT(*) FROM search_history WHERE created_at >= date('now')")
        )
    else:
        today_count = await db.execute(
            text("SELECT COUNT(*) FROM search_history WHERE created_at >= CURRENT_DATE")
        )
    searches_today = today_count.scalar()

    return {
        "total_users": total_users,
        "total_searches": total_searches,
        "searches_today": searches_today,
    }


@router.post("/dataset/upload")
async def upload_dataset(
    file: UploadFile = File(..., description="CSV file with HS codes"),
    admin: User = Depends(_require_admin_role),
):
    """
    Upload a new HS code dataset CSV.
    This will replace the current dataset and trigger re-embedding.
    (Placeholder – full implementation requires background task queue)
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted.")

    # Save the uploaded file
    import os
    from app.core.config import settings

    upload_path = os.path.abspath(settings.dataset_csv_path)
    content = await file.read()

    with open(upload_path, "wb") as f:
        f.write(content)

    return {
        "message": f"Dataset uploaded ({len(content)} bytes). "
        "Run the embedding script to process: python -m scripts.embed_dataset",
        "filename": file.filename,
        "size_bytes": len(content),
    }
