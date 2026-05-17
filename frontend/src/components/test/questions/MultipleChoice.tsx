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
  questionId?: string;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function MultipleChoice({
  data,
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
  questionId,
}: MultipleChoiceProps) {
  const { options, multiSelect, expectedAnswers } = data;

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const canonicalize = (value: string) =>
    value.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.,!?;:]+$/g, '').trim();

  const normalizeOptionText = (text: string, optionKey: string) => {
    const escapedKey = escapeRegExp(optionKey);
    const keyPattern = new RegExp(
      `^\\s*(?:\\(${escapedKey}\\)|\\[${escapedKey}\\]|${escapedKey}(?=[).:\\-]))[).:\\-]?\\s*`,
      'i'
    );
    const stripped = text.replace(keyPattern, '').replace(/\s+/g, ' ').trim();

    const punctSplit = stripped.match(/^(.+?[.!?])\s+(.+)$/);
    if (punctSplit && canonicalize(punctSplit[1]) === canonicalize(punctSplit[2])) {
      return punctSplit[1].trim();
    }
    const punctDuplicate = stripped.match(/^(.+?)[.!?]+\s+\1[.!?]*$/i);
    if (punctDuplicate) return punctDuplicate[1].trim();

    const words = stripped.split(' ');
    if (words.length >= 8 && words.length % 2 === 0) {
      const mid = words.length / 2;
      const a = words.slice(0, mid).join(' ').trim();
      const b = words.slice(mid).join(' ').trim();
      if (canonicalize(a) === canonicalize(b)) return a;
    }
    return stripped;
  };

  const handleSingleSelect = useCallback(
    (key: string) => { if (!readOnly) onChange(key); },
    [readOnly, onChange]
  );

  const handleMultiSelect = useCallback(
    (key: string) => {
      if (readOnly) return;
      const current = Array.isArray(answer) ? answer : [];
      onChange(current.includes(key) ? current.filter(k => k !== key) : [...current, key]);
    },
    [readOnly, answer, onChange]
  );

  const isSelected = (key: string) =>
    multiSelect ? Array.isArray(answer) && answer.includes(key) : answer === key;

  const getStatus = (key: string): 'correct' | 'incorrect' | 'missed' | null => {
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

  const renderText = (text: string, optionKey: string) => {
    const normalized = normalizeOptionText(text, optionKey);
    const parts = normalized.split(/(<u>.*?<\/u>)/g);
    return (
      <>
        {parts.map((part, i) =>
          part.startsWith('<u>') && part.endsWith('</u>') ? (
            <u key={i} className="underline decoration-current decoration-1">{part.slice(3, -4)}</u>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className="mt-4">
      {multiSelect && (
        <p className="mb-3 text-[13px] italic text-slate-500">
          {expectedAnswers
            ? `Select ${expectedAnswers === 2 ? 'TWO' : expectedAnswers === 3 ? 'THREE' : expectedAnswers} answers`
            : 'Select all that apply'}
        </p>
      )}

      {/* Option rows — separated by thin dividers, no outer border */}
      <div className="divide-y divide-slate-200 border border-slate-200 rounded">
        {options.map((option, index) => {
          const optionKey = option.key || (option as any).id;
          const letter = OPTION_LETTERS[index] ?? String(index + 1);
          const selected = isSelected(optionKey);
          const status = getStatus(optionKey);

          return (
            <label
              key={optionKey}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 transition-colors duration-100',
                readOnly ? 'cursor-default' : 'cursor-pointer',
                // review mode colours
                status === 'correct'
                  ? 'bg-emerald-50'
                  : status === 'incorrect'
                    ? 'bg-red-50'
                    : status === 'missed'
                      ? 'bg-amber-50'
                      : selected
                        ? 'bg-slate-100/50'
                        : readOnly
                          ? 'bg-white'
                          : 'bg-white hover:bg-slate-50'
              )}
            >
              {/* Native radio / checkbox — visible and styled */}
              <input
                type={multiSelect ? 'checkbox' : 'radio'}
                checked={selected}
                onChange={() =>
                  multiSelect ? handleMultiSelect(optionKey) : handleSingleSelect(optionKey)
                }
                name={questionId ? `q-${questionId}` : undefined}
                disabled={readOnly}
                className={cn(
                  'h-4 w-4 shrink-0 appearance-none rounded-full border-2 transition-all duration-150 flex items-center justify-center',
                  status === 'correct'
                    ? 'border-emerald-500 bg-emerald-500'
                    : status === 'incorrect'
                      ? 'border-red-500 bg-red-500'
                      : status === 'missed'
                        ? 'border-amber-400 bg-amber-400'
                        : selected
                          ? 'border-[#08507f] bg-[#08507f]'
                          : 'border-slate-400 bg-white'
                )}
                style={selected || status ? {
                  boxShadow: 'inset 0 0 0 2px white',
                } : {}}
              />

              {/* Letter + text */}
              <span
                className={cn(
                  'text-[14px] leading-snug',
                  status === 'correct'
                    ? 'text-emerald-800'
                    : status === 'incorrect'
                      ? 'text-red-800'
                      : status === 'missed'
                        ? 'text-amber-800 font-medium'
                        : selected
                          ? 'text-[#08507f]'
                          : 'text-slate-800'
                )}
              >
                <span className="font-semibold mr-1">{letter})</span>
                {renderText(option.text, optionKey)}
              </span>

              {/* Review badge */}
              {status === 'correct' && (
                <span className="ml-auto shrink-0">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              {status === 'incorrect' && (
                <span className="ml-auto shrink-0">
                  <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
              {status === 'missed' && (
                <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Correct
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
