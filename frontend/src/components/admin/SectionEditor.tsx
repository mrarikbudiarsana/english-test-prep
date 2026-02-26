'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import AudioUploader from './AudioUploader';
import VideoUploader from './VideoUploader';
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
  // TOEFL iBT MST
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

// ---------- Section type options per test type ----------

const allSectionTypeOptions = [
  { value: 'listening', label: 'Listening' },
  { value: 'reading', label: 'Reading' },
  { value: 'writing', label: 'Writing' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'structure', label: 'Structure & Written Expression' },
];

const PTE_TASKS_WITH_PROMPT_AUDIO = new Set([
  'repeat_sentence',
  'retell_lecture',
  'answer_short_question',
  'summarize_group_discussion',
]);
const PTE_TASKS_WITH_PROMPT_IMAGE = new Set([
  'describe_image',
  'retell_lecture',
]);

function getSectionTypeOptions(testType: string) {
  if (testType === 'toefl_itp') {
    // TOEFL ITP: Listening, Structure, Reading only
    return allSectionTypeOptions.filter(o =>
      ['listening', 'structure', 'reading'].includes(o.value)
    );
  }

  if (testType === 'toefl_ibt') {
    // TOEFL iBT: Reading, Listening, Writing, Speaking (no Structure)
    return allSectionTypeOptions.filter(o =>
      ['reading', 'listening', 'writing', 'speaking'].includes(o.value)
    );
  }

  if (testType === 'pte_academic') {
    // PTE Academic: Speaking+Writing, Reading, Listening
    return allSectionTypeOptions.filter(o =>
      ['speaking', 'reading', 'listening'].includes(o.value)
    );
  }

  // IELTS and others: all except Structure
  return allSectionTypeOptions.filter(o => o.value !== 'structure');
}

// ---------- Smart defaults ----------

function getDefaultDuration(testType: string, sectionType: SectionType): number {
  const isIelts = testType === 'academic' || testType === 'general_training';
  if (isIelts) {
    switch (sectionType) {
      case 'listening': return 30;
      case 'reading': return 60;
      case 'writing': return 60;
      case 'speaking': return 14;
      default: return 30;
    }
  }
  if (testType === 'toefl_itp') {
    switch (sectionType) {
      case 'listening': return 35;
      case 'structure': return 25;
      case 'reading': return 55;
      default: return 30;
    }
  }
  if (testType === 'toefl_ibt') {
    switch (sectionType) {
      case 'reading': return 36;
      case 'listening': return 41;
      case 'writing': return 29;
      case 'speaking': return 20;
      default: return 30;
    }
  }
  if (testType === 'pte_academic') {
    switch (sectionType) {
      case 'speaking': return 80; // Speaking + Writing combined session
      case 'reading': return 27;
      case 'listening': return 35;
      default: return 30;
    }
  }
  return 30;
}

// ---------- Structure guide ----------

function getStructureGuide(testType: string): { title: string; lines: string[] } | null {
  const isIelts = testType === 'academic' || testType === 'general_training';

  if (isIelts) {
    return {
      title: testType === 'academic' ? 'IELTS Academic Structure' : 'IELTS General Training Structure',
      lines: [
        'Listening — 4 sections (Parts 1-4), 30 min, ~40 questions',
        'Reading — 3 sections (Passages 1-3), 60 min, ~40 questions',
        'Writing — 2 sections (Task 1 + Task 2), 60 min',
        'Speaking — 3 sections (Parts 1-3), 11-14 min',
      ],
    };
  }

  if (testType === 'toefl_itp') {
    return {
      title: 'TOEFL ITP Level 1 Structure',
      lines: [
        'Section 1 — Listening: 3 parts, 35 min, 50 questions',
        '    Part A: Short conversations (30 Qs, audio per question)',
        '    Part B: Longer conversations (8 Qs, shared audio)',
        '    Part C: Talks/lectures (12 Qs, shared audio)',
        'Section 2 — Structure: 2 parts, 25 min, 40 questions',
        '    Part 1: Structure (15 Qs, MCQ)',
        '    Part 2: Written Expression (25 Qs, MCQ)',
        'Section 3 — Reading: 5 passages, 55 min, 50 questions',
      ],
    };
  }

  if (testType === 'toefl_ibt') {
    return {
      title: 'TOEFL iBT 2026 Structure (Adaptive)',
      lines: [
        'Reading — Stage 1 (20 items) → Stage 2 upper/lower (15 items), ~36 min',
        '    Task types: Complete the Words, Read in Daily Life, Academic Passage',
        'Listening — Stage 1 (20 items) → Stage 2 upper/lower (15 items), ~41 min',
        '    Task types: Choose a Response, Conversation, Announcement, Academic Talk',
        'Writing — 3 task types, ~29 min total',
        '    Build a Sentence (10 items) + Write an Email (1) + Academic Discussion (1)',
        'Speaking — 2 task types, ~20 min total',
        '    Listen and Repeat (7 prompts, 5 pts each) + Take an Interview (4 prompts, 5 pts each)',
      ],
    };
  }

  if (testType === 'pte_academic') {
    return {
      title: 'PTE Academic Structure',
      lines: [
        'Section 1 - Speaking & Writing: ~76-84 minutes',
        '    Recommended set size: 35-40 items',
        'Section 2 - Reading: ~23-30 minutes',
        '    Recommended set size: 13-19 items',
        'Section 3 - Listening: ~31-39 minutes',
        '    Recommended set size: 12-18 items',
        'Total full set: approximately 65-75 items',
      ],
    };
  }

  return null;
}

