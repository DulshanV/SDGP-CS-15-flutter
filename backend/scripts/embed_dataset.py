"""
One-time embedding script for the HS code dataset.

Usage:
    cd backend
    python -m scripts.embed_dataset

This script:
1. Loads the CSV dataset
2. Cleans and prepares HS code descriptions
3. Embeds them using sentence-transformers (all-MiniLM-L6-v2)
4. Stores embeddings in FAISS index + JSON metadata on disk

SAFE TO RE-RUN: Checks if index already exists. If so, skips embedding.
Delete data/chroma_db/ contents to force re-embedding.
"""

import os
import sys
import time
import json
import numpy as np
import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings


PERSIST_DIR = os.path.abspath(settings.chroma_persist_dir)
INDEX_FILE = os.path.join(PERSIST_DIR, "hs_codes.index")
METADATA_FILE = os.path.join(PERSIST_DIR, "hs_codes_metadata.json")
DESCRIPTIONS_FILE = os.path.join(PERSIST_DIR, "hs_codes_descriptions.json")


def clean_description(text: str) -> str:
    """Clean a description string: remove extra whitespace, newlines."""
    if pd.isna(text) or not isinstance(text, str):
        return ""
    text = " ".join(text.split())
    return text.strip()


def build_document_text(row: pd.Series) -> str:
    """
    Build a rich text document for embedding.
    Combines HS code + description + section for maximum semantic context.
    """
    hscode = str(row.get("hscode", "")).strip()
    desc = clean_description(str(row.get("description", "")))
    section = str(row.get("section", "")).strip()
    level = str(row.get("level", "")).strip()

    parts = []
    if hscode:
        parts.append(f"HS Code: {hscode}")
    if desc:
        parts.append(desc)
    if section:
        parts.append(f"Section: {section}")
    if level:
        parts.append(f"Level: {level}")

    return " | ".join(parts)


def main():
    print("=" * 60)
    print("HS Code Dataset Embedding Script (FAISS)")
    print("=" * 60)

    # ── Check if already embedded ──
    if os.path.exists(INDEX_FILE) and os.path.exists(METADATA_FILE):
        print(f"\n[SKIP] FAISS index already exists at: {INDEX_FILE}")
        print(f"  To force re-embedding, delete the files in: {PERSIST_DIR}")

        index = faiss.read_index(INDEX_FILE)
        print(f"  Index contains {index.ntotal} vectors (dimension: {index.d})")
        print("\nDone! The embeddings are ready. Start the API server.")
        print("=" * 60)
        return

    # ── Step 1: Load CSV ──
    csv_path = os.path.abspath(settings.dataset_csv_path)
    print(f"\n[1/4] Loading dataset from: {csv_path}")

    if not os.path.exists(csv_path):
        print(f"ERROR: CSV file not found at {csv_path}")
        print("Set DATASET_CSV_PATH in .env or place the CSV file at the expected location.")
        sys.exit(1)

    df = pd.read_csv(csv_path, encoding="utf-8")
    print(f"  Loaded {len(df)} rows with columns: {list(df.columns)}")

    # ── Step 2: Prepare documents ──
    print(f"\n[2/4] Preparing documents...")

    documents = []
    metadatas = []
    descriptions_list = []
    skipped = 0

    for idx, row in df.iterrows():
        doc_text = build_document_text(row)

        if not doc_text or len(doc_text.strip()) < 5:
            skipped += 1
            continue

        hscode = str(row.get("hscode", "")).strip()
        description = clean_description(str(row.get("description", "")))
        section = str(row.get("section", "")).strip()
        parent = str(row.get("parent", "")).strip()
        level_val = row.get("level", 0)

        try:
            level_int = int(float(level_val))
        except (ValueError, TypeError):
            level_int = 0

        documents.append(doc_text)
        descriptions_list.append(description)
        metadatas.append({
            "hscode": hscode,
            "description": description,
            "section": section,
            "parent": parent if parent != "nan" else "",
            "level": level_int,
        })

    print(f"  Prepared {len(documents)} documents ({skipped} skipped)")

    # ── Step 3: Embed with sentence-transformers ──
    print(f"\n[3/4] Embedding {len(documents)} documents...")
    print(f"  Model: {settings.embedding_model}")
    print(f"  Device: cpu")
    print(f"  This may take 10-20 minutes on CPU. Be patient!\n")

    model = SentenceTransformer(settings.embedding_model, device="cpu")

    start_time = time.time()

    BATCH_SIZE = 256
    all_embeddings = []

    for i in range(0, len(documents), BATCH_SIZE):
        batch = documents[i:i + BATCH_SIZE]
        embeddings = model.encode(
            batch,
            show_progress_bar=False,
            normalize_embeddings=True,
            batch_size=BATCH_SIZE,
        )
        all_embeddings.append(embeddings)

        elapsed = time.time() - start_time
        done = min(i + BATCH_SIZE, len(documents))
        rate = done / elapsed if elapsed > 0 else 0
        eta = (len(documents) - done) / rate if rate > 0 else 0
        print(f"  [{done}/{len(documents)}] {elapsed:.1f}s elapsed, ~{eta:.0f}s remaining")

    embeddings_matrix = np.vstack(all_embeddings).astype("float32")
    embed_time = time.time() - start_time
    print(f"\n  Embedding complete in {embed_time:.1f}s ({embed_time / 60:.1f} min)")
    print(f"  Matrix shape: {embeddings_matrix.shape}")

    # ── Step 4: Build FAISS index and save ──
    print(f"\n[4/4] Building FAISS index and saving to disk...")

    dimension = embeddings_matrix.shape[1]
    # IndexFlatIP (inner product) on normalized vectors = cosine similarity
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings_matrix)

    os.makedirs(PERSIST_DIR, exist_ok=True)

    faiss.write_index(index, INDEX_FILE)
    print(f"  FAISS index saved: {INDEX_FILE} ({index.ntotal} vectors, dim={dimension})")

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadatas, f, ensure_ascii=False, indent=None)
    print(f"  Metadata saved: {METADATA_FILE}")

    with open(DESCRIPTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(descriptions_list, f, ensure_ascii=False, indent=None)
    print(f"  Descriptions saved: {DESCRIPTIONS_FILE}")

    total_time = time.time() - start_time
    print(f"\n{'=' * 60}")
    print(f"Embedding complete!")
    print(f"  Total time: {total_time:.1f}s ({total_time / 60:.1f} min)")
    print(f"  Vectors in index: {index.ntotal}")
    print(f"  Dimension: {dimension}")
    print(f"  Files saved to: {PERSIST_DIR}")
    print(f"\nThe embeddings are persisted to disk. You can now start the API server.")
    print(f"Re-running this script will skip embedding if the index exists.")
    print("=" * 60)


if __name__ == "__main__":
    main()
