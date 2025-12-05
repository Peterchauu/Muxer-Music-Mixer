import { ref, set, remove, get, child } from "firebase/database";
import { db } from "./firebaseInit";

export const likeService = {
  // Save a song to the user's "likes" node
  // structure: users/{userId}/likes/{trackId}
  likeTrack: async (userId, track) => {
    try {
      const likeRef = ref(db, `users/${userId}/likes/${track.id}`);
      
      // We save just enough info to display it in a list later
      await set(likeRef, {
        id: track.id,
        title: track.title,
        artist: track.artist.name,
        album: {
            cover_medium: track.album.cover_medium,
            cover_small: track.album.cover_small || track.album.cover_medium
        },
        preview: track.preview,
        savedAt: Date.now()
      });
      console.log(`Liked track ${track.id}`);
    } catch (error) {
      console.error("Error liking track:", error);
      throw error;
    }
  },

  // Remove the specific track ID
  unlikeTrack: async (userId, trackId) => {
    try {
      const likeRef = ref(db, `users/${userId}/likes/${trackId}`);
      await remove(likeRef);
      console.log(`Unliked track ${trackId}`);
    } catch (error) {
      console.error("Error unliking track:", error);
      throw error;
    }
  },

  // Get all liked tracks for the user
  getLikedTracks: async (userId) => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${userId}/likes`));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert the object { id1: {...}, id2: {...} } into an array
        return Object.values(data);
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error fetching liked tracks:", error);
      return [];
    }
  }
};