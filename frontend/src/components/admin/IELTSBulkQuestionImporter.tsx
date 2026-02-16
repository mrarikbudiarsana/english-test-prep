'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import type { QuestionType, SectionType } from '@/types/test';

// Question type configurations for IELTS
type IELTSQuestionType = 'mcq' | 'tfng' | 'ynng' | 'completion' | 'summary' | 'matching' | 'dropdown';

interface ParsedIELTSQuestion {
  questionType: IELTSQuestionType;
  questionText: string;
  // MCQ
  options?: { key: string; text: string }[];
  // TFNG/YNNG
  statement?: string;
  // Completion
  context?: string;
  maxWords?: number;
  // Matching
  items?: { key: string; text: string }[];
  matchOptions?: { key: string; text: string }[];
  // Dropdown
  dropdowns?: Record<string, { options: string[] }>;
  // Common
  correctAnswer: any;
  explanation?: string;
  questionNumber?: number;
  groupLabel?: string;
  groupInstructions?: string;
  parseErrors?: string[];
}

interface IELTSBulkQuestionImporterProps {
  sectionType: SectionType;
  onSubmit: (questions: Array<{
    questionType: QuestionType;
    questionText: string;
    questionData: any;
    correctAnswer: any;
    explanation?: string;
    questionNumber?: number;
    groupLabel?: string;
    groupInstructions?: string;
  }>) => Promise<void>;
  onCancel: () => void;
  startingQuestionNumber: number;
}

const QUESTION_TYPE_OPTIONS: { value: IELTSQuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'tfng', label: 'True / False / Not Given' },
  { value: 'ynng', label: 'Yes / No / Not Given' },
  { value: 'completion', label: 'Completion (Single blank)' },
  { value: 'summary', label: 'Summary / Note Completion (Multiple blanks)' },
  { value: 'matching', label: 'Matching' },
  { value: 'dropdown', label: 'Dropdown (Headings/Labels)' },
];

function getAllowedTypes(sectionType: SectionType): IELTSQuestionType[] {
  switch (sectionType) {
    case 'listening':
      return ['mcq', 'completion', 'summary', 'matching', 'dropdown'];
    case 'reading':
      return ['mcq', 'tfng', 'ynng', 'completion', 'summary', 'matching', 'dropdown'];
    default:
      return ['mcq'];
  }
}

