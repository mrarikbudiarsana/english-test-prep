'use client';

import type { Question } from '@/types/test';

interface ReadMcqRendererProps {
  question: Question;
  answer: string | null;
  onChange: (key: string) => void;
  passageText?: string | null;
}

/**
 * Renders a TOEFL iBT Reading MCQ item.
 * Supports both:
 *  - read_daily_life: notice/sign card (short text, optional image)
 *  - read_academic_passage: passage text (from section) + MCQ
 *  - generic MCQ (fallback)
 */
export default function ReadMcqRenderer({ question, answer, onChange, passageText }: ReadMcqRendererProps) {
  const payload = question.itemPayload;
  const taskType = payload?.taskType;

  // Resolve MCQ options: prefer itemPayload.prompt.options, fall back to questionData.options
  const options: { key: string; text: string }[] =
    payload?.prompt?.options ??
    (question.questionData as any)?.options ??
    [];

  const stem: string =
    payload?.prompt?.stem ?? question.questionText ?? '';

  const mediaUrl: string | null = payload?.prompt?.media?.[0]?.url ?? null;

  return (
    <div className="space-y-4">
      {/* Passage text for academic readings */}
      {(taskType === 'read_academic_passage' || (!taskType && passageText)) && passageText && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
          {passageText}
        </div>
      )}

      {/* Image for daily life readings */}
      {mediaUrl && (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="Reading stimulus" className="w-full object-contain max-h-48" />
        </div>
      )}

      {/* Question stem */}
      <p className="text-base font-medium text-gray-900">{stem}</p>

      {/* MCQ options */}
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
              answer === opt.key
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
            }`}
          >
            <span
              className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                answer === opt.key ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-500'
              }`}
            >
              {opt.key}
            </span>
            <span className="text-sm">{opt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
