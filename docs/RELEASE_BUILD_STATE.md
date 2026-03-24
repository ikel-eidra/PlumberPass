# PlumberPass Release Build State

Date updated: March 24, 2026

This document separates the current build lanes and states what is still missing for a serious release candidate.

## Current build lanes

### Web development build

- command: `npm run dev` from `frontend/`
- purpose: local UI and logic development
- not a release artifact

### Android beta debug APK

- command: `powershell -ExecutionPolicy Bypass -File .\scripts\build_android_beta.ps1`
- output path: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
- purpose: sideload QA on emulator or device
- current status: working

### Beta test build behavior

- native beta build is currently premium-unlocked for QA
- this is useful for testing all surfaces
- this is not the same thing as a release-ready paid build

## Not yet release-ready

### Signed release APK / AAB

Missing items:

- signing keystore strategy
- signing configuration for Gradle / Capacitor Android
- release versioning policy
- Android App Bundle (`.aab`) generation path
- store-grade distribution checklist

### Hosted release path

Missing items:

- fixed frontend hosting target
- fixed backend hosting target
- production environment injection
- final release smoke on the deployed environment

## Current operator scripts

- `scripts/build_android_beta.ps1`
- `scripts/install_android_beta.ps1`
- `scripts/launch_smoke.ps1`

## Exit condition

The build lane stops being a release gap only when:

- signed release output is reproducible
- release vs beta behavior is documented and intentional
- deployment target is fixed
- final smoke checks pass against the release candidate artifact
