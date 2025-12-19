import { db } from "./firebaseInit";
import { ref, set, get, child, remove } from "firebase/database";




export const playlistService = {


  // Save playlists to Firebase (only storing track IDs)
  savePlaylists: async (userId, playlists) => {
    try {
      if (!playlists || !Array.isArray(playlists)) {
        console.log("No playlists to save");
        return;
      }

      const playlistsRef = ref(db, `users/${userId}/playlists`);
      
      // Transform playlists to only include track IDs
      const playlistsData = playlists.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        icon: playlist.icon || null,
        trackIds: (playlist.tracks || []).map(track => track.id), // Only store track IDs
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt
      }));
      
      await set(playlistsRef, playlistsData);
      console.log("Playlists synced to database!");
    } catch (e) {
      throw e;
    }
  },



  // Load playlists from Firebase adn localstorage
  loadPlaylists: async (userId) => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${userId}/playlists`));
      
      if (snapshot.exists()) {
        const playlistsData = snapshot.val();
        
        if (!Array.isArray(playlistsData)) {
          return [];
        }
        
        // Get all tracks from localStorage
        const localTracks = JSON.parse(localStorage.getItem('cachedTracks') || '{}');
        
        // Fill playlists with full track data
        const filledPlaylists = playlistsData.map(playlist => ({
          ...playlist,
          tracks: (playlist.trackIds || []).map(trackId => {
            // Try to find track in local cache
            return localTracks[trackId] || {
              id: trackId,
              title: "Unknown Track",
              artist: { name: "Unknown Artist" },
              album: { cover_small: "", cover_medium: "" },
              duration: 0,
              preview: ""
            };
          })
        }));
        return filledPlaylists;
      }
      return [];
    } catch (e) {
      return [];
    }
  },



  // Delete playlists for a user
  deletePlaylists: async (userId) => {
    try {
      const playlistsRef = ref(db, `users/${userId}/playlists`);
      await remove(playlistsRef);
    } catch (e) {
      throw e;
    }
  }
};
