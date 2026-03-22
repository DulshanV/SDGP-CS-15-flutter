"""
Dataset management admin routes.

Endpoints:
  GET    /api/v1/admin/datasets           – list all uploaded datasets
  GET    /api/v1/admin/datasets/active     – get currently active dataset info
  POST   /api/v1/admin/datasets/upload     – upload a new CSV dataset
  POST   /api/v1/admin/datasets/{id}/activate – embed & activate a dataset (background)
  DELETE /api/v1/admin/datasets/{id}       – delete a dataset
  GET    /api/v1/admin/datasets/status     – get embedding job status
"""

import os
import sys
import time
import json
import shutil
import sqlite3
import logging
import threading
from typing import Optional, List

import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import require_auth
from app.core.config import settings
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin/datasets", tags=["admin-datasets"])

# ── Paths ────────────────────────────────────────────────────────────────────

DATASETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "datasets"))
PERSIST_DIR = os.path.abspath(settings.chroma_persist_dir)
DB_PATH = os.path.abspath(settings.database_url.replace("sqlite+aiosqlite:///", ""))

# ── Background job state (in-memory, single-server) ─────────────────────────

_embedding_job = {
    "running": False,
    "dataset_id": None,
    "dataset_name": None,
    "progress": 0,        # 0-100
    "step": "",           # current step description
    "error": None,
    "started_at": None,
    "finished_at": None,
}
_job_lock = threading.Lock()


# ── Dependency ───────────────────────────────────────────────────────────────

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

class DatasetOut(BaseModel):
    id: int
    name: str
    filename: str
    row_count: int
    size_bytes: int
    is_active: bool
    created_at: Optional[str]


class DatasetStatusOut(BaseModel):
    running: bool
    dataset_id: Optional[int]
    dataset_name: Optional[str]
    progress: int
    step: str
    error: Optional[str]
    started_at: Optional[str]
    finished_at: Optional[str]


class ActiveDatasetOut(BaseModel):
    name: str
    filename: str
    row_count: int
    vector_count: int
    dimension: int


# ── DB helpers ───────────────────────────────────────────────────────────────

def _ensure_tables():
    """Create the datasets table if it doesn't exist."""
    os.makedirs(DATASETS_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS datasets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            filename TEXT NOT NULL UNIQUE,
            row_count INTEGER DEFAULT 0,
            size_bytes INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    # Seed the current dataset if table is empty
    rows = conn.execute("SELECT COUNT(*) FROM datasets").fetchone()
    if rows[0] == 0:
        csv_path = os.path.abspath(settings.dataset_csv_path)
        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path, encoding="utf-8", dtype=str, nrows=0)
                # Just count rows quickly
                row_count = sum(1 for _ in open(csv_path, encoding="utf-8")) - 1
                size = os.path.getsize(csv_path)

                # Copy to datasets dir
                dest = os.path.join(DATASETS_DIR, "all_chapters_extracted.csv")
                if not os.path.exists(dest):
                    shutil.copy2(csv_path, dest)

                conn.execute(
                    "INSERT INTO datasets (name, filename, row_count, size_bytes, is_active) VALUES (?, ?, ?, ?, 1)",
                    ("Default HS Codes", "all_chapters_extracted.csv", row_count, size),
                )
                conn.commit()
            except Exception as e:
                logger.warning(f"Failed to seed default dataset: {e}")

    conn.close()


def _get_conn():
    return sqlite3.connect(DB_PATH)


# Ensure tables on import
try:
    _ensure_tables()
except Exception:
    pass


# ── Embedding worker ─────────────────────────────────────────────────────────

