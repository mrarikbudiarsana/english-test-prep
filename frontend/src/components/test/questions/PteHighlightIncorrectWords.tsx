'use client';

import { useMemo } from 'react';
import { PteHighlightIncorrectWordsData } from '@/types/test';

interface PteHighlightIncorrectWordsProps {
  data: PteHighlightIncorrectWordsData;
  answer: string[] | null;
  onChange: (answer: string[]) => void;
  readOnly?: boolean;
  correctAnswer?: string[];
}

export default function PteHighlightIncorrectWords({
  data,
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
}: PteHighlightIncorrectWordsProps) {
  const selected = useMemo(() => (Array.isArray(answer) ? answer : []), [answer]);
  const correctSet = useMemo(() => new Set(Array.isArray(correctAnswer) ? correctAnswer : []), [correctAnswer]);
  const tokens = data.tokens || [];

  const toggle = (id: string) => {
    if (readOnly) return;
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const tokenClass = (id: string) => {
    const isSelected = selected.includes(id);
    if (!readOnly) {
      return isSelected
        ? 'border-blue-400 bg-blue-50 text-blue-800'
        : 'border-transparent bg-transparent text-gray-800 hover:border-gray-300';
    }
    const isCorrect = correctSet.has(id);
    if (isCorrect && isSelected) return 'border-green-400 bg-green-50 text-green-800';
    if (!isCorrect && isSelected) return 'border-red-400 bg-red-50 text-red-800';
    if (isCorrect && !isSelected) return 'border-orange-400 bg-orange-50 text-orange-800';
    return 'border-transparent bg-transparent text-gray-700';
  };

  return (
    <div className="text-base leading-relaxed">
      {tokens.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => toggle(t.id)}
          disabled={readOnly}
          className={`mx-0.5 mb-1 inline-block rounded border px-1.5 py-0.5 text-sm transition-colors ${tokenClass(t.id)}`}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}

