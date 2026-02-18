'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

interface ToeflIbtBulkItemImporterProps {
  taskType?: string | null;
  startingQuestionNumber: number;
  onSubmit: (questions: Array<{
    questionType: 'multiple_choice' | 'completion';
    questionText: string;
    questionData: any;
    correctAnswer: any;
    points: number;
    itemPayload: any;
    questionNumber?: number;
  }>) => Promise<void>;
  onCancel: () => void;
}

interface ParsedItem {
  questionType: 'multiple_choice' | 'completion';
  questionText: string;
  questionData: any;
  correctAnswer: any;
  points: number;
  itemPayload: any;
  questionNumber?: number;
  parseErrors?: string[];
}

const MCQ_TASKS = new Set([
  'read_daily_life',
  'read_academic_passage',
  'listen_choose_response',
  'listen_conversation',
  'listen_announcement',
  'listen_academic_talk',
]);

function parseLine(line: string) {
  const match = line.trim().match(/^([A-Z_0-9]+):\s*(.*)$/i);
  if (!match) return null;
  return { field: match[1].toUpperCase(), value: match[2] || '' };
}

function parseBlocks(rawInput: string, taskType?: string | null): ParsedItem[] {
  const tt = String(taskType || 'read_daily_life').toLowerCase();
  const blocks = rawInput.split(/^---$/m).filter((b) => b.trim());

  return blocks.map((block) => {
    const item: ParsedItem = {
      questionType: tt === 'complete_words' || tt === 'build_sentence' ? 'completion' : 'multiple_choice',
      questionText: '',
      questionData: {},
      correctAnswer: tt === 'complete_words' ? {} : tt === 'build_sentence' ? [] : '',
      points: tt === 'write_email' || tt === 'academic_discussion' || tt === 'listen_repeat' || tt === 'take_interview' ? 5 : 1,
      itemPayload: {},
      parseErrors: [],
    };

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const options: Array<{ key: string; text: string }> = [];
    const blanks: Array<{ id: string; correct: string; alternatives: string[] }> = [];
    const patterns: string[] = [];
    const instructions: string[] = [];
    const peerPosts: Array<{ author: string; text: string }> = [];
    const segments: Array<{ id: string; audioUrl: string; maxResponseSeconds: number }> = [];
    const interviewQuestions: Array<{ id: string; mediaUrl: string; responseSeconds: number }> = [];

    let stem = '';
    let template = '';
    let correct = '';
    let context = '';
    let wordBank = '';
    let targetSlots = 4;
    let to = '';
    let subject = '';
    let minWords = 100;
    let professorPost = '';
    let scenarioImageUrl = '';
    let interviewerType = 'video';
    let interviewerUrl = '';

    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      const { field, value } = parsed;

      if (field.startsWith('Q')) {
        const num = Number(field.slice(1));
        if (Number.isFinite(num) && num > 0) item.questionNumber = num;
        item.questionText = value;
        continue;
      }

      if (field === 'STEM') stem = value;
      else if (field === 'TEMPLATE') template = value;
      else if (['A', 'B', 'C', 'D'].includes(field)) options.push({ key: field, text: value });
      else if (field === 'ANSWER') correct = value.toUpperCase();
      else if (field === 'BLANK') {
        const [idPart, rhs = ''] = value.split('=');
        const id = idPart.trim();
        const accepted = rhs.split('|').map((v) => v.trim()).filter(Boolean);
        const first = accepted[0] || '';
        blanks.push({ id, correct: first, alternatives: accepted });
      } else if (field === 'CONTEXT') context = value;
      else if (field === 'WORDBANK') wordBank = value;
      else if (field === 'TARGET_SLOTS') targetSlots = Number(value) || 4;
      else if (field === 'PATTERN') patterns.push(value);
      else if (field === 'TO') to = value;
      else if (field === 'SUBJECT') subject = value;
      else if (field === 'INSTRUCTION') instructions.push(value);
      else if (field === 'MIN_WORDS') minWords = Number(value) || 100;
      else if (field === 'PROFESSOR_POST') professorPost = value;
      else if (field === 'PEER') {
        const [author, text] = value.split('|');
        if (author && text) peerPosts.push({ author: author.trim(), text: text.trim() });
      } else if (field === 'SCENARIO_IMAGE') scenarioImageUrl = value;
      else if (field === 'SEGMENT') {
        const [id, audio, sec] = value.split('|');
        if (id && audio) segments.push({ id: id.trim(), audioUrl: audio.trim(), maxResponseSeconds: Number(sec) || 8 });
      } else if (field === 'INTERVIEWER_MEDIA') {
        const [type, url] = value.split('|');
        interviewerType = (type || 'video').trim();
        interviewerUrl = (url || '').trim();
      } else if (field === 'INTERVIEW_Q') {
        const [id, media, sec] = value.split('|');
        if (id && media) interviewQuestions.push({ id: id.trim(), mediaUrl: media.trim(), responseSeconds: Number(sec) || 45 });
      } else if (field === 'POINTS') {
        const pts = Number(value);
        if (Number.isFinite(pts) && pts > 0) item.points = pts;
      }
    }

    if (tt === 'complete_words') {
      if (!template) item.parseErrors!.push('Missing TEMPLATE');
      if (blanks.length === 0) item.parseErrors!.push('At least one BLANK is required');
      item.questionType = 'completion';
      item.questionText = item.questionText || 'Complete the words';
      item.points = blanks.length || 1;
      item.questionData = { context: template, maxWords: 3, caseSensitive: false, blankPosition: 'inline', style: 'standard' };
      item.correctAnswer = Object.fromEntries(blanks.map((b) => [b.id, b.correct]));
      item.itemPayload = { taskType: 'complete_words', prompt: { textTemplate: template, blanks }, scoring: { type: 'objective', pointsPerBlank: 1 } };
      return item;
    }

    if (MCQ_TASKS.has(tt)) {
      if (!stem && !item.questionText) item.parseErrors!.push('Missing STEM or Q text');
      if (options.length !== 4) item.parseErrors!.push('Exactly 4 options (A-D) are required');
      if (!['A', 'B', 'C', 'D'].includes(correct)) item.parseErrors!.push('ANSWER must be A/B/C/D');
      item.questionType = 'multiple_choice';
      item.questionText = item.questionText || stem;
      item.questionData = { options, multiSelect: false };
      item.correctAnswer = correct;
      item.itemPayload = { taskType: tt, prompt: { stem: stem || item.questionText, options, correct }, scoring: { type: 'objective', points: 1 } };
      return item;
    }

    if (tt === 'build_sentence') {
      const words = wordBank.split(',').map((v) => v.trim()).filter(Boolean);
      if (!context) item.parseErrors!.push('Missing CONTEXT');
      if (words.length === 0) item.parseErrors!.push('Missing WORDBANK');
      if (patterns.length === 0) item.parseErrors!.push('At least one PATTERN is required');
      item.questionType = 'completion';
      item.questionText = item.questionText || context;
      item.questionData = { context, maxWords: 30, caseSensitive: false, blankPosition: 'inline' };
      item.correctAnswer = patterns;
      item.itemPayload = { taskType: 'build_sentence', prompt: { context, wordBank: words, targetSlots, acceptedPatterns: patterns }, scoring: { type: 'objective', points: 1 } };
      return item;
    }

    if (tt === 'write_email') {
      if (!to) item.parseErrors!.push('Missing TO');
      if (!subject) item.parseErrors!.push('Missing SUBJECT');
      if (instructions.length === 0) item.parseErrors!.push('At least one INSTRUCTION is required');
      item.questionType = 'multiple_choice';
      item.questionText = item.questionText || `Write an email: ${subject || 'Email task'}`;
      item.questionData = { options: [], multiSelect: false };
      item.correctAnswer = '';
      item.itemPayload = { taskType: 'write_email', prompt: { to, subject, instructions, minWords }, scoring: { type: 'rubric', rawMax: 5, dimensions: ['task_fulfillment', 'organization', 'language_use'] } };
      return item;
    }

    if (tt === 'academic_discussion') {
      if (!professorPost) item.parseErrors!.push('Missing PROFESSOR_POST');
      if (peerPosts.length === 0) item.parseErrors!.push('At least one PEER is required');
      item.questionType = 'multiple_choice';
      item.questionText = item.questionText || 'Academic discussion response';
      item.questionData = { options: [], multiSelect: false };
      item.correctAnswer = '';
      item.itemPayload = { taskType: 'academic_discussion', prompt: { professorPost, peerPosts, minWords }, scoring: { type: 'rubric', rawMax: 5, dimensions: ['position', 'development', 'language_use'] } };
      return item;
    }

    if (tt === 'listen_repeat') {
      if (segments.length === 0) item.parseErrors!.push('At least one SEGMENT is required');
      item.questionType = 'multiple_choice';
      item.questionText = item.questionText || 'Listen and repeat';
      item.questionData = { options: [], multiSelect: false };
      item.correctAnswer = '';
      item.itemPayload = { taskType: 'listen_repeat', prompt: { scenarioImageUrl: scenarioImageUrl || undefined, segments, playbackPolicy: 'once' }, scoring: { type: 'rubric', rawMax: 5, dimensions: ['accuracy', 'intelligibility', 'prosody'] } };
      return item;
    }

    if (tt === 'take_interview') {
      if (!interviewerUrl) item.parseErrors!.push('Missing INTERVIEWER_MEDIA');
      if (interviewQuestions.length === 0) item.parseErrors!.push('At least one INTERVIEW_Q is required');
      item.questionType = 'multiple_choice';
      item.questionText = item.questionText || 'Interview response';
      item.questionData = { options: [], multiSelect: false };
      item.correctAnswer = '';
      item.itemPayload = { taskType: 'take_interview', prompt: { interviewerMedia: { type: interviewerType, url: interviewerUrl }, questions: interviewQuestions }, scoring: { type: 'rubric', rawMax: 5, dimensions: ['coherence', 'fluency', 'vocabulary', 'grammar', 'pronunciation'] } };
      return item;
    }

    item.parseErrors!.push(`Unsupported task type "${tt}"`);
    return item;
  });
}

