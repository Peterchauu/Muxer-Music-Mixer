import { useAudio } from '../context/AudioContext';
import reverseIcon from '../assets/backward-solid-full.svg'
import playIcon from '../assets/play-solid-full.svg'
import pauseIcon from '../assets/pause-solid-full.svg'
import forwardIcon from '../assets/forward-solid-full.svg'


// Requirement 17 fulfilled

function MusicBar() {
    const { 
        currentTrack, 
        isPlaying, 
        playTrack, 
        volume, 
        handleVolumeChange,
        progress,
        duration,
        handleSeek,
        playNext,
        playPrevious,
        showMusicBar,
        setShowMusicBar
    } = useAudio();

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
        <>
            {/* Hover zone to show music bar */}
            <div 
                className="fixed bottom-0 left-0 right-0 h-16 z-40 pointer-events-auto"
                onMouseEnter={() => setShowMusicBar(true)}
            />
            
            <div className={`fixed bottom-0 left-0 right-0 bg-black text-white shadow-lg z-50 transition-transform duration-600 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                showMusicBar ? 'translate-y-0' : 'translate-y-full'
            }`}>
            {/* progress bar */}
            <div className="absolute top-0 left-0 right-0 group">
                <div 
                    className="absolute bottom-0 left-0 right-0 cursor-pointer"
                    onClick={handleProgressClick}
                >
                    {/* background bar filler to distinguish progress bar from background */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 
                                   group-hover:h-4
                                   bg-gray-700 transition-all duration-300 ease-out"
                    />
                    
                    {/* current progress bar styling */}
                    <div 
                        className="absolute bottom-0 left-0 h-2
                                   group-hover:h-4
                                   bg-blue-500 group-hover:bg-blue-400 
                                   transition-all duration-200 ease-out"
                        style={{ 
                            width: `${(progress / duration) * 100}%`,
                        }}
                    >
                    </div>

                    {/* current runtime that follows the progress bar */}
                    <div className="absolute bottom-4 text-xs bg-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none" 
                         style={{ 
                             left: `${(progress / duration) * 100}%`,
                             transition: 'left 0.1s linear, opacity 0.3s ease-out'
                         }}>
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
                    <button onClick={playPrevious} className='h-10 w-10 hover:scale-110 transition-transform'>
                        <img className='invert' src={reverseIcon} alt="Previous"></img>
                    </button>
                    <button onClick={togglePlayPause} className='h-10 w-10 hover:scale-110 transition-transform'>
                        <img className=' invert' src={isPlaying ? pauseIcon : playIcon} alt="Play/Pause"></img>
                    </button>
                    <button onClick={playNext} className='h-10 w-10 hover:scale-110 transition-transform'>
                        <img className='invert' src={forwardIcon} alt="Next"></img>
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
                        onChange={handleVolumeChange}
                        className="w-24 accent-white"
                    />
                </div>
            </div>
        </div>
        </>
    )
}

export default MusicBar