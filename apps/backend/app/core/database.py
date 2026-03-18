"""
Async database session management using SQLAlchemy 2.0.
Supports both PostgreSQL (production) and SQLite (local dev).
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event, inspect, text
from app.core.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

_engine_kwargs: dict = {
    "echo": False,
}
if _is_sqlite:
    # SQLite doesn't support pool_size / max_overflow
    # timeout=30 sets aiosqlite's connection-level wait (overrides the 1s default)
    _engine_kwargs["connect_args"] = {"check_same_thread": False, "timeout": 30}
else:
    _engine_kwargs["pool_size"] = 10
    _engine_kwargs["max_overflow"] = 20

engine = create_async_engine(settings.database_url, **_engine_kwargs)

# Enable WAL mode + foreign keys + generous busy_timeout for SQLite
if _is_sqlite:
    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=30000")  # 30s — prevent 1s timeout errors
        cursor.execute("PRAGMA synchronous=NORMAL")  # faster writes, still safe with WAL
        cursor.close()


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


def ensure_schema_compatibility(sync_conn) -> None:
    """Backfill required columns for older databases without migrations."""
    inspector = inspect(sync_conn)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("users")}

    dialect = sync_conn.dialect.name
    if dialect == "postgresql":
        alter_statements = {
            "subscription_tier": "ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) NOT NULL DEFAULT 'starter'",
            "subscription_start_date": "ALTER TABLE users ADD COLUMN subscription_start_date TIMESTAMP NULL",
            "subscription_end_date": "ALTER TABLE users ADD COLUMN subscription_end_date TIMESTAMP NULL",
            "is_subscription_active": "ALTER TABLE users ADD COLUMN is_subscription_active BOOLEAN NOT NULL DEFAULT TRUE",
        }
    else:
        alter_statements = {
            "subscription_tier": "ALTER TABLE users ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'starter'",
            "subscription_start_date": "ALTER TABLE users ADD COLUMN subscription_start_date DATETIME",
            "subscription_end_date": "ALTER TABLE users ADD COLUMN subscription_end_date DATETIME",
            "is_subscription_active": "ALTER TABLE users ADD COLUMN is_subscription_active INTEGER NOT NULL DEFAULT 1",
        }

    for column_name, ddl in alter_statements.items():
        if column_name not in existing_columns:
            sync_conn.execute(text(ddl))


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
