'use client';

import { type MatchingData } from '@/types/test';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface MatchingEditorProps {
  data: MatchingData;
  correctAnswer: any;
  onChange: (data: MatchingData, correctAnswer: any) => void;
}

export default function MatchingEditor({ data, correctAnswer, onChange }: MatchingEditorProps) {
  const instructions = data.instructions || '';
  const items = data.items || [];
  const options = data.options || [];
  const allowReuse = data.allowReuse || false;
  // correctAnswer is a Record<string, string> mapping item key to option key
  const mapping: Record<string, string> = correctAnswer && typeof correctAnswer === 'object'
    ? correctAnswer
    : {};

  const handleInstructionsChange = (value: string) => {
    onChange({ ...data, instructions: value }, mapping);
  };

  const handleAllowReuseToggle = () => {
    onChange({ ...data, allowReuse: !allowReuse }, mapping);
  };

  // Items management
  const addItem = () => {
    const nextNum = items.length + 1;
    const newItems = [...items, { key: String(nextNum), text: '' }];
    onChange({ ...data, items: newItems }, mapping);
  };

  const removeItem = (index: number) => {
    const removedKey = items[index].key;
    const newItems = items.filter((_, i) => i !== index);
    const newMapping = { ...mapping };
    delete newMapping[removedKey];
    onChange({ ...data, items: newItems }, newMapping);
  };

  const updateItemKey = (index: number, key: string) => {
    const oldKey = items[index].key;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], key };
    const newMapping = { ...mapping };
    if (newMapping[oldKey] !== undefined) {
      newMapping[key] = newMapping[oldKey];
      delete newMapping[oldKey];
    }
    onChange({ ...data, items: newItems }, newMapping);
  };

  const updateItemText = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], text };
    onChange({ ...data, items: newItems }, mapping);
  };

  // Options management
  const addOption = () => {
    const nextKey = String.fromCharCode(65 + options.length); // A, B, C...
    const newOptions = [...options, { key: nextKey, text: '' }];
    onChange({ ...data, options: newOptions }, mapping);
  };

  const removeOption = (index: number) => {
    const removedKey = options[index].key;
    const newOptions = options.filter((_, i) => i !== index);
    // Remove any mappings that point to the removed option
    const newMapping = { ...mapping };
    for (const [k, v] of Object.entries(newMapping)) {
      if (v === removedKey) {
        delete newMapping[k];
      }
    }
    onChange({ ...data, options: newOptions }, newMapping);
  };

  const updateOptionKey = (index: number, key: string) => {
    const oldKey = options[index].key;
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], key };
    // Update any mappings that reference the old key
    const newMapping = { ...mapping };
    for (const [k, v] of Object.entries(newMapping)) {
      if (v === oldKey) {
        newMapping[k] = key;
      }
    }
    onChange({ ...data, options: newOptions }, newMapping);
  };

  const updateOptionText = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text };
    onChange({ ...data, options: newOptions }, mapping);
  };

  // Mapping management
  const updateMapping = (itemKey: string, optionKey: string) => {
    const newMapping = { ...mapping };
    if (optionKey === '') {
      delete newMapping[itemKey];
    } else {
      newMapping[itemKey] = optionKey;
    }
    onChange(data, newMapping);
  };

  return (
    <div className="space-y-6">
      <Textarea
        label="Instructions"
        value={instructions}
        onChange={(e) => handleInstructionsChange(e.target.value)}
        placeholder="Match each item with the correct option..."
        rows={2}
      />

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={allowReuse}
          onChange={handleAllowReuseToggle}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Allow options to be reused
      </label>

      {/* Items List */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Items (to be matched)</label>
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={item.key}
              onChange={(e) => updateItemKey(index, e.target.value)}
              className="w-16 text-center"
              placeholder="#"
            />
            <div className="flex-1">
              <Input
                value={item.text}
                onChange={(e) => updateItemText(index, e.target.value)}
                placeholder={`Item ${item.key} text`}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              type="button"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} type="button">
          + Add Item
        </Button>
      </div>

      {/* Options List */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Options (answers to choose from)</label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={option.key}
              onChange={(e) => updateOptionKey(index, e.target.value)}
              className="w-16 text-center"
              placeholder="Key"
            />
            <div className="flex-1">
              <Input
                value={option.text}
                onChange={(e) => updateOptionText(index, e.target.value)}
                placeholder={`Option ${option.key} text`}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeOption(index)}
              type="button"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addOption} type="button">
          + Add Option
        </Button>
      </div>

      {/* Mapping Interface */}
      {items.length > 0 && options.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Correct Matching</label>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 min-w-[120px] truncate">
                  {item.key}. {item.text || '(empty)'}
                </span>
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <select
                  value={mapping[item.key] || ''}
                  onChange={(e) => updateMapping(item.key, e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                >
                  <option value="">-- Select --</option>
                  {options.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.key}. {opt.text}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
