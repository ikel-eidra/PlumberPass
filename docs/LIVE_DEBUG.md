# Live Debug

This is the fastest phone-testing path when you do not want a full APK rebuild after every code change.

## What it does

- starts the FastAPI backend with reload
- starts the Vite frontend on your LAN with hot reload
- builds a special Android debug APK that points to your local frontend server

After the live-debug APK is installed once, most frontend changes reload automatically on the phone while the phone and laptop stay on the same network.

## Start the live servers

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_live_debug.ps1
```

That script:

- detects a LAN IPv4 address
- writes `frontend/.env.local` with the matching backend URL
- starts backend reload on `0.0.0.0:8000`
- starts Vite on `0.0.0.0:5173`

## Build the live-debug APK

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build_android_live_debug.ps1
```

That script:

- configures Capacitor to load from `http://<your-ip>:5173`
- enables Android cleartext only for this debug path
- syncs Android
- builds a debug APK
- copies a stamped APK into `tmp/`

## Important limits

- The phone must be on the same LAN/Wi-Fi as the laptop running the dev servers.
- This is only for testing. Do not ship a live-debug APK.
- Native plugin changes can still require a rebuild.
- Backend changes still need the backend reload process alive.

## Best use

Use this flow when:

- you are iterating on UI quickly
- you want faster phone retests
- you need repeated debugging without producing a new static APK every time
