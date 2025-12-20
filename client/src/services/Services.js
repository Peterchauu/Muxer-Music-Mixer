import axios from "axios";

const DEEZER_BASE_URL = "http://localhost:8080/api/deezer";
const MIXER_BASE_URL = "http://localhost:8080/api/mixer";


export const musicService = {


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



  splitTrack: async (trackUrl) => {
    try {
      const response = await axios.post(`${MIXER_BASE_URL}/split`, {
        track_url: trackUrl
      });
      return response.data;
    } catch (error) {
      console.error("Error splitting track:", error);
      throw error;
    }
  },



  adjustBPM: async (sessionId, targetBPM, originalBPM) => {
    try {
      const response = await axios.post(`${MIXER_BASE_URL}/adjust-bpm`, {
        session_id: sessionId,
        target_bpm: targetBPM,
        original_bpm: originalBPM
      });
      return response.data;
    } catch (error) {
      console.error("Error adjusting BPM:", error);
      throw error;
    }
  },



  finalizeMix: async (sessionA, sessionB, offsetMs) => {
    try {
      const response = await axios.post(`${MIXER_BASE_URL}/finalize`, {
        session_id_vocals: sessionA,
        session_id_instr: sessionB,
        offset_ms: parseInt(offsetMs) || 0
      });

      // returns { mix_url, title }
      return response.data; 
    } catch (error) {
      console.error("Error creating mix:", error);
      throw error;
    }
  }
};