"""
Firebase Authentication middleware.
Verifies Firebase ID tokens from Authorization headers.
"""

import logging
from typing import Optional
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

# Firebase Admin SDK - initialized lazily
_firebase_app = None


def _init_firebase():
    """Initialize Firebase Admin SDK (once)."""
    global _firebase_app
    if _firebase_app is not None:
        return

    try:
        import firebase_admin
        from firebase_admin import credentials
        from app.core.config import settings
        import os

        cred_path = settings.firebase_credentials_path
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized with service account.")
        else:
            # Initialize without credentials (uses GOOGLE_APPLICATION_CREDENTIALS env var)
            _firebase_app = firebase_admin.initialize_app()
            logger.info("Firebase Admin initialized without explicit credentials.")
    except Exception as e:
        logger.warning(f"Firebase Admin init failed: {e}. Auth will use dev mode.")


security = HTTPBearer(auto_error=False)


async def verify_firebase_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """
    Verify the Firebase ID token from the Authorization header.
    Returns the decoded token dict or None if no token provided.
    """
    if credentials is None:
        return None

    token = credentials.credentials

    # Dev mode: accept "dev-token-{uid}" for local testing (DISABLED in production)
    if token.startswith("dev-token-"):
        from app.core.config import settings
        if settings.is_production:
            logger.warning("Dev token rejected in production mode.")
            raise HTTPException(status_code=401, detail="Dev tokens are not accepted in production.")
        uid = token.replace("dev-token-", "")
        return {
            "uid": uid,
            "email": f"{uid}@dev.local",
            "name": "Dev User",
            "dev_mode": True,
        }

    try:
        _init_firebase()
        from firebase_admin import auth

        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


async def require_auth(
    token_data: Optional[dict] = Depends(verify_firebase_token),
) -> dict:
    """Dependency that REQUIRES a valid Firebase token."""
    if token_data is None:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return token_data


async def require_admin(
    token_data: dict = Depends(require_auth),
) -> dict:
    """Dependency that requires admin role. Queries the DB to verify."""
    from app.core.database import AsyncSessionLocal
    from app.models.user import User, UserRole
    from sqlalchemy import select

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.firebase_uid == token_data["uid"])
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found.")
        if user.role != UserRole.admin.value:
            raise HTTPException(status_code=403, detail="Admin access required.")
    return token_data

async def get_current_user(
    token_data: dict = Depends(require_auth),
):
    """Dependency that returns the authenticated User ORM object."""
    from app.core.database import AsyncSessionLocal
    from app.models.user import User
    from sqlalchemy import select
    from sqlalchemy.orm import make_transient

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.firebase_uid == token_data["uid"])
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found.")
        # Detach from the session so the object remains usable after close
        session.expunge(user)
    return user
