# PlumberPass Agent Notes

Date updated: March 24, 2026

This file is for contributors and agents working inside this repo.

## Product truth

PlumberPass is a **React + Vite + Capacitor Android app** with a **FastAPI backend**.

Do not implement against the old vanilla shell as if it were the product. The live app is under `frontend/src/`.

## Authoritative paths

- frontend app: `frontend/src/`
- Android wrapper: `frontend/android/`
- backend API: `backend/app/`
- live content loader: `backend/app/storage.py`
- smoke script: `scripts/launch_smoke.ps1`

## What exists today

- landing and dashboard
- audio-first review
- tap/screen review
- mistake replay
- rapid recall
- mock exam
- visual review
- settings
- readiness reporting
- offline bundle fallback
- premium gating and billing scaffolding
- Android beta build/install workflow

## What is not the main app

- `frontend/public/js/`
- old `audio-engine.js`, `quiz-engine.js`, and related legacy shell code

Treat those as reference-only unless a migration/removal pass explicitly needs them.

## Content truth

- live study data is aggregated from `backend/data/` and `backend/data/published/`
- mock exams are isolated from the regular study bank
- known unsafe source dumps are blacklisted in `backend/app/storage.py`

Read `docs/CONTENT_TRUTH_MAP.md` before changing content loading or promotion rules.

## Release discipline

- V1 scope is locked in `V1_SCOPE.md`
- launch status is tracked in `docs/status/FINAL_MILESTONES.md`
- release operations live in `docs/status/LAUNCH_RUNBOOK.md`
- current gaps are in `docs/RELEASE_GAPS.md`

## Recommended verification

Use these as the default checks:

```powershell
pytest -q
cd .\frontend
npx tsc --noEmit
npm run build
cd ..
powershell -ExecutionPolicy Bypass -File .\scripts\launch_smoke.ps1
```

## Android testing note

Emulator checks are useful, but real-device voice behavior is still the release-critical validation path.
