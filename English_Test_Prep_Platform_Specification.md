
English Test Preparation Platform


Complete Technical Specification & Development Guide


# 1. Executive Summary


This document provides a comprehensive specification for developing a web-based English test preparation platform targeting international English proficiency exams: IELTS, TOEFL iBT, TOEFL ITP, and PTE Academic.


# 2. Project Overview


## 2.1 Core Features

- User registration and authentication system
- Full-length practice tests for each exam type
- Section-by-section practice mode
- AI-powered feedback and scoring
- Progress tracking and analytics dashboard
- Subscription management with Midtrans payment gateway

## 2.2 User Journey

1. Visitor browses available tests and views sample questions
2. User registers/signs up for an account
3. User accesses limited free content
4. User subscribes to specific test(s) via Midtrans
5. User takes full tests or practices by section
6. System provides automated scoring and AI feedback
7. User tracks progress through analytics dashboard

# 3. Test Format Specifications


## 3.1 IELTS (Recommended MVP Priority)


Total Duration: 2 hours 45 minutes
Versions: Academic & General Training (same Listening/Speaking, different Reading/Writing)
Scoring: Band scores 0-9 (whole and half bands)


Sections:


## 3.2 TOEFL iBT (New 2026 Format)


Total Duration: Approximately 2 hours
Special Feature: Adaptive testing (2-module format)
Scoring: 1-6 scale (with 0-120 conversion during 2026-2027 transition)


Sections:


⚠️ IMPORTANT: TOEFL iBT requires implementing adaptive testing logic where the second module difficulty adjusts based on first module performance. This adds significant technical complexity.


## 3.3 TOEFL ITP


Total Duration: 2 hours (Level 1)
Format: Paper-based style, multiple choice only
Scoring: 310-677 total score
Note: NO Speaking or Writing sections


Sections:


## 3.4 PTE Academic


Total Duration: 2 hours 15 minutes
Format: Computer-based with AI scoring
Scoring: 10-90 scale
Special Feature: Integrated skills testing (one task tests multiple skills)


Sections:


⚠️ TECHNICAL NOTE: PTE requires advanced speech recognition and AI evaluation systems for automated scoring. Consider using third-party APIs (Google Speech-to-Text, Azure Speech Services) or simplified manual review for MVP.


# 4. Technical Architecture


## 4.1 Recommended Technology Stack


## 4.2 System Architecture Components

- User Interface Layer
- Responsive web application
- Test-taking interface with timer
- Audio player and recorder
- Rich text editor for writing tasks
- Progress dashboard
- Application Layer
- User authentication and authorization
- Test management system
- Scoring engine
- Subscription management
- Payment processing (Midtrans integration)
- Data Layer
- User database (accounts, profiles, subscriptions)
- Test content database (questions, audio files, answer keys)
- User responses and scores
- Analytics and progress tracking
- External Services
- Payment gateway (Midtrans)
- AI services (OpenAI for feedback)
- Speech recognition (Google/Azure)
- Email service (SendGrid, AWS SES)
- Cloud storage (AWS S3)

# 5. Database Schema (Simplified)


Key database tables required:

- Users:
- user_id (PK)
- email
- password_hash
- name
- created_at
- subscription_status
- Subscriptions:
- subscription_id (PK)
- user_id (FK)
- test_type
- status
- start_date
- end_date
- payment_id
- Tests:
- test_id (PK)
- test_type
- test_name
- duration
- sections
- is_free
- Questions:
- question_id (PK)
- test_id (FK)
- section
- question_text
- question_type
- correct_answer
- audio_url
- difficulty
- UserAttempts:
- attempt_id (PK)
- user_id (FK)
- test_id (FK)
- start_time
- end_time
- score
- completion_status
- Responses:
- response_id (PK)
- attempt_id (FK)
- question_id (FK)
- user_answer
- is_correct
- time_spent
- Payments:
- payment_id (PK)
- user_id (FK)
- amount
- status
- midtrans_order_id
- timestamp

# 6. Feature Requirements


## 6.1 User Authentication & Authorization

- Email/password registration and login
- Email verification
- Password reset functionality
- Social login (Google, Facebook) - optional for MVP
- Role-based access (free users vs. subscribed users)
- Session management

## 6.2 Test Taking Interface

- Section navigation (forward only, or allow review depending on test rules)
- Persistent timer display (countdown)
- Auto-save user responses
- Audio playback controls (play once for some sections, replay for others)
- Audio recording for speaking sections (with playback review)
- Rich text editor for writing tasks (word count display)
- Flag questions for review
- Submit test confirmation
- Pause/resume capability (with rules)

## 6.3 Scoring & Feedback System

- Automatic scoring for multiple choice and objective questions
- AI-powered scoring for writing tasks (using GPT-4 or similar)
- AI-powered evaluation for speaking (transcription + evaluation)
- Detailed score breakdown by section
- Band score/score conversion (IELTS: 0-9, TOEFL: 1-6 or 0-120, PTE: 10-90)
- Personalized feedback and improvement suggestions
- Show correct answers after test completion

## 6.4 Progress Tracking & Analytics

- Dashboard showing all test attempts
- Score history and trends (line graphs)
- Section-wise performance analysis
- Strengths and weaknesses identification
- Time spent per section analytics
- Comparison with average scores
- Predicted band/score based on progress

## 6.5 Subscription & Payment

- Test-specific subscription plans (IELTS, TOEFL iBT, TOEFL ITP, PTE)
- All-access subscription option
- Midtrans payment gateway integration
- Support for multiple payment methods (credit card, bank transfer, e-wallets)
- Automatic subscription renewal
- Subscription management (upgrade, downgrade, cancel)
- Payment history and invoices
- Free trial period (optional)

