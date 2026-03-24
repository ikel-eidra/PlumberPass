# Deployment Guide

Date updated: March 24, 2026

This guide covers the current deployment reality, not the old static-shell narrative.

## Current supported paths

### 1. Hosted PWA

This is still the cleanest release path.

Requirements:

- build the React frontend
- host the built frontend
- host or proxy the FastAPI backend
- keep the offline `study-bundle.json` available as fallback

### 2. Local Docker validation

The repo includes a working `docker-compose.yml` for backend + frontend validation.

Validation commands:

```powershell
docker compose config
docker compose up -d --build backend frontend
```

### 3. Android beta APK

This is a beta packaging lane, not a production mobile release lane yet.

Build:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build_android_beta.ps1
```

Install:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install_android_beta.ps1
```

## Release prerequisites

### Backend

- FastAPI app reachable
- live content banks present
- billing env configured if premium checkout should be enabled

### Frontend

- `npm run build` passes
- offline `study-bundle.json` exported when needed
- service worker and manifest verified on Android

### Billing

Copy `.env.example` and configure:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PREMIUM_UNIT_AMOUNT`
- `STRIPE_PREMIUM_CURRENCY`
- `BILLING_FRONTEND_URL`

Without these values, billing remains prototype-only and live checkout should be considered off.

## Hosted deployment checklist

1. Run `scripts/launch_smoke.ps1`
2. Export the latest offline bundle if content changed
3. Build the frontend
4. Verify backend `/health`
5. Verify `GET /api/v1/billing/config`
6. Confirm the deployed frontend can reach the backend
7. Confirm the frontend still works if the backend is temporarily unavailable

## Current blockers

- Hosted production target is not fixed in-repo
- Live Stripe env and webhook registration are not configured yet
- Real-device Android voice validation is still open
- Release signing/store distribution is not configured

For operational launch steps, see `docs/status/LAUNCH_RUNBOOK.md`.