// ---------- Component ----------

export default function SectionEditor({ testType, existingSections = [], initialData, onSubmit, onCancel }: SectionEditorProps) {
  const sectionTypeOptions = getSectionTypeOptions(testType);
  const structureGuide = getStructureGuide(testType);
  const [showGuide, setShowGuide] = useState(false);

  const [sectionType, setSectionType] = useState<SectionType>(initialData?.sectionType || 'listening');
  const [sectionOrder, setSectionOrder] = useState(initialData?.sectionOrder || 1);
  const [title, setTitle] = useState(initialData?.title || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [durationMinutes, setDurationMinutes] = useState(
    initialData?.durationMinutes || getDefaultDuration(testType, initialData?.sectionType || 'listening')
  );
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
  const [moduleStage, setModuleStage] = useState<number>(initialData?.moduleStage ?? 1);
  const [modulePath, setModulePath] = useState<string>(initialData?.modulePath ?? '');
  const [taskType, setTaskType] = useState<string>(initialData?.taskType ?? '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const speakingPromptMediaRequired =
    testType === 'pte_academic' &&
    sectionType === 'speaking' &&
    PTE_TASKS_WITH_PROMPT_AUDIO.has(taskType);
  const speakingPromptImageEnabled =
    testType === 'pte_academic' &&
    sectionType === 'speaking' &&
    PTE_TASKS_WITH_PROMPT_IMAGE.has(taskType);
  const speakingPromptImageRequired =
    testType === 'pte_academic' &&
    sectionType === 'speaking' &&
    taskType === 'describe_image';

  // For TOEFL ITP: only the first section of each type shows the duration field
  // (subsequent sections auto-get duration=0 from the backend).
  // For all other exam types (IELTS, TOEFL iBT, PTE): every section has its own duration.
  const isFirstSectionOfType = () => {
    if (testType !== 'toefl_itp') return true;

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
    if (!showDuration) {
      setDurationMinutes(0);
    }
  }, [showDuration]);

  // Update default duration when section type changes (only for new sections)
  const handleSectionTypeChange = (newType: SectionType) => {
    setSectionType(newType);
    if (!initialData?.id) {
      setDurationMinutes(getDefaultDuration(testType, newType));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Section title is required';
    if (showDuration && durationMinutes < 1) newErrors.durationMinutes = 'Duration must be at least 1 minute';
    if (sectionType === 'speaking' && speakingPromptMediaRequired) {
      const missingIndex = speakingPrompts.findIndex((p) => !((p.mediaUrl || p.audioUrl || '').trim()));
      if (missingIndex >= 0) {
        newErrors.speakingPrompts = `Prompt ${missingIndex + 1} is missing media (audio/video).`;
      }
    }
    if (sectionType === 'speaking' && speakingPromptImageRequired) {
      const missingImageIndex = speakingPrompts.findIndex((p) => !((p.imageUrl || '').trim()));
      if (missingImageIndex >= 0) {
        newErrors.speakingPrompts = `Prompt ${missingImageIndex + 1} is missing image.`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Preserve reading passage exactly as typed for TOEFL ITP line-referenced questions.
      // Only use trim to decide whether the field is empty.
      const normalizedPassageText = passageText.replace(/\r\n/g, '\n');
      await onSubmit({
        sectionType,
        sectionOrder,
        title: title.trim(),
        instructions: instructions.trim(),
        durationMinutes,
        audioUrl: sectionType === 'listening' ? audioUrl : null,
        passageTitle: sectionType === 'reading' ? passageTitle.trim() || null : null,
        passageText: sectionType === 'reading'
          ? (normalizedPassageText.trim().length > 0 ? normalizedPassageText : null)
          : null,
        taskNumber: sectionType === 'writing' ? taskNumber : null,
        taskDescription: sectionType === 'writing' ? taskDescription.trim() || null : null,
        minWords: sectionType === 'writing' ? minWords : null,
        imageUrl: sectionType === 'writing' && taskNumber === 1 ? imageUrl : null,
        partNumber: ['speaking', 'listening', 'structure', 'reading'].includes(sectionType) ? partNumber : null,
        speakingPrompts: sectionType === 'speaking' ? speakingPrompts : null,
        preparationTime: sectionType === 'speaking' ? preparationTime : null,
        responseTime: sectionType === 'speaking' ? responseTime : null,
        moduleStage: testType === 'toefl_ibt' ? moduleStage : null,
        modulePath: testType === 'toefl_ibt' && moduleStage === 2 ? (modulePath || null) : null,
        taskType:
          testType === 'toefl_ibt' || (testType === 'pte_academic' && sectionType === 'speaking')
            ? (taskType || null)
            : null,
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
      {/* Test structure guide */}
      {structureGuide && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <span className="text-sm font-semibold text-indigo-900">{structureGuide.title}</span>
            </div>
            <svg
              className={`w-4 h-4 text-indigo-600 transition-transform ${showGuide ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showGuide && (
            <div className="px-4 pb-3 border-t border-indigo-200 pt-3">
              <ul className="space-y-1">
                {structureGuide.lines.map((line, i) => (
                  <li
                    key={i}
                    className={`text-xs text-indigo-800 ${line.startsWith('    ') ? 'ml-4 text-indigo-600' : 'font-medium'
                      }`}
                  >
                    {line.trim()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Section Type"
          value={sectionType}
          onChange={(e) => handleSectionTypeChange(e.target.value as SectionType)}
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

      {/* TOEFL iBT MST stage fields */}
      {testType === 'toefl_ibt' && (
        <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200 space-y-4">
          <h4 className="text-sm font-semibold text-cyan-800">TOEFL iBT 2026 — Adaptive Stage Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Module Stage"
              value={String(moduleStage)}
              onChange={(e) => {
                const stage = parseInt(e.target.value);
                setModuleStage(stage);
                if (stage === 1) setModulePath('');
              }}
              options={[
                { value: '1', label: '1 — Stage 1 (all candidates)' },
                { value: '2', label: '2 — Stage 2 (adaptive)' },
              ]}
            />
            {moduleStage === 2 && (
              <Select
                label="Module Path"
                value={modulePath}
                onChange={(e) => setModulePath(e.target.value)}
                options={[
                  { value: '', label: '— Select path —' },
                  { value: 'upper', label: 'Upper (higher difficulty)' },
                  { value: 'lower', label: 'Lower (standard difficulty)' },
                ]}
              />
            )}
            <Select
              label="Task Type (optional)"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              options={
                sectionType === 'reading'
                  ? [
                    { value: '', label: '— Mixed / not set —' },
                    { value: 'complete_words', label: 'Complete the Words' },
                    { value: 'read_daily_life', label: 'Read in Daily Life' },
                    { value: 'read_academic_passage', label: 'Academic Passage' },
                  ]
                  : sectionType === 'listening'
                  ? [
                    { value: '', label: '— Mixed / not set —' },
                    { value: 'listen_choose_response', label: 'Choose a Response' },
                    { value: 'listen_conversation', label: 'Conversation' },
                    { value: 'listen_announcement', label: 'Announcement' },
                    { value: 'listen_academic_talk', label: 'Academic Talk' },
                  ]
                  : sectionType === 'writing'
                  ? [
                    { value: '', label: '— Select writing task —' },
                    { value: 'build_sentence', label: 'Build a Sentence' },
                    { value: 'write_email', label: 'Write an Email' },
                    { value: 'academic_discussion', label: 'Academic Discussion' },
                  ]
                  : sectionType === 'speaking'
                  ? [
                    { value: '', label: '— Select speaking task —' },
                    { value: 'listen_repeat', label: 'Listen and Repeat' },
                    { value: 'take_interview', label: 'Take an Interview' },
                  ]
                  : [{ value: '', label: '— N/A for this section type —' }]
              }
            />
          </div>
        </div>
      )}

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
          {['toefl_itp', 'toefl_ibt'].includes(testType) && (
            <Select
              label="Part Number"
              value={String(partNumber)}
              onChange={(e) => setPartNumber(parseInt(e.target.value))}
              options={
                testType === 'toefl_itp'
                  ? [
                    { value: '1', label: 'Part A — Short Conversations' },
                    { value: '2', label: 'Part B — Longer Conversations' },
                    { value: '3', label: 'Part C — Talks/Lectures' },
                  ]
                  : [
                    { value: '1', label: 'Part 1' },
                    { value: '2', label: 'Part 2' },
                    { value: '3', label: 'Part 3' },
                    { value: '4', label: 'Part 4' },
                  ]
              }
            />
          )}
          {testType === 'toefl_itp' && partNumber === 1 && (
            <p className="text-xs text-purple-700 bg-purple-100 rounded p-2">
              💡 Part A: Each question has its own short conversation audio. Upload audio per-question in the question editor.
            </p>
          )}
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
            To add multiple passages, create a separate &quot;Reading&quot; section for each passage.
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
          {testType === 'toefl_itp' && (
            <p className="text-xs text-green-700">
              Paste plain text exactly as the source and keep manual line breaks where line references should point.
            </p>
          )}
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
                { value: '1', label: 'Part 1 — Structure' },
                { value: '2', label: 'Part 2 — Written Expression' },
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Part Number"
                value={String(partNumber)}
                onChange={(e) => setPartNumber(parseInt(e.target.value))}
                options={testType === 'pte_academic'
                  ? [
                    { value: '1', label: 'S&W Block 1' },
                    { value: '2', label: 'S&W Block 2' },
                    { value: '3', label: 'S&W Block 3' },
                    { value: '4', label: 'S&W Block 4' },
                    { value: '5', label: 'S&W Block 5' },
                    { value: '6', label: 'S&W Block 6' },
                    { value: '7', label: 'S&W Block 7' },
                    { value: '8', label: 'S&W Block 8' },
                    { value: '9', label: 'S&W Block 9' },
                    { value: '10', label: 'S&W Block 10' },
                  ]
                  : [
                    { value: '1', label: 'Part 1' },
                    { value: '2', label: 'Part 2' },
                    { value: '3', label: 'Part 3' },
                    { value: '4', label: 'Part 4' },
                  ]}
              />
              {testType === 'pte_academic' && (
                <Select
                  label="PTE Task Type (for scoring)"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  options={[
                    { value: '', label: '— Select task type —' },
                    { value: 'read_aloud', label: 'Read Aloud' },
                    { value: 'repeat_sentence', label: 'Repeat Sentence' },
                    { value: 'describe_image', label: 'Describe Image' },
                    { value: 'retell_lecture', label: 'Retell Lecture' },
                    { value: 'answer_short_question', label: 'Answer Short Question' },
                    { value: 'summarize_group_discussion', label: 'Summarize Group Discussion' },
                    { value: 'respond_to_a_situation', label: 'Respond to a Situation' },
                    { value: 'summarize_written_text', label: 'Summarize Written Text' },
                    { value: 'write_essay', label: 'Write Essay' },
                    { value: 'summarize_spoken_text', label: 'Summarize Spoken Text' },
                  ]}
                />
              )}
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
            {testType === 'pte_academic' && (
              <p className="text-xs text-blue-700 bg-blue-100 rounded p-2">
                Use one section prompt per PTE S&W task block. Task type is used by the PTE scoring engine for deterministic weighting and penalties.
              </p>
            )}
            {speakingPromptMediaRequired && (
              <p className="text-xs text-blue-700 bg-blue-100 rounded p-2">
                This task contributes to Listening score. Upload one media file (audio/video) per prompt.
              </p>
            )}
            {speakingPromptImageEnabled && (
              <p className="text-xs text-blue-700 bg-blue-100 rounded p-2">
                This task supports image stimulus per prompt.
              </p>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Speaking Prompts</label>
              {errors.speakingPrompts && (
                <p className="text-sm text-red-600">{errors.speakingPrompts}</p>
              )}
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
                  {speakingPromptMediaRequired && (
                    <div className="space-y-3">
                      <AudioUploader
                        onUpload={(url) => updatePrompt(index, 'mediaUrl', url || '')}
                        currentUrl={(prompt.mediaUrl || prompt.audioUrl) || null}
                      />
                      <VideoUploader
                        onUpload={(url) => updatePrompt(index, 'mediaUrl', url || '')}
                        currentUrl={(prompt.mediaUrl || prompt.audioUrl) || null}
                      />
                    </div>
                  )}
                  {speakingPromptImageEnabled && (
                    <ImageUploader
                      onUpload={(url) => updatePrompt(index, 'imageUrl', url || '')}
                      currentUrl={prompt.imageUrl || null}
                    />
                  )}
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
