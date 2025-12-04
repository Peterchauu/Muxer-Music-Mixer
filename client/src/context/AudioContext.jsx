import { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(new Audio());



    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    // Update progress
    useEffect(() => {
        const audio = audioRef.current;
        
        const handleTimeUpdate = () => {
            setProgress(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    const playTrack = (track) => {
        if (currentTrack?.id === track.id) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
            return;
        }

        audioRef.current.src = track.preview;
        audioRef.current.play();
        setCurrentTrack(track);
        setIsPlaying(true);
    };

    const handleVolumeChange = (newVolume) => {
        setVolume(newVolume);
    };

    // Add seek functionality
    const seekTo = (time) => {
        audioRef.current.currentTime = time;
        setProgress(time);
    };

    const handleSeek = (value) => {
        if (audioRef.current) {
            const newTime = (value / 100) * audioRef.current.duration;
            audioRef.current.currentTime = newTime;
            setProgress(newTime);
        }
    };

    return (
        <AudioContext.Provider value={{ 
            currentTrack, 
            isPlaying, 
            volume,
            progress,
            duration,
            playTrack, 
            handleVolumeChange,
            seekTo,
            handleSeek 
        }}>
            {children}
        </AudioContext.Provider>
    );
}

export const useAudio = () => useContext(AudioContext);