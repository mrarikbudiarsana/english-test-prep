'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
      title={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:scale-105 active:scale-95 ${className}`}
      style={{
        borderColor: 'rgba(8,80,127,0.25)',
        background: 'rgba(8,80,127,0.06)',
        color: '#08507f',
      }}
    >
      <span className="text-sm leading-none" aria-hidden="true">
        {lang === 'id' ? '🇬🇧' : '🇮🇩'}
      </span>
      <span className="tracking-wider">
        {lang === 'id' ? 'EN' : 'ID'}
      </span>
    </button>
  );
}
