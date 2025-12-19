import React from 'react';
import playIcon from '../assets/play-solid-full.svg';
import pauseIcon from '../assets/pause-solid-full.svg';

function TrackCard({ 
  track, 
  index,
  trackData,
  isFlipped,
  currentTrack,
  isPlaying,
  onCardClick,
  onLikeToggle,
  onPlayClick,
  onContextMenu
}) {
  const data = trackData || { isLiked: false, vocalsCount: 0, instrumentalCount: 0 };

  return (
    <div
      className={`flip-card ${isFlipped ? 'flipped' : ''}`}
      onClick={(e) => onCardClick(e, track.id)}
      onContextMenu={(e) => onContextMenu(e, track)}
    >
      <div className="flip-card-inner">
        {/* Front of card */}
        <div className="flip-card-front bg-slate-800 p-4 rounded-lg shadow-md border border-blue-500/20 flex flex-col transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:border-blue-500/50 hover:-translate-y-2 hover:scale-[1.01]">
          <div className="relative aspect-square mb-3 overflow-hidden rounded-md group">
            <img src={track.album.cover_medium} alt={track.title} className="w-full h-full object-cover pointer-events-none" />
            
            {/* Like Button - shows on hover or when liked */}
            <button
              onClick={(e) => onLikeToggle(e, track)}
              className={`absolute top-2 right-2 z-10 transition-all duration-200 ${
                data.isLiked
                  ? 'opacity-100' 
                  : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <svg 
                className={`w-6 h-6 ${
                  data.isLiked
                    ? 'fill-pink-500 stroke-pink-500' 
                    : 'fill-none stroke-white'
                } transition-colors duration-200 drop-shadow-lg pointer-events-none`}
                viewBox="0 0 24 24" 
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            <button
              onClick={() => onPlayClick(index)}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity duration-200"
            >
              <img 
                className="invert w-10 pointer-events-none" 
                src={currentTrack?.id === track.id && isPlaying ? pauseIcon : playIcon} 
                alt="Play" 
              />
            </button>
          </div>
          <h3 className="font-semibold truncate text-white pointer-events-none">{track.title}</h3>
          <p className="text-sm text-gray-400 truncate mb-2 pointer-events-none">{track.artist.name}</p>
        </div>

        {/* Back of card - Usage Statistics */}
        <div className="flip-card-back bg-slate-800 p-4 rounded-lg shadow-md border border-blue-500/20 flex flex-col justify-center items-center transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:border-blue-500/50 hover:-translate-y-2 hover:scale-[1.01]">
          <h3 className="font-semibold text-white mb-4 text-center pointer-events-none">Usage Statistics</h3>
          
          <div className="w-full space-y-3 pointer-events-none">
            {/* Vocals Usage */}
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                </svg>
                <span className="text-blue-300 font-medium">Vocals</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">{data.vocalsCount}</div>
                <div className="text-xs text-blue-300/70">times used</div>
              </div>
            </div>

            {/* Instrumental Usage */}
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
                <span className="text-red-300 font-medium">Instrumental</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400">{data.instrumentalCount}</div>
                <div className="text-xs text-red-300/70">times used</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4 pointer-events-none">Click to flip back</p>
        </div>
      </div>
    </div>
  );
}

export default TrackCard;
