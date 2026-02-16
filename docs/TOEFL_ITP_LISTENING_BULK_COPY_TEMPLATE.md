# TOEFL ITP Listening Bulk Copy SQL Template

Use this template to copy listening questions from one section to another in bulk, and auto-assign your requested TOEFL ITP groups:

- Section 1 - Part A: Q1-30
- Section 2 - Part B: Q31-34
- Section 3 - Part B: Q35-37
- Section 4 - Part C: Q38-41
- Section 5 - Part C: Q42-46
- Section 6 - Part C: Q47-50

## 1) Preview what will be copied (safe check)

```sql
WITH cfg AS (
  SELECT
    '<SOURCE_LISTENING_SECTION_ID>'::uuid AS source_section_id,
    '<TARGET_LISTENING_SECTION_ID>'::uuid AS target_section_id
),
range_map AS (
  SELECT *
  FROM (VALUES
    (1, 30, 'Section 1 - Part A, Questions 1-30', 'A', 'Choose the best answer based on each short conversation.'),
    (31, 34, 'Section 2 - Part B, Questions 31-34', 'B', 'Choose the best answer based on each longer conversation.'),
    (35, 37, 'Section 3 - Part B, Questions 35-37', 'B', 'Choose the best answer based on each longer conversation.'),
    (38, 41, 'Section 4 - Part C, Questions 38-41', 'C', 'Choose the best answer based on each talk.'),
    (42, 46, 'Section 5 - Part C, Questions 42-46', 'C', 'Choose the best answer based on each talk.'),
    (47, 50, 'Section 6 - Part C, Questions 47-50', 'C', 'Choose the best answer based on each talk.')
  ) AS v(start_q, end_q, group_label, part_code, group_instructions)
)
SELECT
  rm.group_label,
  COUNT(*) AS source_question_count,
  MIN(q.question_number) AS min_q,
  MAX(q.question_number) AS max_q
FROM questions q
JOIN cfg c
  ON q.section_id = c.source_section_id
JOIN range_map rm
  ON q.question_number BETWEEN rm.start_q AND rm.end_q
GROUP BY rm.group_label
ORDER BY MIN(q.question_number);
```

## 2) Execute bulk copy

```sql
BEGIN;

WITH cfg AS (
  SELECT
    '<SOURCE_LISTENING_SECTION_ID>'::uuid AS source_section_id,
    '<TARGET_LISTENING_SECTION_ID>'::uuid AS target_section_id
),
range_map AS (
  SELECT *
  FROM (VALUES
    (1, 30, 'Section 1 - Part A, Questions 1-30', 'A', 'Choose the best answer based on each short conversation.'),
    (31, 34, 'Section 2 - Part B, Questions 31-34', 'B', 'Choose the best answer based on each longer conversation.'),
    (35, 37, 'Section 3 - Part B, Questions 35-37', 'B', 'Choose the best answer based on each longer conversation.'),
    (38, 41, 'Section 4 - Part C, Questions 38-41', 'C', 'Choose the best answer based on each talk.'),
    (42, 46, 'Section 5 - Part C, Questions 42-46', 'C', 'Choose the best answer based on each talk.'),
    (47, 50, 'Section 6, Part C, Questions 47-50', 'C', 'Choose the best answer based on each talk.')
  ) AS v(start_q, end_q, group_label, part_code, group_instructions)
),
rows_to_copy AS (
  SELECT
    c.target_section_id AS target_section_id,
    q.question_number,
    q.question_type,
    q.question_text,
    jsonb_set(COALESCE(q.question_data, '{}'::jsonb), '{part}', to_jsonb(rm.part_code), true) AS question_data,
    q.correct_answer,
    COALESCE(q.points, 1) AS points,
    q.explanation,
    q.audio_url,
    rm.group_label,
    rm.group_instructions
  FROM questions q
  JOIN cfg c
    ON q.section_id = c.source_section_id
  JOIN range_map rm
    ON q.question_number BETWEEN rm.start_q AND rm.end_q
)
INSERT INTO questions (
  section_id,
  question_number,
  question_type,
  question_text,
  question_data,
  correct_answer,
  points,
  explanation,
  audio_url,
  group_label,
  group_instructions
)
SELECT
  r.target_section_id,
  r.question_number,
  r.question_type,
  r.question_text,
  r.question_data,
  r.correct_answer,
  r.points,
  r.explanation,
  r.audio_url,
  r.group_label,
  r.group_instructions
FROM rows_to_copy r
WHERE NOT EXISTS (
  SELECT 1
  FROM questions q_exist
  WHERE q_exist.section_id = r.target_section_id
    AND q_exist.question_number = r.question_number
);

COMMIT;
```

## 3) Verify target result

