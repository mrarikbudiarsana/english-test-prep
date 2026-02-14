-- Migration 022: Collapse MCQ option text duplicated with punctuation separators
-- Example: "She lost the calculator.. She lost the calculator."

CREATE OR REPLACE FUNCTION normalize_mcq_option_text_v3(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  normalized TEXT := COALESCE(input_text, '');
BEGIN
  normalized := btrim(regexp_replace(normalized, '\s+', ' ', 'g'));

  -- Exact duplicate: "X X"
  IF normalized ~* '^(.+)\s+\1$' THEN
    normalized := regexp_replace(normalized, '^(.+)\s+\1$', '\1', 1, 1, 'i');
    normalized := btrim(normalized);
  END IF;

  -- Punctuation-separated duplicate: "X.. X." / "X! X"
  IF normalized ~* '^(.+?)[.!?]+\s+\1[.!?]*$' THEN
    normalized := regexp_replace(normalized, '^(.+?)[.!?]+\s+\1[.!?]*$', '\1', 1, 1, 'i');
    normalized := btrim(normalized);
  END IF;

  RETURN normalized;
END;
$$;

WITH fixed AS (
  SELECT
    q.id,
    jsonb_agg(
      jsonb_set(
        opt.value,
        '{text}',
        to_jsonb(normalize_mcq_option_text_v3(opt.value->>'text')),
        false
      )
      ORDER BY opt.ordinality
    ) AS normalized_options
  FROM questions q
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(q.question_data->'options', '[]'::jsonb)) WITH ORDINALITY AS opt(value, ordinality)
  WHERE q.question_type = 'multiple_choice'
  GROUP BY q.id
)
UPDATE questions q
SET question_data = jsonb_set(q.question_data, '{options}', fixed.normalized_options, false)
FROM fixed
WHERE q.id = fixed.id
  AND q.question_data->'options' IS DISTINCT FROM fixed.normalized_options;

DROP FUNCTION normalize_mcq_option_text_v3(TEXT);