# 7. Development Phases & Timeline


## Phase 1: MVP (4-6 months)


Focus: IELTS test only with core features

- User registration and authentication
- Basic test-taking interface for IELTS (all 4 sections)
- Audio playback for Listening section
- Audio recording for Speaking section
- Text editor for Writing section
- Automatic scoring for Listening and Reading
- Manual/AI-assisted scoring for Writing and Speaking
- Basic score display
- Free tier (1-2 practice tests)
- Subscription system with Midtrans
- Basic progress tracking

## Phase 2: Expansion (3-4 months)


Add TOEFL ITP and enhance features

- Add TOEFL ITP test content and interface
- Enhanced AI feedback for Writing
- Detailed analytics dashboard
- Section-by-section practice mode
- Question bank system
- Community features (forums, Q&A)

## Phase 3: Advanced Features (3-4 months)


Add TOEFL iBT and PTE Academic

- TOEFL iBT with adaptive testing
- PTE Academic with advanced speech recognition
- Mobile-responsive optimization
- Advanced analytics and reporting
- Personalized study plans
- Email notifications and reminders

# 8. Technical Challenges & Solutions


Audio Recording & Playback
Challenge: Browser compatibility and audio quality
Solution: Use MediaRecorder API with fallbacks; test across browsers; save recordings in cloud storage (S3)


Real-time Timer Management
Challenge: Accurate timing with browser tab switching
Solution: Server-side time validation; use Web Workers for background timing; store timestamps in database


AI-Powered Scoring for Writing/Speaking
Challenge: Accuracy and cost of AI evaluation
Solution: Use GPT-4 API with structured prompts; implement caching for common patterns; hybrid approach with human review for premium users


Adaptive Testing (TOEFL iBT)
Challenge: Complex logic for question selection
Solution: Pre-categorize questions by difficulty; implement routing algorithm; test extensively


Large Audio/Video Files
Challenge: Storage and streaming bandwidth
Solution: Use CDN for content delivery; compress audio files; lazy loading


Payment Gateway Integration
Challenge: Security and testing
Solution: Use Midtrans sandbox for development; implement webhook handlers; secure API key storage


# 9. Estimated Costs


Monthly operational costs (after launch):


Development Costs: Hiring developers will vary significantly by location. For reference:
• Freelancer (Indonesia): $500-2,000/month per developer
• Freelancer (Global): $2,000-8,000/month per developer
• Development Agency: $10,000-50,000+ for full project


# 10. Recommended Development Team


For MVP, you could start with 1-2 full-stack developers who can handle both frontend and backend, plus a designer and yourself as project manager.


# 11. Content Creation Requirements


Creating high-quality test content is crucial for your platform's success. You will need to develop or license test materials.


## Content Needed Per Test:


IELTS

- Listening: 10-20 full tests (4 sections each) with audio recordings
- Reading: 30-60 passages with questions
- Writing: 50+ Task 1 prompts (graphs, charts) and Task 2 essay topics
- Speaking: 100+ Part 1 questions, 50+ Part 2 topics, 50+ Part 3 discussion topics

TOEFL ITP

- Listening: 500+ questions with audio
- Structure & Written Expression: 400+ grammar questions
- Reading: 50+ passages with questions

TOEFL iBT

- Similar to IELTS but with adaptive difficulty levels
- Requires categorizing questions by difficulty

PTE Academic

- Integrated tasks requiring audio, video, and text materials
- Speaking prompts with model answers

## Content Sources:

- Create original content (recommended for uniqueness)
- License from existing test prep companies
- Use official sample materials as templates (be careful with copyright)
- Hire language teachers and examiners to create content
- Use AI to generate initial content, then have experts review

# 12. Next Steps for You

1. Review and Refine Requirements
Go through this document carefully and note any changes or additions you want.
2. Create Detailed Wireframes/Mockups
Work with a designer to create visual mockups of key pages: homepage, test interface, dashboard, subscription page.
3. Find Development Team
Post project on platforms like Upwork, Freelancer, or local developer communities. Share this document with potential developers. Request proposals and portfolios.
4. Start Content Creation
Begin developing IELTS test content or identify sources. This can happen in parallel with development.
5. Set Up Business Requirements
Register Midtrans merchant account, set up business entity if needed, create terms of service and privacy policy.
6. Plan Marketing Strategy
While development is ongoing, plan how you'll attract users: SEO, social media, partnerships with language schools.

# 13. Appendix: Key Resources


## Official Test Resources:

- IELTS Official: https://ielts.org
- TOEFL iBT: https://www.ets.org/toefl/test-takers/ibt/about/content.html
- TOEFL ITP: https://www.ets.org/toefl/itp/prepare.html
- PTE Academic: https://www.pearsonpte.com/pte-academic/preparation

## Technical Documentation:

- React.js: https://react.dev
- Node.js: https://nodejs.org
- PostgreSQL: https://www.postgresql.org/docs/
- Midtrans API: https://docs.midtrans.com
- OpenAI API: https://platform.openai.com/docs
- Google Speech-to-Text: https://cloud.google.com/speech-to-text/docs

## Hiring Platforms:

- Upwork: https://www.upwork.com
- Freelancer: https://www.freelancer.com
- Toptal: https://www.toptal.com
- Projects.co.id (Indonesia): https://projects.co.id
- Sribulancer (Indonesia): https://www.sribulancer.com

Document prepared for English Test Preparation Platform development.
