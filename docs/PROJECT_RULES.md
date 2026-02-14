# Project Rules - English Test Prep Platform

## Tech Stack
- Frontend: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Backend: Express + TypeScript + PostgreSQL
- Auth: Firebase Auth (client + Admin SDK)
- Payments: Midtrans Snap
- AI: OpenAI API (GPT-5 mini for writing/speaking scoring, Whisper for transcription)
- Storage: Cloudinary (audio upload)

## Project Structure
- `frontend/` - Next.js app with `(auth)`, `(main)`, admin route groups
- `backend/` - Express API with `routes -> controllers -> services -> models` layers
- 8 database tables: `users`, `tests`, `sections`, `questions`, `attempts`, `responses`, `subscriptions`, `payments`
- 12 sections per IELTS test: Listening 1-4, Reading 1-3, Writing 1-2, Speaking 1-3

## CRITICAL: Test Isolation Rule
Each exam type (IELTS, TOEFL iBT, TOEFL ITP) is completely independent, even when sections share the same format (for example, MCQ).
- Editing Reading for TOEFL ITP must never affect IELTS Reading, even if both use MCQ
- Each exam type has its own scoring logic, section structure, UI components, and backend handling
- Do not share or reuse components/logic across exam types unless explicitly asked
- Always check `exam_type` before modifying anything
- When fixing a bug or adding a feature for one exam type, scope all changes to that type only

## Key Coding Patterns
- React 19 / Next.js 16: `useRef` requires an initial value
- React 19: Use `React.ReactNode` instead of `JSX.Element` for component types
- `midtrans-client` has no TypeScript types - use `any` for `snap`/`coreApi` exports
