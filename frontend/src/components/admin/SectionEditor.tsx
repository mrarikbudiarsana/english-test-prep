'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import AudioUploader from './AudioUploader';
import ImageUploader from '@/components/ui/ImageUploader';
import type { Section, SectionType, SpeakingPrompt } from '@/types/test';

interface SectionFormData {
  sectionType: SectionType;
  sectionOrder: number;
  title: string;
  instructions: string;
  durationMinutes: number;
  // Listening
  audioUrl: string | null;
  // Reading
  passageTitle: string | null;
  passageText: string | null;
  // Writing
  taskNumber: number | null;
  taskDescription: string | null;
  minWords: number | null;
  imageUrl: string | null;
  // Speaking
  partNumber: number | null;
  speakingPrompts: SpeakingPrompt[] | null;
  preparationTime: number | null;
  responseTime: number | null;
}

interface SectionEditorProps {
  testId: string;
  testType: string; // Add testType prop
  existingSections?: Section[];
  initialData?: Partial<Section>;
  onSubmit: (data: SectionFormData) => void | Promise<void>;
  onCancel: () => void;
}

const allSectionTypeOptions = [
  { value: 'listening', label: 'Listening' },
  { value: 'reading', label: 'Reading' },
  { value: 'writing', label: 'Writing' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'structure', label: 'Structure & Written Expression' },
];

