'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type PteMcqData } from '@/types/test';

interface PteChoiceEditorProps {
  data: PteMcqData;
  correctAnswer: any;
  onChange: (data: PteMcqData, correctAnswer: any) => void;
  multiSelect?: boolean;
}

export default function PteChoiceEditor({
  data,
  correctAnswer,
  onChange,
  multiSelect = false,
}: PteChoiceEditorProps) {
  const options = data.options || [];

  const handlePromptChange = (prompt: string) => {
    onChange({ ...data, prompt }, correctAnswer);
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const next = [...options];
    next[index] = { ...next[index], text };
    onChange({ ...data, options: next }, correctAnswer);
  };

  const addOption = () => {
    const nextKey = String.fromCharCode(65 + options.length);
    onChange(
      { ...data, options: [...options, { key: nextKey, text: '' }] },
      correctAnswer
    );
  };

  const removeOption = (index: number) => {
    const removed = options[index];
    const nextOptions = options.filter((_, i) => i !== index);

    let nextCorrect = correctAnswer;
    if (multiSelect) {
      const arr = Array.isArray(correctAnswer) ? correctAnswer : [];
      nextCorrect = arr.filter((v: string) => v !== removed.key);
    } else if (correctAnswer === removed.key) {
      nextCorrect = '';
    }

    onChange({ ...data, options: nextOptions }, nextCorrect);
  };

  const toggleCorrect = (key: string) => {
    if (multiSelect) {
      const arr = Array.isArray(correctAnswer) ? [...correctAnswer] : [];
      const idx = arr.indexOf(key);
      if (idx >= 0) {
        arr.splice(idx, 1);
      } else {
        arr.push(key);
      }
      onChange(data, arr);
      return;
    }
    onChange(data, key);
  };

  return (
    <div className="space-y-4">
      <Input
        label="Prompt (optional)"
        value={data.prompt || ''}
        onChange={(e) => handlePromptChange(e.target.value)}
        placeholder="Enter prompt text shown above options"
      />

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Options</label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-shrink-0">
              {multiSelect ? (
                <input
                  type="checkbox"
                  checked={Array.isArray(correctAnswer) && correctAnswer.includes(option.key)}
                  onChange={() => toggleCorrect(option.key)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              ) : (
                <input
                  type="radio"
                  name="pte-correct-answer"
                  checked={correctAnswer === option.key}
                  onChange={() => toggleCorrect(option.key)}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            </div>
            <span className="w-8 text-center text-sm font-medium text-gray-500">{option.key}</span>
            <Input
              value={option.text}
              onChange={(e) => handleOptionTextChange(index, e.target.value)}
              placeholder={`Option ${option.key}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeOption(index)}
              disabled={options.length <= 2}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          + Add Option
        </Button>
      </div>
    </div>
  );
}

