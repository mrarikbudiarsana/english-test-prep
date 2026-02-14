'use client';

import { useRef, useMemo, memo } from 'react';
import TextHighlighter from './TextHighlighter';

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

  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const processedContent = useMemo(() => {
    if (!content) return '';

    if (variant !== 'toefl_itp') {
      return content.replace(/\n/g, '<br />');
    }

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

      if (/^Line\s+\d+$/i.test(trimmed)) {
        flushParagraph();
        blocks.push(`<div class="toefl-line-marker">${escapeHtml(trimmed)}</div>`);
        continue;
      }

      paragraphBuffer.push(trimmed);
    }

    flushParagraph();
    return blocks.join('');
  }, [content, variant]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}


      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <TextHighlighter enabled={highlightEnabled}>
          <h2 className={variant === 'toefl_itp' ? "text-3xl font-bold text-gray-900 mb-6 max-w-[760px] mx-auto" : "text-xl font-bold text-gray-900 mb-6"}>
            {title}
          </h2>
          <div
            ref={contentRef}
            className={
              variant === 'toefl_itp'
                ? "max-w-[760px] mx-auto text-[15px] leading-8 text-gray-700 selection:bg-blue-100 [&>p]:mb-3 [&>.toefl-line-marker]:my-1 [&>.toefl-line-marker]:text-sm [&>.toefl-line-marker]:italic [&>.toefl-line-marker]:text-gray-500"
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
