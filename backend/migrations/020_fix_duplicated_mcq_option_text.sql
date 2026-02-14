-- Migration 020: Normalize MCQ option text saved in question_data
-- Fixes cases where option labels are embedded in text (e.g., "A) ...")
-- and where the same sentence is accidentally duplicated.

CREATE OR REPLACE FUNCTION normalize_mcq_option_text(input_text TEXT, option_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  normalized TEXT := COALESCE(input_text, '');
  escaped_key TEXT := COALESCE(option_key, '');
BEGIN
  -- Remove leading option label if present: "(A)", "[A]", "A)", "A.", "A:", "A-"
  IF escaped_key <> '' THEN
    normalized := regexp_replace(normalized, '^\s*\(\s*' || escaped_key || '\s*\)\s*[).:\-]?\s*', '', 'i');
    normalized := regexp_replace(normalized, '^\s*\[\s*' || escaped_key || '\s*\]\s*[).:\-]?\s*', '', 'i');
    normalized := regexp_replace(normalized, '^\s*' || escaped_key || '\s*[).:\-]\s*', '', 'i');
  END IF;

  -- Normalize whitespace
  normalized := btrim(regexp_replace(normalized, '\s+', ' ', 'g'));

  -- If full sentence was duplicated (e.g., "Text. Text"), keep one.
  IF normalized ~* '^(.+)\s+\1$' THEN
    normalized := regexp_replace(normalized, '^(.+)\s+\1$', '\1', 1, 1, 'i');
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
        to_jsonb(normalize_mcq_option_text(opt.value->>'text', opt.value->>'key')),
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

DROP FUNCTION normalize_mcq_option_text(TEXT, TEXT);
