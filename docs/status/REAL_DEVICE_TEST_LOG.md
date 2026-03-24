# PlumberPass Real-Device Test Log

Date started: March 24, 2026

This is the shared real-device bug and usability log for the pre-exam hardening sprint.

Use this file only for findings from actual use on a physical Android phone or tablet.

## Scope rule

Only log findings that affect:

- studying
- retention
- momentum
- trust

Do not turn this file into a wishlist.

## Severity

- `blocker`: stops study flow, causes wrong behavior, or damages trust
- `annoying`: usable but materially disruptive
- `cosmetic`: visible issue without meaningful study impact

## Current target build

- git commit: `681a5f4`
- artifact type: Android beta debug APK
- premium state: QA auto-unlocked in native beta build

## Device session template

Copy this block for each real-device session.

```text
Date:
Tester:
Device:
Android version:
APK commit/build:
Backend mode: offline bundle / live backend

Passed:
- 

Failed:
- 

Felt fragile:
- 

Could not verify:
- 
```

## Finding template

```text
ID:
Severity: blocker / annoying / cosmetic
Area: launch / dashboard / review / audio / voice answer / mock / visual / settings / offline / billing
Device:
Build:
Steps to reproduce:
Expected:
Actual:
Notes:
Status: open / fixed / retest-needed / closed
```

## Open findings

### RD-001

- Severity: blocker
- Area: review answer flow
- Device: Android emulator baseline only so far
- Build: pre-real-device hardening
- Steps to reproduce:
  - open review
  - answer the first question
- Expected:
  - current question records the selected answer only
  - next question starts unselected
- Actual:
  - next question can inherit the previous answer tap/letter and auto-mark itself
- Notes:
  - this has been partially addressed in code before, but must be retested on a physical device
- Status: retest-needed

### RD-002

- Severity: blocker
- Area: voice answer
- Device: Android emulator baseline only so far
- Build: pre-real-device hardening
- Steps to reproduce:
  - open audio review
  - trigger answer by voice
  - speak letter or full option text
- Expected:
  - transcript is captured and matched reliably
- Actual:
  - emulator path has been inconsistent and not yet physically verified
- Notes:
  - real-device validation is the current top QA gap
- Status: open

### RD-003

- Severity: annoying
- Area: audio / TTS
- Device: Android emulator baseline only so far
- Build: pre-real-device hardening
- Steps to reproduce:
  - read question aloud
- Expected:
  - stable, intelligible playback with clean pacing
- Actual:
  - robotic quality and occasional crackling/interference were reported before tuning
- Notes:
  - needs physical-device confirmation after recent pacing and voice-selector changes
- Status: retest-needed

### RD-004

- Severity: annoying
- Area: dashboard layout
- Device: Android emulator baseline only so far
- Build: pre-real-device hardening
- Steps to reproduce:
  - scroll dashboard on smaller mobile viewport
- Expected:
  - bottom navigation should not overlap content
- Actual:
  - bottom nav overlap was previously visible in emulator screenshots
- Notes:
  - retest after the latest UI/layout passes
- Status: retest-needed
