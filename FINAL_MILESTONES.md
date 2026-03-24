# PlumberPass Final Milestones

Date locked: March 21, 2026

This file is the launch scope for v1. Work outside this list is not required for finish.

## Finish Definition

PlumberPass v1 is considered finished when:

1. The mobile reviewer works end to end in the main app.
2. Audio-first study, rapid recall, and mock-exam flows are usable.
3. Only curated question banks are exposed to live users.
4. The app is deployable as a stable installable PWA.
5. Android packaging is at least beta-testable if APK is still required.

## Current Position

- Core app and backend are stable.
- Full PDF conversion pipeline is complete.
- All 40 cataloged PDF sources were processed into staged buckets.
- Live app currently uses the safe base bank plus published staged items.
- Official PRC Master Plumber exam blueprint and July 2026 schedule are now wired into the app.
- Current live counts: 656 study questions, 643 flashcards, 598 identification items, 43 visual review cards.
- Separate mock exam bank: 100 questions.
- Staged totals: 722 MCQs, 17,856 flashcards, 17,856 identification items.

## Milestones

### M1. Core App Stabilization
Status: Done

Exit criteria:
- Frontend builds
- Backend tests pass
- Storage loader is safe
- Audio-first review flow works

Notes:
- Completed in the current workspace.

### M2. Conversion Pipeline
Status: Done

Exit criteria:
- Source catalog exists
- MCQ and reference converters run
- OCR-heavy files are separated
- Staging manifests are generated

Notes:
- Implemented under `scripts/content_pipeline/` and `scripts/convert_materials.py`.

### M3. Safe Published Content v1
Status: Done

Exit criteria:
- Promote enough staged material to create a larger clean live bank
- Keep unsafe review-only banks out of production

Current:
- 3 publish-candidate sources already promoted
- curated `advance_qa_curated_batch1.json` added
- curated `advance_qa_curated_batch2.json` added
- derived `aspe_glossary_mcq_curated.json` added from the already curated ASPE glossary slice
- derived `aspe_reference_mcq_curated_batch2.json` added from the raw ASPE term-definition reference set after term-level dedupe
- derived `astm_mcq_curated.json` added from the ASTM standards reference set
- derived `structured_reference_mcq_curated.json` added from structured water-supply, plumbing-materials, plumbing-code terms, practical-tools, and accessibility reference sources
- derived `laws_reference_mcq_curated.json` added from the law/code reference set
- derived `useful_conversions_mcq_curated.json` added from the useful conversions reference set
- live bank now includes safe published reference slices plus two manual MCQ curation batches
- mock exam JSON files are now separated from the regular study bank
- noisy `materials_publish_candidates.json` is no longer feeding the regular study queue
- count is materially cleaner after removing mixed and low-confidence sources, and now sits above the 600-MCQ launch floor through safe structured-reference promotion

Target:
- 600 to 900 live MCQs
- 500 to 2,000 high-signal flashcards / identification prompts

### M4. Review Modes Completion
Status: In progress

Exit criteria:
- Voice sprint feels finished on mobile
- Rapid recall is usable
- Mock exam mode is coherent and polished
- Mistake review and progress loop are clear

Current:
- Main flows exist
- Dashboard, landing screen, and mistake review are stronger
- Mock exam now uses a linear locked-answer flow with end-of-run summary instead of looping like a study deck
- Wrong mock answers now remain connected to the Error Replay loop
- Visual review mode now exists as a dedicated mobile screen with generated figure assets from plumbing references, week review diagrams, and Illustrated National Plumbing Code figures
- Visual review now supports deck-level topic filtering and shuffle on mobile as the figure bank grows
- Android-width screenshot capture now exists for the major screens, so mobile UI checks are repeatable instead of guesswork
- Native Android speech recognition and mic permission flow are now wired through Capacitor plugins, and the emulator reaches a real listening state instead of failing in the old WebView-only path
- Review shell and dashboard are materially stronger on phone-width layouts, but the remaining high-usage screens still need the last polish pass

### M5. Launch Packaging
Status: Not done

Exit criteria:
- Stable hosted PWA deployment
- Manifest, offline shell, and install flow verified on Android
- If APK is required, package a beta build and test voice behavior

Current:
- PWA path is ready to finish first
- frontend now falls back to a bundled `study-bundle.json` when the backend API is unavailable
- `docker compose config` now passes for the local stack definition
- Docker build/runtime verification now passed locally for backend + frontend through `docker compose up -d --build`
- Capacitor Android wrapper now exists under `frontend/android`
- debug APK build is scripted through `scripts/build_android_beta.ps1`
- debug APK was rebuilt successfully and installed on the local `Medium_Phone_API_36.1` emulator after the billing wiring pass
- freemium vs premium app structure now exists with a dedicated upgrade screen and premium gating for paid modes
- backend billing endpoints now exist for Stripe-hosted card checkout, session verification, and webhook-driven entitlement grant
- checkout remains env-gated until live Stripe keys, webhook secret, and production return URL are configured
- native beta packaging now exists, the emulator now reaches real mic permission + listening state, but human-audible playback checks, real-device voice validation, and hosted PWA deployment still remain

### M6. Final QA and Launch Readiness
Status: Not done

Exit criteria:
- End-to-end smoke tests pass
- Content spot-checks pass
- No unsafe source dumps leak into live content
- Deployment target is live

## What Is Not In v1

Do not spend launch time on these unless they become blockers:

- Full promotion of all review-queue PDFs
- Exhaustive cleanup of every OCR-heavy source
- Ridgid catalogue conversion
- Full ASPE textbook extraction
- Play Store submission polish beyond beta packaging

## Recommended Remaining Sequence

1. Finish review-mode polish and run mobile QA.
2. Validate the PWA packaging and deployment path.
3. Package Android beta only after the PWA is stable.
4. Run final smoke tests and content spot-checks.
5. Deploy the launch target.

## Time Estimate

If scope stays fixed:

- PWA launchable MVP: 3 to 5 focused working days from March 21, 2026
- Android beta APK: 5 to 8 focused working days from March 21, 2026
- Full Play Store style release: 10 to 14 working days from March 21, 2026

## Progress Estimate

- PWA launch track: about 92% complete
- Android beta track: about 80% complete
- Full commercial release track: about 65% complete

## Next Hard Gate

The next hard gate is M5:

Finish launch packaging and final smoke coverage so the stronger curated bank can move through stable PWA release steps without regressions.
