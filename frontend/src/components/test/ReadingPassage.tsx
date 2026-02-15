'use client';

import { useRef, useMemo, memo, useEffect, useState } from 'react';
import TextHighlighter from './TextHighlighter';
import { sanitizeToeflPassage, containsHtmlTags } from '@/lib/sanitizeHtml';

interface ReadingPassageProps {
  title: string;
  content: string;
  highlightEnabled?: boolean;
  variant?: 'default' | 'toefl_itp';
}

function ReadingPassage({
  title,
  content,
  highlightEnabled = false,
  variant = 'default',
}: ReadingPassageProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Track client-side mount for DOMPurify (requires window)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const processedContent = useMemo(() => {
    if (!content) return '';

    // Default variant: simple newline to <br> conversion
    if (variant !== 'toefl_itp') {
      return content.replace(/\n/g, '<br />');
    }

    // TOEFL ITP variant: Check if content already has HTML tags
    if (containsHtmlTags(content)) {
      // Content has HTML - sanitize and render directly
      return isMounted ? sanitizeToeflPassage(content) : escapeHtml(content);
    }

    // Plain text content - process into structured HTML
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const blocks: string[] = [];
    let paragraphBuffer: string[] = [];

    const flushParagraph = () => {
      if (paragraphBuffer.length === 0) return;
      blocks.push(`<p>${escapeHtml(paragraphBuffer.join(' '))}</p>`);
      paragraphBuffer = [];
    };

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();

      if (!trimmed) {
        flushParagraph();
        continue;
      }

      // Detect line markers like "Line 5" or "Line 10"
      if (/^Line\s+\d+$/i.test(trimmed)) {
        flushParagraph();
        blocks.push(`<span class="line-label">${escapeHtml(trimmed)}</span>`);
        continue;
      }

      paragraphBuffer.push(trimmed);
    }

    flushParagraph();
    return blocks.join('');
  }, [content, variant, isMounted]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <TextHighlighter enabled={highlightEnabled}>
          {title && (
            <h2 className={variant === 'toefl_itp'
              ? "toefl-itp-passage-title"
              : "text-xl font-bold text-gray-900 mb-6"
            }>
              {title}
            </h2>
          )}
          <div
            ref={contentRef}
            className={variant === 'toefl_itp'
              ? "toefl-itp-passage-content"
              : "prose prose-sm max-w-none text-gray-800 leading-relaxed prose-headings:text-gray-900 prose-headings:font-semibold prose-p:mb-4 prose-p:text-gray-700 prose-strong:text-gray-900 prose-em:text-gray-600 selection:bg-blue-100"
            }
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </TextHighlighter>
      </div>
    </div>
  );
}

export default memo(ReadingPassage);
