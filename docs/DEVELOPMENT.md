# Development Guide

Date updated: March 24, 2026

This guide reflects the current app: React + Vite + Capacitor on the frontend, FastAPI on the backend.

## Prerequisites

- Python `3.11+`
- Node.js `20+` (`22+` recommended)
- npm
- Android Studio + SDK if you need APK builds
- Docker Desktop only if you want container validation

## Install

### Backend

```powershell
cd D:\projects\PliumberPass - KImi 02-17-26\PlumberPass
python -m venv backend\.venv
.\backend\.venv\Scripts\pip install -r .\backend\requirements.txt
```

### Frontend

```powershell
cd D:\projects\PliumberPass - KImi 02-17-26\PlumberPass\frontend
npm install
```

## Run locally

### Backend API

```powershell
cd D:\projects\PliumberPass - KImi 02-17-26\PlumberPass
.\backend\.venv\Scripts\python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend app

```powershell
cd D:\projects\PliumberPass - KImi 02-17-26\PlumberPass\frontend
npm run dev
```

Local URLs:

- frontend: `http://127.0.0.1:5173`
- backend: `http://127.0.0.1:8000`
- docs: `http://127.0.0.1:8000/docs`

## Useful commands

From the repo root:

```powershell
pytest -q
cd .\frontend; npx tsc --noEmit
cd .\frontend; npm run build
powershell -ExecutionPolicy Bypass -File .\scripts\launch_smoke.ps1
```

Republish curated content and rebuild the offline bundle:

```powershell
python .\scripts\publish_structured_reference_mcqs.py
python .\scripts\publish_laws_mcqs.py
python .\scripts\publish_conversion_mcqs.py
python .\scripts\publish_visual_review_items.py
python .\scripts\export_study_bundle.py
```

## Android beta workflow

Build:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build_android_beta.ps1
```

Install:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install_android_beta.ps1
```

Open Android Studio project if needed:

```powershell
cd .\frontend
npx cap open android
```

## Debugging notes

### Backend unavailable in dev

The frontend now falls back to `frontend/public/study-bundle.json` when the API is down. If you want live API data, start the backend first.

### Stale Android or service-worker build

- reinstall the APK after rebuilding
- for web dev, restart `npm run dev`
- in development, service worker registration is disabled to reduce stale-shell problems

### Voice testing

Web voice and Android native voice do not behave identically. Emulator checks are useful, but real-device testing is still required for final confidence.

## Current test coverage

### Stable automated checks

- `pytest -q`
- `npx tsc --noEmit`
- `npm run build`
- `scripts/launch_smoke.ps1`

### Not yet a mature automated lane

- full frontend interaction tests
- real-device Android voice validation
- live Stripe billing verification without env setup

## Project layout

```text
backend/app/                 FastAPI app
backend/data/                content banks and published slices
frontend/src/                React frontend
frontend/public/             PWA assets and offline study bundle
frontend/android/            Capacitor Android wrapper
scripts/                     content publishing, smoke, Android build/install
tests/backend/               backend tests
archive/tests/               archived legacy test artifacts
```
