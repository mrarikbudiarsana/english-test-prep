'use client';

import { useState, type FormEvent } from 'react';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import MCQEditor from './QuestionTypeEditors/MCQEditor';
import TFNGEditor from './QuestionTypeEditors/TFNGEditor';
import CompletionEditor from './QuestionTypeEditors/CompletionEditor';
import MatchingEditor from './QuestionTypeEditors/MatchingEditor';
import DropdownEditor from './QuestionTypeEditors/DropdownEditor';
import type {
  QuestionType,
  QuestionData,
  MCQData,
  TFNGData,
  CompletionData,
  MatchingData,
  DropdownData,
} from '@/types/test';

interface QuestionFormData {
  questionNumber: number;
  questionType: QuestionType;
  questionText: string;
  questionData: QuestionData;
  correctAnswer: any;
  points: number;
  explanation: string | null;
  groupLabel?: string | null;
  groupInstructions?: string | null;
}

interface QuestionEditorProps {
  sectionId: string;
  initialData?: Partial<QuestionFormData> & { id?: string };
  onSubmit: (data: QuestionFormData) => void | Promise<void>;
  onCancel: () => void;
  nextQuestionNumber?: number;
}

const questionTypeOptions = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false_not_given', label: 'True / False / Not Given' },
  { value: 'yes_no_not_given', label: 'Yes / No / Not Given' },
  { value: 'completion', label: 'Completion' },
  { value: 'matching', label: 'Matching' },
  { value: 'dropdown', label: 'Dropdown' },
];

function getDefaultQuestionData(type: QuestionType): QuestionData {
  switch (type) {
    case 'multiple_choice':
      return {
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ],
        multiSelect: false,
      } as MCQData;
    case 'true_false_not_given':
      return {
        statement: '',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
      } as TFNGData;
    case 'yes_no_not_given':
      return {
        statement: '',
        options: ['YES', 'NO', 'NOT GIVEN'],
      } as TFNGData;
    case 'completion':
      return {
        context: '',
        maxWords: 3,
        caseSensitive: false,
        blankPosition: '',
        title: '',
      } as CompletionData;
    case 'matching':
      return {
        instructions: '',
        items: [{ key: '1', text: '' }],
        options: [{ key: 'A', text: '' }],
        allowReuse: false,
      } as MatchingData;
    case 'dropdown':
      return {
        context: '',
        dropdowns: {},
      } as DropdownData;
    default:
      return { options: [], multiSelect: false } as MCQData;
  }
}

function getDefaultCorrectAnswer(type: QuestionType): any {
  switch (type) {
    case 'multiple_choice':
      return '';
    case 'true_false_not_given':
      return 'TRUE';
    case 'yes_no_not_given':
      return 'YES';
    case 'completion':
      return '';
    case 'matching':
      return {};
    case 'dropdown':
      return {};
    default:
      return '';
  }
}

