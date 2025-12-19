/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react";

const AudioContext = createContext(null);

export const useAudio = () => useContext(AudioContext);

export function AudioProvider({ children }) {
  const audioRef = useRef(new Audio());

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // queue state
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  // music bar visibility state
  const [showMusicBar, setShowMusicBar] = useState(true);
  const lastActivityTimeRef = useRef(Date.now());
  const hideTimeoutRef = useRef(null);

  // keep audio element volume in sync with state
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Auto-hide music bar after 5 seconds of inactivity
  useEffect(() => {
    const resetHideTimer = () => {
      // Clear existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Show the music bar
      setShowMusicBar(true);
      lastActivityTimeRef.current = Date.now();

      // Set new timeout to hide after 5 seconds
      hideTimeoutRef.current = setTimeout(() => {
        setShowMusicBar(false);
      }, 5000);
    };

    // Reset timer when track changes or play state changes
    if (currentTrack) {
      resetHideTimer();
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [currentTrack, isPlaying]);

  // wire up timeupdate / metadata / ended
  useEffect(() => {
    const audio = audioRef.current;
    let progressInterval;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // later we can auto-advance: playNext();
    };

    const handlePlay = () => {
      // Start custom progress interval for smoother updates (every 100ms)
      progressInterval = setInterval(() => {
        if (!audio.paused && !audio.ended) {
          setProgress(audio.currentTime || 0);
        }
      }, 100); // Adjust this value for audio updates: lower = faster updates for music bar
    };

    const handlePause = () => {
      // Clear interval when paused
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, []);

  // helper to actually start playback
  const startTrack = (track) => {
    if (!track || !track.preview) return;

    const audio = audioRef.current;
    audio.src = track.preview;

    audio
      .play()
      .then(() => {
        setCurrentTrack(track);
        setIsPlaying(true);
      })
      .catch((err) => {
        console.error("Error playing track:", err);
        setIsPlaying(false);
      });
  };

  // play a single track (used in some places)
  const playTrack = (track) => {
    if (!track) return;

    // if it's the same track, toggle play/pause
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error("Error resuming track:", err);
            setIsPlaying(false);
          });
      }
      return;
    }

    // single-track queue
    setQueue([track]);
    setQueueIndex(0);
    startTrack(track);
  };

  // ✅ play from a specific list + index (search results, playlists, etc.)
  const playFromQueue = (tracks, startIndex) => {
    if (!Array.isArray(tracks) || tracks.length === 0) return;

    const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    const track = tracks[safeIndex];
    if (!track) return;

    setQueue([...tracks]);
    setQueueIndex(safeIndex);
    startTrack(track);
  };

  const playNext = () => {
    if (queue.length === 0) return;

    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      // at the end: stop playback for now
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const nextTrack = queue[nextIndex];
    setQueueIndex(nextIndex);
    startTrack(nextTrack);
  };

  const playPrevious = () => {
    if (queue.length === 0) return;

    // if we're at the first track, just restart it
    if (queueIndex <= 0) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }

    const prevIndex = queueIndex - 1;
    const prevTrack = queue[prevIndex];
    setQueueIndex(prevIndex);
    startTrack(prevTrack);
  };

  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolume(Number.isNaN(value) ? 0.5 : value);
  };

  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    const audio = audioRef.current;

    if (!Number.isNaN(newTime) && audio.duration) {
      audio.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const handleSeek = (percent) => {
    const audio = audioRef.current;
    if (audio.duration) {
      const newTime = (percent / 100) * audio.duration;
      audio.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const value = {
    currentTrack,
    isPlaying,
    playTrack,
    volume,
    handleVolumeChange,
    progress,
    duration,
    handleProgressChange,
    handleSeek,

    // queue stuff
    queue,
    queueIndex,
    playFromQueue,
    playNext,
    playPrevious,

    // music bar visibility
    showMusicBar,
    setShowMusicBar,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}
