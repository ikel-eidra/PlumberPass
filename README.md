# PlumberPass

PlumberPass is a voice-first reviewer for the **Philippines Master Plumber Licensure Examination**. The current product is a **React + Vite + Capacitor Android app** backed by a **FastAPI** content and billing API. It also ships an offline study-bundle fallback so the review modes can still run when the backend is unavailable.

Creator: **Futol Ethical Technology Ecosystems**  
Website: **https://plumberpass.futoltech.com**

## Current state

PlumberPass is no longer a concept repo. It already includes:

- landing and dashboard flows
- audio-first MCQ review
- tap/screen review
- mistake replay
- rapid recall for flashcards and identification items
- mock exam mode
- visual review mode
- settings
- readiness reporting
- premium gating and upgrade flow
- Android beta packaging via Capacitor

Current live content baseline:

- `656` study MCQs
- `643` flashcards
- `598` identification items
- `43` visual review cards
- `100` mock questions

## What is authoritative

- Frontend app: `frontend/src/`
- Android wrapper: `frontend/android/`
- Backend API: `backend/app/`
- Live content loader: `backend/app/storage.py`
- Offline bundle: `frontend/public/study-bundle.json`

The legacy static shell under `frontend/public/js/` is **reference-only**, not the live frontend runtime.

See:

- [Source of Truth](SOURCE_OF_TRUTH.md)
- [V1 Scope](V1_SCOPE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Content Truth Map](docs/CONTENT_TRUTH_MAP.md)
- [Release Gaps](docs/RELEASE_GAPS.md)

## Local development

### Prerequisites

- Python `3.11+`
- Node.js `20+` (`22+` recommended)
- npm
- Android Studio + Android SDK for APK work
- Docker Desktop only if you want local container validation

### Install dependencies

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\pip install -r .\backend\requirements.txt
cd .\frontend
npm install
```

### Run backend

```powershell
cd D:\projects\PliumberPass - KImi 02-17-26\PlumberPass
.\backend\.venv\Scripts\python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### Run frontend

```powershell
cd D:\projects\PliumberPass - KImi 02-17-26\PlumberPass\frontend
npm run dev
```

Default local URLs:

- frontend: `http://127.0.0.1:5173`
- backend: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

### Smoke test

```powershell
cd D:\projects\PliumberPass - KImi 02-17-26\PlumberPass
powershell -ExecutionPolicy Bypass -File .\scripts\launch_smoke.ps1
```

### Android beta build

```powershell
cd D:\projects\PliumberPass - KImi 02-17-26\PlumberPass
powershell -ExecutionPolicy Bypass -File .\scripts\build_android_beta.ps1
```

Install on device or emulator:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install_android_beta.ps1
```

## Repo structure

```text
PlumberPass/
├── backend/
│   ├── app/                    # FastAPI app, billing, models, storage
│   └── data/                   # seed, curated banks, mock exams, published slices
├── frontend/
│   ├── android/                # Capacitor Android wrapper
│   ├── public/                 # PWA assets, service worker, offline bundle
│   └── src/                    # React app
├── scripts/                    # content publishing, smoke, Android build/install
├── tests/                      # backend tests
├── docs/                       # active docs, status, research, reference, decisions
├── SOURCE_OF_TRUTH.md
├── V1_SCOPE.md
├── Makefile
└── docker-compose.yml
```

## Production-ready vs prototype

### Stable enough to keep shipping

- React frontend and FastAPI backend
- curated live question bank and mock bank
- offline bundle fallback
- dashboard, review modes, mistake loop, readiness, visual review
- Android beta build/install path

### Still prototype or env-gated

- live Stripe checkout until production keys/webhook are configured
- real-device Android voice validation
- hosted deployment target
- release signing / store distribution
- GCash and USDT payment flows

For native test builds, premium access is currently auto-unlocked so the full surface can be tested without live billing.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Development](docs/DEVELOPMENT.md)
- [Deployment](docs/DEPLOYMENT.md)
- [API](docs/API.md)
- [Content Truth Map](docs/CONTENT_TRUTH_MAP.md)
- [Release Gaps](docs/RELEASE_GAPS.md)
- [Launch Milestones](docs/status/FINAL_MILESTONES.md)
- [Launch Runbook](docs/status/LAUNCH_RUNBOOK.md)

## Contributing

Contributing guidance lives in [CONTRIBUTING.md](CONTRIBUTING.md). Before changing architecture, read [SOURCE_OF_TRUTH.md](SOURCE_OF_TRUTH.md) and keep the repo aligned with the current stack instead of the legacy shell.

## License

MIT. See [LICENSE](LICENSE).
