# PlumberPass Elevation Research

Date: March 24, 2026

## Current Position

- Core reviewer, content pipeline, and Android beta path are real.
- Live content baseline:
  - 656 study MCQs
  - 643 flashcards
  - 598 identification prompts
  - 43 visual review cards
  - 100 mock items
- Main remaining launch work is no longer raw content rescue. It is product polish, real-device validation, and deployment.

## What The Research Supports

### 1. Keep retrieval practice and spacing as the center of the product

PlumberPass is already strongest when it forces recall instead of passive rereading. That stays correct. Recent reviews continue to support retrieval practice, spacing, and interleaving over passive review.

Implication for the app:
- due-first queue stays the default
- mistake replay stays central
- mixed-topic spoken review remains a strength

Sources:
- https://pmc.ncbi.nlm.nih.gov/articles/PMC12343689/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC10229024/

### 2. The next lift is better study control, not more visual noise

Android and Material guidance favor clear navigation, predictable controls, and contextual settings rather than decorative complexity. For PlumberPass, that means:

- make the next action obvious
- keep settings one tap away from study
- use cards and navigation consistently
- avoid mode confusion during review

Sources:
- https://developer.android.com/design/ui
- https://developer.android.com/design/ui/mobile/guides/patterns/settings
- https://m3.material.io/components/navigation-bar/overview
- https://m3.material.io/components/cards/overview

### 3. Metacognitive guidance is the next product upgrade

Study tools improve when they help learners plan, monitor, and adjust, not just answer more items. Exam wrappers, reflection prompts, and guided session planning are strongly supported in the learning literature.

Implication for the app:
- recommend the next best move from actual due, mistake, and topic data
- highlight weak-topic focus, not just total counts
- add short post-session guidance instead of generic encouragement

Source:
- https://pmc.ncbi.nlm.nih.gov/articles/PMC11044636/

### 4. A future resident AI should be a coach, not a chat distraction

The future AI layer should organize the learner, explain patterns, recommend next sessions, and help with review strategy. It should not become an always-open answer machine that breaks retrieval practice.

Good future roles:
- daily study planner
- weak-topic explainer
- voice command assistant
- mock-exam debrief coach

Source:
- https://pmc.ncbi.nlm.nih.gov/articles/PMC8319668/

### 5. Voice quality and control still matter for trust

Android supports speech-rate control and speech recognition, but the app experience depends on practical handling:

- easy speed changes
- reliable listening transitions
- clearer fallback when dictation fails
- fewer speech collisions between TTS and recognition

Sources:
- https://developer.android.com/reference/android/speech/tts/TextToSpeech
- https://developer.android.com/reference/android/speech/SpeechRecognizer

## Highest-Value Product Upgrades From Here

### Launch-near upgrades

1. Real-device voice validation
- test spoken playback, dictation, and answer capture on an actual Android phone
- add a speech-dialog fallback if direct in-app capture remains flaky on some devices

2. Study coach layer
- convert existing due, mistake, and topic signals into a concrete daily plan
- keep the learner moving to the best next session with one tap

3. Mock exam debrief
- turn the mock summary into a stronger remediation screen:
  - weakest segment
  - highest-error topic
  - immediate jump to correction set

4. Deployment finish
- live PWA target
- live Stripe env
- stable install flow validation

### Post-v1 upgrades

1. Resident AI coach
- voice commands like `repeat`, `slower`, `focus plumbing code`, `start mock`
- daily planning and readiness explanation

2. Confidence-based remediation
- track low, medium, high confidence after answers
- prioritize wrong-high-confidence items because they signal dangerous false certainty

3. Blueprint-weighted study routing
- bias weak-topic recommendations toward PRC exam weight while still preserving interleaving

4. Better narrated voice pack selection
- prefer calmer installed native voices by device
- save per-user narrator preference and fallback path

## Changes Applied In This Pass

- Added a `Coach Plan` section to the dashboard using live due, mistake, and weak-topic data.
- Added one-tap `Focus weakest topic` behavior instead of leaving the next move implicit.
- Wired the readiness report so its action buttons are real and lead back into the study flow.

## Recommended Sequence

1. Finish real-device Android voice validation.
2. Tighten the mock debrief into a stronger remediation loop.
3. Finish hosted deployment and live billing env.
4. Only then expand into resident AI coaching.
