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


# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def test_db():
    """Create a fresh in-memory database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """FastAPI test client with overridden database dependency."""
    def override_get_db():
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
