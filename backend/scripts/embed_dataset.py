"""
One-time embedding script for the HS code dataset.

Usage:
    cd backend
    python -m scripts.embed_dataset

This script:
1. Loads the CSV dataset (with dtype=str to preserve leading zeros)
2. Builds parent chain descriptions for full semantic context
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
    return " ".join(text.split()).strip()


def _normalise_code(raw: str) -> str:
    """
    Turn a raw parent code from the CSV into dotted hscode form.
        '01'     -> '01'          (chapter)
        '0103'   -> '01.03'       (4-digit heading)
        '870322' -> '8703.22'     (6-digit subheading)
    """
    raw = raw.strip()
    if len(raw) == 4:
        return f"{raw[:2]}.{raw[2:]}"
    if len(raw) == 6:
        return f"{raw[:4]}.{raw[4:]}"
    return raw


def _build_parent_chain_lookup(df: pd.DataFrame) -> dict:
    """
    Build {hscode: "grandparent desc > parent desc > own desc"}.
    Walks up the parent chain so orphan descriptions get full context.
    """
    # Step 1: hscode -> (description, parent_raw)
    code_to_info = {}
    stripped_to_hs = {}
    for _, row in df.iterrows():
        hs = str(row.get("hscode", "")).strip()
        desc = clean_description(str(row.get("description", "")))
        parent_raw = str(row.get("parent", "")).strip()
        if not hs:
            continue
        code_to_info[hs] = {"desc": desc, "parent_raw": parent_raw}
        stripped_to_hs[hs.replace(".", "")] = hs

    def resolve_parent(parent_raw):
        if not parent_raw or parent_raw == "nan":
            return None
        if parent_raw in code_to_info:
            return parent_raw
        dotted = _normalise_code(parent_raw)
        if dotted in code_to_info:
            return dotted
        if parent_raw in stripped_to_hs:
            return stripped_to_hs[parent_raw]
        return None

    # Step 2: walk up the chain (max 4 hops, avoids circular refs)
    chain_cache = {}

    def get_chain(hs, depth=0):
        if hs in chain_cache:
            return chain_cache[hs]
        if depth > 4 or hs not in code_to_info:
            return []
        info = code_to_info[hs]
        parent_hs = resolve_parent(info["parent_raw"])
        ancestor = get_chain(parent_hs, depth + 1) if parent_hs and parent_hs != hs else []
        chain = ancestor + [info["desc"]]
        chain_cache[hs] = chain
        return chain

    result = {}
    for hs in code_to_info:
        chain = get_chain(hs)
        result[hs] = " > ".join(chain) if len(chain) > 1 else (chain[0] if chain else "")
    return result


def build_document_text(hscode: str, chain_desc: str, section: str) -> str:
    """
    Build embedding text with full parent context.
    BEFORE: "HS Code: 0103.91 | Weighing less than 50 kg | Section: Section I"
    AFTER:  "HS Code: 0103.91 | Live Swine > Weighing less than 50 kg | Section: Section I"
    """
    parts = []
    if hscode:
        parts.append(f"HS Code: {hscode}")
    if chain_desc:
        parts.append(chain_desc)
    if section:
        parts.append(f"Section: {section}")
    return " | ".join(parts)


def main():
    print("=" * 60)
    print("HS Code Dataset Embedding Script (FAISS) – v2 with parent chains")
    print("=" * 60)

    # ── Check if already embedded ──
    if os.path.exists(INDEX_FILE) and os.path.exists(METADATA_FILE):
        print(f"\n[SKIP] FAISS index already exists at: {INDEX_FILE}")
        print(f"  To force re-embedding, delete the files in: {PERSIST_DIR}")
        index = faiss.read_index(INDEX_FILE)
        print(f"  Index contains {index.ntotal} vectors (dimension: {index.d})")
        print("=" * 60)
        return

    # ── Step 1: Load CSV ──
    csv_path = os.path.abspath(settings.dataset_csv_path)
    print(f"\n[1/5] Loading dataset from: {csv_path}")

    if not os.path.exists(csv_path):
        print(f"ERROR: CSV file not found at {csv_path}")
        sys.exit(1)

    # dtype=str prevents pandas from stripping leading zeros in parent codes
    df = pd.read_csv(csv_path, encoding="utf-8", dtype=str)
    print(f"  Loaded {len(df)} rows with columns: {list(df.columns)}")

    # ── Step 2: Build parent chain lookup ──
    print(f"\n[2/5] Building parent chain descriptions...")
    chain_lookup = _build_parent_chain_lookup(df)

    examples = ["0103.91", "6101.90", "8703.22.50", "0104.10.10"]
    for ex in examples:
        if ex in chain_lookup:
            val = chain_lookup[ex]
            print(f"  {ex}: {val[:100]}{'...' if len(val) > 100 else ''}")

    enriched = sum(1 for v in chain_lookup.values() if " > " in v)
    print(f"  {enriched} descriptions enriched with parent context (out of {len(chain_lookup)})")

    # ── Step 3: Prepare documents ──
    print(f"\n[3/5] Preparing documents...")

    documents = []
    metadatas = []
    descriptions_list = []
    skipped = 0

    for _, row in df.iterrows():
        hscode = str(row.get("hscode", "")).strip()
        description = clean_description(str(row.get("description", "")))
        section = str(row.get("section", "")).strip()
        parent = str(row.get("parent", "")).strip()
        level_val = row.get("level", "0")

        # Embedding text uses chain description (full parent context)
        chain_desc = chain_lookup.get(hscode, description)
        doc_text = build_document_text(hscode, chain_desc, section)

        if not doc_text or len(doc_text.strip()) < 5:
            skipped += 1
            continue

        try:
            level_int = int(float(level_val))
        except (ValueError, TypeError):
            level_int = 0

        documents.append(doc_text)
        descriptions_list.append(description)  # RAW description for display & vocabulary
        metadatas.append({
            "hscode": hscode,
            "description": description,  # RAW – not concatenated (for display)
            "section": section,
            "parent": parent if parent != "nan" else "",
            "level": level_int,
        })

    print(f"  Prepared {len(documents)} documents ({skipped} skipped)")

    print(f"\n  Sample embedded texts:")
    for i in [0, 17, 100, 500]:
        if i < len(documents):
            print(f"    [{i}] {documents[i][:120]}...")

    # ── Step 4: Embed with sentence-transformers ──
    print(f"\n[4/5] Embedding {len(documents)} documents...")
    print(f"  Model: {settings.embedding_model}")
    print(f"  Device: cpu")
    print(f"  This may take 5-15 minutes on CPU. Be patient!\n")

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

    # ── Step 5: Build FAISS index and save ──
    print(f"\n[5/5] Building FAISS index and saving to disk...")

    dimension = embeddings_matrix.shape[1]
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
    print(f"  Enriched with parent context: {enriched}")
    print(f"  Files saved to: {PERSIST_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
