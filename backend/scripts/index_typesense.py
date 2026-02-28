"""
Index the HS codes CSV into a Typesense collection.

Usage:
    cd backend
    python -m scripts.index_typesense

This creates (or recreates) the 'hs_codes' collection in Typesense with:
- BM25 keyword search on 'description'
- Auto-embedding vector search via ts/all-MiniLM-L12-v2
- Facets on section, level, hscode
"""

import sys
import os
import json
import logging
import pandas as pd
import typesense
from typesense.exceptions import ObjectAlreadyExists

# Add parent to path so `app.core.config` works
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

COLLECTION_NAME = settings.typesense_collection

# ── Typesense Collection Schema ──
SCHEMA = {
    "name": COLLECTION_NAME,
    "fields": [
        {"name": "hscode",      "type": "string",  "facet": True},
        {"name": "description", "type": "string"},
        {"name": "section",     "type": "string",  "facet": True},
        {"name": "level",       "type": "int32",   "facet": True},
        {"name": "parent",      "type": "string",  "optional": True},
        # Auto-embedding: Typesense generates vectors from 'description'
        {
            "name": "embedding",
            "type": "float[]",
            "embed": {
                "from": ["description"],
                "model_config": {
                    "model_name": "ts/all-MiniLM-L12-v2",
                },
            },
        },
    ],
    "default_sorting_field": "level",
}


def get_client() -> typesense.Client:
    """Create a Typesense client from settings."""
    return typesense.Client({
        "nodes": [{
            "host": settings.typesense_host,
            "port": str(settings.typesense_port),
            "protocol": settings.typesense_protocol,
        }],
        "api_key": settings.typesense_api_key,
        "connection_timeout_seconds": 600,  # Embedding 500 docs per batch can take minutes
    })


def create_collection(client: typesense.Client, drop_existing: bool = True):
    """Create the hs_codes collection. Drops existing if requested."""
    if drop_existing:
        try:
            client.collections[COLLECTION_NAME].delete()
            logger.info(f"Dropped existing collection '{COLLECTION_NAME}'")
        except Exception:
            pass  # collection didn't exist

    try:
        client.collections.create(SCHEMA)
        logger.info(f"Created collection '{COLLECTION_NAME}' with auto-embedding")
    except ObjectAlreadyExists:
        logger.info(f"Collection '{COLLECTION_NAME}' already exists")


def import_documents(client: typesense.Client, csv_path: str):
    """Import HS code documents from CSV into Typesense."""
    logger.info(f"Reading CSV: {csv_path}")
    df = pd.read_csv(csv_path)
    logger.info(f"Loaded {len(df)} rows")

    # Clean data
    df["description"] = df["description"].fillna("").astype(str).str.strip()
    df["section"] = df["section"].fillna("Unknown").astype(str).str.strip()
    df["hscode"] = df["hscode"].fillna("").astype(str).str.strip()
    df["parent"] = df["parent"].fillna("").astype(str).str.strip()
    df["level"] = pd.to_numeric(df["level"], errors="coerce").fillna(0).astype(int)

    # Filter out rows with empty descriptions or hscodes
    df = df[df["description"].str.len() > 0]
    df = df[df["hscode"].str.len() > 0]
    logger.info(f"After filtering: {len(df)} valid rows")

    # Build document list (avoid iterrows for Python 3.14 compat)
    records = df.to_dict("records")
    documents = []
    for rec in records:
        doc = {
            "id": str(rec["hscode"]).replace(".", "_"),
            "hscode": str(rec["hscode"]),
            "description": str(rec["description"]),
            "section": str(rec["section"]),
            "level": int(rec["level"]),
            "parent": str(rec["parent"]) if rec.get("parent") and str(rec["parent"]) != "nan" else "",
        }
        documents.append(doc)

    # Batch import in chunks of 200 (smaller to avoid timeout during embedding)
    BATCH_SIZE = 200
    total_success = 0
    total_error = 0

    for i in range(0, len(documents), BATCH_SIZE):
        batch = documents[i : i + BATCH_SIZE]
        try:
            results = client.collections[COLLECTION_NAME].documents.import_(
                batch, {"action": "upsert"}
            )
            # results is a list of dicts with 'success' key
            for r in results:
                if isinstance(r, dict) and r.get("success") is False:
                    total_error += 1
                    if total_error <= 5:
                        logger.warning(f"Import error: {r}")
                else:
                    total_success += 1
        except Exception as e:
            logger.error(f"Batch import error at offset {i}: {e}")
            total_error += len(batch)

        if (i // BATCH_SIZE) % 5 == 0:
            logger.info(f"Progress: {i + len(batch)}/{len(documents)} docs processed")

    logger.info(f"Import complete: {total_success} success, {total_error} errors")


def load_synonyms_from_db(client: typesense.Client):
    """Load any existing synonym cache entries from SQLite into Typesense."""
    import sqlite3

    db_url = settings.database_url.replace("sqlite+aiosqlite:///", "")
    db_path = os.path.abspath(db_url)

    if not os.path.exists(db_path):
        logger.info("No SQLite database found, skipping synonym loading")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.execute("SELECT source_term, resolved_keywords FROM synonym_cache")
        rows = cursor.fetchall()
        conn.close()
    except Exception as e:
        logger.info(f"No synonym_cache table yet: {e}")
        return

    if not rows:
        logger.info("No cached synonyms to load")
        return

    for source_term, resolved_keywords in rows:
        try:
            keywords = json.loads(resolved_keywords) if resolved_keywords.startswith("[") else [resolved_keywords]
            synonym_id = f"syn_{source_term.lower().replace(' ', '_')}"
            client.collections[COLLECTION_NAME].synonyms.upsert(synonym_id, {
                "synonyms": [source_term.lower()] + [k.lower() for k in keywords],
            })
            logger.info(f"Loaded synonym: {source_term} → {keywords}")
        except Exception as e:
            logger.warning(f"Failed to load synonym '{source_term}': {e}")

    logger.info(f"Loaded {len(rows)} synonyms into Typesense")


def main():
    logger.info("=== Typesense Indexing Script ===")
    logger.info(f"Typesense: {settings.typesense_protocol}://{settings.typesense_host}:{settings.typesense_port}")

    client = get_client()

    # Verify Typesense is running
    try:
        health = client.operations.is_healthy()
        logger.info(f"Typesense health: {health}")
    except Exception as e:
        logger.error(f"Cannot connect to Typesense: {e}")
        logger.error("Make sure Typesense is running. See README for instructions.")
        sys.exit(1)

    csv_path = os.path.abspath(settings.dataset_csv_path)
    if not os.path.exists(csv_path):
        logger.error(f"CSV not found: {csv_path}")
        sys.exit(1)

    create_collection(client, drop_existing=True)
    import_documents(client, csv_path)
    load_synonyms_from_db(client)

    # Verify
    info = client.collections[COLLECTION_NAME].retrieve()
    logger.info(f"Collection '{COLLECTION_NAME}': {info['num_documents']} documents indexed")
    logger.info("=== Done ===")


if __name__ == "__main__":
    main()
