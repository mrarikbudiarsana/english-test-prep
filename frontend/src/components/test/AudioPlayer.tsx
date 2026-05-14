'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  playOnce?: boolean;
  autoPlay?: boolean;
  onEnd?: () => void;
  disabled?: boolean;
  disableScrubbing?: boolean;
  volume?: number;
}

export default function AudioPlayer({
  src,
  playOnce,
  autoPlay,
  onEnd,
  disabled = false,
  disableScrubbing = false,
  volume = 1,
}: AudioPlayerProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    isLoaded,
    canPlay,
    loadAudio,
    play,
    pause,
    seek,
  } = useAudioPlayer({ playOnce, autoPlay: disabled ? false : autoPlay, onEnd, volume });

  useEffect(() => {
    if (src) loadAudio(src);
  }, [src, loadAudio]);

  useEffect(() => {
    if (disabled && isPlaying) pause();
  }, [disabled, isPlaying, pause]);

  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }, []);

  const handlePlayPause = useCallback(() => {
    if (disabled) return;
    isPlaying ? pause() : play();
  }, [disabled, isPlaying, play, pause]);

  const isFinished = !canPlay && !disabled;

  return (
    <div
      className={cn(
        'rounded-lg border bg-white',
        disabled ? 'border-slate-100' : 'border-slate-200',
      )}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {/* ── Header bar ─────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-slate-100"
        style={{ background: 'linear-gradient(90deg, #08507f 0%, #063d61 100%)' }}
      >
        {/* Waveform icon */}
        <svg
          className="w-4 h-4 text-white/80 shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="2"  y="9"  width="2.5" height="6"  rx="1.25" />
          <rect x="6"  y="6"  width="2.5" height="12" rx="1.25" />
          <rect x="10" y="3"  width="2.5" height="18" rx="1.25" />
          <rect x="14" y="6"  width="2.5" height="12" rx="1.25" />
          <rect x="18" y="9"  width="2.5" height="6"  rx="1.25" />
        </svg>

        <span className="text-[11px] font-bold uppercase tracking-widest text-white/90 flex-1">
          Audio Question
        </span>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {playOnce && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-semibold tracking-wide border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Plays Once
            </span>
          )}
          {isFinished && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold tracking-wide border border-emerald-300/30">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Done
            </span>
          )}
          {disabled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-[10px] font-semibold tracking-wide border border-white/10">
              Disabled
            </span>
          )}
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Play / Pause button */}
        <button
          onClick={handlePlayPause}
          disabled={disabled || !isLoaded || !canPlay}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-all duration-150',
            disabled || !isLoaded || !canPlay
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
              : 'border-[#08507f] bg-[#08507f] text-white hover:bg-[#063d61] hover:border-[#063d61] active:scale-95',
          )}
          title={
            disabled      ? 'Audio is disabled'
            : !canPlay    ? 'Already played'
            : isPlaying   ? 'Pause'
            :               'Play'
          }
        >
          {isPlaying ? (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6"  y="4" width="4" height="16" rx="1.5" />
              <rect x="14" y="4" width="4" height="16" rx="1.5" />
            </svg>
          ) : (
            <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4v16l13-8z" />
            </svg>
          )}
        </button>

        {/* Time / Countdown section */}
        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex flex-col">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest mb-0.5",
              isPlaying ? "text-blue-500" : "text-slate-400"
            )}>
              {isFinished ? 'Status' : isPlaying ? 'Playing' : 'Ready'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-xl font-mono font-bold tabular-nums tracking-tight",
                isFinished ? "text-emerald-600" : "text-slate-700"
              )}>
                {isFinished ? 'Finished' : formatTime(Math.max(0, duration - currentTime))}
              </span>
              {!isFinished && duration > 0 && (
                <span className="text-xs font-medium text-slate-400">
                  remaining
                </span>
              )}
            </div>
          </div>

          {/* Simple visual indicator (optional, but keep it minimal) */}
          {!isFinished && isPlaying && (
            <div className="flex items-center gap-1 h-4 px-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-400/60 rounded-full animate-pulse"
                  style={{ 
                    height: '100%', 
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.8s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Disabled notice ─────────────────────────────────── */}
      {disabled && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-[11px] text-slate-400 italic">
            Audio playback is disabled in review mode.
          </p>
        </div>
      )}
    </div>
  );
}
