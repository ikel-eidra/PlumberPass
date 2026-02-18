# PlumberPass - Agent Documentation

## Project Overview

**PlumberPass** is a high-performance PWA (Progressive Web App) designed for Master Plumber Licensure Exam preparation in the Philippines. It features a voice-first "Phantom Mode" for hands-free studying during commutes, and a "Memory Anchor" SRS algorithm for optimized retention.

## Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Vanilla ES6+ | Zero dependencies, maximum performance, smaller bundle |
| Styling | CSS Variables | Dynamic theming, AMOLED optimization |
| Storage | LocalStorage (IndexedDB future) | Offline-first, 5MB+ capacity |
| Audio | Web Speech API | Native TTS/STT, no external libs |
| PWA | Service Worker + Cache API | True offline, background audio |

### File Organization

```
frontend/public/
├── index.html          # PWA shell with all screen layouts
├── manifest.json       # Install configuration
├── sw.js               # Service worker for offline
├── css/
│   └── onyx-theme.css  # AMOLED dark theme
├── js/
│   ├── app.js          # Main controller (~28KB)
│   ├── srs-engine.js   # SM-2 algorithm (~20KB)
│   ├── audio-engine.js # Phantom mode (~19KB)
│   ├── quiz-engine.js  # Session manager (~15KB)
│   └── data/
│       └── questions.js # Question bank (~14KB)
```

## Core Engines

### 1. SRS Engine (srs-engine.js)

**Purpose:** Spaced repetition scheduling for optimal retention

**Key Classes:**
- `SRSEngine` - Main scheduler
- `RATING` - Enum for answer quality (1-4)
- `CARD_STATE` - Card lifecycle states

**Algorithm Parameters:**
```javascript
MIN_EASE: 1.3
DEFAULT_EASE: 2.5
LEARNING_STEPS: [1, 5, 10] // minutes
GRADUATING_INTERVAL: 1440 // 1 day in minutes
MAX_INTERVAL: 365 // days
```

**Public Methods:**
- `addCard(questionId, metadata)` - Register new question
- `reviewCard(questionId, rating)` - Process answer (1-4)
- `getStudyQueue(options)` - Get daily queue
- `getTopicStats()` - Get mastery by topic
- `getReadinessScore()` - Overall readiness %

### 2. Audio Engine (audio-engine.js)

**Purpose:** Text-to-speech and speech-to-text for Phantom Mode

**Key Classes:**
- `AudioEngine` - TTS/STT controller
- `AUDIO_STATE` - Playback states

**Features:**
- Web Speech API integration
- Media Session API (lock screen controls)
- Tap pattern recognition (1-5 taps)
- Wake Lock API (keep screen on)
- Adjustable speech rate (0.5x - 1.5x)

**Phantom Mode Tap Patterns:**
```
1 tap  = Answer A
2 taps = Answer B
3 taps = Answer C
4 taps = Answer D
Long press = Repeat question
```

**Public Methods:**
- `speakQuestion(question)` - Read Q&A aloud
- `speakFeedback(isCorrect, answer, explanation)` - Response
- `startListening(timeout)` - Voice answer input
- `parseAnswer(transcript)` - Extract A-E from speech
- `handlePhantomTap(event)` - Process tap patterns

### 3. Quiz Engine (quiz-engine.js)

**Purpose:** Quiz session management and scoring

**Key Classes:**
- `QuizEngine` - Session controller
- `QUIZ_STATE` - Session states

**Session Modes:**
- `daily` - SRS-based queue
- `mistakes` - Review incorrect answers
- `topic` - Filter by category
- `custom` - Specific question IDs

**Public Methods:**
- `startSession(options)` - Begin quiz
- `submitAnswer(choice)` - Process answer
- `nextQuestion()` / `previousQuestion()` - Navigation
- `toggleBookmark()` - Save question
- `toggleExplanation()` - Show/hide rationale

## Data Schema

### Question Object
```javascript
{
  id: "unique-string",
  topic: "Category",
  subtopic: "Subcategory",
  difficulty: "Easy|Medium|Hard",
  prompt: "Question text?",
  choices: [
    { label: "A", text: "Option text" },
    // ... up to 5 choices
  ],
  answer_key: "B",
  explanation_short: "Brief explanation",
  explanation_long: "Detailed explanation",
  tags: ["tag1", "tag2"],
  source_ref: "NPCP Section X",
  quality_flag: "verified|draft|review"
}
```

### SRS Card Object
```javascript
{
  id: "question-id",
  state: 0|1|2|3,  // NEW|LEARNING|REVIEW|RELEARNING
  ease: 2.5,       // 1.3 - 3.0
  interval: 0,     // milliseconds
  due: timestamp,
  reps: 0,
  lapses: 0,
  step: 0,         // learning step index
  history: [],
  metadata: {},
  created: timestamp
}
```

## Storage Keys

All LocalStorage keys are prefixed with `pp_`:

| Key | Data | Size |
|-----|------|------|
| `pp_srs_cards` | Card objects | ~50KB |
| `pp_review_log` | Review history | ~30KB |
| `pp_stats` | User statistics | ~2KB |
| `pp_audio_settings` | Audio preferences | ~1KB |
| `pp_theme` | UI theme | ~100B |

