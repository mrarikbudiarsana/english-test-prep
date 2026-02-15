'use client';

import { useCallback, useMemo } from 'react';
import { DropdownData } from '@/types/test';

interface DropdownSelectProps {
  data: DropdownData;
  answer: Record<string, string> | null;
  onChange: (answer: Record<string, string>) => void;
  readOnly?: boolean;
  correctAnswer?: Record<string, string>;
  /** Display number for the question (used for placeholder instead of dropdown key) */
  displayNumber?: number | string;
}

export default function DropdownSelect({
  data,
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
  displayNumber,
}: DropdownSelectProps) {
  const currentAnswer = useMemo(() => answer || {}, [answer]);

  const handleSelect = useCallback(
    (dropdownKey: string, value: string) => {
      if (readOnly) return;
      onChange({
        ...currentAnswer,
        [dropdownKey]: value,
      });
    },
    [readOnly, currentAnswer, onChange]
  );

  const getDropdownStatus = useCallback((
    key: string
  ): 'correct' | 'incorrect' | null => {
    if (!readOnly || !correctAnswer) return null;
    const userVal = currentAnswer[key];
    const correctVal = correctAnswer[key];
    if (!userVal) return 'incorrect';
    return userVal === correctVal ? 'correct' : 'incorrect';
  }, [readOnly, correctAnswer, currentAnswer]);

  // Parse the context text and replace placeholders {1}, {2}, etc. with dropdowns
  const renderedContent = useMemo(() => {
    const dropdownKeys = Object.keys(data.dropdowns);

    // Build a regex to match all placeholders like {1}, {2}, etc.
    const pattern = new RegExp(
      `(${dropdownKeys.map((k) => `\\{${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`).join('|')})`,
      'g'
    );

    const parts = data.context.split(pattern);

    return parts.map((part, index) => {
      // Check if this part matches a placeholder
      const match = part.match(/^\{(.+)\}$/);
      if (match && data.dropdowns[match[1]]) {
        const key = match[1];
        const dropdown = data.dropdowns[key];
        const status = getDropdownStatus(key);

        // Calculate placeholder text: use displayNumber if provided, otherwise fall back to key
        const selectStyle = (() => {
          if (status === 'correct') return 'border-green-400 bg-green-50 text-green-800';
          if (status === 'incorrect') return 'border-red-400 bg-red-50 text-red-800';
          return 'border-gray-300 bg-white text-gray-800';
        })();

        return (
          <span key={index} className="inline-flex items-center gap-1 mx-1">
            <select
              value={currentAnswer[key] || ''}
              onChange={(e) => handleSelect(key, e.target.value)}
              disabled={readOnly}
              className={`
                inline-block rounded-md border px-2.5 py-1 text-sm
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300
                ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                ${selectStyle}
              `}
            >
              <option value=""></option>
              {dropdown.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {status === 'correct' && (
              <svg className="inline h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {status === 'incorrect' && (
              <svg className="inline h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </span>
        );
      }

      // Regular text
      return <span key={index}>{part}</span>;
    });
  }, [data, currentAnswer, readOnly, handleSelect, getDropdownStatus]);

  return (
    <div>
      {/* Context with inline dropdowns */}
      <div className="text-base text-gray-900 leading-relaxed mb-4">
        {renderedContent}
      </div>

      {/* Review Mode: Show correct answers */}
      {readOnly && correctAnswer && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-xs font-medium text-blue-700 mb-2">Correct Answers</p>
          <div className="space-y-1">
            {(() => {
              const sortedKeys = Object.keys(correctAnswer).sort((a, b) => {
                const numA = parseInt(a, 10);
                const numB = parseInt(b, 10);
                if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                return a.localeCompare(b);
              });
              return sortedKeys.map((key, idx) => {
                const displayNum = displayNumber !== undefined
                  ? (typeof displayNumber === 'number' ? displayNumber + idx : displayNumber)
                  : key;
                return (
                  <div key={key} className="flex items-center gap-2 text-sm text-blue-800">
                    <span className="font-semibold">({displayNum})</span>
                    <span className="text-blue-400">&rarr;</span>
                    <span className="font-medium">{correctAnswer[key]}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
