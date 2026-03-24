# PlumberPass Architecture

Date updated: March 24, 2026

This document describes the current implementation, not the legacy shell.

## Runtime shape

PlumberPass is a three-part system:

1. `frontend/src/`
   React + Vite + TypeScript application
2. `backend/app/`
   FastAPI content and billing API
3. `frontend/android/`
   Capacitor Android wrapper for beta APK packaging

The app also ships an offline fallback bundle at `frontend/public/study-bundle.json`.

## Frontend architecture

### Entry points

- `frontend/src/main.tsx`
  Bootstraps the React app and dev/runtime shell behavior
- `frontend/src/App.tsx`
  Main app state, mode switching, content loading, premium gating, and screen orchestration

### Main frontend modules

- `frontend/src/hooks/useAudioReview.ts`
  Voice playback, narration settings, native/web recognition handling, and Android fallbacks
- `frontend/src/hooks/useStudyProgress.ts`
  Local progress, mistakes, due logic, and lightweight study-state persistence
- `frontend/src/screens/`
  Dashboard, settings, readiness, mistake library, recall, visual review, and upgrade surfaces
- `frontend/src/config/`
  Brand, billing, exam blueprint, and launch checklist configuration

### Frontend data flow

1. App boots.
2. Frontend checks backend availability.
3. If the backend is reachable, study items load from `/api/v1/study/...`.
4. If the backend is unavailable, the app falls back to `study-bundle.json`.
5. User progress stays on-device through browser/native storage.

## Backend architecture

### Entry points

- `backend/app/main.py`
  FastAPI routes
- `backend/app/storage.py`
  Content aggregation, normalization, dedupe, and source blacklisting
- `backend/app/billing.py`
  Stripe checkout config, session creation, session verification, and webhook handling
- `backend/app/models.py`
  Pydantic response and content models

### API surfaces

- `/health`
- `/api/v1/study/*`
- `/api/v1/billing/*`

The backend is intentionally simple. Content is still loaded from JSON, not a database.

## Content architecture

### Live sources

- `backend/data/seed.json`
- selected root JSON banks such as verified and NotebookLM batches
- curated published slices in `backend/data/published/`
- mock exam banks in `backend/data/mock_exam1_part_a.json` and `mock_exam1_part_b.json`

### Content control

`backend/app/storage.py` is the gatekeeper:

- blacklists known bad or non-live files
- normalizes mixed schemas
- rejects malformed MCQs
- dedupes by question id
- prefers higher-quality variants when duplicates exist

See `docs/CONTENT_TRUTH_MAP.md` for the QA-oriented truth map.

## Android architecture

### Native wrapper

- `frontend/android/`

### Native bridges in use

- `@capgo/capacitor-speech-recognition`
- `@capacitor-community/text-to-speech`

### Packaging flow

- `scripts/build_android_beta.ps1`
- `scripts/install_android_beta.ps1`

The Android path is beta packaging, not full release distribution yet.

## Offline architecture

PlumberPass is not backend-only.

- Curated content can be exported to `frontend/public/study-bundle.json`
- The service worker caches the app shell and bundled study data
- The frontend can review content without a live backend once the bundle is present

## Legacy boundary

These paths still exist, but they are not the live architecture:

- `frontend/public/js/`
- old vanilla `app.js` / `audio-engine.js` / `quiz-engine.js` implementation paths

They remain as reference material only until they are fully removed.

## Release-critical constraints

- Wrong content is more dangerous than missing content.
- Offline fallback is part of the product, not a debug convenience.
- Android beta packaging is real, but voice quality still needs real-device validation.
- Billing code exists, but live checkout is blocked until production Stripe configuration is supplied.