def _run_embedding(dataset_id: int, csv_path: str, dataset_name: str):
    """
    Background thread: embed a CSV dataset and hot-swap the FAISS index.
    """
    global _embedding_job
    import faiss as faiss_lib
    from sentence_transformers import SentenceTransformer as ST

    # Import helpers from embed script
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    from scripts.embed_dataset import (
        clean_description,
        _build_parent_chain_lookup,
        build_document_text,
    )

    try:
        with _job_lock:
            _embedding_job["step"] = "Loading CSV..."
            _embedding_job["progress"] = 5

        df = pd.read_csv(csv_path, encoding="utf-8", dtype=str)
        total_rows = len(df)

        with _job_lock:
            _embedding_job["step"] = f"Building parent chains ({total_rows} rows)..."
            _embedding_job["progress"] = 10

        chain_lookup = _build_parent_chain_lookup(df)

        with _job_lock:
            _embedding_job["step"] = "Preparing documents..."
            _embedding_job["progress"] = 15

        documents = []
        metadatas = []
        descriptions_list = []

        for _, row in df.iterrows():
            hscode = str(row.get("hscode", "")).strip()
            description = clean_description(str(row.get("description", "")))
            section = str(row.get("section", "")).strip()
            parent = str(row.get("parent", "")).strip()
            level_val = row.get("level", "0")

            chain_desc = chain_lookup.get(hscode, description)
            doc_text = build_document_text(hscode, chain_desc, section)

            if not doc_text or len(doc_text.strip()) < 5:
                continue

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

        with _job_lock:
            _embedding_job["step"] = f"Loading embedding model..."
            _embedding_job["progress"] = 20

        model = ST(settings.embedding_model, device="cpu")

        with _job_lock:
            _embedding_job["step"] = f"Embedding {len(documents)} documents..."
            _embedding_job["progress"] = 25

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

            done_pct = min(i + BATCH_SIZE, len(documents))
            pct = 25 + int((done_pct / len(documents)) * 60)  # 25-85%
            with _job_lock:
                _embedding_job["progress"] = pct
                _embedding_job["step"] = f"Embedding... {done_pct}/{len(documents)}"

        embeddings_matrix = np.vstack(all_embeddings).astype("float32")

        with _job_lock:
            _embedding_job["step"] = "Building FAISS index..."
            _embedding_job["progress"] = 88

        dimension = embeddings_matrix.shape[1]
        index = faiss_lib.IndexFlatIP(dimension)
        index.add(embeddings_matrix)

        # Save to disk (overwrite current index)
        os.makedirs(PERSIST_DIR, exist_ok=True)

        index_file = os.path.join(PERSIST_DIR, "hs_codes.index")
        metadata_file = os.path.join(PERSIST_DIR, "hs_codes_metadata.json")
        descriptions_file = os.path.join(PERSIST_DIR, "hs_codes_descriptions.json")

        faiss_lib.write_index(index, index_file)
        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(metadatas, f, ensure_ascii=False, indent=None)
        with open(descriptions_file, "w", encoding="utf-8") as f:
            json.dump(descriptions_list, f, ensure_ascii=False, indent=None)

        with _job_lock:
            _embedding_job["step"] = "Hot-swapping search engine..."
            _embedding_job["progress"] = 95

        # Hot-reload the FAISS search service
        from app.services.search_factory import search_service
        if search_service and hasattr(search_service, 'reload'):
            search_service.reload()

        # Update database: mark this dataset as active
        conn = _get_conn()
        conn.execute("UPDATE datasets SET is_active = 0")
        conn.execute("UPDATE datasets SET is_active = 1, row_count = ? WHERE id = ?", (len(metadatas), dataset_id))
        conn.commit()
        conn.close()

        with _job_lock:
            _embedding_job["running"] = False
            _embedding_job["progress"] = 100
            _embedding_job["step"] = f"Done! {index.ntotal} vectors indexed."
            _embedding_job["finished_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
            _embedding_job["error"] = None

        logger.info(f"Dataset '{dataset_name}' embedded & activated: {index.ntotal} vectors")

    except Exception as e:
        logger.error(f"Embedding failed for dataset {dataset_id}: {e}")
        with _job_lock:
            _embedding_job["running"] = False
            _embedding_job["error"] = str(e)
            _embedding_job["step"] = "Failed"
            _embedding_job["finished_at"] = time.strftime("%Y-%m-%d %H:%M:%S")


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=List[DatasetOut])
async def list_datasets(admin: User = Depends(_require_admin)):
    """List all uploaded datasets."""
    _ensure_tables()
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT id, name, filename, row_count, size_bytes, is_active, created_at "
            "FROM datasets ORDER BY created_at DESC"
        ).fetchall()
        return [
            DatasetOut(
                id=r[0], name=r[1], filename=r[2], row_count=r[3],
                size_bytes=r[4], is_active=bool(r[5]), created_at=r[6],
            )
            for r in rows
        ]
    finally:
        conn.close()


