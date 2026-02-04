# PRD — FutolTech “PlumberPass” (Working Name)

**Product:** Mobile reviewer app (Android first; iOS-ready)
**Target Exam:** Master Plumber Licensure Exam — July 2026
**Core Mode:** Voice-first, hands-free, commute/work-friendly reviewer
**Framework:** FutolTech COL (Cell-Organ Logic) + Agile delivery

---

## 1) Vision & Value Proposition

**Vision:** Bigyan ang reviewee ng “always-on tutor” na kaya niyang gamitin habang nagwo-work, naglalakad, nagre-rest—na parang audiobook + interactive oral exam.

**Value Proposition:**

* **Hands-free voice exams** (speak your answers)
* **Adaptive learning** (focus sa weak areas)
* **Offline-first** (kahit walang net)
* **Fast update pipeline** (after every exam cycle, add resources + refine questions)

---

## 2) Goals (What success looks like)

### Primary goals

1. **Daily voice review habit** (commute mode)
2. **Higher passing probability** via spaced repetition + weak-area targeting
3. **Minimal friction onboarding** + personalized plan (July 2026 countdown)

### Metrics (MVP)

* D1 retention, D7 retention
* Avg daily minutes listened
* Completion rate per session
* Improvement trend per topic (accuracy over time)
* % users reaching target readiness score before exam date

---

## 3) Target Users & Personas

1. **Working Reviewee (ikaw / OFW / local worker):** limited time, needs audio + quick drills
2. **Full-time Reviewee:** wants structured plan + mock exams
3. **Repeat taker:** needs diagnostics + targeted remediation
4. **Commercial subscriber:** wants polished experience + updated question sets

---

## 4) Core User Journey

1. Install → Onboarding (profile + exam date + baseline)
2. App creates **Review Plan** (daily targets)
3. User starts **Audio Exam Session** (hands-free)
4. User answers by voice (A/B/C/D or full answer)
5. App gives instant feedback + short explanation
6. App logs mastery + schedules next repetition
7. Weekly mock exam + readiness dashboard
8. Content updates delivered post-exam cycles

---

## 5) Feature Set (MVP + Add-ons)

### A. Onboarding & Personalization (MVP)

**Inputs:**

* Exam date (July 2026 default; editable)
* Daily available time (e.g., 15/30/60 mins)
* Work schedule pattern (morning commute / night review)
* Current confidence per subject/topic (quick slider)
* Preferred language mode (English/Taglish)
* Baseline diagnostic: 20–50 items (mixed)

**Outputs:**

* Personalized plan: daily session structure
* Initial “weak map” + recommended sequence

---

### B. Voice-First Audio Exam Engine (MVP)

**Key requirement:** *App “talks” and user “speaks answers”*

**Modes:**

1. **Commute Mode (Hands-free):**

   * TTS reads question + choices
   * User answers: “A”, “B”, “C”, “D”
   * App confirms (“You said B, final?” optional quick confirm)
   * Instant feedback + short rationale
2. **Hard Mode (Oral Recall):**

   * No choices read (optional)
   * User says full answer
   * App checks against accepted answers + keywords (with tolerance)
3. **Review Mode:**

   * Fast replay of wrong items
   * “Explain like I’m busy” 10–20 sec explanation

**Voice UX details:**

* Wake phrase optional (or push-to-talk)
* Noise handling (commute): auto-reprompt if unclear
* “Repeat question”, “Next”, “Explain”, “Bookmark” voice commands
* Adjustable speaking speed + pause length

---

### C. Visual Mode + Hybrid Voice/Screen (MVP Addendum)

**Goal:** Hindi lang voice-first; may full screen-first mode din, plus hybrid.

**Visual interactions (must-have):**

* **Browse Mode:** list/grid ng Topics → Subtopics → Sets → Sessions
* **Swipe Mode:** “Tinder-style” Q-card navigation
  * Swipe left/right = next/previous question
  * Swipe up = show explanation
  * Swipe down = bookmark / add to Mistake Library
* **Tap/Click Mode:** classic MCQ interface with buttons A–E
* **Review Carousel:** wrong answers as cards, mabilis i-scan

**UI states:**

* Question card
* Choices A–E
* Timer (optional)
* “Explain” expandable panel
* Progress indicator (e.g., 7/20)
* Quick actions: Bookmark, Report issue, Repeat audio

**Hybrid behavior:**