export default function SectionEditor({ testId, testType, existingSections = [], initialData, onSubmit, onCancel }: SectionEditorProps) {
  // Filter section types based on testType
  const sectionTypeOptions = allSectionTypeOptions.filter(option => {
    if (option.value === 'structure') {
      return testType === 'toefl_itp';
    }
    // TOEFL iTP doesn't have speaking or writing in the traditional sense of the main test, 
    // but often they are included in practice platforms. 
    // strictly speaking: Listening, Structure, Reading.
    // But let's leave them enabling if the user wants to add them, EXCEPT Structure which is unique to ITP.
    return true;
  });

  const [sectionType, setSectionType] = useState<SectionType>(initialData?.sectionType || 'listening');
  // ... (rest of state items are same)
  const [sectionOrder, setSectionOrder] = useState(initialData?.sectionOrder || 1);
  const [title, setTitle] = useState(initialData?.title || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes || 30);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialData?.audioUrl || null);



  const [passageTitle, setPassageTitle] = useState(initialData?.passageTitle || '');
  const [passageText, setPassageText] = useState(initialData?.passageText || '');
  const [taskNumber, setTaskNumber] = useState(initialData?.taskNumber || 1);
  const [taskDescription, setTaskDescription] = useState(initialData?.taskDescription || '');
  const [minWords, setMinWords] = useState(initialData?.minWords || 150);
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [partNumber, setPartNumber] = useState(initialData?.partNumber || 1);
  const [speakingPrompts, setSpeakingPrompts] = useState<SpeakingPrompt[]>(
    initialData?.speakingPrompts || [{ id: '1', text: '', followUp: '' }]
  );
  const [preparationTime, setPreparationTime] = useState(initialData?.preparationTime || 60);
  const [responseTime, setResponseTime] = useState(initialData?.responseTime || 120);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Logic to determine if this is the first section of its type
  const isFirstSectionOfType = () => {
    const sectionsOfType = existingSections.filter(s => s.sectionType === sectionType);
    if (sectionsOfType.length === 0) return true;

    const sorted = [...sectionsOfType].sort((a, b) => a.sectionOrder - b.sectionOrder);
    const first = sorted[0];

    if (initialData?.id) {
      return first.id === initialData.id;
    }

    return false;
  };

  const showDuration = isFirstSectionOfType();

  useEffect(() => {
    // Only force reset if we are creating new and it's hidden. 
    // If editing existing hidden one, keep as is (likely 0) or force to 0 if it was wrong?
    // Let's force 0 if hidden to be safe.
    if (!showDuration) {
      setDurationMinutes(0);
    }
  }, [showDuration]); // Removed initialData dependency to avoid infinite loop if initialData doesn't change

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Section title is required';
    if (showDuration && durationMinutes < 1) newErrors.durationMinutes = 'Duration must be at least 1 minute';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({
        sectionType,
        sectionOrder,
        title: title.trim(),
        instructions: instructions.trim(),
        durationMinutes,
        audioUrl: sectionType === 'listening' ? audioUrl : null,
        passageTitle: sectionType === 'reading' ? passageTitle.trim() || null : null,
        passageText: sectionType === 'reading' ? passageText.trim() || null : null,
        taskNumber: sectionType === 'writing' ? taskNumber : null,
        taskDescription: sectionType === 'writing' ? taskDescription.trim() || null : null,
        minWords: sectionType === 'writing' ? minWords : null,
        imageUrl: sectionType === 'writing' && taskNumber === 1 ? imageUrl : null,
        partNumber: ['speaking', 'listening', 'structure', 'reading'].includes(sectionType) ? partNumber : null,
        speakingPrompts: sectionType === 'speaking' ? speakingPrompts : null,
        preparationTime: sectionType === 'speaking' ? preparationTime : null,
        responseTime: sectionType === 'speaking' ? responseTime : null,
      });
    } finally {
      setLoading(false);
    }
  };

  // Speaking prompts management
  const addPrompt = () => {
    setSpeakingPrompts([
      ...speakingPrompts,
      { id: String(speakingPrompts.length + 1), text: '', followUp: '' },
    ]);
  };

  const removePrompt = (index: number) => {
    setSpeakingPrompts(speakingPrompts.filter((_, i) => i !== index));
  };

  const updatePrompt = (index: number, field: keyof SpeakingPrompt, value: string) => {
    const newPrompts = [...speakingPrompts];
    newPrompts[index] = { ...newPrompts[index], [field]: value };
    setSpeakingPrompts(newPrompts);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Section Type"
          value={sectionType}
          onChange={(e) => setSectionType(e.target.value as SectionType)}
          options={sectionTypeOptions}
        />
        <Input
          label="Order"
          type="number"
          min={1}
          value={sectionOrder}
          onChange={(e) => setSectionOrder(parseInt(e.target.value) || 1)}
        />

        {showDuration && (
          <Input
            label="Total Duration (minutes)"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
            error={errors.durationMinutes}
          />
        )}
      </div>

      <Input
        label="Section Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Listening Section 1"
        error={errors.title}
        required
      />

      <Textarea
        label="Instructions"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Instructions for this section..."
        rows={3}
      />

      {/* Listening-specific fields */}
      {sectionType === 'listening' && (
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-4">
          <h4 className="text-sm font-semibold text-purple-800">Listening Section Settings</h4>
          <Select
            label="Part Number"
            value={String(partNumber)}
            onChange={(e) => setPartNumber(parseInt(e.target.value))}
            options={[
              { value: '1', label: 'Part 1' },
              { value: '2', label: 'Part 2' },
              { value: '3', label: 'Part 3' },
              { value: '4', label: 'Part 4' },
            ]}
          />
          <AudioUploader
            onUpload={(url) => setAudioUrl(url || null)}
            currentUrl={audioUrl}
          />
        </div>
      )}

      {/* Reading-specific fields */}
      {sectionType === 'reading' && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-green-800">Reading Section Settings</h4>
            <span className="text-xs text-green-700 font-medium">1 Section = 1 Passage</span>
          </div>
          <p className="text-xs text-green-700 -mt-2">
            To add multiple passages, create a separate "Reading" section for each passage.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Passage Number"
              value={String(partNumber)}
              onChange={(e) => setPartNumber(parseInt(e.target.value))}
              options={[
                { value: '1', label: 'Passage 1' },
                { value: '2', label: 'Passage 2' },
                { value: '3', label: 'Passage 3' },
                { value: '4', label: 'Passage 4' },
                { value: '5', label: 'Passage 5' },
              ]}
            />
            <Input
              label="Passage Title"
              value={passageTitle}
              onChange={(e) => setPassageTitle(e.target.value)}
              placeholder="e.g., The History of Aviation"
            />
          </div>
          <Textarea
            label="Passage Text"
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
            placeholder="Enter the full reading passage here..."
            rows={10}
          />
        </div>
      )
      }

      {/* Structure-specific fields */}
      {
        sectionType === 'structure' && (
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-4">
            <h4 className="text-sm font-semibold text-indigo-800">Structure Section Settings</h4>
            <Select
              label="Part Number"
              value={String(partNumber)}
              onChange={(e) => setPartNumber(parseInt(e.target.value))}
              options={[
                { value: '1', label: 'Part 1' },
                { value: '2', label: 'Part 2' },
              ]}
            />
          </div>
        )
      }

      {/* Writing-specific fields */}
      {
        sectionType === 'writing' && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-4">
            <h4 className="text-sm font-semibold text-amber-800">Writing Section Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Task Number"
                value={String(taskNumber)}
                onChange={(e) => setTaskNumber(parseInt(e.target.value))}
                options={[
                  { value: '1', label: 'Task 1' },
                  { value: '2', label: 'Task 2' },
                ]}
              />
              <Input
                label="Minimum Words"
                type="number"
                min={0}
                value={minWords}
                onChange={(e) => setMinWords(parseInt(e.target.value) || 0)}
              />
            </div>
            <Textarea
              label="Task Description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe the writing task..."
              rows={5}
            />
            {taskNumber === 1 && (
              <ImageUploader
                onUpload={(url) => setImageUrl(url || null)}
                currentUrl={imageUrl}
              />
            )}
          </div>
        )
      }

      {/* Speaking-specific fields */}
      {
        sectionType === 'speaking' && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
            <h4 className="text-sm font-semibold text-blue-800">Speaking Section Settings</h4>
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Part Number"
                value={String(partNumber)}
                onChange={(e) => setPartNumber(parseInt(e.target.value))}
                options={[
                  { value: '1', label: 'Part 1' },
                  { value: '2', label: 'Part 2' },
                  { value: '3', label: 'Part 3' },
                  { value: '4', label: 'Part 4' },
                ]}
              />
              <Input
                label="Prep Time (seconds)"
                type="number"
                min={0}
                value={preparationTime}
                onChange={(e) => setPreparationTime(parseInt(e.target.value) || 0)}
              />
              <Input
                label="Response Time (seconds)"
                type="number"
                min={0}
                value={responseTime}
                onChange={(e) => setResponseTime(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Speaking Prompts</label>
              {speakingPrompts.map((prompt, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Prompt {index + 1}</span>
                    {speakingPrompts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrompt(index)}
                        type="button"
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={prompt.text}
                    onChange={(e) => updatePrompt(index, 'text', e.target.value)}
                    placeholder="Main prompt text..."
                    rows={2}
                  />
                  <Input
                    value={prompt.followUp || ''}
                    onChange={(e) => updatePrompt(index, 'followUp', e.target.value)}
                    placeholder="Follow-up question (optional)"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addPrompt} type="button">
                + Add Prompt
              </Button>
            </div>
          </div>
        )
      }

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialData?.id ? 'Update Section' : 'Create Section'}
        </Button>
      </div>
    </form >
  );
}