export default function QuestionEditor({
  sectionId,
  initialData,
  onSubmit,
  onCancel,
  nextQuestionNumber = 1,
}: QuestionEditorProps) {
  const [questionNumber, setQuestionNumber] = useState(initialData?.questionNumber || nextQuestionNumber);
  const [questionType, setQuestionType] = useState<QuestionType>(
    initialData?.questionType || 'multiple_choice'
  );
  const [questionText, setQuestionText] = useState(initialData?.questionText || '');
  const [questionData, setQuestionData] = useState<QuestionData>(
    initialData?.questionData || getDefaultQuestionData('multiple_choice')
  );
  const [correctAnswer, setCorrectAnswer] = useState<any>(
    initialData?.correctAnswer ?? getDefaultCorrectAnswer('multiple_choice')
  );
  const [points, setPoints] = useState(initialData?.points || 1);
  const [explanation, setExplanation] = useState(initialData?.explanation || '');
  const [groupLabel, setGroupLabel] = useState(initialData?.groupLabel || '');
  const [groupInstructions, setGroupInstructions] = useState(initialData?.groupInstructions || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    setQuestionData(getDefaultQuestionData(newType));
    setCorrectAnswer(getDefaultCorrectAnswer(newType));
  };

  const handleQuestionDataChange = (data: QuestionData, answer: any) => {
    setQuestionData(data);
    setCorrectAnswer(answer);

    // Auto-update points for multi-select MCQs based on expectedAnswers
    if (questionType === 'multiple_choice') {
      const mcqData = data as MCQData;
      if (mcqData.multiSelect && mcqData.expectedAnswers) {
        // Multi-select enabled: points = number of expected answers
        setPoints(mcqData.expectedAnswers);
      } else if (!mcqData.multiSelect) {
        // Multi-select disabled: reset to 1 point
        setPoints(1);
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }
    if (points < 0) {
      newErrors.points = 'Points must be 0 or greater';
    }
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
        questionData,
        correctAnswer,
        points,
        explanation: explanation.trim() || null,
        groupLabel: groupLabel.trim() || null,
        groupInstructions: groupInstructions.trim() || null,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTypeEditor = () => {
    switch (questionType) {
      case 'multiple_choice':
        return (
          <MCQEditor
            data={questionData as MCQData}
            correctAnswer={correctAnswer}
            onChange={handleQuestionDataChange}
          />
        );
      case 'true_false_not_given':
      case 'yes_no_not_given':
        return (
          <TFNGEditor
            data={questionData as TFNGData}
            correctAnswer={correctAnswer}
            onChange={handleQuestionDataChange}
          />
        );
      case 'completion':
        return (
          <CompletionEditor
            data={questionData as CompletionData}
            correctAnswer={correctAnswer}
            onChange={handleQuestionDataChange}
          />
        );
      case 'matching':
        return (
          <MatchingEditor
            data={questionData as MatchingData}
            correctAnswer={correctAnswer}
            onChange={handleQuestionDataChange}
          />
        );
      case 'dropdown':
        return (
          <DropdownEditor
            data={questionData as DropdownData}
            correctAnswer={correctAnswer}
            onChange={handleQuestionDataChange}
          />
        );
      default:
        return <p className="text-sm text-gray-500">Unknown question type.</p>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Question Number"
          type="number"
          min={1}
          value={questionNumber}
          onChange={(e) => setQuestionNumber(parseInt(e.target.value) || 1)}
        />
        <Select
          label="Question Type"
          value={questionType}
          onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
          options={questionTypeOptions}
        />
        <Input
          label="Points"
          type="number"
          min={0}
          step={0.5}
          value={points}
          onChange={(e) => setPoints(parseFloat(e.target.value) || 0)}
          error={errors.points}
        />
      </div>

      <Textarea
        label="Question Text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        placeholder="Enter the question text..."
        rows={3}
        error={errors.questionText}
        required
      />

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
        <h4 className="text-sm font-semibold text-blue-800">Question Grouping (Optional - for IELTS format)</h4>
        <p className="text-xs text-gray-600">Use this to group related questions with shared instructions (e.g., "Questions 1-7" all share the same completion instructions)</p>
        <Input
          label="Group Label"
          value={groupLabel}
          onChange={(e) => setGroupLabel(e.target.value)}
          placeholder="e.g., Questions 1-7"
        />
        <Textarea
          label="Group Instructions"
          value={groupInstructions}
          onChange={(e) => setGroupInstructions(e.target.value)}
          placeholder="e.g., Complete the notes below. Choose ONE WORD ONLY from the passage for each answer."
          rows={3}
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">
          {questionTypeOptions.find((o) => o.value === questionType)?.label} Settings
        </h4>
        {renderTypeEditor()}
      </div>

      <Textarea
        label="Explanation (optional)"
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        placeholder="Explain why the correct answer is correct (shown after the test)..."
        rows={3}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialData?.id ? 'Update Question' : 'Add Question'}
        </Button>
      </div>
    </form>
  );
}
