-- Migration 014: Add 'structure' to allowed section_types
-- Needed for TOEFL iTP support

ALTER TABLE sections
  DROP CONSTRAINT IF EXISTS sections_section_type_check;

ALTER TABLE sections
  ADD CONSTRAINT sections_section_type_check
  CHECK (section_type IN (
    'listening',
    'reading',
    'writing',
    'speaking',
    'structure'
  ));
