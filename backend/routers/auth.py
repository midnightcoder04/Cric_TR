from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from database import get_user_by_username, create_session, delete_session, get_session
from auth_utils import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(body: LoginRequest):
    user = get_user_by_username(body.username)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_session(user["id"], user["username"])
    return {"token": token, "username": user["username"]}


@router.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        delete_session(token)
    return {"detail": "Logged out"}


@router.get("/me")
def me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = get_session(authorization[7:])
    if not session:
        raise HTTPException(status_code=401, detail="Session expired")
    return {"username": session["username"]}
