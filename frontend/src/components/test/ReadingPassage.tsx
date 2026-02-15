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
        lines: [] as string[],
      };
    }

    // Default variant: simple newline to <br> conversion
    if (variant !== 'toefl_itp') {
      return {
        mode: 'default_html' as const,
        html: content.replace(/\n/g, '<br />'),
        lines: [] as string[],
      };
    }

    // TOEFL ITP variant: Check if content already has HTML tags (legacy format)
    if (containsHtmlTags(content)) {
      // Content has HTML - sanitize and render directly (legacy support)
      const html = isMounted ? sanitizeToeflPassage(content) : escapeHtml(content);
      return {
        mode: 'toefl_legacy_html' as const,
        html,
        lines: [] as string[],
      };
    }

    // Plain text content with manual line breaks - strict line-locked format
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    return {
      mode: 'toefl_plain' as const,
      html: '',
      lines,
    };
  }, [content, variant, isMounted]);

  const renderedToeflLines = useMemo(() => {
    if (variant !== 'toefl_itp' || processedContent.mode !== 'toefl_plain') return [];

    const result: { text: string; lineNumber: number; paragraphStart: boolean }[] = [];
    let lineNumber = 0;
    let paragraphStart = true;

    for (const rawLine of processedContent.lines) {
      if (rawLine.trim() === '') {
        paragraphStart = true;
        continue;
      }

      lineNumber += 1;
      result.push({
        text: rawLine,
        lineNumber,
        paragraphStart,
      });
      paragraphStart = false;
    }

    return result;
  }, [variant, processedContent]);

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
                          <span>{`Line ${lineNumber}`}</span>
                        )}
                      </div>
                      <pre className={`toefl-line-text${line.paragraphStart ? ' paragraph-start' : ''}`}>
                        {line.text}
                      </pre>
                    </div>
                  );
                })}
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
