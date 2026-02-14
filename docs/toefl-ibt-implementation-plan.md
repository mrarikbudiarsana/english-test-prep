# TOEFL iBT Implementation Plan (Complete)

## 1. Objective and Scope

Build full support for the updated TOEFL iBT delivery model across authoring, test delivery, scoring, reporting, and operations, including:

- Reading and Listening multistage adaptive testing (MST)
- Writing and Speaking task families
- Raw score, band score (1-6 in 0.5 steps), and optional concordance outputs
- Media-driven listening/speaking tasks (audio/video/image)
- Blueprint validation to enforce official task-count and score constraints

Out of scope (initial release):

- High-stakes proctoring integrations
- Psychometric recalibration engine beyond fixed mapping tables
- Human-rater workflow tooling (only API-ready handoff fields are included)

## 2. Target Test Model

### 2.1 Section and Raw Ranges

- Reading: raw 0-30
- Listening: raw 0-30
- Writing: raw 0-20
- Speaking: raw 0-55
- Overall: 1-6 band (average policy defined in scoring section)

### 2.2 Task Families

Reading:
- Complete the Words
- Read in Daily Life
- Read an Academic Passage

Listening:
- Listen and Choose a Response
- Listen to a Conversation
- Listen to an Announcement
- Listen to an Academic Talk

Writing:
- Build a Sentence (10 items, raw 0-10)
- Write an Email (1 task, raw 0-5)
- Write for an Academic Discussion (1 task, raw 0-5)

Speaking:
- Listen and Repeat (7 prompts, raw 0-35)
- Take an Interview (4 prompts, raw 0-20)

## 3. Product Requirements

### 3.1 Authoring (Admin)

Must support:
- Test blueprint declaration and enforcement
- Section/task-specific templates
- Prompt-level media uploads (audio/video/image where applicable)
- Validation hints and hard errors before publish
- Preview mode emulating test-taker UI and adaptive flow

### 3.2 Test Delivery (Candidate)

Must support:
- Section timers and task-level response timers
- One-time playback rules where required (e.g., Listen and Repeat)
- Adaptive routing for Reading/Listening (Stage 1 -> Stage 2 upper/lower)
- Robust autosave and resume
- Accessibility baseline (keyboard navigation, visible focus, alt text)

### 3.3 Scoring and Reporting

Must support:
- Objective auto-scoring for closed-response items
- Writing/speaking score pipeline (AI/hybrid/manual-ready)
- Section raw -> band conversion tables
- Overall band calculation policy
- Dual score display policy:
  - Primary: section and overall `1-6` band
  - Companion display: section `0-30` and overall `0-120`
- MyBest policy (highest valid section scores across eligible date window)
- CEFR comparison table mapping by overall/section band

## 4. Architecture Changes

## 4.1 Domain Additions

Add explicit entities:
- `test_blueprint`
- `section_module`
- `adaptive_path`
- `task_instance`
- `item_instance`
- `media_asset`
- `score_profile`

Rationale:
- Current generic section/question model is insufficient for MST and mixed media prompt orchestration.

### 4.2 Backward Compatibility

- Keep current question model operational for existing IELTS/TOEFL ITP content.
- Introduce `deliveryModel: 'legacy' | 'toefl_ibt_2026'` at test level.
- Gate new UI/validation/scoring rules by `deliveryModel`.
- Hard isolation rule: `toefl_ibt_2026` code paths must never execute for `academic`, `general_training`, or `toefl_itp` tests.
- Hard isolation rule: no shared style/token overrides; IELTS/TOEFL ITP pages must render with existing components and CSS classes unchanged.
- Hard isolation rule: no mutation of existing IELTS/TOEFL ITP scoring formulas, mappings, timers, section order, or submission logic.
- Hard isolation rule: no schema migration may rewrite legacy test data; only additive columns/tables are allowed.

## 5. Data Model and Contracts

### 5.1 Core Enums

- `test_type`: include `toefl_ibt`
- `delivery_model`: `legacy`, `toefl_ibt_2026`
- `section_type`: `reading`, `listening`, `writing`, `speaking`
- `task_type`:
  - Reading: `complete_words`, `read_daily_life`, `read_academic_passage`
  - Listening: `listen_choose_response`, `listen_conversation`, `listen_announcement`, `listen_academic_talk`
  - Writing: `build_sentence`, `write_email`, `academic_discussion`
  - Speaking: `listen_repeat`, `take_interview`
