import React, { useState, useEffect, useRef } from 'react';
import { musicService } from '../services/Services';
import { likeService } from '../services/likeService'; // Import the new service
import { useAudio } from '../context/AudioContext';
import playIcon from '../assets/play-solid-full.svg';
import pauseIcon from '../assets/pause-solid-full.svg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Removed unused Firebase imports (handled in service now)

// Helper for backend URL
const SERVER_URL = "http://localhost:8080";

function MusicMixer() {
  // --- STATE VARIABLES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalTracks, setTotalTracks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('popularity-high');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [notification, setNotification] = useState(null);
  const [likedTracks, setLikedTracks] = useState([]); // Stores IDs of liked tracks

  const tracksPerPage = 20;
  const totalPages = Math.ceil(totalTracks / tracksPerPage);

  const { currentTrack, isPlaying, playFromQueue } = useAudio();

  // --- MIXER STATE VARIABLES ---
  const [mixerSlotA, setMixerSlotA] = useState(null); 
  const [mixerSlotB, setMixerSlotB] = useState(null);
  const [isProcessingA, setIsProcessingA] = useState(false);
  const [isProcessingB, setIsProcessingB] = useState(false);
  const [offsetMs, setOffsetMs] = useState(0); 
  const [isMixerPlaying, setIsMixerPlaying] = useState(false);
  const [detectedBPM, setDetectedBPM] = useState(null);
  const [bpmMultiplier, setBpmMultiplier] = useState("1x");
  const [isUpdating, setIsUpdating] = useState(false);

  // Audio Refs
  const audioVocalRef = useRef(null);
  const audioInstrRef = useRef(null);
  const delayTimeoutRef = useRef(null);

  // --- LIKE/DISLIKE LOGIC ---

  // 1. Load likes when user logs in
  useEffect(() => {
    const loadLikedTracks = async () => {
      if (currentUser) {
        try {
          const liked = await likeService.getLikedTracks(currentUser.uid);
          // Extract just the IDs for the UI to check (e.g. [123, 456, 789])
          const likedIds = liked.map(track => track.id);
          setLikedTracks(likedIds);
        } catch (error) {
          console.error("Error loading liked tracks:", error);
        }
      } else {
        setLikedTracks([]);
      }
    };
    loadLikedTracks();
  }, [currentUser]);

  // 2. Handle the toggle click
  const handleLikeToggle = async (e, track) => {
    e.stopPropagation(); // Stop clicking the heart from triggering the card click
    
    if (!currentUser) {
      showNotification("Please sign in to like songs");
      return;
    }

    const isLiked = likedTracks.includes(track.id);
    
    // OPTIMISTIC UPDATE: Update UI immediately so it feels fast
    if (isLiked) {
      setLikedTracks(prev => prev.filter(id => id !== track.id));
      showNotification("Removed from liked songs");
    } else {
      setLikedTracks(prev => [...prev, track.id]);
      showNotification("Added to liked songs");
    }

    // ACTUAL DATABASE UPDATE
    try {
      if (isLiked) {
        await likeService.unlikeTrack(currentUser.uid, track.id);
      } else {
        await likeService.likeTrack(currentUser.uid, track);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert UI on error
      if (isLiked) {
        setLikedTracks(prev => [...prev, track.id]);
      } else {
        setLikedTracks(prev => prev.filter(id => id !== track.id));
      }
      showNotification("Failed to update like status");
    }
  };

  // --- MIXER LOGIC ---

  const loadIntoMixer = async (track, slot) => {
    const trackUrl = track.preview; 

    if (slot === 'A') {
      setIsProcessingA(true);
      setDetectedBPM(null);
      setBpmMultiplier("1x");
      try {
        const stems = await musicService.splitTrack(trackUrl);
        setMixerSlotA({ ...track, stems, bpm: stems.bpm });
        audioVocalRef.current.src = `${SERVER_URL}${stems.vocals_url}`;
        audioVocalRef.current.load();
      } catch (err) {
        console.error(err);
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
        audioInstrRef.current.src = `${SERVER_URL}${stems.accompaniment_url}`;
        audioInstrRef.current.load();
      } catch (err) {
        console.error(err);
        showNotification("Failed to split instrumental");
      } finally {
        setIsProcessingB(false);
      }
    }
  };

  const toggleMixerPlay = () => {
    if (isMixerPlaying) {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
      audioVocalRef.current.pause();
      audioInstrRef.current.pause();
      setIsMixerPlaying(false);
    } else {
      audioVocalRef.current.pause();
      audioInstrRef.current.pause();
      audioVocalRef.current.currentTime = 0;
      audioInstrRef.current.currentTime = 0;
      audioVocalRef.current.volume = 0;
      audioInstrRef.current.volume = 0;
      
      const fadeIn = (audioElement) => {
        let volume = 0;
        const fadeInterval = setInterval(() => {
          if (volume < 1) {
            volume += 0.1; 
            audioElement.volume = Math.min(volume, 1);
          } else {
            clearInterval(fadeInterval);
          }
        }, 50); 
      };
      
      if (offsetMs > 0) {
        audioVocalRef.current.play();
        fadeIn(audioVocalRef.current);
        delayTimeoutRef.current = setTimeout(() => {
          audioInstrRef.current.play();
          fadeIn(audioInstrRef.current);
        }, offsetMs);
      } else if (offsetMs < 0) {
        audioInstrRef.current.play();
        fadeIn(audioInstrRef.current);
        delayTimeoutRef.current = setTimeout(() => {
          audioVocalRef.current.play();
          fadeIn(audioVocalRef.current);
        }, Math.abs(offsetMs));
      } else {
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
        if (isMixerPlaying) toggleMixerPlay();
        
        setIsUpdating(true);
        audioVocalRef.current.currentTime = 0;
        audioInstrRef.current.currentTime = 0;
        
        const bpmVocals = mixerSlotA.bpm || 0;
        const bpmInstr = mixerSlotB.bpm || 0;
        
        const targetBPM1x = bpmVocals;
        const targetBPM2x = bpmVocals * 2;
        const diff1x = Math.abs(bpmInstr - targetBPM1x);
        const diff2x = Math.abs(bpmInstr - targetBPM2x);
        
        const targetBPM = diff1x <= diff2x ? targetBPM1x : targetBPM2x;
        const multiplier = diff1x <= diff2x ? "1x" : "2x";
        
        setDetectedBPM(targetBPM);
        setBpmMultiplier(multiplier);
        
        // Simulating sync success for UI feedback
        showNotification(`Synced to ${multiplier} vocals (${targetBPM} BPM)`);
        
        // NOTE: If you have backend adjustBPM implemented, call it here.
        // Otherwise this just sets the visual BPM.
        
        setTimeout(() => setIsUpdating(false), 1000);
    } else {
        showNotification("Please load songs into both decks first.");
    }
  };

  const handleOffsetChange = (newOffset) => {
    if (isMixerPlaying) toggleMixerPlay();
    setIsUpdating(true);
    audioVocalRef.current.currentTime = 0;
    audioInstrRef.current.currentTime = 0;
    setOffsetMs(newOffset);
    setTimeout(() => setIsUpdating(false), 300);
  };

  // Helper: Calculate ms per beat
  const getBeatInterval = (bpm) => {
    if (!bpm || bpm === 0) return 500; 
    return (60000 / bpm);
  };

  const getCurrentBeatInterval = () => {
    const bpm = detectedBPM || 120;
    return getBeatInterval(bpm);
  };

  // --- STANDARD HELPER FUNCTIONS ---

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
    } catch (err) {
      console.error('Search Error:', err);
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

  const handleRightClick = (e, track) => {
    e.preventDefault();
    setSelectedTrack(track);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const addToPlaylist = (playlist, track) => {
    const trackExists = playlist.tracks.some((t) => t.id === track.id);
    if (trackExists) {
      showNotification(`"${track.title}" is already in "${playlist.name}"`);
      return;
    }
    const updatedPlaylists = playlists.map((p) =>
      p.id === playlist.id
        ? { ...p, tracks: [...p.tracks, track], updatedAt: new Date().toISOString() }
        : p
    );
    setPlaylists(updatedPlaylists);
    showNotification(`"${track.title}" added to playlist "${playlist.name}"`);
    setShowPlaylistMenu(false);
    setShowContextMenu(false);
  };

  const handleFinalizeMix = async () => {
    if (!mixerSlotA || !mixerSlotB) {
      showNotification("Please load both decks first!");
      return;
    }

    showNotification("Mixing down... please wait.");
    
    try {
      const result = await musicService.finalizeMix(
        mixerSlotA.stems.session_id, 
        mixerSlotB.stems.session_id,
        offsetMs
      );
      
      const newMixTrack = {
        id: `mix_${Date.now()}`,
        title: result.title || `Mashup: ${mixerSlotA.title} x ${mixerSlotB.title}`,
        artist: { name: currentUser?.displayName || "My Custom Mix" },
        album: { 
          cover_small: mixerSlotA.album.cover_small, 
          cover_medium: mixerSlotA.album.cover_medium 
        },
        duration: 0,
        preview: `${SERVER_URL}${result.mix_url}`,
        isLocalMix: true
      };

      saveToRecents(newMixTrack);
      navigate('/mix-review', { state: { track: newMixTrack } });

    } catch (err) {
      console.error(err);
      showNotification("Failed to create mix.");
    }
  };

  const saveToRecents = (mixTrack) => {
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
        recents.tracks.unshift(mixTrack);
        recents.updatedAt = new Date().toISOString();
        existing[recentsIdx] = recents;
        localStorage.setItem('userPlaylists', JSON.stringify(existing));
        setPlaylists(existing);
        window.dispatchEvent(new CustomEvent('playlistsUpdated', { detail: { playlists: existing } }));
      }
    } catch (e) {
      console.error("Error saving to recents:", e);
    }
  };

  // --- EFFECTS ---

  useEffect(() => {
    audioVocalRef.current = new Audio();
    audioInstrRef.current = new Audio();
    audioVocalRef.current.preload = 'metadata';
    audioInstrRef.current.preload = 'metadata';
    
    const handleTrackEnd = () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
      audioVocalRef.current.pause();
      audioInstrRef.current.pause();
      setIsMixerPlaying(false);
    };
    
    audioVocalRef.current.addEventListener('ended', handleTrackEnd);
    audioInstrRef.current.addEventListener('ended', handleTrackEnd);
    
    return () => {
      if (audioVocalRef.current) {
        audioVocalRef.current.removeEventListener('ended', handleTrackEnd);
        audioVocalRef.current.pause();
      }
      if (audioInstrRef.current) {
        audioInstrRef.current.removeEventListener('ended', handleTrackEnd);
        audioInstrRef.current.pause();
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

  useEffect(() => {
    const savedPlaylists = localStorage.getItem('userPlaylists');
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists));
      } catch (error) { setPlaylists([]); }
    }
  }, []);

  useEffect(() => {
    if (playlists.length > 0) {
      localStorage.setItem('userPlaylists', JSON.stringify(playlists));
      window.dispatchEvent(new CustomEvent('playlistsUpdated', { detail: { playlists } }));
    }
  }, [playlists]);

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


  // --- RENDER ---
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-900">
      
      {/* === MIXER MODULE (Top 70vh) === */}
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

            {/* Offset Slider */}
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
                className="w-full px-6 py-3 border border-blue-500/30 rounded-full bg-slate-700 text-white placeholder-gray-400 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-md transition-all"
              />
            </form>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="p-3 border border-blue-500/30 rounded-full bg-slate-700 hover:bg-slate-600 transition-all"
              >
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-700 border border-blue-500/30 rounded-lg shadow-lg z-50">
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
              <div
                key={track.id}
                className="bg-slate-800 p-4 rounded-lg shadow-md border border-blue-500/20 flex flex-col transition-all duration-200 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:border-blue-500/50 hover:-translate-y-3 hover:scale-[1.02]"
                onContextMenu={(e) => handleRightClick(e, track)}
              >
                <div className="relative aspect-square mb-3 overflow-hidden rounded-md group">
                  <img src={track.album.cover_medium} alt={track.title} className="w-full h-full object-cover" />
                  
                  {/* Like Button */}
                  <button
                    onClick={(e) => handleLikeToggle(e, track)}
                    className={`absolute top-2 right-2 z-10 transition-all duration-200 ${
                      likedTracks.includes(track.id) 
                        ? 'opacity-100' 
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <svg 
                      className={`w-6 h-6 ${
                        likedTracks.includes(track.id) 
                          ? 'fill-pink-500 stroke-pink-500' 
                          : 'fill-none stroke-white'
                      } transition-colors duration-200 drop-shadow-lg`}
                      viewBox="0 0 24 24" 
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => playFromQueue(tracks, index)}
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity"
                  >
                     <img className="invert w-10" src={currentTrack?.id === track.id && isPlaying ? pauseIcon : playIcon} alt="Play" />
                  </button>
                </div>
                <h3 className="font-semibold truncate text-white">{track.title}</h3>
                <p className="text-sm text-gray-400 truncate mb-2">{track.artist.name}</p>
              </div>
            ))}
          </div>
          {isLoading && <div className="text-center text-gray-400">Loading Tracks...</div>}
        </div>

        {/* Pagination */}
        {totalTracks > 0 && (
          <div className={`fixed left-0 right-0 z-40 ${currentTrack ? 'bottom-[80px]' : 'bottom-0'}`}>
            <div className="p-4 border-t border-slate-700 bg-slate-800/95 backdrop-blur-sm shadow-lg flex justify-center gap-4">
               <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-4 py-2 border border-blue-500/30 rounded bg-slate-700 text-white hover:bg-blue-600 hover:border-blue-500 disabled:opacity-50 disabled:hover:bg-slate-700 transition-colors">Previous</button>
               <span className="self-center text-gray-300">Page {currentPage} of {totalPages}</span>
               <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="px-4 py-2 border border-blue-500/30 rounded bg-slate-700 text-white hover:bg-blue-600 hover:border-blue-500 disabled:opacity-50 disabled:hover:bg-slate-700 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* === OVERLAYS === */}
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

      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-green-500/50 z-50 animate-bounce">
          {notification}
        </div>
      )}
    </div>
  );
}

export default MusicMixer;