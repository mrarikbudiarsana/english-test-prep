'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
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

    // Handles cases like "Text.. Text." or "Text! Text"
    const punctDuplicate = stripped.match(/^(.+?)[.!?]+\s+\1[.!?]*$/i);
    if (punctDuplicate) {
      return punctDuplicate[1].trim();
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
    <div className="space-y-3">
      {multiSelect && (
        <p className="mb-2 text-xs italic text-gray-500">
          {expectedAnswers
            ? `Select ${expectedAnswers === 2 ? 'TWO' : expectedAnswers === 3 ? 'THREE' : expectedAnswers} answers`
            : 'Select all that apply'}
        </p>
      )}
      {options.map((option) => {
        const optionKey = option.key || (option as any).id;
        const status = getOptionStatus(optionKey);
        const selected = isSelected(optionKey);

        return (
          <label
            key={optionKey}
            className={cn(
              "group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-200",
              readOnly ? 'cursor-default' : 'cursor-pointer hover:border-[#08507f]/30 hover:bg-slate-50/50',
              status === 'correct'
                ? 'border-green-500 bg-green-50/50 shadow-sm'
                : status === 'incorrect'
                  ? 'border-red-500 bg-red-50/50 shadow-sm'
                  : status === 'missed'
                    ? 'border-amber-400 bg-amber-50/50'
                    : selected
                      ? 'border-[#08507f] bg-blue-50/30 ring-1 ring-[#08507f]'
                      : 'border-slate-200 bg-white'
            )}
          >
            {/* Custom Circular Indicator */}
            <div className="flex shrink-0 items-center justify-center">
              <div className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                selected 
                  ? "border-[#08507f] bg-[#08507f]" 
                  : "border-slate-300 bg-white group-hover:border-[#08507f]/50"
              )}>
                {selected && (
                  <div className={cn(
                    "rounded-full bg-white",
                    multiSelect ? "h-2 w-2" : "h-2 w-2"
                  )} />
                )}
              </div>
              {/* Hidden native input for accessibility */}
              <input
                type={multiSelect ? "checkbox" : "radio"}
                checked={selected}
                onChange={() => multiSelect ? handleMultiSelect(optionKey) : handleSingleSelect(optionKey)}
                disabled={readOnly}
                className="sr-only"
              />
            </div>

            {/* Option Text */}
            <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
              <span className={cn(
                "text-[15px] sm:text-[16px] leading-relaxed font-normal transition-colors",
                selected ? "text-[#08507f]" : "text-slate-700"
              )}>
                {(() => {
                  const normalizedText = normalizeOptionText(option.text, optionKey);
                  const parts = normalizedText.split(/(<u>.*?<\/u>)/g);
                  return (
                    <span>
                      {parts.map((part, i) => {
                        if (part.startsWith('<u>') && part.endsWith('</u>')) {
                          return <u key={i} className="decoration-[#08507f] decoration-2 font-normal">{part.slice(3, -4)}</u>;
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </span>
                  );
                })()}
              </span>

              {/* Status Indicator (Review Mode) */}
              {status === 'correct' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
              {status === 'incorrect' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              )}
              {status === 'missed' && (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-1 rounded">
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
