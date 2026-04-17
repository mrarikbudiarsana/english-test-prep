'use client';

import { cn } from '@/lib/utils';
import AudioPlayer from './AudioPlayer';

import {
  Question,
  MCQData,
  TFNGData,
  YNNGData,
  CompletionData,
  MatchingData,
  DropdownData,
  PteMcqData,
  PteReadingFillBlanksDropdownData,
  PteReadingFillBlanksDragDropData,
  PteReorderParagraphData,
  PteListeningFillBlanksData,
  PteHighlightIncorrectWordsData,
} from '@/types/test';
import MultipleChoice from './questions/MultipleChoice';
import TrueFalseNotGiven from './questions/TrueFalseNotGiven';
import YesNoNotGiven from './questions/YesNoNotGiven';
import Completion from './questions/Completion';
import Matching from './questions/Matching';
import DropdownSelect from './questions/DropdownSelect';
import PteFillBlanksDragDrop from './questions/PteFillBlanksDragDrop';
import PteReorderParagraph from './questions/PteReorderParagraph';
import PteListeningFillBlanks from './questions/PteListeningFillBlanks';
import PteHighlightIncorrectWords from './questions/PteHighlightIncorrectWords';
import PteWriteFromDictation from './questions/PteWriteFromDictation';
import TextHighlighter from './TextHighlighter';

function isLikelyVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  
  // Cloudinary puts both audio and video in `/video/upload/`.
  // Explicitly exclude known audio formats so they render in AudioPlayer.
  if (
    lower.endsWith('.mp3') ||
    lower.endsWith('.wav') ||
    lower.endsWith('.m4a') ||
    lower.endsWith('.aac') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.weba') ||
    lower.endsWith('.flac') ||
    lower.endsWith('.wma')
  ) {
    return false;
  }

  return (
    lower.includes('/video/upload/') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v')
  );
}

interface QuestionRendererProps {
  question: Question;
  answer: any;
  onAnswerChange: (questionId: string, answer: any) => void;
  readOnly?: boolean;
  /** Override the displayed question number (for continuous numbering across parts). */
  displayNumber?: number | string;
  isActive?: boolean;
  onAudioEnd?: () => void;
  playOnce?: boolean;
  autoPlay?: boolean;
  disableAudio?: boolean;
  disableScrubbing?: boolean;
  volume?: number;
}

export default function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
  readOnly = false,
  displayNumber,
  isActive = false,
  onAudioEnd,
  playOnce = false,
  autoPlay = false,
  disableAudio = false,
  disableScrubbing = false,
  volume = 1,
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
            isActive={isActive}
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

      case 'pte_mcq_single':
      case 'pte_highlight_correct_summary':
      case 'pte_select_missing_word': {
        const data = question.questionData as PteMcqData;
        return (
          <MultipleChoice
            data={{ options: data.options || [], multiSelect: false }}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as string | undefined) : undefined}
          />
        );
      }

      case 'pte_mcq_multiple': {
        const data = question.questionData as PteMcqData;
        return (
          <MultipleChoice
            data={{ options: data.options || [], multiSelect: true }}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as string[] | undefined) : undefined}
          />
        );
      }

      case 'pte_reading_fill_blanks_dropdown': {
        const data = question.questionData as PteReadingFillBlanksDropdownData;
        const dropdownData: DropdownData = {
          context: data.context || '',
          dropdowns: Object.fromEntries(
            Object.entries(data.blanks || {}).map(([k, v]) => [k, { options: v.options || [] }])
          ),
        };
        return (
          <DropdownSelect
            data={dropdownData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as Record<string, string> | undefined) : undefined}
            displayNumber={typeof resolvedNumber === 'number' ? resolvedNumber : undefined}
          />
        );
      }

      case 'pte_reading_fill_blanks_drag_drop':
        return (
          <PteFillBlanksDragDrop
            data={question.questionData as PteReadingFillBlanksDragDropData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as Record<string, string> | undefined) : undefined}
          />
        );

      case 'pte_reorder_paragraph':
        return (
          <PteReorderParagraph
            data={question.questionData as PteReorderParagraphData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as string[] | undefined) : undefined}
          />
        );

      case 'pte_listening_fill_blanks':
        return (
          <PteListeningFillBlanks
            data={question.questionData as PteListeningFillBlanksData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as Record<string, string> | undefined) : undefined}
          />
        );

      case 'pte_highlight_incorrect_words':
        return (
          <PteHighlightIncorrectWords
            data={question.questionData as PteHighlightIncorrectWordsData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as string[] | undefined) : undefined}
          />
        );

      case 'pte_write_from_dictation':
        return (
          <PteWriteFromDictation
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as string | undefined) : undefined}
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
  const mediaUrl = question.audioUrl || '';
  const isVideoMedia = mediaUrl ? isLikelyVideoUrl(mediaUrl) : false;

  return (
    <div className={cn(
      isNoteStyle ? 'py-0.5' : 'py-3 border-b border-gray-100 last:border-0',
      !isNoteStyle && "flex items-start gap-3",
      isActive && !isNoteStyle && "bg-blue-50/50 -mx-4 px-4 rounded-lg ring-1 ring-blue-100"
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
            {mediaUrl && (
              <div className="mb-3">
                {isVideoMedia ? (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay={autoPlay}
                    className="w-full rounded-lg border border-gray-200"
                    preload="metadata"
                    ref={(el) => {
                      if (el) el.volume = volume;
                    }}
                  />
                ) : (
                  <AudioPlayer
                    src={mediaUrl}
                    playOnce={playOnce}
                    autoPlay={autoPlay}
                    onEnd={onAudioEnd}
                    disabled={disableAudio}
                    disableScrubbing={disableScrubbing}
                    volume={volume}
                  />
                )}
              </div>
            )}
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