@router.get("/active", response_model=ActiveDatasetOut)
async def get_active_dataset(admin: User = Depends(_require_admin)):
    """Get info about the currently active dataset + FAISS index stats."""
    import faiss as faiss_lib

    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT name, filename, row_count FROM datasets WHERE is_active = 1"
        ).fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="No active dataset.")

    # Get FAISS index stats
    index_file = os.path.join(PERSIST_DIR, "hs_codes.index")
    if os.path.exists(index_file):
        idx = faiss_lib.read_index(index_file)
        vector_count = idx.ntotal
        dimension = idx.d
    else:
        vector_count = 0
        dimension = 0

    return ActiveDatasetOut(
        name=row[0], filename=row[1], row_count=row[2],
        vector_count=vector_count, dimension=dimension,
    )


@router.post("/upload", response_model=DatasetOut)
async def upload_dataset(
    file: UploadFile = File(..., description="CSV file with HS codes"),
    name: str = Form(..., description="Display name for this dataset"),
    admin: User = Depends(_require_admin),
):
    """Upload a new CSV dataset for later activation."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted.")

    _ensure_tables()
    content = await file.read()

    # Validate it's a readable CSV with expected columns
    import io
    try:
        df = pd.read_csv(io.BytesIO(content), encoding="utf-8", dtype=str, nrows=5)
        required = {"hscode", "description"}
        if not required.issubset(set(df.columns)):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must have columns: {required}. Found: {set(df.columns)}",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")

    # Count rows
    row_count = content.count(b"\n") - 1  # approximate
    if row_count < 1:
        raise HTTPException(status_code=400, detail="CSV appears to be empty.")

    # Save file with timestamp to avoid collisions
    safe_name = file.filename.replace(" ", "_")
    ts = time.strftime("%Y%m%d_%H%M%S")
    stored_filename = f"{ts}_{safe_name}"

    os.makedirs(DATASETS_DIR, exist_ok=True)
    dest = os.path.join(DATASETS_DIR, stored_filename)
    with open(dest, "wb") as f:
        f.write(content)

    # Insert into DB
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO datasets (name, filename, row_count, size_bytes) VALUES (?, ?, ?, ?)",
            (name, stored_filename, row_count, len(content)),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, name, filename, row_count, size_bytes, is_active, created_at "
            "FROM datasets WHERE filename = ?", (stored_filename,)
        ).fetchone()
        return DatasetOut(
            id=row[0], name=row[1], filename=row[2], row_count=row[3],
            size_bytes=row[4], is_active=bool(row[5]), created_at=row[6],
        )
    finally:
        conn.close()


@router.post("/{dataset_id}/activate", response_model=dict)
async def activate_dataset(
    dataset_id: int,
    admin: User = Depends(_require_admin),
):
    """
    Activate a dataset: embed it in the background and hot-swap the FAISS index.
    Returns immediately – poll GET /status for progress.
    """
    global _embedding_job

    with _job_lock:
        if _embedding_job["running"]:
            raise HTTPException(
                status_code=409,
                detail="An embedding job is already running. Wait for it to finish.",
            )

    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT id, name, filename FROM datasets WHERE id = ?", (dataset_id,)
        ).fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    csv_path = os.path.join(DATASETS_DIR, row[2])
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Dataset file missing from disk.")

    # Start background embedding
    with _job_lock:
        _embedding_job = {
            "running": True,
            "dataset_id": row[0],
            "dataset_name": row[1],
            "progress": 0,
            "step": "Starting...",
            "error": None,
            "started_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "finished_at": None,
        }

    thread = threading.Thread(
        target=_run_embedding,
        args=(row[0], csv_path, row[1]),
        daemon=True,
    )
    thread.start()

    return {
        "message": f"Embedding started for '{row[1]}'. Poll GET /status for progress.",
        "dataset_id": row[0],
    }


@router.get("/status", response_model=DatasetStatusOut)
async def get_embedding_status(admin: User = Depends(_require_admin)):
    """Get the current status of the background embedding job."""
    with _job_lock:
        return DatasetStatusOut(**_embedding_job)


@router.delete("/{dataset_id}", response_model=dict)
async def delete_dataset(
    dataset_id: int,
    admin: User = Depends(_require_admin),
):
    """Delete an uploaded dataset. Cannot delete the active dataset."""
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT is_active, filename FROM datasets WHERE id = ?", (dataset_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found.")
        if row[0]:
            raise HTTPException(status_code=400, detail="Cannot delete the active dataset.")

        # Delete file
        fpath = os.path.join(DATASETS_DIR, row[1])
        if os.path.exists(fpath):
            os.remove(fpath)

        conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
        conn.commit()
        return {"message": "Dataset deleted."}
    finally:
        conn.close()
