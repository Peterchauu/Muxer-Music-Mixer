from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from uuid import uuid4
import requests
import librosa
from pydub import AudioSegment
import soundfile as sf
import torch
import torchaudio
from demucs.pretrained import get_model
from demucs.apply import apply_model
import asyncio
from concurrent.futures import ThreadPoolExecutor
import warnings
import subprocess



router = APIRouter()
executor = ThreadPoolExecutor(max_workers=2)
BASE_DIR = Path(__file__).resolve().parent.parent  
STEMS_DIR = (BASE_DIR / ".." / "temp_stems").resolve()
STEMS_DIR.mkdir(parents=True, exist_ok=True)

# Configure RubberBand executable path
RUBBERBAND_DIR = (BASE_DIR / ".." / "rubberband" / "rubberband-3.3.0-gpl-executable-windows").resolve()
RUBBERBAND_EXE = RUBBERBAND_DIR / "rubberband.exe"

_demucs_model = None




def get_demucs_model():
    """Lazy-load Demucs model on first use"""
    global _demucs_model
    if _demucs_model is None:
        _demucs_model = get_model('htdemucs')
        _demucs_model.cpu()
        _demucs_model.eval()
    return _demucs_model



# --- REQUEST MODELS ---
class SplitRequest(BaseModel):
    track_url: str

class AdjustBPMRequest(BaseModel):
    session_id: str
    target_bpm: float
    original_bpm: float

class MixRequest(BaseModel):
    session_id_vocals: str
    session_id_instr: str
    offset_ms: int
    
    

# --- HELPERS ---

def get_bpm(file_path):
    """Detects BPM using Librosa"""
    warnings.filterwarnings('ignore')
    
    try:
        # Load audio
        y, sr = librosa.load(str(file_path), duration=60)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        return float(tempo)
    except Exception as e:
        return 120  # Default BPM if detection fails



def process_demucs_separation(wav_path, session_dir, model):
    # Load audio
    waveform, sr = torchaudio.load(str(wav_path))
    
    # Resample to model's sample rate if needed (44100)
    if sr != model.samplerate:
        resampler = torchaudio.transforms.Resample(sr, model.samplerate)
        waveform = resampler(waveform)
    
    # Ensure stereo (2 channels)
    if waveform.shape[0] == 1:
        waveform = waveform.repeat(2, 1)
    elif waveform.shape[0] > 2:
        waveform = waveform[:2, :]
    
    # Normalize
    max_val = waveform.abs().max()
    if max_val > 0:
        waveform = waveform / max_val
    
    # Add batch dimension and move to CPU
    waveform = waveform.unsqueeze(0).cpu()
    
    # Separate sources
    with torch.no_grad():
        sources = apply_model(model, waveform, device='cpu')[0]
    
    # Extract stems: drums[0], bass[1], other[2], vocals[3]
    drums = sources[0].cpu().numpy()
    bass = sources[1].cpu().numpy()
    other = sources[2].cpu().numpy()
    vocals = sources[3].cpu().numpy()
    
    # Combine non-vocal stems for instrumental
    instrumental = drums + bass + other
    
    # Save stems as WAV
    vocals_path = session_dir / "vocals.wav"
    instrumental_path = session_dir / "instrumental.wav"
    
    sf.write(str(vocals_path), vocals.T, model.samplerate)
    sf.write(str(instrumental_path), instrumental.T, model.samplerate)
    
    return vocals_path, instrumental_path




# --- ROUTES ---

@router.post("/split")
async def split_track(body: SplitRequest):
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

    # 2. Convert MP3 to WAV
    try:
        warnings.filterwarnings('ignore')
        audio_segment = AudioSegment.from_file(str(input_path))
        wav_path = session_dir / "source.wav"
        audio_segment.export(str(wav_path), format="wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio conversion failed: {e}")

    # 3. Get BPM
    bpm = get_bpm(wav_path)

    # 4. Demucs Separation in thread pool
    try:
        model = get_demucs_model()
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, process_demucs_separation, wav_path, session_dir, model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Separation error: {str(e)}")

    return {
        "session_id": session_id,
        "bpm": round(bpm),
        "vocals_url": f"/stems/{session_id}/vocals.wav",
        "instrumental_url": f"/stems/{session_id}/instrumental.wav",
    }




def process_bpm_adjustment(instrumental_path, adjusted_path, ratio, sr):
    """CPU-intensive time-stretching using RubberBand CLI - runs in thread pool"""
    # Calculate tempo change percentage (RubberBand uses tempo ratio)
    # ratio = target_bpm / original_bpm
    # e.g., 1.1 = speed up by 10%, 0.9 = slow down by 10%
    
    # Build RubberBand command
    cmd = [
        str(RUBBERBAND_EXE),
        "--tempo", str(ratio),  # Tempo change ratio
        "--pitch-hq",           # High quality pitch preservation
        str(instrumental_path),
        str(adjusted_path)
    ]
    
    # Run RubberBand CLI
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise Exception(f"RubberBand failed: {result.stderr}")







@router.post("/adjust-bpm")
async def adjust_bpm(body: AdjustBPMRequest):
    """Time-stretch audio to match target BPM without pitch distortion"""
    try:
        instrumental_path = STEMS_DIR / body.session_id / "instrumental.wav"
        
        if not instrumental_path.exists():
            raise HTTPException(status_code=404, detail="Stem not found")
        
        # Calculate time stretch ratio
        ratio = body.target_bpm / body.original_bpm
        
        # Run time-stretching in thread pool
        adjusted_path = STEMS_DIR / body.session_id / "instrumental_adjusted.wav"
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, process_bpm_adjustment, instrumental_path, adjusted_path, ratio, None)
        
        return {
            "adjusted_url": f"/stems/{body.session_id}/instrumental_adjusted.wav",
            "ratio": ratio
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BPM adjustment error: {str(e)}")



@router.post("/finalize")
async def finalize_mix(body: MixRequest):
    """Merges Vocal and Instrumental with Offset"""
    try:
        # Paths
        vocal_path = STEMS_DIR / body.session_id_vocals / "vocals.wav"
        instr_path = STEMS_DIR / body.session_id_instr / "instrumental.wav"

        if not vocal_path.exists() or not instr_path.exists():
            raise HTTPException(status_code=404, detail="Source stems not found")

        # Load Audio (Pydub)
        vocal_audio = AudioSegment.from_wav(str(vocal_path))
        instr_audio = AudioSegment.from_wav(str(instr_path))

        # Apply Offset - Only adjust instrumental, vocals stay fixed
        if body.offset_ms != 0:
            silence = AudioSegment.silent(duration=abs(body.offset_ms))
            instr_audio = silence + instr_audio

        # Overlay
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
        raise HTTPException(status_code=500, detail=str(e))