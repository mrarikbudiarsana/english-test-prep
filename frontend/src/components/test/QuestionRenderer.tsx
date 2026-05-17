'use client';

import { cn } from '@/lib/utils';
import AudioPlayer from './AudioPlayer';

import {
  Question,
  MCQData,
} from '@/types/test';
import MultipleChoice from './questions/MultipleChoice';
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
  hideQuestionText?: boolean;
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
  hideQuestionText = false,
}: QuestionRendererProps) {
  const handleChange = (newAnswer: any) => {
    onAnswerChange(question.id, newAnswer);
  };

  const renderQuestion = () => {
    // For written expression questions, the interactive inline buttons REPLACE the standard multiple choice list.
    if (isWrittenExpression) {
      return null;
    }

    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <MultipleChoice
            data={question.questionData as MCQData}
            answer={answer}
            onChange={handleChange}
            readOnly={readOnly}
            correctAnswer={readOnly ? (question.correctAnswer as string | string[] | undefined) : undefined}
            questionId={question.id}
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

  // Determine the text to display next to the number bubble
  const resolvedNumber = displayNumber ?? question.questionNumber;

  // Check if this is a multi-select MCQ and get expected answers count
  const isMultiSelectMCQ = question.questionType === 'multiple_choice' &&
    (question.questionData as MCQData).multiSelect;
  const expectedAnswers = isMultiSelectMCQ
    ? (question.questionData as MCQData).expectedAnswers || 2
    : 1;

  const hasUnderlines = !!question.questionText?.includes('<u>');
  const isWrittenExpression = hasUnderlines && question.questionType === 'multiple_choice';

  const renderRichText = (text: string | null | undefined) => {
    if (!text) return null;

    let uCount = 0;
    const parts = text.split(/(<u>.*?<\/u>)/g);

    if (!isWrittenExpression) {
      return (
        <span className="inline leading-loose">
          {parts.map((part, i) => {
            if (part.startsWith('<u>') && part.endsWith('</u>')) {
              return <u key={i}>{part.slice(3, -4)}</u>;
            }
            return <span key={i}>{part}</span>;
          })}
        </span>
      );
    }

    // It is a written expression question. Render interactive inline buttons.
    const mcqData = question.questionData as MCQData;
    const multiSelect = mcqData?.multiSelect;
    const correctAnswer = readOnly ? question.correctAnswer : undefined;

    const isSelected = (key: string) =>
      multiSelect ? Array.isArray(answer) && answer.includes(key) : answer === key;

    const getStatus = (key: string): 'correct' | 'incorrect' | 'missed' | null => {
      if (!readOnly || correctAnswer === undefined) return null;
      const isCorrect = multiSelect
        ? Array.isArray(correctAnswer) && correctAnswer.includes(key)
        : correctAnswer === key;
      const wasSelected = isSelected(key);
      if (isCorrect && wasSelected) return 'correct';
      if (!isCorrect && wasSelected) return 'incorrect';
      if (isCorrect && !wasSelected) return 'missed';
      return null;
    };

    const handleSelect = (key: string) => {
      if (readOnly) return;
      if (multiSelect) {
        const current = Array.isArray(answer) ? answer : [];
        onAnswerChange(question.id, current.includes(key) ? current.filter(k => k !== key) : [...current, key]);
      } else {
        onAnswerChange(question.id, key);
      }
    };

    return (
      <span className="inline leading-loose">
        {parts.map((part, i) => {
          if (part.startsWith('<u>') && part.endsWith('</u>')) {
            const optionKey = String.fromCharCode(65 + (uCount % 26));
            uCount++;
            const textInside = part.slice(3, -4);
            const selected = isSelected(optionKey);
            const status = getStatus(optionKey);

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(optionKey)}
                disabled={readOnly}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 mx-1 rounded border transition-colors duration-150 align-baseline",
                  readOnly ? "cursor-default" : "cursor-pointer",
                  status === 'correct'
                    ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                    : status === 'incorrect'
                      ? "bg-red-100 border-red-300 text-red-900 line-through decoration-red-400"
                      : status === 'missed'
                        ? "bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-400 ring-offset-1"
                        : selected
                          ? "bg-[#08507f] border-[#08507f] text-white shadow-sm"
                          : readOnly
                            ? "bg-slate-100 border-slate-200 text-slate-800"
                            : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200 hover:border-slate-300"
                )}
              >
                <span className={cn(
                  "text-[0.85em] font-medium leading-none",
                  selected && !status ? "text-blue-100" : "text-slate-500",
                  status === 'correct' && "text-emerald-700",
                  status === 'incorrect' && "text-red-700",
                  status === 'missed' && "text-amber-700"
                )}>
                  ({optionKey})
                </span>
                <span>{textInside}</span>
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const questionHeaderText = hideQuestionText ? null : question.questionText;

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
      'py-4 border-b border-gray-100 last:border-0',
      'flex items-start gap-3',
    )}>
      <div className="flex shrink-0 items-center gap-1 mt-0.5">
        {Array.from({ length: expectedAnswers }).map((_, idx) => {
          const num = typeof resolvedNumber === 'number'
            ? resolvedNumber + idx
            : resolvedNumber;
          return (
            <span
              key={idx}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-md border text-sm font-bold transition-colors duration-200",
                String(num).length > 2 ? "h-8 px-2 min-w-[2.5rem]" : "h-8 w-8",
                isActive
                  ? "bg-[#08507f] border-[#08507f] text-white shadow-sm ring-2 ring-[#e8f4fd] ring-offset-1"
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
          <div className="mb-6">
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
          <div className="mb-3">
            <p className="text-[15px] sm:text-base text-gray-900 leading-relaxed not-italic font-medium">
              {processedHeaderText}
            </p>
            {question.points > 1 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({question.points} points)
              </span>
            )}
          </div>
        )}
        <TextHighlighter>
          {renderQuestion()}
        </TextHighlighter>
        {/* Explanation (review mode) */}
        {readOnly && question.explanation && (
          <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
            <p className="text-xs font-bold text-emerald-700 mb-1 uppercase tracking-wider">Explanation</p>
            <p className="text-sm text-emerald-800 leading-relaxed italic">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
