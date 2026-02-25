from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from auth_utils import require_auth
import predict_engine as pe

router = APIRouter(prefix="/predict", tags=["predict"])


class PredictRequest(BaseModel):
    format: str                   # t20 | odi | test
    venue: str
    pitch_type: str
    batting_first: bool = True
    opponent: str                 # country name
    squad: Optional[List[str]] = None  # if None, use default India squad


@router.post("")
def run_prediction(body: PredictRequest, _=Depends(require_auth)):
    fmt = body.format.lower()
    if fmt not in ("t20", "odi", "test"):
        raise HTTPException(400, "format must be t20, odi, or test")

    squad = body.squad or pe.get_india_players(fmt)
    if not squad:
        raise HTTPException(400, f"No players found for format {fmt}")

    result = pe.predict(
        squad=squad,
        fmt=fmt,
        venue=body.venue,
        pitch=body.pitch_type,
        opponent=body.opponent,
        batting_first=body.batting_first,
    )
    return result
