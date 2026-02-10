# Question Grouping for IELTS Format

## Overview

The question editor now supports grouping related questions with shared instructions, matching the standard IELTS test format where multiple questions (e.g., "Questions 1-7") share the same instructions.

## What Was Added

### Database Changes
- Added `group_label` field to questions table (e.g., "Questions 1-7")
- Added `group_instructions` field for shared instructions within a group
- Migration `009_add_question_groups.sql` has been applied

### Backend Updates
- Question model now includes `groupLabel` and `groupInstructions` fields
- API endpoints support creating and updating questions with grouping

### Frontend Updates
- Question Editor UI now has a "Question Grouping" section
- Questions with the same group label will display group instructions once
- Admin interface shows group labels for questions
- New `QuestionGroup` component for rendering grouped questions

## How to Use

### Creating Grouped Questions (Admin)

1. **Navigate to a section** in the admin panel
2. **Add or edit a question**
3. **Fill in the Question Grouping section** (optional):
   - **Group Label**: e.g., "Questions 1-7" or "Questions 8-13"
   - **Group Instructions**: The shared instructions for all questions in this group

#### Example: IELTS Reading Completion Questions

**Question 1-7:**
- Group Label: `Questions 1-7`
- Group Instructions:
  ```
  Complete the notes below.
  Choose ONE WORD ONLY from the passage for each answer.
  Write your answers in boxes on your answer sheet.
  ```
- Question Text: (Individual question specific text)
- Question Type: Completion
- Context: "The capital of France is _____, which is known for the Eiffel Tower."

**Question 8-13:**
- Group Label: `Questions 8-13`
- Group Instructions:
  ```
  Do the following statements agree with the information given in Reading Passage?
  In boxes on your answer sheet, write
  TRUE if the statement agrees with the information
  FALSE if the statement contradicts the information
  NOT GIVEN if there is no information on this
  ```
- Question Text: (Individual statement)
- Question Type: True/False/Not Given
- Statement: "Georgia O'Keeffe's style was greatly influenced by the changing fashions in art over the seven decades of her career."

### Best Practices

1. **Use the same Group Label** for all questions that belong together
2. **Write clear group instructions** that apply to all questions in the group
3. **Questions without grouping** still work as before (leave fields empty)
4. **Group numbering**: Match the actual question numbers (e.g., if questions 1-7 are grouped, use "Questions 1-7")

## Components Reference

### QuestionGroup Component
Located at: `frontend/src/components/test/QuestionGroup.tsx`

This component:
- Renders multiple related questions together
- Shows group instructions once at the top
- Can be used in test-taking or review interfaces

### Helper Function: `groupQuestions()`
Groups an array of questions by their `groupLabel`:
```typescript
import { groupQuestions } from '@/components/test/QuestionGroup';

const questionGroups = groupQuestions(allQuestions);
// Returns: Question[][] - array of question groups
```

## Migration Status

✅ Database migration applied successfully
- Migration file: `backend/migrations/009_add_question_groups.sql`
- Tables updated: `questions`
- New columns: `group_label`, `group_instructions`

## Screenshots Reference

Your uploaded screenshots show the standard IELTS format:
- **Image 1**: Section editor with "Add Question" button
- **Image 2**: Question editor modal with completion type settings
- **Image 3**: Completion questions 1-7 with shared instructions and note-taking format
- **Image 4**: True/False/Not Given questions 8-13 with their own shared instructions

The implementation now supports this exact format! 🎉
