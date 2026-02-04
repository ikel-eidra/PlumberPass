# PlumberPass

Full-stack scaffold for the PlumberPass reviewer experience.

## Stack

- **Backend:** FastAPI (Python)
- **Frontend:** React + Vite (TypeScript)
- **Data:** JSON seed for now; ready for SQLite/content packs

## Getting started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend proxies `/api/*` to the backend at `http://localhost:8000`.

## Next steps

- Replace `backend/data/seed.json` with real content packs.
- Wire voice input (STT) + audio playback in the client.
- Add spaced repetition + session scheduling logic.
