'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseTimerOptions {
  onTimeUp?: () => void;
}

export function useTimer(options?: UseTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const onTimeUpRef = useRef(options?.onTimeUp);
  onTimeUpRef.current = options?.onTimeUp;

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/timerWorker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, remaining } = e.data;
      if (type === 'TICK') {
        setTimeRemaining(remaining);
      } else if (type === 'TIME_UP') {
        setIsRunning(false);
        onTimeUpRef.current?.();
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const start = useCallback((durationSeconds: number) => {
    workerRef.current?.postMessage({ type: 'START', duration: durationSeconds });
    setTimeRemaining(durationSeconds);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    workerRef.current?.postMessage({ type: 'PAUSE' });
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    workerRef.current?.postMessage({ type: 'RESUME' });
    setIsRunning(true);
  }, []);

  const reset = useCallback((durationSeconds: number) => {
    workerRef.current?.postMessage({ type: 'RESET', duration: durationSeconds });
    setTimeRemaining(durationSeconds);
  }, []);

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: 'STOP' });
    setTimeRemaining(0);
    setIsRunning(false);
  }, []);

  return { timeRemaining, isRunning, start, pause, resume, reset, stop };
}
