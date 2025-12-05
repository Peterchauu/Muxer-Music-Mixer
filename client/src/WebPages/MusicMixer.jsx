import React, { useState, useEffect, useCallback } from 'react';
import { musicService } from '../services/Services';
import { useAudio } from '../context/AudioContext';
import playIcon from '../assets/play-solid-full.svg';
import pauseIcon from '../assets/pause-solid-full.svg';

// Requirement 1 fulfilled

function MusicMixer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalTracks, setTotalTracks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('popularity-high');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [notification, setNotification] = useState(null);
  const tracksPerPage = 20;
  const totalPages = Math.ceil(totalTracks / tracksPerPage);

  // ✅ now also pulling playFromQueue for queue-based playback
  const { currentTrack, isPlaying, playFromQueue } = useAudio();

  // different sort scenarios
  const sortTracks = (tracksArray, option) => {
    if (!tracksArray) return [];

    const sorted = [...tracksArray];
    switch (option) {
      case 'popularity-high':
        return sorted.sort((a, b) => b.rank - a.rank);
      case 'popularity-low':
        return sorted.sort((a, b) => a.rank - b.rank);
      case 'title-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'artist-asc':
        return sorted.sort((a, b) => a.artist.name.localeCompare(b.artist.name));
      default:
        return sorted;
    }
  };

  // useCallback so useEffect deps are correct
  const fetchTracks = useCallback(
    async (page, query = searchQuery) => {
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
        setError('Unable to fetch tracks, please try a different search..');
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, sortOption]
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setCurrentPage(1);

    // save search state to sessionStorage for concurrency
    sessionStorage.setItem(
      'musicMixerSearch',
      JSON.stringify({
        query: searchQuery,
        page: 1,
      })
    );

    await fetchTracks(1, searchQuery);
  };

  const handlePrevPage = async () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);

      sessionStorage.setItem(
        'musicMixerSearch',
        JSON.stringify({
          query: searchQuery,
          page: newPage,
        })
      );

      await fetchTracks(newPage);
    }
  };

  const handleNextPage = async () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);

      sessionStorage.setItem(
        'musicMixerSearch',
        JSON.stringify({
          query: searchQuery,
          page: newPage,
        })
      );

      await fetchTracks(newPage);
    }
  };

  // re-sort tracks once user changes the sort option
  // use functional update so we don't depend on "tracks" and avoid infinite loops
  useEffect(() => {
    setTracks((prevTracks) => sortTracks(prevTracks, sortOption));
  }, [sortOption]);

  // ✅ load saved search state ONCE on mount (no more overwriting input on every keystroke)
  useEffect(() => {
    const savedSearchState = sessionStorage.getItem('musicMixerSearch');

    if (savedSearchState) {
      try {
        const searchState = JSON.parse(savedSearchState);
        setSearchQuery(searchState.query);
        setCurrentPage(searchState.page);
        fetchTracks(searchState.page, searchState.query);
      } catch (e) {
        console.error('Error parsing saved search state:', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- important: empty deps so it doesn't keep resetting searchQuery

  // listener for dropdown, when visible, clicking outside will close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortDropdown && !event.target.closest('.relative')) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortDropdown]);

  // Load playlists from localStorage
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false);

  useEffect(() => {
    const savedPlaylists = localStorage.getItem('userPlaylists');
    if (savedPlaylists) {
      try {
        const parsedPlaylists = JSON.parse(savedPlaylists);
        setPlaylists(parsedPlaylists);
        console.log('Loaded playlists in MusicMixer:', parsedPlaylists.length);
      } catch (error) {
        console.error('Error parsing playlists from localStorage:', error);
        setPlaylists([]);
      }
    } else {
      console.log('No playlists found in localStorage');
      setPlaylists([]);
    }
    setPlaylistsLoaded(true);
  }, []);

  // save playlists to localStorage (temporary) whenever playlists change
  useEffect(() => {
    if (playlistsLoaded) {
      localStorage.setItem('userPlaylists', JSON.stringify(playlists));
      console.log('Saved playlists to localStorage:', playlists.length);

      // Dispatch custom event for same-page communication
      window.dispatchEvent(
        new CustomEvent('playlistsUpdated', {
          detail: { playlists },
        })
      );
      console.log('Dispatched playlistsUpdated event from MusicMixer');
    }
  }, [playlists, playlistsLoaded]);

  // handle right click on track card
  const handleRightClick = (e, track) => {
    e.preventDefault();
    setSelectedTrack(track);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // adding track to playlist
  const addToPlaylist = (playlist, track) => {
    const trackExists = playlist.tracks.some(
      (existingTrack) => existingTrack.id === track.id
    );

    if (trackExists) {
      showNotification(`"${track.title}" is already in "${playlist.name}"`);
      return;
    }

    const updatedPlaylists = playlists.map((p) =>
      p.id === playlist.id
        ? {
            ...p,
            tracks: [...p.tracks, track],
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    setPlaylists(updatedPlaylists);

    showNotification(`"${track.title}" has been added to playlist "${playlist.name}"`);

    setShowPlaylistMenu(false);
    setShowContextMenu(false);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showContextMenu && !event.target.closest('.context-menu')) {
        setShowContextMenu(false);
        setShowPlaylistMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  // listen for localStorage changes made in Playlists page
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userPlaylists' && e.newValue) {
        try {
          const updatedPlaylists = JSON.parse(e.newValue);
          setPlaylists(updatedPlaylists);
          console.log(
            'Updated playlists from storage event in MusicMixer:',
            updatedPlaylists.length
          );
        } catch (error) {
          console.error(
            'Error parsing updated playlists from storage in MusicMixer:',
            error
          );
        }
      }
    };

    const handlePlaylistUpdate = (event) => {
      const { playlists: updatedPlaylists } = event.detail;
      setPlaylists(updatedPlaylists);
      console.log(
        'Updated playlists from custom event in MusicMixer:',
        updatedPlaylists.length
      );
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('playlistsUpdated', handlePlaylistUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('playlistsUpdated', handlePlaylistUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-[70vh] bg-gray-100">
        {/* mixer module */}
      </div>

      {/* song grid with dynamic padding */}
      <div
        className={`min-h-[50vh] flex flex-col bg-gray-50 ${
          currentTrack ? 'pb-[160px]' : 'pb-4'
        }`}
      >
        {/* Requirement 7 fulfilled */}

        {/* search bar */}
        <div className="p-6 bg-white border-b">
          <div className="flex justify-center items-center gap-4">
            <form onSubmit={handleSearch} className="w-1/2 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for Songs"
                className="w-full px-6 py-3 border border-gray-200 rounded-full
                              bg-gray-50 hover:bg-gray-100 
                              focus:outline-none focus:ring-2 focus:ring-gray-200 
                              focus:border-transparent transition-all"
              />
            </form>

            {/* Requirement 8 fulfilled */}

            {/* sort filter dropdown menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="p-3 border border-gray-200 rounded-full bg-gray-50 hover:bg-gray-100 
                             focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
                      Sort by
                    </div>
                    <button
                      onClick={() => {
                        setSortOption('popularity-high');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortOption === 'popularity-high'
                          ? 'bg-gray-50 text-blue-600'
                          : 'text-gray-700'
                      }`}
                    >
                      Highest Popularity (Default)
                    </button>
                    <button
                      onClick={() => {
                        setSortOption('popularity-low');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortOption === 'popularity-low'
                          ? 'bg-gray-50 text-blue-600'
                          : 'text-gray-700'
                      }`}
                    >
                      Lowest Popularity
                    </button>
                    <button
                      onClick={() => {
                        setSortOption('title-asc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortOption === 'title-asc'
                          ? 'bg-gray-50 text-blue-600'
                          : 'text-gray-700'
                      }`}
                    >
                      Song Title (A-Z)
                    </button>
                    <button
                      onClick={() => {
                        setSortOption('artist-asc');
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortOption === 'artist-asc'
                          ? 'bg-gray-50 text-blue-600'
                          : 'text-gray-700'
                      }`}
                    >
                      Artist (A-Z)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold">Track list</h2>
          {tracks.length > 0 && (
            <span className="text-gray-600 text-sm ml-4">
              for '<span className="italic">{searchQuery}</span>'
            </span>
          )}
        </div>

        {error && (
          <div className="flex justify-center items-center p-8">
            <span className="text-red-500 font-medium">{error}</span>
          </div>
        )}

        {/* Requirement 9 fulfilled */}

        {/* song grid layout */}
        <div
          className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${
            isLoading ? 'fade-out' : ''
          }`}
          style={{ animationDelay: isLoading ? '0.1s' : '0s' }}
        >
          <div className="grid grid-cols-5 gap-6 mb-8">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="fade-in-up bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 flex flex-col"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationPlayState: isLoading ? 'paused' : 'running',
                }}
                onContextMenu={(e) => handleRightClick(e, track)}
              >
                {/* album art with preview on hover */}
                <div className="relative aspect-square mb-3 overflow-hidden rounded-md group">
                  <img
                    src={track.album.cover_medium}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    // ✅ use queue-based playback so next/prev work through this list
                    onClick={() => playFromQueue(tracks, index)}
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity duration-400"
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <img className="invert w-10" src={pauseIcon} />
                    ) : (
                      <img className="invert w-10" src={playIcon} />
                    )}
                  </button>
                </div>

                {/* track info: title, artist, and duration */}
                <h3 className="font-semibold truncate">{track.title}</h3>
                <p className="text-sm text-gray-600 truncate mb-2">
                  {track.artist.name}
                </p>

                <div className="mt-auto flex justify-between text-xs text-gray-500">
                  <span>
                    {Math.floor(track.duration / 60)}:
                    {(track.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* intermittent loading */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-500">Loading Tracks...</span>
            </div>
          )}
        </div>

        {/* Requirement 10 fulfilled */}

        {/* pagination controls */}
        {totalTracks > 0 && (
          <div
            className={`fixed left-0 right-0 pagination-slide-up z-40 ${
              currentTrack ? 'bottom-[80px]' : 'bottom-0'
            }`}
          >
            <div className="p-4 border-t bg-white/90 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-black rounded hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-600 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="p-2 bg-white border border-black rounded hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* context menu */}
      {showContextMenu && selectedTrack && (
        <div
          className="context-menu fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            minWidth: '160px',
          }}
        >
          {/* Requirement 15 fulfilled (1/2) */}
          <button
            onClick={() => {
              setShowPlaylistMenu(true);
              setShowContextMenu(false);
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
          >
            Add to Playlist
          </button>
        </div>
      )}

      {/* playlist selection */}
      {showPlaylistMenu && selectedTrack && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 max-h-64 overflow-y-auto"
          style={{
            left: contextMenuPosition.x + 160,
            top: contextMenuPosition.y,
            minWidth: '200px',
          }}
        >
          {playlists.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              No playlists available
            </div>
          ) : (
            <>
              <div className="px-4 py-2 text-xs font-medium text-gray-700 border-b">
                Select a playlist:
              </div>
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => addToPlaylist(playlist, selectedTrack)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  {playlist.icon ? (
                    <img
                      src={playlist.icon}
                      alt={playlist.name}
                      className="w-6 h-6 rounded object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{playlist.name}</div>
                    <div className="text-xs text-gray-500">
                      {playlist.tracks.length}{' '}
                      {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* screen pop-up for when song is added */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {notification}
          </div>
        </div>
      )}
    </div>
  );
}

export default MusicMixer;
