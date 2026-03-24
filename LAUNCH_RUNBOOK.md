# PlumberPass Launch Runbook

Date updated: March 23, 2026

## Current launch-candidate baseline

- `656` study MCQs
- `643` flashcards
- `598` identification items
- `43` visual review cards
- `100` mock questions

## Billing env for live premium unlock

Copy `.env.example` and set:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PREMIUM_UNIT_AMOUNT`
- `STRIPE_PREMIUM_CURRENCY`
- `BILLING_FRONTEND_URL`

Without those values, the app stays on the prototype premium-unlock path and the live Stripe checkout button remains disabled.

## Fast smoke command

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch_smoke.ps1
```

Optional republish plus mobile preview:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch_smoke.ps1 -RepublishContent -OpenPreview
```

What it does:

- runs backend tests
- runs frontend typecheck
- runs frontend production build
- prints live study-bank counts
- refreshes the bundled `study-bundle.json` when `-RepublishContent` is used
- validates `docker compose config`
- reports whether the Docker daemon is reachable
- optionally opens the phone-width preview window

## Manual launch-candidate flow

1. Republish the curated content when needed.

```powershell
python .\scripts\publish_structured_reference_mcqs.py
python .\scripts\publish_laws_mcqs.py
python .\scripts\publish_conversion_mcqs.py
python .\scripts\publish_visual_review_items.py
python .\scripts\export_study_bundle.py
```

2. Verify backend and frontend.

```powershell
pytest -q
cd .\frontend
npx tsc --noEmit
npm run build
```

3. Validate container packaging config.

```powershell
docker compose config
docker version
```

If `docker version` fails with a Docker Desktop pipe error, the compose file is still valid but the daemon is not running on the machine yet.

4. Validate billing config before launch if premium checkout should be live.

```powershell
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
curl http://127.0.0.1:8000/api/v1/billing/config
```

`checkout_ready` should be `true` only after the Stripe env values are in place.

5. Open the mobile preview.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\preview_mobile.ps1
```

6. Capture Android-width screenshots for review.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\capture_mobile_gallery.ps1
```

Output images are written to `tmp\mobile-gallery\`.

7. Build the Android beta APK.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build_android_beta.ps1
```

If Android Studio should open after a successful build:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build_android_beta.ps1 -OpenAndroidStudio
```

8. Install and launch the Android beta on a device or emulator.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install_android_beta.ps1 -CaptureScreenshot
```

If an emulator should be started automatically:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install_android_beta.ps1 -AvdName Medium_Phone_API_36.1 -CaptureScreenshot
```

9. Validate native voice permission and listening on Android.

- Open `Jump to Audio Review`
- Trigger `Answer by Voice`
- Confirm Android shows the microphone permission prompt
- Allow the permission and confirm the recognizer enters listening state

This emulator path is now working. The remaining voice check is human-audible playback plus a real-device mic test.

## Remaining hard gate

`M5 Launch Packaging`

Needed next:

- hosted PWA deployment target
- live Stripe env configuration plus webhook registration
- Android install-path validation on real device
- final smoke pass after deployment target is fixed
