"""
Pricing and subscription endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User, SubscriptionTier
from app.models.schemas import (
    UserSubscriptionResponse,
    SubscriptionUpgradeRequest,
    SubscriptionUpgradeResponse,
    PricingPlanResponse,
    PricingPlansListResponse,
)

router = APIRouter(prefix="/api/v1/pricing", tags=["pricing"])


# Pricing tier definitions
PRICING_TIERS = {
    "starter": {
        "display_name": "Starter",
        "price": 3.0,
        "description": "For individuals",
        "features": [
            "Up to 100 searches/month",
            "Basic HS code lookup",
            "Search history (7 days)",
            "Email support",
        ],
        "is_popular": False,
    },
    "business": {
        "display_name": "Business",
        "price": 5.0,
        "description": "For small teams",
        "features": [
            "Up to 500 searches/month",
            "Advanced HS code lookup",
            "Search history (30 days)",
            "Favorites & collections",
            "Priority email support",
            "API access (limited)",
        ],
        "is_popular": True,
    },
    "enterprise": {
        "display_name": "Enterprise",
        "price": 9.0,
        "description": "For enterprises",
        "features": [
            "Unlimited searches",
            "All features included",
            "Search history (unlimited)",
            "Favorites & collections",
            "24/7 phone & email support",
            "Full API access",
            "Custom integrations",
            "Dedicated account manager",
        ],
        "is_popular": False,
    },
}


@router.get("/plans", response_model=PricingPlansListResponse)
async def get_pricing_plans():
    """Get all available pricing plans."""
    plans = [
        PricingPlanResponse(
            tier=tier,
            display_name=details["display_name"],
            price=details["price"],
            description=details["description"],
            features=details["features"],
            is_popular=details["is_popular"],
        )
        for tier, details in PRICING_TIERS.items()
    ]
    return PricingPlansListResponse(plans=plans)


@router.get("/subscription/{user_id}", response_model=UserSubscriptionResponse)
async def get_user_subscription(
    user_id: str,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's subscription details."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserSubscriptionResponse(
        user_id=user.id,
        current_tier=user.subscription_tier,
        subscription_start_date=user.subscription_start_date,
        subscription_end_date=user.subscription_end_date,
        is_active=user.is_subscription_active,
    )


@router.post("/subscription/{user_id}/upgrade", response_model=SubscriptionUpgradeResponse)
async def upgrade_subscription(
    user_id: str,
    request: SubscriptionUpgradeRequest,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upgrade user's subscription tier."""
    # Validate tier
    if request.tier.lower() not in PRICING_TIERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier. Must be one of: {', '.join(PRICING_TIERS.keys())}",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    previous_tier = user.subscription_tier
    new_tier = request.tier.lower()
    now = datetime.now(timezone.utc)

    # Update subscription
    user.subscription_tier = new_tier
    user.subscription_start_date = now
    # Set subscription end date to 1 month from now
    user.subscription_end_date = now + timedelta(days=30)
    user.is_subscription_active = True
    user.updated_at = now

    await db.commit()
    await db.refresh(user)

    return SubscriptionUpgradeResponse(
        user_id=user.id,
        previous_tier=previous_tier,
        new_tier=new_tier,
        subscription_start_date=user.subscription_start_date,
        subscription_end_date=user.subscription_end_date,
        message=f"Successfully upgraded from {previous_tier} to {new_tier}",
    )


@router.post("/subscription/{user_id}/downgrade", response_model=SubscriptionUpgradeResponse)
async def downgrade_subscription(
    user_id: str,
    request: SubscriptionUpgradeRequest,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Downgrade user's subscription tier."""
    # Validate tier
    if request.tier.lower() not in PRICING_TIERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier. Must be one of: {', '.join(PRICING_TIERS.keys())}",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    previous_tier = user.subscription_tier
    new_tier = request.tier.lower()
    now = datetime.now(timezone.utc)

    # Update subscription
    user.subscription_tier = new_tier
    user.subscription_start_date = now
    # Set subscription end date to 1 month from now
    user.subscription_end_date = now + timedelta(days=30)
    user.is_subscription_active = True
    user.updated_at = now

    await db.commit()
    await db.refresh(user)

    return SubscriptionUpgradeResponse(
        user_id=user.id,
        previous_tier=previous_tier,
        new_tier=new_tier,
        subscription_start_date=user.subscription_start_date,
        subscription_end_date=user.subscription_end_date,
        message=f"Successfully downgraded from {previous_tier} to {new_tier}",
    )
