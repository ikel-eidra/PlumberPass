# PlumberPass Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  PWA (Progressive Web App)                                                  │
│  ├── HTML5 + CSS3 + Vanilla ES6+                                           │
│  ├── Service Worker (Offline capability)                                    │
│  ├── Web Speech API (TTS/STT)                                              │
│  └── LocalStorage / IndexedDB (Client-side storage)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP / HTTPS
                                      │ (REST API + WebSocket for sync)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  FastAPI (Python 3.8+)                                                      │
│  ├── Question Bank API                                                      │
│  ├── User Progress API                                                      │
│  ├── Sync API (for multi-device)                                           │
│  └── Admin API (content management)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Primary: JSON files (versioned content packs)                             │
│  Cache: Redis (optional, for session/API caching)                          │
│  Client: LocalStorage / IndexedDB                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Frontend Components

```
┌─────────────────────────────────────────────────────────────┐
│                     APP CONTROLLER                          │
│                      (app.js)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   SCREEN    │  │   SCREEN    │  │   SCREEN    │        │
│  │  Dashboard  │  │    Quiz     │  │    Audio    │        │
│  │             │  │             │  │    Mode     │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │               │
│         └────────────────┴────────────────┘               │
│                          │                                │
│                          ▼                                │
│         ┌────────────────────────────────┐                │
│         │         CORE ENGINES            │                │
│         ├────────────────────────────────┤                │
│         │  SRS Engine (srs-engine.js)    │                │
│         │  ├── Card state management      │                │
│         │  ├── Interval calculation       │                │
│         │  └── Queue generation           │                │
│         │                                │                │
│         │  Audio Engine (audio-engine.js)│                │
│         │  ├── Text-to-Speech            │                │
│         │  ├── Speech-to-Text            │                │
│         │  └── Tap pattern recognition   │                │
│         │                                │                │
│         │  Quiz Engine (quiz-engine.js)  │                │
│         │  ├── Session management        │                │
│         │  ├── Answer validation         │                │
│         │  └── Statistics tracking       │                │
│         └────────────────────────────────┘                │
│                          │                                │
│                          ▼                                │
│         ┌────────────────────────────────┐                │
│         │      DATA LAYER (Client)        │                │
│         ├────────────────────────────────┤                │
│         │  LocalStorage                  │                │
│         │  ├── pp_srs_cards              │                │
│         │  ├── pp_review_log             │                │
│         │  ├── pp_stats                  │                │
│         │  └── pp_settings               │                │
│         │                                │                │
│         │  Session Storage               │                │
│         │  └── Current session state     │                │
│         └────────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Backend Components

```
┌─────────────────────────────────────────────────────────────┐
│                      FASTAPI APP                            │
│                      (app/main.py)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 ROUTERS                              │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  /health          - Health check                     │   │
│  │  /topics          - Topic listing                    │   │
│  │  /questions       - Question CRUD                    │   │
│  │  /flashcards      - Flashcard content                │   │
│  │  /identification  - Identification items             │   │
│  │  /mock-exams      - Mock exam sets                   │   │
│  │  /sync            - Data synchronization             │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 MODELS (Pydantic)                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Question         - MCQ structure                    │   │
│  │  Flashcard        - Q&A pairs                        │   │
│  │  Identification   - Short answer items               │   │
│  │  MockQuestion     - Full exam questions              │   │
│  │  Topic            - Category structure               │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 STORAGE LAYER                        │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  JSON Files       - Content packs                    │   │
│  │  Validation       - Schema validation                │   │
│  │  Caching          - In-memory caching                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Quiz Session Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User   │────▶│    Start     │────▶│  Get Study   │────▶│  Display     │
│ Action  │     │   Session    │     │    Queue     │     │  Question    │
└─────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                │
                                                                ▼
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Next   │◀────│    Show      │◀────│   Process    │◀────│   Submit     │
│Question │     │ Explanation  │     │    Answer    │     │    Answer    │
└─────────┘     └──────────────┘     └──────────────┘     └──────────────┘
      │
      ▼
┌──────────────┐
│   Session    │
│   Complete   │
└──────────────┘
```

### 2. SRS Review Flow

```
User Reviews Card
       │
       ▼