const TEMPLATES: Record<string, string> = {
  complete_words: `---
Q21: Optional title text
TEMPLATE: We ____ from drawings and ____ ancient tools.
BLANK: b1=know|know
BLANK: b2=about|about
---`,
  mcq: `---
Q21: Optional question text
STEM: What does the speaker imply?
A: Option A
B: Option B
C: Option C
D: Option D
ANSWER: A
---`,
  build_sentence: `---
Q21: Build a sentence item
CONTEXT: What was the highlight of your trip?
WORDBANK: were, the, old, city, tour, guides
TARGET_SLOTS: 4
PATTERN: The tour guides were fantastic.
---`,
  write_email: `---
Q21: Email task
TO: editor@example.com
SUBJECT: Problem using submission form
INSTRUCTION: Tell the editor what you like about the magazine.
INSTRUCTION: Describe the problem you experienced.
INSTRUCTION: Ask about your submission status.
MIN_WORDS: 100
---`,
  academic_discussion: `---
Q21: Academic discussion task
PROFESSOR_POST: Should high school students volunteer?
PEER: Claire|I think students should volunteer.
PEER: Andrew|I disagree for students with jobs.
MIN_WORDS: 100
---`,
  listen_repeat: `---
Q21: Listen and repeat task
SCENARIO_IMAGE: https://example.com/scenario.jpg
SEGMENT: s1|https://example.com/s1.mp3|8
SEGMENT: s2|https://example.com/s2.mp3|10
---`,
  take_interview: `---
Q21: Interview task
INTERVIEWER_MEDIA: video|https://example.com/interviewer.mp4
INTERVIEW_Q: q1|https://example.com/q1.mp4|45
INTERVIEW_Q: q2|https://example.com/q2.mp4|45
---`,
};

