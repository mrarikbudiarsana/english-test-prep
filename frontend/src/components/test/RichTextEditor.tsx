'use client';

import { useCallback, useEffect, useRef, useMemo } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  minWords?: number;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  minWords = 0,
  placeholder = 'Start writing your response here...',
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [value]);

  const isAboveMin = wordCount >= minWords;

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full resize-none rounded-t-lg border-0 px-5 py-4 text-gray-800 leading-relaxed placeholder-gray-400 focus:outline-none focus:ring-0"
        style={{ minHeight: '200px' }}
      />

      {/* Word Count Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              minWords > 0
                ? isAboveMin
                  ? 'text-green-600'
                  : 'text-red-500'
                : 'text-gray-600'
            }`}
          >
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          {minWords > 0 && (
            <span className="text-sm text-gray-400">
              / {minWords} minimum
            </span>
          )}
        </div>
        {minWords > 0 && (
          <div className="flex items-center gap-1.5">
            {isAboveMin ? (
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
              </svg>
            )}
            <span className={`text-xs ${isAboveMin ? 'text-green-500' : 'text-red-400'}`}>
              {isAboveMin
                ? 'Minimum reached'
                : `${minWords - wordCount} more needed`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
