'use client';

import { useCallback, useMemo } from 'react';
import { MatchingData } from '@/types/test';

interface MatchingProps {
  data: MatchingData;
  answer: Record<string, string> | null;
  onChange: (answer: Record<string, string>) => void;
  readOnly?: boolean;
  correctAnswer?: Record<string, string>;
}

export default function Matching({
  data,
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
}: MatchingProps) {
  const currentAnswer = useMemo(() => answer || {}, [answer]);

  const handleSelect = useCallback(
    (itemKey: string, optionKey: string) => {
      if (readOnly) return;
      onChange({
        ...currentAnswer,
        [itemKey]: optionKey,
      });
    },
    [readOnly, currentAnswer, onChange]
  );

  const getItemStatus = (
    itemKey: string
  ): 'correct' | 'incorrect' | null => {
    if (!readOnly || !correctAnswer) return null;
    const userVal = currentAnswer[itemKey];
    const correctVal = correctAnswer[itemKey];
    if (!userVal) return 'incorrect';
    return userVal === correctVal ? 'correct' : 'incorrect';
  };

  const getRowStyle = (itemKey: string): string => {
    const status = getItemStatus(itemKey);
    if (status === 'correct') return 'bg-green-50 border-green-200';
    if (status === 'incorrect') return 'bg-red-50 border-red-200';
    return 'bg-white border-gray-200';
  };

  return (
    <div>
      {/* Instructions */}
      {data.instructions && (
        <p className="mb-4 text-sm text-gray-600 italic">{data.instructions}</p>
      )}

      {data.allowReuse && (
        <p className="mb-3 text-xs text-gray-500">
          Note: Options may be used more than once.
        </p>
      )}

      {/* Options Legend */}
      <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Options
        </p>
        <div className="flex flex-wrap gap-2">
          {data.options.map((option) => (
            <span
              key={option.key}
              className="inline-flex items-center gap-1.5 rounded-md bg-white border border-gray-200 px-2.5 py-1.5 text-sm"
            >
              <span className="font-semibold text-blue-600">{option.key}.</span>
              <span className="text-gray-700">{option.text}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Matching Items */}
      <div className="space-y-3">
        {data.items.map((item) => {
          const status = getItemStatus(item.key);

          return (
            <div
              key={item.key}
              className={`flex items-center gap-4 rounded-lg border p-3.5 transition-colors ${getRowStyle(item.key)}`}
            >
              {/* Item Text */}
              <div className="flex-1">
                <span className="text-sm text-gray-800">
                  <span className="mr-2 font-semibold text-gray-500">
                    {item.key}.
                  </span>
                  {item.text}
                </span>
              </div>

              {/* Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={currentAnswer[item.key] || ''}
                  onChange={(e) => handleSelect(item.key, e.target.value)}
                  disabled={readOnly}
                  className={`
                    rounded-md border px-3 py-2 text-sm transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-300
                    ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                    ${
                      status === 'correct'
                        ? 'border-green-400 bg-green-100'
                        : status === 'incorrect'
                        ? 'border-red-400 bg-red-100'
                        : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  <option value="">Select...</option>
                  {data.options.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.key}. {option.text}
                    </option>
                  ))}
                </select>

                {/* Status Icon */}
                {status === 'correct' && (
                  <svg className="h-5 w-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {status === 'incorrect' && (
                  <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Mode: Show correct answers */}
      {readOnly && correctAnswer && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-xs font-medium text-blue-700 mb-2">Correct Answers</p>
          <div className="flex flex-wrap gap-2">
            {data.items.map((item) => (
              <span key={item.key} className="text-sm text-blue-800">
                <span className="font-semibold">{item.key}</span>
                <span className="mx-1 text-blue-400">&rarr;</span>
                <span>{correctAnswer[item.key] || '?'}</span>
                {item !== data.items[data.items.length - 1] && (
                  <span className="ml-2 text-blue-300">|</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
