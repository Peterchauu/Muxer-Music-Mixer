import { db } from "./firebaseInit";
import { ref, set, get, child, update, remove } from "firebase/database";




export const trackService = {

  
  // Like a track and create/update track data
  likeTrack: async (userId, track) => {
    try {
      const trackRef = ref(db, `users/${userId}/tracks/${track.id}`);
      const snapshot = await get(trackRef);
      
      const trackData = {
        trackId: track.id,
        title: track.title,
        artist: track.artist.name,
        albumCover: track.album.cover_medium,
        preview: track.preview,
        duration: track.duration,
        isLiked: true,
        likedAt: Date.now(),
        ...(snapshot.exists() ? {
          vocalsCount: snapshot.val().vocalsCount || 0,
          instrumentalCount: snapshot.val().instrumentalCount || 0,
          lastUsed: snapshot.val().lastUsed || null
        } : {
          vocalsCount: 0,
          instrumentalCount: 0,
          lastUsed: null
        })
      };
      
      await set(trackRef, trackData);
    } catch (e) {
      throw e;
    }
  },



  // Unlike a track
  unlikeTrack: async (userId, trackId) => {
    try {
      const trackRef = ref(db, `users/${userId}/tracks/${trackId}`);
      const snapshot = await get(trackRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Only delete if track has no usage stats, otherwise just mark as unliked
        if ((data.vocalsCount || 0) === 0 && (data.instrumentalCount || 0) === 0) {
          await remove(trackRef);
        } else {
          await update(trackRef, {
            isLiked: false,
            likedAt: null
          });
        }
      }
    } catch (e) {
      throw e;
    }
  },



  // Get all liked tracks for a user
  getLikedTracks: async (userId) => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${userId}/tracks`));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const likedTracks = [];
        Object.values(data).forEach((track) => {
          if (track.isLiked) {
            likedTracks.push(track);
          }
        });
        return likedTracks;
      }
      return [];
    } catch (e) {
      return [];
    }
  },



  // Increment track usage count for either vocal or instrumental
  incrementTrackUsage: async (userId, track, usageType) => {
    try {
      const trackRef = ref(db, `users/${userId}/tracks/${track.id}`);
      const snapshot = await get(trackRef);
      const field = usageType === 'vocals' ? 'vocalsCount' : 'instrumentalCount';
      
      if (snapshot.exists()) {
        // track exists, increment the count
        const currentCount = snapshot.val()[field] || 0;
        await update(trackRef, {
          [field]: currentCount + 1,
          lastUsed: Date.now()
        });
      } else {
        // track doesn't exist, create it
        const trackData = {
          trackId: track.id,
          title: track.title,
          artist: track.artist.name,
          albumCover: track.album.cover_medium,
          preview: track.preview,
          duration: track.duration,
          isLiked: false,
          likedAt: null,
          vocalsCount: usageType === 'vocals' ? 1 : 0,
          instrumentalCount: usageType === 'instrumental' ? 1 : 0,
          lastUsed: Date.now()
        };
        await set(trackRef, trackData);
      }
    } catch (e) {
      throw e;
    }
  },



  // Get track data (stats and like status)
  getTrackData: async (userId, trackId) => {
    try {
      const trackRef = ref(db, `users/${userId}/tracks/${trackId}`);
      const snapshot = await get(trackRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return { 
        isLiked: false,
        vocalsCount: 0, 
        instrumentalCount: 0 
      };
    } catch (e) {
      return { 
        isLiked: false,
        vocalsCount: 0, 
        instrumentalCount: 0 
      };
    }
  },



  // Get all user track data (likes and usage)
  getAllUserTracks: async (userId) => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${userId}/tracks`));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const trackData = {};
        
        Object.entries(data).forEach(([trackId, track]) => {
          trackData[trackId] = {
            isLiked: track.isLiked || false,
            vocalsCount: track.vocalsCount || 0,
            instrumentalCount: track.instrumentalCount || 0,
            lastUsed: track.lastUsed
          };
        });
        return trackData;
      }
      return {};
    } catch (e) {
      return {};
    }
  }
};
