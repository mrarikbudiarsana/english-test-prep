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
  const blankMarker = data.blankPosition || '___';
  let parts = data.context.split(blankMarker);

  // If split didn't work, try common alternatives
  if (parts.length === 1) {
    const commonMarkers = ['{blank}', '___', '_____', '______', '__________'];
    for (const marker of commonMarkers) {
      const testParts = data.context.split(marker);
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
          const blankMarker = data.blankPosition || '___';
          let segs = context.split(blankMarker);
          if (segs.length === 1) {
            for (const marker of ['{blank}', '___', '_____', '______', '__________']) {
              const testParts = context.split(marker);
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
                let trimmed = raw.trim()
                  .replace(/\u00e2\u20ac\u00a2/g, '\u2022')
                  .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a2/g, '\u2022')
                  .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u201c/g, '\u2013')
                  .replace(/\u00c3\u00a2\u00e2\u201a\u00ac\u201d/g, '\u2014');
                // If a hidden bullet was pasted before a hyphen, normalize to just a hyphen.
                trimmed = trimmed.replace(/^[\u2022*]\s*[-\u2013\u2014]\s+/, '- ');
                if (!trimmed) {
                  return <div key={`sp-${idx}`} className="h-2" />;
                }

                const leadingSpaces = raw.length - raw.replace(/^\s+/, '').length;
                const indentLevel = Math.min(Math.floor(leadingSpaces / 2), 3);

                const strippedNoDots = trimmed.replace(/^[\u2022*]+\s*/, '');
                if (/^[-\u2013\u2014]\s+/.test(strippedNoDots)) {
                  const hyphenContent = strippedNoDots.replace(/^[-\u2013\u2014]\s+/, '');
                  return (
                    <div key={`ln-${idx}`} className="flex items-start gap-2" style={{ marginLeft: `${indentLevel * 16}px` }}>
                      <span className="mt-1 text-gray-900">-</span>
                      <div className="flex-1">
                        {renderInlineWithBlank(hyphenContent)}
                      </div>
                    </div>
                  );
                }

                const bulletMatch = trimmed.match(/^([\-*\u2022\u2013\u2014])\s+(.*)$/);
                const contentText = bulletMatch ? bulletMatch[2] : trimmed;
                const bulletChar = bulletMatch?.[1] || null;

                let bulletSymbol = bulletChar || null;
                let cleanContentText = contentText;

                if (bulletSymbol) {
                  return (
                    <div key={`ln-${idx}`} className="flex items-start gap-2" style={{ marginLeft: `${indentLevel * 16}px` }}>
                      <span className="mt-1 text-gray-900">{bulletSymbol}</span>
                      <div className="flex-1">
                        {renderInlineWithBlank(cleanContentText)}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={`ln-${idx}`} className={idx === 0 ? 'font-semibold' : 'font-semibold mt-2'}>
                    {contentText}
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
          return (
            <div className="text-base text-gray-900 leading-relaxed flex items-start gap-3">
              {/* Bullet point for notes */}
              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
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


