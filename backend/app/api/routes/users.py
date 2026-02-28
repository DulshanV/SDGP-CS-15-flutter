"""
User API routes.
Authenticated endpoints for user profile, search history, and favorites.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from app.core.database import get_db
from app.core.auth import require_auth
from app.models.user import User, SearchHistory, Favorite
from app.models.schemas import (
    UserSync,
    UserResponse,
    SearchHistoryItem,
    SearchHistoryResponse,
    FavoriteCreate,
    FavoriteResponse,
    FavoriteListResponse,
)

router = APIRouter(prefix="/api/v1/users", tags=["users"])



async def _get_or_create_user(db: AsyncSession, firebase_uid: str, token_data: dict | None = None) -> User:
    """Get user by Firebase UID, auto-creating from token_data if not found."""
    result = await db.execute(
        select(User).where(User.firebase_uid == firebase_uid)
    )
    user = result.scalar_one_or_none()
    if user is None:
        if token_data is None:
            raise HTTPException(status_code=404, detail="User not found. Call /sync first.")
        # Auto-create from Firebase token
        user = User(
            firebase_uid=firebase_uid,
            email=token_data.get("email", f"{firebase_uid}@unknown.local"),
            display_name=token_data.get("name") or token_data.get("display_name"),
            photo_url=token_data.get("picture") or token_data.get("photo_url"),
        )
        db.add(user)
        await db.flush()
    return user



@router.post("/sync", response_model=UserResponse)
async def sync_user(
    data: UserSync,
    token_data: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """
    Sync Firebase user to PostgreSQL after login.
    Creates a new user or updates existing.
    Called by the Flutter app after Firebase authentication.
    """
    result = await db.execute(
        select(User).where(User.firebase_uid == data.firebase_uid)
    )
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            firebase_uid=data.firebase_uid,
            email=data.email,
            display_name=data.display_name,
            photo_url=data.photo_url,
        )
        db.add(user)
        await db.flush()
    else:
        user.email = data.email
        if data.display_name:
            user.display_name = data.display_name
        if data.photo_url:
            user.photo_url = data.photo_url
        await db.flush()

    return user


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token_data: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get the current authenticated user's profile."""
    return await _get_or_create_user(db, token_data["uid"], token_data)


# ── Search History ──


@router.get("/me/history", response_model=SearchHistoryResponse)
async def get_search_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    token_data: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated search history for the current user."""
    user = await _get_or_create_user(db, token_data["uid"], token_data)

    # Count total
    count_result = await db.execute(
        select(func.count(SearchHistory.id)).where(SearchHistory.user_id == user.id)
    )
    total = count_result.scalar()

    # Fetch page
    offset = (page - 1) * page_size
    result = await db.execute(
        select(SearchHistory)
        .where(SearchHistory.user_id == user.id)
        .order_by(SearchHistory.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = result.scalars().all()

    return SearchHistoryResponse(
        total=total,
        items=[SearchHistoryItem.model_validate(item) for item in items],
    )


@router.post("/me/history", response_model=SearchHistoryItem)
async def add_search_history(
    query_text: str = Query(..., min_length=1),
    top_result_hscode: str = Query(None),
    top_result_description: str = Query(None),
    results_count: int = Query(0),
    token_data: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Record a search in history. Called by Flutter after displaying results."""
    user = await _get_or_create_user(db, token_data["uid"], token_data)

    entry = SearchHistory(
        user_id=user.id,
        query_text=query_text,
        top_result_hscode=top_result_hscode,
        top_result_description=top_result_description,
        results_count=results_count,
    )
    db.add(entry)
    await db.flush()

    return SearchHistoryItem.model_validate(entry)


@router.delete("/me/history")
async def clear_search_history(
    token_data: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Clear all search history for the current user."""
    user = await _get_or_create_user(db, token_data["uid"], token_data)
    await db.execute(
        delete(SearchHistory).where(SearchHistory.user_id == user.id)
    )
    return {"message": "Search history cleared."}


# ── Favorites ──


@router.get("/me/favorites", response_model=FavoriteListResponse)
async def get_favorites(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    token_data: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated favorites for the current user."""
    user = await _get_or_create_user(db, token_data["uid"], token_data)

    count_result = await db.execute(
        select(func.count(Favorite.id)).where(Favorite.user_id == user.id)
    )
    total = count_result.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(
        select(Favorite)
        .where(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = result.scalars().all()

    return FavoriteListResponse(
        total=total,
        items=[FavoriteResponse.model_validate(item) for item in items],
    )


@router.post("/me/favorites", response_model=FavoriteResponse)
async def add_favorite(
    data: FavoriteCreate,
    token_data: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Add an HS code to favorites."""
    user = await _get_or_create_user(db, token_data["uid"], token_data)

    # Check if already favorited
    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user.id,
            Favorite.hscode == data.hscode,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already in favorites.")

    fav = Favorite(
        user_id=user.id,
        hscode=data.hscode,
        description=data.description,
        section=data.section,
    )
    db.add(fav)
    await db.flush()

    return FavoriteResponse.model_validate(fav)


@router.delete("/me/favorites/{hscode}")
async def remove_favorite(
    hscode: str,
    token_data: dict = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    """Remove an HS code from favorites."""
    user = await _get_or_create_user(db, token_data["uid"], token_data)

    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user.id,
            Favorite.hscode == hscode,
        )
    )
    fav = result.scalar_one_or_none()
    if fav is None:
        raise HTTPException(status_code=404, detail="Favorite not found.")

    await db.delete(fav)
    return {"message": f"Removed {hscode} from favorites."}
