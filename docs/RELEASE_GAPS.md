# PlumberPass Release Gaps

Date updated: March 24, 2026

This document lists what still blocks a disciplined V1 release.

Supporting detail lives in:

- `docs/REAL_DEVICE_QA.md`
- `docs/BILLING_STATE.md`
- `docs/RELEASE_BUILD_STATE.md`

## Blockers

### 1. Real-device Android voice validation

- Emulator checks are useful but not enough.
- Voice answering, TTS quality, microphone stability, and tap/gesture behavior still need physical-device validation.

### 2. Live billing configuration

- Stripe backend wiring exists.
- Production env values and webhook registration do not.
- Until they do, live premium checkout should be treated as off.

### 3. Hosted deployment target

- The repo can build and validate locally.
- A real hosted target for frontend and backend is still not fixed here.

### 4. Release signing / distribution

- Beta APK build exists.
- Signed release APK / AAB flow is not yet documented or wired.

### 5. Final UX sweep

- Android-safe spacing, tap behavior, and dead-path checks still need a disciplined end-to-end pass.
- The user has already found several issues on-device, so final QA cannot be assumed from emulator-only testing.

## Non-blocker but must stay explicit

- Native beta builds currently auto-unlock premium for testing.
- This is useful for QA but must not be mistaken for the production billing path.

## No longer a primary blocker

- content extraction pipeline
- curated study-bank floor
- offline bundle fallback
- Android beta packaging existence
- backend billing endpoint scaffolding

## Deferred enhancement, not V1 blocker

- GCash
- USDT
- user accounts and cloud sync
- resident AI coach
- multi-exam platform generalization beyond the plumbing release

## Recommended next sprint

1. Real-device QA pass on the current APK
2. Fix remaining Android interaction and voice issues
3. Configure live Stripe env if premium launch is required
4. Lock the hosted deployment target
5. Run final smoke and release-candidate validation
