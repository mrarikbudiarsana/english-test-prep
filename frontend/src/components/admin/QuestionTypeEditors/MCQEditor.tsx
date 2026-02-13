'use client';

import { type MCQData } from '@/types/test';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface MCQEditorProps {
  data: MCQData;
  correctAnswer: any;
  onChange: (data: MCQData, correctAnswer: any) => void;
}

export default function MCQEditor({ data, correctAnswer, onChange }: MCQEditorProps) {
  const options = data.options || [];
  const multiSelect = data.multiSelect || false;
  const expectedAnswers = data.expectedAnswers || 2;
  const displayKey = (index: number, key?: string) => (key && key.trim() ? key : String.fromCharCode(65 + index));

  const handleOptionTextChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text };
    onChange({ ...data, options: newOptions }, correctAnswer);
  };

  const addOption = () => {
    const nextKey = String.fromCharCode(65 + options.length); // A, B, C, ...
    const newOptions = [...options, { key: nextKey, text: '' }];
    onChange({ ...data, options: newOptions }, correctAnswer);
  };

  const removeOption = (index: number) => {
    const removedKey = displayKey(index, options[index].key);
    const newOptions = options.filter((_, i) => i !== index);
    let newCorrect = correctAnswer;
    if (multiSelect) {
      newCorrect = Array.isArray(correctAnswer)
        ? correctAnswer.filter((k: string) => k !== removedKey)
        : [];
    } else if (correctAnswer === removedKey) {
      newCorrect = '';
    }
    onChange({ ...data, options: newOptions }, newCorrect);
  };

  const handleCorrectAnswerChange = (key: string) => {
    if (multiSelect) {
      const arr = Array.isArray(correctAnswer) ? [...correctAnswer] : [];
      const idx = arr.indexOf(key);
      if (idx >= 0) {
        arr.splice(idx, 1);
      } else {
        arr.push(key);
      }
      onChange(data, arr);
    } else {
      onChange(data, key);
    }
  };

  const toggleMultiSelect = () => {
    const newMultiSelect = !multiSelect;
    const newCorrect = newMultiSelect
      ? correctAnswer ? [correctAnswer] : []
      : Array.isArray(correctAnswer) && correctAnswer.length > 0
        ? correctAnswer[0]
        : '';
    onChange({
      ...data,
      multiSelect: newMultiSelect,
      expectedAnswers: newMultiSelect ? 2 : undefined
    }, newCorrect);
  };

  const handleExpectedAnswersChange = (value: number) => {
    onChange({ ...data, expectedAnswers: value }, correctAnswer);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={multiSelect}
            onChange={toggleMultiSelect}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Allow multiple correct answers
        </label>
        {multiSelect && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Number of answers required:
            </label>
            <Input
              type="number"
              min={2}
              max={options.length}
              value={expectedAnswers}
              onChange={(e) => handleExpectedAnswersChange(parseInt(e.target.value) || 2)}
              className="w-16 text-center"
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Options</label>
          <span className="text-xs text-gray-500">Supports &lt;u&gt;text&lt;/u&gt; for underlining</span>
        </div>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-shrink-0">
              {(() => {
                const key = displayKey(index, option.key);
                if (multiSelect) {
                  return (
                    <input
                      type="checkbox"
                      checked={Array.isArray(correctAnswer) && correctAnswer.includes(key)}
                      onChange={() => handleCorrectAnswerChange(key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      title="Mark as correct"
                    />
                  );
                }
                return (
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={correctAnswer === key}
                    onChange={() => handleCorrectAnswerChange(key)}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    title="Mark as correct"
                  />
                );
              })()}
            </div>
            <span className="w-8 text-center text-sm font-medium text-gray-500">
              {displayKey(index, option.key)}
            </span>
            <div className="flex-1">
              {multiSelect ? (
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionTextChange(index, e.target.value)}
                  placeholder={`Option ${displayKey(index, option.key)} text`}
                />
              ) : (
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionTextChange(index, e.target.value)}
                  placeholder={`Option ${displayKey(index, option.key)} text`}
                />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeOption(index)}
              type="button"
              disabled={options.length <= 2}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addOption} type="button">
          + Add Option
        </Button>
      </div>

      <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        Correct answer: {(() => {
          if (multiSelect) {
            if (!Array.isArray(correctAnswer) || correctAnswer.length === 0) return 'None selected';
            const texts = correctAnswer.map((key: string) => {
              const opt = options.find((o, i) => displayKey(i, o.key) === key);
              return opt?.text || key;
            });
            return texts.join(', ');
          } else {
            if (!correctAnswer) return 'None selected';
            const opt = options.find((o, i) => displayKey(i, o.key) === correctAnswer);
            return opt?.text || correctAnswer;
          }
        })()}
      </div>
    </div>
  );
}
