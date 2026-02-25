'use client';

import { useMemo } from 'react';
import { PteListeningFillBlanksData } from '@/types/test';

interface PteListeningFillBlanksProps {
  data: PteListeningFillBlanksData;
  answer: Record<string, string> | null;
  onChange: (answer: Record<string, string>) => void;
  readOnly?: boolean;
  correctAnswer?: Record<string, string>;
}

export default function PteListeningFillBlanks({
  data,
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
}: PteListeningFillBlanksProps) {
  const currentAnswer = useMemo(() => answer || {}, [answer]);
  const transcript = data.transcript || '';
  const parts = transcript.split(/(\{[^}]+\})/g);

  const setValue = (blankId: string, value: string) => {
    if (readOnly) return;
    onChange({ ...currentAnswer, [blankId]: value });
  };

  const statusFor = (blankId: string): 'correct' | 'incorrect' | null => {
    if (!readOnly || !correctAnswer) return null;
    const user = (currentAnswer[blankId] || '').trim().toLowerCase();
    const correct = (correctAnswer[blankId] || '').trim().toLowerCase();
    return user === correct ? 'correct' : 'incorrect';
  };

  return (
    <div className="space-y-3">
      <div className="text-base leading-relaxed text-gray-900">
        {parts.map((part, idx) => {
          const match = part.match(/^\{([^}]+)\}$/);
          if (!match) return <span key={idx}>{part}</span>;
          const blankId = match[1];
          const status = statusFor(blankId);
          return (
            <input
              key={idx}
              type="text"
              value={currentAnswer[blankId] || ''}
              onChange={(e) => setValue(blankId, e.target.value)}
              readOnly={readOnly}
              className={[
                'mx-1 inline-block min-w-[100px] rounded border-b-2 px-2 py-1 text-sm',
                status === 'correct'
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : status === 'incorrect'
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : 'border-gray-300 bg-white text-gray-800',
              ].join(' ')}
            />
          );
        })}
      </div>
    </div>
  );
}

