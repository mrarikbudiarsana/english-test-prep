'use client';

import { useMemo } from 'react';
import { PteReorderParagraphData } from '@/types/test';

interface PteReorderParagraphProps {
  data: PteReorderParagraphData;
  answer: string[] | null;
  onChange: (answer: string[]) => void;
  readOnly?: boolean;
  correctAnswer?: string[];
}

export default function PteReorderParagraph({
  data,
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
}: PteReorderParagraphProps) {
  const blocks = data.blocks || [];
  const defaultOrder = blocks.map((b) => b.id);
  const order = useMemo(
    () => (Array.isArray(answer) && answer.length === blocks.length ? answer : defaultOrder),
    [answer, blocks.length, defaultOrder]
  );

  const move = (index: number, dir: -1 | 1) => {
    if (readOnly) return;
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  };

  const getBlock = (id: string) => blocks.find((b) => b.id === id);

  return (
    <div className="space-y-2">
      {order.map((id, idx) => {
        const block = getBlock(id);
        if (!block) return null;
        const isCorrect = readOnly && Array.isArray(correctAnswer) ? correctAnswer[idx] === id : null;
        return (
          <div
            key={id}
            className={[
              'rounded-lg border p-3',
              isCorrect === true
                ? 'border-green-200 bg-green-50'
                : isCorrect === false
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200 bg-white',
            ].join(' ')}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Position {idx + 1}</span>
              {!readOnly && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === order.length - 1}
                    className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                  >
                    Down
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-800">{block.text}</p>
          </div>
        );
      })}
    </div>
  );
}

