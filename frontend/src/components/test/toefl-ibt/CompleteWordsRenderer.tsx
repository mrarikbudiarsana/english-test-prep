'use client';

import type { Question } from '@/types/test';

interface CompleteWordsRendererProps {
  question: Question;
  answers: Record<string, string>;
  onChange: (blankId: string, value: string) => void;
}

/**
 * Renders a TOEFL iBT Complete the Words (cloze) item.
 * Uses itemPayload.prompt.textTemplate with ____ placeholders.
 * Each blank is replaced with an inline <input>.
 */
export default function CompleteWordsRenderer({ question, answers, onChange }: CompleteWordsRendererProps) {
  const payload = question.itemPayload;
  const textTemplate: string = payload?.prompt?.textTemplate ?? question.questionText ?? '';
  const blanks: { id: string }[] = payload?.prompt?.blanks ?? [];

  // Split template by ____ and interleave with inputs
  const parts = textTemplate.split('____');

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 font-medium">Complete the text by typing in each blank.</p>
      <div className="text-base leading-relaxed text-gray-900 bg-gray-50 border border-gray-200 rounded-lg p-4">
        {parts.map((part, i) => (
          <span key={i}>
            <span style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
            {i < blanks.length && (
              <input
                type="text"
                value={answers[blanks[i].id] ?? ''}
                onChange={(e) => onChange(blanks[i].id, e.target.value)}
                className="inline-block mx-1 px-2 py-0.5 border-b-2 border-blue-500 bg-transparent text-blue-800 font-medium text-base focus:outline-none focus:border-blue-700 min-w-[80px] max-w-[160px]"
                aria-label={`Blank ${i + 1}`}
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </span>
        ))}
      </div>
      {/* If there are more blanks than ____occurrences, show remaining inputs below */}
      {blanks.length > parts.length - 1 &&
        blanks.slice(parts.length - 1).map((blank, i) => (
          <div key={blank.id} className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Blank {parts.length + i}:</label>
            <input
              type="text"
              value={answers[blank.id] ?? ''}
              onChange={(e) => onChange(blank.id, e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>
        ))}
    </div>
  );
}
