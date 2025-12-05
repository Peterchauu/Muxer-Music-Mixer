from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from uuid import uuid4
import requests
import librosa # For BPM
from pydub import AudioSegment # For Mixing
import numpy as np

# Import Spleeter
from spleeter.separator import Separator

router = APIRouter()

# Setup Directories
BASE_DIR = Path(__file__).resolve().parent.parent  
STEMS_DIR = (BASE_DIR / ".." / "temp_stems").resolve()
STEMS_DIR.mkdir(parents=True, exist_ok=True)

# Initialize Spleeter
try:
    separator = Separator("spleeter:2stems")
except Exception as e:
    print(f"Error initializing Spleeter: {e}")
    separator = None

# --- REQUEST MODELS ---
class SplitRequest(BaseModel):
    track_url: str

class MixRequest(BaseModel):
    session_id_vocals: str
    session_id_instr: str
    offset_ms: int

# --- HELPERS ---

def get_bpm(file_path):
    """Detects BPM using Librosa"""
    print(f"--- Analyzing BPM for: {file_path} ---")
    try:
        # Load audio (only first 60s to save time)
        y, sr = librosa.load(str(file_path), duration=60)
        
        # Calculate onset strength
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        
        # Estimate tempo
        # Librosa 0.9.2 returns a tuple: (tempo, beats)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        
        print(f"--- SUCCESS: Found BPM {tempo} ---")
        return float(tempo)
    except Exception as e:
        print(f"!!! BPM ERROR: {e}")
        # If the error is about 'backend', it means FFmpeg is missing
        return 0

# --- ROUTES ---

@router.post("/split")
async def split_track(body: SplitRequest):
    if separator is None:
        raise HTTPException(status_code=500, detail="Spleeter not initialized")

    session_id = uuid4().hex
    session_dir = STEMS_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    
    input_path = session_dir / "source.mp3"

    # 1. Download
    try:
        resp = requests.get(body.track_url, timeout=30)
        resp.raise_for_status()
        input_path.write_bytes(resp.content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Download failed: {e}")

    # 2. Get BPM (Real Analysis!)
    bpm = get_bpm(input_path)

    # 3. Spleeter Split
    try:
        separator.separate_to_file(
            str(input_path),
            str(session_dir),
            filename_format="{instrument}.{codec}",
            synchronous=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Spleeter error: {e}")

    return {
        "session_id": session_id,
        "bpm": round(bpm), # Return real BPM
        "vocals_url": f"/stems/{session_id}/vocals.wav",
        "accompaniment_url": f"/stems/{session_id}/accompaniment.wav",
    }

@router.post("/finalize")
async def finalize_mix(body: MixRequest):
    """Merges Vocal and Instrumental with Offset"""
    try:
        # Paths
        vocal_path = STEMS_DIR / body.session_id_vocals / "vocals.wav"
        instr_path = STEMS_DIR / body.session_id_instr / "accompaniment.wav"

        if not vocal_path.exists() or not instr_path.exists():
            raise HTTPException(status_code=404, detail="Source stems not found")

        # Load Audio (Pydub)
        vocal_audio = AudioSegment.from_wav(str(vocal_path))
        instr_audio = AudioSegment.from_wav(str(instr_path))

        # Apply Offset (Add silence to the START of the late track)
        if body.offset_ms > 0:
            # Vocals are late (Slide Right) -> Add silence to Vocals
            silence = AudioSegment.silent(duration=body.offset_ms)
            vocal_audio = silence + vocal_audio
        elif body.offset_ms < 0:
            # Instr is late (Slide Left) -> Add silence to Instr
            silence = AudioSegment.silent(duration=abs(body.offset_ms))
            instr_audio = silence + instr_audio

        # Overlay (Mix)
        final_mix = vocal_audio.overlay(instr_audio)

        # Save to new file
        mix_id = uuid4().hex
        output_dir = STEMS_DIR / "mixes"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{mix_id}.mp3"
        
        final_mix.export(str(output_path), format="mp3")

        return {
            "message": "Mix created successfully",
            "mix_url": f"/stems/mixes/{mix_id}.mp3",
            "title": f"Mashup {mix_id[:6]}"
        }

    except Exception as e:
        print(f"Mixing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))