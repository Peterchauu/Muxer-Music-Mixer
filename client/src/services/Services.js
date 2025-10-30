const API_BASE_URL = 'http://localhost:8000/api/deezer';

export const musicService = {
    searchTracks: async (query, page = 1) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API Response:', {
                page,
                results: data.data?.length,
                total: data.total
            });
            
            return data;
        } catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    }
};