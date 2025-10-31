import React, { useState, useEffect } from 'react'
import { musicService } from '../services/Services';
import { useAudio } from '../context/AudioContext';
import playIcon from '../assets/play-solid-full.svg';
import pauseIcon from '../assets/pause-solid-full.svg';
import { useSearchParams, useNavigate } from 'react-router-dom';

function MusicMixer() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalTracks, setTotalTracks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const tracksPerPage = 20;
  const totalPages = Math.ceil(totalTracks / tracksPerPage);

  const { currentTrack, isPlaying, playTrack } = useAudio();

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

          setTracks(data.data);
          setTotalTracks(data.total);
      } catch (err) {
          console.error('Search Error:', err);
          setError('Unable to fetch tracks, please try a different search..');
      } finally {
          setIsLoading(false);
      }
  };

  const handleSearch = async (e) => {
      e.preventDefault();
      const query = e.target.elements[0].value;
      setSearchQuery(query);
      setCurrentPage(1);
      setSearchParams({ q: query, page: '1' });
      await fetchTracks(1, query);
  };

  const handlePrevPage = async () => {
      if (currentPage > 1) {
          const newPage = currentPage - 1;
          setCurrentPage(newPage);
          setSearchParams({ q: searchQuery, page: newPage.toString() });
          await fetchTracks(newPage);
      }
  };

  const handleNextPage = async () => {
      if (currentPage < totalPages) {
          const newPage = currentPage + 1;
          setCurrentPage(newPage);
          setSearchParams({ q: searchQuery, page: newPage.toString() });
          await fetchTracks(newPage);
      }
  };

  // // load saved search
  // useEffect(() => {
  //     const query = searchParams.get('q') || '';
  //     const page = parseInt(searchParams.get('page')) || 1;
  //     setSearchQuery(query);
  //     setCurrentPage(page);
  //     if (query) {
  //         fetchTracks(page);
  //     }
  // }, []);

  return (
    <div className="min-h-screen flex flex-col">
        <div className="h-[70vh] bg-gray-100">
            {/*mixer module */}
        </div>

        {/*song grid with dynamic padding*/}
        <div className={`min-h-[50vh] flex flex-col bg-gray-50 ${
            currentTrack ? 'pb-[160px]' : 'pb-4'
        }`}>
            {/* search bar */}
            <div className="p-6 bg-white border-b">
              <div className="flex justify-center">
                <form onSubmit={handleSearch} className="w-1/2 relative">
                  <input 
                      type="text" 
                      defaultValue={searchQuery}
                      placeholder="Search for Songs" 
                      className="w-full px-6 py-3 border border-gray-200 rounded-full
                              bg-gray-50 hover:bg-gray-100 
                              focus:outline-none focus:ring-2 focus:ring-gray-200 
                              focus:border-transparent transition-all"
                  />
                </form>
              </div>
              <h2 className="text-2xl font-bold">Track list</h2>
            </div>

            {/* error message in case of debugging*/}
            {error && (
              <div className="flex justify-center items-center p-8">
                <span className="text-red-500 font-medium">{error}</span>
              </div>
            )}

            {/* track grid container */}
            <div 
                className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${isLoading ? 'fade-out' : ''}`} style={{animationDelay: isLoading ? '0.1s' : '0s'}}>
              <div className="grid grid-cols-5 gap-6 mb-8">
                {tracks.map((track, index) => (
                  <div 
                    key={track.id}
                    className="fade-in-up bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 flex flex-col" style={{animationDelay: `${index * 0.1}s`, animationPlayState: isLoading ? 'paused' : 'running'}}>
                    {/* album art with preview on hover*/}
                    <div className="relative aspect-square mb-3 overflow-hidden rounded-md group">
                      <img 
                        src={track.album.cover_medium} 
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => playTrack(track)}
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity duration-400">
                        {currentTrack?.id === track.id && isPlaying ? (<img className="invert w-10" src={pauseIcon}></img>) : (<img className="invert w-10" src={playIcon}></img>)}
                      </button>
                    </div>

                    {/* track info: title, artist, and duration */}
                    <h3 className="font-semibold truncate">{track.title}</h3>
                    <p className="text-sm text-gray-600 truncate mb-2">
                      {track.artist.name}
                    </p>
                
                    <div className="mt-auto flex justify-between text-xs text-gray-500">
                      <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
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

            {/* pagination controls */}
            {totalTracks > 0 && (
                <div className={`fixed left-0 right-0 ${
                    currentTrack ? 'bottom-[80px]' : 'bottom-0'
                } slide-up-pagination z-40`}>
                    <div className="p-4 border-t bg-white/90 backdrop-blur-sm shadow-lg">
                        <div className="flex items-center justify-center gap-4">
                            <button 
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="p-2 bg-white border border-black rounded hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"> 
                                Previous
                            </button>
                            <span className="text-gray-600 font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button 
                                onClick={handleNextPage}
                                disabled={currentPage >= totalPages}
                                className="p-2 bg-white border border-black rounded hover:bg-gray-100 disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}

export default MusicMixer