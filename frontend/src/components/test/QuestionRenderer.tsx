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

  // Render sentence text with <u>…</u> underlines for TOEFL written-expression questions.
  // Each underlined phrase stays on the sentence baseline; the A/B/C/D label sits
  // below the underline via a small absolute-positioned element so line-height is unaffected.
  const renderRichText = (text: string | null | undefined) => {
    if (!text) return null;

    let uCount = 0;
    const parts = text.split(/(<u>.*?<\/u>)/g);

    return (
      // Extra bottom padding gives room for the letter labels that sit below the line
      <span className="inline leading-loose">
        {parts.map((part, i) => {
          if (part.startsWith('<u>') && part.endsWith('</u>')) {
            const letter = String.fromCharCode(65 + (uCount % 26));
            uCount++;
            const textInside = part.slice(3, -4);

            return (
              // relative container — no flex, stays inline so sentence flows normally
              <span
                key={i}
                className="relative inline mx-[3px] pb-[18px] group/u"
              >
                {/* The underlined word */}
                <span className="border-b-2 border-slate-800 group-hover/u:border-[#08507f] transition-colors">
                  {textInside}
                </span>
                {/* Letter label anchored below the underline */}
                <span className="absolute left-1/2 -translate-x-1/2 bottom-0 text-[10px] font-semibold text-slate-500 leading-none select-none tracking-wide">
                  ({letter})
                </span>
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const questionHeaderText = question.questionText;

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
          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-xs font-medium text-blue-700 mb-1">Explanation</p>
            <p className="text-sm text-blue-800">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
