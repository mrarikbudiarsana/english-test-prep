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
  const listenersRef = useRef<{
    audio: HTMLAudioElement;
    loadedmetadata: () => void;
    durationchange: () => void;
    timeupdate: () => void;
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
      const { audio, loadedmetadata, durationchange, timeupdate } = listenersRef.current;
      audio.removeEventListener('loadedmetadata', loadedmetadata);
      audio.removeEventListener('durationchange', durationchange);
      audio.removeEventListener('timeupdate', timeupdate);
      listenersRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }

    const audio = new Audio(url);
    audio.preload = 'metadata';
    audioRef.current = audio;
    setHasPlayed(false);
    setIsLoaded(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    playingRef.current = false;

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleDurationChange = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    listenersRef.current = {
      audio,
      loadedmetadata: handleLoadedMetadata,
      durationchange: handleDurationChange,
      timeupdate: handleTimeUpdate,
    };

    audio.addEventListener('canplay', () => {
      setIsLoaded(true);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setHasPlayed(true);
      playingRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      onEndRef.current?.();
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
      setIsPlaying(false);
      playingRef.current = false;
    });

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
    if (isLoaded && options?.autoPlay && !isPlaying && (!playOnce || !hasPlayed)) {
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
        const { audio, loadedmetadata, durationchange, timeupdate } = listenersRef.current;
        audio.removeEventListener('loadedmetadata', loadedmetadata);
        audio.removeEventListener('durationchange', durationchange);
        audio.removeEventListener('timeupdate', timeupdate);
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
