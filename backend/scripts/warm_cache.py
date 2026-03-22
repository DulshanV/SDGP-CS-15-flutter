"""
Cache warming script – pre-populate synonym_cache with common brand names.

Usage:
    cd backend
    python -m scripts.warm_cache

This script calls the enrichment service for each brand name, which:
1. Checks if already cached (skips if so – safe to re-run)
2. Calls the LLM provider cascade (Groq → Gemini → Cohere) for uncached terms
3. Stores the result (brand → HS keywords) in synonym_cache permanently

Run this once after deployment, or whenever you add new brands to the list.
Respects Groq's 30 RPM free tier – adds a 2.5s delay between LLM calls.

Note: Each brand costs ONE LLM call the first time. After that it's cached forever.
"""

import sys
import os
import time
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.enrichment_service import enrichment_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")
logger = logging.getLogger(__name__)

# ── Common global brands organized by product category ──────────────────────
# These are the brands most likely to be searched by customs officers / importers.
# Add more as needed – the script is idempotent (skips already-cached terms).

COMMON_BRANDS = [
    # ── Automobiles & Motorcycles ──
    "Toyota Corolla",
    "Toyota Hilux",
    "Toyota Land Cruiser",
    "Toyota Prius",
    "Honda Civic",
    "Honda CR-V",
    "Nissan Patrol",
    "Nissan Navara",
    "Mitsubishi Lancer",
    "Mitsubishi Pajero",
    "Suzuki Swift",
    "Suzuki Alto",
    "Mercedes Benz C Class",
    "Mercedes Benz S Class",
    "BMW 3 Series",
    "BMW X5",
    "Audi A4",
    "Rolls Royce Phantom",
    "Rolls Royce Ghost",
    "Bentley Continental",
    "Range Rover Evoque",
    "Land Rover Defender",
    "Porsche Cayenne",
    "Lamborghini Urus",
    "Ferrari 488",
    "Volkswagen Golf",
    "Ford Ranger",
    "Chevrolet Silverado",
    "Hyundai Tucson",
    "Kia Sportage",
    "Yamaha motorcycle",
    "Honda motorcycle",
    "Kawasaki motorcycle",
    "Bajaj motorcycle",
    "Vespa scooter",

    # ── Consumer Electronics ──
    "Samsung Galaxy phone",
    "iPhone",
    "Apple MacBook",
    "Apple iPad",
    "Apple AirPods",
    "Sony PlayStation",
    "Microsoft Xbox",
    "Nintendo Switch",
    "Dell laptop",
    "HP laptop",
    "Lenovo ThinkPad",
    "Canon camera",
    "Nikon camera",
    "GoPro camera",
    "Sony headphones",
    "JBL speaker",
    "Bose headphones",
    "LG television",
    "Samsung television",
    "Huawei phone",
    "Google Pixel phone",
    "Dyson vacuum cleaner",
    "Dyson hair dryer",
    "Xiaomi phone",

    # ── Food & Beverages ──
    "Oreo",
    "Coca Cola",
    "Pepsi",
    "Red Bull",
    "Monster Energy",
    "Nescafe",
    "Nespresso",
    "Dilmah tea",
    "Lipton tea",
    "Twinings tea",
    "Nutella",
    "Ferrero Rocher",
    "Toblerone",
    "Cadbury chocolate",
    "Mars chocolate",
    "Snickers",
    "Pringles",
    "Doritos",
    "Kelloggs cereal",
    "Heinz ketchup",
    "Tabasco sauce",
    "Vegemite",
    "Marmite",
    "Jack Daniels whiskey",
    "Johnnie Walker whisky",
    "Hennessy cognac",
    "Moet Chandon champagne",
    "Absolut vodka",
    "Budweiser beer",
    "Heineken beer",
    "Corona beer",

    # ── Clothing & Footwear ──
    "Nike Air Max",
    "Nike Air Jordan",
    "Adidas Ultraboost",
    "Adidas Yeezy",
    "Puma sneakers",
    "New Balance shoes",
    "Converse All Star",
    "Timberland boots",
    "Levi's jeans",
    "Zara clothing",
    "H&M clothing",
    "Uniqlo clothing",
    "North Face jacket",
    "Columbia jacket",
    "Under Armour sportswear",
    "Gucci handbag",
    "Louis Vuitton handbag",
    "Hermes Birkin bag",
    "Chanel handbag",
    "Prada bag",
    "Ray-Ban sunglasses",
    "Oakley sunglasses",
    "Rolex watch",
    "Omega watch",
    "Casio watch",
    "Seiko watch",
    "Cartier watch",

    # ── Cosmetics & Personal Care ──
    "Dove soap",
    "Nivea cream",
    "L'Oreal shampoo",
    "Pantene shampoo",
    "Gillette razor",
    "Colgate toothpaste",
    "Dettol antiseptic",
    "Johnson & Johnson baby powder",
    "Vaseline petroleum jelly",
    "Chanel perfume",
    "Dior perfume",
    "Calvin Klein perfume",

    # ── Home Appliances ──
    "Samsung refrigerator",
    "LG washing machine",
    "Whirlpool dishwasher",
    "Bosch oven",
    "Philips blender",
    "KitchenAid mixer",
    "De'Longhi coffee machine",
    "Breville toaster",
    "Roomba robot vacuum",

    # ── Medical & Pharmaceutical ──
    "Panadol",
    "Tylenol",
    "Paracetamol tablets",
    "Ibuprofen capsules",
    "Ventolin inhaler",
    "Insulin pen",
    "N95 mask",
    "Medtronic pacemaker",

    # ── Building & Industrial ──
    "Caterpillar excavator",
    "John Deere tractor",
    "Kubota tractor",
    "Makita power drill",
    "DeWalt power tools",
    "Bosch power tools",
    "3M tape",
    "Fischer anchor bolts",

    # ── Agriculture & Raw Materials ──
    "Ceylon cinnamon",
    "Arabica coffee beans",
    "Robusta coffee beans",
    "Thai jasmine rice",
    "Basmati rice",
    "Palm oil",
    "Coconut oil",
    "Olive oil extra virgin",

    # ── Toys & Sports ──
    "LEGO",
    "Barbie doll",
    "Hot Wheels",
    "Hasbro Monopoly",
    "Wilson tennis racket",
    "Spalding basketball",
    "Callaway golf clubs",
    "Yonex badminton racket",

    # ── Cigarettes & Tobacco ──
    "Marlboro cigarettes",
    "Dunhill cigarettes",
    "Lucky Strike cigarettes",
    "Vape pen",
    "IQOS tobacco",

    # ── Pet Food ──
    "Pedigree dog food",
    "Whiskas cat food",
    "Royal Canin pet food",

    # ── Stationery & Office ──
    "Pilot pen",
    "Parker pen",
    "Post-it notes",
    "Scotch tape",
]


