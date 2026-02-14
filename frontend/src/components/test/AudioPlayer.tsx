'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface AudioPlayerProps {
  src: string;
  playOnce?: boolean;
  autoPlay?: boolean;
  onEnd?: () => void;
}

export default function AudioPlayer({ src, playOnce, autoPlay, onEnd }: AudioPlayerProps) {
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
  } = useAudioPlayer({ playOnce, autoPlay, onEnd });

  useEffect(() => {
    if (src) {
      loadAudio(src);
    }
  }, [src, loadAudio]);

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
      if (!duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      seek(Math.max(0, Math.min(newTime, duration)));
    },
    [duration, seek]
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const durationDisplay = useMemo(() => {
    if (!isLoaded || !duration || !isFinite(duration)) return '--:--';
    return formatTime(duration);
  }, [duration, formatTime, isLoaded]);

  const durationLabel = durationDisplay === '--:--' ? 'loading...' : durationDisplay;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          disabled={!isLoaded || !canPlay}
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors
            ${!isLoaded || !canPlay
              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
          title={!canPlay ? 'Audio has already been played' : isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress Section */}
        <div className="flex flex-1 flex-col gap-1.5">
          {/* Progress Bar */}
          <div
            className="group relative h-2 w-full cursor-pointer rounded-full bg-gray-200"
            onClick={handleProgressClick}
          >
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-blue-600 opacity-0 shadow transition-opacity group-hover:opacity-100"
              style={{ left: `${progress}%`, marginLeft: '-7px' }}
            />
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{durationLabel}</span>
          </div>
        </div>
      </div>

      {/* Play Once Notice */}
      {playOnce && !canPlay && (
        <p className="mt-2 text-xs text-amber-600">
          This audio can only be played once, as in the real IELTS exam.
        </p>
      )}
    </div>
  );
}
