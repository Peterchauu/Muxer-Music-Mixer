# Muxer Music Mixer - Setup Guide

## Quick Start for New Developers

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Muxer-Music-Mixer
```

### 2. Backend Setup (Windows)

#### Install Python Dependencies
```bash
cd server
pip install -r requirements.txt
```

#### Install RubberBand Library
**Important:** RubberBand is required for pitch-preserving BPM synchronization.

Run the setup script:
```powershell
.\setup_rubberband.ps1
```

This script will:
- Download RubberBand 3.3.0 executable for Windows
- Extract it to `server/rubberband/`
- Install the `pyrubberband` Python wrapper

**Note:** The RubberBand binaries are NOT committed to the repo (they're in `.gitignore`). Every developer needs to run this setup script once.

#### Start the Backend Server
```bash
python -m uvicorn app.main:app --reload --port 8080
```

The server will run on `http://localhost:8080`

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Architecture Overview

### Backend (FastAPI)
- **Stem Separation**: Uses Demucs (htdemucs model) to separate vocals and instrumentals
- **BPM Detection**: Librosa for tempo analysis
- **Time-Stretching**: RubberBand via pyrubberband for pitch-preserving BPM adjustment
- **Threading**: ThreadPoolExecutor for CPU-intensive tasks (max 2 workers)

### Frontend (React + Vite)
- **UI Framework**: React with Tailwind CSS
- **State Management**: Context API for audio and authentication
- **API Client**: Axios for backend communication

## Key Features

1. **Dual-Deck Mixer**: Load different songs on Deck A (vocals) and Deck B (instrumental)
2. **AI Stem Separation**: Automatic separation using Demucs
3. **BPM Sync**: Auto-sync button matches BPMs without pitch distortion
4. **Offset Control**: ±20 beats of fine-tuning
5. **Volume Controls**: Independent volume for each deck

## Troubleshooting

### "Failed to execute rubberband" Error
This means the RubberBand library wasn't installed properly. Run:
```powershell
cd server
.\setup_rubberband.ps1
```

### Import Error: pyrubberband
Install the Python package:
```bash
pip install pyrubberband==0.3.0
```

### Demucs Model Download
On first run, Demucs will download the htdemucs model (~3GB). This happens automatically but requires internet connection.

## File Structure

```
Muxer-Music-Mixer/
├── client/               # React frontend
│   ├── src/
│   │   ├── WebPages/     # Main pages (MusicMixer, etc.)
│   │   ├── context/      # React context providers
│   │   ├── services/     # API service layer
│   │   └── MusicBar/     # Audio control components
│   └── package.json
│
└── server/               # FastAPI backend
    ├── app/
    │   ├── routes/       # API endpoints
    │   │   ├── mixer.py  # Stem separation & BPM adjustment
    │   │   └── deezer.py # Music search integration
    │   └── main.py       # FastAPI app entry point
    ├── pretrained_models/ # Demucs models cache
    ├── temp_stems/       # Temporary separated audio files
    ├── rubberband/       # RubberBand binaries (not in git)
    ├── requirements.txt
    └── setup_rubberband.ps1
```

## Development Notes

- **Stem Storage**: Temporary stems are stored in `server/temp_stems/` with UUID-based session IDs
- **Audio Format**: Stems are saved as WAV files at 44.1kHz
- **BPM Adjustment**: Time-stretching ratio = target_bpm / original_bpm
- **PATH Configuration**: The server automatically adds RubberBand to PATH at runtime (see `mixer.py`)

## API Endpoints

- `POST /separate`: Separate a track into vocal and instrumental stems
- `POST /adjust-bpm`: Time-stretch a track to match target BPM
- `GET /stream/{session_id}/{stem_type}`: Stream separated stems
- Additional endpoints in `deezer.py` for music search

## Contributing

1. Create a feature branch
2. Make your changes
3. Test with both frontend and backend running
4. Submit a pull request

## License

[Add your license here]
