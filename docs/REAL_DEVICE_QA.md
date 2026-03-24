# PlumberPass Real-Device QA

Date updated: March 24, 2026

This document tracks the gap between emulator confidence and physical-device confidence.

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

## Exit condition

This document stops being a gap tracker only after at least one physical Android phone has a written pass/fail report for the critical V1 flows.
