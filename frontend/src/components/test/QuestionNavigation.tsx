'use client';

import { Question } from '@/types/test';

interface QuestionNavigationProps {
  questions: Question[];
  answeredQuestions: Set<string>;
  flaggedQuestions: Set<string>;
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
}

export default function QuestionNavigation({
  questions,
  answeredQuestions,
  flaggedQuestions,
  currentQuestionIndex,
  onQuestionSelect,
}: QuestionNavigationProps) {
  const getButtonStyle = (question: Question, index: number): string => {
    if (index === currentQuestionIndex) {
      return 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1';
    }
    if (flaggedQuestions.has(question.id)) {
      return 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200';
    }
    if (answeredQuestions.has(question.id)) {
      return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200';
    }
    return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Questions
      </h3>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={question.id}
            onClick={() => onQuestionSelect(index)}
            className={`
              flex h-9 w-9 items-center justify-center rounded-md border
              text-sm font-medium transition-all
              ${getButtonStyle(question, index)}
            `}
            title={`Question ${question.questionNumber}${
              flaggedQuestions.has(question.id) ? ' (flagged)' : ''
            }${answeredQuestions.has(question.id) ? ' (answered)' : ''}`}
          >
            {question.questionNumber}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-gray-200 bg-gray-100" />
          Unanswered
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-600" />
          Current
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-green-300 bg-green-100" />
          Answered
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-orange-300 bg-orange-100" />
          Flagged
        </div>
      </div>
    </div>
  );
}