- `media_type`: `audio`, `video`, `image`
- `item_scoring_type`: `objective`, `rubric`

### 5.2 Blueprint JSON (Test-Level)

```json
{
  "deliveryModel": "toefl_ibt_2026",
  "sections": {
    "reading": {
      "rawMax": 30,
      "mst": {
        "stage1": 20,
        "stage2": 15,
        "paths": ["lower", "upper"],
        "taskMix": {
          "easyPath": { "complete_words": 20, "read_daily_life": 10, "read_academic_passage": 5 },
          "hardPath": { "complete_words": 20, "read_daily_life": 5, "read_academic_passage": 10 }
        }
      }
    },
    "listening": {
      "rawMax": 30,
      "mst": {
        "stage1": 20,
        "stage2": 15,
        "paths": ["lower", "upper"],
        "taskMix": {
          "easyPath": {
            "listen_choose_response": 15,
            "listen_conversation": 8,
            "listen_announcement": 8,
            "listen_academic_talk": 4
          },
          "hardPath": {
            "listen_choose_response": 11,
            "listen_conversation": 8,
            "listen_announcement": 4,
            "listen_academic_talk": 12
          }
        }
      }
    },
    "writing": {
      "rawMax": 20,
      "tasks": {
        "build_sentence": { "count": 10, "rawMax": 10 },
        "write_email": { "count": 1, "rawMax": 5 },
        "academic_discussion": { "count": 1, "rawMax": 5 }
      }
    },
    "speaking": {
      "rawMax": 55,
      "tasks": {
        "listen_repeat": { "count": 7, "rawMax": 35 },
        "take_interview": { "count": 4, "rawMax": 20 }
      }
    }
  }
}
```

### 5.3 Item Payload Contracts

#### 5.3.1 Reading Complete the Words (multi-blank)

```json
{
  "taskType": "complete_words",
  "prompt": {
    "textTemplate": "We ____ from drawings ...",
    "blanks": [
      { "id": "b1", "answer": "know", "accepted": ["know"], "caseSensitive": false },
      { "id": "b2", "answer": "about", "accepted": ["about"], "caseSensitive": false }
    ]
  },
  "scoring": { "type": "objective", "pointsPerBlank": 1 }
}
```

#### 5.3.2 Listening + MCQ with media card

```json
{
  "taskType": "listen_choose_response",
  "prompt": {
    "stem": "What does the woman imply ...",
    "media": [{ "type": "image", "url": "..." }],
    "audio": { "url": "...", "playbackPolicy": "once" },
    "options": [
      { "key": "A", "text": "See a play" },
      { "key": "B", "text": "Change her clothes" },
      { "key": "C", "text": "Go shopping" },
      { "key": "D", "text": "Eat dinner" }
    ],
    "correct": "A"
  },
  "scoring": { "type": "objective", "points": 1 }
}
```

#### 5.3.3 Writing Build a Sentence

```json
{
  "taskType": "build_sentence",
  "prompt": {
    "context": "What was the highlight of your trip?",
    "wordBank": ["were", "the", "was", "old", "city", "showed", "us", "around", "who", "tour", "guides"],
    "targetSlots": 4,
    "acceptedPatterns": [
      "The tour guides who showed us around the old city were fantastic."
    ]
  },
  "scoring": { "type": "objective", "points": 1 }
}
```

#### 5.3.4 Writing Email

```json
{
  "taskType": "write_email",
  "prompt": {
    "to": "editor@sunshinepoetrymagazine.com",
    "subject": "Problem using submission form",
    "instructions": [
      "Tell the editor what you like about the new magazine.",
      "Describe the problem you experienced.",
      "Ask about the status of your submissions."
    ],
    "minWords": 100
  },
  "scoring": {
    "type": "rubric",
    "rawMax": 5,
    "dimensions": ["task_fulfillment", "organization", "language_use"]
  }
}
```

#### 5.3.5 Writing Academic Discussion

```json
{
  "taskType": "academic_discussion",
  "prompt": {
    "professorPost": "Should high school students be required to volunteer hours?",
    "peerPosts": [
      { "author": "Claire", "text": "I think ..." },
      { "author": "Andrew", "text": "I don't think ..." }
    ],
    "minWords": 100
  },
  "scoring": {
    "type": "rubric",
    "rawMax": 5,
    "dimensions": ["position", "development", "language_use"]
  }
}
```

