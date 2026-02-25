from fastapi import APIRouter, Depends
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from auth_utils import require_auth
import predict_engine as pe

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/india/{fmt}")
def india_players(fmt: str, _=Depends(require_auth)):
    players = pe.get_india_players(fmt)
    return {"players": players, "format": fmt}


@router.get("/opponents")
def opponents(_=Depends(require_auth)):
    return {"opponents": pe.get_opponents()}


@router.get("/opponents/{country}")
def opponent_players(country: str, _=Depends(require_auth)):
    players = pe.get_opponent_players(country)
    return {"players": players, "country": country}


@router.get("/venues")
def venues(_=Depends(require_auth)):
    return {"venues": pe.get_venues()}


@router.get("/pitch-types")
def pitch_types(_=Depends(require_auth)):
    return {"pitch_types": pe.PITCH_TYPES}
