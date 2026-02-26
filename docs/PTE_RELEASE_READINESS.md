# PTE Release Readiness

Use this checklist before merging PTE implementation changes.

## 1) Local regression checks

From repository root:

- `npm run check:pte-release`

Equivalent manual commands:

- `npm --prefix backend run test:pte-regression`
- `npm --prefix frontend run test:pte-preview-time`

## 2) Scope validation

Verify these areas are covered in the change set:

- Objective scoring normalization and calibration mapping behavior.
- PTE point guardrails (create/update/publish + audit/fix scripts).
- PTE blueprint validation (preview + publish guard).
- Admin preview UX (`Revalidate Preview`, auto-refresh, freshness timestamp, inline errors).
- Mapping-version persistence and visibility in admin/result pages.

## 3) CI expectations

`PTE Guardrails` workflow should pass both jobs:

- `backend-pte-guardrails`
- `frontend-pte-preview`

## 4) Commit slicing recommendation

Split commits by concern to simplify review and rollback:

1. `backend: pte scoring + publish guardrails`
2. `backend: pte tests + scripts + ci`
3. `frontend: pte preview ux + inline publish errors`
4. `docs: pte guardrails and release readiness`

## 5) Post-merge operations (if needed)

For environments with legacy attempts or old points config:

- Run `npm --prefix backend run maint:pte-points`
- Run `npm --prefix backend run migrate:pte-mapping -- --apply --recompute-objective`
