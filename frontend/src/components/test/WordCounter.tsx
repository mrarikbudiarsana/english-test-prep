'use client';

import { useMemo } from 'react';

interface WordCounterProps {
  text: string;
  minWords: number;
}

export default function WordCounter({ text, minWords }: WordCounterProps) {
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  const isAboveMin = wordCount >= minWords;

  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-medium ${
        isAboveMin ? 'text-green-600' : 'text-red-500'
      }`}
    >
      {isAboveMin ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {wordCount} {wordCount === 1 ? 'word' : 'words'}
    </span>
  );
}
