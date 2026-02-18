'use client';

import type { Section, Question } from '@/types/test';

interface ToeflIbtWritingRendererProps {
  section: Section;
  question: Question;
  answerText: string;
  onChange: (text: string) => void;
}

export default function ToeflIbtWritingRenderer({
  section,
  question,
  answerText,
  onChange,
}: ToeflIbtWritingRendererProps) {
  const taskType = section.taskType || 'writing_task';
  const minWords = section.minWords ?? 100;
  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          {taskType.replace(/_/g, ' ')}
        </p>
        {(question.questionText || section.title) && (
          <h2 className="text-lg font-semibold text-gray-900">
            {question.questionText || section.title}
          </h2>
        )}
        {section.taskDescription && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{section.taskDescription}</p>
        )}
        {section.instructions && (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.instructions}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Minimum words: {minWords}</span>
          <span className={wordCount < minWords ? 'text-amber-700 font-medium' : 'text-emerald-700 font-medium'}>
            {wordCount} words
          </span>
        </div>
        <textarea
          value={answerText}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your response here..."
          className="w-full min-h-[280px] rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
    </div>
  );
}
