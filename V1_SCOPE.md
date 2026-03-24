# PlumberPass V1 Scope

Date updated: March 24, 2026

This file defines the release boundary. If work does not help ship these items, it should not expand during the current sprint.

## Must ship

- Landing page
- Dashboard
- Audio-first review
- Tap/screen review
- Mistake replay
- Rapid recall
- Mock exam
- Visual review
- Settings
- Offline study-bundle fallback
- Android beta packaging
- Premium gating only if stable enough not to break the core reviewer

## Must be true at release

- The React frontend is the only authoritative app shell
- Backend study endpoints work
- Offline fallback works when the backend is unavailable
- No broken primary navigation path
- No dead primary action button
- No noisy or clearly unsafe content bank leaks into the live study queue

## Explicitly excluded from V1

- User accounts
- Cloud sync
- Resident AI assistant / coach
- GCash checkout
- USDT checkout
- Broad non-plumbing exam support
- Full Play Store submission polish
- Promotion of all OCR-heavy review materials

## Experimental but non-blocking

- Stripe live checkout until production env is configured
- Native Android voice quality tuning
- Advanced readiness coaching surfaces
- Extra visual-theme polish

## No-creep rules

- Do not add new study modes unless they fix a broken V1 flow.
- Do not broaden the exam scope beyond Master Plumber.
- Do not ship additional content banks without a clear truth path.
- Do not treat research notes as release requirements.
