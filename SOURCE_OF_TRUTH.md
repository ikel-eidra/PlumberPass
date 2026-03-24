# PlumberPass Source of Truth

Date updated: March 24, 2026

This file is the authoritative description of what PlumberPass is today.

## Live stack

- Frontend runtime: React 18 + Vite + TypeScript
- Native wrapper: Capacitor Android
- Backend API: FastAPI
- Study content storage: JSON banks under `backend/data/` and `backend/data/published/`
- Offline fallback: bundled `frontend/public/study-bundle.json`
- Mobile audio path: Web Speech APIs on web, Capacitor speech/TTS plugins on Android
- Premium checkout path: Stripe-backed backend endpoints, still environment-gated

## Authoritative code paths

- Frontend app: `frontend/src/`
- Frontend entry: `frontend/src/main.tsx`
- Frontend shell and routing state: `frontend/src/App.tsx`
- Android wrapper: `frontend/android/`
- Backend app: `backend/app/`
- Backend entry: `backend/app/main.py`
- Live content loader: `backend/app/storage.py`
- Billing logic: `backend/app/billing.py`
- Release smoke flow: `scripts/launch_smoke.ps1`

## What is actually implemented

- Landing and dashboard flows
- Audio-first MCQ review
- Tap-based MCQ review
- Mistake replay
- Rapid recall for flashcards and identification items
- Mock exam mode
- Visual review mode for diagram-based items
- Settings screen
- Readiness reporting
- Offline study-bundle fallback when the backend is unavailable
- Android beta APK build/install scripts
- Premium gating and upgrade screen
- Stripe checkout/session/webhook backend endpoints

## What counts as V1

- Landing / onboarding-lite
- Dashboard
- Audio / screen / hybrid review
- Mistake replay
- Mock exam
- Visual review
- Settings
- Stable offline behavior
- Android beta packaging
- Premium gating only if the live billing configuration is stable

See `V1_SCOPE.md` for the release boundary.

## What is deferred

- User accounts and cloud sync
- Resident AI coach / assistant
- GCash and USDT payment flows
- Full Play Store release polish
- Full promotion of OCR-heavy or uncertain content banks
- Broad exam-platform generalization beyond the plumbing release

## Active vs reference vs deprecated

### Active

- `frontend/src/`
- `frontend/android/`
- `backend/app/`
- `backend/data/`
- `scripts/`
- `tests/`
- `README.md`
- `V1_SCOPE.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/DEPLOYMENT.md`
- `docs/API.md`
- `docs/REAL_DEVICE_QA.md`
- `docs/BILLING_STATE.md`
- `docs/RELEASE_BUILD_STATE.md`
- `docs/CONTENT_TRUTH_MAP.md`
- `docs/RELEASE_GAPS.md`
- `docs/status/FINAL_MILESTONES.md`
- `docs/status/LAUNCH_RUNBOOK.md`

### Reference-only

- `frontend/public/` for PWA assets, manifest, service worker, bundled content, and static media
- `frontend/public/js/` as legacy implementation reference only; not the authoritative frontend runtime
- `docs/decisions/PRD.md`
- `docs/reference/PROMPT_NOTEBOOKLM.md`
- `docs/reference/scribe_content_spec.md`
- `docs/research/`

### Deprecated / archived

- `archive/`
- `archive/tools/`
- old repo status reports
- old deployment one-offs
- old README rewrite notes
- old architecture narratives that treated the legacy vanilla shell as the live app

## Operational truth

- The React app is the product.
- The Capacitor Android wrapper is the native beta path.
- The backend is the content and billing API.
- The offline study bundle is a required release path, not a side feature.
- The legacy static shell is not the product source of truth.
