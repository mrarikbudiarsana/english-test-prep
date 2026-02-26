import assert from 'node:assert/strict';
import {
  getPteDerivedMaxPoints,
  validatePteConfiguredPoints,
} from '../utils/ptePointRules';

function run() {
  assert.equal(getPteDerivedMaxPoints('pte_mcq_single', 'A'), null);
  assert.equal(getPteDerivedMaxPoints('pte_mcq_multiple', ['A', 'C']), 2);
  assert.equal(getPteDerivedMaxPoints('pte_reading_fill_blanks_dropdown', { b1: 'x', b2: 'y' }), 2);
  assert.equal(getPteDerivedMaxPoints('pte_reorder_paragraph', ['A', 'B', 'C', 'D']), 3);
  assert.equal(getPteDerivedMaxPoints('pte_write_from_dictation', 'one two three four'), 4);

  const invalid = validatePteConfiguredPoints('pte_write_from_dictation', 'one two three', 1);
  assert.ok(invalid && invalid.includes('lower than derived max'));

  const valid = validatePteConfiguredPoints('pte_write_from_dictation', 'one two three', 3);
  assert.equal(valid, null);

  // eslint-disable-next-line no-console
  console.log('PTE point rules tests passed');
}

run();
