'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import AudioUploader from './AudioUploader';
import MCQEditor from './QuestionTypeEditors/MCQEditor';
import TFNGEditor from './QuestionTypeEditors/TFNGEditor';
import CompletionEditor from './QuestionTypeEditors/CompletionEditor';
import MatchingEditor from './QuestionTypeEditors/MatchingEditor';
import DropdownEditor from './QuestionTypeEditors/DropdownEditor';
import PteChoiceEditor from './QuestionTypeEditors/PteChoiceEditor';
import PteStructuredEditor from './QuestionTypeEditors/PteStructuredEditor';
import type {
  TestType,
  SectionType,
  QuestionType,
  QuestionData,
  MCQData,
  TFNGData,
  CompletionData,
  MatchingData,
  DropdownData,
  PteMcqData,
  PteReadingFillBlanksDropdownData,
  PteReadingFillBlanksDragDropData,
  PteReorderParagraphData,
  PteListeningFillBlanksData,
  PteHighlightIncorrectWordsData,
  PteWriteFromDictationData,
} from '@/types/test';

interface QuestionFormData {
  questionNumber: number;
  questionType: QuestionType;
  questionText: string;
  audioUrl?: string | null;
  questionData: QuestionData;
  correctAnswer: any;
  points: number;
  explanation: string | null;
  groupLabel?: string | null;
  groupInstructions?: string | null;
}

interface QuestionEditorProps {
  testType?: TestType;
  sectionType?: SectionType;
  partNumber?: number;
  initialData?: Partial<QuestionFormData> & { id?: string };
  onSubmit: (data: QuestionFormData) => void | Promise<void>;
  onCancel: () => void;
  nextQuestionNumber?: number;
}

// ---------- Question type filtering per test/section ----------

const ALL_QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false_not_given', label: 'True / False / Not Given' },
  { value: 'yes_no_not_given', label: 'Yes / No / Not Given' },
  { value: 'completion', label: 'Completion' },
  { value: 'matching', label: 'Matching' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'pte_mcq_single', label: 'PTE MCQ (Single Answer)' },
  { value: 'pte_mcq_multiple', label: 'PTE MCQ (Multiple Answers)' },
  { value: 'pte_reading_fill_blanks_dropdown', label: 'PTE Reading Fill in the Blanks (Dropdown)' },
  { value: 'pte_reading_fill_blanks_drag_drop', label: 'PTE Reading Fill in the Blanks (Drag and Drop)' },
  { value: 'pte_reorder_paragraph', label: 'PTE Re-order Paragraph' },
  { value: 'pte_listening_fill_blanks', label: 'PTE Listening Fill in the Blanks' },
  { value: 'pte_highlight_correct_summary', label: 'PTE Highlight Correct Summary' },
  { value: 'pte_select_missing_word', label: 'PTE Select Missing Word' },
  { value: 'pte_highlight_incorrect_words', label: 'PTE Highlight Incorrect Words' },
  { value: 'pte_write_from_dictation', label: 'PTE Write from Dictation' },
];

function getAllowedTypes(
  testType?: TestType,
  sectionType?: SectionType,
): QuestionType[] | null {
  if (!testType || !sectionType) return null; // show all

  const isIelts = testType === 'academic' || testType === 'general_training';

  if (isIelts) {
    switch (sectionType) {
      case 'listening':
        return ['multiple_choice', 'completion', 'matching', 'dropdown'];
      case 'reading':
        return [
          'multiple_choice',
          'true_false_not_given',
          'yes_no_not_given',
          'completion',
          'matching',
          'dropdown',
        ];
      case 'writing':
      case 'speaking':
        return ['multiple_choice']; // rare edge-case fallback
      default:
        return null;
    }
  }

  if (testType === 'toefl_itp') {
    switch (sectionType) {
      case 'listening':
        return ['multiple_choice'];
      case 'structure':
        return ['multiple_choice'];
      case 'reading':
        return ['multiple_choice'];
      default:
        return null;
    }
  }

  if (testType === 'pte_academic') {
    switch (sectionType) {
      case 'reading':
        return [
          'pte_mcq_single',
          'pte_mcq_multiple',
          'pte_reading_fill_blanks_dropdown',
          'pte_reading_fill_blanks_drag_drop',
          'pte_reorder_paragraph',
        ];
      case 'listening':
        return [
          'pte_mcq_single',
          'pte_mcq_multiple',
          'pte_listening_fill_blanks',
          'pte_highlight_correct_summary',
          'pte_select_missing_word',
          'pte_highlight_incorrect_words',
          'pte_write_from_dictation',
        ];
      case 'writing':
      case 'speaking':
        return ['pte_mcq_single'];
      default:
        return null;
    }
  }

  return null; // unknown test type -- show all
}

