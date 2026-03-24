# PlumberPass Billing State

Date updated: March 24, 2026

This document states the current billing truth for the repo and APK builds.

## Current implementation

- Stripe-backed billing endpoints exist in `backend/app/billing.py`
- the backend exposes billing config, checkout-session creation, checkout verification, and webhook handling
- the frontend has an upgrade screen and premium gating
- live billing remains environment-gated

## Current non-production behavior

- native beta test builds currently auto-unlock premium so the full app surface can be tested without live checkout
- that auto-unlock path is for QA only
- it must not be described as live paid activation

## What is required for live Stripe checkout

Set the following environment values before calling billing live:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PREMIUM_UNIT_AMOUNT`
- `STRIPE_PREMIUM_CURRENCY`
- `BILLING_FRONTEND_URL`

## Current launch truth

- if those environment values are missing, premium checkout is not production-ready
- if a beta APK is premium-unlocked, that build is a QA artifact, not a live paid build
- upgrade messaging must stay explicit about whether the build is test-only or env-ready

## Deliberately deferred

- GCash
- USDT
- user-account sync for paid entitlements
- Play Store billing migration

## Exit condition

Billing stops being a release gap only when:

- production Stripe env is configured
- webhook registration is in place
- the upgrade flow is tested end to end
- premium unlock behavior is clearly separated between beta QA builds and live builds
