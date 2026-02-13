-- Seed file for TOEFL iTP Practice Test
-- Run this SQL in your database to create a sample test

DO $$
DECLARE
    v_test_id UUID;
    v_listening_section_id UUID;
    v_structure_section_id UUID;
    v_reading_section_id UUID;
BEGIN
    -- 1. Create the Test
    INSERT INTO tests (title, description, test_type, is_published, is_free, duration_minutes)
    VALUES (
        'TOEFL iTP Practice Test 1', 
        'Full-length TOEFL iTP practice test. Includes Listening, Structure & Written Expression, and Reading Comprehension.', 
        'toefl_itp', 
        true, 
        true, 
        115
    )
    RETURNING id INTO v_test_id;

    RAISE NOTICE 'Created Test ID: %', v_test_id;

    -- 2. Create Sections

    -- SECTION 1: LISTENING COMPREHENSION (35 mins)
    INSERT INTO sections (test_id, section_type, section_order, title, instructions, duration_minutes)
    VALUES (
        v_test_id, 
        'listening', 
        1, 
        'Listening Comprehension', 
        'In this section of the test, you will have an opportunity to demonstrate your ability to understand conversations and talks in English. There are three parts to this section, with special directions for each part.', 
        35
    )
    RETURNING id INTO v_listening_section_id;

    -- SECTION 2: STRUCTURE AND WRITTEN EXPRESSION (25 mins)
    INSERT INTO sections (test_id, section_type, section_order, title, instructions, duration_minutes)
    VALUES (
        v_test_id, 
        'structure', 
        2, 
        'Structure and Written Expression', 
        'This section is designed to measure your ability to recognize language that is appropriate for standard written English. There are two types of questions in this section, with special directions for each type.', 
        25
    )
    RETURNING id INTO v_structure_section_id;

    -- SECTION 3: READING COMPREHENSION (55 mins)
    INSERT INTO sections (test_id, section_type, section_order, title, instructions, duration_minutes)
    VALUES (
        v_test_id, 
        'reading', 
        3, 
        'Reading Comprehension', 
        'This section is designed to measure your ability to read and understand short passages similar in topic and style to those that students are likely to encounter in North American universities and colleges.', 
        55
    )
    RETURNING id INTO v_reading_section_id;

    -- 3. Create Questions

    -- LISTENING :: PART A (Short Conversations)
    INSERT INTO questions (section_id, question_number, question_type, question_text, question_data, correct_answer, points, audio_url)
    VALUES (
        v_listening_section_id,
        1,
        'multiple_choice',
        'What does the woman imply?',
        '{
            "options": [
                {"key": "A", "text": "She is too busy to go."},
                {"key": "B", "text": "She does not want to go."},
                {"key": "C", "text": "She will go later."},
                {"key": "D", "text": "She has already gone."}
            ],
            "part": "A"
        }',
        '{"answer": "A"}',
        1,
        'https://example.com/audio/listening_q1.mp3' -- Replace with real URL
    );

    -- STRUCTURE :: PART A (Sentence Completion)
    INSERT INTO questions (section_id, question_number, question_type, question_text, question_data, correct_answer, points)
    VALUES (
        v_structure_section_id,
        1,
        'multiple_choice',
        '_______ the end of the 19th century, scientists had begun to understand the structure of the atom.',
        '{
            "options": [
                {"key": "A", "text": "By"},
                {"key": "B", "text": "In"},
                {"key": "C", "text": "From"},
                {"key": "D", "text": "Since"}
            ],
            "part": "A"
        }',
        '{"answer": "A"}',
        1
    );

    -- STRUCTURE :: PART B (Written Expression - Error Identification)
    -- Using <u> tags for underlined portions. The user must select the incorrect part.
    INSERT INTO questions (section_id, question_number, question_type, question_text, question_data, correct_answer, points)
    VALUES (
        v_structure_section_id,
        16, -- Part B usually starts around Q16
        'multiple_choice',
        'Select the underlined word or phrase that serves as the error.',
        '{
            "options": [
                {"key": "A", "text": "A"},
                {"key": "B", "text": "B"},
                {"key": "C", "text": "C"},
                {"key": "D", "text": "D"}
            ],
            "text_display": "The <u>(A) study</u> of <u>(B) these</u> animals <u>(C) have</u> shown that they are <u>(D) remarkably</u> intelligent.",
            "part": "B"
        }',
        '{"answer": "C"}', -- 'have' should be 'has' (subject is 'study')
        1
    );

    -- READING :: Passage 1
    -- We store the passage either in the section (if one passage per section part) or implied.
    -- For TOEFL Reading, usually 5 passages. We can put passage text in `question_text` or a `groupLabel` context if shared.
    -- Or update `sections` to have multiple parts if needed, but usually it's one section with multiple passages.
    -- For simplicity here, we assume standard MCQ format sharing a passage context.
    
    INSERT INTO questions (section_id, question_number, question_type, question_text, question_data, correct_answer, points)
    VALUES (
        v_reading_section_id,
        1,
        'multiple_choice',
        'According to the passage, what is the main characteristic of the Blue Whale?',
        '{
            "options": [
                {"key": "A", "text": "It is the smallest mammal."},
                {"key": "B", "text": "It is the largest animal ever known."},
                {"key": "C", "text": "It lives only in the Atlantic."},
                {"key": "D", "text": "It is extinct."}
            ],
            "passage_text": "The Blue Whale is the largest animal known to have ever lived on Earth. These magnificent marine mammals rule the oceans at up to 100 feet long and upwards of 200 tons...",
            "passage_title": "The Blue Whale"
        }',
        '{"answer": "B"}',
        1
    );

END $$;
