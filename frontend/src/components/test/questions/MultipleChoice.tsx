'use client';

import { useCallback } from 'react';
import { MCQData } from '@/types/test';

interface MultipleChoiceProps {
  data: MCQData;
  answer: string | string[] | null;
  onChange: (answer: string | string[]) => void;
  readOnly?: boolean;
  correctAnswer?: string | string[];
}

export default function MultipleChoice({
  data,
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
}: MultipleChoiceProps) {
  const { options, multiSelect } = data;

  const handleSingleSelect = useCallback(
    (key: string) => {
      if (readOnly) return;
      onChange(key);
    },
    [readOnly, onChange]
  );

  const handleMultiSelect = useCallback(
    (key: string) => {
      if (readOnly) return;
      const current = Array.isArray(answer) ? answer : [];
      if (current.includes(key)) {
        onChange(current.filter((k) => k !== key));
      } else {
        onChange([...current, key]);
      }
    },
    [readOnly, answer, onChange]
  );

  const isSelected = (key: string): boolean => {
    if (multiSelect) {
      return Array.isArray(answer) && answer.includes(key);
    }
    return answer === key;
  };

  const getOptionStatus = (key: string): 'correct' | 'incorrect' | 'missed' | null => {
    if (!readOnly || correctAnswer === undefined) return null;

    const isCorrect = multiSelect
      ? Array.isArray(correctAnswer) && correctAnswer.includes(key)
      : correctAnswer === key;
    const wasSelected = isSelected(key);

    if (isCorrect && wasSelected) return 'correct';
    if (!isCorrect && wasSelected) return 'incorrect';
    if (isCorrect && !wasSelected) return 'missed';
    return null;
  };

  const getOptionStyle = (key: string): string => {
    const status = getOptionStatus(key);

    if (status === 'correct') {
      return 'border-green-400 bg-green-50 ring-1 ring-green-200';
    }
    if (status === 'incorrect') {
      return 'border-red-400 bg-red-50 ring-1 ring-red-200';
    }
    if (status === 'missed') {
      return 'border-green-300 bg-green-50/50 border-dashed';
    }
    if (isSelected(key)) {
      return 'border-blue-400 bg-blue-50 ring-1 ring-blue-200';
    }
    return 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50';
  };

  return (
    <div className="space-y-2.5">
      {multiSelect && (
        <p className="text-xs text-gray-500 italic mb-3">
          Select all that apply
        </p>
      )}
      {options.map((option) => {
        const status = getOptionStatus(option.key);

        return (
          <label
            key={option.key}
            className={`
              flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-all
              ${readOnly ? 'cursor-default' : ''}
              ${getOptionStyle(option.key)}
            `}
          >
            {/* Radio / Checkbox */}
            <div className="pt-0.5">
              {multiSelect ? (
                <input
                  type="checkbox"
                  checked={isSelected(option.key)}
                  onChange={() => handleMultiSelect(option.key)}
                  disabled={readOnly}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-default"
                />
              ) : (
                <input
                  type="radio"
                  checked={isSelected(option.key)}
                  onChange={() => handleSingleSelect(option.key)}
                  disabled={readOnly}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-default"
                />
              )}
            </div>

            {/* Option Text */}
            <div className="flex flex-1 items-start justify-between gap-2">
              <span className="text-sm text-gray-800">
                <span className="mr-2 font-semibold text-gray-500">
                  {option.key}.
                </span>
                {option.text}
              </span>

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
              {status === 'missed' && (
                <span className="shrink-0 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  Correct
                </span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
