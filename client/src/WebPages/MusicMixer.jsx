import React, { useState, useEffect, useRef } from 'react';
import { musicService } from '../services/Services';
import { trackService } from '../services/trackService';
import { useAudio } from '../context/AudioContext';
import { useMixer } from '../context/MixerContext';
import { useAuth } from '../context/AuthContext';
import TrackCard from '../components/TrackCard';
import playIcon from '../assets/play-solid-full.svg';
import pauseIcon from '../assets/pause-solid-full.svg';


const SERVER_URL = "http://localhost:8080";

function MusicMixer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalTracks, setTotalTracks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('popularity-high');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { currentUser } = useAuth();

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [notification, setNotification] = useState(null);
  const [likedTracks, setLikedTracks] = useState([]);
  const [trackData, setTrackData] = useState({});
  const [flippedCards, setFlippedCards] = useState([]);
  
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [mixTitle, setMixTitle] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState('');

  const totalPages = Math.ceil(totalTracks / 20);

  const { currentTrack, isPlaying, playFromQueue, showMusicBar } = useAudio();

  // --- load MIXER state from context ---
  const {
    mixerSlotA,
    setMixerSlotA,
    mixerSlotB,
    setMixerSlotB,
    offsetMs,
    setOffsetMs,
    detectedBPM,
    setDetectedBPM,
    bpmMultiplier,
    setBpmMultiplier,
    isMixerPlaying,
    setIsMixerPlaying,
    audioVocalRef,
    audioInstrRef,
    delayTimeoutRef,
  } = useMixer();

  // Local processing states
  const [isProcessingA, setIsProcessingA] = useState(false);
  const [isProcessingB, setIsProcessingB] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- Mixer Logic ---

  const loadIntoMixer = async (track, slot) => {
    // Use preview URL or full URL if available
    const trackUrl = track.preview; 



    if (slot === 'A') {
      setIsProcessingA(true);
      // Reset BPM display when loading new stem
      setDetectedBPM(null);
      setBpmMultiplier("1x");
      try {
        const stems = await musicService.splitTrack(trackUrl);
        setMixerSlotA({ ...track, stems, bpm: stems.bpm });
        audioVocalRef.current.src = `${SERVER_URL}${stems.vocals_url}`;
        audioVocalRef.current.load();
        
        // Add to Recents playlist
        addStemmedTrackToRecents(track);
        
        // Track usage statistics a user is signed in, referencing users' ID
        if (currentUser) {
          await trackService.incrementTrackUsage(currentUser.uid, track, 'vocals');
          const updatedData = await trackService.getTrackData(currentUser.uid, track.id);
          setTrackData(prev => ({ ...prev, [track.id]: updatedData }));
        }
        
      } catch (e) {
        showNotification("Failed to split vocals");
      } finally {
        setIsProcessingA(false);
      }
    } else {
      setIsProcessingB(true);
      setDetectedBPM(null);
      setBpmMultiplier("1x");
      try {
        const stems = await musicService.splitTrack(trackUrl);
        setMixerSlotB({ ...track, stems, bpm: stems.bpm });
        audioInstrRef.current.src = `${SERVER_URL}${stems.instrumental_url}`;
        audioInstrRef.current.load();

        // Add to Recents playlist
        addStemmedTrackToRecents(track);

        // Track usage statistics
        if (currentUser) {
          await trackService.incrementTrackUsage(currentUser.uid, track, 'instrumental');
          const updatedData = await trackService.getTrackData(currentUser.uid, track.id);
          setTrackData(prev => ({ ...prev, [track.id]: updatedData }));
        }

      } catch (e) {
        showNotification("Failed to split instrumental");
      } finally {
        setIsProcessingB(false);
      }
    }
  };



  const toggleMixerPlay = () => {
    if (isMixerPlaying) {
      // Clear any pending delayed play
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
      
      audioVocalRef.current.pause();
      audioInstrRef.current.pause();
      setIsMixerPlaying(false);
    } else {
      // Pause both tracks first
      audioVocalRef.current.pause();
      audioInstrRef.current.pause();
      
      // Reset to beginning
      audioVocalRef.current.currentTime = 0;
      audioInstrRef.current.currentTime = 0;
      
      // Set initial volume to 0 for fade-in effect
      audioVocalRef.current.volume = 0;
      audioInstrRef.current.volume = 0;
      
      // Fade in function
      const fadeIn = (audioElement) => {
        let volume = 0;
        const fadeInterval = setInterval(() => {
          if (volume < 1) {
            volume += 0.1; // Increase by 10% each step
            audioElement.volume = Math.min(volume, 1);
          } else {
            clearInterval(fadeInterval);
          }
        }, 50); // Every 50ms, full fade-in takes 500ms
      };
      
      // Apply offset and start playback
      if (offsetMs > 0) {
        // Positive offset: instrumental plays LATE
        // Play vocals normally, delay instrumental using setTimeout
        audioVocalRef.current.play();
        fadeIn(audioVocalRef.current);
        
        delayTimeoutRef.current = setTimeout(() => {
          audioInstrRef.current.play();
          fadeIn(audioInstrRef.current);
        }, offsetMs);
      } else if (offsetMs < 0) {
        // Negative offset: instrumental plays EARLY  
        // Play instrumental normally, delay vocals using setTimeout
        audioInstrRef.current.play();
        fadeIn(audioInstrRef.current);
        
        delayTimeoutRef.current = setTimeout(() => {
          audioVocalRef.current.play();
          fadeIn(audioVocalRef.current);
        }, Math.abs(offsetMs));
      } else {
        // No offset - play both from beginning
        audioVocalRef.current.play();
        audioInstrRef.current.play();
        fadeIn(audioVocalRef.current);
        fadeIn(audioInstrRef.current);
      }

      setIsMixerPlaying(true);
    }
  };



  const handleAutoSync = async () => {
    if (mixerSlotA && mixerSlotB) {
        // Pause playback during sync
        if (isMixerPlaying) {
          audioVocalRef.current.pause();
          audioInstrRef.current.pause();
          setIsMixerPlaying(false);
        }
        
        // Show updating status
        setIsUpdating(true);
        
        // Reset both to beginning
        audioVocalRef.current.currentTime = 0;
        audioInstrRef.current.currentTime = 0;
        
        // Get the real BPMs - A is vocals (stays fixed), B is instrumental (gets adjusted)
        const bpmVocals = mixerSlotA.bpm || 0;
        const bpmInstr = mixerSlotB.bpm || 0;
        
        // Smart BPM matching: choose between 1x or 2x vocals BPM (whichever is closer)
        const targetBPM1x = bpmVocals;
        const targetBPM2x = bpmVocals * 2;
        const diff1x = Math.abs(bpmInstr - targetBPM1x);
        const diff2x = Math.abs(bpmInstr - targetBPM2x);
        
        const targetBPM = diff1x <= diff2x ? targetBPM1x : targetBPM2x;
        const multiplier = diff1x <= diff2x ? "1x" : "2x";
        
        // Set master BPM to the actual target and store multiplier
        setDetectedBPM(targetBPM);
        setBpmMultiplier(multiplier);
        
        try {
   
          // Request server-side BPM adjustment (time-stretching without pitch change)
          const response = await musicService.adjustBPM(
            mixerSlotB.stems.session_id,
            targetBPM,
            bpmInstr
          );
          
          // Load the adjusted instrumental stem
          audioInstrRef.current.src = `${SERVER_URL}${response.adjusted_url}`;
          audioInstrRef.current.load();
          audioVocalRef.current.playbackRate = 1.0;
          audioInstrRef.current.playbackRate = 1.0;
          
          const difference = Math.abs(targetBPM - bpmInstr);
          showNotification(`Synced to ${multiplier} vocals (${targetBPM} BPM). Instrumental time-stretched from ${bpmInstr} BPM (Δ${difference})`);
        } catch (e) {
          showNotification("Failed to adjust BPM");
        }
        
        // Clear updating status
        setTimeout(() => setIsUpdating(false), 1000);
    } else {
        showNotification("Please load songs into both decks first.");
    }
  };

  const handleOffsetChange = (newOffset) => {
    // Pause playback when offset is adjusted
    if (isMixerPlaying) {
      audioVocalRef.current.pause();
      audioInstrRef.current.pause();
      setIsMixerPlaying(false);
    }
    
    // Show updating status
    setIsUpdating(true);
    
    // Reset both to beginning
    audioVocalRef.current.currentTime = 0;
    audioInstrRef.current.currentTime = 0;
    
    // Update offset
    setOffsetMs(newOffset);
    
    // Clear updating status
    setTimeout(() => setIsUpdating(false), 300);
  };



  // Get the current beat interval for snapping
  const getCurrentBeatInterval = () => {
    const bpm = detectedBPM || 120; // Default to 120 if no BPM set
    if (!bpm || bpm === 0) return 500; // Default to 120 BPM (500ms per beat)
    return (60000 / bpm); // 60,000 ms per minute / BPM = ms per beat
  };



  // --- ORIGINAL HELPER FUNCTIONS ---

  const sortTracks = (tracksArray, option) => {
    if (!tracksArray) return [];
    const sorted = [...tracksArray];
    switch (option) {
      case 'popularity-high': return sorted.sort((a, b) => b.rank - a.rank);
      case 'popularity-low': return sorted.sort((a, b) => a.rank - b.rank);
      case 'title-asc': return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'artist-asc': return sorted.sort((a, b) => a.artist.name.localeCompare(b.artist.name));
      default: return sorted;
    }
  };



  const fetchTracks = async (page, query = searchQuery) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await musicService.searchTracks(query, page);
      if (!data.data || data.data.length === 0) {
        setError('No results found :(');
        setTracks([]);
        setTotalTracks(0);
        return;
      }
      const sortedTracks = sortTracks(data.data, sortOption);
      setTracks(sortedTracks);
      setTotalTracks(data.total);
      
      // Cache tracks to localStorage for playlist hydration
      const cachedTracks = JSON.parse(localStorage.getItem('cachedTracks') || '{}');
      sortedTracks.forEach(track => {
        cachedTracks[track.id] = track;
      });
      localStorage.setItem('cachedTracks', JSON.stringify(cachedTracks));
    } catch (e) {
      setError('Unable to fetch tracks.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setCurrentPage(1);
    sessionStorage.setItem('musicMixerSearch', JSON.stringify({ query: searchQuery, page: 1 }));
    await fetchTracks(1, searchQuery);
  };



  const handlePrevPage = async () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      sessionStorage.setItem('musicMixerSearch', JSON.stringify({ query: searchQuery, page: newPage }));
      await fetchTracks(newPage);
    }
  };



  const handleNextPage = async () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      sessionStorage.setItem('musicMixerSearch', JSON.stringify({ query: searchQuery, page: newPage }));
      await fetchTracks(newPage);
    }
  };



  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };



  const handleLikeToggle = async (e, track) => {
    e.stopPropagation();
    if (!currentUser) {
      showNotification("Please sign in to like songs");
      return;
    }

    const isLiked = likedTracks.includes(track.id);
    
    // Optimistic update: Update UI immediately
    if (isLiked) {
      setLikedTracks(prev => prev.filter(id => id !== track.id));
      setTrackData(prev => ({
        ...prev,
        [track.id]: { ...prev[track.id], isLiked: false }
      }));
      showNotification("Removed from liked songs");
    } else {
      setLikedTracks(prev => [...prev, track.id]);
      setTrackData(prev => ({
        ...prev,
        [track.id]: { ...prev[track.id], isLiked: true }
      }));
      showNotification("Added to liked songs");
    }

    // Background database update
    try {
      if (isLiked) {
        await trackService.unlikeTrack(currentUser.uid, track.id);
      } else {
        await trackService.likeTrack(currentUser.uid, track);
      }
    } catch (e) {
      // Rollback on error, don't update the like on card visually if not updated on firebase
      if (isLiked) {
        setLikedTracks(prev => [...prev, track.id]);
        setTrackData(prev => ({
          ...prev,
          [track.id]: { ...prev[track.id], isLiked: true }
        }));
      } else {
        setLikedTracks(prev => prev.filter(id => id !== track.id));
        setTrackData(prev => ({
          ...prev,
          [track.id]: { ...prev[track.id], isLiked: false }
        }));
      }
      showNotification("Failed to update song's like status");
    }
  };



  useEffect(() => {
    const loadTrackData = async () => {
      if (currentUser) {
        try {
          const allTrackData = await trackService.getAllUserTracks(currentUser.uid);
          setTrackData(allTrackData);
          const likedIds = Object.entries(allTrackData).filter(([_, data]) => data.isLiked).map(([trackId, _]) => trackId);
          setLikedTracks(likedIds);
        } catch (e) {
          showNotification("Failed to load user tracks.");
        }
      } else {
        setLikedTracks([]);
        setTrackData({});
      }
    };
    loadTrackData();
  }, [currentUser]);



  const handleCardClick = (e, trackId) => {
    if (e.target.closest('button')) return;
    setFlippedCards(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };



  const handleRightClick = (e, track) => {
    e.preventDefault();
    setSelectedTrack(track);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };



  const addToPlaylist = async (playlist, track) => {
    const trackExists = playlist.tracks.some((t) => t.id === track.id);
    if (trackExists) {
      showNotification(`"${track.title}" is already in "${playlist.name}"`);
      return;
    }
    
    // Cache track to localStorage for future hydration
    const cachedTracks = JSON.parse(localStorage.getItem('cachedTracks') || '{}');
    cachedTracks[track.id] = track;
    localStorage.setItem('cachedTracks', JSON.stringify(cachedTracks));
    
    // Update playlists in localStorage
    const existing = JSON.parse(localStorage.getItem('userPlaylists') || '[]');
    const updatedPlaylists = existing.map((p) =>
      p.id == playlist.id
        ? { ...p, tracks: [...p.tracks, track], updatedAt: new Date().toISOString() }
        : p
    );
    
    // Save to localStorage
    localStorage.setItem('userPlaylists', JSON.stringify(updatedPlaylists));
    
    // Update state
    setPlaylists(updatedPlaylists);
    
    // Sync to Firebase immediately if logged in
    if (currentUser) {
      try {
        const { playlistService } = await import('../services/playlistService');
        await playlistService.savePlaylists(currentUser.uid, updatedPlaylists);
        console.log('Synced playlists to Firebase');
      } catch (error) {
        console.error('Error syncing to Firebase:', error);
      }
    }
    
    window.dispatchEvent(new CustomEvent('playlistsUpdated', { detail: { playlists: updatedPlaylists } }));
    
    showNotification(`"${track.title}" added to playlist "${playlist.name}"`);
    setShowPlaylistMenu(false);
    setShowContextMenu(false);
  };



  const handleFinalizeMix = () => {
    if (!mixerSlotA || !mixerSlotB) {
      showNotification("Please load both decks first!");
      return;
    }
    // Set default title and show modal for user to save new mix into a playlist
    setMixTitle(`Mashup: ${mixerSlotA.title} x ${mixerSlotB.title}`);
    setSelectedPlaylist('');
    setShowFinalizeModal(true);
  };
  


  const confirmFinalizeMix = async () => {
    showNotification("Mixing, please wait");
    setShowFinalizeModal(false);
    
    try {
      const result = await musicService.finalizeMix(
        mixerSlotA.stems.session_id, 
        mixerSlotB.stems.session_id,
        offsetMs
      );
      
      const newMixTrack = {
        id: `mix_${Date.now()}`,
        title: mixTitle || `Mashup: ${mixerSlotA.title} x ${mixerSlotB.title}`,
        artist: { name: currentUser?.displayName || "My Custom Mix" },
        album: { 
          cover_small: mixerSlotA.album.cover_small, 
          cover_medium: mixerSlotA.album.cover_medium 
        },
        duration: Math.max(mixerSlotA.duration || 0, mixerSlotB.duration || 0),
        preview: `${SERVER_URL}${result.mix_url}`,
        bpm: detectedBPM || Math.max(mixerSlotA.bpm || 0, mixerSlotB.bpm || 0),
        isLocalMix: true
      };

      // Always save to recents first
      await saveToRecents(newMixTrack);
      
      // Then save to selected playlist if it's not recents
      if (selectedPlaylist && selectedPlaylist !== 'recents') {
        const existing = JSON.parse(localStorage.getItem('userPlaylists') || '[]');
        const selectedPlaylistObj = existing.find(p => p.id == selectedPlaylist);
        await saveToPlaylist(selectedPlaylist, newMixTrack);
        showNotification(`Mix added to Recents and ${selectedPlaylistObj?.name || 'playlist'}!`);
      } else {
        showNotification("Mix added to Recents!");
      }

    } catch (e) {
      console.error('Error finalizing mix:', e);
      showNotification("Failed to create mix.");
    }
  };



  const saveToRecents = async (mixTrack) => {
    try {
      const existing = JSON.parse(localStorage.getItem('userPlaylists') || '[]');
      
      let recentsIdx = existing.findIndex(p => p.name === "Recents");
      let recents;

      if (recentsIdx === -1) {
        recents = {
          id: 'playlist_recents',
          name: "Recents",
          icon: null, 
          tracks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        existing.unshift(recents);
        recentsIdx = 0;
      } else {
        recents = existing[recentsIdx];
      }
      if (!recents.tracks.some(t => t.id === mixTrack.id)) {
        // Cache track to localStorage
        const cachedTracks = JSON.parse(localStorage.getItem('cachedTracks') || '{}');
        cachedTracks[mixTrack.id] = mixTrack;
        localStorage.setItem('cachedTracks', JSON.stringify(cachedTracks));
        
        recents.tracks.unshift(mixTrack);
        recents.updatedAt = new Date().toISOString();
        
        existing[recentsIdx] = recents;
        localStorage.setItem('userPlaylists', JSON.stringify(existing));
        setPlaylists(existing);
        
        // Sync to Firebase
        if (currentUser) {
          const { playlistService } = await import('../services/playlistService');
          await playlistService.savePlaylists(currentUser.uid, existing);
        }
        
        window.dispatchEvent(new CustomEvent('playlistsUpdated', { detail: { playlists: existing } }));
      }
    } catch (e) {
      console.error('Error adding to recents:', e);
    }
  };
  


  const addStemmedTrackToRecents = (track) => {
    try {
      // Cache track to localStorage for future hydration
      const cachedTracks = JSON.parse(localStorage.getItem('cachedTracks') || '{}');
      cachedTracks[track.id] = track;
      localStorage.setItem('cachedTracks', JSON.stringify(cachedTracks));
      

      const existing = JSON.parse(localStorage.getItem('userPlaylists') || '[]');
      
      let recentsIdx = existing.findIndex(p => p.name === "Recents");
      let recents;

      if (recentsIdx === -1) {
        recents = {
          id: 'playlist_recents',
          name: "Recents",
          icon: null, 
          tracks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        existing.unshift(recents);
        recentsIdx = 0;
      } else {
        recents = existing[recentsIdx];
      }

      // Check if track already exists in recents
      if (!recents.tracks.some(t => t.id === track.id)) {
        recents.tracks.unshift(track);
        recents.updatedAt = new Date().toISOString();
        
        existing[recentsIdx] = recents;
        localStorage.setItem('userPlaylists', JSON.stringify(existing));
        setPlaylists(existing);
        
        window.dispatchEvent(new CustomEvent('playlistsUpdated', { detail: { playlists: existing } }));
      }
    } catch (e) {
      console.error('Error adding stemmed track to recents:', e);
    }
  };
  


  const saveToPlaylist = async (playlistId, mixTrack) => {
    try {
      // Cache track to localStorage
      const cachedTracks = JSON.parse(localStorage.getItem('cachedTracks') || '{}');
      cachedTracks[mixTrack.id] = mixTrack;
      localStorage.setItem('cachedTracks', JSON.stringify(cachedTracks));
      

      const existing = JSON.parse(localStorage.getItem('userPlaylists') || '[]');
      const playlistIdx = existing.findIndex(p => p.id == playlistId); 
      
      if (playlistIdx !== -1) {
        const playlist = existing[playlistIdx];
        
        // Check if track already exists to avoid duplicates
        if (!playlist.tracks.some(t => t.id === mixTrack.id)) {
          playlist.tracks.unshift(mixTrack);
          playlist.updatedAt = new Date().toISOString();
          existing[playlistIdx] = playlist;
          localStorage.setItem('userPlaylists', JSON.stringify(existing));
          setPlaylists(existing);
          
          // Sync to Firebase
          if (currentUser) {
            const { playlistService } = await import('../services/playlistService');
            await playlistService.savePlaylists(currentUser.uid, existing);
          }
          
          window.dispatchEvent(new CustomEvent('playlistsUpdated', { detail: { playlists: existing } }));
        }
      } else {
        console.error('Playlist not found:', playlistId);
        throw new Error('Playlist not found');
      }
    } catch (e) {
      console.error('Error adding to playlist:', e);
      throw e; 
    }
  };



  // Initialize audio elements with media controls disabled
  useEffect(() => {

    // Just set preload to metadata so currentTime can be set
    if (audioVocalRef.current) {
      audioVocalRef.current.preload = 'metadata';
    }
    if (audioInstrRef.current) {
      audioInstrRef.current.preload = 'metadata';
    }
    
    // Add event listeners for when either track ends
    const handleTrackEnd = () => {
      // Clear any pending delayed play
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
      
      // Pause both tracks
      if (audioVocalRef.current) {
        audioVocalRef.current.pause();
      }
      if (audioInstrRef.current) {
        audioInstrRef.current.pause();
      }
      
      // Reset playing state
      setIsMixerPlaying(false);
    };
    
    if (audioVocalRef.current) {
      audioVocalRef.current.addEventListener('ended', handleTrackEnd);
    }
    if (audioInstrRef.current) {
      audioInstrRef.current.addEventListener('ended', handleTrackEnd);
    }
    
    return () => {
      if (audioVocalRef.current) {
        audioVocalRef.current.removeEventListener('ended', handleTrackEnd);
      }
      if (audioInstrRef.current) {
        audioInstrRef.current.removeEventListener('ended', handleTrackEnd);
      }
    };
  }, []);



  useEffect(() => {
    setTracks((prevTracks) => sortTracks(prevTracks, sortOption));
  }, [sortOption]);

  useEffect(() => {
    const savedSearchState = sessionStorage.getItem('musicMixerSearch');
    if (savedSearchState) {
      try {
        const searchState = JSON.parse(savedSearchState);
        setSearchQuery(searchState.query);
        setCurrentPage(searchState.page);
        fetchTracks(searchState.page, searchState.query);
      } catch (e) { console.error(e); }
    }
  }, []);

  // Playlist Loading
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('userPlaylists');
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists));
      } catch (e) { setPlaylists([]); }
    }
  }, []);

  // Playlist Saving
  useEffect(() => {
    if (playlists.length > 0) {
      localStorage.setItem('userPlaylists', JSON.stringify(playlists));
      window.dispatchEvent(new CustomEvent('playlistsUpdated', { detail: { playlists } }));
    }
  }, [playlists]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showContextMenu && !event.target.closest('.context-menu')) {
        setShowContextMenu(false);
        setShowPlaylistMenu(false);
      }
      if (showSortDropdown && !event.target.closest('.relative')) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu, showSortDropdown]);

  // Listen for logout events to clear search
  useEffect(() => {
    const handleLogout = () => {
      setSearchQuery('');
      setTracks([]);
      setTotalTracks(0);
      setCurrentPage(1);
      setError(null);
      setLikedTracks([]);
      setTrackData({});
      setFlippedCards([]);
      sessionStorage.removeItem('musicMixerSearch');
    };

    window.addEventListener('userLogout', handleLogout);
    return () => window.removeEventListener('userLogout', handleLogout);
  }, []);


  // --- Visual Elements ---
  
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-900">
      
      {/* === MIXER MODULE === */}
      <div className="h-[70vh] bg-slate-900 text-white p-6 flex flex-col items-center justify-between relative overflow-hidden">
        
        <h1 className="text-3xl font-bold tracking-widest text-blue-400 mb-4">MUXER LAB</h1>

        <div className="flex w-full h-full gap-8 justify-center items-center">
          
          {/* DECK A: VOCALS */}
          <div className="w-1/3 h-[80%] bg-slate-800 rounded-xl border-2 border-blue-500/30 p-4 flex flex-col relative">
            <div className="absolute -top-3 left-4 bg-blue-600 px-3 text-xs font-bold rounded">VOCALS SOURCE</div>
            
            {isProcessingA ? (
              <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                <span className="text-blue-400">Splitting Stems...</span>
              </div>
            ) : mixerSlotA ? (
              <div className="flex flex-col items-center h-full">
                <div className="relative mt-4">
                  <img src={mixerSlotA.album.cover_medium} className="w-48 h-48 rounded-full animate-spin-slow shadow-[0_0_30px_rgba(59,130,246,0.5)]" alt="Album" />
                  <div className="absolute -top-2 -left-2 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                    {mixerSlotA.bpm} BPM
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-bold text-center">{mixerSlotA.title}</h3>
                <p className="text-gray-400">{mixerSlotA.artist.name}</p>
                <div className="flex gap-1 mt-auto mb-4 h-12 items-end">
                   {[...Array(10)].map((_,i) => <div key={i} className="w-2 bg-blue-500" style={{height: `${Math.random() * 100}%`}}></div>)}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-600 rounded-lg m-4">
                Right Click a Song Below<br/>to Load Here
              </div>
            )}
          </div>

          {/* CONTROLS CENTER */}
          <div className="w-1/4 flex flex-col items-center gap-6 z-10">
            
            {/* BPM Display */}
            <div className={`bg-slate-800 p-4 rounded-lg border border-green-700 text-center w-full transition-opacity ${!mixerSlotA || !mixerSlotB || isProcessingA || isProcessingB ? 'opacity-50' : ''}`}>
               <div className="text-xs text-gray-400 uppercase tracking-wider">Master Tempo {bpmMultiplier !== "1x" && <span className="text-amber-400">({bpmMultiplier})</span>}</div>
               <div className="text-4xl font-mono text-green-400">{detectedBPM || "---"}<span className="text-sm ml-1">{detectedBPM ? "BPM" : ""}</span></div>
               <button 
                 onClick={handleAutoSync} 
                 disabled={!mixerSlotA || !mixerSlotB || isProcessingA || isProcessingB}
                 className="mt-2 text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/50 hover:bg-green-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 AUTO SYNC
               </button>
            </div>

            {/* Play Button */}
            <button 
              onClick={toggleMixerPlay}
              disabled={!mixerSlotA || !mixerSlotB || isUpdating}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                (!mixerSlotA || !mixerSlotB || isUpdating) ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-white hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]'
              }`}
            >
              <img src={isMixerPlaying ? pauseIcon : playIcon} className={`w-8 ${isMixerPlaying ? '' : 'ml-1'}`} alt="Play/Pause" />
            </button>



            {/* Offset Slider, currently set to 20 beat range*/}
            <div className={`w-full bg-slate-800 p-4 rounded-lg border border-gray-700 relative transition-opacity ${!mixerSlotA || !mixerSlotB || isProcessingA || isProcessingB ? 'opacity-50' : ''}`}>
               {isUpdating && (
                 <div className="absolute inset-0 bg-slate-900/80 rounded-lg flex items-center justify-center z-10">
                   <span className="text-yellow-400 text-xs font-bold animate-pulse">UPDATING...</span>
                 </div>
               )}
               <div className="text-xs text-gray-400 mb-2 text-center uppercase tracking-wider">Instrumental Offset</div>
               <div className="flex justify-between text-xs text-gray-400 mb-2">
                 <span>Early</span>
                 <span className="text-white font-mono">
                   {Math.round(offsetMs)}ms 
                   <span className="text-gray-500 ml-1">(≈{Math.round(offsetMs / getCurrentBeatInterval() * 10) / 10} beats)</span>
                 </span>
                 <span>Late</span>
               </div>
               {detectedBPM && (
                 <div className="text-center text-[10px] text-gray-500 mb-2">
                   Step: {Math.round(getCurrentBeatInterval())}ms/beat @ {detectedBPM} BPM
                 </div>
               )}
               <input 
                 type="range" 
                 min="-20" 
                 max="20" 
                 step="1"
                 value={Math.round(offsetMs / getCurrentBeatInterval())}
                 onChange={(e) => handleOffsetChange(parseInt(e.target.value) * getCurrentBeatInterval())}
                 disabled={!mixerSlotA || !mixerSlotB || isProcessingA || isProcessingB}
                 className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
               />
            </div>
            

            <button onClick={handleFinalizeMix} className="bg-blue-600/20 text-blue-400 px-8 py-3 rounded-lg border border-blue-600/50 hover:bg-blue-600 hover:text-white font-bold transition-all">
              FINALIZE MIX
            </button>
          </div>

          {/* DECK B: INSTRUMENTAL */}
          <div className="w-1/3 h-[80%] bg-slate-800 rounded-xl border-2 border-red-500/30 p-4 flex flex-col relative">
            <div className="absolute -top-3 right-4 bg-red-600 px-3 text-xs font-bold rounded">INSTRUMENTAL SOURCE</div>
            
            {isProcessingB ? (
              <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                <span className="text-red-400">Splitting Stems...</span>
              </div>
            ) : mixerSlotB ? (
              <div className="flex flex-col items-center h-full">
                <div className="relative mt-4">
                  <img src={mixerSlotB.album.cover_medium} className="w-48 h-48 rounded-full animate-spin-slow bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]" alt="Album" />
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                    {mixerSlotB.bpm} BPM
                  </div>
                </div>
                 <h3 className="mt-6 text-xl font-bold text-center">{mixerSlotB.title}</h3>
                 <p className="text-gray-400">{mixerSlotB.artist.name}</p>
                 <div className="flex gap-1 mt-auto mb-4 h-12 items-end">
                   {[...Array(10)].map((_,i) => <div key={i} className="w-2 bg-red-500" style={{height: `${Math.random() * 100}%`}}></div>)}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-600 rounded-lg m-4">
                Right Click a Song Below<br/>to Load Here
              </div>
            )}
          </div>
        </div>
      </div>



      {/* === SONG GRID MODULE === */}
      <div className={`min-h-[50vh] flex flex-col bg-slate-900 text-white ${currentTrack ? 'pb-[160px]' : 'pb-4'}`}>
        
        {/* Search Bar */}
        <div className="p-6 bg-slate-800 border-b border-slate-700">
          <div className="flex justify-center items-center gap-4">
            <form onSubmit={handleSearch} className="w-1/2 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for Songs"
                className="w-full px-6 py-3 border border-blue-500/30 rounded-full bg-slate-700 text-white placeholder-gray-400 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-md hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] focus:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all"
              />
            </form>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="p-3 border border-blue-500/30 rounded-full bg-slate-700 hover:bg-slate-600 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-700 border border-blue-500/30 rounded-lg shadow-lg shadow-blue-500/20 z-50">
                   <div className="py-2">
                     <button onClick={() => { setSortOption('popularity-high'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 hover:text-blue-400 transition-colors">Most Popular</button>
                     <button onClick={() => { setSortOption('popularity-low'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 hover:text-blue-400 transition-colors">Least Popular</button>
                     <button onClick={() => { setSortOption('title-asc'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 hover:text-blue-400 transition-colors">Title (A-Z)</button>
                     <button onClick={() => { setSortOption('artist-asc'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 hover:text-blue-400 transition-colors">Artist (A-Z)</button>
                   </div>
                </div>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold mt-4 text-blue-400 tracking-wider">TRACK LIBRARY</h2>
        </div>

        {error && <div className="p-8 text-center text-red-400">{error}</div>}



        {/* Grid */}
        <div className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${isLoading ? 'fade-out' : ''}`}>
          <div className="grid grid-cols-5 gap-6 mb-8">
            {tracks.map((track, index) => (
              <TrackCard
                key={track.id}
                track={track}
                index={index}
                trackData={trackData[track.id]}
                isFlipped={flippedCards.includes(track.id)}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onCardClick={handleCardClick}
                onLikeToggle={handleLikeToggle}
                onPlayClick={(idx) => playFromQueue(tracks, idx)}
                onContextMenu={handleRightClick}
              />
            ))}
          </div>
          {isLoading && <div className="text-center text-gray-400">Loading Tracks...</div>}
        </div>



        {/* Pagination */}
        {totalTracks > 0 && (
          <div className={`fixed left-0 right-0 z-40 transition-all duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
            currentTrack 
              ? (showMusicBar ? 'bottom-[80px]' : 'bottom-0') 
              : 'bottom-0'
          }`}>
            <div className="p-4 border-t border-slate-700 bg-slate-800/95 backdrop-blur-sm shadow-lg flex justify-center gap-4">
               <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-4 py-2 border border-blue-500/30 rounded bg-slate-700 text-white hover:bg-blue-600 hover:border-blue-500 disabled:opacity-50 disabled:hover:bg-slate-700 transition-colors">Previous</button>
               <span className="self-center text-gray-300">Page {currentPage} of {totalPages}</span>
               <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="px-4 py-2 border border-blue-500/30 rounded bg-slate-700 text-white hover:bg-blue-600 hover:border-blue-500 disabled:opacity-50 disabled:hover:bg-slate-700 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>



      {/* === OVERLAYS === */}
      
      {/* Context Menu */}
      {showContextMenu && selectedTrack && (
        <div
          className="context-menu fixed bg-slate-800 border border-blue-500/30 rounded-lg shadow-lg shadow-blue-500/20 py-2 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y, minWidth: '180px' }}
        >
          <div className="px-4 py-1 text-xs text-gray-400 font-bold border-b border-slate-700 mb-1">LOAD TO MUXER</div>
          <button onClick={() => { loadIntoMixer(selectedTrack, 'A'); setShowContextMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-600/20 text-blue-400 font-medium transition-colors">Set as Vocals</button>
          <button onClick={() => { loadIntoMixer(selectedTrack, 'B'); setShowContextMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-600/20 text-red-400 font-medium transition-colors">Set as Melody</button>
          <div className="border-t border-slate-700 my-1"></div>
          <button onClick={() => { setShowPlaylistMenu(true); setShowContextMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-blue-400 transition-colors">Add to Playlist</button>
        </div>
      )}


      {/* Playlist Menu */}
      {showPlaylistMenu && selectedTrack && (
        <div
          className="fixed bg-slate-800 border border-blue-500/30 rounded-lg shadow-lg shadow-blue-500/20 py-2 z-50 max-h-64 overflow-y-auto"
          style={{ left: contextMenuPosition.x + 160, top: contextMenuPosition.y, minWidth: '200px' }}
        >
           {playlists.length === 0 ? (
             <div className="px-4 py-2 text-sm text-gray-400">No playlists available</div>
           ) : (
             playlists.map((playlist) => (
               <button key={playlist.id} onClick={() => addToPlaylist(playlist, selectedTrack)} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-600/20 hover:text-blue-400 transition-colors">
                 <div className="font-medium text-white">{playlist.name}</div>
                 <div className="text-xs text-gray-400">{playlist.tracks.length} tracks</div>
               </button>
             ))
           )}
        </div>
      )}


      {/* Notifications */}
      {notification && (
        <div className="fixed top-10 left-10 bg-blue-800 text-white px-6 py-3 rounded-lg shadow-lg shadow-blue-600 z-50 animate-bounce">
          {notification}
        </div>
      )}


      {/* Finalize window when user clicks "Finalize" button */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl shadow-2xl shadow-blue-500/20 p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Finalize Mix</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Mix Title</label>
              <input
                type="text"
                value={mixTitle}
                onChange={(e) => setMixTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter mix title..."
              />
            </div>

            {playlists.length > 0 ? (
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Save to Playlist</label>
                <select
                  value={selectedPlaylist}
                  onChange={(e) => setSelectedPlaylist(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Select a playlist...</option>
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name} ({playlist.tracks.length} tracks)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-6 text-center">
                <p className="text-gray-400 text-sm mb-3">No playlists available</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {playlists.length > 0 ? (
                <button
                  onClick={confirmFinalizeMix}
                  disabled={!mixTitle.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              ) : (
                <button
                  onClick={confirmFinalizeMix}
                  disabled={!mixTitle.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Recents
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MusicMixer;