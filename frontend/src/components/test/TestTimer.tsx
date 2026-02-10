'use client';

import { useMemo } from 'react';

interface TestTimerProps {
  timeRemaining: number;
  isRunning: boolean;
}

export default function TestTimer({ timeRemaining, isRunning }: TestTimerProps) {
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(Math.max(0, timeRemaining) / 60);
    const seconds = Math.max(0, timeRemaining) % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [timeRemaining]);

  const colorClass = useMemo(() => {
    if (timeRemaining > 600) return 'text-green-600 bg-green-50 border-green-200';
    if (timeRemaining > 300) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  }, [timeRemaining]);

  const shouldPulse = timeRemaining < 60 && timeRemaining > 0 && isRunning;

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-lg border px-4 py-2
        font-mono text-lg font-semibold tabular-nums transition-colors
        ${colorClass}
        ${shouldPulse ? 'animate-pulse' : ''}
      `}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
        />
      </svg>
      <span>{formattedTime}</span>
      {!isRunning && timeRemaining > 0 && (
        <span className="text-xs font-normal opacity-60">paused</span>
      )}
    </div>
  );
}
