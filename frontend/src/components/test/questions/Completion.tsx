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
                    <div className="inline-block relative mx-1 align-middle">
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
                        placeholder={readOnly ? '' : '...'}
                      />
                      {!answer && questionNumber && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-gray-400 text-xs pointer-events-none font-medium">
                          {questionNumber}
                        </span>
                      )}
                    </div>
                  )}
                </span>
              ))}
            </div>
          );
        }

        // Default: Detect Note (list) vs Summary (paragraph) based on content
        const text = data.context.trim();
        const isListMode = text.startsWith('-') || text.startsWith('•') || text.startsWith('*') || /^\d+\./.test(text);

        const content = (
          <div className={isListMode ? "flex-1 pt-0.5" : "inline"}>
            {parts.length > 1 ? (
              <div className="inline">
                {parts.map((part, i) => (
                  <span key={i}>
                    <span>{part}</span>
                    {i < parts.length - 1 && (
                      <div className="inline-block relative mx-1 align-middle">
                        <input
                          type="text"
                          value={answer || ''}
                          onChange={handleChange}
                          readOnly={readOnly}
                          className={`
                            w-32 border border-gray-300 px-2 py-1 text-sm rounded bg-white text-center font-medium transition-all
                            focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100
                            placeholder:text-gray-300
                            ${inputStyle.includes('green') ? 'border-green-500 bg-green-50' : ''}
                            ${inputStyle.includes('red') ? 'border-red-500 bg-red-50' : ''}
                            ${readOnly ? 'cursor-default' : ''}
                          `}
                        />
                        {!answer && questionNumber && (
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none font-medium">
                            {questionNumber}
                          </span>
                        )}
                      </div>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <>
                <span className="mb-2 inline">{data.context}</span>
                <div className="inline-block relative mx-1 align-middle">
                  <input
                    type="text"
                    value={answer || ''}
                    onChange={handleChange}
                    readOnly={readOnly}
                    className={`
                      w-32 border border-gray-300 px-2 py-1 text-sm rounded bg-white text-center font-medium transition-all
                      focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100
                      placeholder:text-gray-300
                      ${inputStyle.includes('green') ? 'border-green-500 bg-green-50' : ''}
                      ${inputStyle.includes('red') ? 'border-red-500 bg-red-50' : ''}
                      ${readOnly ? 'cursor-default' : ''}
                  `}
                  />
                  {!answer && questionNumber && (
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none font-medium">
                      {questionNumber}
                    </span>
                  )}
                </div>
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
          <div className="text-base text-gray-900 leading-relaxed mb-4">
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
