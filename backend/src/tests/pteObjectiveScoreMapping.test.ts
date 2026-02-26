import assert from 'node:assert/strict';
import {
  rawToPteObjectiveScore,
  ratioToPteObjectiveScore,
} from '../config/pteObjectiveScoreMapping';

function run() {
  assert.equal(rawToPteObjectiveScore(0, 10), 10);
  assert.equal(rawToPteObjectiveScore(10, 10), 90);
  assert.equal(rawToPteObjectiveScore(5, 10), 50);

  // Calibration should not be purely linear: 70% would be 66 in linear mapping.
  assert.equal(ratioToPteObjectiveScore(0.7), 64);

  // Boundary clamping
  assert.equal(ratioToPteObjectiveScore(-0.2), 10);
  assert.equal(ratioToPteObjectiveScore(1.5), 90);

  // Monotonic sanity checks
  const checkpoints = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  let prev = -Infinity;
  for (const r of checkpoints) {
    const s = ratioToPteObjectiveScore(r);
    assert.ok(s >= prev, `score must be non-decreasing at ratio=${r}`);
    prev = s;
  }

  // eslint-disable-next-line no-console
  console.log('PTE objective score mapping tests passed');
}

run();
