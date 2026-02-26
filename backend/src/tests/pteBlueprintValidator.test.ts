import assert from 'node:assert/strict';
import { previewPteBlueprint, validatePteBlueprint } from '../utils/pteBlueprintValidator';

function makeRows() {
  const rows: any[] = [];

  // Reading blueprint target:
  // dropdown 5, mcq multiple 2, reorder 2, drag-drop 4, mcq single 2
  for (let i = 0; i < 5; i++) rows.push({ sectionType: 'reading', questionType: 'pte_reading_fill_blanks_dropdown' });
  for (let i = 0; i < 2; i++) rows.push({ sectionType: 'reading', questionType: 'pte_mcq_multiple' });
  for (let i = 0; i < 2; i++) rows.push({ sectionType: 'reading', questionType: 'pte_reorder_paragraph' });
  for (let i = 0; i < 4; i++) rows.push({ sectionType: 'reading', questionType: 'pte_reading_fill_blanks_drag_drop' });
  for (let i = 0; i < 2; i++) rows.push({ sectionType: 'reading', questionType: 'pte_mcq_single' });

  // Listening blueprint target:
  // mcq multiple 2, fib 2, hcs 2, mcq single 2, missing word 1, hiw 2, wfd 3
  for (let i = 0; i < 2; i++) rows.push({ sectionType: 'listening', questionType: 'pte_mcq_multiple' });
  for (let i = 0; i < 2; i++) rows.push({ sectionType: 'listening', questionType: 'pte_listening_fill_blanks' });
  for (let i = 0; i < 2; i++) rows.push({ sectionType: 'listening', questionType: 'pte_highlight_correct_summary' });
  for (let i = 0; i < 2; i++) rows.push({ sectionType: 'listening', questionType: 'pte_mcq_single' });
  for (let i = 0; i < 1; i++) rows.push({ sectionType: 'listening', questionType: 'pte_select_missing_word' });
  for (let i = 0; i < 2; i++) rows.push({ sectionType: 'listening', questionType: 'pte_highlight_incorrect_words' });
  for (let i = 0; i < 3; i++) rows.push({ sectionType: 'listening', questionType: 'pte_write_from_dictation' });

  return rows;
}

function run() {
  const valid = validatePteBlueprint(makeRows());
  assert.equal(valid.valid, true, `expected valid blueprint, got: ${valid.errors.join(' | ')}`);
  const preview = previewPteBlueprint(makeRows());
  assert.equal(preview.valid, true);
  assert.equal(preview.readingCounts.pte_mcq_single, 2);
  assert.equal(preview.listeningCounts.pte_write_from_dictation, 3);
  assert.ok(Object.keys(preview.readingRules).length > 0);
  assert.ok(Object.keys(preview.listeningRules).length > 0);

  const missingType = makeRows().filter((r) => r.questionType !== 'pte_reorder_paragraph');
  const invalidMissing = validatePteBlueprint(missingType);
  assert.equal(invalidMissing.valid, false);
  assert.ok(invalidMissing.errors.some((e) => e.includes('pte_reorder_paragraph')));

  const wrongSection = makeRows();
  wrongSection.push({ sectionType: 'speaking', questionType: 'pte_mcq_single' });
  const invalidSection = validatePteBlueprint(wrongSection);
  assert.equal(invalidSection.valid, false);
  assert.ok(invalidSection.errors.some((e) => e.includes('reading/listening sections')));

  // eslint-disable-next-line no-console
  console.log('PTE blueprint validator tests passed');
}

run();
