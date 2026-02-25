from fastapi import APIRouter, Depends, Query
from typing import List, Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from auth_utils import require_auth
import predict_engine as pe

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/batting/{fmt}")
def batting_stats(fmt: str, _=Depends(require_auth)):
    return pe.get_player_batting_stats(fmt)


@router.get("/bowling/{fmt}")
def bowling_stats(fmt: str, _=Depends(require_auth)):
    return pe.get_player_bowling_stats(fmt)


@router.get("/teams")
def team_stats(_=Depends(require_auth)):
    return pe.get_team_stats()


@router.get("/categories/{fmt}")
def player_categories(fmt: str, _=Depends(require_auth)):
    return pe.get_player_categories(fmt)


@router.get("/form")
def player_form(
    players: str = Query(..., description="Comma-separated player names"),
    fmt: Optional[str] = Query(None),
    n: int = Query(5, ge=1, le=20),
    _=Depends(require_auth),
):
    player_list = [p.strip() for p in players.split(",") if p.strip()]
    return pe.get_player_form(player_list, fmt, n)
