'use client';

import { useCallback } from 'react';
import { YNNGData } from '@/types/test';

interface YesNoNotGivenProps {
  data: YNNGData;
  answer: string | null;
  onChange: (answer: string) => void;
  readOnly?: boolean;
  correctAnswer?: string;
}

const OPTIONS = ['YES', 'NO', 'NOT GIVEN'] as const;

export default function YesNoNotGiven({
  data,
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
}: YesNoNotGivenProps) {
  const handleSelect = useCallback(
    (value: string) => {
      if (readOnly) return;
      onChange(value);
    },
    [readOnly, onChange]
  );

  const getOptionStatus = (value: string): 'correct' | 'incorrect' | 'missed' | null => {
    if (!readOnly || correctAnswer === undefined) return null;

    const isCorrect = correctAnswer === value;
    const wasSelected = answer === value;

    if (isCorrect && wasSelected) return 'correct';
    if (!isCorrect && wasSelected) return 'incorrect';
    if (isCorrect && !wasSelected) return 'missed';
    return null;
  };

  const getOptionStyle = (value: string): string => {
    const status = getOptionStatus(value);

    // Minimal highlighting for review mode, otherwise plain
    if (status === 'correct') return 'bg-green-50/50 rounded p-1 -ml-1';
    if (status === 'incorrect') return 'bg-red-50/50 rounded p-1 -ml-1';
    if (status === 'missed') return 'bg-orange-50/50 rounded p-1 -ml-1';
    return '';
  };

  return (
    <div>

      {/* Options */}
      <div className="flex flex-col space-y-3">
        {OPTIONS.map((option) => {
          const status = getOptionStatus(option);

          return (
            <label
              key={option}
              className={`
                flex cursor-pointer items-center gap-3 transition-colors
                ${readOnly ? 'cursor-default' : ''}
                ${getOptionStyle(option)}
              `}
            >
              <input
                type="radio"
                name={`ynng-${data.statement}`}
                checked={answer === option}
                onChange={() => handleSelect(option)}
                disabled={readOnly}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-default"
              />
              <span className="text-base text-black leading-relaxed not-italic font-normal">{option}</span>

              {/* Status Icons */}
              <div className="ml-auto">
                {status === 'correct' && (
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {status === 'incorrect' && (
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {status === 'missed' && (
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    Correct
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
