'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { TestType } from '@/types/test';

interface TestFormData {
  title: string;
  description: string;
  testType: TestType;
  isFree: boolean;
}

interface TestFormProps {
  initialData?: Partial<TestFormData>;
  onSubmit: (data: TestFormData) => void | Promise<void>;
  loading?: boolean;
}

const testTypeOptions = [
  { value: 'academic', label: 'Academic' },
  { value: 'general_training', label: 'General Training' },
];

export default function TestForm({ initialData, onSubmit, loading }: TestFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [testType, setTestType] = useState<TestType>(initialData?.testType || 'academic');
  const [isFree, setIsFree] = useState(initialData?.isFree ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!testType) {
      newErrors.testType = 'Test type is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ title: title.trim(), description: description.trim(), testType, isFree });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Test Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., IELTS Academic Practice Test 1"
        error={errors.title}
        required
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="A brief description of this practice test..."
        rows={4}
      />

      <Select
        label="Test Type"
        value={testType}
        onChange={(e) => setTestType(e.target.value as TestType)}
        options={testTypeOptions}
        error={errors.testType}
      />

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isFree}
          onChange={(e) => setIsFree(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
        />
        <div>
          <span className="text-sm font-medium text-gray-700">Free Test</span>
          <p className="text-xs text-gray-500">Allow users to take this test without a subscription</p>
        </div>
      </label>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>
          {initialData ? 'Save Changes' : 'Create Test'}
        </Button>
      </div>
    </form>
  );
}
