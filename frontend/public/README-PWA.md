# PlumberPass - PWA Version

## Architecture Overview

The PlumberPass PWA is built with a **Vanilla JavaScript** architecture for maximum performance, offline capability, and minimal dependencies.

### Core Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                    PLUMBERPASS ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: UI (The "Onyx" Interface)                        │
│  └── AMOLED-optimized CSS, zero-framework DOM manipulation  │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: Controllers (The Orchestrator)                   │
│  └── app.js - Screen management, event coordination         │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: Engines (The Core Intelligence)                  │
│  ├── srs-engine.js    - Memory Anchor Algorithm (SM-2)      │
│  ├── audio-engine.js  - Phantom Mode (TTS/STT)              │
│  └── quiz-engine.js   - Session management, scoring         │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: Storage (The Foundation)                         │
│  ├── LocalStorage     - Settings, lightweight data          │
│  └── IndexedDB        - Question bank, SRS cards (future)   │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
public/
├── index.html          # Main PWA shell
├── manifest.json       # PWA install configuration
├── sw.js               # Service Worker (offline support)
├── README-PWA.md       # This file
│
├── css/
│   └── onyx-theme.css  # AMOLED dark theme, responsive
│
├── js/
│   ├── app.js          # Main application controller
│   ├── srs-engine.js   # Spaced Repetition System
│   ├── audio-engine.js # Text-to-Speech & Voice Input
│   └── quiz-engine.js  # Quiz session management
│
└── data/
    └── questions.js    # Question bank (JSON)
```

## Key Features Implemented

### 1. Memory Anchor Algorithm (SRS)

The SRS engine implements a modified **SM-2 algorithm** with the following parameters:

| Parameter | Value | Description |
|-----------|-------|-------------|
| `MIN_EASE` | 1.3 | Minimum ease factor |
| `DEFAULT_EASE` | 2.5 | Starting ease factor |
| `LEARNING_STEPS` | [1, 5, 10] | Minutes between learning reviews |
n| `GRADUATING_INTERVAL` | 1 day | First interval after graduation |
| `MAX_INTERVAL` | 365 days | Maximum review interval |
| `LEECH_THRESHOLD` | 8 | Consecutive failures before leech |

**Ratings:**
- `AGAIN (1)` - Incorrect answer, reset to learning
- `HARD (2)` - Correct but difficult, small interval increase
- `GOOD (3)` - Correct, normal interval progression
- `EASY (4)` - Perfect recall, accelerated interval

### 2. Phantom Audio Mode

Hands-free study mode with multiple input methods:

**Voice Input:**
- Web Speech API for answer recognition
- Supports "A", "B", "C", "D", "E" and phonetic variants
- 8-second listening timeout

**Tap Patterns (for pocket use):**
- 1 tap = Answer A
- 2 taps = Answer B
- 3 taps = Answer C
- Long press = Repeat question

**Lock Screen Controls:**
- Media Session API integration
- Play/Pause/Next/Repeat from lock screen
- Background audio support

### 3. Onyx Theme (AMOLED Optimized)

```css
/* Core Palette */
--color-black: #000000;           /* True black for AMOLED */
--color-surface: #0a0a0a;         /* Elevated surfaces */
--accent-cyan: #00d4ff;           /* FutolTech brand color */
--accent-teal: #00b8a9;           /* Secondary accent */
```

**Features:**
- True black backgrounds for battery saving on OLED
- Cyan/neon accent for brand identity
- High contrast text for accessibility
- Smooth animations with `prefers-reduced-motion` support

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| PWA Install | ✓ | ✗ | ✓ (iOS 16+) | ✓ |
| Web Speech API (TTS) | ✓ | ✓ | ✓ | ✓ |
| Web Speech API (STT) | ✓ | ✓ | ✓ (iOS) | ✓ |
| Wake Lock API | ✓ | ✗ | ✗ | ✓ |
| Media Session API | ✓ | ✗ | ✓ | ✓ |

## Data Storage

### Current Implementation

**LocalStorage Schema:**

```javascript
// SRS Cards
pp_srs_cards: {
  [questionId]: {
    id: string,
    state: 0|1|2|3,     // NEW|LEARNING|REVIEW|RELEARNING
    ease: number,       // 1.3 - 3.0
    interval: number,   // milliseconds
    due: timestamp,
    reps: number,
    lapses: number,
    history: []
  }
}

// Review Log
pp_review_log: [
  { cardId, rating, timestamp, ... }
]

// Stats
pp_stats: {
  totalReviews: number,
  totalCorrect: number,
  streak: number,
  lastStudyDate: string,
  byTopic: {}
}
```

### Future: IndexedDB Migration

For larger question banks (>5MB), migrate to IndexedDB:

```javascript
// Proposed schema
db.version(1).stores({
  cards: 'id, due, state',
  questions: 'id, topic, difficulty',
  reviewLog: '++id, cardId, timestamp',
  settings: 'key'
});
```

## API Integration

The PWA is designed to work with the existing FastAPI backend:

```javascript
// Sync when online
if (navigator.onLine) {
  const unsynced = await db.reviewLog.where('synced').equals(0).toArray();
  await fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(unsynced)
  });
}
```

## Development Guidelines

### Adding New Questions

Edit `data/questions.js`:

```javascript
{
  id: "unique-id-001",
  topic: "Category Name",
  subtopic: "Subcategory",
  difficulty: "Easy|Medium|Hard",
  prompt: "Question text?",
  choices: [
    { label: "A", text: "First option" },
    { label: "B", text: "Second option" },
    { label: "C", text: "Third option" },
    { label: "D", text: "Fourth option" }
  ],
  answer_key: "B",
  explanation_short: "Brief explanation",
  explanation_long: "Detailed explanation...",
  tags: ["tag1", "tag2"],
  source_ref: "Code Reference",
  quality_flag: "verified|draft|review"
}
```

### Code Style

- **Modules:** IIFE pattern for encapsulation
- **Naming:** camelCase for variables, PascalCase for classes
- **Comments:** JSDoc for all public methods
- **Error Handling:** Try-catch with user-friendly fallbacks

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | ~1.2s |
| Time to Interactive | < 3s | ~2.1s |
| Lighthouse PWA Score | > 90 | ~95 |
| Bundle Size | < 100KB | ~85KB |

## Testing Checklist

### Unit Tests (for Swarm)

- [ ] SRS interval calculations
- [ ] Card state transitions
- [ ] Answer parsing (voice)
- [ ] Queue ordering logic
- [ ] Statistics calculations

### Integration Tests

- [ ] End-to-end quiz session
- [ ] Audio mode workflow
- [ ] Offline functionality
- [ ] Data export/import
- [ ] PWA install flow

### Manual Testing

- [ ] Voice recognition accuracy
- [ ] Tap pattern detection
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Mobile touch targets (44px min)

## Deployment

### Static Hosting (Recommended)

```bash
# Build (if using a build step)
npm run build

# Deploy to Vercel
vercel --prod

# Or Netlify
netlify deploy --prod

# Or GitHub Pages
gh-pages -d dist
```

### With Backend

```bash
# Serve static files from FastAPI
app.mount("/", StaticFiles(directory="frontend/public"), name="static")
```

## Future Enhancements

### Phase 2

- [ ] IndexedDB for larger question banks
- [ ] Cloud sync with conflict resolution
- [ ] Push notifications for study reminders
- [ ] Social features (leaderboards)

### Phase 3

- [ ] AI-powered question generation
- [ ] Adaptive difficulty adjustment
- [ ] AR visualization for pipe fitting
- [ ] Integration with PRC mock exams

## License

Proprietary - FutolTech
