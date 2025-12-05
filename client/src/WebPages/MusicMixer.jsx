import React, { useState, useEffect, useCallback, useRef } from 'react';
import { musicService } from '../services/Services';
import { useAudio } from '../context/AudioContext';
import playIcon from '../assets/play-solid-full.svg';
import pauseIcon from '../assets/pause-solid-full.svg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Helper for backend URL
const SERVER_URL = "http://localhost:8080";

function MusicMixer() {
  // --- ORIGINAL STATE VARIABLES ---
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

  // These were missing in your previous attempt causing the ReferenceError:
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [notification, setNotification] = useState(null);

  const tracksPerPage = 20;
  const totalPages = Math.ceil(totalTracks / tracksPerPage);

  const { currentTrack, isPlaying, playFromQueue } = useAudio();

  // --- NEW MIXER STATE VARIABLES ---
  const [mixerSlotA, setMixerSlotA] = useState(null); 
  const [mixerSlotB, setMixerSlotB] = useState(null);
  const [isProcessingA, setIsProcessingA] = useState(false);
  const [isProcessingB, setIsProcessingB] = useState(false);
  const [offsetMs, setOffsetMs] = useState(0); 
  const [isMixerPlaying, setIsMixerPlaying] = useState(false);
  const [detectedBPM, setDetectedBPM] = useState(120);

  // Audio Refs for Mixer
  const audioVocalRef = useRef(new Audio());
  const audioInstrRef = useRef(new Audio());

  // --- MIXER LOGIC ---

  const loadIntoMixer = async (track, slot) => {
    // Use preview URL or full URL if available
    const trackUrl = track.preview; 

    if (slot === 'A') {
      setIsProcessingA(true);
      try {
        const stems = await musicService.splitTrack(trackUrl);
        // === CHANGE: Save the BPM from the response ===
        setMixerSlotA({ ...track, stems, bpm: stems.bpm }); 
        // ==============================================
        audioVocalRef.current.src = `${SERVER_URL}${stems.vocals_url}`;
        
        // If this is the first track loaded, set the Master BPM automatically
        if (!mixerSlotB) setDetectedBPM(stems.bpm);
        
      } catch (err) {
        console.error(err);
        showNotification("Failed to split vocals");
      } finally {
        setIsProcessingA(false);
      }
    } else {
      setIsProcessingB(true);
      try {
        const stems = await musicService.splitTrack(trackUrl);
        // === CHANGE: Save the BPM from the response ===
        setMixerSlotB({ ...track, stems, bpm: stems.bpm });
        // ==============================================
        audioInstrRef.current.src = `${SERVER_URL}${stems.accompaniment_url}`;
        
        // If this is the first track loaded, set the Master BPM automatically
        if (!mixerSlotA) setDetectedBPM(stems.bpm);

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
      audioVocalRef.current.pause();
      audioInstrRef.current.pause();
      setIsMixerPlaying(false);
    } else {
      // Handle Offset (Req 11)
      const vocalDelay = offsetMs > 0 ? offsetMs : 0;
      const instrDelay = offsetMs < 0 ? Math.abs(offsetMs) : 0;

      setTimeout(() => { audioVocalRef.current.play(); }, vocalDelay);
      setTimeout(() => { audioInstrRef.current.play(); }, instrDelay);

      setIsMixerPlaying(true);
    }
  };

  const handleAutoSync = () => {
    if (mixerSlotA && mixerSlotB) {
        // Get the real BPMs we saved earlier
        const bpmA = mixerSlotA.bpm || 0;
        const bpmB = mixerSlotB.bpm || 0;
        
        // Calculate average to sync them (simple version)
        const avgBpm = Math.round((bpmA + bpmB) / 2);
        
        setDetectedBPM(avgBpm); 
        showNotification(`Syncing... Vocals: ${bpmA} vs Instr: ${bpmB} -> ${avgBpm}`);
    } else {
        showNotification("Please load songs into both decks first.");
    }
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

  const fetchTracks = useCallback(async (page, query = searchQuery) => {
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
    }, [searchQuery, sortOption]);

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
      
      // === CREATE MIX TRACK OBJECT ===
      // This mimics the Deezer structure so Playlists.jsx can read it
      const newMixTrack = {
        id: `mix_${Date.now()}`, // Unique ID
        title: result.title || `Mashup: ${mixerSlotA.title} x ${mixerSlotB.title}`,
        artist: { name: currentUser?.displayName || "My Custom Mix" }, // Or current user name
        album: { 
          // Use a placeholder image or the cover of the Vocal track
          cover_small: mixerSlotA.album.cover_small, 
          cover_medium: mixerSlotA.album.cover_medium 
        },
        duration: 0, // You can calculate this if needed
        preview: `${SERVER_URL}${result.mix_url}`, // The link to play it
        isLocalMix: true // Flag to help us identify it later
      };

      // === REQ 19: Auto-save to Recents ===
      saveToRecents(newMixTrack);

      // === REQ 16: Visual Indication / Encouragement ===
      // Instead of just downloading, we select this track 
      // and open the playlist menu to encourage saving.
      setSelectedTrack(newMixTrack); 
      setNotification("Mix saved to Recents! Add to a playlist?");
      setShowPlaylistMenu(true); // <--- This pops up the "Add to Playlist" menu immediately

      // Auto-download (Optional, keep if you want)
      //const link = document.createElement('a');
      //link.href = `${SERVER_URL}${result.mix_url}`;
      //link.download = `${newMixTrack.title}.mp3`;
      //document.body.appendChild(link);
      //link.click();
      //document.body.removeChild(link);

    } catch (err) {
      console.error(err);
      showNotification("Failed to create mix.");
    }
  };

  // --- HELPER: Save to Recents (Req 19) ---
  const saveToRecents = (mixTrack) => {
    try {
      // 1. Get existing playlists
      const existing = JSON.parse(localStorage.getItem('userPlaylists') || '[]');
      
      // 2. Find or Create "Recents" playlist
      let recentsIdx = existing.findIndex(p => p.name === "Recents");
      let recents;

      if (recentsIdx === -1) {
        // Create it if missing
        recents = {
          id: 'playlist_recents', // Fixed ID for Recents
          name: "Recents",
          icon: null, 
          tracks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        existing.unshift(recents); // Add to front
        recentsIdx = 0;
      } else {
        recents = existing[recentsIdx];
      }

      // 3. Add the new mix to the top of Recents
      // Check for duplicates based on ID
      if (!recents.tracks.some(t => t.id === mixTrack.id)) {
        recents.tracks.unshift(mixTrack);
        recents.updatedAt = new Date().toISOString();
        
        // Update the array
        existing[recentsIdx] = recents;
        
        // 4. Save back to Storage
        localStorage.setItem('userPlaylists', JSON.stringify(existing));
        setPlaylists(existing); // Update local state
        
        // Notify other components (like Playlists.jsx)
        window.dispatchEvent(new CustomEvent('playlistsUpdated', { detail: { playlists: existing } }));
      }
    } catch (e) {
      console.error("Error saving to recents:", e);
    }
  };
  // --- EFFECT HOOKS ---

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
      } catch (error) { setPlaylists([]); }
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


  // --- RENDER ---
  
  return (
    <div className="min-h-screen flex flex-col">
      
      {/* === MIXER MODULE (Top 70vh) === */}
      <div className="h-[70vh] bg-slate-900 text-white p-6 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden">
        
        <h1 className="text-3xl font-bold tracking-widest text-blue-400 mb-4">MUXER MIX LAB</h1>

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
                <img src={mixerSlotA.album.cover_medium} className="w-48 h-48 rounded-full animate-spin-slow shadow-[0_0_30px_rgba(59,130,246,0.5)] mt-4" alt="Album" />
                <h3 className="mt-6 text-xl font-bold text-center">{mixerSlotA.title}</h3>
                <p className="text-gray-400">{mixerSlotA.artist.name}</p>
                <div className="flex gap-1 mt-auto mb-4 h-12 items-end">
                   {[...Array(10)].map((_,i) => <div key={i} className="w-2 bg-blue-500" style={{height: `${Math.random()*100}%`}}></div>)}
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
            <div className="bg-slate-800 p-4 rounded-lg border border-green-700 text-center w-full">
               <div className="text-xs text-gray-400 uppercase tracking-wider">Master Tempo</div>
               <div className="text-4xl font-mono text-green-400">{detectedBPM} <span className="text-sm">BPM</span></div>
               <button onClick={handleAutoSync} className="mt-2 text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/50 hover:bg-green-600 hover:text-white transition-all">
                 AUTO SYNC
               </button>
            </div>

            {/* Play Button */}
            <button 
              onClick={toggleMixerPlay}
              disabled={!mixerSlotA || !mixerSlotB}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                (!mixerSlotA || !mixerSlotB) ? 'bg-gray-700 opacity-50' : 'bg-white hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]'
              }`}
            >
              <img src={isMixerPlaying ? pauseIcon : playIcon} className={`w-8 ${isMixerPlaying ? '' : 'ml-1'}`} alt="Play/Pause" />
            </button>

            {/* Offset Slider */}
            <div className="w-full bg-slate-800 p-4 rounded-lg border border-gray-700">
               <div className="flex justify-between text-xs text-gray-400 mb-2">
                 <span>Vocals Late</span>
                 <span className="text-white font-mono">{offsetMs}ms</span>
                 <span>Instr Late</span>
               </div>
               <input 
                 type="range" 
                 min="-500" max="500" 
                 value={offsetMs} 
                 onChange={(e) => setOffsetMs(parseInt(e.target.value))}
                 className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
               />
            </div>
            
            <button onClick={handleFinalizeMix} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all">
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
                 <img src={mixerSlotB.album.cover_medium} className="w-48 h-48 rounded-full animate-spin-slow bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] mt-4" alt="Album" />
                 <h3 className="mt-6 text-xl font-bold text-center">{mixerSlotB.title}</h3>
                 <p className="text-gray-400">{mixerSlotB.artist.name}</p>
                 <div className="flex gap-1 mt-auto mb-4 h-12 items-end">
                   {[...Array(10)].map((_,i) => <div key={i} className="w-2 bg-red-500" style={{height: `${Math.random()*100}%`}}></div>)}
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
      <div className={`min-h-[50vh] flex flex-col bg-gray-50 ${currentTrack ? 'pb-[160px]' : 'pb-4'}`}>
        
        {/* Search Bar */}
        <div className="p-6 bg-white border-b">
          <div className="flex justify-center items-center gap-4">
            <form onSubmit={handleSearch} className="w-1/2 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for Songs"
                className="w-full px-6 py-3 border border-gray-200 rounded-full bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              />
            </form>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="p-3 border border-gray-200 rounded-full bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                   <div className="py-2">
                     <button onClick={() => { setSortOption('popularity-high'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Most Popular</button>
                     <button onClick={() => { setSortOption('popularity-low'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Least Popular</button>
                     <button onClick={() => { setSortOption('title-asc'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Title (A-Z)</button>
                     <button onClick={() => { setSortOption('artist-asc'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Artist (A-Z)</button>
                   </div>
                </div>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold mt-4">Track list</h2>
        </div>

        {error && <div className="p-8 text-center text-red-500">{error}</div>}

        {/* Grid */}
        <div className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${isLoading ? 'fade-out' : ''}`}>
          <div className="grid grid-cols-5 gap-6 mb-8">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 flex flex-col"
                onContextMenu={(e) => handleRightClick(e, track)}
              >
                <div className="relative aspect-square mb-3 overflow-hidden rounded-md group">
                  <img src={track.album.cover_medium} alt={track.title} className="w-full h-full object-cover" />
                  <button
                    onClick={() => playFromQueue(tracks, index)}
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity"
                  >
                     <img className="invert w-10" src={currentTrack?.id === track.id && isPlaying ? pauseIcon : playIcon} alt="Play" />
                  </button>
                </div>
                <h3 className="font-semibold truncate">{track.title}</h3>
                <p className="text-sm text-gray-600 truncate mb-2">{track.artist.name}</p>
              </div>
            ))}
          </div>
          {isLoading && <div className="text-center text-gray-500">Loading Tracks...</div>}
        </div>

        {/* Pagination */}
        {totalTracks > 0 && (
          <div className={`fixed left-0 right-0 z-40 ${currentTrack ? 'bottom-[80px]' : 'bottom-0'}`}>
            <div className="p-4 border-t bg-white/90 backdrop-blur-sm shadow-lg flex justify-center gap-4">
               <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">Previous</button>
               <span className="self-center">Page {currentPage} of {totalPages}</span>
               <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* === OVERLAYS === */}
      
      {/* Context Menu */}
      {showContextMenu && selectedTrack && (
        <div
          className="context-menu fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y, minWidth: '180px' }}
        >
          <div className="px-4 py-1 text-xs text-gray-400 font-bold border-b mb-1">LOAD TO MIXER</div>
          <button onClick={() => { loadIntoMixer(selectedTrack, 'A'); setShowContextMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-700 font-medium">Set as Vocals (Deck A)</button>
          <button onClick={() => { loadIntoMixer(selectedTrack, 'B'); setShowContextMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 text-purple-700 font-medium">Set as Melody (Deck B)</button>
          <div className="border-t my-1"></div>
          <button onClick={() => { setShowPlaylistMenu(true); setShowContextMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Add to Playlist</button>
        </div>
      )}

      {/* Playlist Menu */}
      {showPlaylistMenu && selectedTrack && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 max-h-64 overflow-y-auto"
          style={{ left: contextMenuPosition.x + 160, top: contextMenuPosition.y, minWidth: '200px' }}
        >
           {playlists.length === 0 ? (
             <div className="px-4 py-2 text-sm text-gray-500">No playlists available</div>
           ) : (
             playlists.map((playlist) => (
               <button key={playlist.id} onClick={() => addToPlaylist(playlist, selectedTrack)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                 <div className="font-medium">{playlist.name}</div>
                 <div className="text-xs text-gray-500">{playlist.tracks.length} tracks</div>
               </button>
             ))
           )}
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          {notification}
        </div>
      )}

    </div>
  );
}

export default MusicMixer;