"""
Pytest fixtures and configuration for CeylonHS backend tests.
"""
import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User


@pytest.fixture(scope="function")
def _db_path():
    """Create a temporary database file for each test."""
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield db_path
    try:
        os.unlink(db_path)
    except OSError:
        pass


@pytest.fixture(scope="function")
def test_db(_db_path):
    """Create a fresh database for each test, return sync session for setup."""
    sync_engine = create_engine(
        f"sqlite:///{_db_path}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=sync_engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()
        sync_engine.dispose()


@pytest.fixture(scope="function")
def client(test_db, _db_path):
    """FastAPI test client with async database dependency override."""
    async_engine = create_async_engine(
        f"sqlite+aiosqlite:///{_db_path}",
        connect_args={"check_same_thread": False},
    )
    AsyncTestSession = async_sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def override_get_db():
        async with AsyncTestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    # Reset rate limiter storage so tests are independent
    from app.core.limiter import limiter
    limiter.reset()

    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_firebase_token():
    """Mock Firebase ID token for authentication tests."""
    return "mock_firebase_token_12345"


@pytest.fixture
def test_user(test_db):
    """Create a test user in the database."""
    user = User(
        firebase_uid="test_uid_123",
        email="test@example.com",
        display_name="Test User",
        role="user"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def test_admin(test_db):
    """Create a test admin user in the database."""
    admin = User(
        firebase_uid="admin_uid_456",
        email="admin@example.com",
        display_name="Admin User",
        role="admin"
    )
    test_db.add(admin)
    test_db.commit()
    test_db.refresh(admin)
    return admin


@pytest.fixture(autouse=True)
def mock_firebase_auth(monkeypatch):
    """Mock Firebase Authentication for all tests."""
    def mock_verify_token(token: str, **kwargs):
        # Accept **kwargs to match firebase_admin.auth.verify_id_token signature
        # (accepts check_revoked, app, clock_skew_in_seconds, etc.)
        if token == "valid_user_token":
            return {"uid": "test_uid_123", "email": "test@example.com"}
        elif token == "valid_admin_token":
            return {"uid": "admin_uid_456", "email": "admin@example.com"}
        elif token == "invalid_token":
            raise Exception("Invalid token")
        return {"uid": "mock_uid", "email": "mock@example.com"}
    
    # Mock firebase_admin.auth.verify_id_token which is called by app.core.auth
    try:
        import firebase_admin.auth as firebase_auth_module
        monkeypatch.setattr(firebase_auth_module, "verify_id_token", mock_verify_token)
    except Exception:
        pass  # Firebase admin not configured in test environment


@pytest.fixture(autouse=True)
def mock_search_service(monkeypatch):
    """Mock search service so tests don't require a FAISS index."""
    from app.services.search_base import BaseSearchService

    class MockSearchService(BaseSearchService):
        _initialized = True

        def initialize(self):
            pass

        def search(self, query, top_k=10):
            return {
                "query": query,
                "corrected_query": None,
                "enrichment_info": None,
                "total_results": 1,
                "results": [
                    {
                        "hscode": "0902.10",
                        "description": "Green tea (not fermented)",
                        "section": "II",
                        "level": 2,
                        "parent": "0902",
                        "relevance_pct": 95.0,
                        "hierarchy_path": ["09", "0902", "0902.10"],
                    }
                ],
            }

        def get_hs_code_detail(self, hscode):
            if hscode == "0902.10":
                return {
                    "hscode": "0902.10",
                    "description": "Green tea (not fermented)",
                    "section": "II",
                    "level": 2,
                    "parent": "0902",
                    "children": [],
                    "hierarchy_path": ["09", "0902", "0902.10"],
                }
            return None

        def get_categories(self):
            return [{"section": "II", "description": "Vegetable products", "chapters": []}]

    import app.services.search_factory as sf
    monkeypatch.setattr(sf, "search_service", MockSearchService())
    monkeypatch.setattr(sf, "get_search_service", lambda: sf.search_service)
