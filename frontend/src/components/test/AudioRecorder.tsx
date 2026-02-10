'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete: (url: string, duration: number) => void;
  maxDuration?: number;
}

export default function AudioRecorder({
  onRecordingComplete,
  maxDuration,
}: AudioRecorderProps) {
  const {
    isRecording,
    duration,
    audioUrl,
    isUploading,
    error,
    startRecording,
    stopRecording,
    uploadRecording,
    reset,
  } = useAudioRecorder({ onRecordingComplete });

  const playbackRef = useRef<HTMLAudioElement | null>(null);

  // Auto-stop when max duration is reached
  useEffect(() => {
    if (maxDuration && isRecording && duration >= maxDuration) {
      stopRecording();
    }
  }, [maxDuration, isRecording, duration, stopRecording]);

  const formatDuration = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  const handleUpload = useCallback(async () => {
    const url = await uploadRecording();
    if (url) {
      onRecordingComplete(url, duration);
    }
  }, [uploadRecording, onRecordingComplete, duration]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Recording State */}
      {!audioUrl && (
        <div className="flex flex-col items-center gap-4">
          {/* Record Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
              flex h-16 w-16 items-center justify-center rounded-full transition-all
              ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
              }
            `}
          >
            {isRecording ? (
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="6" />
              </svg>
            )}
          </button>

          <p className="text-sm text-gray-500">
            {isRecording ? 'Click to stop recording' : 'Click to start recording'}
          </p>

          {/* Duration / Max Duration */}
          <div className="flex items-center gap-2 font-mono text-lg">
            <span className={isRecording ? 'text-red-600' : 'text-gray-600'}>
              {formatDuration(duration)}
            </span>
            {maxDuration && (
              <span className="text-gray-400">/ {formatDuration(maxDuration)}</span>
            )}
          </div>

          {/* Waveform Animation */}
          {isRecording && (
            <div className="flex items-center gap-1 h-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-red-400"
                  style={{
                    animation: `waveform 0.8s ease-in-out infinite`,
                    animationDelay: `${i * 0.07}s`,
                    height: '100%',
                  }}
                />
              ))}
              <style jsx>{`
                @keyframes waveform {
                  0%, 100% {
                    transform: scaleY(0.3);
                    opacity: 0.5;
                  }
                  50% {
                    transform: scaleY(1);
                    opacity: 1;
                  }
                }
              `}</style>
            </div>
          )}

          {/* Max Duration Progress Bar */}
          {isRecording && maxDuration && (
            <div className="w-full max-w-xs">
              <div className="h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-red-400 transition-all"
                  style={{ width: `${Math.min((duration / maxDuration) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Playback State */}
      {audioUrl && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Recording complete ({formatDuration(duration)})
            </span>
          </div>

          {/* Native Playback Controls */}
          <audio
            ref={playbackRef}
            src={audioUrl}
            controls
            className="w-full"
          />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`
                flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors
                ${
                  isUploading
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  Upload Recording
                </span>
              )}
            </button>
            <button
              onClick={reset}
              disabled={isUploading}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Re-record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
