'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import AudioUploader from './AudioUploader';
import type { Section, SectionType, SpeakingPrompt } from '@/types/test';

interface SectionFormData {
  sectionType: SectionType;
  sectionOrder: number;
  title: string;
  instructions: string;
  durationMinutes: number;
  audioUrl: string | null;
  passageTitle: string | null;
  passageText: string | null;
  taskNumber: number | null;
  taskDescription: string | null;
  minWords: number | null;
  imageUrl: string | null;
  partNumber: number | null;
  speakingPrompts: SpeakingPrompt[] | null;
  preparationTime: number | null;
  responseTime: number | null;
  moduleStage?: number | null;
  modulePath?: string | null;
  taskType?: string | null;
}

interface SectionEditorProps {
  testType: string;
  existingSections?: Section[];
  initialData?: Partial<Section>;
  onSubmit: (data: SectionFormData) => void | Promise<void>;
  onCancel: () => void;
}

const sectionTypeOptions = [
  { value: 'listening', label: 'Listening' },
  { value: 'structure', label: 'Structure and Written Expression' },
  { value: 'reading', label: 'Reading' },
];

function getDefaultDuration(sectionType: SectionType): number {
  switch (sectionType) {
    case 'listening': return 35;
    case 'structure': return 25;
    case 'reading': return 55;
    default: return 30;
  }
}

export default function SectionEditor({ existingSections = [], initialData, onSubmit, onCancel }: SectionEditorProps) {
  const [sectionType, setSectionType] = useState<SectionType>(initialData?.sectionType || 'listening');
  const [sectionOrder, setSectionOrder] = useState(initialData?.sectionOrder || 1);
  const [title, setTitle] = useState(initialData?.title || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes || getDefaultDuration(initialData?.sectionType || 'listening'));
  const [audioUrl, setAudioUrl] = useState<string | null>(initialData?.audioUrl || null);
  const [passageTitle, setPassageTitle] = useState(initialData?.passageTitle || '');
  const [passageText, setPassageText] = useState(initialData?.passageText || '');
  const [partNumber, setPartNumber] = useState(initialData?.partNumber || 1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFirstSectionOfType = () => {
    const sectionsOfType = existingSections.filter((section) => section.sectionType === sectionType);
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
    if (!showDuration) {
      setDurationMinutes(0);
    }
  }, [showDuration]);

  const handleSectionTypeChange = (newType: SectionType) => {
    setSectionType(newType);
    if (!initialData?.id) {
      setDurationMinutes(getDefaultDuration(newType));
    }
  };

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
      const normalizedPassageText = passageText.replace(/\r\n/g, '\n');
      await onSubmit({
        sectionType,
        sectionOrder,
        title: title.trim(),
        instructions: instructions.trim(),
        durationMinutes,
        audioUrl: sectionType === 'listening' ? audioUrl : null,
        passageTitle: sectionType === 'reading' ? passageTitle.trim() || null : null,
        passageText: sectionType === 'reading' ? (normalizedPassageText.trim().length > 0 ? normalizedPassageText : null) : null,
        taskNumber: null,
        taskDescription: null,
        minWords: null,
        imageUrl: null,
        partNumber: ['listening', 'structure', 'reading'].includes(sectionType) ? partNumber : null,
        speakingPrompts: null,
        preparationTime: null,
        responseTime: null,
        moduleStage: null,
        modulePath: null,
        taskType: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3">
          <span className="text-sm font-semibold text-indigo-900">TOEFL ITP Level 1 Structure</span>
          <ul className="mt-3 space-y-1 text-xs text-indigo-800">
            <li>Section 1: Listening, 35 min, 50 questions</li>
            <li>Section 2: Structure and Written Expression, 25 min, 40 questions</li>
            <li>Section 3: Reading, 55 min, 50 questions</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select label="Section Type" value={sectionType} onChange={(e) => handleSectionTypeChange(e.target.value as SectionType)} options={sectionTypeOptions} />
        <Input label="Order" type="number" min={1} value={sectionOrder} onChange={(e) => setSectionOrder(parseInt(e.target.value) || 1)} />
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

      <Input label="Section Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Listening Part A" error={errors.title} required />

      <Textarea label="Instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions for this section..." rows={3} />

      {sectionType === 'listening' && (
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-4">
          <h4 className="text-sm font-semibold text-purple-800">Listening Section Settings</h4>
          <Select
            label="Part Number"
            value={String(partNumber)}
            onChange={(e) => setPartNumber(parseInt(e.target.value))}
            options={[
              { value: '1', label: 'Part A - Short Conversations' },
              { value: '2', label: 'Part B - Longer Conversations' },
              { value: '3', label: 'Part C - Talks and Lectures' },
            ]}
          />
          {partNumber === 1 ? (
            <p className="text-xs text-purple-700 bg-purple-100 rounded p-2">Part A uses one audio clip per question. Upload audio later inside each question item.</p>
          ) : (
            <AudioUploader onUpload={(url) => setAudioUrl(url || null)} currentUrl={audioUrl} />
          )}
        </div>
      )}

      {sectionType === 'structure' && (
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-4">
          <h4 className="text-sm font-semibold text-indigo-800">Structure Section Settings</h4>
          <Select
            label="Part Number"
            value={String(partNumber)}
            onChange={(e) => setPartNumber(parseInt(e.target.value))}
            options={[
              { value: '1', label: 'Part 1 - Structure' },
              { value: '2', label: 'Part 2 - Written Expression' },
            ]}
          />
        </div>
      )}

      {sectionType === 'reading' && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-green-800">Reading Section Settings</h4>
            <span className="text-xs text-green-700 font-medium">1 section = 1 passage</span>
          </div>
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
            <Input label="Passage Title" value={passageTitle} onChange={(e) => setPassageTitle(e.target.value)} placeholder="e.g., The History of Aviation" />
          </div>
          <Textarea label="Passage Text" value={passageText} onChange={(e) => setPassageText(e.target.value)} placeholder="Enter the full reading passage here..." rows={10} />
          <p className="text-xs text-green-700">Paste plain text exactly as the source and keep manual line breaks where line references should point.</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" loading={loading}>{initialData?.id ? 'Update Section' : 'Create Section'}</Button>
      </div>
    </form>
  );
}
