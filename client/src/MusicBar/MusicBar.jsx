//Requirement 17

import React, { useCallback, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import reverseIcon from '../assets/backward-solid-full.svg'
import playIcon from '../assets/play-solid-full.svg'
import pauseIcon from '../assets/pause-solid-full.svg'
import forwardIcon from '../assets/forward-solid-full.svg'

// Music bar that displays a song icon as well as the skip/pause/play

function MusicBar() {
    const { 
        currentTrack, 
        isPlaying, 
        playTrack, 
        volume, 
        handleVolumeChange,
        progress,
        duration,
        handleSeek
    } = useAudio();

    useEffect(() => {
    }, [currentTrack, isPlaying, volume]);

    const togglePlayPause = () => {
        playTrack(currentTrack);
    };

    const handleProgressClick = (e) => {
        if (!currentTrack) return;
    
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        handleSeek(percent);
    };

    if (!currentTrack) return null;


    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white shadow-lg slide-up z-50">
            {/* progress bar */}
            <div className="absolute top-0 left-0 right-0 group">
                <div 
                    className="absolute bottom-0 left-0 right-0 cursor-pointer"
                    onClick={handleProgressClick}
                >
                    {/* background bar filler to distinguish progress bar from background */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 
                                   group-hover:h-4 group-hover:-translate-y+3
                                   bg-gray-700 transition-all duration-200"
                    />
                    
                    {/* current progress bar styling */}
                    <div 
                        className="absolute bottom-0 left-0 h-2
                                   group-hover:h-4 group-hover:-translate-y+3
                                   bg-white group-hover:bg-gray-200 
                                   transition-all duration-200"
                        style={{ width: `${(progress / duration) * 100}%` }}
                    >
                    </div>

                    <div className="absolute bottom-4 text-xs bg-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ left: `${(progress / duration) * 100}%` }}>
                        {formatTime(progress)}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-3 flex items-center">
                {/* album cover, song title and artist*/}
                <div className="flex items-center gap-4 flex-[0.3] min-w-[200px]">
                    <img 
                        src={currentTrack.album.cover_small} 
                        alt={currentTrack.title}
                        className="w-12 h-12 rounded-md shrink-0"
                    />
                    <div className="min-w-0">
                        <h3 className="font-semibold truncate">{currentTrack.title}</h3>
                        <p className="text-sm text-gray-400 truncate">{currentTrack.artist.name}</p>
                    </div>

                    {/* song runtime and duration */}
                    <div className="text-xs text-gray-400">
                        {formatTime(progress)} / {formatTime(duration)}
                    </div>
                </div>


                {/* media controls */}
                <div className="flex-[0.4] flex justify-center items-center gap-8">
                    <button className='h-10 w-10'>
                        <img className='invert' src={reverseIcon}></img>
                    </button>
                    <button onClick={togglePlayPause} className='h-10 w-10'>
                        <img className=' invert' src={isPlaying ? pauseIcon : playIcon}></img>
                    </button>
                    <button className='h-10 w-10'>
                        <img className='invert' src={forwardIcon}></img>
                    </button>
                </div>

                {/* volume control */}
                <div className="flex-[0.3] flex items-center justify-end gap-2 ">
                    <img></img>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-24 accent-white"
                    />
                </div>
            </div>
        </div> 
    )
}

export default MusicBar