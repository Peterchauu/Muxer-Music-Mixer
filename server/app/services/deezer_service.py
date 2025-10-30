import requests
from typing import Dict

#api search query for Deezer song library

class DeezerService:
    BASE_URL = "https://api.deezer.com"

    @staticmethod
    async def search_tracks(query: str, index: int = 0) -> Dict:
        try:
            params = {
                "q": query,
                "index": index,
                "limit": 20,
                "order": "RANKING" 
            }
            print(f"Requesting Deezer API with params: {params}")
            
            response = requests.get(f"{DeezerService.BASE_URL}/search", params=params)
            response.raise_for_status()
            
            data = response.json()
            return data
        except requests.RequestException as e:
            raise Exception(f"Deezer API error: {str(e)}")