#### 5.3.6 Speaking Listen and Repeat

```json
{
  "taskType": "listen_repeat",
  "prompt": {
    "scenarioImageUrl": "...",
    "segments": [
      { "id": "s1", "audioUrl": "...", "maxResponseSeconds": 8 },
      { "id": "s2", "audioUrl": "...", "maxResponseSeconds": 10 }
    ],
    "playbackPolicy": "once"
  },
  "scoring": {
    "type": "rubric",
    "rawMax": 5,
    "dimensions": ["accuracy", "intelligibility", "prosody"]
  }
}
```

#### 5.3.7 Speaking Take an Interview

```json
{
  "taskType": "take_interview",
  "prompt": {
    "interviewerMedia": { "type": "video", "url": "..." },
    "questions": [
      { "id": "q1", "mediaUrl": "...", "responseSeconds": 45 },
      { "id": "q2", "mediaUrl": "...", "responseSeconds": 45 }
    ]
  },
  "scoring": {
    "type": "rubric",
    "rawMax": 5,
    "dimensions": ["coherence", "fluency", "vocabulary", "grammar", "pronunciation"]
  }
}
```

## 6. Database Migration Plan

### 6.1 New Columns/Tables

- `tests`
  - `delivery_model VARCHAR(40) NOT NULL DEFAULT 'legacy'`
  - `blueprint_json JSONB NULL`

- `sections`
  - `module_stage SMALLINT NULL` (1 or 2 for MST sections)
  - `module_path VARCHAR(10) NULL` (`upper`, `lower`)
  - `task_type VARCHAR(50) NULL` (for writing/speaking task blocks)

- `questions` (or `items` if normalized)
  - `task_type VARCHAR(50) NULL`
  - `item_payload JSONB NOT NULL DEFAULT '{}'::jsonb`
  - `media_assets JSONB NULL`
  - `is_scored BOOLEAN NOT NULL DEFAULT true`

- `attempts`
  - `reading_path VARCHAR(10) NULL`
  - `listening_path VARCHAR(10) NULL`
  - `reading_raw SMALLINT`
  - `listening_raw SMALLINT`
  - `writing_raw SMALLINT`
  - `speaking_raw SMALLINT`
  - `reading_band DECIMAL(2,1)`
  - `listening_band DECIMAL(2,1)`
  - `writing_band DECIMAL(2,1)`
  - `speaking_band DECIMAL(2,1)`
  - `overall_band DECIMAL(2,1)`
  - `reading_score_30 SMALLINT NULL`
  - `listening_score_30 SMALLINT NULL`
  - `writing_score_30 SMALLINT NULL`
  - `speaking_score_30 SMALLINT NULL`
  - `overall_score_120 SMALLINT NULL`
  - `score_mapping_version VARCHAR(20) NOT NULL DEFAULT 'toefl_ibt_2026_v1'`
  - `cefr_level VARCHAR(4) NULL`
  - `score_reportable BOOLEAN NOT NULL DEFAULT true`
  - `valid_until DATE NULL`

- `responses`
  - `response_payload JSONB`
  - `play_count SMALLINT DEFAULT 0`
  - `response_duration_ms INTEGER`
  - `scored_points DECIMAL(5,2)`

### 6.2 Migration Sequencing

1. Add non-breaking columns and new tables
2. Backfill defaults for existing rows
3. Add new check constraints/enums
4. Deploy read-compatible backend
5. Deploy write paths for new model
6. Enable admin creation for `toefl_ibt_2026`
7. Run legacy integrity checks to confirm IELTS/TOEFL ITP outputs are byte-for-byte equivalent for representative fixtures

## 7. Adaptive Engine (Reading/Listening MST)

### 7.1 Routing Policy

- Stage 1 presents 20 scored items (+ optional unscored extras)
- Compute stage1_theta_proxy from scored responses
- Route to Stage 2 `upper` or `lower` path based on cut score

Initial cut-score policy:
- Configurable threshold per section in `blueprint_json`
- Default: route upper if stage1 percent >= 60%

### 7.2 Path Assembly Rules

- Pre-authored Stage 2 pools tagged by `module_path`
- Pull exactly 15 scored items for path
- Ensure required task-type quotas are satisfied
- Optional insertion of unscored items with `is_scored=false`

### 7.3 Delivery Constraints

- No backward path switching once Stage 2 starts
- Autosave after each item submission
- Recovery on reconnect must reconstruct exact selected path and item order

