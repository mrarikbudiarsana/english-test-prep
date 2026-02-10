'use client';

import { useMemo } from 'react';
import { type DropdownData } from '@/types/test';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface DropdownEditorProps {
  data: DropdownData;
  correctAnswer: any;
  onChange: (data: DropdownData, correctAnswer: any) => void;
}

export default function DropdownEditor({ data, correctAnswer, onChange }: DropdownEditorProps) {
  const context = data.context || '';
  const dropdowns = data.dropdowns || {};
  // correctAnswer is a Record<string, string> mapping placeholder key to correct option
  const answers: Record<string, string> = correctAnswer && typeof correctAnswer === 'object'
    ? correctAnswer
    : {};

  // Extract placeholder keys from context text (e.g., {1}, {2}, {3})
  const placeholderKeys = useMemo(() => {
    const regex = /\{(\d+)\}/g;
    const keys: string[] = [];
    let match;
    while ((match = regex.exec(context)) !== null) {
      if (!keys.includes(match[1])) {
        keys.push(match[1]);
      }
    }
    return keys.sort((a, b) => parseInt(a) - parseInt(b));
  }, [context]);

  const handleContextChange = (value: string) => {
    // Keep existing dropdown data, add new placeholders
    const newDropdowns = { ...dropdowns };
    const regex = /\{(\d+)\}/g;
    const foundKeys: string[] = [];
    let match;
    while ((match = regex.exec(value)) !== null) {
      if (!foundKeys.includes(match[1])) {
        foundKeys.push(match[1]);
      }
    }
    // Add new dropdowns for new keys
    for (const key of foundKeys) {
      if (!newDropdowns[key]) {
        newDropdowns[key] = { options: [''] };
      }
    }
    // Remove dropdowns for removed keys
    for (const key of Object.keys(newDropdowns)) {
      if (!foundKeys.includes(key)) {
        delete newDropdowns[key];
      }
    }
    // Clean up answers for removed keys
    const newAnswers = { ...answers };
    for (const key of Object.keys(newAnswers)) {
      if (!foundKeys.includes(key)) {
        delete newAnswers[key];
      }
    }
    onChange({ ...data, context: value, dropdowns: newDropdowns }, newAnswers);
  };

  const addOptionToDropdown = (key: string) => {
    const newDropdowns = { ...dropdowns };
    const existing = newDropdowns[key] || { options: [] };
    newDropdowns[key] = { ...existing, options: [...existing.options, ''] };
    onChange({ ...data, dropdowns: newDropdowns }, answers);
  };

  const removeOptionFromDropdown = (key: string, optionIndex: number) => {
    const newDropdowns = { ...dropdowns };
    const existing = newDropdowns[key];
    if (!existing) return;
    const newOptions = existing.options.filter((_, i) => i !== optionIndex);
    newDropdowns[key] = { ...existing, options: newOptions };
    // If the removed option was the correct answer, clear it
    const newAnswers = { ...answers };
    if (existing.options[optionIndex] === newAnswers[key]) {
      delete newAnswers[key];
    }
    onChange({ ...data, dropdowns: newDropdowns }, newAnswers);
  };

  const updateDropdownOption = (key: string, optionIndex: number, value: string) => {
    const newDropdowns = { ...dropdowns };
    const existing = newDropdowns[key];
    if (!existing) return;
    const oldValue = existing.options[optionIndex];
    const newOptions = [...existing.options];
    newOptions[optionIndex] = value;
    newDropdowns[key] = { ...existing, options: newOptions };
    // Update correct answer if it matches the old value
    const newAnswers = { ...answers };
    if (newAnswers[key] === oldValue) {
      newAnswers[key] = value;
    }
    onChange({ ...data, dropdowns: newDropdowns }, newAnswers);
  };

  const updateCorrectAnswer = (key: string, value: string) => {
    const newAnswers = { ...answers };
    newAnswers[key] = value;
    onChange(data, newAnswers);
  };

  return (
    <div className="space-y-6">
      <Textarea
        label="Context (use {1}, {2}, etc. for dropdown positions)"
        value={context}
        onChange={(e) => handleContextChange(e.target.value)}
        placeholder="The {1} cat sat on the {2} mat and {3} the fish."
        rows={4}
      />

      {placeholderKeys.length === 0 && context.length > 0 && (
        <p className="text-sm text-amber-600">
          No placeholders found. Use {'{1}'}, {'{2}'}, etc. in your context text to create dropdown positions.
        </p>
      )}

      {placeholderKeys.map((key) => {
        const dropdown = dropdowns[key] || { options: [] };
        return (
          <div key={key} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Dropdown {'{' + key + '}'} Options
              </label>
            </div>

            {dropdown.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-dropdown-${key}`}
                  checked={answers[key] === option && option !== ''}
                  onChange={() => updateCorrectAnswer(key, option)}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  title="Mark as correct"
                />
                <div className="flex-1">
                  <Input
                    value={option}
                    onChange={(e) => updateDropdownOption(key, optionIndex, e.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOptionFromDropdown(key, optionIndex)}
                  type="button"
                  disabled={dropdown.options.length <= 1}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => addOptionToDropdown(key)}
              type="button"
            >
              + Add Option
            </Button>

            {answers[key] && (
              <p className="text-xs text-blue-600">
                Correct: {answers[key]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
