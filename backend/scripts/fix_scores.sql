-- Helper function to map Listening Raw Score to Scaled Band
CREATE OR REPLACE FUNCTION get_listening_band(raw_score INT) RETURNS INT AS $$
BEGIN
  RETURN CASE 
    WHEN raw_score >= 50 THEN 68
    WHEN raw_score = 49 THEN 67
    WHEN raw_score = 48 THEN 66
    WHEN raw_score = 47 THEN 65
    WHEN raw_score >= 45 THEN 63
    WHEN raw_score >= 43 THEN 61
    WHEN raw_score >= 41 THEN 59
    WHEN raw_score >= 39 THEN 57
    WHEN raw_score >= 37 THEN 55
    WHEN raw_score >= 35 THEN 54
    WHEN raw_score >= 33 THEN 52
    WHEN raw_score >= 31 THEN 51
    WHEN raw_score >= 29 THEN 50
    WHEN raw_score >= 27 THEN 49
    WHEN raw_score >= 25 THEN 48
    WHEN raw_score >= 23 THEN 47
    WHEN raw_score >= 21 THEN 46
    WHEN raw_score >= 19 THEN 45
    WHEN raw_score >= 17 THEN 44
    WHEN raw_score >= 15 THEN 43
    WHEN raw_score >= 13 THEN 42
    WHEN raw_score >= 11 THEN 41
    WHEN raw_score >= 9 THEN 39
    WHEN raw_score >= 7 THEN 37
    WHEN raw_score >= 5 THEN 35
    WHEN raw_score >= 3 THEN 33
    ELSE 31
  END;
END;
$$ LANGUAGE plpgsql;

-- Helper function to map Structure Raw Score to Scaled Band
CREATE OR REPLACE FUNCTION get_structure_band(raw_score INT) RETURNS INT AS $$
BEGIN
  RETURN CASE 
    WHEN raw_score >= 40 THEN 68
    WHEN raw_score = 39 THEN 67
    WHEN raw_score = 38 THEN 65
    WHEN raw_score = 37 THEN 63
    WHEN raw_score = 36 THEN 61
    WHEN raw_score = 35 THEN 60
    WHEN raw_score = 34 THEN 58
    WHEN raw_score = 33 THEN 57
    WHEN raw_score = 32 THEN 56
    WHEN raw_score = 31 THEN 55
    WHEN raw_score = 30 THEN 54
    WHEN raw_score = 29 THEN 53
    WHEN raw_score = 28 THEN 52
    WHEN raw_score = 27 THEN 51
    WHEN raw_score = 26 THEN 50
    WHEN raw_score = 25 THEN 49
    WHEN raw_score = 24 THEN 48
    WHEN raw_score = 23 THEN 47
    WHEN raw_score >= 21 THEN 46
    WHEN raw_score >= 19 THEN 45
    WHEN raw_score >= 17 THEN 44
    WHEN raw_score >= 15 THEN 43
    WHEN raw_score >= 13 THEN 41
    WHEN raw_score >= 11 THEN 40
    WHEN raw_score >= 9 THEN 38
    WHEN raw_score >= 7 THEN 37
    WHEN raw_score >= 5 THEN 35
    WHEN raw_score = 4 THEN 33
    ELSE 31
  END;
END;
$$ LANGUAGE plpgsql;

-- Helper function to map Reading Raw Score to Scaled Band
CREATE OR REPLACE FUNCTION get_reading_band(raw_score INT) RETURNS INT AS $$
BEGIN
  RETURN CASE 
    WHEN raw_score >= 50 THEN 67
    WHEN raw_score = 49 THEN 66
    WHEN raw_score = 48 THEN 65
    WHEN raw_score = 47 THEN 63
    WHEN raw_score = 46 THEN 61
    WHEN raw_score = 45 THEN 60
    WHEN raw_score = 44 THEN 59
    WHEN raw_score = 43 THEN 58
    WHEN raw_score = 42 THEN 57
    WHEN raw_score = 41 THEN 56
    WHEN raw_score = 40 THEN 55
    WHEN raw_score = 39 THEN 54
    WHEN raw_score = 38 THEN 54
    WHEN raw_score = 37 THEN 53
    WHEN raw_score = 36 THEN 52
    WHEN raw_score = 35 THEN 52
    WHEN raw_score = 34 THEN 51
    WHEN raw_score = 33 THEN 50
    WHEN raw_score = 32 THEN 49
    WHEN raw_score = 31 THEN 48
    WHEN raw_score >= 29 THEN 48
    WHEN raw_score >= 26 THEN 47
    WHEN raw_score >= 23 THEN 46
    WHEN raw_score >= 20 THEN 44
    WHEN raw_score >= 16 THEN 41
    WHEN raw_score >= 12 THEN 37
    WHEN raw_score >= 8 THEN 34
    ELSE 31
  END;
