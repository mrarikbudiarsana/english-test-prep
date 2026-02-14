-- Migration 021: Remove MCQ import artifacts like "Option (A) ... . text"

CREATE OR REPLACE FUNCTION normalize_mcq_option_text_v2(input_text TEXT, option_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  normalized TEXT := COALESCE(input_text, '');
  key_text TEXT := COALESCE(option_key, '');
  had_option_prefix BOOLEAN := FALSE;
BEGIN
  IF normalized ~* '^\s*option\s*\(\s*[a-z0-9]+\s*\)\s*' THEN
    had_option_prefix := TRUE;
  END IF;

  -- Remove leading import artifact: "Option (A) "
  normalized := regexp_replace(normalized, '^\s*option\s*\(\s*[a-z0-9]+\s*\)\s*', '', 'i');

  -- Remove leading option key labels if present.
  IF key_text <> '' THEN
    normalized := regexp_replace(normalized, '^\s*\(\s*' || key_text || '\s*\)\s*[).:\-]?\s*', '', 'i');
    normalized := regexp_replace(normalized, '^\s*\[\s*' || key_text || '\s*\]\s*[).:\-]?\s*', '', 'i');
    normalized := regexp_replace(normalized, '^\s*' || key_text || '\s*[).:\-]\s*', '', 'i');
  END IF;

  -- Normalize whitespace
  normalized := btrim(regexp_replace(normalized, '\s+', ' ', 'g'));

  -- Remove trailing ". text" artifact when source had Option(...) prefix
  IF had_option_prefix THEN
    normalized := regexp_replace(normalized, '(?:\s*[.]\s*)?text\s*$', '', 'i');
    normalized := btrim(normalized);
  END IF;

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
        to_jsonb(normalize_mcq_option_text_v2(opt.value->>'text', opt.value->>'key')),
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

DROP FUNCTION normalize_mcq_option_text_v2(TEXT, TEXT);
