# PlumberPass Real-Device QA

Date updated: March 24, 2026

This document tracks the gap between emulator confidence and physical-device confidence.

## Current sprint doctrine

For the pre-exam hardening sprint, the app is being treated first as a personal daily study tool.

Priority order:

1. daily usability
2. trust in answers and flow
3. release-hardening proof

This sprint is not for broad feature expansion. New work should only be accepted if it fixes:

- studying friction
- broken navigation
- unreliable answer flow
- voice/TTS instability
- persistence or offline trust issues

Use the shared test log in `docs/status/REAL_DEVICE_TEST_LOG.md` for physical-device findings.

## Current validation status

- Physical Android device QA: not yet documented in-repo
- Emulator baseline used so far: `Medium_Phone_API_36.1`
- Current beta artifact: debug APK built from `frontend/android/`

## Emulator-validated so far

- app launches and renders the current React shell
- landing to dashboard navigation works
- premium-unlocked beta build opens premium surfaces for QA
- Android microphone permission prompt appears
- native speech recognizer can enter listening state
- offline study bundle can keep the app usable when the backend is unavailable

## Known fragile areas

- answer selection carryover and tap race behavior need repeated on-device revalidation after each APK rebuild
- TTS quality is acceptable for emulator checks but not a trustworthy proxy for real-device playback quality
- voice answering remains the weakest path until a physical device confirms stable capture and transcript matching
- Android spacing, safe-area padding, and bottom-nav overlap must be checked on more than one screen size

## Not yet verified on a physical Android device

- audible TTS quality through phone speakers and headset output
- microphone capture stability in real ambient conditions
- answer-by-voice success rate for:
  - letter-only responses (`A` to `E`)
  - full option-text responses
- interruption behavior when switching between TTS playback and mic capture
- persistence after reinstall or app process kill
- offline cold-start behavior after installing the APK without the backend

## Required fields for the first real-device pass

Record these after a physical-device test:

- device model
- Android version
- APK build identifier or git commit
- what passed
- what failed
- what felt fragile
- what could not yet be verified

## Triage rule for findings

Every real-device finding should be categorized as one of:

- `blocker`: stops studying, causes wrong behavior, or breaks trust
- `annoying`: usable but materially slows or irritates study flow
- `cosmetic`: visible issue that does not materially harm study flow

During this sprint, fix blockers first, then the biggest annoyances. Cosmetics do not drive the queue unless they hide real usability problems.

## Exit condition

This document stops being a gap tracker only after at least one physical Android phone has a written pass/fail report for the critical V1 flows.
