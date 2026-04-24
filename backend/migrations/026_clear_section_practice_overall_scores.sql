-- Section practice attempts report section scaled scores only.
-- Clear stale full-score conversions from older section-practice rows.
UPDATE attempts
SET overall_score = NULL,
    updated_at = NOW()
WHERE mode = 'section_practice'
  AND overall_score IS NOT NULL;