## 8. Scoring Design

### 8.1 Objective Scoring

- MCQ/single blank: binary 0/1 per scored item
- Multi-blank cloze: per-blank scoring with configurable partial credit
- Sum to section raw, cap at section `rawMax`

### 8.2 Writing/Speaking Scoring

- Store rubric dimension subscores and final raw per task
- Aggregate writing raw: `build_sentence + write_email + academic_discussion`
- Aggregate speaking raw: sum task raws to max 55

### 8.3 Raw -> Band Conversion

- Persist conversion tables in config module or DB table `score_mappings`
- Apply section-specific mapping bands (1-6, 0.5 increments)
- Compute overall band from section bands:
  - default: arithmetic mean
  - rounding: nearest 0.5
  - policy configurable

### 8.4 Concordance Output

Companion display (always for score reports in this model):
- Do not infer `0-30` from band midpoint at runtime.
- Derive section `0-30` from an official score mapping table keyed by section raw score and mapping version.
- Derive overall `0-120` as the sum of the four section `0-30` values when all four sections are reportable.
- If one or more sections are missing/not administered, set `overall_score_120 = NULL` and display section scores only.
- Store provenance via `score_mapping_version` with every scored attempt.

### 8.5 Report Semantics (Aligned with Score Report)

- Authoritative reported score family: band scale (`1-6`, step `0.5`) for each section and overall.
- Companion reported score family: section `0-30` and overall `0-120`.
- CEFR comparison is shown using the active ETS mapping table for the same `score_mapping_version`.
- Report date is explicit and immutable once generated.

MyBest logic:
- Compute MyBest as highest valid section scores from all valid attempts up to the report date.
- Validity window default: last 2 years from report date.
- Exclude expired attempts and non-reportable attempts.
- For administrations before January 21, 2026, apply the configured legacy-to-updated concordance bridge before MyBest aggregation.

Rounding and consistency rules:
- Band scores must be one decimal with allowed set `{1.0, 1.5, ..., 6.0}`.
- `overall_band` must be recomputed from section bands using the configured policy and not manually overridden.
- Numeric companion scores (`0-30`, `0-120`) must be recomputed from the same mapping version used for sections to avoid mixed-version reports.

## 9. Frontend Delivery Plan

### 9.1 Reading UI

- Keep split-pane layout
- Add dedicated task renderers:
  - `CompleteWordsRenderer`
  - `ReadDailyLifeRenderer` (notice card style)
  - `AcademicPassageRenderer`

### 9.2 Listening UI

- Listening item card with left media + right question/options
- Per-item audio controls honoring playback policy
- Optional no-media fallback

### 9.3 Writing UI

- `BuildSentenceRenderer` with token bank + slot assembly
- `EmailComposerRenderer` with To/Subject frame + text area
- `AcademicDiscussionRenderer` with professor + peer posts + response editor

### 9.4 Speaking UI

- `ListenRepeatRunner`:
  - play once
  - short response timer
  - recorder lock/unlock states
- `InterviewRunner`:
  - video/audio interviewer prompt
  - per-question 45s response window
  - microphone permission pre-check

### 9.5 Shared UX

- Strict timer visibility
- Explicit status badges (`Not Started`, `In Progress`, `Recorded`)
- Keyboard shortcuts limited to non-destructive actions

## 10. Admin Authoring Plan

### 10.1 Blueprint Wizard

Steps:
1. Select `toefl_ibt` + `deliveryModel=toefl_ibt_2026`
2. Auto-load standard blueprint
3. Show editable advanced options (cut scores, unscored counts)
4. Validate before publish

### 10.2 Task Editors

- Reading: multi-blank cloze editor, notice editor, passage MCQ editor
- Listening: media-attached MCQ editor
- Writing: sentence builder/email/discussion editors
- Speaking: listen-repeat sequence editor and interview prompt editor

### 10.3 Validation Rules (Hard)

- Task counts must match blueprint
- Raw maxima must match section definitions
- Required media present for tasks that mandate it
- Stage 2 pools must exist for both upper/lower paths
- No publish when any required field is missing

## 11. API Surface

### 11.1 Admin APIs

- `POST /admin/tests/:id/blueprint`
- `GET /admin/tests/:id/blueprint/validate`
- `POST /admin/sections/:id/items/bulk`
- `POST /admin/media/upload` (audio/video/image)

### 11.2 Delivery APIs

