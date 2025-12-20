# server/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import deezer, mixer
import uvicorn
from pathlib import Path
from multiprocessing import freeze_support


BASE_DIR = Path(__file__).resolve().parent
STEMS_DIR = (BASE_DIR / ".." / "temp_stems").resolve()
STEMS_DIR.mkdir(parents=True, exist_ok=True)


app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Routers
app.include_router(deezer.router, prefix="/api/deezer", tags=["deezer"])
app.include_router(mixer.router, prefix="/api/mixer", tags=["mixer"])



# Simple health check
@app.get("/health", tags=["default"])
async def health_check():
    return {"status": "ok"}



# Serve generated stems (Option B)
app.mount("/stems", StaticFiles(directory=STEMS_DIR), name="stems")



if __name__ == "__main__":
    freeze_support()  # Required for Windows multiprocessing (Spleeter/TensorFlow)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8080, reload=True)
