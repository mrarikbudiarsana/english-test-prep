'use client';

interface PteWriteFromDictationProps {
  answer: string | null;
  onChange: (answer: string) => void;
  readOnly?: boolean;
  correctAnswer?: string;
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?;:]+$/g, '');
}

export default function PteWriteFromDictation({
  answer,
  onChange,
  readOnly = false,
  correctAnswer,
}: PteWriteFromDictationProps) {
  const current = answer || '';
  const status = readOnly && correctAnswer !== undefined
    ? normalize(current) === normalize(correctAnswer)
      ? 'correct'
      : 'incorrect'
    : null;

  return (
    <div className="space-y-2">
      <textarea
        value={current}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        rows={3}
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none',
          status === 'correct'
            ? 'border-green-400 bg-green-50 text-green-800'
            : status === 'incorrect'
              ? 'border-red-400 bg-red-50 text-red-800'
              : 'border-gray-300 bg-white text-gray-900',
        ].join(' ')}
        placeholder="Type exactly what you hear"
      />
      {readOnly && status === 'incorrect' && correctAnswer && (
        <p className="text-xs text-gray-600">
          Correct answer: <span className="font-semibold text-green-700">{correctAnswer}</span>
        </p>
      )}
    </div>
  );
}

