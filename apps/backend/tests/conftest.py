"""
Pytest fixtures and configuration for CeylonHS backend tests.
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User


from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest_asyncio
import asyncio

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)


@pytest_asyncio.fixture(scope="function", loop_scope="function")
async def test_db():
    """Create a fresh in-memory database for each test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        await db.close()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
def client(test_db):
    """FastAPI test client with overridden database dependency."""
    async def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_firebase_token():
    """Mock Firebase ID token for authentication tests."""
    return "mock_firebase_token_12345"


@pytest_asyncio.fixture
async def test_user(test_db):
    """Create a test user in the database."""
    user = User(
        firebase_uid="test_uid_123",
        email="test@example.com",
        display_name="Test User",
        role="user"
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_admin(test_db):
    """Create a test admin user in the database."""
    admin = User(
        firebase_uid="admin_uid_456",
        email="admin@example.com",
        display_name="Admin User",
        role="admin"
    )
    test_db.add(admin)
    await test_db.commit()
    await test_db.refresh(admin)
    return admin


@pytest.fixture(autouse=True)
def mock_firebase_auth(monkeypatch):
    """Mock Firebase Authentication for all tests."""
    def mock_verify_token(token: str):
        # Simple mock: return decoded token data based on token value
        if token == "valid_user_token":
            return {"uid": "test_uid_123", "email": "test@example.com"}
        elif token == "valid_admin_token":
            return {"uid": "admin_uid_456", "email": "admin@example.com"}
        elif token == "invalid_token":
            raise Exception("Invalid token")
        return {"uid": "mock_uid", "email": "mock@example.com"}
    
    # Mock the firebase-admin verify_id_token function
    try:
        from app.core import auth
        if hasattr(auth, 'firebase_auth'):
            monkeypatch.setattr(auth.firebase_auth, "verify_id_token", mock_verify_token)
    except:
        pass  # Firebase admin not configured in test environment

@pytest.fixture(autouse=True)
def mock_search_service(monkeypatch):
    """Mock the search service to prevent loading FAISS models during tests."""
    try:
        from app.services.search_base import BaseSearchService

        class MockSearchService(BaseSearchService):
            def initialize(self):
                pass
                
            def search(self, query: str, top_k: int = 10) -> dict:
                if query == "tea":
                    results = [{"hscode": "0902.10", "description": "Green tea", "section": "II", "level": 6, "relevance_pct": 95.0}]
                    return {"query": query, "corrected_query": None, "total_results": 1, "results": results}
                
                # Default empty response
                return {"query": query, "corrected_query": None, "total_results": 0, "results": []}
                
            def get_hs_code_detail(self, hscode: str):
                if hscode == "0902.10":
                    return {"hscode": "0902.10", "description": "Green tea", "section": "II", "parent": "0902", "level": 6, "hierarchy_path": [], "children": []}
                return None
                
            def get_categories(self):
                return [{"section": "II", "chapter": "09", "description": "Coffee, tea, maté and spices", "chapters": []}]
                
        mock_svc = MockSearchService()
        
        # Patch the factory functions where they are imported
        monkeypatch.setattr("app.api.routes.search.get_search_service", lambda: mock_svc)
    except Exception as e:
        print(f"Failed to mock search service: {e}")

@pytest.fixture(autouse=True)
def override_auth_dependencies():
    """Override database-dependent auth dependencies to avoid async/sync session mismatch."""
    from app.core import auth
    from fastapi import HTTPException, Depends
    from app.models.user import User
    
    async def mock_require_admin(token_data: dict = Depends(auth.require_auth)):
        if token_data.get("uid") != "admin_uid_456":
            raise HTTPException(status_code=403, detail="Admin access required.")
        return token_data
        
    async def mock_get_current_user(token_data: dict = Depends(auth.require_auth)):
        if token_data.get("uid") == "admin_uid_456":
            return User(firebase_uid="admin_uid_456", email="admin@example.com", display_name="Admin User", role="admin")
        elif token_data.get("uid") == "test_uid_123":
            return User(firebase_uid="test_uid_123", email="test@example.com", display_name="Test User", role="user")
        raise HTTPException(status_code=404, detail="User not found.")
        
    app.dependency_overrides[auth.require_admin] = mock_require_admin
    app.dependency_overrides[auth.get_current_user] = mock_get_current_user
    yield
    app.dependency_overrides.pop(auth.require_admin, None)
    app.dependency_overrides.pop(auth.get_current_user, None)
