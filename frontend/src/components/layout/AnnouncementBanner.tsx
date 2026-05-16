'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, Megaphone } from 'lucide-react';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<{ message: string; active: boolean } | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const res = await api.get('/dashboard/announcement');
        setAnnouncement(res.data.data || res.data);
      } catch (err) {
        console.error('Failed to fetch announcement:', err);
      }
    }
    fetchAnnouncement();
  }, []);

  if (!announcement || !announcement.active || !announcement.message || !isVisible) {
    return null;
  }

  return (
    <div className="relative bg-[#08507f] text-white py-2.5 px-10 text-center animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <Megaphone className="w-4 h-4 flex-shrink-0 text-blue-200" />
        <p className="text-xs sm:text-sm font-bold tracking-wide">
          {announcement.message}
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Close announcement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