* Screen shows question + choices; audio reads (optional toggle)
* User can answer by voice (“A / B / C / D / E”) or tap
* Hands-free confirm: “Final” / “Next” / “Repeat”
* If voice input uncertain:
  * App highlights top 2 guessed letters and asks for confirmation
  * Or auto-fallback to tap selection

**Core voice commands:**

* “Repeat”
* “Next”
* “Previous”
* “Explain”
* “Bookmark”
* “Slow down / Speed up”
* “Switch to silent mode”

---

### D. Content & Database (MVP)

You said you already have review materials — we treat them as **Source of Truth**.

**Content types supported:**

* Topics → subtopics → concept notes
* Question items:

  * Multiple choice (with distractors)
  * True/False
  * Identification / short answer
  * Situational problem solving (step-based)
* Explanations (short + long)
* Formula sheets / code references (if applicable)

**Content schema (suggested):**

* `Topic`, `Subtopic`, `Difficulty`, `SourceRef`, `QuestionText`, `Choices[]`, `AnswerKey`, `AcceptedAnswers[]`, `ExplanationShort`, `ExplanationLong`, `Tags[]`

---

### E. Study System (Scientific + Practical) (MVP)

Implement these learning mechanics:

* **Spaced repetition** (SM-2 style or similar)
* **Interleaving** (mix topics to prevent rote memorization)
* **Retrieval practice** (hard mode)
* **Error-based learning** (wrong answers get higher priority)
* **Time boxing** (15 min micro-sessions)

**Outputs:**

* Daily queue: New + Review + Weak-drill
* “Readiness score” per topic + overall

---

### F. Mock Exams & Readiness (MVP)

* Timed mock exam (full set)
* Topic-specific mini-mock
* Post-exam analytics:

  * Accuracy per topic
  * Time per question
  * Common error patterns
* “Exam day countdown” and weekly milestones

---

## 6) Best Extra Features to Add (High ROI)

These are strong, commercial-grade features that fit your concept:

1. **Offline-first packs**

   * Download topic packs + voice assets (TTS cached)
2. **Personal “NotebookLM pipeline” ingestion**

   * Admin uploads new materials → auto-generate QBank drafts → human review → publish update
3. **Mistake Library**

   * A dedicated feed of your wrong answers with explanations + “why you picked it” note (optional voice note)
4. **Voice Notes & Micro-lessons**

   * User can record a 15–30 sec “memory hook” per concept
5. **Daily Challenge**

   * 10-item streak; keeps habit alive
6. **Adaptive difficulty**

   * If consistent correct → harder variants; if struggling → simpler scaffolding questions
7. **Exam Simulation Audio**

   * “Full audio mock exam” you can take while walking
8. **Personalized Coaching Prompts**

   * Short weekly summary: “Top 3 weak topics this week + what to do next”
9. **Bookmarks + “Quick Drill”**

   * Saved items become flash drill set
10. **Community pack (later)**

* Paid: curated “Most repeated questions” / “Last cycle trend topics” (after enough data)

---

## 7) Admin & Update System (Required for commercial scalability)

### Admin Console (Web lightweight)

* Upload sources/materials (PDF/text)
* Manage topics/tags
* Import/export QBank (CSV/JSON)
* Approve NotebookLM-generated questions (review queue)
* Publish versioned updates:

  * `Content Pack v1.2 (Post-July-2026 refinement)`
* Analytics dashboard: item performance (which questions are too easy/ambiguous)

---

## 8) Non-Functional Requirements

* **Performance:** start audio session < 2 sec (cached)
* **Offline:** user can complete sessions without internet
* **Privacy:** local user progress stored securely; optional cloud sync
* **Reliability:** resume playback + session state after call interruption
* **Accessibility:** adjustable voice speed, font size, high contrast
* **Battery:** optimized background audio playback
* **Data safety:** content pack checksum + version control

---

## 9) Tech Notes (implementation-friendly)

* Platform: **Flutter or React Native** (Android-first)
* TTS: native TTS (Android) + iOS equivalent; cache generated audio or use realtime TTS
* STT (speech-to-text): on-device where possible; fallback to cloud with user consent
* Storage: SQLite/local DB for offline packs; optional cloud sync (Firestore/Supabase)
* Content pack format: JSON + versioning + integrity hash
* Telemetry (optional): anonymized learning metrics
* **Open-source first:** use open-source libraries where possible; avoid vendor lock-in
* Audio: native audio APIs + open-source audio player components

---

## 10) FutolTech COL Architecture (Cells → Organs)

### Cells (micro-workers)

