# Development Guide

This guide will help you set up PlumberPass for local development.

## Prerequisites

- **Python** 3.8 or higher
- **Node.js** 16 or higher
- **Git**
- **Make** (optional, for using Makefile commands)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/plumberpass.git
cd plumberpass
```

### 2. Run Setup Script

```bash
# Using Make (recommended)
make setup

# Or manually
make backend-setup
make frontend-setup
```

### 3. Start Development Servers

```bash
# Run both backend and frontend
make dev

# Or in separate terminals:
# Terminal 1:
make backend-run

# Terminal 2:
make frontend-run
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Manual Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## Project Structure

```
plumberpass/
├── backend/              # FastAPI backend
│   ├── app/             # Application code
│   │   ├── __init__.py
│   │   ├── main.py      # FastAPI entry point
│   │   ├── models.py    # Pydantic models
│   │   └── storage.py   # Data access layer
│   ├── data/            # JSON data files
│   ├── requirements.txt # Python dependencies
│   └── Dockerfile       # Container config
│
├── frontend/            # Frontend application
│   ├── public/          # Static PWA files
│   │   ├── index.html
│   │   ├── css/
│   │   ├── js/
│   │   └── data/
│   ├── src/            # React components (legacy)
│   ├── package.json    # Node dependencies
│   └── Dockerfile      # Container config
│
├── docs/               # Documentation
├── scripts/            # Utility scripts
├── tests/              # Test suites
├── Makefile           # Common commands
└── docker-compose.yml # Docker orchestration
```

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

Edit code following the style guidelines in [CONTRIBUTING.md](../CONTRIBUTING.md).

### 3. Test Changes

```bash
# Run all tests
make test

# Run specific tests
make test-backend
make test-frontend
```

### 4. Check Code Quality

```bash
# Lint code
make lint

# Format code
make format

# Type check
make typecheck
```

### 5. Commit

```bash
git add .
git commit -m "feat: add my feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/) format.

### 6. Push and Create PR

```bash
git push origin feature/my-feature
```

Then create a Pull Request on GitHub.

---

## Debugging

### Backend Debugging

#### Using PDB

```python
# Add breakpoint in code
import pdb; pdb.set_trace()
```

#### Using VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload", "--port", "8000"],
      "jinja": true,
      "justMyCode": true
    }
  ]
}
```

### Frontend Debugging

#### Browser DevTools

- **Chrome/Edge**: F12 or Ctrl+Shift+I
- **Firefox**: F12 or Ctrl+Shift+I
- **Safari**: Enable Develop menu in preferences

#### VS Code Debugger

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

---

## Adding Questions

### JSON Format

Create a `.json` file:

```json
[
  {
    "id": "my-question-001",
    "topic": "My Topic",
    "subtopic": "My Subtopic",
    "difficulty": "Medium",
    "prompt": "What is the answer?",
    "choices": [
      { "label": "A", "text": "Option A" },
      { "label": "B", "text": "Option B" },
      { "label": "C", "text": "Option C" },
      { "label": "D", "text": "Option D" }
    ],
    "answer_key": "B",
    "explanation_short": "Brief explanation",
    "explanation_long": "Detailed explanation...",
    "tags": ["tag1", "tag2"],
    "source_ref": "Source Document",
    "quality_flag": "verified"
  }
]
```

### Import Script

```bash
python scripts/import_questions.py --file my_questions.json
```

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/test_srs.py::test_interval_calculation -v
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

---

## Common Issues

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn app.main:app --port 8001
```

### Python Virtual Environment Issues

```bash
# Remove and recreate
rm -rf backend/.venv
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Node Modules Issues

```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## IDE Configuration

### VS Code Extensions (Recommended)

**Python:**
- Python (Microsoft)
- Pylance
- Black Formatter
- autoDocstring

**JavaScript:**
- ESLint
- Prettier
- JavaScript (ES6) code snippets

**General:**
- GitLens
- Markdown All in One
- YAML
- Docker

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "./backend/.venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/node_modules": true
  }
}
```

---

## Performance Profiling

### Backend Profiling

```bash
# Using cProfile
python -m cProfile -o profile.stats -m uvicorn app.main:app

# Analyze results
python -c "import pstats; p = pstats.Stats('profile.stats'); p.sort_stats('cumulative').print_stats(20)"
```

### Frontend Profiling

Use Chrome DevTools:
1. Performance tab
2. Record while using the app
3. Analyze results

---

## Building for Production

### Build Frontend

```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`.

### Test Production Build

```bash
# Serve built files
cd frontend/dist
python -m http.server 8080

# Or use serve
npx serve .
```

---

## Docker Development

### Build Images

```bash
docker-compose build
```

### Run Services

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Rebuild After Changes

```bash
docker-compose up --build
```

---

## Useful Commands Reference

| Command | Description |
|---------|-------------|
| `make setup` | Full project setup |
| `make dev` | Run all dev servers |
| `make test` | Run all tests |
| `make lint` | Lint all code |
| `make format` | Format all code |
| `make build` | Build for production |
| `make clean` | Clean build artifacts |
| `make docker-run` | Run with Docker |
