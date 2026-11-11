-- Add audio_url column to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS audio_url TEXT;
