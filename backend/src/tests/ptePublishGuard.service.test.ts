import assert from 'node:assert/strict';
import { ValidationError } from '../middleware/errorHandler';
import { publishTest } from '../services/test.service';

const testModel = require('../models/test.model');
const sectionModel = require('../models/section.model');
const questionModel = require('../models/question.model');
const pteQuestionValidator = require('../utils/pteQuestionValidator');
const ptePointRules = require('../utils/ptePointRules');

async function run() {
  const originalFindById = testModel.findById;
  const originalPublish = testModel.publish;
  const originalFindSectionsByTestId = sectionModel.findByTestId;
  const originalFindQuestionsByTestId = questionModel.findByTestId;
  const originalValidateQuestion = pteQuestionValidator.validatePteQuestionPayload;
  const originalValidatePoints = ptePointRules.validatePteConfiguredPoints;

  let publishCalled = false;

  try {
    testModel.findById = async () => ({
      id: 'test-pte-1',
      testType: 'pte_academic',
      isPublished: false,
      deliveryModel: 'legacy',
    });

    testModel.publish = async () => {
      publishCalled = true;
      return { id: 'test-pte-1', isPublished: true };
    };

    sectionModel.findByTestId = async () => [
      { sectionType: 'speaking', durationMinutes: 80 },
      { sectionType: 'reading', durationMinutes: 25 },
      { sectionType: 'listening', durationMinutes: 35 },
    ];

    // Intentionally far below blueprint minimums.
    questionModel.findByTestId = async () => [
      { questionNumber: 1, questionType: 'pte_mcq_single', sectionType: 'reading', questionData: {}, correctAnswer: 'A', points: 1 },
      { questionNumber: 2, questionType: 'pte_mcq_single', sectionType: 'listening', questionData: {}, correctAnswer: 'A', points: 1 },
    ];

    // Keep this test focused on publish blueprint guard behavior.
    pteQuestionValidator.validatePteQuestionPayload = () => ({ valid: true, errors: [] });
    ptePointRules.validatePteConfiguredPoints = () => null;

    let caught: unknown;
    try {
      await publishTest('test-pte-1', true);
    } catch (err) {
      caught = err;
    }

    assert.ok(caught instanceof ValidationError, 'publish should fail with ValidationError');
    assert.match(
      (caught as Error).message,
      /Cannot publish PTE Academic test:/,
      'error message should indicate PTE publish guard',
    );
    assert.match(
      (caught as Error).message,
      /PTE reading:/,
      'error should include fresh blueprint validation details',
    );
    assert.equal(publishCalled, false, 'test should not be published when blueprint is invalid');

    // eslint-disable-next-line no-console
    console.log('PTE publish guard service tests passed');
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
