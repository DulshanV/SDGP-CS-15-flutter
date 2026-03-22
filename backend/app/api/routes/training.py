"""
Training data & feedback loop admin routes.

Endpoints:
  GET    /api/v1/admin/training/stats       – search stats + training pair counts
  GET    /api/v1/admin/training/pairs       – list training pairs (filterable)
  POST   /api/v1/admin/training/pairs       – manually add a training pair
  PATCH  /api/v1/admin/training/pairs/{id}  – approve / reject a pair
  DELETE /api/v1/admin/training/pairs/{id}  – delete a pair
  GET    /api/v1/admin/training/logs        – recent search logs
  GET    /api/v1/admin/training/feedback    – get feedback mode status
  PUT    /api/v1/admin/training/feedback    – toggle feedback collection on/off
  POST   /api/v1/admin/training/export      – export pairs as JSON for fine-tuning
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import require_auth
from app.core.config import settings
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/v1/admin/training", tags=["admin-training"])


# ── Dependency: require admin ────────────────────────────────────────────────

async def _require_admin(
    token_data: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
) -> User:
    result = await db.execute(
        select(User).where(User.firebase_uid == token_data["uid"])
    )
    user = result.scalar_one_or_none()
    if not user or user.role != UserRole.admin.value:
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


# ── Schemas ──────────────────────────────────────────────────────────────────

class TrainingPairOut(BaseModel):
    id: int
    query: str
    positive_description: str
    positive_hscode: Optional[str]
    source: str
    quality_score: float
    approved: bool
    created_at: Optional[str]


class TrainingPairCreate(BaseModel):
    query: str
    description: str
    hscode: Optional[str] = ""


class TrainingPairUpdate(BaseModel):
    approved: bool


class SearchLogOut(BaseModel):
    id: int
    query: str
    corrected_query: Optional[str]
    enrichment_used: bool
    enrichment_keywords: Optional[str]
    top_hscode: Optional[str]
    top_description: Optional[str]
    top_score: Optional[float]
    result_count: int
    created_at: Optional[str]


class FeedbackStatus(BaseModel):
    enabled: bool


class FeedbackToggle(BaseModel):
    enabled: bool


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_collector():
    """Get the training collector singleton, initialized."""
    from app.services.training_collector import training_collector
    if not training_collector._initialized:
        training_collector.initialize()
    return training_collector


def _get_db_conn():
    """Get a raw SQLite connection for direct queries."""
    import os, sqlite3
    db_url = settings.database_url.replace("sqlite+aiosqlite:///", "")
    db_path = os.path.abspath(db_url)
    return sqlite3.connect(db_path)


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_training_stats(admin: User = Depends(_require_admin)):
    """Get search log statistics and training pair counts."""
    collector = _get_collector()
    return collector.get_search_stats()


@router.get("/pairs", response_model=List[TrainingPairOut])
async def list_training_pairs(
    approved_only: bool = Query(False, description="Show only approved pairs"),
    min_quality: float = Query(0.0, ge=0.0, le=1.0),
    source: Optional[str] = Query(None, description="Filter by source: enrichment, high_confidence, manual"),
    search: Optional[str] = Query(None, description="Search query or description text"),
    limit: int = Query(100, ge=1, le=1000),
    admin: User = Depends(_require_admin),
):
    """List training pairs with optional filters."""
    import asyncio
    
    def _fetch_pairs():
        conn = _get_db_conn()
        try:
            conditions = ["quality_score >= ?"]
            params: list = [min_quality]

            if approved_only:
                conditions.append("approved = 1")
            if source:
                conditions.append("source = ?")
                params.append(source)
            if search:
                conditions.append("(LOWER(query) LIKE ? OR LOWER(positive_description) LIKE ?)")
                term = f"%{search.lower()}%"
                params.extend([term, term])

            where = " AND ".join(conditions)
            params.append(limit)
            cursor = conn.execute(
                f"""
                SELECT id, query, positive_description, positive_hscode,
                       source, quality_score, approved, created_at
                FROM training_pairs
                WHERE {where}
                ORDER BY created_at DESC
                LIMIT ?
                """,
                params,
            )
            rows = cursor.fetchall()
            return [
                TrainingPairOut(
                    id=r[0],
                    query=r[1],
                    positive_description=r[2],
                    positive_hscode=r[3],
                    source=r[4],
                    quality_score=r[5],
                    approved=bool(r[6]),
                    created_at=r[7],
                )
                for r in rows
            ]
        finally:
            conn.close()

    return await asyncio.to_thread(_fetch_pairs)


@router.post("/pairs", response_model=dict)
async def create_training_pair(
    body: TrainingPairCreate,
    admin: User = Depends(_require_admin),
):
    """Manually add a training pair (admin-curated)."""
    collector = _get_collector()
    ok = collector.add_manual_pair(body.query, body.description, body.hscode or "")
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to create training pair.")
    return {"message": "Training pair created", "query": body.query}


@router.patch("/pairs/{pair_id}", response_model=dict)
async def update_training_pair(
    pair_id: int,
    body: TrainingPairUpdate,
    admin: User = Depends(_require_admin),
):
    """Approve or reject a training pair."""
    collector = _get_collector()
    ok = collector.approve_pair(pair_id, body.approved)
    if not ok:
        raise HTTPException(status_code=404, detail="Training pair not found.")
    return {"message": f"Training pair {'approved' if body.approved else 'rejected'}"}


@router.delete("/pairs/{pair_id}", response_model=dict)
async def delete_training_pair(
    pair_id: int,
    admin: User = Depends(_require_admin),
):
    """Permanently delete a training pair."""
    conn = _get_db_conn()
    try:
        conn.execute("DELETE FROM training_pairs WHERE id = ?", (pair_id,))
        conn.commit()
        return {"message": "Training pair deleted"}
    finally:
        conn.close()


@router.get("/logs", response_model=List[SearchLogOut])
async def get_search_logs(
    limit: int = Query(50, ge=1, le=500),
    enrichment_only: bool = Query(False, description="Only show enrichment searches"),
    search: Optional[str] = Query(None, description="Search within logged queries"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum top score"),
    admin: User = Depends(_require_admin),
):
    """Get recent search log entries with optional filters."""
    conn = _get_db_conn()
    try:
        conditions: list[str] = []
        params: list = []

        if enrichment_only:
            conditions.append("enrichment_used = 1")
        if search:
            conditions.append("LOWER(query) LIKE ?")
            params.append(f"%{search.lower()}%")
        if min_score is not None:
            conditions.append("top_score >= ?")
            params.append(min_score)

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        params.append(limit)
        cursor = conn.execute(
            f"""
            SELECT id, query, corrected_query, enrichment_used,
                   enrichment_keywords, top_hscode, top_description,
                   top_score, result_count, created_at
            FROM search_log
            {where}
            ORDER BY id DESC LIMIT ?
            """,
            params,
        )
        rows = cursor.fetchall()
        return [
            SearchLogOut(
                id=r[0],
                query=r[1],
                corrected_query=r[2],
                enrichment_used=bool(r[3]),
                enrichment_keywords=r[4],
                top_hscode=r[5],
                top_description=r[6],
                top_score=r[7],
                result_count=r[8],
                created_at=r[9],
            )
            for r in rows
        ]
    finally:
        conn.close()


@router.get("/feedback", response_model=FeedbackStatus)
async def get_feedback_status(admin: User = Depends(_require_admin)):
    """Check if feedback/training data collection is enabled."""
    from app.services.search_factory import search_service
    enabled = getattr(search_service, '_training_collector', None) is not None
    return FeedbackStatus(enabled=enabled)


@router.put("/feedback", response_model=FeedbackStatus)
async def toggle_feedback(
    body: FeedbackToggle,
    admin: User = Depends(_require_admin),
):
    """
    Enable or disable the training data feedback loop.
    When disabled, searches will no longer be logged.
    When re-enabled, collection resumes.
    """
    from app.services.search_factory import search_service

    if body.enabled:
        # Re-enable: initialize collector and attach to search service
        from app.services.training_collector import training_collector
        training_collector.initialize()
        search_service._training_collector = training_collector
    else:
        # Disable: detach collector from search service
        search_service._training_collector = None

    enabled = getattr(search_service, '_training_collector', None) is not None
    return FeedbackStatus(enabled=enabled)


@router.post("/export", response_model=dict)
async def export_training_data(
    min_quality: float = Query(0.5, ge=0.0, le=1.0),
    approved_only: bool = Query(True),
    admin: User = Depends(_require_admin),
):
    """Export training pairs as JSON (for fine-tuning scripts)."""
    collector = _get_collector()
    pairs = collector.get_training_pairs(
        approved_only=approved_only,
        min_quality=min_quality,
    )
    return {
        "total_pairs": len(pairs),
        "min_quality": min_quality,
        "approved_only": approved_only,
        "pairs": pairs,
    }
