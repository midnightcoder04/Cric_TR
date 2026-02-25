"""
Auth utilities — password hashing and session validation.
"""
import bcrypt
from fastapi import HTTPException, Header
from typing import Optional
from database import get_session


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def require_auth(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    session = get_session(token)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return session
