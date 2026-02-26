# PTE Scoring Guardrails

This document defines the guardrails for PTE objective scoring consistency and the operational commands to maintain data quality.

## Why this exists

Some PTE objective item types can award points based on the shape of `correct_answer`, not only the configured `points` field. If `points` is lower than the derived max, score normalization can drift and reporting can become inconsistent.

Guardrails now enforce and audit this behavior.

## Admin publish guard + preview UX

For PTE Academic admin authoring, publish is now protected by fresh server validation:

- Publish action always revalidates PTE blueprint distribution on the backend right before publish.
- Frontend publish flow re-fetches the latest PTE blueprint preview before sending publish request.
- If preview refresh fails, the admin page shows a retry hint and keeps publish blocked.
- Publish failures are shown as inline callouts (not browser alerts), so errors remain visible while fixing content.

Admin preview behavior:

- `Revalidate Preview` button refreshes distribution without page reload.
- Preview auto-refreshes after section add/edit/delete.
- Preview auto-refreshes when tab/window regains focus.
- Card shows freshness label (`Last validated Xs/m/h ago`).

## Derived points rules

The backend derives a minimum max-point floor for these PTE objective types:

- `pte_mcq_multiple`
- `pte_highlight_incorrect_words`
  - Derived max: number of correct selected options

- `pte_reading_fill_blanks_dropdown`
- `pte_reading_fill_blanks_drag_drop`
- `pte_listening_fill_blanks`
  - Derived max: number of blanks in `correct_answer` map

- `pte_reorder_paragraph`
  - Derived max: `correct_answer.length - 1` (adjacent-pair scoring)

- `pte_write_from_dictation`
  - Derived max: word count of the target sentence

For these types, configured `points` must be greater than or equal to derived max.

## Enforcement points

- Question create/update validation blocks underweighted configurations.
- PTE publish validation blocks publishing if any item violates the rule.
- Objective section normalization uses derived max points when computing section score scaling.

## Objective calibration mapping

PTE objective section scores (Reading/Listening) are calibrated via anchor interpolation, not raw linear ratio.

- Mapping version: `pte_objective_2026_v1_0_0`
- Source: `backend/src/config/pteObjectiveScoreMapping.ts`
- Key anchors:
  - ratio `0.0` -> score `10`
  - ratio `0.5` -> score `50`
  - ratio `0.7` -> score `64` (intentionally below linear 66)
  - ratio `1.0` -> score `90`

When recalibrating, update anchors and bump mapping version.

## Commands

Run from `backend/`:

- Audit only (fails if violations are found):
  - `npm run audit:pte-points`

- Audit in warning mode (never fails):
  - `npm run audit:pte-points -- --warn-only`

- Fix mismatches (writes DB updates):
  - `npm run fix:pte-points`

- Dry run fix (no DB writes):
  - `npm run fix:pte-points -- --dry-run`

- Scope fix to one test:
  - `npm run fix:pte-points -- --test-id=<test_uuid>`

- One-shot maintenance (fix then strict audit):
  - `npm run maint:pte-points`

- Backfill/recompute mapping version for completed PTE attempts:
  - Dry run (recommended first):
    - `npm run migrate:pte-mapping -- --dry-run --recompute-objective`
  - Apply:
    - `npm run migrate:pte-mapping -- --apply --recompute-objective`

- Run backend PTE regression pack (tests + audit):
  - `npm run test:pte-regression`

Run from `frontend/`:

- Run preview freshness formatter tests:
  - `npm run test:pte-preview-time`

Run from repository root:

- Run release-readiness check (backend regression + frontend preview test):
  - `npm run check:pte-release`

The migration command prints `Before` and `After` mapping-version counts, which can be copied into release notes as the migration summary.

## CI behavior

CI should run:

- `test:pte-rules`
- `test:pte-contract`
- `test:pte-admin-flow`
- `test:pte-calibration`
- `test:pte-blueprint`
- `test:pte-publish-guard`
- `test:pte-objective`
- `test:pte-service`
- `test:pte-listening-bundle`
- `test:pte-points`
- `audit:pte-points`
- `frontend:test:pte-preview-time`

Workflow implementation:

- Backend PTE guardrails and frontend preview tests run in separate jobs for better parallelism.
- Each job uses lockfile-specific npm cache:
  - backend cache: `backend/package-lock.json`
  - frontend cache: `frontend/package-lock.json`

Expected failure mode:

- If any PTE question is underweighted, the audit step fails and blocks merge.
- Use `fix:pte-points` to remediate data, then rerun audit.