// ---------- Contextual guidance ----------

function getGuidance(
  testType?: TestType,
  sectionType?: SectionType,
  partNumber?: number,
): { icon: string; title: string; description: string } | null {
  if (!testType || !sectionType) return null;

  const isIelts = testType === 'academic' || testType === 'general_training';

  if (isIelts) {
    switch (sectionType) {
      case 'listening':
        return {
          icon: '🎧',
          title: 'IELTS Listening',
          description:
            'Group questions with a shared label (e.g., "Questions 1-7"). Use Completion for fill-in-the-blank, Matching for matching tasks, and Dropdown for map/diagram labelling.',
        };
      case 'reading':
        return {
          icon: '📖',
          title: 'IELTS Reading',
          description:
            'Use TFNG for factual passages and YNNG for opinion passages. Use Dropdown for matching headings — list headings as dropdown options for each paragraph. Group questions with shared instructions.',
        };
      case 'writing':
        return {
          icon: '✍️',
          title: 'IELTS Writing',
          description:
            'Writing tasks are defined at the section level (task description + rich text editor). Questions here are typically not needed — the student writes in the test-taking editor directly.',
        };
      case 'speaking':
        return {
          icon: '🎙️',
          title: 'IELTS Speaking',
          description:
            'Speaking prompts are defined at the section level. Questions here are typically not needed — the student records audio responses directly.',
        };
    }
  }

  if (testType === 'toefl_itp') {
    switch (sectionType) {
      case 'listening':
        if (partNumber === 1) {
          return {
            icon: '🎧',
            title: 'TOEFL ITP — Listening Part A (Short Conversations)',
            description:
              'Each question has its own short conversation audio. Upload audio per-question using the uploader below. All questions are multiple choice with 4 options (A-D).',
          };
        }
        if (partNumber === 2) {
          return {
            icon: '🎧',
            title: 'TOEFL ITP — Listening Part B (Longer Conversations)',
            description:
              'Questions share a longer conversation audio uploaded at the section level. No per-question audio needed. All questions are multiple choice with 4 options (A-D).',
          };
        }
        return {
          icon: '🎧',
          title: 'TOEFL ITP — Listening Part C (Talks/Lectures)',
          description:
            'Questions share a talk/lecture audio uploaded at the section level. No per-question audio needed. All questions are multiple choice with 4 options (A-D).',
        };
      case 'structure':
        if (partNumber === 1) {
          return {
            icon: '📝',
            title: 'TOEFL ITP — Structure Part 1 (Sentence Completion)',
            description:
              'Choose the word or phrase that best completes the sentence. All questions are multiple choice with 4 options (A-D).',
          };
        }
        return {
          icon: '📝',
          title: 'TOEFL ITP — Structure Part 2 (Written Expression)',
          description:
            'Identify the underlined word/phrase that is incorrect. Use Multiple Choice (A-D). In the question text, use <u>text</u> to underline the four choices.',
        };
      case 'reading':
        return {
          icon: '📖',
          title: 'TOEFL ITP — Reading Comprehension',
          description:
            'All questions are multiple choice with 4 options (A-D). Each passage is a separate section with ~10 questions.',
        };
    }
  }

  if (testType === 'pte_academic') {
    switch (sectionType) {
      case 'reading':
        return {
          icon: 'PTE',
          title: 'PTE Reading',
          description:
            'Use PTE reading item types: MCQ, Fill in the Blanks (Dropdown/Drag and Drop), and Re-order Paragraph. Recommended per full set: FIB Dropdown (5-6), MCQ Multiple (2-3), Re-order Paragraph (2-3), FIB Drag-Drop (4-5), MCQ Single (2-3).',
        };
      case 'listening':
        return {
          icon: 'PTE',
          title: 'PTE Listening',
          description:
            'Use PTE listening item types: Fill in the Blanks, Highlight Correct Summary, Select Missing Word, Highlight Incorrect Words, and Write from Dictation. Recommended per full set: Summarize Spoken Text (1), MCQ Multiple (2-3), FIB Listening (2-3), Highlight Correct Summary (2-3), MCQ Single (2-3), Select Missing Word (1-2), Highlight Incorrect Words (2-3), Write from Dictation (3-4).',
        };
      case 'writing':
        return {
          icon: 'PTE',
          title: 'PTE Writing',
          description:
            'Extended writing prompts can be authored at section level; this editor currently supports objective items.',
        };
      case 'speaking':
        return {
          icon: 'PTE',
          title: 'PTE Speaking',
          description:
            'Extended speaking prompts can be authored at section level; this editor currently supports objective items.',
        };
    }
  }

  return null;
}

