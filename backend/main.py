"""
Cricket Analytics API — FastAPI entry point.
Run with:
  cd backend
  uvicorn main:app --reload --port 8000
"""
import sys
import os
from pathlib import Path

# Ensure the backend directory is on sys.path for relative imports
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_user_by_username, create_user
from auth_utils import hash_password
import predict_engine as pe
from routers import auth, players, prediction, stats

app = FastAPI(title="Cricket Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(players.router)
app.include_router(prediction.router)
app.include_router(stats.router)


@app.on_event("startup")
def on_startup():
    # Initialise auth DB
    init_db()
    # Seed a default admin user if none exists
    if not get_user_by_username("admin"):
        create_user("admin", hash_password("admin123"))
        print("Created default user: admin / admin123")
    # Load ML models and data profiles (takes ~5-10 seconds)
    print("Loading ML models and data profiles…")
    pe.startup()
    print("Ready.")


@app.get("/health")
def health():
    return {"status": "ok"}
