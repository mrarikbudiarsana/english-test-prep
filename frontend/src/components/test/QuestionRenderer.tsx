'use client';

import { cn } from '@/lib/utils';

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
  /** Override the displayed question number (for continuous numbering across parts). */
  displayNumber?: number | string;
  isActive?: boolean;
}

export default function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
  readOnly = false,
  displayNumber,
  isActive = false,
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
            correctAnswer={readOnly ? (question.correctAnswer as string | string[] | undefined) : undefined}
          />
        );

      case 'true_false_not_given':
        return (
          <TrueFalseNotGiven
            data={question.questionData as TFNGData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as string | undefined) : undefined}
          />
        );

      case 'yes_no_not_given':
        return (
          <YesNoNotGiven
            data={question.questionData as YNNGData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as string | undefined) : undefined}
          />
        );

      case 'completion':
        return (
          <Completion
            data={question.questionData as CompletionData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as string | undefined) : undefined}
            questionNumber={resolvedNumber}
          />
        );

      case 'matching':
        return (
          <Matching
            data={question.questionData as MatchingData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as Record<string, string> | undefined) : undefined}
          />
        );

      case 'dropdown':
        return (
          <DropdownSelect
            data={question.questionData as DropdownData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as Record<string, string> | undefined) : undefined}
            displayNumber={typeof resolvedNumber === 'number' ? resolvedNumber : undefined}
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

  // Determine the text to display next to the number bubble
  const resolvedNumber = displayNumber ?? question.questionNumber;

  // Check if this is a multi-select MCQ and get expected answers count
  const isMultiSelectMCQ = question.questionType === 'multiple_choice' &&
    (question.questionData as MCQData).multiSelect;
  const expectedAnswers = isMultiSelectMCQ
    ? (question.questionData as MCQData).expectedAnswers || 2
    : 1;
  // Helper to render text with basic HTML support (specifically for <u> tags in TOEFL)
  const renderRichText = (text: string | null | undefined) => {
    if (!text) return null;

    // Split by <u> tags
    const parts = text.split(/(<u>.*?<\/u>)/g);

    return (
      <span>
        {parts.map((part, i) => {
          if (part.startsWith('<u>') && part.endsWith('</u>')) {
            return <u key={i}>{part.slice(3, -4)}</u>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const questionHeaderText = (() => {
    if (question.questionType === 'true_false_not_given') {
      return (question.questionData as TFNGData).statement || question.questionText;
    }
    if (question.questionType === 'yes_no_not_given') {
      return (question.questionData as YNNGData).statement || question.questionText;
    }
    return question.questionText;
  })();

  // Strip "Question X" prefix if it exists, then render rich text
  const processedHeaderText = (() => {
    if (!questionHeaderText) return null;
    const pattern = new RegExp(`^question\\s*${resolvedNumber}[:\\s]*`, 'i');
    const patternGeneric = /^question\s*\d+[:\s]*/i;

    let stripped = questionHeaderText.replace(pattern, '').trim();
    if (stripped === questionHeaderText) {
      stripped = questionHeaderText.replace(patternGeneric, '').trim();
    }
    return renderRichText(stripped);
  })();

  const isRedundantHeader = !processedHeaderText;

  return (
    <div className={cn(
      isNoteStyle ? 'py-0.5' : 'py-3 border-b border-gray-100 last:border-0',
      !isNoteStyle && "flex items-start gap-3"
    )}>
      {isNoteStyle ? (
        <TextHighlighter>
          {renderQuestion()}
        </TextHighlighter>
      ) : (
        <>
          <div className="flex shrink-0 items-center gap-1 mt-0.5">
            {Array.from({ length: expectedAnswers }).map((_, idx) => {
              const num = typeof resolvedNumber === 'number'
                ? resolvedNumber + idx
                : resolvedNumber;
              return (
                <span
                  key={idx}
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-[4px] border text-sm font-bold transition-colors duration-200",
                    String(num).length > 2 ? "h-7 px-2 min-w-[2.5rem]" : "h-7 w-7",
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-100 ring-offset-1"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  )}
                >
                  {num}
                </span>
              );
            })}
          </div>
          <div className="flex-1">
            {!isRedundantHeader && (
              <div className="mb-2">
                <p className="text-base text-black leading-relaxed not-italic font-normal">
                  {processedHeaderText}
                </p>
                {question.points > 1 && (
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    ({question.points} points)
                  </span>
                )}
              </div>
            )}
            <TextHighlighter>
              {renderQuestion()}
            </TextHighlighter>
          </div>
        </>
      )}

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

