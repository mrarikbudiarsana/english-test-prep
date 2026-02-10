'use client';

import { Question } from '@/types/test';
import QuestionRenderer from './QuestionRenderer';

interface QuestionGroupProps {
  questions: Question[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  readOnly?: boolean;
  showGroupLabel?: boolean;
}

/**
 * Renders a group of related questions with shared instructions (IELTS format).
 * If questions have a groupLabel and groupInstructions, they're displayed together
 * with the instructions shown once at the top.
 */
export default function QuestionGroup({
  questions,
  answers,
  onAnswerChange,
  readOnly = false,
  showGroupLabel = true,
}: QuestionGroupProps) {
  if (questions.length === 0) return null;

  const firstQuestion = questions[0];
  const hasGrouping = firstQuestion.groupLabel && firstQuestion.groupInstructions;

  return (
    <div className="space-y-4">
      {/* Group Header (for IELTS format) */}
      {hasGrouping && showGroupLabel && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-900">
              {firstQuestion.groupLabel}
            </h3>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="whitespace-pre-wrap">{firstQuestion.groupInstructions}</p>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            answer={answers[question.id]}
            onAnswerChange={onAnswerChange}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Helper function to group questions by their groupLabel.
 * Questions without a groupLabel are each in their own group.
 */
export function groupQuestions(questions: Question[]): Question[][] {
  const groups: Question[][] = [];
  const groupMap = new Map<string, Question[]>();

  for (const question of questions) {
    if (question.groupLabel) {
      // Add to existing group or create new one
      if (!groupMap.has(question.groupLabel)) {
        const newGroup: Question[] = [];
        groupMap.set(question.groupLabel, newGroup);
        groups.push(newGroup);
      }
      groupMap.get(question.groupLabel)!.push(question);
    } else {
      // Ungrouped question gets its own group
      groups.push([question]);
    }
  }

  return groups;
}
