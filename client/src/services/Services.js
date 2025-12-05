// src/services/Services.js
import axios from "axios";

const DEEZER_BASE_URL = "http://localhost:8080/api/deezer"; // Adjust if needed
const MIXER_BASE_URL = "http://localhost:8080/api/mixer";

export const musicService = {
  // Existing search
  searchTracks: async (query, page = 1) => {
    try {
      const response = await axios.get(`${DEEZER_BASE_URL}/search`, {
        params: { query, page },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching tracks:", error);
      throw error;
    }
  },

  // NEW: Call Python backend to split stems
  splitTrack: async (trackUrl) => {
    try {
      // Req 12 & 20: Sends track to backend for processing
      const response = await axios.post(`${MIXER_BASE_URL}/split`, {
        track_url: trackUrl
      });
      // Returns { session_id, vocals_url, accompaniment_url }
      return response.data;
    } catch (error) {
      console.error("Error splitting track:", error);
      throw error;
    }
  }
};