1. **IdentityCell** – onboarding profile, preferences
2. **ContentCell** – topics, QBank, tagging, versions
3. **AudioTTSCell** – speech output, caching, speed controls
4. **VoiceAnswerCell** – capture speech, parse A/B/C/D, fallback UI
5. **ExamEngineCell** – session flow, question selection, scoring
6. **SchedulerCell** – spaced repetition queue, daily plan
7. **AnalyticsCell** – mastery scoring, weak map, readiness
8. **SyncCell** – download packs, updates, offline integrity
9. **MonetizationCell** – subscriptions, trials, coupons (later)

### Organs (bundles)

* **Learning Organ:** ExamEngine + Scheduler + Analytics
* **Voice Organ:** AudioTTS + VoiceAnswer
* **Content Organ:** Content + Sync
* **Business Organ:** Monetization + Admin publishing pipeline

This keeps the app easy i-upgrade per exam cycle.

---

## 11) Monetization Plan (Simple but strong)

* **Free tier:** limited daily questions + 1 mock exam/week
* **Premium:** unlimited, offline packs, full analytics, full mock exams, advanced hard mode
* **Pricing idea:** affordable monthly + exam-season bundle (3–4 months)

---

## 12) Milestones (Agile Sprints)

### Sprint 0 (Setup)

* Repo + basic UI shell + local DB + content schema

### Sprint 1 (MVP Core)

* Onboarding + basic QBank + simple session (tap answers)

### Sprint 2 (Voice)

* TTS reads Qs + STT answers A/B/C/D + feedback loop

### Sprint 3 (Learning Engine)

* Spaced repetition + weak map + daily plan

### Sprint 4 (Mock Exams + Offline Packs)

* Timed mock + downloadable packs

### Sprint 5 (Admin Publishing)

* Upload → review → publish content pack versions

---

## 13) Risks & Mitigations

* **STT accuracy in noisy commute** → allow “A/B/C/D” only in commute mode + repeat/confirm logic
* **Ambiguous questions from materials** → admin review queue; track item difficulty + complaint flag
* **Content copyright/ownership** → keep sources controlled (your materials first); later use licensed/public domain/own generated with citations
* **Scope creep** → keep July 2026 MVP tight; extras gated behind feature flags

---

## 14) Acceptance Criteria (MVP must pass)

1. User can onboard in < 3 minutes
2. User can start an audio exam session and finish hands-free
3. App correctly captures A/B/C/D by voice with retry path
4. App stores progress offline and resumes sessions
5. App shows weak topics + daily queue
6. Admin can publish updated question pack without reinstall
7. User can switch between Voice-only / Screen-only / Hybrid modes
8. App supports MCQ up to A–E in UI + voice
9. Swipe navigation works smoothly for Q-cards
10. Audio experience feels “radio-grade” (no jarring transitions; background controls work)

---

## 15) Audio Brand Style (FutolTech “Radio/Spotify” UX)

**Goal:** Polished audio identity—parang premium radio/Spotify: clean, engaging, non-annoying.

**Audio style requirements:**

* Short intro sting (0.5–1.5s) optional, can be disabled
* Consistent voice persona (calm, clear, “trusted coach”)
* Micro-prompts that feel like radio cues:
  * “Next question.”
  * “Lock in your answer.”
  * “Quick explanation.”

**Ad slot architecture (commercial-ready):**

* Free tier: optional short audio ad every N questions / end of session
* Premium: no ads

**“Radio Mode” playlist:**

* Continuous stream: mixed questions + short concept reminders
* Auto-pauses on phone call; resumes smoothly

**Non-negotiable UX:**

* No loud volume spikes (normalize audio levels)
* Adjustable voice speed + pitch (within natural range)
* Background playback + lock screen controls

---

## 16) Multiple Choice A–E Support (MVP Requirement)

**Requirement:** Actual exam can go up to E, so app must support A–E consistently.

**Rules:**

* MCQ choices default A–D, but support A–E per item
* Voice answer parser must recognize A/B/C/D/E (including “letter E”)
* UI must render 4 or 5 options cleanly (responsive layout)
* Analytics treats A–E equally (no assumptions about 4-choice only)

---

## 17) Voice Selections (Fast + Reliable)

**Commute Mode recommended default:**

* Voice answers limited to A–E only (no long dictation)
* Optional confirm: “You said E. Final?” (configurable)

**Misheard handling:**

* If STT confidence low → “Please repeat: A to E”
* If repeated failure → auto-display big buttons for tap
