'use client';

import {
  Question,
  MCQData,
  TFNGData,
  YNNGData,
  CompletionData,
  MatchingData,
  DropdownData,
} from '@/types/test';
import MultipleChoice from './questions/MultipleChoice';
import TrueFalseNotGiven from './questions/TrueFalseNotGiven';
import YesNoNotGiven from './questions/YesNoNotGiven';
import Completion from './questions/Completion';
import Matching from './questions/Matching';
import DropdownSelect from './questions/DropdownSelect';
import TextHighlighter from './TextHighlighter';

interface QuestionRendererProps {
  question: Question;
  answer: any;
  onAnswerChange: (questionId: string, answer: any) => void;
  readOnly?: boolean;
}

export default function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
  readOnly = false,
}: QuestionRendererProps) {
  const handleChange = (newAnswer: any) => {
    onAnswerChange(question.id, newAnswer);
  };

  const renderQuestion = () => {
    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <MultipleChoice
            data={question.questionData as MCQData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? question.correctAnswer : undefined}
          />
        );

      case 'true_false_not_given':
        return (
          <TrueFalseNotGiven
            data={question.questionData as TFNGData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? question.correctAnswer : undefined}
          />
        );

      case 'yes_no_not_given':
        return (
          <YesNoNotGiven
            data={question.questionData as YNNGData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? question.correctAnswer : undefined}
          />
        );

      case 'completion':
        return (
          <Completion
            data={question.questionData as CompletionData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? question.correctAnswer : undefined}
            questionNumber={question.questionNumber}
          />
        );

      case 'matching':
        return (
          <Matching
            data={question.questionData as MatchingData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? question.correctAnswer : undefined}
          />
        );

      case 'dropdown':
        return (
          <DropdownSelect
            data={question.questionData as DropdownData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? question.correctAnswer : undefined}
          />
        );

      default:
        return (
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            Unsupported question type: {question.questionType}
          </div>
        );
    }
  };

  // Determine if this is a "note/summary" style completion question (hidden header, minimal spacing)
  const isNoteStyle = question.questionType === 'completion' && (question.questionData as any).style !== 'standard';

  return (
    <div className={isNoteStyle ? 'py-0.5' : 'py-6 border-b border-gray-100 last:border-0'}>
      {/* Question Header - Hidden for note/summary completion types */}
      {!isNoteStyle && (
        <div className="mb-4">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {question.questionNumber}
            </span>
            <div className="pt-0.5">
              <p className="text-base font-medium text-gray-900 leading-relaxed">
                {question.questionText}
              </p>
              {question.points > 1 && (
                <span className="text-xs text-gray-400 font-normal ml-2">
                  ({question.points} points)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question Body */}
      <div className={isNoteStyle ? '' : 'pl-10'}>
        <TextHighlighter>
          {renderQuestion()}
        </TextHighlighter>
      </div>

      {/* Explanation (review mode) */}
      {readOnly && question.explanation && (
        <div className="ml-10 mt-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-xs font-medium text-blue-700 mb-1">Explanation</p>
          <p className="text-sm text-blue-800">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
