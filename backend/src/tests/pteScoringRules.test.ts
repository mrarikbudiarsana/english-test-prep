import assert from 'node:assert/strict';
import {
  adjustPteWritingBands,
  band9ToPteScaled,
  countWords,
  getPteSpeakingWeights,
  inferPteTaskType,
} from '../utils/pteScoringRules';

function testInferTaskType() {
  assert.equal(inferPteTaskType('Please Read Aloud the text below.'), 'Read Aloud');
  assert.equal(inferPteTaskType('You will Summarize Spoken Text after listening.'), 'Summarize Spoken Text');
  assert.equal(inferPteTaskType('Unknown custom prompt'), 'Unspecified PTE Task');
}

function testBandConversion() {
  assert.equal(band9ToPteScaled(0), 10);
  assert.equal(band9ToPteScaled(9), 90);
  assert.equal(band9ToPteScaled(4.5), 50);
}

function testWritingAdjustments() {
  const base = {
    taskAchievement: 6,
    taskResponse: 6,
    coherenceCohesion: 6,
    lexicalResource: 6,
    grammaticalRangeAccuracy: 6,
  };

  const swtPenalty = adjustPteWritingBands('Summarize Written Text', base, 90);
  assert.ok(swtPenalty.taskResponse <= 1);

  const sstBonus = adjustPteWritingBands('Summarize Spoken Text', base, 55);
  assert.ok(sstBonus.taskResponse >= 7);

  const essayPenalty = adjustPteWritingBands('Write Essay', base, 100);
  assert.ok(essayPenalty.taskResponse <= 1);
}

function testSpeakingWeights() {
  const readAloud = getPteSpeakingWeights('Read Aloud');
  const describeImage = getPteSpeakingWeights('Describe Image');
  assert.ok(readAloud.pronunciation >= 0.3);
  assert.ok(describeImage.content >= 0.35);
}

function testWordCount() {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('one two three'), 3);
}

function run() {
  testInferTaskType();
  testBandConversion();
  testWritingAdjustments();
  testSpeakingWeights();
  testWordCount();
  // eslint-disable-next-line no-console
  console.log('PTE scoring rules tests passed');
}

run();