export default function ToeflIbtBulkItemImporter({
  taskType,
  startingQuestionNumber,
  onSubmit,
  onCancel,
}: ToeflIbtBulkItemImporterProps) {
  const tt = String(taskType || 'read_daily_life').toLowerCase();
  const templateKey = tt === 'complete_words' ? 'complete_words' : MCQ_TASKS.has(tt) ? 'mcq' : tt;
  const template = TEMPLATES[templateKey] || TEMPLATES.mcq;

  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedItems = useMemo(() => parseBlocks(rawInput, tt), [rawInput, tt]);
  const validItems = parsedItems.filter((q) => !q.parseErrors?.length);
  const invalidItems = parsedItems.filter((q) => q.parseErrors?.length);

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `toefl-ibt-${templateKey}-template.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (validItems.length === 0 || invalidItems.length > 0) {
      setError('Please fix invalid items before importing.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sanitized = validItems.map(({ parseErrors, ...rest }) => rest);
      await onSubmit(sanitized);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to import items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h4 className="text-sm font-semibold text-cyan-900">Format Guide ({tt.replace(/_/g, ' ')})</h4>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button type="button" variant="outline" className="!py-1 !px-2 !text-xs" onClick={() => setRawInput(template)}>Load Sample</Button>
            <Button type="button" variant="outline" className="!py-1 !px-2 !text-xs" onClick={downloadTemplate}>Download Template</Button>
          </div>
        </div>
        <pre className="whitespace-pre-wrap font-mono text-xs text-cyan-800">{template}</pre>
      </div>

      <Textarea
        label={`Paste TOEFL iBT items (starting from Q${startingQuestionNumber})`}
        rows={12}
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        className="font-mono text-sm"
      />

      {parsedItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Preview ({validItems.length} valid, {invalidItems.length} errors)</h4>
            <div className="flex gap-2">
              <Badge variant={validItems.length > 0 ? 'success' : 'default'}>{validItems.length} Valid</Badge>
              {invalidItems.length > 0 && <Badge variant="error">{invalidItems.length} Errors</Badge>}
            </div>
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
            {parsedItems.map((item, idx) => (
              <div key={idx} className={`rounded border p-3 ${item.parseErrors?.length ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <p className="text-sm text-gray-700">{item.questionText || <span className="italic text-gray-400">(no text)</span>}</p>
                {item.parseErrors?.length ? (
                  <ul className="mt-1 text-xs text-red-600">
                    {item.parseErrors.map((e, i) => <li key={i}>* {e}</li>)}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-green-600">Q{item.questionNumber || startingQuestionNumber + idx} ready</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button onClick={handleSubmit} loading={loading} disabled={validItems.length === 0 || invalidItems.length > 0}>
          Import {validItems.length} Item{validItems.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}