def main():
    """Warm up the synonym cache with common brand names."""
    enrichment_service.initialize()

    total = len(COMMON_BRANDS)
    cached = 0
    resolved = 0
    failed = 0

    logger.info(f"Starting cache warming with {total} brand terms...")
    logger.info(f"Already cached: {len(enrichment_service._cache)} entries")

    for i, brand in enumerate(COMMON_BRANDS, 1):
        brand_lower = brand.strip().lower()

        # Skip if already cached
        if brand_lower in enrichment_service._cache:
            cached_entry = enrichment_service._cache[brand_lower]
            if cached_entry and cached_entry.get("keywords"):
                logger.info(f"[{i}/{total}] CACHED: '{brand}' → {cached_entry['keywords']}")
                cached += 1
                continue

        # Call enrichment (this will hit LLM and cache result)
        logger.info(f"[{i}/{total}] Resolving: '{brand}'...")
        try:
            result = enrichment_service.resolve_query(brand)
            if result and result.get("keywords"):
                logger.info(f"  ✓ Resolved: '{brand}' → {result['keywords']}")
                resolved += 1
            else:
                logger.warning(f"  ✗ No result for '{brand}'")
                failed += 1
        except Exception as e:
            logger.error(f"  ✗ Error for '{brand}': {e}")
            failed += 1

        # Rate limit: 2.5s delay between LLM calls (Groq = 30 RPM)
        time.sleep(2.5)

    logger.info(f"\n{'='*60}")
    logger.info(f"Cache warming complete!")
    logger.info(f"  Already cached:  {cached}")
    logger.info(f"  Newly resolved:  {resolved}")
    logger.info(f"  Failed:          {failed}")
    logger.info(f"  Total in cache:  {len(enrichment_service._cache)}")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    main()
