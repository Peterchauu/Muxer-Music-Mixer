import { createContext, useContext, useState, useRef, useEffect } from "react";

const MixerContext = createContext(null);

export const useMixer = () => useContext(MixerContext);

export function MixerProvider({ children }) {
  const [mixerSlotA, setMixerSlotA] = useState(null);
  const [mixerSlotB, setMixerSlotB] = useState(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [detectedBPM, setDetectedBPM] = useState(null);
  const [bpmMultiplier, setBpmMultiplier] = useState("1x");
  const [isMixerPlaying, setIsMixerPlaying] = useState(false);
  
  // Initialize audio refs once
  const audioVocalRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null);
  const audioInstrRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null);
  const delayTimeoutRef = useRef(null);

  const resetMixer = () => {
    // Stop and clear audio
    if (audioVocalRef.current) {
      audioVocalRef.current.pause();
      audioVocalRef.current.src = '';
    }
    if (audioInstrRef.current) {
      audioInstrRef.current.pause();
      audioInstrRef.current.src = '';
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    
    // Reset all state
    setMixerSlotA(null);
    setMixerSlotB(null);
    setOffsetMs(0);
    setDetectedBPM(null);
    setBpmMultiplier("1x");
    setIsMixerPlaying(false);
  };

  // Listen for logout events
  useEffect(() => {
    const handleLogout = () => {
      resetMixer();
    };

    window.addEventListener('userLogout', handleLogout);
    return () => window.removeEventListener('userLogout', handleLogout);
  }, []);

  const value = {
    mixerSlotA,
    setMixerSlotA,
    mixerSlotB,
    setMixerSlotB,
    offsetMs,
    setOffsetMs,
    detectedBPM,
    setDetectedBPM,
    bpmMultiplier,
    setBpmMultiplier,
    isMixerPlaying,
    setIsMixerPlaying,
    audioVocalRef,
    audioInstrRef,
    delayTimeoutRef,
    resetMixer,
  };

  return <MixerContext.Provider value={value}>{children}</MixerContext.Provider>;
}
