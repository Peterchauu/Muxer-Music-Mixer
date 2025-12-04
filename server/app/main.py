from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import deezer

import uvicorn
app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(deezer.router, prefix="/api/deezer", tags=["deezer"])

if __name__ == "__main__":
    uvicorn.run(debug=True, port=8080)