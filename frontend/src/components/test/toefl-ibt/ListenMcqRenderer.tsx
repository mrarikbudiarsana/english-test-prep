'use client';

import AudioPlayer from '@/components/test/AudioPlayer';
import type { Question } from '@/types/test';

interface ListenMcqRendererProps {
  question: Question;
  answer: string | null;
  onChange: (key: string) => void;
}

/**
 * Renders a TOEFL iBT Listening MCQ item.
 * Shows an AudioPlayer for the item audio, optional image, then MCQ options.
 */
export default function ListenMcqRenderer({ question, answer, onChange }: ListenMcqRendererProps) {
  const payload = question.itemPayload;

  const audioUrl: string | null =
    payload?.prompt?.audio?.url ?? question.audioUrl ?? null;

  const mediaUrl: string | null =
    payload?.prompt?.media?.[0]?.url ?? null;

  const stem: string =
    payload?.prompt?.stem ?? question.questionText ?? '';

  const options: { key: string; text: string }[] =
    payload?.prompt?.options ??
    (question.questionData as any)?.options ??
    [];

  const playOnce: boolean = payload?.prompt?.audio?.playOnce ?? false;

  return (
    <div className="space-y-4">
      {/* Audio player */}
      {audioUrl && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Listen to the audio, then answer the question.</p>
          <AudioPlayer src={audioUrl} playOnce={playOnce} />
        </div>
      )}

      {/* Optional image stimulus */}
      {mediaUrl && (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="Listening stimulus" className="w-full object-contain max-h-48" />
        </div>
      )}

      {/* Question stem */}
      {stem && <p className="text-base font-medium text-gray-900">{stem}</p>}

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
