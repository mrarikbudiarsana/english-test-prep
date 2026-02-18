'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface ToeflIbtQuestionPayload {
  questionType: 'multiple_choice' | 'completion';
  questionText: string;
  questionData: any;
  correctAnswer: any;
  points: number;
  itemPayload: any;
}

interface ToeflIbtItemEditorProps {
  taskType?: string | null;
  nextQuestionNumber: number;
  initialData?: any;
  onSubmit: (payload: ToeflIbtQuestionPayload) => void | Promise<void>;
  onCancel: () => void;
}

const MCQ_OPTIONS = ['A', 'B', 'C', 'D'];

export default function ToeflIbtItemEditor({
  taskType,
  nextQuestionNumber,
  initialData,
  onSubmit,
  onCancel,
}: ToeflIbtItemEditorProps) {
  const tt = String(taskType || 'read_daily_life').toLowerCase();
  const isEdit = Boolean(initialData?.id);
  const [loading, setLoading] = useState(false);

  const [stem, setStem] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correct, setCorrect] = useState('A');
  const [audioUrl, setAudioUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  const [tmpl, setTmpl] = useState('');
  const [blanksJson, setBlanksJson] = useState('[\n  { "id": "b1", "correct": "", "alternatives": [] }\n]');

  const [genericJson, setGenericJson] = useState('{\n  "prompt": {},\n  "scoring": {}\n}');
  const [promptText, setPromptText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const [minWords, setMinWords] = useState('100');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [peerPostsJson, setPeerPostsJson] = useState('[\n  { "author": "Peer 1", "text": "" },\n  { "author": "Peer 2", "text": "" }\n]');
  const [wordBankText, setWordBankText] = useState('');
  const [acceptedPatternsText, setAcceptedPatternsText] = useState('');
  const [targetSlots, setTargetSlots] = useState('4');
  const [segmentsJson, setSegmentsJson] = useState('[\n  { "id": "s1", "audioUrl": "", "maxResponseSeconds": 8 }\n]');
  const [interviewerType, setInterviewerType] = useState('video');
  const [interviewerUrl, setInterviewerUrl] = useState('');
  const [interviewQuestionsJson, setInterviewQuestionsJson] = useState('[\n  { "id": "q1", "mediaUrl": "", "responseSeconds": 45 }\n]');

  useEffect(() => {
    const payload = initialData?.itemPayload || {};
    const prompt = payload?.prompt || {};
    if (tt === 'complete_words') {
      setTmpl(prompt.textTemplate || initialData?.questionData?.context || '');
      if (Array.isArray(prompt.blanks)) setBlanksJson(JSON.stringify(prompt.blanks, null, 2));
      return;
    }
    if (['read_daily_life', 'read_academic_passage', 'listen_choose_response', 'listen_conversation', 'listen_announcement', 'listen_academic_talk'].includes(tt)) {
      setStem(prompt.stem || initialData?.questionText || '');
      const options = Array.isArray(prompt.options) ? prompt.options : initialData?.questionData?.options || [];
      const map = new Map<string, string>();
      options.forEach((o: any) => map.set(String(o?.key || '').toUpperCase(), String(o?.text || '')));
      setOptA(map.get('A') || '');
      setOptB(map.get('B') || '');
      setOptC(map.get('C') || '');
      setOptD(map.get('D') || '');
      setCorrect(prompt.correct || initialData?.correctAnswer || 'A');
      setAudioUrl(prompt?.audio?.url || initialData?.audioUrl || '');
      setMediaUrl(prompt?.media?.[0]?.url || '');
      return;
    }
    if (tt === 'build_sentence') {
      setPromptText(prompt?.context || '');
      setWordBankText(Array.isArray(prompt?.wordBank) ? prompt.wordBank.join(', ') : '');
      setAcceptedPatternsText(Array.isArray(prompt?.acceptedPatterns) ? prompt.acceptedPatterns.join('\n') : '');
      setTargetSlots(String(prompt?.targetSlots || '4'));
      return;
    }
    if (tt === 'write_email') {
      setEmailTo(prompt?.to || '');
      setEmailSubject(prompt?.subject || '');
      setInstructionsText(Array.isArray(prompt?.instructions) ? prompt.instructions.join('\n') : '');
      setMinWords(String(prompt?.minWords || '100'));
      return;
    }
    if (tt === 'academic_discussion') {
      setPromptText(prompt?.professorPost || '');
      setPeerPostsJson(JSON.stringify(prompt?.peerPosts || [], null, 2));
      setMinWords(String(prompt?.minWords || '100'));
      return;
    }
    if (tt === 'listen_repeat') {
      setMediaUrl(prompt?.scenarioImageUrl || '');
      setSegmentsJson(JSON.stringify(prompt?.segments || [], null, 2));
      return;
    }
    if (tt === 'take_interview') {
      setInterviewerType(prompt?.interviewerMedia?.type || 'video');
      setInterviewerUrl(prompt?.interviewerMedia?.url || '');
      setInterviewQuestionsJson(JSON.stringify(prompt?.questions || [], null, 2));
      return;
    }
    setGenericJson(JSON.stringify(payload && Object.keys(payload).length ? payload : { taskType: tt, prompt: {}, scoring: {} }, null, 2));
  }, [initialData, tt]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tt === 'complete_words') {
        let blanks: any[] = [];
        try {
          blanks = JSON.parse(blanksJson);
        } catch {
          alert('Invalid blanks JSON');
          return;
        }
        await onSubmit({
          questionType: 'completion',
          questionText: initialData?.questionText || `Complete the words. (Question ${nextQuestionNumber})`,
          questionData: { context: tmpl, maxWords: 3, caseSensitive: false, blankPosition: 'inline', style: 'standard' },
          correctAnswer: Object.fromEntries((blanks || []).map((b) => [b.id, b.correct])),
          points: Math.max(1, blanks.length || 1),
          itemPayload: { taskType: 'complete_words', prompt: { textTemplate: tmpl, blanks }, scoring: { type: 'objective', pointsPerBlank: 1 } },
        });
        return;
      }

      if (['read_daily_life', 'read_academic_passage', 'listen_choose_response', 'listen_conversation', 'listen_announcement', 'listen_academic_talk'].includes(tt)) {
        const options = [
          { key: 'A', text: optA.trim() },
          { key: 'B', text: optB.trim() },
          { key: 'C', text: optC.trim() },
          { key: 'D', text: optD.trim() },
        ];
        if (!stem.trim() || options.some((o) => !o.text)) {
          alert('Stem and all options are required.');
          return;
        }
        const payload: any = {
          taskType: tt,
          prompt: { stem: stem.trim(), options, correct },
          scoring: { type: 'objective', points: 1 },
        };
        if (audioUrl.trim()) payload.prompt.audio = { url: audioUrl.trim() };
        if (mediaUrl.trim()) payload.prompt.media = [{ type: 'image', url: mediaUrl.trim() }];
        await onSubmit({
          questionType: 'multiple_choice',
          questionText: stem.trim(),
          questionData: { options, multiSelect: false },
          correctAnswer: correct,
          points: 1,
          itemPayload: payload,
        });
        return;
      }

      if (tt === 'build_sentence') {
        const wordBank = wordBankText.split(',').map((s) => s.trim()).filter(Boolean);
        const acceptedPatterns = acceptedPatternsText.split('\n').map((s) => s.trim()).filter(Boolean);
        if (!promptText.trim() || wordBank.length === 0 || acceptedPatterns.length === 0) {
          alert('Context, word bank, and accepted patterns are required.');
          return;
        }
        await onSubmit({
          questionType: 'completion',
          questionText: promptText.trim(),
          questionData: { context: promptText.trim(), maxWords: 30, caseSensitive: false, blankPosition: 'inline' },
          correctAnswer: acceptedPatterns,
          points: 1,
          itemPayload: {
            taskType: 'build_sentence',
            prompt: { context: promptText.trim(), wordBank, targetSlots: Number(targetSlots) || 4, acceptedPatterns },
            scoring: { type: 'objective', points: 1 },
          },
        });
        return;
      }

      if (tt === 'write_email') {
        const instructions = instructionsText.split('\n').map((s) => s.trim()).filter(Boolean);
        if (!emailTo.trim() || !emailSubject.trim() || instructions.length === 0) {
          alert('To, subject and instructions are required.');
          return;
        }
        await onSubmit({
          questionType: 'multiple_choice',
          questionText: `Write an email: ${emailSubject.trim()}`,
          questionData: { options: [], multiSelect: false },
          correctAnswer: '',
          points: 5,
          itemPayload: {
            taskType: 'write_email',
            prompt: { to: emailTo.trim(), subject: emailSubject.trim(), instructions, minWords: Number(minWords) || 100 },
            scoring: { type: 'rubric', rawMax: 5, dimensions: ['task_fulfillment', 'organization', 'language_use'] },
          },
        });
        return;
      }

      if (tt === 'academic_discussion') {
        let peerPosts: any[] = [];
        try {
          peerPosts = JSON.parse(peerPostsJson);
        } catch {
          alert('Invalid Peer Posts JSON');
          return;
        }
        if (!promptText.trim() || !Array.isArray(peerPosts) || peerPosts.length === 0) {
          alert('Professor post and peer posts are required.');
          return;
        }
        await onSubmit({
          questionType: 'multiple_choice',
          questionText: 'Academic discussion response',
          questionData: { options: [], multiSelect: false },
          correctAnswer: '',
          points: 5,
          itemPayload: {
            taskType: 'academic_discussion',
            prompt: { professorPost: promptText.trim(), peerPosts, minWords: Number(minWords) || 100 },
            scoring: { type: 'rubric', rawMax: 5, dimensions: ['position', 'development', 'language_use'] },
          },
        });
        return;
      }

      if (tt === 'listen_repeat') {
        let segments: any[] = [];
        try {
          segments = JSON.parse(segmentsJson);
        } catch {
          alert('Invalid Segments JSON');
          return;
        }
        if (!Array.isArray(segments) || segments.length === 0) {
          alert('At least one segment is required.');
          return;
        }
        await onSubmit({
          questionType: 'multiple_choice',
          questionText: 'Listen and repeat',
          questionData: { options: [], multiSelect: false },
          correctAnswer: '',
          points: 5,
          itemPayload: {
            taskType: 'listen_repeat',
            prompt: { scenarioImageUrl: mediaUrl.trim() || undefined, segments, playbackPolicy: 'once' },
            scoring: { type: 'rubric', rawMax: 5, dimensions: ['accuracy', 'intelligibility', 'prosody'] },
          },
        });
        return;
      }

      if (tt === 'take_interview') {
        let questions: any[] = [];
        try {
          questions = JSON.parse(interviewQuestionsJson);
        } catch {
          alert('Invalid Interview Questions JSON');
          return;
        }
        if (!interviewerUrl.trim() || !Array.isArray(questions) || questions.length === 0) {
          alert('Interviewer media and questions are required.');
          return;
        }
        await onSubmit({
          questionType: 'multiple_choice',
          questionText: 'Interview response',
          questionData: { options: [], multiSelect: false },
          correctAnswer: '',
          points: 5,
          itemPayload: {
            taskType: 'take_interview',
            prompt: { interviewerMedia: { type: interviewerType, url: interviewerUrl.trim() }, questions },
            scoring: { type: 'rubric', rawMax: 5, dimensions: ['coherence', 'fluency', 'vocabulary', 'grammar', 'pronunciation'] },
          },
        });
        return;
      }

      let payload: any = null;
      try {
        payload = JSON.parse(genericJson);
      } catch {
        alert('Invalid task payload JSON');
        return;
      }
      payload.taskType = tt;
      await onSubmit({
        questionType: tt === 'build_sentence' ? 'completion' : 'multiple_choice',
        questionText: initialData?.questionText || `${tt.replace(/_/g, ' ')} item`,
        questionData: tt === 'build_sentence' ? { context: payload?.prompt?.context || '', maxWords: 30, caseSensitive: false, blankPosition: 'inline' } : { options: [], multiSelect: false },
        correctAnswer: tt === 'build_sentence' ? (payload?.prompt?.acceptedPatterns || []) : '',
        points: Number(payload?.scoring?.rawMax || payload?.scoring?.points || 1),
        itemPayload: payload,
      });
    } finally {
      setLoading(false);
    }
  };

  const isMCQ = ['read_daily_life', 'read_academic_passage', 'listen_choose_response', 'listen_conversation', 'listen_announcement', 'listen_academic_talk'].includes(tt);

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800">
        {tt.replace(/_/g, ' ')}
      </div>

      {tt === 'complete_words' && (
        <>
          <Textarea label="Text Template" value={tmpl} onChange={(e) => setTmpl(e.target.value)} rows={4} required />
          <Textarea label="Blanks JSON" value={blanksJson} onChange={(e) => setBlanksJson(e.target.value)} rows={8} className="font-mono text-xs" required />
        </>
      )}

      {isMCQ && (
        <>
          <Textarea label="Question Stem" value={stem} onChange={(e) => setStem(e.target.value)} rows={3} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Option A" value={optA} onChange={(e) => setOptA(e.target.value)} required />
            <Input label="Option B" value={optB} onChange={(e) => setOptB(e.target.value)} required />
            <Input label="Option C" value={optC} onChange={(e) => setOptC(e.target.value)} required />
            <Input label="Option D" value={optD} onChange={(e) => setOptD(e.target.value)} required />
          </div>
          <Select label="Correct Answer" value={correct} onChange={(e) => setCorrect(e.target.value)} options={MCQ_OPTIONS.map((v) => ({ value: v, label: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Audio URL (optional)" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} />
            <Input label="Image URL (optional)" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
          </div>
        </>
      )}

      {tt === 'build_sentence' && (
        <>
          <Textarea label="Context" value={promptText} onChange={(e) => setPromptText(e.target.value)} rows={3} required />
          <Input label="Word Bank (comma-separated)" value={wordBankText} onChange={(e) => setWordBankText(e.target.value)} required />
          <Input label="Target Slots" type="number" min={1} value={targetSlots} onChange={(e) => setTargetSlots(e.target.value)} required />
          <Textarea label="Accepted Patterns (one per line)" value={acceptedPatternsText} onChange={(e) => setAcceptedPatternsText(e.target.value)} rows={4} required />
        </>
      )}

      {tt === 'write_email' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input label="To" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} required />
            <Input label="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} required />
          </div>
          <Textarea label="Instructions (one per line)" value={instructionsText} onChange={(e) => setInstructionsText(e.target.value)} rows={4} required />
          <Input label="Minimum Words" type="number" min={1} value={minWords} onChange={(e) => setMinWords(e.target.value)} required />
        </>
      )}

      {tt === 'academic_discussion' && (
        <>
          <Textarea label="Professor Post" value={promptText} onChange={(e) => setPromptText(e.target.value)} rows={4} required />
          <Textarea label="Peer Posts JSON" value={peerPostsJson} onChange={(e) => setPeerPostsJson(e.target.value)} rows={8} className="font-mono text-xs" required />
          <Input label="Minimum Words" type="number" min={1} value={minWords} onChange={(e) => setMinWords(e.target.value)} required />
        </>
      )}

      {tt === 'listen_repeat' && (
        <>
          <Input label="Scenario Image URL (optional)" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
          <Textarea label="Segments JSON" value={segmentsJson} onChange={(e) => setSegmentsJson(e.target.value)} rows={8} className="font-mono text-xs" required />
        </>
      )}

      {tt === 'take_interview' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Interviewer Media Type"
              value={interviewerType}
              onChange={(e) => setInterviewerType(e.target.value)}
              options={[
                { value: 'video', label: 'Video' },
                { value: 'audio', label: 'Audio' },
                { value: 'image', label: 'Image' },
              ]}
            />
            <Input label="Interviewer Media URL" value={interviewerUrl} onChange={(e) => setInterviewerUrl(e.target.value)} required />
          </div>
          <Textarea
            label="Interview Questions JSON"
            value={interviewQuestionsJson}
            onChange={(e) => setInterviewQuestionsJson(e.target.value)}
            rows={8}
            className="font-mono text-xs"
            required
          />
        </>
      )}

      {!isMCQ &&
        !['complete_words', 'build_sentence', 'write_email', 'academic_discussion', 'listen_repeat', 'take_interview'].includes(tt) && (
        <Textarea
          label="Task Payload JSON"
          value={genericJson}
          onChange={(e) => setGenericJson(e.target.value)}
          rows={14}
          className="font-mono text-xs"
          required
        />
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Save Item'}</Button>
      </div>
    </form>
  );
}
