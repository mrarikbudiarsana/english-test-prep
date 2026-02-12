'use client';

import { useCallback } from 'react';
import { CompletionData } from '@/types/test';

interface CompletionProps {
  data: CompletionData;
  answer: string | null;
  onChange: (answer: string) => void;
  readOnly?: boolean;
  correctAnswer?: string;
  questionNumber?: number | string;
}

export default function Completion({
  data,
  answer,
  onChange,
  readOnly,
  correctAnswer,
  questionNumber,
}: CompletionProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      onChange(e.target.value);
    },
    [readOnly, onChange]
  );

  const getInputStatus = (): 'correct' | 'incorrect' | null => {
    if (!readOnly || correctAnswer === undefined) return null;

    if (!answer) return 'incorrect';

    const normalize = (s: string) =>
      data.caseSensitive ? s.trim() : s.trim().toLowerCase();

    return normalize(answer) === normalize(String(correctAnswer))
      ? 'correct'
      : 'incorrect';
  };

  const status = getInputStatus();

  const inputStyle = (() => {
    if (status === 'correct') {
      return 'border-green-400 bg-green-50 text-green-800 focus:ring-green-300';
    }
    if (status === 'incorrect') {
      return 'border-red-400 bg-red-50 text-red-800 focus:ring-red-300';
    }
    return 'border-gray-300 bg-white text-gray-800 focus:ring-blue-300 focus:border-blue-400';
  })();

  // Split context text at the blank position marker to create inline input
  // Support multiple common markers: {blank}, ___, _____, etc.
  const normalizeContext = (text: string) =>
    text.replace(/\{blank\}/gi, '___');

  const blankMarker = data.blankPosition || '___';
  let parts = normalizeContext(data.context).split(blankMarker);

  // If split didn't work, try common alternatives
  if (parts.length === 1) {
    const commonMarkers = ['{blank}', '___', '_____', '______', '__________'];
    for (const marker of commonMarkers) {
      const testParts = normalizeContext(data.context).split(marker);
      if (testParts.length > 1) {
        parts = testParts;
        break;
      }
    }
  }

  return (
    <div>
      {/* IELTS format title/heading */}
      {data.title && (
        <h4 className="mb-3 text-lg font-bold text-gray-900">
          {data.title}
        </h4>
      )}

      {/* Context with inline input - IELTS style */}
      {/* Context with inline input - Standard vs Note/Summary style */}
      {(() => {
        // Detect layout mode
        const isStandardMode = data.style === 'standard';

        // If standard mode, force simple paragraph rendering without list detection
        if (isStandardMode) {
          return (
            <div className="text-base text-gray-900 leading-relaxed mb-4">
              {parts.map((part, i) => (
                <span key={i}>
                  <span>{part}</span>
                  {i < parts.length - 1 && (
                    <span className="inline-block relative mx-1 align-middle">
                      <input
                        type="text"
                        value={answer || ''}
                        onChange={handleChange}
                        readOnly={readOnly}
                        className={`
                            border-b-2 border-gray-300 px-1 py-0 min-w-[80px] text-center font-medium transition-all bg-transparent focus:outline-none focus:border-blue-600 focus:bg-blue-50/20
                            ${status === 'correct' ? '!border-green-500 text-green-700' : ''}
                            ${status === 'incorrect' ? '!border-red-500 text-red-700' : ''}
                            ${readOnly ? 'cursor-default' : ''}
                          `}
                        placeholder=""
                      />
                      {!answer && questionNumber !== undefined && (
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none font-medium">
                          {questionNumber}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              ))}
            </div>
          );
        }

        // Default: Note/Summary (document flow)
        const text = data.context.trim();
        const normalizedText = text
          .replace(/\u00e2\u20ac\u00a2/g, '\u2022')
          .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a2/g, '\u2022')
          .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u201c/g, '\u2013')
          .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u201d/g, '\u2014');
        const isListMode = /^\s*([\-*\u2022\u2013\u2014]|\d+\.)/.test(normalizedText);

        const noteInputClass = `
          h-8 w-32 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 font-medium text-center
          focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          ${inputStyle.includes('green') ? 'border-green-500 bg-green-50 text-green-900' : ''}
          ${inputStyle.includes('red') ? 'border-red-500 bg-red-50 text-red-900' : ''}
          ${readOnly ? 'cursor-default' : ''}
        `;

        const noteTextClass = data.style !== 'standard' ? 'whitespace-pre-wrap' : '';

        const renderInlineWithBlank = (context: string) => {
          const normalizedContext = normalizeContext(context);
          const blankMarker = data.blankPosition || '___';
          let segs = normalizedContext.split(blankMarker);
          if (segs.length === 1) {
            for (const marker of ['{blank}', '___', '_____', '______', '__________']) {
              const testParts = normalizedContext.split(marker);
              if (testParts.length > 1) { segs = testParts; break; }
            }
          }
          return (
            <span>
              {segs.map((part, i) => (
                <span key={i}>
                  <span>{part}</span>
                  {i < segs.length - 1 && (
                    <span className="inline-block relative mx-1 align-middle">
                      <input
                        type="text"
                        value={answer || ''}
                        onChange={handleChange}
                        readOnly={readOnly}
                        className={noteInputClass}
                      />
                      {!answer && questionNumber !== undefined && (
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none font-medium">
                          {questionNumber}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              ))}
            </span>
          );
        };

        const lines = data.context.split('\n');
        if (lines.length > 1) {
          return (
            <div className="text-base text-gray-900 leading-relaxed space-y-1">
              {lines.map((line, idx) => {
                const raw = line;
                // Hidden bullets: Unicode bullets that should be normalized (NOT asterisk - it's a valid marker)
                const hiddenBulletChars = '[\\u2022\\u2023\\u25E6\\u25CF\\u00B7\\u2219]';
                const hyphenChars = '[-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2212]';
                const rawNoHiddenBullet = raw.replace(new RegExp(`^\\s*${hiddenBulletChars}+\\s*`), '');
                let trimmed = rawNoHiddenBullet.trim()
                  .replace(/\u00e2\u20ac\u00a2/g, '\u2022')
                  .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a2/g, '\u2022')
                  .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u201c/g, '\u2013')
                  .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u201d/g, '\u2014');
                // If a hidden bullet was pasted before a hyphen, normalize to just a hyphen.
                trimmed = trimmed.replace(new RegExp(`^${hiddenBulletChars}+\\s*[-\\u2013\\u2014]\\s+`), '- ');
                if (!trimmed) {
                  return <div key={`sp-${idx}`} className="h-2" />;
                }

                const leadingSpaces = raw.length - raw.replace(/^\s+/, '').length;
                const indentLevel = Math.min(Math.floor(leadingSpaces / 2), 3);
                const rawNoLeadingWs = raw.replace(/^\s+/, '');

                // Check for asterisk bullet (Markdown style)
                if (/^\*\s+/.test(rawNoLeadingWs)) {
                  const asteriskContent = rawNoLeadingWs.replace(/^\*\s+/, '');
                  return (
                    <div key={`ln-${idx}`} className="flex items-start gap-2" style={{ marginLeft: `${indentLevel * 16}px` }}>
                      <span className="mt-1 text-gray-900">•</span>
                      <div className="flex-1">
                        {renderInlineWithBlank(asteriskContent)}
                      </div>
                    </div>
                  );
                }

                // Check for hyphen bullet
                if (new RegExp(`^${hyphenChars}\\s+`).test(rawNoLeadingWs)) {
                  const hyphenContent = rawNoLeadingWs.replace(new RegExp(`^${hyphenChars}\\s+`), '');
                  return (
                    <div key={`ln-${idx}`} className="flex items-start gap-2" style={{ marginLeft: `${indentLevel * 16}px` }}>
                      <span className="mt-1 text-gray-900">-</span>
                      <div className="flex-1">
                        {renderInlineWithBlank(hyphenContent)}
                      </div>
                    </div>
                  );
                }

                const strippedNoDots = trimmed.replace(new RegExp(`^${hiddenBulletChars}+\\s*`), '');
                if (new RegExp(`^${hyphenChars}\\s+`).test(strippedNoDots)) {
                  const hyphenContent = strippedNoDots.replace(new RegExp(`^${hyphenChars}\\s+`), '');
                  return (
                    <div key={`ln-${idx}`} className="flex items-start gap-2" style={{ marginLeft: `${indentLevel * 16}px` }}>
                      <span className="mt-1 text-gray-900">-</span>
                      <div className="flex-1">
                        {renderInlineWithBlank(hyphenContent)}
                      </div>
                    </div>
                  );
                }

                // Use same hyphen chars for bullet detection
                const bulletRegex = new RegExp(`^(${hyphenChars}|[*\\u2022])\\s+(.*)$`);
                const bulletMatch = trimmed.match(bulletRegex);
                const contentText = bulletMatch ? bulletMatch[2] : trimmed;
                const bulletChar = bulletMatch?.[1] || null;

                let bulletSymbol = bulletChar || null;
                let cleanContentText = contentText;

                if (bulletSymbol) {
                  // If a dot bullet is present but content starts with a hyphen-like, prefer the hyphen.
                  if (new RegExp(`^${hyphenChars}\\s+`).test(cleanContentText)) {
                    cleanContentText = cleanContentText.replace(new RegExp(`^${hyphenChars}\\s+`), '');
                    bulletSymbol = '-';
                  }
                  // Normalize all hyphen-like characters to a simple hyphen for display
                  if (/^[-\u2010\u2011\u2012\u2013\u2014\u2212]$/.test(bulletSymbol)) {
                    bulletSymbol = '-';
                  }
                  if (bulletSymbol === '-') {
                    cleanContentText = cleanContentText.replace(new RegExp(`^${hyphenChars}\\s+`), '');
                  }
                  return (
                    <div key={`ln-${idx}`} className="flex items-start gap-2" style={{ marginLeft: `${indentLevel * 16}px` }}>
                      <span className="mt-1 text-gray-900">{bulletSymbol}</span>
                      <div className="flex-1">
                        {renderInlineWithBlank(cleanContentText)}
                      </div>
                    </div>
                  );
                }

                // Non-bullet line: header if short and no blanks, otherwise regular text with blank processing
                const hasBlank = /\{blank\}|_{3,}/i.test(line);
                const isHeader = !hasBlank && contentText.length < 60;
                return (
                  <div key={`ln-${idx}`} className={isHeader ? (idx === 0 ? 'font-semibold' : 'font-semibold mt-2') : ''}>
                    {renderInlineWithBlank(contentText)}
                  </div>
                );
              })}
            </div>
          );
        }

        const content = (
          <div className={isListMode ? `flex-1 pt-0.5 ${noteTextClass}` : `inline ${noteTextClass}`}>
            {parts.length > 1 ? (
              <div className="inline">
                {parts.map((part, i) => (
                  <span key={i}>
                    <span>{part}</span>
                    {i < parts.length - 1 && (
                      <span className="inline-block relative mx-1 align-middle">
                        <input
                          type="text"
                          value={answer || ''}
                          onChange={handleChange}
                          readOnly={readOnly}
                          className={noteInputClass}
                        />
                        {!answer && questionNumber !== undefined && (
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none font-medium">
                            {questionNumber}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <>
                <span className="mb-2 inline">{data.context}</span>
                <span className="inline-block relative mx-1 align-middle">
                  <input
                    type="text"
                    value={answer || ''}
                    onChange={handleChange}
                    readOnly={readOnly}
                    className={noteInputClass}
                  />
                  {!answer && questionNumber !== undefined && (
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none font-medium">
                      {questionNumber}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
        );

        if (isListMode) {
          const trimmedText = data.context.trim()
            .replace(/\u00e2\u20ac\u00a2/g, '\u2022')
            .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a2/g, '\u2022')
            .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u201c/g, '\u2013')
            .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u201d/g, '\u2014');
          const hyphenCharsForMatch = '[-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2212]';
          const bulletRegexSingle = new RegExp(`^(${hyphenCharsForMatch}|[*\\u2022])\\s+(.*)$`);
          const bulletMatch = trimmedText.match(bulletRegexSingle);
          const singleLineContent = bulletMatch ? bulletMatch[2] : trimmedText;

          // Normalize bullet characters
          let bulletSymbol = bulletMatch?.[1] || '•';
          if (/^[-\u2010\u2011\u2012\u2013\u2014\u2212]$/.test(bulletSymbol)) {
            bulletSymbol = '-';
          } else if (bulletSymbol === '*' || bulletSymbol === '\u2022') {
            bulletSymbol = '•';
          }

          // For single-line contexts with bullets, render with the bullet
          // Hyphen bullets are sub-bullets (indented), asterisk/dot bullets are main level
          if (lines.length === 1) {
            const isSubBullet = bulletSymbol === '-';
            return (
              <div
                className="text-base text-gray-900 leading-relaxed flex items-start gap-2"
                style={isSubBullet ? { marginLeft: '16px' } : undefined}
              >
                <span className="mt-1 text-gray-900">{bulletSymbol}</span>
                <div className="flex-1">
                  {renderInlineWithBlank(singleLineContent)}
                </div>
              </div>
            );
          }
          return (
            <div className="text-base text-gray-900 leading-relaxed flex items-start gap-3">
              {/* Bullet point for notes */}
              <div className="mt-1.5 text-gray-700 w-3 text-center">{bulletSymbol}</div>
              {content}
            </div>
          );
        }

        return (
          <div className={`text-base text-gray-900 leading-relaxed mb-4 ${noteTextClass}`}>
            {content}
          </div>
        );
      })()}

      {/* Review Mode: Show correct answer */}
      {readOnly && status === 'incorrect' && correctAnswer !== undefined && (
        <div className="mt-2 text-xs text-gray-600">
          <span>Correct answer: </span>
          <span className="font-semibold text-green-700">
            {String(correctAnswer)}
          </span>
        </div>
      )}
    </div>
  );
}