// ---------- Helpers ----------

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
    case 'pte_mcq_single':
      return {
        prompt: '',
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ],
      } as PteMcqData;
    case 'pte_mcq_multiple':
      return {
        prompt: '',
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ],
      } as PteMcqData;
    case 'pte_reading_fill_blanks_dropdown':
      return {
        context: '',
        blanks: {},
      } as PteReadingFillBlanksDropdownData;
    case 'pte_reading_fill_blanks_drag_drop':
      return {
        textSegments: [''],
        blankIds: ['b1'],
        options: [''],
      } as PteReadingFillBlanksDragDropData;
    case 'pte_reorder_paragraph':
      return {
        blocks: [{ id: '1', text: '' }],
      } as PteReorderParagraphData;
    case 'pte_listening_fill_blanks':
      return {
        transcript: '',
        blankIds: ['b1'],
      } as PteListeningFillBlanksData;
    case 'pte_highlight_correct_summary':
      return {
        prompt: '',
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
        ],
      } as PteMcqData;
    case 'pte_select_missing_word':
      return {
        prompt: '',
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
        ],
      } as PteMcqData;
    case 'pte_highlight_incorrect_words':
      return {
        transcript: '',
        tokens: [],
      } as PteHighlightIncorrectWordsData;
    case 'pte_write_from_dictation':
      return {
        prompt: '',
      } as PteWriteFromDictationData;
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
    case 'pte_mcq_single':
    case 'pte_highlight_correct_summary':
    case 'pte_select_missing_word':
      return '';
    case 'pte_mcq_multiple':
    case 'pte_highlight_incorrect_words':
      return [];
    case 'pte_reading_fill_blanks_dropdown':
    case 'pte_reading_fill_blanks_drag_drop':
    case 'pte_listening_fill_blanks':
      return {};
    case 'pte_reorder_paragraph':
      return [];
    case 'pte_write_from_dictation':
      return '';
    default:
      return '';
  }
}


function normalizeCorrectAnswer(type: QuestionType, answer: any): any {
  if (answer === null || answer === undefined) return getDefaultCorrectAnswer(type);

  // For types that expect primitives (string/number/boolean) or arrays of strings,
  // but might receive an object wrapper like { answer: '...' }
  const primitiveTypes: QuestionType[] = [
    'multiple_choice',
    'true_false_not_given',
    'yes_no_not_given',
    'completion',
    'pte_mcq_single',
    'pte_highlight_correct_summary',
    'pte_select_missing_word',
    'pte_write_from_dictation',
  ];

  if (primitiveTypes.includes(type)) {
    if (typeof answer === 'object' && !Array.isArray(answer) && 'answer' in answer) {
      return answer.answer;
    }
  }
  return answer;
}

function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function getPteDerivedMaxPoints(
  questionType: QuestionType,
  correctAnswer: any,
): number | null {
  switch (questionType) {
    case 'pte_mcq_multiple':
    case 'pte_highlight_incorrect_words': {
      if (!Array.isArray(correctAnswer)) return 1;
      return Math.max(1, correctAnswer.length);
    }
    case 'pte_reading_fill_blanks_dropdown':
    case 'pte_reading_fill_blanks_drag_drop':
    case 'pte_listening_fill_blanks': {
      if (!correctAnswer || typeof correctAnswer !== 'object' || Array.isArray(correctAnswer)) return 1;
      return Math.max(1, Object.keys(correctAnswer).length);
    }
    case 'pte_reorder_paragraph': {
      if (!Array.isArray(correctAnswer)) return 1;
      return Math.max(1, correctAnswer.length - 1);
    }
    case 'pte_write_from_dictation': {
      if (typeof correctAnswer !== 'string') return 1;
      return Math.max(1, countWords(correctAnswer));
    }
    default:
      return null;
  }
}

// ---------- Component ----------

