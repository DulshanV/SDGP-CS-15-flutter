"""
Script to seed featured categories into the database.
Run this after creating the database tables.

Usage:
    python -m scripts.seed_categories
"""

import asyncio
from app.core.database import AsyncSessionLocal
from app.models.categories import FeaturedCategory


# Default featured categories
DEFAULT_CATEGORIES = [
    {
        "name": "Spices",
        "description": "Aromatic spices and seasonings",
        "icon_code_point": "0xf0e6",
        "order": 0,
    },
    {
        "name": "Apparel",
        "description": "Clothing and textile products",
        "icon_code_point": "0xe4af",
        "order": 1,
    },
    {
        "name": "Stationery",
        "description": "Paper and writing supplies",
        "icon_code_point": "0xe3c9",
        "order": 2,
    },
    {
        "name": "Minerals",
        "description": "Raw minerals and ores",
        "icon_code_point": "0xebe7",
        "order": 3,
    },
    {
        "name": "Animal",
        "description": "Animal products and derivatives",
        "icon_code_point": "0xea56",
        "order": 4,
    },
    {
        "name": "Cosmetics",
        "description": "Beauty and personal care",
        "icon_code_point": "0xealb",
        "order": 5,
    },
]


async def seed_categories():
    """Seed the database with default featured categories."""
    async with AsyncSessionLocal() as session:
        try:
            # Check if categories already exist
            from sqlalchemy import select
            result = await session.execute(select(FeaturedCategory))
            existing = result.scalars().all()

            if existing:
                print(f"✓ Categories already exist ({len(existing)} found). Skipping seed.")
                return

            # Add default categories
            for cat_data in DEFAULT_CATEGORIES:
                category = FeaturedCategory(**cat_data)
                session.add(category)

            await session.commit()
            print(f"✓ Successfully seeded {len(DEFAULT_CATEGORIES)} featured categories")

        except Exception as e:
            print(f"✗ Error seeding categories: {e}")
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(seed_categories())