END;
$$ LANGUAGE plpgsql;

-- 1. Create a temporary table to hold evaluated answers
CREATE TEMP TABLE temp_evaluated_responses AS
SELECT 
  r.attempt_id,
  s.section_type,
  -- Basic JSON string unwrap for standard multiple choice cases where answer might be wrapped in quotes
  CASE WHEN (TRIM(BOTH '"' FROM r.answer_data::text) = q.correct_answer) THEN COALESCE(NULLIF(q.points, 0), 1) ELSE 0 END AS derived_points
FROM responses r
JOIN questions q ON q.id = r.question_id
JOIN sections s ON s.id = q.section_id
JOIN attempts a ON a.id = r.attempt_id
WHERE a.status IN ('completed', 'in_progress');

-- 2. Aggregate raw scores by attempt and section type
CREATE TEMP TABLE temp_raw_scores AS
SELECT 
  attempt_id,
  section_type,
  SUM(derived_points) as final_raw
FROM temp_evaluated_responses
GROUP BY attempt_id, section_type;

-- 3. Update the Listening scores
UPDATE attempts a
SET 
  listening_raw = ts.final_raw, 
  listening_score = get_listening_band(ts.final_raw),
  status = CASE WHEN a.status = 'in_progress' AND a.mode = 'section_practice' THEN 'completed' ELSE a.status END,
  completed_at = CASE WHEN a.status = 'in_progress' AND a.mode = 'section_practice' THEN NOW() ELSE a.completed_at END
FROM temp_raw_scores ts
WHERE a.id = ts.attempt_id AND ts.section_type = 'listening'
AND (a.listening_score IS NULL OR a.listening_score = 0 OR a.status = 'in_progress');

-- 4. Update the Structure scores
UPDATE attempts a
SET 
  structure_raw = ts.final_raw, 
  structure_score = get_structure_band(ts.final_raw)
FROM temp_raw_scores ts
WHERE a.id = ts.attempt_id AND ts.section_type = 'structure'
AND (a.structure_score IS NULL OR a.structure_score = 0 OR a.status = 'in_progress');

-- 5. Update the Reading scores
UPDATE attempts a
SET 
  reading_raw = ts.final_raw, 
  reading_score = get_reading_band(ts.final_raw),
  status = CASE WHEN a.status = 'in_progress' THEN 'completed' ELSE a.status END,
  completed_at = CASE WHEN a.status = 'in_progress' THEN NOW() ELSE a.completed_at END
FROM temp_raw_scores ts
WHERE a.id = ts.attempt_id AND ts.section_type = 'reading'
AND (a.reading_score IS NULL OR a.reading_score = 0 OR a.status = 'in_progress');

-- 6. Recalculate and update the overall score for full exams
UPDATE attempts a
SET overall_score = ROUND(
  (
    COALESCE(a.listening_score, 31) + 
    COALESCE(a.structure_score, 31) + 
    COALESCE(a.reading_score, 31)
  ) * 10.0 / 3.0
)
WHERE a.mode = 'full'
AND (a.overall_score IS NULL OR a.reading_score IS NOT NULL);

-- 7. Clean up functions and temp tables
DROP FUNCTION get_listening_band(INT);
DROP FUNCTION get_structure_band(INT);
DROP FUNCTION get_reading_band(INT);
DROP TABLE temp_evaluated_responses;
DROP TABLE temp_raw_scores;