// Parse MCQ format (same as TOEFL ITP)
function parseMCQQuestions(input: string): ParsedIELTSQuestion[] {
  const questions: ParsedIELTSQuestion[] = [];
  const blocks = input.split(/^---$/m).filter((block) => block.trim());

  for (const block of blocks) {
    const q: ParsedIELTSQuestion = {
      questionType: 'mcq',
      questionText: '',
      options: [],
      correctAnswer: '',
      parseErrors: [],
    };

    const lines = block.split('\n');
    let currentField = '';
    let currentValue = '';

    for (const line of lines) {
      const trimmed = line.trim();
      const fieldMatch = trimmed.match(/^(Q\d*|A|B|C|D|ANSWER|EXPLANATION|GROUP|INSTRUCTIONS):\s*(.*)/i);

      if (fieldMatch) {
        if (currentField) {
          assignMCQField(q, currentField, currentValue.trim());
        }
        currentField = fieldMatch[1].toUpperCase();
        currentValue = fieldMatch[2] || '';
      } else if (currentField && trimmed) {
        currentValue += '\n' + trimmed;
      }
    }

    if (currentField) {
      assignMCQField(q, currentField, currentValue.trim());
    }

    // Validate
    if (!q.options || q.options.length !== 4) {
      q.parseErrors!.push(`Expected 4 options (A-D), found ${q.options?.length || 0}`);
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

function assignMCQField(q: ParsedIELTSQuestion, field: string, value: string) {
  if (field.startsWith('Q')) {
    const numberPart = field.substring(1);
    if (numberPart) {
      const num = parseInt(numberPart, 10);
      if (!isNaN(num) && num > 0) {
        q.questionNumber = num;
      }
    }
    q.questionText = value;
  } else {
    switch (field) {
      case 'A':
      case 'B':
      case 'C':
      case 'D':
        q.options!.push({ key: field, text: value });
        break;
      case 'ANSWER':
        q.correctAnswer = value.toUpperCase();
        break;
      case 'EXPLANATION':
        q.explanation = value;
        break;
      case 'GROUP':
        q.groupLabel = value;
        break;
      case 'INSTRUCTIONS':
        q.groupInstructions = value;
        break;
    }
  }
}

// Parse TFNG/YNNG format
function parseTFNGQuestions(input: string, type: 'tfng' | 'ynng'): ParsedIELTSQuestion[] {
  const questions: ParsedIELTSQuestion[] = [];
  const blocks = input.split(/^---$/m).filter((block) => block.trim());
  const validAnswers = type === 'tfng' ? ['TRUE', 'FALSE', 'NOT GIVEN', 'T', 'F', 'NG'] : ['YES', 'NO', 'NOT GIVEN', 'Y', 'N', 'NG'];

  for (const block of blocks) {
    const q: ParsedIELTSQuestion = {
      questionType: type,
      questionText: '',
      statement: '',
      correctAnswer: '',
      parseErrors: [],
    };

    const lines = block.split('\n');
    let currentField = '';
    let currentValue = '';

    for (const line of lines) {
      const trimmed = line.trim();
      const fieldMatch = trimmed.match(/^(Q\d*|STATEMENT|ANSWER|EXPLANATION|GROUP|INSTRUCTIONS):\s*(.*)/i);

      if (fieldMatch) {
        if (currentField) {
          assignTFNGField(q, currentField, currentValue.trim(), type);
        }
        currentField = fieldMatch[1].toUpperCase();
        currentValue = fieldMatch[2] || '';
      } else if (currentField && trimmed) {
        currentValue += '\n' + trimmed;
      }
    }

    if (currentField) {
      assignTFNGField(q, currentField, currentValue.trim(), type);
    }

    // Validate
    if (!q.statement && !q.questionText) {
      q.parseErrors!.push('Missing statement (STATEMENT: or Q:)');
    }
    if (!q.correctAnswer) {
      q.parseErrors!.push('Missing correct answer (ANSWER:)');
    } else {
      const normalizedAnswer = q.correctAnswer.toUpperCase();
      if (!validAnswers.includes(normalizedAnswer)) {
        q.parseErrors!.push(`Invalid answer "${q.correctAnswer}", must be ${type === 'tfng' ? 'TRUE/FALSE/NOT GIVEN' : 'YES/NO/NOT GIVEN'}`);
      }
    }

    questions.push(q);
  }

  return questions;
}

function assignTFNGField(q: ParsedIELTSQuestion, field: string, value: string, type: 'tfng' | 'ynng') {
  if (field.startsWith('Q')) {
    const numberPart = field.substring(1);
    if (numberPart) {
      const num = parseInt(numberPart, 10);
      if (!isNaN(num) && num > 0) {
        q.questionNumber = num;
      }
    }
    // Q field can be used as statement
    q.statement = value;
    q.questionText = value;
  } else {
    switch (field) {
      case 'STATEMENT':
        q.statement = value;
        q.questionText = value;
        break;
      case 'ANSWER':
        // Normalize answer
        const upper = value.toUpperCase().trim();
        if (type === 'tfng') {
          if (upper === 'T') q.correctAnswer = 'TRUE';
          else if (upper === 'F') q.correctAnswer = 'FALSE';
          else if (upper === 'NG') q.correctAnswer = 'NOT GIVEN';
          else q.correctAnswer = upper;
        } else {
          if (upper === 'Y') q.correctAnswer = 'YES';
          else if (upper === 'N') q.correctAnswer = 'NO';
          else if (upper === 'NG') q.correctAnswer = 'NOT GIVEN';
          else q.correctAnswer = upper;
        }
        break;
      case 'EXPLANATION':
        q.explanation = value;
        break;
      case 'GROUP':
        q.groupLabel = value;
        break;
      case 'INSTRUCTIONS':
        q.groupInstructions = value;
        break;
    }
  }
}

// Parse Completion format
function parseCompletionQuestions(input: string): ParsedIELTSQuestion[] {
  const questions: ParsedIELTSQuestion[] = [];
  const blocks = input.split(/^---$/m).filter((block) => block.trim());

  for (const block of blocks) {
    const q: ParsedIELTSQuestion = {
      questionType: 'completion',
      questionText: '',
      context: '',
      maxWords: 3,
      correctAnswer: '',
      parseErrors: [],
    };

    const lines = block.split('\n');
    let currentField = '';
    let currentValue = '';

    for (const line of lines) {
      const trimmed = line.trim();
      const fieldMatch = trimmed.match(/^(Q\d*|CONTEXT|BLANK|ANSWER|MAXWORDS|EXPLANATION|GROUP|INSTRUCTIONS):\s*(.*)/i);

      if (fieldMatch) {
        if (currentField) {
          assignCompletionField(q, currentField, currentValue.trim());
        }
        currentField = fieldMatch[1].toUpperCase();
        currentValue = fieldMatch[2] || '';
      } else if (currentField && trimmed) {
        currentValue += '\n' + trimmed;
      }
    }

    if (currentField) {
      assignCompletionField(q, currentField, currentValue.trim());
    }

    // Validate
    if (!q.questionText && !q.context) {
      q.parseErrors!.push('Missing question text (Q:) or context (CONTEXT:)');
    }
    if (!q.correctAnswer) {
      q.parseErrors!.push('Missing correct answer (ANSWER:)');
    }

    questions.push(q);
  }

  return questions;
}

function assignCompletionField(q: ParsedIELTSQuestion, field: string, value: string) {
  if (field.startsWith('Q')) {
    const numberPart = field.substring(1);
    if (numberPart) {
      const num = parseInt(numberPart, 10);
      if (!isNaN(num) && num > 0) {
        q.questionNumber = num;
      }
    }
    q.questionText = value;
  } else {
    switch (field) {
      case 'CONTEXT':
        q.context = value;
        break;
      case 'BLANK':
        // Alternative way to mark the blank position
        q.questionText = value;
        break;
      case 'ANSWER':
        // Support multiple acceptable answers separated by |
        q.correctAnswer = value.split('|').map(a => a.trim());
        break;
      case 'MAXWORDS':
        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) {
          q.maxWords = num;
        }
        break;
      case 'EXPLANATION':
        q.explanation = value;
        break;
      case 'GROUP':
        q.groupLabel = value;
        break;
      case 'INSTRUCTIONS':
        q.groupInstructions = value;
        break;
    }
  }
}

// Parse Summary/Note Completion format - each block is one question with shared header
// First block can define shared TITLE, GROUP, INSTRUCTIONS that apply to all (header-only block)
// A block is header-only if it has no CONTEXT/Q and no ANSWER
function parseSummaryQuestions(input: string): ParsedIELTSQuestion[] {
  const questions: ParsedIELTSQuestion[] = [];
  const blocks = input.split(/^---$/m).filter((block) => block.trim());

  // Shared values that persist across blocks
  let sharedTitle = '';
  let sharedGroupLabel = '';
  let sharedGroupInstructions = '';
  let sharedMaxWords = 1;
  let sharedStyle: 'note' | 'standard' = 'note';

  for (const block of blocks) {
    const q: ParsedIELTSQuestion = {
      questionType: 'completion',
      questionText: '',
      context: '',
      maxWords: sharedMaxWords,
      correctAnswer: [],
      parseErrors: [],
    };

    // Local values for this question
    let localTitle = '';
    let localGroupLabel = '';
    let localGroupInstructions = '';
    let localStyle: 'note' | 'standard' | '' = '';
    let hasContext = false;
    let hasAnswer = false;

    const lines = block.split('\n');
    let currentField = '';
    let currentValue = '';

    for (const line of lines) {
      const trimmed = line.trim();
      // Match: Q, CONTEXT, TITLE, MAXWORDS, ANSWER, STYLE, GROUP, INSTRUCTIONS
      const fieldMatch = trimmed.match(/^(Q\d*|CONTEXT|TITLE|MAXWORDS|ANSWER|STYLE|GROUP|INSTRUCTIONS):\s*(.*)/i);

      if (fieldMatch) {
        if (currentField) {
          const result = assignSummaryFieldToQuestion(q, currentField, currentValue.trim(), {
            setTitle: (v) => { localTitle = v; },
            setGroup: (v) => { localGroupLabel = v; },
            setInstructions: (v) => { localGroupInstructions = v; },
            setStyle: (v) => { localStyle = v as 'note' | 'standard'; },
          });
          if (result === 'context') hasContext = true;
          if (result === 'answer') hasAnswer = true;
        }
        currentField = fieldMatch[1].toUpperCase();
        currentValue = fieldMatch[2] || '';
      } else if (currentField && trimmed) {
        currentValue += '\n' + trimmed;
      }
    }

    // Handle last field
    if (currentField) {
      const result = assignSummaryFieldToQuestion(q, currentField, currentValue.trim(), {
        setTitle: (v) => { localTitle = v; },
        setGroup: (v) => { localGroupLabel = v; },
        setInstructions: (v) => { localGroupInstructions = v; },
        setStyle: (v) => { localStyle = v as 'note' | 'standard'; },
      });
      if (result === 'context') hasContext = true;
      if (result === 'answer') hasAnswer = true;
    }

    // Update shared values if this block defined them
    if (localTitle) sharedTitle = localTitle;
    if (localGroupLabel) sharedGroupLabel = localGroupLabel;
    if (localGroupInstructions) sharedGroupInstructions = localGroupInstructions;
    if (localStyle) sharedStyle = localStyle;
    if (q.maxWords && q.maxWords !== 1) sharedMaxWords = q.maxWords;

    // If this block has no CONTEXT and no ANSWER, it's a header-only block - skip creating a question
    if (!hasContext && !hasAnswer) {
      continue;
    }

    // Apply shared values to this question
    q.groupLabel = localGroupLabel || sharedGroupLabel;
    q.groupInstructions = localGroupInstructions || sharedGroupInstructions;
    q.maxWords = q.maxWords || sharedMaxWords;
    // Store title and style in a way that can be passed to questionData
    (q as any).title = localTitle || sharedTitle;
    (q as any).style = localStyle || sharedStyle;

    // Validate
    if (!q.context) {
      q.parseErrors!.push('Missing CONTEXT: or Q: with {blank} or _____');
    } else if (!q.context.includes('{blank}') && !q.context.includes('_____') && !q.context.includes('___')) {
      q.parseErrors!.push('Context must include {blank} or _____ to mark the blank position');
    }
    if (!q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)) {
      q.parseErrors!.push('Missing ANSWER:');
    }

    questions.push(q);
  }

  return questions;
}

function assignSummaryFieldToQuestion(
  q: ParsedIELTSQuestion,
  field: string,
  value: string,
  handlers: {
    setTitle: (v: string) => void;
    setGroup: (v: string) => void;
    setInstructions: (v: string) => void;
    setStyle: (v: string) => void;
  }
): 'context' | 'answer' | 'other' {
  if (field.startsWith('Q')) {
    const numberPart = field.substring(1);
    if (numberPart) {
      const num = parseInt(numberPart, 10);
      if (!isNaN(num) && num > 0) {
        q.questionNumber = num;
      }
    }
    // Q field sets context
    q.context = value;
    return 'context';
  } else {
    switch (field) {
      case 'CONTEXT':
        q.context = value;
        return 'context';
      case 'TITLE':
        handlers.setTitle(value);
        return 'other';
      case 'MAXWORDS':
        q.maxWords = parseInt(value, 10) || 1;
        return 'other';
      case 'ANSWER':
        // Support multiple acceptable answers separated by |
        q.correctAnswer = value.split('|').map(a => a.trim()).filter(a => a);
        return 'answer';
      case 'STYLE':
        handlers.setStyle(value.toLowerCase());
        return 'other';
      case 'GROUP':
        handlers.setGroup(value);
        return 'other';
      case 'INSTRUCTIONS':
        handlers.setInstructions(value);
        return 'other';
      default:
        return 'other';
    }
  }
}

// Parse Matching format
function parseMatchingQuestions(input: string): ParsedIELTSQuestion[] {
  const questions: ParsedIELTSQuestion[] = [];
  const blocks = input.split(/^---$/m).filter((block) => block.trim());

  for (const block of blocks) {
    const q: ParsedIELTSQuestion = {
      questionType: 'matching',
      questionText: '',
      items: [],
      matchOptions: [],
      correctAnswer: {},
      parseErrors: [],
    };

    const lines = block.split('\n');
    let currentField = '';
    let currentValue = '';

    for (const line of lines) {
      const trimmed = line.trim();
      // Match: Q, ITEM1-ITEM10, OPTION_A-OPTION_Z, ANSWER, EXPLANATION, GROUP, INSTRUCTIONS
      const fieldMatch = trimmed.match(/^(Q\d*|ITEM\d+|OPTION_[A-Z]|ANSWER|EXPLANATION|GROUP|INSTRUCTIONS):\s*(.*)/i);

      if (fieldMatch) {
        if (currentField) {
          assignMatchingField(q, currentField, currentValue.trim());
        }
        currentField = fieldMatch[1].toUpperCase();
        currentValue = fieldMatch[2] || '';
      } else if (currentField && trimmed) {
        currentValue += '\n' + trimmed;
      }
    }

    if (currentField) {
      assignMatchingField(q, currentField, currentValue.trim());
    }

    // Validate
    if (q.items!.length === 0) {
      q.parseErrors!.push('No items defined (use ITEM1:, ITEM2:, etc.)');
    }
    if (q.matchOptions!.length === 0) {
      q.parseErrors!.push('No options defined (use OPTION_A:, OPTION_B:, etc.)');
    }
    if (!q.correctAnswer || Object.keys(q.correctAnswer).length === 0) {
      q.parseErrors!.push('Missing answer mapping (ANSWER: 1=A, 2=B, ...)');
    }

    questions.push(q);
  }

  return questions;
}

function assignMatchingField(q: ParsedIELTSQuestion, field: string, value: string) {
  if (field.startsWith('Q')) {
    const numberPart = field.substring(1);
    if (numberPart) {
      const num = parseInt(numberPart, 10);
      if (!isNaN(num) && num > 0) {
        q.questionNumber = num;
      }
    }
    q.questionText = value;
  } else if (field.startsWith('ITEM')) {
    const itemNum = field.replace('ITEM', '');
    q.items!.push({ key: itemNum, text: value });
  } else if (field.startsWith('OPTION_')) {
    const optionKey = field.replace('OPTION_', '');
    q.matchOptions!.push({ key: optionKey, text: value });
  } else {
    switch (field) {
      case 'ANSWER':
        // Parse answer mapping like "1=A, 2=B, 3=C"
        const pairs = value.split(',').map(p => p.trim());
        const answerMap: Record<string, string> = {};
        for (const pair of pairs) {
          const [itemKey, optionKey] = pair.split('=').map(s => s.trim());
          if (itemKey && optionKey) {
            answerMap[itemKey] = optionKey;
          }
        }
        q.correctAnswer = answerMap;
        break;
      case 'EXPLANATION':
        q.explanation = value;
        break;
      case 'GROUP':
        q.groupLabel = value;
        break;
      case 'INSTRUCTIONS':
        q.groupInstructions = value;
        break;
    }
  }
}

// Parse Dropdown format
function parseDropdownQuestions(input: string): ParsedIELTSQuestion[] {
  const questions: ParsedIELTSQuestion[] = [];
  const blocks = input.split(/^---$/m).filter((block) => block.trim());

  for (const block of blocks) {
    const q: ParsedIELTSQuestion = {
      questionType: 'dropdown',
      questionText: '',
      context: '',
      dropdowns: {},
      correctAnswer: {},
      parseErrors: [],
    };

    const lines = block.split('\n');
    let currentField = '';
    let currentValue = '';

    for (const line of lines) {
      const trimmed = line.trim();
      // Match: Q, CONTEXT, DROP_1, DROP_2, etc., ANSWER, EXPLANATION, GROUP, INSTRUCTIONS
      const fieldMatch = trimmed.match(/^(Q\d*|CONTEXT|DROP_\d+|ANSWER|EXPLANATION|GROUP|INSTRUCTIONS):\s*(.*)/i);

      if (fieldMatch) {
        if (currentField) {
          assignDropdownField(q, currentField, currentValue.trim());
        }
        currentField = fieldMatch[1].toUpperCase();
        currentValue = fieldMatch[2] || '';
      } else if (currentField && trimmed) {
        currentValue += '\n' + trimmed;
      }
    }

    if (currentField) {
      assignDropdownField(q, currentField, currentValue.trim());
    }

    // Validate
    if (!q.context) {
      q.parseErrors!.push('Missing context with placeholders (CONTEXT:)');
    }
    if (Object.keys(q.dropdowns || {}).length === 0) {
      q.parseErrors!.push('No dropdown options defined (use DROP_1:, DROP_2:, etc.)');
    }
    if (!q.correctAnswer || Object.keys(q.correctAnswer).length === 0) {
      q.parseErrors!.push('Missing answer mapping (ANSWER: 1=Option, 2=Option, ...)');
    }

    questions.push(q);
  }

  return questions;
}

function assignDropdownField(q: ParsedIELTSQuestion, field: string, value: string) {
  if (field.startsWith('Q')) {
    const numberPart = field.substring(1);
    if (numberPart) {
      const num = parseInt(numberPart, 10);
      if (!isNaN(num) && num > 0) {
        q.questionNumber = num;
      }
    }
    q.questionText = value;
  } else if (field.startsWith('DROP_')) {
    // DROP_1: option1, option2, option3
    const dropKey = field.replace('DROP_', '');
    const options = value.split(',').map(o => o.trim()).filter(o => o);
    q.dropdowns![dropKey] = { options };
  } else {
    switch (field) {
      case 'CONTEXT':
        q.context = value;
        break;
      case 'ANSWER':
        // Parse answer mapping like "1=correct option, 2=another option"
        const pairs = value.split(',').map(p => p.trim());
        const answerMap: Record<string, string> = {};
        for (const pair of pairs) {
          const eqIndex = pair.indexOf('=');
          if (eqIndex > 0) {
            const key = pair.substring(0, eqIndex).trim();
            const val = pair.substring(eqIndex + 1).trim();
            if (key && val) {
              answerMap[key] = val;
            }
          }
        }
        q.correctAnswer = answerMap;
        break;
      case 'EXPLANATION':
        q.explanation = value;
        break;
      case 'GROUP':
        q.groupLabel = value;
        break;
      case 'INSTRUCTIONS':
        q.groupInstructions = value;
        break;
    }
  }
}

function convertToAPIFormat(questions: ParsedIELTSQuestion[]): Array<{
  questionType: QuestionType;
  questionText: string;
  questionData: any;
  correctAnswer: any;
  explanation?: string;
  questionNumber?: number;
  groupLabel?: string;
  groupInstructions?: string;
}> {
  return questions.map((q) => {
    switch (q.questionType) {
      case 'mcq':
        return {
          questionType: 'multiple_choice' as QuestionType,
          questionText: q.questionText,
          questionData: {
            options: q.options,
            multiSelect: false,
          },
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          questionNumber: q.questionNumber,
          groupLabel: q.groupLabel,
          groupInstructions: q.groupInstructions,
        };
      case 'tfng':
        return {
          questionType: 'true_false_not_given' as QuestionType,
          questionText: q.questionText || q.statement || '',
          questionData: {
            statement: q.statement || q.questionText || '',
            options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          },
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          questionNumber: q.questionNumber,
          groupLabel: q.groupLabel,
          groupInstructions: q.groupInstructions,
        };
      case 'ynng':
        return {
          questionType: 'yes_no_not_given' as QuestionType,
          questionText: q.questionText || q.statement || '',
          questionData: {
            statement: q.statement || q.questionText || '',
            options: ['YES', 'NO', 'NOT GIVEN'],
          },
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          questionNumber: q.questionNumber,
          groupLabel: q.groupLabel,
          groupInstructions: q.groupInstructions,
        };
      case 'completion':
        return {
          questionType: 'completion' as QuestionType,
          questionText: q.questionText,
          questionData: {
            context: q.context || '',
            maxWords: q.maxWords || 1,
            caseSensitive: false,
            blankPosition: '',
            title: (q as any).title || '',
            style: (q as any).style || 'note',
          },
          correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer],
          explanation: q.explanation,
          questionNumber: q.questionNumber,
          groupLabel: q.groupLabel,
          groupInstructions: q.groupInstructions,
        };
      case 'matching':
        return {
          questionType: 'matching' as QuestionType,
          questionText: q.questionText,
          questionData: {
            instructions: '',
            items: q.items || [],
            options: q.matchOptions || [],
            allowReuse: false,
          },
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          questionNumber: q.questionNumber,
          groupLabel: q.groupLabel,
          groupInstructions: q.groupInstructions,
        };
      case 'dropdown':
        return {
          questionType: 'dropdown' as QuestionType,
          questionText: q.questionText,
          questionData: {
            context: q.context || '',
            dropdowns: q.dropdowns || {},
          },
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          questionNumber: q.questionNumber,
          groupLabel: q.groupLabel,
          groupInstructions: q.groupInstructions,
        };
      default:
        return {
          questionType: 'multiple_choice' as QuestionType,
          questionText: q.questionText,
          questionData: { options: [], multiSelect: false },
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          questionNumber: q.questionNumber,
          groupLabel: q.groupLabel,
          groupInstructions: q.groupInstructions,
        };
    }
  });
}