┌──────────────┐
│   Submit     │
│   Rating     │
│ (1-4/Again-  │
│   Easy)      │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌─────────────────────────────────────┐
│   Update     │────▶│  Calculate New Interval             │
│   Card       │     │                                     │
└──────┬───────┘     │  IF rating = 1 (Again):             │
       │             │    → Reset to learning (1 min)      │
       │             │    → Decrease ease (-0.2)           │
       │             │                                     │
       │             │  IF in learning:                    │
       │             │    → Advance step or graduate       │
       │             │                                     │
       │             │  IF in review:                      │
       │             │    → interval × ease × modifier     │
       │             │    → adjust ease (±0.15)            │
       │             └─────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   Schedule   │
│   Next Due   │
└──────────────┘
```

### 3. Audio Mode Flow

```
User Opens Audio Mode
         │
         ▼
┌─────────────────┐
│  Build Queue    │
│  (SRS due cards)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Play Question  │────▶│  TTS: "Question │
│                 │     │   X..."         │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Listen for     │────▶│  Input Methods: │
│  Answer         │     │  • Voice (A-E)  │
│                 │     │  • Tap pattern  │
└────────┬────────┘     │  • Button press │
         │             └─────────────────┘
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Validate       │────▶│  Update SRS     │
│  Answer         │     │  Card           │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Speak Feedback │────▶│  Auto-advance?  │──Yes──▶ Next Question
│  (Correct/Wrong)│     │                 │
└─────────────────┘     └────────┬────────┘
                                 │No
                                 ▼
                          Wait for Next
```

## Module Dependencies

### Frontend Dependencies

```
app.js
├── srs-engine.js
│   └── (no external deps - pure algorithm)
├── audio-engine.js
│   └── Web Speech API (native)
├── quiz-engine.js
│   └── srs-engine.js (for scheduling)
└── questions.js
    └── (data only)
```

### Backend Dependencies

```
main.py
├── FastAPI
├── pydantic (models)
└── storage.py
    ├── json (stdlib)
    └── pathlib (stdlib)
```

## Storage Architecture

### Client-Side Storage

| Key | Data Type | Size | TTL |
|-----|-----------|------|-----|
| `pp_srs_cards` | Object | ~50KB | Persistent |
| `pp_review_log` | Array | ~30KB | Persistent (last 1000) |
| `pp_stats` | Object | ~2KB | Persistent |
| `pp_audio_settings` | Object | ~1KB | Persistent |
| `pp_theme` | String | ~100B | Persistent |
| `pp_session_state` | Object | ~5KB | Session |

### Data Schema

See [API.md](API.md) for complete schema documentation.

## Security Considerations

### Client-Side
- XSS protection through HTML escaping
- CSP headers (when deployed)
- Input validation on all user inputs
- No sensitive data in LocalStorage

### API
- CORS configuration for allowed origins
- Rate limiting (future)
- Input validation via Pydantic models
- No authentication required for basic features (future: optional auth)

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | ~1.2s |
| Time to Interactive | < 3s | ~2.1s |
| Lighthouse PWA Score | > 90 | ~95 |
| Bundle Size (GZipped) | < 100KB | ~85KB |
| API Response Time | < 100ms | ~50ms |
| Question Load Time | < 500ms | ~100ms |

## Scalability Plan

### Phase 1 (Current): Single User
- LocalStorage for data
- Static JSON for questions
- No backend required for core features

### Phase 2: Multi-Device Sync
- Add user accounts
- Cloud sync with conflict resolution
- Redis for caching

### Phase 3: Scale
- Database (PostgreSQL)
- CDN for static assets
- Horizontal scaling of API

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | None (Vanilla) | Zero deps, max performance |
| Styling | CSS Variables | Dynamic theming, small size |
| Backend Framework | FastAPI | Modern, fast, type-safe |
| Data Format | JSON | Universal, human-readable |
| Storage (Client) | LocalStorage | Simple, widely supported |
| Audio | Web Speech API | Native, no external libs |

## Future Architecture

```
Phase 2 (Multi-device Sync):
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Device 1│◀───▶│  Cloud  │◀───▶│ Device 2│
│ (PWA)   │     │  Sync   │     │ (PWA)   │
└─────────┘     └────┬────┘     └─────────┘
                     │
                     ▼
              ┌─────────────┐
              │  PostgreSQL │
              │   Database  │
              └─────────────┘
```
