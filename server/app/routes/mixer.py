# server/app/routes/mixer.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from pathlib import Path
from uuid import uuid4
import requests

from spleeter.separator import Separator

router = APIRouter()

# Where we'll store temporary audio + stems
BASE_DIR = Path(__file__).resolve().parent.parent  # .../server/app
STEMS_DIR = (BASE_DIR / ".." / "temp_stems").resolve()
STEMS_DIR.mkdir(parents=True, exist_ok=True)

# ---- Request model ----

class SplitRequest(BaseModel):
    track_url: HttpUrl  # Deezer preview URL (or any audio URL for now)


# ---- Helper to run Spleeter ----

def _process_split(track_url: str) -> dict:
    """
    Download the audio file, run Spleeter 2-stem separation,
    and return relative URLs for the generated stems.
    """
    session_id = uuid4().hex
    input_path = STEMS_DIR / f"{session_id}.mp3"
    output_dir = STEMS_DIR / session_id
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1) Download audio
    try:
        resp = requests.get(track_url, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download audio: {e}")

    input_path.write_bytes(resp.content)

    # 2) Run Spleeter (2 stems: vocals + accompaniment)
    try:
        separator = Separator("spleeter:2stems")
        separator.separate_to_file(str(input_path), str(output_dir))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Spleeter processing error: {e}")

    # Spleeter creates: output_dir / <filename> / vocals.wav, accompaniment.wav
    # Because we used "<session_id>.mp3", Spleeter makes a folder named "<session_id>"
    stems_folder = output_dir / session_id

    vocals_path = stems_folder / "vocals.wav"
    accomp_path = stems_folder / "accompaniment.wav"

    if not vocals_path.exists() or not accomp_path.exists():
        raise HTTPException(
            status_code=500,
            detail="Expected stem files were not created by Spleeter.",
        )

    # These URLs will be served by StaticFiles in main.py (mounted at /stems)
    return {
        "session_id": session_id,
        "vocals_url": f"/stems/{session_id}/vocals.wav",
        "accompaniment_url": f"/stems/{session_id}/accompaniment.wav",
    }


# ---- API route ----

@router.post("/split")
async def split_track(body: SplitRequest):
    """
    Split a track into vocals + accompaniment using Spleeter.
    Returns URLs pointing to the generated stem files.
    """
    result = _process_split(str(body.track_url))
    return result
