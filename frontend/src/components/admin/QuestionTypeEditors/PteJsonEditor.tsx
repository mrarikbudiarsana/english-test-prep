'use client';

import { useEffect, useMemo, useState } from 'react';
import { Textarea } from '@/components/ui/Textarea';

interface PteJsonEditorProps {
  questionData: any;
  correctAnswer: any;
  onChange: (questionData: any, correctAnswer: any) => void;
  questionType: string;
}

function pretty(value: any): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

function parseAnswer(raw: string): { value: any; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: '', error: null };
  try {
    return { value: JSON.parse(trimmed), error: null };
  } catch {
    return { value: trimmed, error: null };
  }
}

function hintFor(questionType: string): string {
  switch (questionType) {
    case 'pte_reading_fill_blanks_dropdown':
      return 'Use context with placeholders and per-blank options.';
    case 'pte_reading_fill_blanks_drag_drop':
      return 'Use textSegments, blankIds, and options arrays.';
    case 'pte_reorder_paragraph':
      return 'Use blocks [{ id, text }]. Correct answer should be an ordered id array.';
    case 'pte_listening_fill_blanks':
      return 'Use transcript and blankIds. Correct answer should map blank id to word.';
    case 'pte_highlight_incorrect_words':
      return 'Use transcript and tokens [{ id, text, index }]. Correct answer is an id array.';
    case 'pte_write_from_dictation':
      return 'Question data can be { "prompt": "..." }. Correct answer is the sentence text.';
    default:
      return 'Provide valid JSON for questionData. Correct answer accepts JSON or plain text.';
  }
}

export default function PteJsonEditor({
  questionData,
  correctAnswer,
  onChange,
  questionType,
}: PteJsonEditorProps) {
  const [questionDataText, setQuestionDataText] = useState(pretty(questionData));
  const [correctAnswerText, setCorrectAnswerText] = useState(
    typeof correctAnswer === 'string' ? correctAnswer : pretty(correctAnswer)
  );
  const [questionDataError, setQuestionDataError] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);

  useEffect(() => {
    setQuestionDataText(pretty(questionData));
  }, [questionData]);

  useEffect(() => {
    setCorrectAnswerText(
      typeof correctAnswer === 'string' ? correctAnswer : pretty(correctAnswer)
    );
  }, [correctAnswer]);

  const hint = useMemo(() => hintFor(questionType), [questionType]);

  const handleQuestionDataChange = (value: string) => {
    setQuestionDataText(value);
    try {
      const parsed = value.trim() ? JSON.parse(value) : {};
      setQuestionDataError(null);
      const parsedAnswer = parseAnswer(correctAnswerText);
      onChange(parsed, parsedAnswer.value);
    } catch {
      setQuestionDataError('Invalid JSON');
    }
  };

  const handleCorrectAnswerChange = (value: string) => {
    setCorrectAnswerText(value);
    const parsedAnswer = parseAnswer(value);
    if (parsedAnswer.error) {
      setAnswerError(parsedAnswer.error);
      return;
    }
    setAnswerError(null);
    try {
      const parsedData = questionDataText.trim() ? JSON.parse(questionDataText) : {};
      setQuestionDataError(null);
      onChange(parsedData, parsedAnswer.value);
    } catch {
      setQuestionDataError('Invalid JSON');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-xs text-cyan-800">
        {hint}
      </div>

      <Textarea
        label="Question Data (JSON)"
        value={questionDataText}
        onChange={(e) => handleQuestionDataChange(e.target.value)}
        rows={10}
        error={questionDataError || undefined}
      />

      <Textarea
        label="Correct Answer (JSON or plain text)"
        value={correctAnswerText}
        onChange={(e) => handleCorrectAnswerChange(e.target.value)}
        rows={4}
        error={answerError || undefined}
      />
    </div>
  );
}

