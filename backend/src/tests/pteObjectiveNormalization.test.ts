import assert from 'node:assert/strict';
import {
  calculateSectionMaxRawScore,
  checkAnswer,
  convertToBand,
} from '../services/scoring.service';

function run() {
  const reorderQuestion: any = {
    id: 'q1',
    sectionId: 's1',
    questionNumber: 1,
    questionType: 'pte_reorder_paragraph',
    questionText: 'Reorder the text',
    questionData: {
      blocks: [
        { id: 'A', text: 'A' },
        { id: 'B', text: 'B' },
        { id: 'C', text: 'C' },
        { id: 'D', text: 'D' },
      ],
    },
    correctAnswer: ['A', 'B', 'C', 'D'],
    points: 1,
  };

  const dictationQuestion: any = {
    id: 'q2',
    sectionId: 's1',
    questionNumber: 2,
    questionType: 'pte_write_from_dictation',
    questionText: 'Write from dictation',
    questionData: {},
    correctAnswer: 'one two three four five',
    points: 1,
  };

  const questions = [reorderQuestion, dictationQuestion];
  const maxRaw = calculateSectionMaxRawScore(questions);
  assert.equal(maxRaw, 8, 'max raw score should use derived points for PTE item types');

  const reorderResult = checkAnswer(reorderQuestion, ['A', 'B', 'D', 'C']);
  const dictationResult = checkAnswer(dictationQuestion, 'one two wrong wrong five');
  const partialRaw = reorderResult.points + dictationResult.points;
  assert.equal(partialRaw, 4, 'partial objective score fixture should be stable');

  const normalized = convertToBand(partialRaw, 'reading', 'pte_academic', maxRaw);
  assert.equal(normalized, 50, 'partial score should normalize against true section maximum');

  // eslint-disable-next-line no-console
  console.log('PTE objective normalization tests passed');
}

run();
