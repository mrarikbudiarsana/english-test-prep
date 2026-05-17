'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioPlayerOptions {
  playOnce?: boolean;
  autoPlay?: boolean;
  onEnd?: () => void;
  volume?: number;
}

export function useAudioPlayer(options?: UseAudioPlayerOptions) {
  const playOnce = options?.playOnce ?? false;
  const onEnd = options?.onEnd;
  const volume = options?.volume ?? 1;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const playingRef = useRef(false);
  const hasAutoPlayedRef = useRef(false);
  const listenersRef = useRef<{
    audio: HTMLAudioElement;
    loadedmetadata: () => void;
    durationchange: () => void;
    canplay: () => void;
    ended: () => void;
    error: (e: Event) => void;
  } | null>(null);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const updateTime = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(audio.currentTime);
    if (isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }
    if (!audio.paused) {
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  const loadAudio = useCallback((url: string) => {
    if (listenersRef.current) {
      const { audio, loadedmetadata, durationchange, canplay, ended, error } = listenersRef.current;
      audio.removeEventListener('loadedmetadata', loadedmetadata);
      audio.removeEventListener('durationchange', durationchange);
      audio.removeEventListener('canplay', canplay);
      audio.removeEventListener('ended', ended);
      audio.removeEventListener('error', error);
      listenersRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      // Crucial: Clear source and remove from DOM memory
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }
 
    const audio = new Audio();
    // Set src after listener setup to ensure we don't miss early events
    audio.src = url;
    audio.preload = 'metadata';
    audioRef.current = audio;
    setHasPlayed(false);
    setIsLoaded(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    playingRef.current = false;
    hasAutoPlayedRef.current = false;

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleDurationChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setHasPlayed(true);
      playingRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      // Ensure we reach exactly the end
      setCurrentTime(audio.duration);
      onEndRef.current?.();
    };

    const handleError = (e: Event) => {
      console.error('Audio loading error:', e);
      setIsPlaying(false);
      playingRef.current = false;
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    listenersRef.current = {
      audio,
      loadedmetadata: handleLoadedMetadata,
      durationchange: handleDurationChange,
      canplay: handleCanPlay,
      ended: handleEnded,
      error: handleError,
    };

    // Kick off the request immediately so metadata/canplay can resolve.
    audio.load();
  }, []);

  const play = useCallback(() => {
    if (!audioRef.current) return;
    if (playOnce && hasPlayed) return;

    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        playingRef.current = true;
        animFrameRef.current = requestAnimationFrame(updateTime);
      })
      .catch((err) => {
        console.error('Audio play failed:', err);
        setIsPlaying(false);
        playingRef.current = false;
      });
  }, [hasPlayed, playOnce, updateTime]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    playingRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Handle autoPlay
  useEffect(() => {
    if (isLoaded && options?.autoPlay && !isPlaying && (!playOnce || !hasPlayed) && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      play();
    }
  }, [isLoaded, options?.autoPlay, isPlaying, playOnce, hasPlayed, play]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, isLoaded]); // Re-apply volume when a new audio is loaded

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (listenersRef.current) {
        const { audio, loadedmetadata, durationchange, canplay, ended, error } = listenersRef.current;
        audio.removeEventListener('loadedmetadata', loadedmetadata);
        audio.removeEventListener('durationchange', durationchange);
        audio.removeEventListener('canplay', canplay);
        audio.removeEventListener('ended', ended);
        audio.removeEventListener('error', error);
        listenersRef.current = null;
      }
      audioRef.current?.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    hasPlayed,
    isLoaded,
    loadAudio,
    play,
    pause,
    seek,
    canPlay: !playOnce || !hasPlayed,
  };
}
