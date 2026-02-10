'use client';

import { type CompletionData } from '@/types/test';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

interface CompletionEditorProps {
  data: CompletionData;
  correctAnswer: any;
  onChange: (data: CompletionData, correctAnswer: any) => void;
}

export default function CompletionEditor({ data, correctAnswer, onChange }: CompletionEditorProps) {
  const context = data.context || '';
  const maxWords = data.maxWords || 3;
  const caseSensitive = data.caseSensitive || false;
  const blankPosition = data.blankPosition || '';
  const title = data.title || '';
  // correctAnswer can be a string or an array of acceptable answers
  const acceptableAnswers: string[] = Array.isArray(correctAnswer)
    ? correctAnswer
    : correctAnswer
      ? [correctAnswer]
      : [''];

  const handleContextChange = (value: string) => {
    onChange({ ...data, context: value }, correctAnswer);
  };

  const handleMaxWordsChange = (value: number) => {
    onChange({ ...data, maxWords: value }, correctAnswer);
  };

  const handleCaseSensitiveToggle = () => {
    onChange({ ...data, caseSensitive: !caseSensitive }, correctAnswer);
  };

  const handleBlankPositionChange = (value: string) => {
    onChange({ ...data, blankPosition: value }, correctAnswer);
  };

  const handleTitleChange = (value: string) => {
    onChange({ ...data, title: value }, correctAnswer);
  };

  const handleStyleChange = (value: string) => {
    onChange({ ...data, style: value as 'standard' | 'note' }, correctAnswer);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...acceptableAnswers];
    newAnswers[index] = value;
    onChange(data, newAnswers.length === 1 ? newAnswers[0] : newAnswers);
  };

  const addAnswer = () => {
    const newAnswers = [...acceptableAnswers, ''];
    onChange(data, newAnswers);
  };

  const removeAnswer = (index: number) => {
    const newAnswers = acceptableAnswers.filter((_, i) => i !== index);
    onChange(data, newAnswers.length === 1 ? newAnswers[0] : newAnswers.length === 0 ? '' : newAnswers);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-800 mb-2">📋 IELTS Note/Summary Completion Format</p>
        <p className="text-xs text-blue-700">
          For IELTS-style questions, add a title/heading above the completion items (e.g., "The Life and Work of Georgia O'Keefe")
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Completion Style"
          value={data.style || 'note'}
          onChange={(e) => handleStyleChange(e.target.value)}
          options={[
            { value: 'note', label: 'Note / Summary (Document Flow)' },
            { value: 'standard', label: 'Standard (Card & Header)' },
          ]}
        />
        <Input
          label="Title/Heading (optional, for IELTS format)"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., The Life and Work of Georgia O'Keefe"
        />
      </div>

      <Textarea
        label="Context (use _____ or {blank} to indicate the blank)"
        value={context}
        onChange={(e) => handleContextChange(e.target.value)}
        placeholder="– studied art, then worked as a _____ in various places in the USA"
        rows={4}
      />

      <Input
        label="Blank Position Description (optional)"
        value={blankPosition}
        onChange={(e) => handleBlankPositionChange(e.target.value)}
        placeholder="e.g., after 'is', position 3"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Maximum Words"
          type="number"
          min={1}
          max={10}
          value={maxWords}
          onChange={(e) => handleMaxWordsChange(parseInt(e.target.value) || 1)}
        />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={handleCaseSensitiveToggle}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Case sensitive
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Acceptable Answers
        </label>
        {acceptableAnswers.map((answer, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                value={answer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder={index === 0 ? 'Primary correct answer' : 'Alternative acceptable answer'}
              />
            </div>
            {acceptableAnswers.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAnswer(index)}
                type="button"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addAnswer} type="button">
          + Add Alternative Answer
        </Button>
      </div>
    </div>
  );
}
