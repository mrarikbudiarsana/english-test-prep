'use client';

import { Question } from '@/types/test';
import QuestionRenderer from './QuestionRenderer';
import GroupInstruction from './GroupInstruction';

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
        <GroupInstruction
          groupLabel={firstQuestion.groupLabel!}
          groupInstructions={firstQuestion.groupInstructions}
        />
      )}

      {/* Questions */}
      <div className="space-y-1">
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
