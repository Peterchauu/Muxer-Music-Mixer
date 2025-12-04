import { useAudio } from "../context/AudioContext";
import reverseIcon from "../assets/backward-solid-full.svg";
import playIcon from "../assets/play-solid-full.svg";
import pauseIcon from "../assets/pause-solid-full.svg";
import forwardIcon from "../assets/forward-solid-full.svg";

function MusicBar() {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    volume,
    handleVolumeChange,
    progress,
    duration,
    handleProgressChange,
    playNext,
    playPrevious,
  } = useAudio();

  if (!currentTrack) {
    // you can return null here if you only want to show the bar when something is playing,
    // but it looked like you always show it, so we'll keep it visible but "empty"
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white h-24 flex items-center px-6 gap-6 z-20">
      {/* Track info */}
      <div className="flex items-center gap-3 w-1/3 min-w-0">
        {currentTrack?.album?.cover_medium && (
          <img
            src={currentTrack.album.cover_medium}
            alt={currentTrack.title}
            className="w-14 h-14 rounded object-cover"
          />
        )}
        <div className="truncate">
          <div className="font-semibold truncate">
            {currentTrack ? currentTrack.title : "No track selected"}
          </div>
          <div className="text-sm text-gray-300 truncate">
            {currentTrack?.artist?.name || ""}
          </div>
        </div>
      </div>

      {/* Center controls + progress */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="flex items-center gap-4 mb-2">
          <button
            className="h-10 w-10 disabled:opacity-40"
            onClick={playPrevious}
            disabled={!currentTrack}
          >
            <img className="invert" src={reverseIcon} alt="Previous" />
          </button>

          <button
            onClick={() => currentTrack && playTrack(currentTrack)}
            className="h-10 w-10 disabled:opacity-40"
            disabled={!currentTrack}
          >
            <img
              className="invert"
              src={isPlaying ? pauseIcon : playIcon}
              alt={isPlaying ? "Pause" : "Play"}
            />
          </button>

          <button
            className="h-10 w-10 disabled:opacity-40"
            onClick={playNext}
            disabled={!currentTrack}
          >
            <img className="invert" src={forwardIcon} alt="Next" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 w-full max-w-xl">
          <span className="text-xs w-10 text-right">
            {formatTime(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="0.1"
            value={duration ? progress : 0}
            onChange={handleProgressChange}
            className="flex-1 accent-white"
          />
          <span className="text-xs w-10">
            {formatTime(duration || 0)}
          </span>
        </div>
      </div>

      {/* Right: volume */}
      <div className="flex items-center gap-2 w-1/5 justify-end">
        <span className="text-xs">Vol</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolumeChange}
          className="w-28 accent-white"
        />
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
}

export default MusicBar;
