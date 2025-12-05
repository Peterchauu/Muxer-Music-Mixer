// src/services/likeService.js
import { db } from "./firebaseInit";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";

export const likeService = {
  // Like a track
  likeTrack: async (userId, track) => {
    try {
      const likeRef = doc(db, "likes", `${userId}_${track.id}`);
      const likeData = {
        userId,
        trackId: track.id,
        title: track.title,
        artist: track.artist.name,
        albumCover: track.album.cover_medium,
        preview: track.preview,
        duration: track.duration,
        likedAt: new Date().toISOString()
      };
      await setDoc(likeRef, likeData);
    } catch (error) {
      console.error("Error liking track:", error);
      throw error;
    }
  },

  // Unlike a track
  unlikeTrack: async (userId, trackId) => {
    try {
      const likeRef = doc(db, "likes", `${userId}_${trackId}`);
      await deleteDoc(likeRef);
    } catch (error) {
      console.error("Error unliking track:", error);
      throw error;
    }
  },

  // Get all liked tracks for a user
  getLikedTracks: async (userId) => {
    try {
      const likesRef = collection(db, "likes");
      const q = query(likesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const likedTracks = [];
      querySnapshot.forEach((doc) => {
        likedTracks.push(doc.data());
      });
      
      return likedTracks;
    } catch (error) {
      console.error("Error fetching liked tracks:", error);
      throw error;
    }
  },

  // Check if a track is liked
  isTrackLiked: async (userId, trackId) => {
    try {
      const likesRef = collection(db, "likes");
      const q = query(
        likesRef, 
        where("userId", "==", userId),
        where("trackId", "==", trackId)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking if track is liked:", error);
      return false;
    }
  }
};
