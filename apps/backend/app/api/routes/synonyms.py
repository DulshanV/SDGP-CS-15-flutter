"""
Synonym management admin routes.
CRUD for the synonym cache — admin controlled.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.auth import require_auth
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/v1/admin/synonyms", tags=["admin-synonyms"])


# ── Dependency: require admin ──
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


# ── Schemas ──
class SynonymCreate(BaseModel):
    source_term: str
    keywords: str
    explanation: Optional[str] = ""


class SynonymResponse(BaseModel):
    id: int
    source_term: str
    resolved_keywords: Optional[str]
    explanation: Optional[str]
    provider: Optional[str]
    confidence: Optional[float]
    created_at: Optional[str]


# ── Routes ──

@router.get("", response_model=list[SynonymResponse])
async def list_synonyms(admin: User = Depends(_require_admin)):
    """List all cached synonyms."""
    from app.services.enrichment_service import enrichment_service

    if not enrichment_service._initialized:
        try:
            enrichment_service._init_db()
        except Exception:
            pass

    rows = enrichment_service.get_all_synonyms()
    return [SynonymResponse(**r) for r in rows]


@router.post("", response_model=dict)
async def create_synonym(
    body: SynonymCreate,
    admin: User = Depends(_require_admin),
):
    """Manually create a synonym mapping."""
    from app.services.enrichment_service import enrichment_service

    if not enrichment_service._initialized:
        try:
            enrichment_service._init_db()
        except Exception:
            pass

    result = enrichment_service.add_manual_synonym(
        source_term=body.source_term,
        keywords=body.keywords,
        explanation=body.explanation or "",
    )

    # Also push to Typesense if the Typesense backend is active
    try:
        from app.services.search_factory import search_service
        if search_service and hasattr(search_service, "_create_synonym"):
            search_service._create_synonym(body.source_term, body.keywords)
    except Exception:
        pass

    return {"message": "Synonym created", **result}


@router.delete("/{synonym_id}")
async def delete_synonym(
    synonym_id: int,
    admin: User = Depends(_require_admin),
):
    """Delete a synonym by ID."""
    from app.services.enrichment_service import enrichment_service

    if not enrichment_service._initialized:
        try:
            enrichment_service._init_db()
        except Exception:
            pass

    deleted = enrichment_service.delete_synonym(synonym_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Synonym not found.")
    return {"message": "Synonym deleted"}
