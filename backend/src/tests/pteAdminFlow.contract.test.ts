import assert from 'node:assert/strict';
import {
  publishTest,
  validatePteBlueprintForTest,
} from '../services/test.service';

const testModel = require('../models/test.model');
const sectionModel = require('../models/section.model');
const questionModel = require('../models/question.model');
const pteQuestionValidator = require('../utils/pteQuestionValidator');
const ptePointRules = require('../utils/ptePointRules');

function makeValidObjectiveQuestions(): any[] {
  const rows: any[] = [];
  let n = 1;

  // Reading distribution
  for (let i = 0; i < 5; i++) rows.push({ questionNumber: n++, questionType: 'pte_reading_fill_blanks_dropdown', sectionType: 'reading', questionData: {}, correctAnswer: { b1: 'x' }, points: 1 });
  for (let i = 0; i < 2; i++) rows.push({ questionNumber: n++, questionType: 'pte_mcq_multiple', sectionType: 'reading', questionData: {}, correctAnswer: ['A'], points: 1 });
  for (let i = 0; i < 2; i++) rows.push({ questionNumber: n++, questionType: 'pte_reorder_paragraph', sectionType: 'reading', questionData: {}, correctAnswer: ['A', 'B'], points: 1 });
  for (let i = 0; i < 4; i++) rows.push({ questionNumber: n++, questionType: 'pte_reading_fill_blanks_drag_drop', sectionType: 'reading', questionData: {}, correctAnswer: { b1: 'x' }, points: 1 });
  for (let i = 0; i < 2; i++) rows.push({ questionNumber: n++, questionType: 'pte_mcq_single', sectionType: 'reading', questionData: {}, correctAnswer: 'A', points: 1 });

  // Listening distribution
  for (let i = 0; i < 2; i++) rows.push({ questionNumber: n++, questionType: 'pte_mcq_multiple', sectionType: 'listening', questionData: {}, correctAnswer: ['A'], points: 1 });
  for (let i = 0; i < 2; i++) rows.push({ questionNumber: n++, questionType: 'pte_listening_fill_blanks', sectionType: 'listening', questionData: {}, correctAnswer: { b1: 'x' }, points: 1 });
  for (let i = 0; i < 2; i++) rows.push({ questionNumber: n++, questionType: 'pte_highlight_correct_summary', sectionType: 'listening', questionData: {}, correctAnswer: 'A', points: 1 });
  for (let i = 0; i < 2; i++) rows.push({ questionNumber: n++, questionType: 'pte_mcq_single', sectionType: 'listening', questionData: {}, correctAnswer: 'A', points: 1 });
  for (let i = 0; i < 1; i++) rows.push({ questionNumber: n++, questionType: 'pte_select_missing_word', sectionType: 'listening', questionData: {}, correctAnswer: 'A', points: 1 });
  for (let i = 0; i < 2; i++) rows.push({ questionNumber: n++, questionType: 'pte_highlight_incorrect_words', sectionType: 'listening', questionData: {}, correctAnswer: ['w1'], points: 1 });
  for (let i = 0; i < 3; i++) rows.push({ questionNumber: n++, questionType: 'pte_write_from_dictation', sectionType: 'listening', questionData: {}, correctAnswer: 'one two three', points: 3 });

  return rows;
}

async function run() {
  const originalFindById = testModel.findById;
  const originalPublish = testModel.publish;
  const originalFindSectionsByTestId = sectionModel.findByTestId;
  const originalFindQuestionsByTestId = questionModel.findByTestId;
  const originalValidateQuestion = pteQuestionValidator.validatePteQuestionPayload;
  const originalValidatePoints = ptePointRules.validatePteConfiguredPoints;

  let published = false;
  let questions = [
    { questionNumber: 1, questionType: 'pte_mcq_single', sectionType: 'reading', questionData: {}, correctAnswer: 'A', points: 1 },
    { questionNumber: 2, questionType: 'pte_mcq_single', sectionType: 'listening', questionData: {}, correctAnswer: 'A', points: 1 },
  ];

  try {
    testModel.findById = async () => ({
      id: 'test-pte-flow-1',
      testType: 'pte_academic',
      isPublished: false,
      deliveryModel: 'legacy',
    });

    testModel.publish = async (_id: string, nextState: boolean) => {
      published = nextState;
      return { id: 'test-pte-flow-1', isPublished: nextState };
    };

    sectionModel.findByTestId = async () => [
      { sectionType: 'speaking', durationMinutes: 80 },
      { sectionType: 'reading', durationMinutes: 25 },
      { sectionType: 'listening', durationMinutes: 35 },
    ];

    questionModel.findByTestId = async () => questions;
    pteQuestionValidator.validatePteQuestionPayload = () => ({ valid: true, errors: [] });
    ptePointRules.validatePteConfiguredPoints = () => null;

    const previewBefore = await validatePteBlueprintForTest('test-pte-flow-1');
    assert.equal(previewBefore.valid, false, 'preview should fail before content fix');

    // Simulate admin editing question set in section question pages.
    questions = makeValidObjectiveQuestions();

    const previewAfter = await validatePteBlueprintForTest('test-pte-flow-1');
    assert.equal(previewAfter.valid, true, `preview should pass after fix: ${previewAfter.errors.join(' | ')}`);

    const publishResult = await publishTest('test-pte-flow-1', true);
    assert.equal(publishResult?.isPublished, true, 'publish should succeed after valid blueprint');
    assert.equal(published, true, 'publish model call should be reached');

    // eslint-disable-next-line no-console
    console.log('PTE admin flow contract test passed');
  } finally {
    testModel.findById = originalFindById;
    testModel.publish = originalPublish;
    sectionModel.findByTestId = originalFindSectionsByTestId;
    questionModel.findByTestId = originalFindQuestionsByTestId;
    pteQuestionValidator.validatePteQuestionPayload = originalValidateQuestion;
    ptePointRules.validatePteConfiguredPoints = originalValidatePoints;
  }
}

run();
