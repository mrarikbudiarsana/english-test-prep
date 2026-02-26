import assert from 'node:assert/strict';
import {
  calculateSectionMaxRawScore,
  checkAnswer,
  convertToBand,
} from '../services/scoring.service';

function run() {
  const mcqMultiple: any = {
    id: 'q1',
    sectionId: 's1',
    questionNumber: 1,
    questionType: 'pte_mcq_multiple',
    questionText: 'Choose two options',
    questionData: {
      options: [
        { key: 'A', text: 'A' },
        { key: 'B', text: 'B' },
        { key: 'C', text: 'C' },
        { key: 'D', text: 'D' },
      ],
    },
    correctAnswer: ['A', 'C'],
    points: 1,
  };

  const listeningFib: any = {
    id: 'q2',
    sectionId: 's1',
    questionNumber: 2,
    questionType: 'pte_listening_fill_blanks',
    questionText: 'Fill blanks',
    questionData: {
      transcript: 'The {b1} is very {b2}.',
      blankIds: ['b1', 'b2'],
    },
    correctAnswer: { b1: 'city', b2: 'busy' },
    points: 1,
  };

  const hiw: any = {
    id: 'q3',
    sectionId: 's1',
    questionNumber: 3,
    questionType: 'pte_highlight_incorrect_words',
    questionText: 'Highlight incorrect words',
    questionData: {
      transcript: 'alpha beta gamma delta',
      tokens: [
        { id: 't1', text: 'alpha', index: 0 },
        { id: 't2', text: 'beta', index: 1 },
        { id: 't3', text: 'gamma', index: 2 },
        { id: 't4', text: 'delta', index: 3 },
      ],
    },
    correctAnswer: ['t2', 't4'],
    points: 1,
  };

  const questions = [mcqMultiple, listeningFib, hiw];
  const maxRaw = calculateSectionMaxRawScore(questions);
  assert.equal(maxRaw, 6, 'derived max should include per-type scoring dimensions');

  const raw =
    checkAnswer(mcqMultiple, ['A', 'C']).points +
    checkAnswer(listeningFib, { b1: 'city', b2: 'wrong' }).points +
    checkAnswer(hiw, ['t2', 't3']).points;

  assert.equal(raw, 3, 'fixture raw score should be stable');

  const normalizedListening = convertToBand(raw, 'listening', 'pte_academic', maxRaw);
  assert.equal(normalizedListening, 50, 'mixed listening objective bundle should normalize consistently');

  // eslint-disable-next-line no-console
  console.log('PTE listening bundle scoring tests passed');
}

run();
