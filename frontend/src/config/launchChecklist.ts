export type LaunchChecklistStatus = "done" | "in_progress" | "pending";

export type LaunchChecklistItem = {
  id: string;
  title: string;
  status: LaunchChecklistStatus;
  summary: string;
  detail: string;
};

type LaunchChecklistArgs = {
  questionCount: number;
  mockQuestionCount: number;
  flashcardCount: number;
  identificationCount: number;
  visualReviewCount: number;
};

export const LIVE_MCQ_TARGET = 600;

export const buildLaunchChecklist = ({
  questionCount,
  mockQuestionCount,
  flashcardCount,
  identificationCount,
  visualReviewCount,
}: LaunchChecklistArgs): LaunchChecklistItem[] => [
  {
    id: "m1",
    title: "M1 Core App Stabilization",
    status: "done",
    summary: "Frontend build, backend loader, and audio-first review are stable.",
    detail: "Core app is already healthy enough to keep extending instead of rebuilding.",
  },
  {
    id: "m2",
    title: "M2 Conversion Pipeline",
    status: "done",
    summary: "All source PDFs were processed into staged review buckets.",
    detail: "The pipeline is ready; the bottleneck is now clean promotion, not extraction.",
  },
  {
    id: "m3",
    title: "M3 Safe Published Content v1",
    status: questionCount >= LIVE_MCQ_TARGET ? "done" : "in_progress",
    summary: `${questionCount} clean study MCQs live, plus ${mockQuestionCount} mock questions.`,
    detail: `Target is ${LIVE_MCQ_TARGET}-900 clean MCQs without reintroducing noisy OCR material.`,
  },
  {
    id: "m4",
    title: "M4 Review Modes Completion",
    status: "in_progress",
    summary: `Voice sprint, error replay, recall lab, mock exam, and visual figure drill are all live.`,
    detail: `${flashcardCount} flashcards, ${identificationCount} identification prompts, and ${visualReviewCount} visual cards already support the review flow; Android-width preview capture is in place, and native Android mic permission plus listening now work in the emulator.`,
  },
  {
    id: "m5",
    title: "M5 Launch Packaging",
    status: "in_progress",
    summary: "Offline bundle, Android beta APK workflow, container runtime check, and Stripe-backed premium unlock shell are in place.",
    detail: "The app now has backend billing endpoints, webhook/session verification, premium gating wired to the upgrade screen, a validated Docker runtime path, and an emulator-tested native speech-permission flow, but live Stripe env setup, hosted deployment, and real-device Android validation still need the finish pass.",
  },
  {
    id: "m6",
    title: "M6 Final QA and Launch Readiness",
    status: "pending",
    summary: "Final smoke checks, content spot-checks, and launch target verification remain.",
    detail: "This closes the loop only after content and packaging are stable.",
  },
];