export default function IELTSBulkQuestionImporter({
  sectionType,
  onSubmit,
  onCancel,
  startingQuestionNumber,
}: IELTSBulkQuestionImporterProps) {
  const allowedTypes = getAllowedTypes(sectionType);
  const [selectedType, setSelectedType] = useState<IELTSQuestionType>(allowedTypes[0]);
  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTypeOptions = QUESTION_TYPE_OPTIONS.filter((t) => allowedTypes.includes(t.value));

  // Parse input based on selected type
  const parsedQuestions = useMemo(() => {
    if (!rawInput.trim()) return [];

    switch (selectedType) {
      case 'mcq':
        return parseMCQQuestions(rawInput);
      case 'tfng':
        return parseTFNGQuestions(rawInput, 'tfng');
      case 'ynng':
        return parseTFNGQuestions(rawInput, 'ynng');
      case 'completion':
        return parseCompletionQuestions(rawInput);
      case 'summary':
        return parseSummaryQuestions(rawInput);
      case 'matching':
        return parseMatchingQuestions(rawInput);
      case 'dropdown':
        return parseDropdownQuestions(rawInput);
      default:
        return [];
    }
  }, [rawInput, selectedType]);

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
      const questionsToSubmit = convertToAPIFormat(validQuestions);
      await onSubmit(questionsToSubmit);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to import questions');
    } finally {
      setLoading(false);
    }
  };

  const getFormatGuide = () => {
    switch (selectedType) {
      case 'mcq':
        return `---
Q1: Question text here
A: Option A text
B: Option B text
C: Option C text
D: Option D text
ANSWER: A
EXPLANATION: Optional explanation
GROUP: Questions 1-5
INSTRUCTIONS: Choose the correct letter, A, B, C, or D.
---`;
      case 'tfng':
        return `---
Q1: The statement to evaluate
ANSWER: TRUE
EXPLANATION: Optional explanation
GROUP: Questions 1-7
INSTRUCTIONS: Do the following statements agree with the information given in the text?
---
(Use STATEMENT: instead of Q: if preferred)
Answers: TRUE, FALSE, NOT GIVEN (or T, F, NG)`;
      case 'ynng':
        return `---
Q1: The statement to evaluate
ANSWER: YES
EXPLANATION: Optional explanation
GROUP: Questions 8-13
INSTRUCTIONS: Do the following statements agree with the writer's views?
---
(Use STATEMENT: instead of Q: if preferred)
Answers: YES, NO, NOT GIVEN (or Y, N, NG)`;
      case 'completion':
        return `---
Q1: The sentence with a _____ to complete
CONTEXT: Optional longer context text
ANSWER: correct answer | alternative answer
MAXWORDS: 2
EXPLANATION: Optional explanation
GROUP: Questions 1-10
INSTRUCTIONS: Complete the sentences below. Write NO MORE THAN TWO WORDS.
---
Use | to separate multiple acceptable answers`;
      case 'summary':
        return `---
TITLE: Georgia O'Keeffe
GROUP: Questions 1-7
INSTRUCTIONS: Complete the notes below.
Choose ONE WORD ONLY from the passage for each answer.
MAXWORDS: 1
STYLE: note
---
Q1: - studied art, then worked as a {blank} in various places in the USA
ANSWER: teacher
---
Q2: - created drawings using {blank} which were exhibited in New York City
ANSWER: charcoal
---
Q3: - work was__(blank)__ and__(blank)__ focused on nature
ANSWER: large | detailed
---
First block sets shared TITLE, GROUP, INSTRUCTIONS, MAXWORDS, STYLE.
Each following block is one question with CONTEXT and ANSWER.
Use {blank} or _____ to mark the blank position.
Use | to separate alternative acceptable answers.`;
      case 'matching':
        return `---
Q: Match the features with the correct periods
ITEM1: The first feature to match
ITEM2: The second feature to match
ITEM3: The third feature to match
OPTION_A: First period/category
OPTION_B: Second period/category
OPTION_C: Third period/category
ANSWER: 1=A, 2=B, 3=C
EXPLANATION: Optional explanation
GROUP: Questions 14-20
INSTRUCTIONS: Match the features with the correct time period.
---`;
      case 'dropdown':
        return `---
Q: Choose the correct heading for each paragraph
CONTEXT: Paragraph A discusses {1}. Paragraph B covers {2}. Paragraph C explains {3}.
DROP_1: The history of science, Modern developments, Early discoveries
DROP_2: Environmental impact, Economic factors, Social changes
DROP_3: Future predictions, Current trends, Past events
ANSWER: 1=Early discoveries, 2=Environmental impact, 3=Current trends
EXPLANATION: Optional explanation
GROUP: Questions 1-6
INSTRUCTIONS: Choose the correct heading for each paragraph.
---
Use {1}, {2}, etc. in CONTEXT for dropdown positions.
DROP_1, DROP_2, etc. list comma-separated options for each dropdown.`;
      default:
        return '';
    }
  };

  const getAnswerPreview = (q: ParsedIELTSQuestion): string => {
    if (typeof q.correctAnswer === 'object' && !Array.isArray(q.correctAnswer)) {
      return Object.entries(q.correctAnswer).map(([k, v]) => `${k}=${v}`).join(', ');
    }
    if (Array.isArray(q.correctAnswer)) {
      return q.correctAnswer.join(' | ');
    }
    return String(q.correctAnswer);
  };

  return (
    <div className="space-y-6">
      {/* Question Type Selector */}
      <div>
        <Select
          label="Question Type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as IELTSQuestionType)}
          options={filteredTypeOptions}
        />
      </div>

      {/* Format guide */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Format Guide - {QUESTION_TYPE_OPTIONS.find((t) => t.value === selectedType)?.label}
        </h4>
        <pre className="text-xs text-blue-800 whitespace-pre-wrap font-mono">
          {getFormatGuide()}
        </pre>
        <p className="text-xs text-blue-700 mt-2">
          <strong>Q1:</strong> Use number for custom question numbers.
          Use <strong>GROUP:</strong> and <strong>INSTRUCTIONS:</strong> to group questions together.
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
                    {q.questionNumber || startingQuestionNumber + idx}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="info" className="text-xs">
                        {QUESTION_TYPE_OPTIONS.find((t) => t.value === q.questionType)?.label}
                      </Badge>
                      {q.groupLabel && (
                        <span className="text-xs text-blue-600">{q.groupLabel}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {q.questionText || q.statement || <span className="italic text-gray-400">(no text)</span>}
                    </p>
                    {q.parseErrors?.length ? (
                      <ul className="text-xs text-red-600 mt-1">
                        {q.parseErrors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-green-600 mt-1">
                        Answer: {getAnswerPreview(q)}
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
