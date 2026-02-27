"""
FastAPI application entry point.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # ── Startup ──
    logger.info("Starting HS Code Search Engine API...")

    # Initialize the search service via factory (Typesense or FAISS fallback)
    try:
        from app.services.search_factory import get_search_service
        svc = get_search_service()
        logger.info(f"Search service initialized: {type(svc).__name__}")
    except Exception as e:
        logger.warning(f"Search service initialization failed: {e}")
        logger.warning("Search endpoints will attempt lazy initialization on first request.")

    # Create database tables if they don't exist
    try:
        from app.core.database import engine, Base
        from app.models.user import User, SearchHistory, Favorite  # noqa: ensure models are imported

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables ensured")
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}")
        logger.warning("User-related endpoints may not work until DB is available.")

    yield

    # ── Shutdown ──
    logger.info("Shutting down HS Code Search Engine API")
    from app.core.database import engine
    await engine.dispose()


app = FastAPI(
    title="HS Code Search Engine",
    description=(
        "Semantic search engine for Harmonized System (HS) tariff codes. "
        "Supports natural language queries, typo tolerance, and HS code browsing. "
        "Built with FastAPI, ChromaDB, and sentence-transformers."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
from app.api.routes.search import router as search_router
from app.api.routes.users import router as users_router
from app.api.routes.admin import router as admin_router
from app.api.routes.synonyms import router as synonyms_router

app.include_router(search_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(synonyms_router)

# Serve the web search UI
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")


@app.get("/", tags=["ui"], include_in_schema=False)
async def serve_ui():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/api", tags=["health"])
async def api_root():
    return {
        "service": "HS Code Search Engine",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring."""
    from app.services.search_factory import search_service

    backend_name = type(search_service).__name__ if search_service else "not initialized"
    return {
        "status": "healthy",
        "search_backend": backend_name,
        "search_initialized": search_service.is_initialized if search_service else False,
    }
