'use client';

import { useCallback } from 'react';
import { TFNGData } from '@/types/test';

interface TrueFalseNotGivenProps {
  data: TFNGData;
  answer: string | null;
  onChange: (answer: string) => void;
  readOnly?: boolean;
  correctAnswer?: string;
}

const OPTIONS = ['TRUE', 'FALSE', 'NOT GIVEN'] as const;

export default function TrueFalseNotGiven({
  data,
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
}: TrueFalseNotGivenProps) {
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

    if (status === 'correct') return 'border-green-400 bg-green-50 ring-1 ring-green-200';
    if (status === 'incorrect') return 'border-red-400 bg-red-50 ring-1 ring-red-200';
    if (status === 'missed') return 'border-green-300 bg-green-50/50 border-dashed';
    if (answer === value) return 'border-blue-400 bg-blue-50 ring-1 ring-blue-200';
    return 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50';
  };

  return (
    <div>
      {/* Statement */}
      <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-700 italic leading-relaxed">
          &ldquo;{data.statement}&rdquo;
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {OPTIONS.map((option) => {
          const status = getOptionStatus(option);

          return (
            <label
              key={option}
              className={`
                flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-all
                ${readOnly ? 'cursor-default' : ''}
                ${getOptionStyle(option)}
              `}
            >
              <input
                type="radio"
                name={`tfng-${data.statement}`}
                checked={answer === option}
                onChange={() => handleSelect(option)}
                disabled={readOnly}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-default"
              />
              <span className="text-sm font-medium text-gray-800">{option}</span>

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
