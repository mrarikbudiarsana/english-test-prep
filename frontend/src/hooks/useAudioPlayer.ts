'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioPlayerOptions {
  playOnce?: boolean;
  onEnd?: () => void;
}

export function useAudioPlayer(options?: UseAudioPlayerOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);

  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(updateTime);
      }
    }
  }, [isPlaying]);

  const loadAudio = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }

    const audio = new Audio(url);
    audio.preload = 'metadata';
    audioRef.current = audio;
    setHasPlayed(false);
    setIsLoaded(false);

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('canplay', () => {
      setIsLoaded(true);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setHasPlayed(true);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      options?.onEnd?.();
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
      setIsPlaying(false);
    });

    // Kick off the request immediately so metadata/canplay can resolve.
    audio.load();
  }, [options]);

  const play = useCallback(() => {
    if (!audioRef.current) return;
    if (options?.playOnce && hasPlayed) return;

    audioRef.current.play();
    setIsPlaying(true);
    animFrameRef.current = requestAnimationFrame(updateTime);
  }, [hasPlayed, options?.playOnce, updateTime]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  useEffect(() => {
    return () => {
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
    canPlay: !options?.playOnce || !hasPlayed,
  };
}
