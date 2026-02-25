'use client';

import { useMemo } from 'react';
import { PteReadingFillBlanksDragDropData } from '@/types/test';

interface PteFillBlanksDragDropProps {
  data: PteReadingFillBlanksDragDropData;
  answer: Record<string, string> | null;
  onChange: (answer: Record<string, string>) => void;
  readOnly?: boolean;
  correctAnswer?: Record<string, string>;
}

export default function PteFillBlanksDragDrop({
  data,
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
}: PteFillBlanksDragDropProps) {
  const currentAnswer = useMemo(() => answer || {}, [answer]);
  const segments = data.textSegments || [];
  const blankIds = data.blankIds || [];
  const options = data.options || [];

  const updateBlank = (blankId: string, value: string) => {
    if (readOnly) return;
    onChange({ ...currentAnswer, [blankId]: value });
  };

  const statusFor = (blankId: string): 'correct' | 'incorrect' | null => {
    if (!readOnly || !correctAnswer) return null;
    return currentAnswer[blankId] === correctAnswer[blankId] ? 'correct' : 'incorrect';
  };

  return (
    <div className="space-y-3">
      <div className="text-base text-gray-900 leading-relaxed">
        {segments.map((seg, idx) => {
          const blankId = blankIds[idx];
          const status = blankId ? statusFor(blankId) : null;
          return (
            <span key={idx}>
              {seg}
              {blankId && (
                <span className="mx-1 inline-flex items-center gap-1">
                  <select
                    value={currentAnswer[blankId] || ''}
                    onChange={(e) => updateBlank(blankId, e.target.value)}
                    disabled={readOnly}
                    className={[
                      'rounded-md border px-2.5 py-1 text-sm',
                      status === 'correct'
                        ? 'border-green-400 bg-green-50 text-green-800'
                        : status === 'incorrect'
                          ? 'border-red-400 bg-red-50 text-red-800'
                          : 'border-gray-300 bg-white text-gray-800',
                    ].join(' ')}
                  >
                    <option value=""></option>
                    {options.map((opt) => (
                      <option key={`${blankId}-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </span>
              )}
            </span>
          );
        })}
      </div>

      {readOnly && correctAnswer && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Correct: {Object.entries(correctAnswer).map(([k, v]) => `${k}: ${v}`).join(', ')}
        </div>
      )}
    </div>
  );
}

