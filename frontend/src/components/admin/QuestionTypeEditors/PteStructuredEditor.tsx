'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface PteStructuredEditorProps {
  questionType: string;
  questionData: any;
  correctAnswer: any;
  onChange: (questionData: any, correctAnswer: any) => void;
}

function splitLines(value: string): string[] {
  return value.split('\n').map((v) => v.trim()).filter(Boolean);
}

function joinLines(values: string[]): string {
  return values.join('\n');
}

export default function PteStructuredEditor({
  questionType,
  questionData,
  correctAnswer,
  onChange,
}: PteStructuredEditorProps) {
  if (questionType === 'pte_reading_fill_blanks_dropdown') {
    const blanks = questionData?.blanks && typeof questionData.blanks === 'object' ? questionData.blanks : {};
    const answerMap = correctAnswer && typeof correctAnswer === 'object' ? correctAnswer : {};
    const blankIds = Object.keys(blanks);

    const updateBlank = (blankId: string, optionsRaw: string, answer: string) => {
      const options = splitLines(optionsRaw);
      const nextData = {
        ...questionData,
        context: questionData?.context || '',
        blanks: {
          ...blanks,
          [blankId]: { options },
        },
      };
      const nextAnswer = { ...answerMap, [blankId]: answer };
      onChange(nextData, nextAnswer);
    };

    const addBlank = () => {
      const nextId = `b${blankIds.length + 1}`;
      onChange(
        {
          ...questionData,
          context: questionData?.context || '',
          blanks: { ...blanks, [nextId]: { options: [''] } },
        },
        { ...answerMap, [nextId]: '' },
      );
    };

    return (
      <div className="space-y-4">
        <Textarea
          label="Context (use placeholders like {b1}, {b2})"
          value={questionData?.context || ''}
          onChange={(e) => onChange({ ...questionData, context: e.target.value, blanks }, answerMap)}
          rows={4}
        />
        {blankIds.map((blankId) => (
          <div key={blankId} className="rounded border border-gray-200 bg-gray-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700">Blank {blankId}</p>
            <Textarea
              label="Options (one per line)"
              value={joinLines(blanks[blankId]?.options || [])}
              onChange={(e) => updateBlank(blankId, e.target.value, answerMap[blankId] || '')}
              rows={3}
            />
            <Input
              label="Correct option"
              value={answerMap[blankId] || ''}
              onChange={(e) => updateBlank(blankId, joinLines(blanks[blankId]?.options || []), e.target.value)}
            />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addBlank}>
          + Add Blank
        </Button>
      </div>
    );
  }

  if (questionType === 'pte_reading_fill_blanks_drag_drop') {
    const blankIds: string[] = Array.isArray(questionData?.blankIds) ? questionData.blankIds : [];
    const answerMap = correctAnswer && typeof correctAnswer === 'object' ? correctAnswer : {};
    return (
      <div className="space-y-4">
        <Textarea
          label="Text Segments (one line per segment, rendered around blanks)"
          value={joinLines(Array.isArray(questionData?.textSegments) ? questionData.textSegments : [])}
          onChange={(e) =>
            onChange(
              { ...questionData, textSegments: splitLines(e.target.value), blankIds, options: questionData?.options || [] },
              answerMap,
            )
          }
          rows={4}
        />
        <Input
          label="Blank IDs (comma-separated)"
          value={blankIds.join(',')}
          onChange={(e) =>
            onChange(
              { ...questionData, blankIds: e.target.value.split(',').map((v) => v.trim()).filter(Boolean), textSegments: questionData?.textSegments || [], options: questionData?.options || [] },
              answerMap,
            )
          }
        />
        <Textarea
          label="Drag Options (one per line)"
          value={joinLines(Array.isArray(questionData?.options) ? questionData.options : [])}
          onChange={(e) =>
            onChange(
              { ...questionData, options: splitLines(e.target.value), blankIds, textSegments: questionData?.textSegments || [] },
              answerMap,
            )
          }
          rows={4}
        />
        {blankIds.map((id) => (
          <Input
            key={id}
            label={`Correct value for ${id}`}
            value={answerMap[id] || ''}
            onChange={(e) => onChange(questionData, { ...answerMap, [id]: e.target.value })}
          />
        ))}
      </div>
    );
  }

  if (questionType === 'pte_listening_fill_blanks') {
    const blankIds: string[] = Array.isArray(questionData?.blankIds) ? questionData.blankIds : [];
    const answerMap = correctAnswer && typeof correctAnswer === 'object' ? correctAnswer : {};
    return (
      <div className="space-y-4">
        <Textarea
          label="Transcript (with placeholders like {b1}, {b2})"
          value={questionData?.transcript || ''}
          onChange={(e) => onChange({ ...questionData, transcript: e.target.value, blankIds }, answerMap)}
          rows={5}
        />
        <Input
          label="Blank IDs (comma-separated)"
          value={blankIds.join(',')}
          onChange={(e) =>
            onChange(
              { ...questionData, transcript: questionData?.transcript || '', blankIds: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) },
              answerMap,
            )
          }
        />
        {blankIds.map((id) => (
          <Input
            key={id}
            label={`Correct word for ${id}`}
            value={answerMap[id] || ''}
            onChange={(e) => onChange(questionData, { ...answerMap, [id]: e.target.value })}
          />
        ))}
      </div>
    );
  }

  if (questionType === 'pte_reorder_paragraph') {
    const blocks = Array.isArray(questionData?.blocks) ? questionData.blocks : [];
    const answerOrder = Array.isArray(correctAnswer) ? correctAnswer : [];

    const updateBlock = (index: number, field: 'id' | 'text', value: string) => {
      const next = [...blocks];
      next[index] = { ...next[index], [field]: value };
      onChange({ ...questionData, blocks: next }, answerOrder);
    };

    return (
      <div className="space-y-4">
        {blocks.map((b: any, idx: number) => (
          <div key={idx} className="rounded border border-gray-200 bg-gray-50 p-3 space-y-2">
            <Input
              label="Block ID"
              value={b?.id || ''}
              onChange={(e) => updateBlock(idx, 'id', e.target.value)}
            />
            <Textarea
              label="Block Text"
              value={b?.text || ''}
              onChange={(e) => updateBlock(idx, 'text', e.target.value)}
              rows={3}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...questionData, blocks: [...blocks, { id: `${blocks.length + 1}`, text: '' }] }, answerOrder)}
        >
          + Add Block
        </Button>
        <Input
          label="Correct Order (comma-separated block IDs)"
          value={answerOrder.join(',')}
          onChange={(e) => onChange(questionData, e.target.value.split(',').map((v) => v.trim()).filter(Boolean))}
        />
      </div>
    );
  }

  if (questionType === 'pte_highlight_incorrect_words') {
    const tokens = Array.isArray(questionData?.tokens) ? questionData.tokens : [];
    const selected = Array.isArray(correctAnswer) ? correctAnswer : [];

    const generateTokens = () => {
      const words = String(questionData?.transcript || '').split(/\s+/).filter(Boolean);
      const nextTokens = words.map((w, i) => ({ id: `t${i + 1}`, text: w, index: i }));
      onChange({ ...questionData, tokens: nextTokens }, selected);
    };

    return (
      <div className="space-y-4">
        <Textarea
          label="Transcript"
          value={questionData?.transcript || ''}
          onChange={(e) => onChange({ ...questionData, transcript: e.target.value, tokens }, selected)}
          rows={5}
        />
        <Button type="button" variant="outline" size="sm" onClick={generateTokens}>
          Generate Tokens from Transcript
        </Button>
        <Input
          label="Incorrect Token IDs (comma-separated, e.g. t3,t9)"
          value={selected.join(',')}
          onChange={(e) => onChange(questionData, e.target.value.split(',').map((v) => v.trim()).filter(Boolean))}
        />
        <div className="text-xs text-gray-500">
          Tokens: {tokens.map((t: any) => `${t.id}:${t.text}`).join(' | ') || 'None generated'}
        </div>
      </div>
    );
  }

  if (questionType === 'pte_write_from_dictation') {
    return (
      <div className="space-y-4">
        <Input
          label="Prompt (optional)"
          value={questionData?.prompt || ''}
          onChange={(e) => onChange({ ...questionData, prompt: e.target.value }, correctAnswer)}
        />
        <Textarea
          label="Correct Dictation Sentence"
          value={typeof correctAnswer === 'string' ? correctAnswer : ''}
          onChange={(e) => onChange(questionData, e.target.value)}
          rows={3}
        />
      </div>
    );
  }

  return (
    <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      Structured editor is not available for this question type.
    </div>
  );
}

