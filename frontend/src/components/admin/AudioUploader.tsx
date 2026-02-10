'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';

interface AudioUploaderProps {
  onUpload: (url: string) => void;
  currentUrl?: string | null;
}

export default function AudioUploader({ onUpload, currentUrl }: AudioUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp3'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select an audio file (.mp3, .wav, or .webm)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await api.post('/upload/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(pct);
          }
        },
      });
      const url = response.data.url || response.data.data?.url;
      setUploadedUrl(url);
      onUpload(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload audio file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedUrl(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Audio File</label>

      {uploadedUrl ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <audio controls src={uploadedUrl} className="flex-1 h-8" preload="metadata">
            <track kind="captions" />
          </audio>
          <Button variant="danger" size="sm" onClick={handleRemove} type="button">
            Remove
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.webm,audio/mpeg,audio/wav,audio/webm"
            onChange={handleFileChange}
            className="hidden"
            id="audio-upload"
            disabled={uploading}
          />
          <label
            htmlFor="audio-upload"
            className="cursor-pointer text-sm text-gray-600 hover:text-blue-600"
          >
            <svg
              className="mx-auto h-10 w-10 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            Click to upload audio file
            <br />
            <span className="text-xs text-gray-400">MP3, WAV, or WebM (max 50MB)</span>
          </label>
        </div>
      )}

      {uploading && (
        <Progress value={progress} label="Uploading..." showValue color="blue" />
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}
