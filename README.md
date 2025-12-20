# Muxer Music Mixer

A web-based music mixing application with AI-powered stem separation and BPM synchronization.

## Features

- Dual-deck mixer interface
- AI-powered stem separation using Demucs
- Real-time BPM synchronization with pitch preservation
- Independent volume and offset controls
- Modern, responsive UI with React + Tailwind CSS

## Techonology

**Frontend:**
- React + Vite
- Tailwind CSS
- Axios for API calls

**Backend:**
- FastAPI (Python)
- Demucs for stem separation
- RubberBand for pitch-preserving time-stretching
- Librosa for BPM detection

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- Python 3.9+
- PowerShell (Windows)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Create and activate a virtual environment (optional but recommended):
```bash
python -m venv venv
.\venv\Scripts\Activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. **Install RubberBand library** (required for BPM sync):
```bash
.\setup_rubberband.ps1
```
This script will download and configure the RubberBand library needed for pitch-preserving time-stretching.

5. Start the backend server:
```bash
python -m uvicorn app.main:app --reload --port 8080
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173` or by clicking the domain that npm provides in the CLI

## Usage

1. Search for songs using the search bar
2. Load songs into Deck A (vocals) and Deck B (instrumental)
3. The app will automatically separate stems using DEMUCS 
4. Use the "Auto-Sync BPM" button to match tempos with minimal pitch distortion
5. Adjust offset, volume, and other parameters to create your mix

## Important Notes

library
- The server automatically configures the PATH to use RubberBand during runtime
- Stem separation happens server-side and may take 30-60 seconds per song
- Temporary stems are stored in `server/temp_stems/`
