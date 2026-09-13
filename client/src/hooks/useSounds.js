import { useState, useCallback, useRef } from 'react';

export function useSounds() {
  const [isSoundMuted, setIsSoundMuted] = useState(() => {
    return localStorage.getItem('hamsafer_sound_muted') === 'true';
  });
  
  const audioCtxRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const toggleSoundMuted = useCallback(() => {
    setIsSoundMuted((prev) => {
      const next = !prev;
      localStorage.setItem('hamsafer_sound_muted', String(next));
      return next;
    });
  }, []);

  const playTone = useCallback((freqs, durations, type = 'sine', volume = 0.12) => {
    if (isSoundMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      let startTime = ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durations[idx]);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + durations[idx]);

        startTime += durations[idx] * 0.7; // slight overlap for musicality
      });
    } catch (err) {
      console.warn('[useSounds] Audio playback failed:', err);
    }
  }, [isSoundMuted, getAudioContext]);

  // Ascending cheerful chime for partner joining
  const playJoin = useCallback(() => {
    playTone([523.25, 659.25, 783.99], [0.18, 0.18, 0.28], 'sine', 0.15);
  }, [playTone]);

  // Soft descending chime for partner leaving
  const playLeave = useCallback(() => {
    playTone([659.25, 523.25, 392.00], [0.15, 0.15, 0.25], 'sine', 0.12);
  }, [playTone]);

  // Quick soft bubble ping for incoming message
  const playMessage = useCallback(() => {
    playTone([783.99, 987.77], [0.08, 0.14], 'sine', 0.10);
  }, [playTone]);

  // High sweet sparkle for heart / kiss reaction
  const playReaction = useCallback(() => {
    playTone([1046.50, 1318.51, 1567.98], [0.07, 0.07, 0.15], 'triangle', 0.10);
  }, [playTone]);

  return {
    isSoundMuted,
    toggleSoundMuted,
    playJoin,
    playLeave,
    playMessage,
    playReaction
  };
}
