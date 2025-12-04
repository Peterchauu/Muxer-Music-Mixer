const API_BASE_URL = 'http://localhost:8000/api/deezer';

export const musicService = {
    searchTracks: async (query, page = 1) => {
        const url = `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}`;
        console.log('Making request to:', url);
        
        try {
            const response = await fetch(url);
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            return data;
        } catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
};