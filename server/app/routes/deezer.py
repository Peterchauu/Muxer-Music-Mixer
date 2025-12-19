from fastapi import APIRouter, HTTPException
from ..services.deezer_service import DeezerService



router = APIRouter()

@router.get("/search")
async def search_tracks(query: str, page: int = 1):
    try:
        index = (page - 1) * 20
        results = await DeezerService.search_tracks(query, index)
        return results
    except Exception as e:
        print(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))