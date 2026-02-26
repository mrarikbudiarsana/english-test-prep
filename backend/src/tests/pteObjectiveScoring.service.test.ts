import assert from 'node:assert/strict';
import { scoreObjectiveSectionWithQuery } from '../services/scoring.service';

function createFakeQuery() {
  const calls: Array<{ text: string; params: any[] }> = [];

  const questions = [
    {
      id: 'q1',
      section_id: 's1',
      question_number: 1,
      question_type: 'pte_reorder_paragraph',
      question_text: 'Reorder',
      question_data: {
        blocks: [
          { id: 'A', text: 'A' },
          { id: 'B', text: 'B' },
          { id: 'C', text: 'C' },
          { id: 'D', text: 'D' },
        ],
      },
      correct_answer: ['A', 'B', 'C', 'D'],
      points: 1,
    },
    {
      id: 'q2',
      section_id: 's1',
      question_number: 2,
      question_type: 'pte_write_from_dictation',
      question_text: 'Dictation',
      question_data: {},
      correct_answer: 'one two three four five',
      points: 1,
    },
  ];

  const responses = [
    {
      id: 'r1',
      question_id: 'q1',
      answer_data: ['A', 'B', 'D', 'C'],
    },
    {
      id: 'r2',
      question_id: 'q2',
      answer_data: 'one two wrong wrong five',
    },
  ];

  const fakeQuery = async (text: string, params: any[] = []): Promise<{ rows: any[] }> => {
    calls.push({ text, params });

    if (text.includes('FROM questions q')) {
      return { rows: questions };
    }
    if (text.includes('SELECT * FROM responses')) {
      return { rows: responses };
    }
    if (text.includes('UPDATE responses SET is_correct')) {
      return { rows: [] };
    }
    if (text.includes('UPDATE attempts')) {
      return { rows: [] };
    }

    throw new Error(`Unexpected query: ${text}`);
  };

  return { fakeQuery, calls };
}

async function run() {
  const { fakeQuery, calls } = createFakeQuery();

  const band = await scoreObjectiveSectionWithQuery(
    fakeQuery,
    'attempt-1',
    'reading',
    'pte_academic',
  );

  assert.equal(band, 50, 'band should normalize using derived max points');

  const responseUpdates = calls.filter((c) => c.text.includes('UPDATE responses SET is_correct'));
  assert.equal(responseUpdates.length, 2, 'should update each response score');

  const attemptUpdate = calls.find((c) => c.text.includes('UPDATE attempts'));
  assert.ok(attemptUpdate, 'attempt update query should be called');
  assert.deepEqual(
    attemptUpdate!.params,
    [4, 50, 'attempt-1'],
    'attempt update should persist computed raw and normalized band',
  );

  // eslint-disable-next-line no-console
  console.log('PTE objective scoring service tests passed');
}

run();
