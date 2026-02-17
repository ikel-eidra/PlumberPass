# PlumberPass API Documentation

## Base URL

```
Development: http://localhost:8000
Production: https://api.plumberpass.com
```

## Authentication

Currently, the API is open (no authentication required). Future versions may add optional user accounts.

## Response Format

All responses are in JSON format.

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

## Endpoints

### Health Check

```
GET /health
```

Check if the API is running.

**Response:**
```json
{
  "status": "ok"
}
```

---

### Topics

#### List Topics

```
GET /topics
```

Get all available topics and subtopics.

**Response:**
```json
[
  {
    "name": "Plumbing Fundamentals",
    "subtopics": ["Codes & Standards", "Tools", "Safety"]
  },
  {
    "name": "Water Supply",
    "subtopics": ["Pipe Sizing", "Pressure", "Valves"]
  }
]
```

---

### Questions

#### List Questions

```
GET /questions
```

Get all multiple choice questions.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `topic` | string | Filter by topic |
| `difficulty` | string | Filter by difficulty (Easy, Medium, Hard) |
| `limit` | integer | Maximum number of results |
| `offset` | integer | Pagination offset |

**Response:**
```json
[
  {
    "id": "q-001",
    "topic": "Plumbing Fundamentals",
    "subtopic": "Codes & Standards",
    "difficulty": "Easy",
    "prompt": "Which document outlines the minimum safety standards?",
    "choices": [
      { "label": "A", "text": "National Electrical Code" },
      { "label": "B", "text": "National Plumbing Code" },
      { "label": "C", "text": "Building Energy Code" },
      { "label": "D", "text": "Fire Safety Manual" },
      { "label": "E", "text": "Stormwater Handbook" }
    ],
    "answer_key": "B",
    "explanation_short": "The National Plumbing Code sets minimum standards.",
    "explanation_long": "Plumbing installations follow the National Plumbing Code...",
    "tags": ["codes", "safety"]
  }
]
```

#### Get Single Question

```
GET /questions/{id}
```

**Response:** Single question object (same structure as above)

---

### Flashcards

#### List Flashcards

```
GET /flashcards
```

Get all flashcard items (Q&A format).

**Response:**
```json
[
  {
    "id": "fc-001",
    "topic": "Water Supply",
    "subtopic": "Pressure",
    "front": "What is the minimum pressure required at the highest fixture?",
    "back": "138 kPa (20 psi)",
    "explanation_short": "138 kPa ensures adequate flow.",
    "explanation_long": "The National Plumbing Code requires...",
    "tags": ["pressure", "fixtures"],
    "difficulty": 2,
    "source_ref": "NPCP Section 604.3",
    "quality_flag": "verified"
  }
]
```

---

### Identification Items

#### List Identification Items

```
GET /identification
```

Get identification/short answer questions.

**Response:**
```json
[
  {
    "id": "id-001",
    "topic": "Materials",
    "subtopic": "Pipes",
    "prompt": "What is the maximum temperature for PVC pipe usage?",
    "accepted_answers": ["60°C", "60 degrees", "140°F"],
    "explanation_short": "PVC has a maximum service temperature of 60°C.",
    "explanation_long": "PVC begins to soften at temperatures above 60°C...",
    "tags": ["materials", "pvc", "temperature"],
    "difficulty": 2,
    "source_ref": "ASME B31.3",
    "quality_flag": "verified"
  }
]
```

---

### Mock Exams

#### Get Mock Exam Part A

```
GET /mock-exams/1/part-a
```

Get Part A (theoretical) questions for mock exam 1.

**Response:** Array of MockQuestion objects

#### Get Mock Exam Part B

```
GET /mock-exams/1/part-b
```

Get Part B (practical) questions for mock exam 1.

---

### Sync (Future)

#### Upload Progress

```
POST /sync/upload
```

Upload study progress for cloud backup.

**Request Body:**
```json
{
  "device_id": "unique-device-id",
  "timestamp": "2025-01-15T10:30:00Z",
  "cards": { ... },
  "review_log": [ ... ],
  "stats": { ... }
}
```

#### Download Progress

```
GET /sync/download
```

Download study progress from cloud.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `device_id` | string | Device identifier |
| `since` | string | ISO timestamp for incremental sync |

---

## Data Models

### Question

```typescript
interface Question {
  id: string;                    // Unique identifier
  topic: string;                 // Main category
  subtopic: string;              // Sub-category
  difficulty: "Easy" | "Medium" | "Hard";
  prompt: string;                // Question text
  choices: Choice[];             // Answer options (A-E)
  answer_key: string;            // Correct answer (A-E)
  explanation_short: string;     // Brief explanation
  explanation_long: string;      // Detailed explanation
  tags: string[];               // Searchable tags
  source_ref?: string;          // Source document reference
  quality_flag: "verified" | "draft" | "review";
}

interface Choice {
  label: string;                // "A", "B", "C", "D", or "E"
  text: string;                 // Answer text
}
```

### Flashcard

```typescript
interface Flashcard {
  id: string;
  topic: string;
  subtopic: string;
  front: string;                // Question/prompt
  back: string;                 // Answer
  explanation_short: string;
  explanation_long: string;
  tags: string[];
  difficulty: number;           // 1-5 scale
  source_ref: string;
  quality_flag: string;
}
```

### Identification Item

```typescript
interface IdentificationItem {
  id: string;
  topic: string;
  subtopic: string;
  prompt: string;
  accepted_answers: string[];   // Multiple valid answers
  explanation_short: string;
  explanation_long: string;
  tags: string[];
  difficulty: number;
  source_ref: string;
  quality_flag: string;
}
```

### SRS Card (Client-side)

```typescript
interface Card {
  id: string;                   // Question ID
  state: 0 | 1 | 2 | 3;        // NEW|LEARNING|REVIEW|RELEARNING
  ease: number;                 // 1.3 - 3.0
  interval: number;             // Milliseconds
  due: number;                  // Timestamp
  reps: number;                 // Total reviews
  lapses: number;               // Times forgotten
  lastReview: number | null;    // Timestamp
  step: number;                 // Learning step index
  history: Review[];            // Review history
  metadata: {
    topic: string;
    subtopic: string;
    difficulty: string;
  };
}

interface Review {
  rating: 1 | 2 | 3 | 4;       // AGAIN|HARD|GOOD|EASY
  timestamp: number;
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid input data |
| `INTERNAL_ERROR` | 500 | Server error |
| `RATE_LIMITED` | 429 | Too many requests |

## Rate Limiting

Currently, no rate limiting is enforced. Future versions may implement:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## CORS

The API allows cross-origin requests from:
- `http://localhost:*` (development)
- `https://*.plumberpass.com` (production)
- `https://*.vercel.app` (preview deployments)

## Changelog

### v1.0.0 (2025-01-15)
- Initial API release
- Basic CRUD endpoints
- Health check endpoint

### v1.1.0 (Planned)
- Sync endpoints for multi-device support
- User authentication (optional)
- Analytics endpoints
