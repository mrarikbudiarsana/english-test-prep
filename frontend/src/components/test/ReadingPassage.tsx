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
    if (!content) {
      return {
        mode: 'default_html' as const,
        html: '',
        lines: [] as { text: string; paragraphStart: boolean }[],
      };
    }

    // Default variant: simple newline to <br> conversion
    if (variant !== 'toefl_itp') {
      return {
        mode: 'default_html' as const,
        html: content.replace(/\n/g, '<br />'),
        lines: [] as { text: string; paragraphStart: boolean }[],
      };
    }

    // TOEFL ITP variant: Check if content already has HTML tags (legacy format)
    if (containsHtmlTags(content)) {
      // Content has HTML - sanitize and render directly (legacy support)
      const html = isMounted ? sanitizeToeflPassage(content) : escapeHtml(content);
      return {
        mode: 'toefl_legacy_html' as const,
        html,
        lines: [] as { text: string; paragraphStart: boolean }[],
      };
    }

    // Helper to split a line of text into chunks of max 80 chars at word boundaries
    const splitLineAtWordBoundary = (line: string, maxLen: number = 80): string[] => {
      if (line.length <= maxLen) return [line];
      const words = line.split(' ');
      const result: string[] = [];
      let current = '';
      for (const word of words) {
        if ((current + ' ' + word).trim().length <= maxLen) {
          current = current === '' ? word : current + ' ' + word;
        } else {
          if (current !== '') result.push(current);
          current = word;
        }
      }
      if (current !== '') result.push(current);
      return result;
    };

    // Plain text content with manual line breaks - strict line-locked format
    const rawLines = content.replace(/\r\n/g, '\n').split('\n');
    const lines: { text: string; paragraphStart: boolean }[] = [];
    
    let isNewParagraph = true;
    for (const rawLine of rawLines) {
      if (rawLine.trim() === '') {
        isNewParagraph = true;
        continue;
      }
      
      const chunks = splitLineAtWordBoundary(rawLine, 80);
      chunks.forEach((chunk, index) => {
        lines.push({
          text: chunk,
          paragraphStart: index === 0 && isNewParagraph,
        });
      });
      isNewParagraph = false;
    }

    return {
      mode: 'toefl_plain' as const,
      html: '',
      lines,
    };
  }, [content, variant, isMounted]);

  const renderedToeflLines = useMemo(() => {
    if (variant !== 'toefl_itp' || processedContent.mode !== 'toefl_plain') return [];

    return processedContent.lines.map((lineObj, index) => ({
      text: lineObj.text,
      lineNumber: index + 1,
      paragraphStart: lineObj.paragraphStart,
    }));
  }, [variant, processedContent]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <TextHighlighter enabled={highlightEnabled}>
          {title && title.trim() && (
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
          >
            {variant === 'toefl_itp' && processedContent.mode === 'toefl_plain' ? (
              <div className="toefl-line-grid">
                {renderedToeflLines.map((line, index) => {
                  const lineNumber = line.lineNumber;
                  const showLineLabel = lineNumber % 5 === 0;

                  return (
                    <div
                      key={index}
                      className={`toefl-line-row${line.paragraphStart ? ' paragraph-start' : ''}`}
                    >
                      <div className="toefl-line-marker" aria-hidden="true">
                        {showLineLabel && (
                          <span>{lineNumber}</span>
                        )}
                      </div>
                      <pre className={`toefl-line-text${line.paragraphStart ? ' paragraph-start' : ''}`}>
                        {line.text}
                      </pre>
                    </div>
                  );
                })}
              </div>
            ) : variant === 'toefl_itp' && processedContent.mode === 'toefl_legacy_html' ? (
              <div className="relative pl-10">
                {/* Dynamic Line Numbers Ruler for HTML content */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none flex flex-col items-end text-[0.75rem] text-slate-400 select-none overflow-hidden" 
                  style={{ lineHeight: 1.6 }}
                  aria-hidden="true"
                >
                  {Array.from({ length: 150 }).map((_, i) => {
                    const lineNum = i + 1;
                    return (
                      <div key={i} className="h-[1.6em] w-full flex items-start justify-end">
                        {lineNum % 5 === 0 ? <span>{lineNum}</span> : null}
                      </div>
                    );
                  })}
                </div>
                {/* Passage HTML */}
                <div 
                  className="toefl-html-content"
                  dangerouslySetInnerHTML={{ __html: processedContent.html }} 
                />
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: processedContent.html }} />
            )}
          </div>
        </TextHighlighter>
      </div>
    </div>
  );
}

export default memo(ReadingPassage);