export default function QuestionEditor({
  testType,
  sectionType,
  partNumber,
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
  const [audioUrl, setAudioUrl] = useState<string | null>(initialData?.audioUrl || null);
  const [questionData, setQuestionData] = useState<QuestionData>(
    initialData?.questionData || getDefaultQuestionData('multiple_choice')
  );
  const [correctAnswer, setCorrectAnswer] = useState<any>(
    normalizeCorrectAnswer(
      initialData?.questionType || 'multiple_choice',
      initialData?.correctAnswer
    )
  );
  const [points, setPoints] = useState(initialData?.points || 1);
  const [explanation, setExplanation] = useState(initialData?.explanation || '');
  const [groupLabel, setGroupLabel] = useState(initialData?.groupLabel || '');
  const [groupInstructions, setGroupInstructions] = useState(initialData?.groupInstructions || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derive filtered question types
  const allowedTypes = getAllowedTypes(testType, sectionType);
  const questionTypeOptions = useMemo(() => {
    if (!allowedTypes) return ALL_QUESTION_TYPES;
    const filtered = ALL_QUESTION_TYPES.filter((t) => allowedTypes.includes(t.value));
    // If editing an existing question whose type isn't in the filtered list, include it
    if (initialData?.questionType && !allowedTypes.includes(initialData.questionType)) {
      const existing = ALL_QUESTION_TYPES.find((t) => t.value === initialData.questionType);
      if (existing) filtered.push(existing);
    }
    return filtered;
  }, [allowedTypes, initialData?.questionType]);

  // Contextual guidance
  const guidance = getGuidance(testType, sectionType, partNumber);

  // Determine which UI sections to show
  const isIelts = testType === 'academic' || testType === 'general_training';
  const isToeflItp = testType === 'toefl_itp';

  // Audio uploader: show for TOEFL ITP Listening Part A (per-question audio), or when no test type context
  const showAudioUploader = !testType || (isToeflItp && sectionType === 'listening' && partNumber === 1);

  // Question grouping: show for IELTS (always relevant), or when no test type context
  const showGrouping = !testType || isIelts;
  const pteDerivedMaxPoints = useMemo(() => {
    if (testType !== 'pte_academic') return null;
    return getPteDerivedMaxPoints(questionType, correctAnswer);
  }, [testType, questionType, correctAnswer]);
  const shouldWarnPtePoints =
    pteDerivedMaxPoints !== null &&
    Number.isFinite(points) &&
    points < pteDerivedMaxPoints;

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
    if (!questionText.trim() && sectionType !== 'listening') {
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
        audioUrl,
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
      case 'pte_mcq_single':
      case 'pte_highlight_correct_summary':
      case 'pte_select_missing_word':
        return (
          <PteChoiceEditor
            data={questionData as PteMcqData}
            correctAnswer={correctAnswer}
            onChange={handleQuestionDataChange}
            multiSelect={false}
          />
        );
      case 'pte_mcq_multiple':
        return (
          <PteChoiceEditor
            data={questionData as PteMcqData}
            correctAnswer={correctAnswer}
            onChange={handleQuestionDataChange}
            multiSelect={true}
          />
        );
      case 'pte_reading_fill_blanks_dropdown':
      case 'pte_reading_fill_blanks_drag_drop':
      case 'pte_reorder_paragraph':
      case 'pte_listening_fill_blanks':
      case 'pte_highlight_incorrect_words':
      case 'pte_write_from_dictation':
        return (
          <PteStructuredEditor
            questionType={questionType}
            questionData={questionData}
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
      {/* Contextual guidance banner */}
      {guidance && (
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{guidance.icon}</span>
            <div>
              <h4 className="text-sm font-semibold text-indigo-900">{guidance.title}</h4>
              <p className="text-xs text-indigo-700 mt-0.5">{guidance.description}</p>
            </div>
          </div>
        </div>
      )}

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
      {shouldWarnPtePoints && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          PTE scoring warning: this item can award up to {pteDerivedMaxPoints} points based on its correct-answer shape,
          but configured Points is {points}. Section normalization will use the higher derived max.
        </div>
      )}

      {/* Audio Uploader — only for relevant contexts */}
      {showAudioUploader && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Question Audio {isToeflItp ? '(Required for Part A)' : '(Optional)'}</h4>
          <p className="text-xs text-gray-500">
            {isToeflItp && sectionType === 'listening' && partNumber === 1
              ? 'Upload the short conversation audio for this question.'
              : 'Upload a specific audio clip for this question (e.g., TOEFL Part A conversations).'}
          </p>
          <AudioUploader
            onUpload={(url) => setAudioUrl(url)}
            currentUrl={audioUrl}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Textarea
          label="Question Text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter the question text..."
          rows={3}
          error={errors.questionText}
          required={sectionType !== 'listening'}
        />
        {(isToeflItp && sectionType === 'structure') && (
          <p className="text-xs text-gray-500">
            Tip: Use &lt;u&gt;text&lt;/u&gt; to underline words for Written Expression (error identification) questions.
          </p>
        )}
      </div>

      {/* Question Grouping — only for IELTS or when test type is unknown */}
      {showGrouping && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
          <h4 className="text-sm font-semibold text-blue-800">Question Grouping (IELTS format)</h4>
          <p className="text-xs text-gray-600">Group related questions with shared instructions (e.g., &quot;Questions 1-7&quot; all share the same completion instructions)</p>
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
      )}

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">
          {ALL_QUESTION_TYPES.find((o) => o.value === questionType)?.label} Settings
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

