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

export default function AudioPlayer({ src, playOnce, autoPlay, onEnd, disabled = false, disableScrubbing = false, volume = 1 }: AudioPlayerProps) {
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
    if (src) {
      loadAudio(src);
    }
  }, [src, loadAudio]);

  // If review mode disables audio while it is already playing, force-stop it.
  useEffect(() => {
    if (disabled && isPlaying) {
      pause();
    }
  }, [disabled, isPlaying, pause]);

  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }, []);

  const progress = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || disableScrubbing) return;
      if (!duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      seek(Math.max(0, Math.min(newTime, duration)));
    },
    [disabled, duration, seek]
  );

  const handlePlayPause = useCallback(() => {
    if (disabled) return;
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [disabled, isPlaying, play, pause]);

  const durationDisplay = useMemo(() => {
    if (!isLoaded || !duration || !isFinite(duration)) return '--:--';
    return formatTime(duration);
  }, [duration, formatTime, isLoaded]);

  const durationLabel = durationDisplay === '--:--' ? 'loading...' : durationDisplay;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-3 sm:p-4">
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          disabled={disabled || !isLoaded || !canPlay}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 shadow-sm",
            disabled || !isLoaded || !canPlay
              ? 'cursor-not-allowed bg-slate-50 text-slate-300'
              : 'bg-[#08507f] text-white hover:bg-[#064066] hover:shadow-md hover:scale-105 active:scale-95'
          )}
          title={disabled ? 'Audio is disabled' : !canPlay ? 'Finished' : isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1.5" />
              <rect x="14" y="4" width="4" height="16" rx="1.5" />
            </svg>
          ) : (
            <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4v16l13-8z" />
            </svg>
          )}
        </button>

        {/* Info & Title */}
        <div className="hidden md:block shrink-0 border-r border-slate-100 pr-4">
          <h4 className="text-sm font-semibold text-[#08507f]">Audio Question</h4>
          <p className="text-[10px] text-slate-500 font-medium">Plays once</p>
        </div>

        {/* Progress Section */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div
            className={cn(
              "group relative h-2.5 w-full rounded-full bg-slate-100",
              (disabled || disableScrubbing) ? 'cursor-default' : 'cursor-pointer'
            )}
            onClick={handleProgressClick}
          >
            <div
              className="h-full rounded-full bg-[#08507f] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold font-mono tracking-tight text-slate-500 tabular-nums">
            <span className="flex items-center gap-2">
              <span className="md:hidden text-slate-400 font-semibold uppercase tracking-tighter">Audio Question</span>
              {formatTime(currentTime)}
            </span>
            <span className={cn(durationLabel === 'loading...' ? 'text-slate-300 font-medium' : 'text-slate-500')}>
              {durationLabel}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {!canPlay && !disabled && (
          <div className="hidden sm:flex shrink-0 items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg text-[11px] font-bold text-emerald-700 border border-emerald-100/50 animate-in fade-in zoom-in duration-300">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            FINISHED
          </div>
        )}
      </div>

      {/* Flagged/Disabled Notice (Minimal) */}
      {disabled && (
        <p className="mt-3 text-[10px] text-slate-400 font-medium italic border-t border-slate-50 pt-2">
          Audio playback is disabled during review.
        </p>
      )}
    </div>
  );
}