- `POST /attempts/:id/section/:type/start`
- `GET /attempts/:id/section/:type/next-item`
- `POST /attempts/:id/items/:itemId/response`
- `POST /attempts/:id/section/:type/route` (internal use)
- `POST /attempts/:id/complete`

### 11.3 Results APIs

- `GET /attempts/:id/scores`
- `GET /attempts/:id/report`
- include raw, band, section `0-30`, overall `0-120`, CEFR level, score mapping version, and MyBest summary

## 12. Security and Integrity

- Signed media URLs, short TTL
- Server-side enforcement of playback policy
- Response tamper checks (attempt/item ownership, timing windows)
- Audit logging for:
  - route decision
  - score computation version
  - manual score overrides

## 13. Observability

Metrics:
- Attempt start/completion rate by section
- MST route distribution (upper/lower)
- Item-level difficulty and discrimination proxy
- Audio/video load failures
- Recorder failure rate
- Autosave conflict rate

Logs:
- Structured events with `attemptId`, `itemId`, `section`, `taskType`, `timestamp`

## 14. Testing Strategy

### 14.1 Unit Tests

- Blueprint validators
- MST routing decisions
- Objective scoring (including partial credit)
- Raw -> band mapping and rounding policy

### 14.2 Integration Tests

- Full attempt flow with reconnect during Stage 2
- Media playback policy (play once)
- Speaking prompt sequence and recording persistence

### 14.3 E2E Tests

- Candidate journey for each section
- Admin authoring -> publish -> take test -> report
- Regression for existing IELTS/TOEFL ITP flows

## 15. Rollout Plan

Phase 1: Foundation
- Schema + enums + blueprint storage
- Feature flags for new delivery model
- Add kill switch `ENABLE_TOEFL_IBT_2026` default `false`

Phase 2: Reading/Listening MST
- Adaptive engine, task renderers, objective scoring
- Deploy only behind `deliveryModel=toefl_ibt_2026` and feature flag

Phase 3: Writing/Speaking
- New task UIs, media orchestration, rubric score pipeline
- Keep legacy speaking/writing runners untouched and selected only for non-`toefl_ibt_2026`

Phase 4: Reporting + Concordance
- Full score report payloads and downloads
- Add report versioning so IELTS/TOEFL ITP reports continue using existing serializers/templates

Phase 5: Hardening
- Load/perf testing, analytics validation, operational runbooks
- Mandatory non-regression signoff for IELTS and TOEFL ITP before enabling production flag

## 16. Risks and Mitigations

- Risk: Adaptive misrouting due to threshold drift
  - Mitigation: threshold config + telemetry + A/B dry runs
- Risk: Media delivery instability
  - Mitigation: CDN, preloading, audio fallback for video
- Risk: Scoring inconsistency across versions
  - Mitigation: versioned mapping/scoring config and immutable score logs
- Risk: Regression in legacy exams
  - Mitigation: strict feature gating by `deliveryModel`
- Risk: Styling/design drift in IELTS/TOEFL ITP from shared component edits
  - Mitigation: avoid editing legacy renderer components; implement `toefl_ibt_2026` views in separate component tree and route only by delivery model

## 17. Definition of Done

Done when all are true:
- Admin can author and publish a valid `toefl_ibt_2026` test
- Candidate can complete all four sections end-to-end
- Reading/listening adaptive routing is deterministic and auditable
- Writing/speaking tasks support required media and timers
- Final report returns section raw + band + overall band + section `0-30` + overall `0-120` + CEFR + MyBest
- Automated test suite passes with no critical regressions
- IELTS and TOEFL ITP snapshots (UI + scoring + API response contracts) are unchanged from pre-rollout baselines

## 18. Suggested Repo Placement

- This document: `docs/toefl-ibt-implementation-plan.md`
- Blueprint schema: `backend/src/types/toeflBlueprint.types.ts`
- Adaptive service: `backend/src/services/adaptive-routing.service.ts`
- Mapping tables: `backend/src/config/toeflScoreMappings.ts`
- Frontend task renderers: `frontend/src/components/test/tasks/*`

## 19. Immediate Next Actions

1. Approve blueprint JSON schema and routing threshold policy
2. Finalize DB migration scripts (non-breaking first)
3. Implement feature flag `deliveryModel=toefl_ibt_2026`
4. Build Reading/Listening MST MVP before Writing/Speaking
5. Lock scoring mapping table version `v1`
