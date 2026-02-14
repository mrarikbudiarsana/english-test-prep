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
  const { options, multiSelect, expectedAnswers } = data;
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const canonicalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.,!?;:]+$/g, '')
      .trim();

  const normalizeOptionText = (text: string, optionKey: string) => {
    const escapedKey = escapeRegExp(optionKey);
    const keyPattern = new RegExp(
      `^\\s*(?:\\(${escapedKey}\\)|\\[${escapedKey}\\]|${escapedKey}(?=[).:\\-\\s]))[).:\\-]?\\s*`,
      'i'
    );
    const stripped = text.replace(keyPattern, '').replace(/\s+/g, ' ').trim();

    const punctSplit = stripped.match(/^(.+?[.!?])\s+(.+)$/);
    if (punctSplit && canonicalize(punctSplit[1]) === canonicalize(punctSplit[2])) {
      return punctSplit[1].trim();
    }

    const words = stripped.split(' ');
    if (words.length >= 8 && words.length % 2 === 0) {
      const midpoint = words.length / 2;
      const firstHalf = words.slice(0, midpoint).join(' ').trim();
      const secondHalf = words.slice(midpoint).join(' ').trim();
      if (canonicalize(firstHalf) === canonicalize(secondHalf)) {
        return firstHalf;
      }
    }

    return stripped;
  };

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
      return 'bg-green-50/50 rounded';
    }
    if (status === 'incorrect') {
      return 'bg-red-50/50 rounded';
    }
    if (status === 'missed') {
      return 'bg-orange-50/50 rounded';
    }
    return ''; // No background, no hover
  };

  return (
    <div className="space-y-2">
      {multiSelect && (
        <p className="text-xs text-gray-500 italic mb-2">
          {expectedAnswers
            ? `Select ${expectedAnswers === 2 ? 'TWO' : expectedAnswers === 3 ? 'THREE' : expectedAnswers} answers`
            : 'Select all that apply'}
        </p>
      )}
      {options.map((option) => {
        const optionKey = option.key || (option as any).id;
        const status = getOptionStatus(optionKey);

        return (
          <label
            key={optionKey}
            className={`
              flex cursor-pointer items-start gap-3 transition-colors
              ${readOnly ? 'cursor-default' : ''}
              ${getOptionStyle(optionKey)}
              ${status ? 'p-2 -ml-2' : ''} 
            `}
          >
            {/* Radio / Checkbox */}
            <div className="pt-0.5">
              {multiSelect ? (
                <input
                  type="checkbox"
                  checked={isSelected(optionKey)}
                  onChange={() => handleMultiSelect(optionKey)}
                  disabled={readOnly}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-default"
                />
              ) : (
                <input
                  type="radio"
                  checked={isSelected(optionKey)}
                  onChange={() => handleSingleSelect(optionKey)}
                  disabled={readOnly}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-default"
                />
              )}
            </div>

            {/* Option Text */}
            <div className="flex flex-1 items-start justify-between gap-2">
              <span className="text-base text-black leading-relaxed not-italic font-normal">
                <span className="mr-2 font-normal text-black">
                  {optionKey}.
                </span>
                {/* Simple rich text rendering for options (supports <u>) */}
                {(() => {
                  const normalizedText = normalizeOptionText(option.text, optionKey);
                  const parts = normalizedText.split(/(<u>.*?<\/u>)/g);
                  return (
                    <span>
                      {parts.map((part, i) => {
                        if (part.startsWith('<u>') && part.endsWith('</u>')) {
                          return <u key={i}>{part.slice(3, -4)}</u>;
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </span>
                  );
                })()}
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
