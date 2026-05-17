'use client';

import { useState, useMemo, useRef, type FormEvent } from 'react';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import AudioUploader from './AudioUploader';
import MCQEditor from './QuestionTypeEditors/MCQEditor';
import type { TestType, SectionType, QuestionType, QuestionData, MCQData } from '@/types/test';
import api from '@/lib/api';

interface QuestionFormData {
  questionNumber: number;
  questionType: QuestionType;
  questionText: string;
  audioUrl?: string | null;
  questionData: QuestionData;
  correctAnswer: any;
  points: number;
  explanation: string | null;
  explanationAi?: string | null;
  groupLabel?: string | null;
  groupInstructions?: string | null;
}

interface QuestionEditorProps {
  testType?: TestType;
  sectionType?: SectionType;
  partNumber?: number;
  initialData?: Partial<QuestionFormData> & { id?: string };
  onSubmit: (data: QuestionFormData) => void | Promise<void>;
  onCancel: () => void;
  nextQuestionNumber?: number;
}

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
];

function getDefaultQuestionData(): MCQData {
  return {
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' },
    ],
    multiSelect: false,
  };
}

export default function QuestionEditor({
  testType,
  sectionType,
  partNumber,
  initialData,
  onSubmit,
  onCancel,
  nextQuestionNumber = 1,
}: QuestionEditorProps) {
  const [questionNumber, setQuestionNumber] = useState(initialData?.questionNumber || nextQuestionNumber);
  const [questionType] = useState<QuestionType>('multiple_choice');
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [audioUrl, setAudioUrl] = useState<string | null>(initialData?.audioUrl || null);
  const [questionData, setQuestionData] = useState<QuestionData>(initialData?.questionData || getDefaultQuestionData());
  const [correctAnswer, setCorrectAnswer] = useState<any>(initialData?.correctAnswer || '');
  const [points, setPoints] = useState(initialData?.points || 1);
  const [explanation, setExplanation] = useState(initialData?.explanation || '');
  const [explanationAi, setExplanationAi] = useState(initialData?.explanationAi || '');
  const [loading, setLoading] = useState(false);
  const [formattingAi, setFormattingAi] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showAudioUploader = testType === 'toefl_itp' && sectionType === 'listening' && partNumber === 1;
  const guidance = useMemo(() => {
    if (sectionType === 'listening') {
      if (partNumber === 1) {
        return 'Listening Part A uses one short audio clip per question.';
      }
      if (partNumber === 2) {
        return 'Listening Part B uses shared section audio. Each item is standard four-option multiple choice.';
      }
      return 'Listening Part C uses shared section audio. Each item is standard four-option multiple choice.';
    }
    if (sectionType === 'structure') {
      return 'Use four-option multiple choice. For Written Expression, mark the underlined phrases inside the question text.';
    }
    if (sectionType === 'reading') {
      return 'Reading items use four-option multiple choice linked to the passage in this section.';
    }
    return null;
  }, [partNumber, sectionType]);

  const handleQuestionDataChange = (data: QuestionData, answer: any) => {
    setQuestionData(data);
    setCorrectAnswer(answer);
  };

  const handleQuestionTextChange = (text: string) => {
    setQuestionText(text);

    if (text.includes('<u>')) {
      const parts = text.split(/(<u>.*?<\/u>)/g);
      const extractedOptions: string[] = [];
      parts.forEach((part) => {
        if (part.startsWith('<u>') && part.endsWith('</u>')) {
          extractedOptions.push(part.slice(3, -4));
        }
      });

      if (extractedOptions.length > 0) {
        setQuestionData((prev) => {
          const newOptions = extractedOptions.map((ext, idx) => ({
            key: String.fromCharCode(65 + idx),
            text: ext,
          }));
          return { ...prev, options: newOptions };
        });
      }
    }
  };

  const handleWrapUnderline = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;

    const selectedText = questionText.substring(start, end);
    // If already underlined, un-underline it
    if (
      questionText.substring(start - 3, start) === '<u>' &&
      questionText.substring(end, end + 4) === '</u>'
    ) {
      const newText = questionText.substring(0, start - 3) + selectedText + questionText.substring(end + 4);
      handleQuestionTextChange(newText);
      setTimeout(() => {
        textarea.setSelectionRange(start - 3, end - 3);
        textarea.focus();
      }, 0);
    } else {
      const newText = questionText.substring(0, start) + '<u>' + selectedText + '</u>' + questionText.substring(end);
      handleQuestionTextChange(newText);
      setTimeout(() => {
        textarea.setSelectionRange(start + 3, end + 3);
        textarea.focus();
      }, 0);
    }
  };

  const handleSyncOptionsToText = () => {
    // 1. Remove all existing <u> tags so we start fresh
    let newText = questionText.replace(/<\/?u>/g, '');
    
    // 2. Safely escape regex strings
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 3. Find each option and wrap its FIRST occurrence in <u> tags
    questionData.options.forEach((opt) => {
      const textToUnderline = opt.text.trim();
      if (textToUnderline) {
        // \b ensures we match whole words (e.g. 'are' won't match inside 'rare')
        const regex = new RegExp(`\\b${escapeRegExp(textToUnderline)}\\b`, 'i');
        newText = newText.replace(regex, `<u>${textToUnderline}</u>`);
      }
    });
    
    handleQuestionTextChange(newText);
  };

  const handleFormatWithAI = async () => {
    if (!questionText.trim()) return;
    setFormattingAi(true);
    try {
      const response = await api.post('/admin/ai/format-written-expression', { text: questionText });
      const formatted = response.data?.data || response.data;
      if (typeof formatted === 'string') {
        handleQuestionTextChange(formatted);
      } else if (response.data) {
        handleQuestionTextChange(response.data);
      }
    } catch (err) {
      console.error('Failed to format with AI', err);
    } finally {
      setFormattingAi(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!questionText.trim()) newErrors.questionText = 'Question text is required';
    if (points < 0) newErrors.points = 'Points must be 0 or greater';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({
        questionNumber,
        questionType,
        questionText: questionText.trim(),
        audioUrl,
        questionData,
        correctAnswer,
        points,
        explanation: explanation.trim() || null,
        explanationAi: explanationAi.trim() || null,
        groupLabel: null,
        groupInstructions: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {guidance && (
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h4 className="text-sm font-semibold text-indigo-900 mb-1">TOEFL ITP Authoring Notes</h4>
          <p className="text-xs text-indigo-700">{guidance}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Question Number"
          type="number"
          min={1}
          value={questionNumber}
          onChange={(e) => setQuestionNumber(parseInt(e.target.value) || 1)}
        />
        <Select label="Question Type" value={questionType} onChange={() => undefined} options={QUESTION_TYPE_OPTIONS} />
        <Input
          label="Points"
          type="number"
          min={0}
          step={1}
          value={points}
          onChange={(e) => setPoints(parseFloat(e.target.value) || 0)}
          error={errors.points}
        />
      </div>

      {showAudioUploader && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Question Audio</h4>
          <p className="text-xs text-gray-500">Upload the short conversation audio for this Part A question.</p>
          <AudioUploader onUpload={(url) => setAudioUrl(url)} currentUrl={audioUrl} />
        </div>
      )}

      <div className="space-y-1.5">
        <Textarea
          ref={textareaRef}
          label="Question Text"
          value={questionText}
          onChange={(e) => handleQuestionTextChange(e.target.value)}
          placeholder="Enter the question text..."
          rows={3}
          error={errors.questionText}
          required
        />
        {sectionType === 'structure' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
            <p className="text-xs text-gray-500">Tip: use &lt;u&gt;text&lt;/u&gt; to underline the A-D portions for Written Expression items.</p>
            <div className="flex gap-2">
               <Button type="button" size="sm" variant="outline" onClick={handleWrapUnderline} className="h-7 text-xs px-2">
                 <u>Underline</u> Selected
               </Button>
               <Button type="button" size="sm" variant="outline" onClick={handleFormatWithAI} loading={formattingAi} className="h-7 text-xs px-2">
                 ✨ Auto-Format AI
               </Button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Multiple Choice Settings</h4>
        <MCQEditor
          data={questionData as MCQData}
          correctAnswer={correctAnswer}
          onChange={handleQuestionDataChange}
          readOnlyOptions={sectionType === 'structure' ? false : questionText.includes('<u>')}
          onSyncToText={sectionType === 'structure' ? handleSyncOptionsToText : undefined}
        />
      </div>

      <Textarea
        label="Explanation (optional)"
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="Explain why the correct answer is correct..."
        rows={3}
      />

      <Textarea
        label="AI Explanation (optional)"
        value={explanationAi}
        onChange={(e) => setExplanationAi(e.target.value)}
        placeholder="AI-generated explanation..."
        rows={4}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" loading={loading}>{initialData?.id ? 'Update Question' : 'Add Question'}</Button>
      </div>
    </form>
  );
}