```sql
SELECT
  group_label,
  COUNT(*) AS copied_count,
  MIN(question_number) AS min_q,
  MAX(question_number) AS max_q
FROM questions
WHERE section_id = '<TARGET_LISTENING_SECTION_ID>'::uuid
  AND question_number BETWEEN 1 AND 50
GROUP BY group_label
ORDER BY min_q;
```

## 4) One-shot: Create a new TOEFL ITP test and copy Listening questions

```sql
DO $$
DECLARE
  v_source_listening_section_id UUID := '<SOURCE_LISTENING_SECTION_ID>'::uuid;

  v_new_test_id UUID;
  v_new_listening_section_id UUID;
  v_new_structure_section_id UUID;
  v_new_reading_section_id UUID;
BEGIN
  -- 1) Create a new TOEFL ITP test
  INSERT INTO tests (
    title,
    description,
    test_type,
    is_published,
    is_free,
    duration_minutes
  )
  VALUES (
    'TOEFL ITP Practice Test <N>',
    'Auto-created TOEFL ITP test. Listening copied in bulk from source section.',
    'toefl_itp',
    false,
    true,
    115
  )
  RETURNING id INTO v_new_test_id;

  -- 2) Create sections for the new test
  INSERT INTO sections (
    test_id,
    section_type,
    section_order,
    title,
    instructions,
    duration_minutes
  )
  VALUES (
    v_new_test_id,
    'listening',
    1,
    'Listening Comprehension',
    'In this section of the test, you will listen to conversations and talks. Choose the best answer for each question.',
    35
  )
  RETURNING id INTO v_new_listening_section_id;

  INSERT INTO sections (
    test_id,
    section_type,
    section_order,
    title,
    instructions,
    duration_minutes
  )
  VALUES (
    v_new_test_id,
    'structure',
    2,
    'Structure and Written Expression',
    'This section measures your ability to recognize standard written English.',
    25
  )
  RETURNING id INTO v_new_structure_section_id;

  INSERT INTO sections (
    test_id,
    section_type,
    section_order,
    title,
    instructions,
    duration_minutes
  )
  VALUES (
    v_new_test_id,
    'reading',
    3,
    'Reading Comprehension',
    'This section measures your ability to read and understand written English passages.',
    55
  )
  RETURNING id INTO v_new_reading_section_id;

  -- 3) Copy listening questions with your group mapping
  WITH range_map AS (
    SELECT *
    FROM (VALUES
      (1, 30, 'Section 1 - Part A, Questions 1-30', 'A', 'Choose the best answer based on each short conversation.'),
      (31, 34, 'Section 2 - Part B, Questions 31-34', 'B', 'Choose the best answer based on each longer conversation.'),
      (35, 37, 'Section 3 - Part B, Questions 35-37', 'B', 'Choose the best answer based on each longer conversation.'),
      (38, 41, 'Section 4 - Part C, Questions 38-41', 'C', 'Choose the best answer based on each talk.'),
      (42, 46, 'Section 5 - Part C, Questions 42-46', 'C', 'Choose the best answer based on each talk.'),
      (47, 50, 'Section 6 - Part C, Questions 47-50', 'C', 'Choose the best answer based on each talk.')
    ) AS v(start_q, end_q, group_label, part_code, group_instructions)
  )
  INSERT INTO questions (
    section_id,
    question_number,
    question_type,
    question_text,
    question_data,
    correct_answer,
    points,
    explanation,
    audio_url,
    group_label,
    group_instructions
  )
  SELECT
    v_new_listening_section_id,
    q.question_number,
    q.question_type,
    q.question_text,
    jsonb_set(COALESCE(q.question_data, '{}'::jsonb), '{part}', to_jsonb(rm.part_code), true),
    q.correct_answer,
    COALESCE(q.points, 1),
    q.explanation,
    q.audio_url,
    rm.group_label,
    rm.group_instructions
  FROM questions q
  JOIN range_map rm
    ON q.question_number BETWEEN rm.start_q AND rm.end_q
  WHERE q.section_id = v_source_listening_section_id;

  RAISE NOTICE 'Created test id: %', v_new_test_id;
  RAISE NOTICE 'New listening section id: %', v_new_listening_section_id;
  RAISE NOTICE 'New structure section id: %', v_new_structure_section_id;
  RAISE NOTICE 'New reading section id: %', v_new_reading_section_id;
END $$;
```

## Notes

- This template is for PostgreSQL.
- It keeps original `question_number` (1-50).
- It copies `audio_url`, `question_data`, `correct_answer`, and metadata.
- It updates `question_data.part` to `A/B/C` based on your range mapping.
- Duplicate protection is based on `(target section_id, question_number)` in the `WHERE NOT EXISTS` filter.
- In the one-shot block, replace `<SOURCE_LISTENING_SECTION_ID>` and `<N>` before execution.
