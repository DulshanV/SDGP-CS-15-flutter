"""
FastAPI application entry point.
"""

import os
import sys
import logging
import json as _json
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.limiter import limiter


# ── Structured JSON Logging ────────────────────────────────────────────────

class _JSONFormatter(logging.Formatter):
    """Emit one JSON object per log line — easy to parse in production."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0] is not None:
            log_obj["exception"] = self.formatException(record.exc_info)
        return _json.dumps(log_obj, default=str)


def _configure_logging():
    """Use JSON logging in production, human-readable in development."""
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    # Remove any existing handlers
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    if settings.is_production:
        handler.setFormatter(_JSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")
        )
    root.addHandler(handler)


_configure_logging()
logger = logging.getLogger(__name__)


# ── Rate Limiter ───────────────────────────────────────────────────────────


# ── Lifespan ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # ── Startup ──
    logger.info("Starting HS Code Search Engine API...")
    logger.info(f"Environment: {settings.env} | CORS: {settings.cors_origins}")

    # Safety: warn loudly if dev mode is active on a non-localhost host
    if not settings.is_production and settings.host != "127.0.0.1":
        logger.warning(
            "\u26a0\ufe0f  ENV=%s with HOST=%s — dev-token auth bypass is ACTIVE. "
            "Set ENV=production for public deployments!",
            settings.env,
            settings.host,
        )

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
        from app.models.user import User, SearchHistory, Favorite, SubscriptionTier  # noqa: ensure models are imported
        from app.models.categories import FeaturedCategory  # noqa: ensure category model is imported

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
        "Built with FastAPI, FAISS, and sentence-transformers."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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
from app.api.routes.training import router as training_router
from app.api.routes.datasets import router as datasets_router
from app.api.routes.pricing import router as pricing_router
from app.api.routes.categories import router as categories_router

app.include_router(search_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(synonyms_router)
app.include_router(training_router)
app.include_router(datasets_router)
app.include_router(pricing_router)
app.include_router(categories_router)

# Serve the web search UI
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")


@app.get("/", tags=["ui"], include_in_schema=False)
async def serve_ui():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/api", tags=["health"])
@limiter.limit(settings.rate_limit_default)
async def api_root(request: Request):
    return {
        "service": "HS Code Search Engine",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring (no rate limit)."""
    from app.services.search_factory import search_service

    backend_name = type(search_service).__name__ if search_service else "not initialized"
    return {
        "status": "healthy",
        "search_backend": backend_name,
        "search_initialized": search_service.is_initialized if search_service else False,
    }
