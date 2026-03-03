"""
Featured categories endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.categories import FeaturedCategory as FeaturedCategoryModel
from app.models.schemas import (
    FeaturedCategoryResponse,
    FeaturedCategoriesListResponse,
    FeaturedCategoryCreateRequest,
    FeaturedCategoryUpdateRequest,
)

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("/featured", response_model=FeaturedCategoriesListResponse)
async def get_featured_categories(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """Get all active featured categories, ordered by order field."""
    result = await db.execute(
        select(FeaturedCategoryModel)
        .where(FeaturedCategoryModel.is_active == True)
        .order_by(FeaturedCategoryModel.order)
        .offset(skip)
        .limit(limit)
    )
    categories = result.scalars().all()

    # Get total count
    total_result = await db.execute(
        select(func.count(FeaturedCategoryModel.id)).where(
            FeaturedCategoryModel.is_active == True
        )
    )
    total = total_result.scalar() or 0

    return FeaturedCategoriesListResponse(
        categories=[FeaturedCategoryResponse.model_validate(cat) for cat in categories],
        total=total,
    )


@router.get("/{category_id}", response_model=FeaturedCategoryResponse)
async def get_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific featured category by ID."""
    result = await db.execute(
        select(FeaturedCategoryModel).where(FeaturedCategoryModel.id == category_id)
    )
    category = result.scalars().first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return FeaturedCategoryResponse.model_validate(category)


@router.get("/name/{category_name}", response_model=FeaturedCategoryResponse)
async def get_category_by_name(
    category_name: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific featured category by name."""
    result = await db.execute(
        select(FeaturedCategoryModel).where(
            and_(
                FeaturedCategoryModel.name.ilike(category_name),
                FeaturedCategoryModel.is_active == True,
            )
        )
    )
    category = result.scalars().first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{category_name}' not found",
        )

    return FeaturedCategoryResponse.model_validate(category)


@router.post("/", response_model=FeaturedCategoryResponse)
async def create_category(
    request: FeaturedCategoryCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new featured category (admin only)."""
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    # Check if category with same name already exists
    existing = await db.execute(
        select(FeaturedCategoryModel).where(
            FeaturedCategoryModel.name.ilike(request.name)
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{request.name}' already exists",
        )

    # Create new category
    category = FeaturedCategoryModel(
        name=request.name,
        description=request.description,
        icon_code_point=request.icon_code_point,
        order=request.order,
        is_active=request.is_active,
    )

    db.add(category)
    await db.commit()
    await db.refresh(category)

    return FeaturedCategoryResponse.model_validate(category)


@router.patch("/{category_id}", response_model=FeaturedCategoryResponse)
async def update_category(
    category_id: str,
    request: FeaturedCategoryUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a featured category (admin only)."""
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    result = await db.execute(
        select(FeaturedCategoryModel).where(FeaturedCategoryModel.id == category_id)
    )
    category = result.scalars().first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # Check if new name conflicts with existing category
    if request.name and request.name != category.name:
        existing = await db.execute(
            select(FeaturedCategoryModel).where(
                FeaturedCategoryModel.name.ilike(request.name)
            )
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{request.name}' already exists",
            )

    # Update fields
    if request.name is not None:
        category.name = request.name
    if request.description is not None:
        category.description = request.description
    if request.icon_code_point is not None:
        category.icon_code_point = request.icon_code_point
    if request.order is not None:
        category.order = request.order
    if request.is_active is not None:
        category.is_active = request.is_active

    await db.commit()
    await db.refresh(category)

    return FeaturedCategoryResponse.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a featured category (admin only)."""
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    result = await db.execute(
        select(FeaturedCategoryModel).where(FeaturedCategoryModel.id == category_id)
    )
    category = result.scalars().first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    await db.delete(category)
    await db.commit()
