import React, { useState, useEffect } from 'react'
import { useAudio } from '../context/AudioContext'
import playIcon from '../assets/play-solid-full.svg';
import pauseIcon from '../assets/pause-solid-full.svg';



// Requirement 13 fulfilled

function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistIcon, setNewPlaylistIcon] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [editingPlaylistData, setEditingPlaylistData] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [viewingPlaylist, setViewingPlaylist] = useState(null);

  const { currentTrack, playTrack, isPlaying } = useAudio();

  const handleIconUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target.result;
        setNewPlaylistIcon(base64String);
        setIconPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // clear icon selection
  const clearIcon = () => {
    setNewPlaylistIcon(null);
    setIconPreview(null);
  };

  // load playlists from localStorage on component mount
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false);
  
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('userPlaylists');
    if (savedPlaylists) {
      try {
        const parsedPlaylists = JSON.parse(savedPlaylists);
        setPlaylists(parsedPlaylists);
        console.log('Loaded playlists in Playlists component:', parsedPlaylists.length);
      } catch (error) {
        console.error('Error parsing playlists from localStorage in Playlists:', error);
        setPlaylists([]);
      }
    } else {
      console.log('No playlists found in localStorage (Playlists component)');
      setPlaylists([]);
    }
    setPlaylistsLoaded(true);
  }, []);

  // save playlists to localStorage on removal or addition of new playlists
  useEffect(() => {
    if (playlistsLoaded) { 
      localStorage.setItem('userPlaylists', JSON.stringify(playlists));
      console.log('Saved playlists to localStorage (Playlists component):', playlists.length);
      
      window.dispatchEvent(new CustomEvent('playlistsUpdated', {
        detail: { playlists }
      }));
    }
  }, [playlists, playlistsLoaded]);



  // Requirement 14 fulfilled (1/3)

  const createPlaylist = () => {
    if (newPlaylistName.trim()) {
      if (editingPlaylistData) {
        // editing existing playlist if any
        setPlaylists(playlists.map(playlist => 
          playlist.id === editingPlaylistData.id
            ? { 
                ...playlist, 
                name: newPlaylistName, 
                icon: newPlaylistIcon,
                updatedAt: new Date().toISOString() 
              }
            : playlist
        ));
      } else {
        // playlist properties
        const newPlaylist = {
          id: Date.now(),
          name: newPlaylistName,
          icon: newPlaylistIcon,
          tracks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setPlaylists([...playlists, newPlaylist]);
      }
      
      setNewPlaylistName('');
      setNewPlaylistIcon(null);
      setIconPreview(null);
      setEditingPlaylistData(null);
      setShowCreateModal(false);
    }
  };





  const deletePlaylist = (playlistId) => {
    setPlaylists(playlists.filter(playlist => playlist.id !== playlistId));
    setShowContextMenu(false);
  };

  const renamePlaylist = (playlistId, newName) => {
    if (newName.trim()) {
      setPlaylists(playlists.map(playlist => 
        playlist.id === playlistId 
          ? { ...playlist, name: newName, updatedAt: new Date().toISOString() }
          : playlist
      ));
      setEditingPlaylist(null);
    }
  };

  const handleRightClick = (e, playlist) => {
    e.preventDefault();
    setSelectedPlaylist(playlist);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const editPlaylist = (playlist) => {
    setEditingPlaylistData(playlist);
    setNewPlaylistName(playlist.name);
    setNewPlaylistIcon(playlist.icon);
    setIconPreview(playlist.icon);
    setShowCreateModal(true);
    setShowContextMenu(false);
  };

  const openPlaylist = (playlist) => {
    setViewingPlaylist(playlist);
    setShowPlaylistModal(true);
  };

  const removeSongFromPlaylist = (playlistId, trackId) => {
    setPlaylists(playlists.map(playlist => 
      playlist.id === playlistId
        ? { 
            ...playlist, 
            tracks: playlist.tracks.filter(track => track.id !== trackId),
            updatedAt: new Date().toISOString() 
          }
        : playlist
    ));
    
    if (viewingPlaylist && viewingPlaylist.id === playlistId) {
      setViewingPlaylist({
        ...viewingPlaylist,
        tracks: viewingPlaylist.tracks.filter(track => track.id !== trackId)
      });
    }
  };

  const handleClickOutside = () => {
    setShowContextMenu(false);
    setEditingPlaylist(null);
  };

  // close context menu when clicking outside
  useEffect(() => {
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  // concurrency with localstorage across webpages
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userPlaylists' && e.newValue) {
        try {
          const updatedPlaylists = JSON.parse(e.newValue);
          setPlaylists(updatedPlaylists);
          
          if (viewingPlaylist) {
            const updatedViewingPlaylist = updatedPlaylists.find(p => p.id === viewingPlaylist.id);
            if (updatedViewingPlaylist) {
              setViewingPlaylist(updatedViewingPlaylist);
            }
          }
        } catch (error) {
          console.error('Error parsing updated playlists from storage:', error);
        }
      }
    };

    // Also listen for custom events for same-page communication
    const handlePlaylistUpdate = (event) => {
      const { playlists: updatedPlaylists } = event.detail;
      setPlaylists(updatedPlaylists);
      console.log('Updated playlists from custom event in Playlists:', updatedPlaylists.length);
      
      if (viewingPlaylist) {
        const updatedViewingPlaylist = updatedPlaylists.find(p => p.id === viewingPlaylist.id);
        if (updatedViewingPlaylist) {
          setViewingPlaylist(updatedViewingPlaylist);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('playlistsUpdated', handlePlaylistUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('playlistsUpdated', handlePlaylistUpdate);
    };
  }, [viewingPlaylist]);

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-16" onClick={handleClickOutside}>
      {/* title and create button section */}
      <div className="bg-slate-800 border-b border-slate-700 px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blue-400 mb-2 tracking-wider">
                YOUR PLAYLISTS
              </h1>
              <p className="text-gray-400">
                Manage and organize your tracks
              </p>
            </div>


            {/* Requirement 14 fulfilled (2/3) */}

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium 
                       hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Playlist
            </button>



          </div>
        </div>
      </div>

      {/* playlist grid */}
      <div className={`max-w-6xl mx-auto p-8 ${currentTrack ? 'pb-[160px]' : 'pb-8'}`}>
        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-blue-500/30 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-400 mb-2">No playlists yet</h3>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-slate-800 p-6 rounded-xl shadow-md border border-blue-500/20 
                         hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
                onClick={() => openPlaylist(playlist)}
                onContextMenu={(e) => handleRightClick(e, playlist)}
              >
                <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-600 
                              rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {playlist.icon ? (
                    <img
                      src={playlist.icon}
                      alt={`${playlist.name} icon`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  )}
                </div>
                
                {editingPlaylist === playlist.id ? (
                  <input
                    type="text"
                    defaultValue={playlist.name}
                    className="w-full font-semibold text-lg bg-transparent border-b border-blue-400 text-white 
                             focus:outline-none focus:border-blue-400 mb-2"
                    autoFocus
                    onBlur={(e) => renamePlaylist(playlist.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renamePlaylist(playlist.id, e.target.value);
                      }
                      if (e.key === 'Escape') {
                        setEditingPlaylist(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3 className="font-semibold text-lg text-white mb-2 truncate">
                    {playlist.name}
                  </h3>
                )}
                
                <p className="text-sm text-gray-400 mb-3">
                  {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                </p>
                
                <p className="text-xs text-gray-500">
                  Created {new Date(playlist.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Requirement 14 fulfilled (3/3) */}

      {/* playlist creation menu */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-xl shadow-2xl shadow-blue-500/20 w-96 border border-blue-500/30">
            <h2 className="text-2xl font-bold mb-6 text-blue-400">
              {editingPlaylistData ? 'Edit Playlist' : 'Create New Playlist'}
            </h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Playlist Name
              </label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
                className="w-full px-4 py-3 border border-blue-500/30 bg-slate-700 text-white placeholder-gray-400 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createPlaylist();
                  if (e.key === 'Escape') {
                    setShowCreateModal(false);
                    setNewPlaylistName('');
                    setNewPlaylistIcon(null);
                    setIconPreview(null);
                    setEditingPlaylistData(null);
                  }
                }}
              />
            </div>

            {/* cover image upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Playlist Icon (Optional)
              </label>
              
              <div className="flex items-center gap-4">
                {/* file browser */}
                <div className="flex-1">
                  <input
                    type="file"
                    id="iconUpload"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="iconUpload"
                    className="flex items-center justify-center px-4 py-2 border-2 border-blue-500/30 
                             rounded-lg cursor-pointer hover:border-blue-500/50 hover:bg-slate-600 transition-all"
                  >
                    <span className="text-sm text-gray-300">
                      {newPlaylistIcon ? 'Change Image' : 'Choose Image'}
                    </span>
                  </label>
                </div>

                {/* remove cover image */}
                {newPlaylistIcon && (
                  <button
                    type="button"
                    onClick={clearIcon}
                    className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-600/20 
                             rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* preview of imported image*/}
              {iconPreview && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg border border-blue-500/30 overflow-hidden bg-slate-700">
                    <img
                      src={iconPreview}
                      alt="Icon preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                  setNewPlaylistIcon(null);
                  setIconPreview(null);
                  setEditingPlaylistData(null);
                }}
                className="px-6 py-2 border border-blue-500/30 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] 
                         transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {editingPlaylistData ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}







      {/* Context Menu */}
      {showContextMenu && selectedPlaylist && (
        <div
          className="fixed bg-slate-800 border border-blue-500/30 rounded-lg shadow-lg shadow-blue-500/20 py-2 z-50"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y,
            minWidth: '160px'
          }}
        >
          <button
            onClick={() => editPlaylist(selectedPlaylist)}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
          >
            Edit
          </button>
          <hr className="my-1 border-slate-700" />
          <button
            onClick={() => deletePlaylist(selectedPlaylist.id)}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      {/* playlist view menu */}
      {showPlaylistModal && viewingPlaylist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl shadow-2xl shadow-blue-500/20 w-3/4 max-w-4xl h-3/4 border border-blue-500/30 flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {viewingPlaylist.icon ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-700">
                    <img
                      src={viewingPlaylist.icon}
                      alt={`${viewingPlaylist.name} icon`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">{viewingPlaylist.name}</h2>
                  <p className="text-gray-400">
                    {viewingPlaylist.tracks.length} {viewingPlaylist.tracks.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPlaylistModal(false);
                  setViewingPlaylist(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* songs list */}
            <div className="flex-1 overflow-y-auto p-6">
              {viewingPlaylist.tracks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-blue-500/30 mb-4">
                  </div>
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No tracks in this playlist</h3>
                </div>
              ) : (
                <div className="space-y-2">
                  {viewingPlaylist.tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center p-3 hover:bg-slate-700 rounded-lg transition-colors group"
                    >
                      {/* track Number */}
                      <div className="w-8 text-center text-sm text-gray-400 mr-3">
                        {index + 1}
                      </div>

                      {/* album Cover */}
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 mr-4 relative">
                        <img 
                          src={track.album.cover_small} 
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => playTrack(track)}
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center 
                                   opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          {currentTrack?.id === track.id && isPlaying ? (
                            <img className="invert w-4" src={pauseIcon} alt="Pause" />
                          ) : (
                            <img className="invert w-4" src={playIcon} alt="Play" />
                          )}
                        </button>
                      </div>

                      {/* track Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{track.title}</h4>
                        <p className="text-sm text-gray-400 truncate">{track.artist.name}</p>
                      </div>

                      {/* duration */}
                      <div className="text-sm text-gray-400 mr-4">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </div>



                    {/* Requirement 15 fulfilled (2/2) */}

                      {/* remove Button */}
                      <button
                        onClick={() => removeSongFromPlaylist(viewingPlaylist.id, track.id)}
                        className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-600/20 
                                 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Remove
                      </button>



                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Playlists