## UI Components

### Screens

1. **Dashboard** (`#screen-dashboard`)
   - Exam countdown
   - Readiness score (circular progress)
   - Quick actions (Audio/Quiz)
   - Statistics grid
   - Topic breakdown

2. **Quiz** (`#screen-quiz`)
   - Progress bar
   - Question card
   - Choice buttons
   - Explanation panel
   - Navigation controls

3. **Audio Mode** (`#screen-audio`)
   - Visualizer animation
   - Play/pause/controls
   - Answer pad (A-E)
   - Feedback display
   - TTS speed slider

4. **Mistakes** (`#screen-mistakes`)
   - List of incorrect answers
   - Review buttons
   - Empty state

5. **Settings** (`#screen-settings`)
   - Study preferences
   - Audio settings
   - Data export/reset

### CSS Custom Properties

```css
/* Colors */
--color-black: #000000;
--color-surface: #0a0a0a;
--accent-cyan: #00d4ff;
--accent-teal: #00b8a9;
--color-success: #00e676;
--color-error: #ff5252;

/* Spacing */
--space-md: 1rem;
--space-lg: 1.5rem;
--space-xl: 2rem;

/* Other */
--header-height: 64px;
--max-content-width: 600px;
```

## Event System

### Global Events

```javascript
// App state changes
app.onScreenChange = (screen) => {}

// SRS events
srs.onCardReviewed = (card, rating) => {}

// Audio events
audio.onStateChange = (newState, oldState) => {}
audio.onAnswerDetected = ({ answer, pattern, confidence }) => {}

// Quiz events
quiz.onQuestionChange = (question, index, total) => {}
quiz.onAnswer = (result, question) => {}
quiz.onComplete = (session) => {}
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| A-E | Select answer |
| Enter/→ | Next question |
| ← | Previous question |
| Space | Toggle explanation |
| B | Toggle bookmark |

## Browser APIs Used

| API | Feature | Fallback |
|-----|---------|----------|
| Web Speech API | TTS/STT | Tap input only |
| Wake Lock API | Keep screen on | None |
| Media Session API | Lock controls | None |
| Service Worker | Offline support | Online only |
| LocalStorage | Data persistence | None |

## Testing Guide

### Unit Tests

```javascript
// SRS Engine Tests
describe('SRSEngine', () => {
  test('review with AGAIN resets to learning', () => {
    const srs = new SRSEngine();
    srs.addCard('q1');
    const card = srs.reviewCard('q1', RATING.AGAIN);
    expect(card.state).toBe(CARD_STATE.RELEARNING);
  });
  
  test('interval increases with GOOD rating', () => {
    const srs = new SRSEngine();
    srs.addCard('q1');
    // Graduate to review first
    srs.cards.get('q1').state = CARD_STATE.REVIEW;
    srs.cards.get('q1').interval = 24 * 60 * 60 * 1000; // 1 day
    
    const card = srs.reviewCard('q1', RATING.GOOD);
    expect(card.interval).toBeGreaterThan(24 * 60 * 60 * 1000);
  });
});

// Audio Engine Tests
describe('AudioEngine', () => {
  test('parseAnswer recognizes "B"', () => {
    const audio = new AudioEngine();
    expect(audio.parseAnswer('the answer is B')).toBe('B');
  });
  
  test('parseAnswer recognizes phonetic "bee"', () => {
    const audio = new AudioEngine();
    expect(audio.parseAnswer('I choose bee')).toBe('B');
  });
});
```

### Manual Testing Checklist

- [ ] Install as PWA (Chrome/Edge)
- [ ] Offline functionality (Airplane mode)
- [ ] Voice answer in Audio Mode
- [ ] Tap patterns work correctly
- [ ] SRS intervals increase correctly
- [ ] Mistake library populates
- [ ] Data export/import works
- [ ] Theme persists
- [ ] Keyboard shortcuts function
- [ ] Screen reader compatible

## Common Issues & Solutions

### Issue: Speech synthesis not working
**Cause:** Browser autoplay policies
**Solution:** User must interact with page first (button click)

### Issue: Voice recognition fails
**Cause:** No microphone permission
**Solution:** Fallback to tap input, show permission prompt

### Issue: LocalStorage quota exceeded
**Cause:** Review log too large
**Solution:** Trim log to last 1000 entries (automatic)

### Issue: Service Worker not updating
**Cause:** Browser caching
**Solution:** Increment CACHE_NAME in sw.js

## Performance Budget

| Resource | Target | Max |
|----------|--------|-----|
| HTML | 20KB | 25KB |
| CSS | 30KB | 40KB |
| JS (total) | 80KB | 100KB |
| Data | 100KB | 200KB |
| **Total** | **230KB** | **365KB** |

## Future Enhancements

### Phase 2
- IndexedDB migration for larger question banks
- Cloud sync with conflict resolution
- Push notifications
- Social features

### Phase 3
- AI question generation
- AR visualization
- Mock exam simulation
- PRC integration

## References

- [National Plumbing Code of the Philippines](http://www.dpwh.gov.ph/)
- [SM-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [PWA Checklist](https://web.dev/pwa-checklist/)

## Contact

**FutolTech**
- Project: PlumberPass
- Target: Master Plumber Licensure Exam - July 2026
