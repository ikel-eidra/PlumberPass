# PlumberPass API

Date updated: March 24, 2026

## Base URL

- local backend: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

## Authentication

The current API is open. There is no user-account auth layer yet.

## Response style

Responses are plain JSON objects or arrays returned directly from FastAPI. The API does not currently wrap everything in `data` / `meta` envelopes.

## Health

### `GET /health`

Returns:

```json
{
  "status": "ok"
}
```

## Study endpoints

### `GET /api/v1/study/items`

Returns the combined review payload:

```json
{
  "questions": [],
  "flashcards": [],
  "identification": [],
  "visual_review": []
}
```

### `GET /api/v1/study/topics`

Returns topic objects:

```json
[
  {
    "name": "Codes and Standards",
    "subtopics": ["Philippine Regulations", "Accessibility"]
  }
]
```

### `GET /api/v1/study/questions`

Returns normalized MCQs.

### `GET /api/v1/study/flashcards`

Returns flashcard items.

### `GET /api/v1/study/identification`

Returns identification items.

### `GET /api/v1/study/visual-review`

Returns visual review items with prompt, accepted answers, explanation, and image path.

### `GET /api/v1/study/mock-exams/1/part-a`

Returns mock exam part A items.

### `GET /api/v1/study/mock-exams/1/part-b`

Returns mock exam part B items.

## Billing endpoints

### `GET /api/v1/billing/config`

Returns whether hosted checkout is ready for the current origin.

### `GET /api/v1/billing/entitlement/{device_id}`

Returns the entitlement state for a device id.

### `POST /api/v1/billing/create-checkout-session`

Creates a Stripe-hosted checkout session when billing env is configured.

Request body:

```json
{
  "device_id": "device-123",
  "gate": "mock_exam",
  "success_path": "/upgrade?status=success",
  "cancel_path": "/upgrade?status=cancel"
}
```

### `POST /api/v1/billing/verify-checkout-session`

Verifies a Stripe checkout session against a device id.

### `POST /api/v1/billing/webhook`

Stripe webhook endpoint for entitlement grant/update.

## Model notes

### Question

- `id`
- `topic`
- `subtopic`
- `difficulty`
- `prompt`
- `choices`
- `answer_key`
- `explanation_short`
- `explanation_long`
- `tags`
- `source_ref`
- `quality_flag`

### Flashcard

- `id`
- `topic`
- `subtopic`
- `front`
- `back`
- `explanation_short`
- `explanation_long`
- `tags`
- `difficulty`
- `source_ref`
- `quality_flag`

### Identification item

- `id`
- `topic`
- `subtopic`
- `prompt`
- `accepted_answers`
- `explanation_short`
- `explanation_long`
- `tags`
- `difficulty`
- `source_ref`
- `quality_flag`

### Visual review item

- `id`
- `topic`
- `subtopic`
- `caption`
- `prompt`
- `accepted_answers`
- `image_path`
- `explanation_short`
- `explanation_long`

## Current limitations

- no account auth
- no sync API
- no analytics API
- billing remains env-gated until Stripe production configuration exists
