'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';

interface VideoUploaderProps {
  onUpload: (url: string) => void;
  currentUrl?: string | null;
}

export default function VideoUploader({ onUpload, currentUrl }: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a video file (.mp4, .webm, .ogg, or .mov)');
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setError('File size must be less than 200MB');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await api.post('/upload/video', formData, {
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
      setError(err.response?.data?.error || 'Failed to upload video file');
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
      <label className="block text-sm font-medium text-gray-700">Video File</label>

      {uploadedUrl ? (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <video controls src={uploadedUrl} className="w-full rounded" preload="metadata" />
          <div className="flex justify-end">
            <Button variant="danger" size="sm" onClick={handleRemove} type="button">
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.webm,.ogg,.mov,video/mp4,video/webm,video/ogg,video/quicktime"
            onChange={handleFileChange}
            className="hidden"
            id="video-upload"
            disabled={uploading}
          />
          <label
            htmlFor="video-upload"
            className="cursor-pointer text-sm text-gray-600 hover:text-blue-600"
          >
            Click to upload video file
            <br />
            <span className="text-xs text-gray-400">MP4, WebM, OGG, or MOV (max 200MB)</span>
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
