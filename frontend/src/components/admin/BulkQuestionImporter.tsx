'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

interface ParsedQuestion {
  questionText: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  parseErrors?: string[];
}

interface BulkQuestionImporterProps {
  onSubmit: (questions: Omit<ParsedQuestion, 'parseErrors'>[]) => Promise<void>;
  onCancel: () => void;
  startingQuestionNumber: number;
}

function parseQuestions(input: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Split by --- delimiters
  const blocks = input.split(/^---$/m).filter((block) => block.trim());

  for (const block of blocks) {
    const q: ParsedQuestion = {
      questionText: '',
      options: [],
      correctAnswer: '',
      parseErrors: [],
    };

    // Extract each field
    const lines = block.split('\n');
    let currentField = '';
    let currentValue = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if this line starts a new field
      const fieldMatch = trimmed.match(/^(Q|A|B|C|D|ANSWER|EXPLANATION):\s*(.*)/i);

      if (fieldMatch) {
        // Save previous field
        if (currentField) {
          assignField(q, currentField, currentValue.trim());
        }
        currentField = fieldMatch[1].toUpperCase();
        currentValue = fieldMatch[2] || '';
      } else if (currentField && trimmed) {
        // Continue previous field (multi-line)
        currentValue += '\n' + trimmed;
      }
    }

    // Save last field
    if (currentField) {
      assignField(q, currentField, currentValue.trim());
    }

    // Validate
    if (!q.questionText) {
      q.parseErrors!.push('Missing question text (Q:)');
    }
    if (q.options.length !== 4) {
      q.parseErrors!.push(`Expected 4 options (A-D), found ${q.options.length}`);
    }
    if (!q.correctAnswer) {
      q.parseErrors!.push('Missing correct answer (ANSWER:)');
    } else if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
      q.parseErrors!.push(`Invalid answer "${q.correctAnswer}", must be A/B/C/D`);
    }

    questions.push(q);
  }

  return questions;
}

function assignField(q: ParsedQuestion, field: string, value: string) {
  switch (field) {
    case 'Q':
      q.questionText = value;
      break;
    case 'A':
    case 'B':
    case 'C':
    case 'D':
      q.options.push({ key: field, text: value });
      break;
    case 'ANSWER':
      q.correctAnswer = value.toUpperCase();
      break;
    case 'EXPLANATION':
      q.explanation = value;
      break;
  }
}

export default function BulkQuestionImporter({
  onSubmit,
  onCancel,
  startingQuestionNumber,
}: BulkQuestionImporterProps) {
  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse input on-the-fly for preview
  const parsedQuestions = useMemo(() => {
    return parseQuestions(rawInput);
  }, [rawInput]);

  const validQuestions = parsedQuestions.filter((q) => !q.parseErrors?.length);
  const invalidQuestions = parsedQuestions.filter((q) => q.parseErrors?.length);

  const handleSubmit = async () => {
    if (validQuestions.length === 0) {
      setError('No valid questions to import');
      return;
    }

    if (invalidQuestions.length > 0) {
      setError(
        `${invalidQuestions.length} question(s) have errors. Fix them before submitting.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Remove parseErrors before submitting
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const questionsToSubmit = validQuestions.map(({ parseErrors, ...rest }) => rest);
      await onSubmit(questionsToSubmit);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to import questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Format guide */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Format Guide</h4>
        <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono">
{`---
Q: Question text here
A: Option A text
B: Option B text
C: Option C text
D: Option D text
ANSWER: A
EXPLANATION: Optional explanation
---`}
        </pre>
        <p className="text-xs text-blue-700 mt-2">
          Use <code className="bg-blue-100 px-1 rounded">&lt;u&gt;text&lt;/u&gt;</code> to
          underline words for Written Expression questions.
        </p>
      </div>

      {/* Input textarea */}
      <Textarea
        label={`Paste Questions (starting from Q${startingQuestionNumber})`}
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        rows={12}
        placeholder="Paste your questions here using the format above..."
        className="font-mono text-sm"
      />

      {/* Preview section */}
      {parsedQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              Preview ({validQuestions.length} valid, {invalidQuestions.length} with errors)
            </h4>
            <div className="flex gap-2">
              <Badge variant={validQuestions.length > 0 ? 'success' : 'default'}>
                {validQuestions.length} Valid
              </Badge>
              {invalidQuestions.length > 0 && (
                <Badge variant="error">{invalidQuestions.length} Errors</Badge>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
            {parsedQuestions.map((q, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  q.parseErrors?.length
                    ? 'border-red-300 bg-red-50'
                    : 'border-green-300 bg-green-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      q.parseErrors?.length
                        ? 'bg-red-200 text-red-800'
                        : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {startingQuestionNumber + idx}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {q.questionText || '(no text)'}
                    </p>
                    {q.parseErrors?.length ? (
                      <ul className="text-xs text-red-600 mt-1">
                        {q.parseErrors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-green-600 mt-1">
                        Answer: {q.correctAnswer} | Options:{' '}
                        {q.options.map((o) => o.key).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={validQuestions.length === 0 || invalidQuestions.length > 0}
        >
          Import {validQuestions.length} Question{validQuestions.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}
