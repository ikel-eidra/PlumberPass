import { Capacitor } from "@capacitor/core";
import { useEffect, useMemo, useRef, useState } from "react";
import MistakeLibrary from "./components/MistakeLibrary";
import ModeToggle from "./components/ModeToggle";
import QuestionCard from "./components/QuestionCard";
import ThemeToggle, { type UiTheme } from "./components/ThemeToggle";
import TopicList from "./components/TopicList";
import { type SpeechRatePreset, useAudioReview } from "./hooks/useAudioReview";
import { useStudyProgress } from "./hooks/useStudyProgress";
import ActiveStudy from "./screens/ActiveStudy";
import { MASTER_PLUMBER_EXAM, type ExamSubjectBlueprint } from "./config/examBlueprint";
import { APP_BRAND } from "./config/brand";
import {
  COMMERCE_CONFIG,
  buildFallbackBillingConfig,
  buildFreeEntitlement,
  buildNativeBetaPremiumEntitlement,
  type BillingConfig,
  type BillingEntitlement,
  type BillingSessionVerifyResponse,
  isNativeBetaPremiumOverrideEnabled,
  type PremiumGate,
  type SubscriptionTier,
} from "./config/commerce";
import Dashboard from "./screens/Dashboard";
import MasteryReport from "./screens/MasteryReport";
import MistakeLibraryScreen from "./screens/MistakeLibraryScreen";
import NativeSafeDashboard from "./screens/NativeSafeDashboard";
import SettingsScreen from "./screens/SettingsScreen";
import UpgradeScreen from "./screens/UpgradeScreen";
import VisualReview from "./screens/VisualReview";
import "./styles/app.css";
import "./styles/theme.css";

export type Choice = {
  label: string;
  text: string;
};

export type Question = {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  prompt: string;
  choices: Choice[];
  answer_key: string;
  explanation_short: string;
  explanation_long: string;
  tags: string[];
  source_ref?: string | null;
  quality_flag?: string | null;
};

export type Flashcard = {
  id: string;
  topic: string;
  subtopic: string;
  front: string;
  back: string;
  explanation_short: string;
  explanation_long: string;
  tags: string[];
  difficulty: number;
  source_ref: string;
  quality_flag: string;
};

export type IdentificationItem = {
  id: string;
  topic: string;
  subtopic: string;
  prompt: string;
  accepted_answers: string[];
  explanation_short: string;
  explanation_long: string;
  tags: string[];
  difficulty: number;
  source_ref: string;
  quality_flag: string;
};

export type VisualReviewItem = {
  id: string;
  topic: string;
  subtopic: string;
  prompt: string;
  answer: string;
  accepted_answers: string[];
  caption: string;
  image_path: string;
  explanation_short: string;
  explanation_long: string;
  tags: string[];
  difficulty: number;
  source_ref: string;
  quality_flag: string;
};

export type Topic = {
  name: string;
  subtopics: string[];
};

type StudyBundle = {
  topics: Topic[];
  questions: Question[];
  flashcards: Flashcard[];
  identification: IdentificationItem[];
  visual_review: VisualReviewItem[];
  mock_questions: Question[];
};

type MockApiQuestion = {
  id: string;
  topic: string;
  subtopic: string;
  prompt: string;
  choices: Choice[];
  answer_key: string;
  explanation_short: string;
  explanation_long: string;
  difficulty: number;
  source_ref: string;
  quality_flag: string;
};

const fallbackQuestion: Question = {
  id: "demo",
  topic: "Loading",
  subtopic: "",
  difficulty: "",
  prompt: "Fetching the next question...",
  choices: [
    { label: "A", text: "" },
    { label: "B", text: "" },
    { label: "C", text: "" },
    { label: "D", text: "" },
  ],
  answer_key: "A",
  explanation_short: "",
  explanation_long: "",
  tags: [],
};

const emptyStudyBundle: StudyBundle = {
  topics: [],
  questions: [fallbackQuestion],
  flashcards: [],
  identification: [],
  visual_review: [],
  mock_questions: [],
};

const modes = ["Voice", "Screen", "Hybrid"] as const;
export type Mode = (typeof modes)[number];
type Screen =
  | "Landing"
  | "Dashboard"
  | "Review"
  | "ActiveStudy"
  | "VisualReview"
  | "MasteryReport"
  | "MistakeLibrary"
  | "Settings"
  | "Upgrade";

const previewScreenMap: Record<string, Screen> = {
  landing: "Landing",
  dashboard: "Dashboard",
  review: "Review",
  active: "ActiveStudy",
  visual: "VisualReview",
  report: "MasteryReport",
  mistakes: "MistakeLibrary",
  settings: "Settings",
  upgrade: "Upgrade",
};

const EXPLICIT_API_BASE = import.meta.env.VITE_API_URL?.trim() ?? "";
const IS_NATIVE_RUNTIME = Capacitor.isNativePlatform();

const resolveApiBase = () => {
  if (EXPLICIT_API_BASE) {
    return EXPLICIT_API_BASE;
  }

  if (import.meta.env.DEV && typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const hostname = window.location.hostname || "127.0.0.1";
    return `${protocol}//${hostname}:8000`;
  }

  return "";
};

const API_BASE = resolveApiBase();
const API_RUNTIME_ENABLED = !IS_NATIVE_RUNTIME || Boolean(EXPLICIT_API_BASE) || import.meta.env.DEV;
let apiAvailabilityPromise: Promise<boolean> | null = null;
const SUBSCRIPTION_STORAGE_KEY = "pp_subscription_tier_v1";
const BILLING_DEVICE_STORAGE_KEY = "pp_billing_device_id_v1";
const THEME_STORAGE_KEY = "pp_ui_theme_v1";

const fetchApiJson = async <T,>(path: string, fallback: T): Promise<T> => {
  if (!API_RUNTIME_ENABLED) {
    return fallback;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
};

const fetchPublicJson = async <T,>(path: string, fallback: T): Promise<T> => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
};

const postApiJson = async <T, B>(path: string, body: B): Promise<T | null> => {
  if (!API_RUNTIME_ENABLED) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const canReachApi = async (forceRefresh = false): Promise<boolean> => {
  if (!API_RUNTIME_ENABLED) {
    apiAvailabilityPromise = null;
    return false;
  }

  if (forceRefresh) {
    apiAvailabilityPromise = null;
  }

  if (apiAvailabilityPromise) {
    return apiAvailabilityPromise;
  }

  apiAvailabilityPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 1500);
      const response = await fetch(`${API_BASE}/health`, {
        method: "GET",
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  })();

  return apiAvailabilityPromise;
};

const normalizeVoiceText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripVoiceFillers = (value: string) => {
  const fillerWords = new Set([
    "answer",
    "choice",
    "choose",
    "i",
    "is",
    "it",
    "letter",
    "my",
    "option",
    "pick",
    "select",
    "the",
  ]);

  return normalizeVoiceText(value)
    .split(" ")
    .filter((token) => token && !fillerWords.has(token))
    .join(" ");
};

const parseVoiceAnswer = (transcript: string, question: Question) => {
  const normalized = normalizeVoiceText(transcript);
  if (!normalized) {
    return null;
  }

  const tokenMatch = normalized.match(/\b([abcde])\b/);
  if (tokenMatch) {
    return tokenMatch[1].toUpperCase();
  }

  const phoneticLetterMap: Record<string, string> = {
    a: "A",
    ay: "A",
    b: "B",
    be: "B",
    bee: "B",
    c: "C",
    d: "D",
    dee: "D",
    di: "D",
    e: "E",
    ee: "E",
    sea: "C",
    see: "C",
  };

  const strippedTranscript = stripVoiceFillers(transcript);
  const strippedTokens = strippedTranscript.split(" ").filter(Boolean);
  if (strippedTokens.length === 1) {
    const mapped = phoneticLetterMap[strippedTokens[0]];
    if (mapped) {
      return mapped;
    }
  }

  const candidates = question.choices
    .map((choice) => {
      const normalizedChoice = normalizeVoiceText(choice.text);
      const choiceTokens = normalizedChoice.split(" ").filter(Boolean);

      if (!normalizedChoice) {
        return { label: choice.label, score: 0 };
      }

      if (strippedTranscript === normalizedChoice) {
        return { label: choice.label, score: 1 };
      }

      if (
        strippedTranscript.length >= 3 &&
        (strippedTranscript.includes(normalizedChoice) ||
          normalizedChoice.includes(strippedTranscript))
      ) {
        return { label: choice.label, score: 1 };
      }

      if (strippedTokens.length < 2) {
        return { label: choice.label, score: 0 };
      }

      const overlap = choiceTokens.filter((token) => strippedTokens.includes(token)).length;
      const score = choiceTokens.length ? overlap / choiceTokens.length : 0;
      return { label: choice.label, score };
    })
    .sort((left, right) => right.score - left.score);

  if (
    candidates[0] &&
    candidates[0].score >= 0.66 &&
    (!candidates[1] || candidates[0].score > candidates[1].score)
  ) {
    return candidates[0].label;
  }

  return null;
};

const speechRateOptions: Array<{ id: SpeechRatePreset; label: string }> = [
  { id: "extraSlow", label: "Extra Slow" },
  { id: "slow", label: "Slow" },
  { id: "normal", label: "Normal" },
  { id: "fast", label: "Fast" },
];

const normalizeMockQuestion = (question: MockApiQuestion): Question => ({
  id: question.id,
  topic: question.topic,
  subtopic: question.subtopic,
  difficulty: String(question.difficulty),
  prompt: question.prompt,
  choices: question.choices,
  answer_key: question.answer_key,
  explanation_short: question.explanation_short,
  explanation_long: question.explanation_long,
  tags: [],
  source_ref: question.source_ref,
  quality_flag: question.quality_flag,
});

const loadStudyBundle = async (): Promise<StudyBundle> => {
  const bundle = await fetchPublicJson<StudyBundle>("/study-bundle.json", emptyStudyBundle);
  return {
    topics: bundle.topics ?? [],
    questions: bundle.questions?.length ? bundle.questions : [fallbackQuestion],
    flashcards: bundle.flashcards ?? [],
    identification: bundle.identification ?? [],
    visual_review: bundle.visual_review ?? [],
    mock_questions: bundle.mock_questions ?? [],
  };
};

const loadStudyApi = async (): Promise<StudyBundle> => {
  const [
    topicResponse,
    questionResponse,
    flashcardResponse,
    identificationResponse,
    visualReviewResponse,
    mockPartAResponse,
    mockPartBResponse,
  ] = await Promise.all([
    fetchApiJson<Topic[]>("/api/v1/study/topics", []),
    fetchApiJson<Question[]>("/api/v1/study/questions", [fallbackQuestion]),
    fetchApiJson<Flashcard[]>("/api/v1/study/flashcards", []),
    fetchApiJson<IdentificationItem[]>("/api/v1/study/identification", []),
    fetchApiJson<VisualReviewItem[]>("/api/v1/study/visual-review", []),
    fetchApiJson<MockApiQuestion[]>("/api/v1/study/mock-exams/1/part-a", []),
    fetchApiJson<MockApiQuestion[]>("/api/v1/study/mock-exams/1/part-b", []),
  ]);

  return {
    topics: topicResponse,
    questions: questionResponse.length ? questionResponse : [fallbackQuestion],
    flashcards: flashcardResponse,
    identification: identificationResponse,
    visual_review: visualReviewResponse,
    mock_questions: [...mockPartAResponse, ...mockPartBResponse].map(normalizeMockQuestion),
  };
};

const hasUsableStudyBundle = (bundle: StudyBundle) =>
  bundle.questions.some((question) => question.id !== fallbackQuestion.id);

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );

const formatDurationLabel = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const readStoredTier = (): SubscriptionTier => {
  if (isNativeBetaPremiumOverrideEnabled()) {
    return "premium";
  }

  if (typeof window === "undefined") {
    return "free";
  }

  const raw = window.localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
  return raw === "premium" ? "premium" : "free";
};

const readStoredTheme = (): UiTheme => {
  if (typeof window === "undefined") {
    return "night";
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === "paper" ? "paper" : "night";
};

const createDeviceId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `pp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
};

const readStoredDeviceId = (): string => {
  if (typeof window === "undefined") {
    return "pp-server";
  }

  const raw = window.localStorage.getItem(BILLING_DEVICE_STORAGE_KEY);
  if (raw) {
    return raw;
  }

  const nextId = createDeviceId();
  window.localStorage.setItem(BILLING_DEVICE_STORAGE_KEY, nextId);
  return nextId;
};

const clearCheckoutParams = () => {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete("checkout");
  url.searchParams.delete("session_id");
  window.history.replaceState({}, "", url);
};

const resolveInitialScreen = (): Screen => {
  if (typeof window === "undefined") {
    return "Landing";
  }
  const params = new URLSearchParams(window.location.search);
  const requestedScreen = params.get("screen")?.toLowerCase() ?? "";
  return previewScreenMap[requestedScreen] ?? "Landing";
};

const fetchBillingConfig = async (): Promise<BillingConfig> =>
  fetchApiJson<BillingConfig>("/api/v1/billing/config", buildFallbackBillingConfig());

const fetchEntitlement = async (deviceId: string): Promise<BillingEntitlement> =>
  fetchApiJson<BillingEntitlement>(
    `/api/v1/billing/entitlement/${encodeURIComponent(deviceId)}`,
    isNativeBetaPremiumOverrideEnabled()
      ? buildNativeBetaPremiumEntitlement(deviceId)
      : buildFreeEntitlement(deviceId),
  );

type MockSegment = ExamSubjectBlueprint & {
  itemCount: number;
  startIndex: number;
  endIndex: number;
};

const buildMockSegments = (
  totalItems: number,
  subjects: ExamSubjectBlueprint[],
): MockSegment[] => {
  if (!totalItems || subjects.length === 0) {
    return [];
  }

  const rawCounts = subjects.map((subject) => (totalItems * subject.weight) / 100);
  const baseCounts = rawCounts.map((value) => Math.floor(value));
  let remainder = totalItems - baseCounts.reduce((sum, value) => sum + value, 0);

  const fractionalOrder = rawCounts
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((left, right) => right.fraction - left.fraction);

  for (const item of fractionalOrder) {
    if (remainder <= 0) {
      break;
    }
    baseCounts[item.index] += 1;
    remainder -= 1;
  }

  let cursor = 0;
  return subjects.map((subject, index) => {
    const itemCount = baseCounts[index];
    const startIndex = cursor;
    const endIndex = Math.max(cursor, cursor + itemCount - 1);
    cursor += itemCount;

    return {
      ...subject,
      itemCount,
      startIndex,
      endIndex,
    };
  });
};

export default function App() {
  const nativeBetaPremiumOverride = isNativeBetaPremiumOverrideEnabled();
  const nativeSafeUi = IS_NATIVE_RUNTIME;
  const [mode, setMode] = useState<Mode>("Voice");
  const [theme, setTheme] = useState<UiTheme>(readStoredTheme);
  const [screen, setScreen] = useState<Screen>(resolveInitialScreen);
  const [selectedTopicName, setSelectedTopicName] = useState<string | null>(null);
  const [deviceId] = useState(readStoredDeviceId);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(readStoredTier);
  const [billingConfig, setBillingConfig] = useState<BillingConfig>(buildFallbackBillingConfig);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [upgradeGate, setUpgradeGate] = useState<PremiumGate>("premium");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([fallbackQuestion]);
  const [mockQuestions, setMockQuestions] = useState<Question[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [identifications, setIdentifications] = useState<IdentificationItem[]>([]);
  const [visualReviewItems, setVisualReviewItems] = useState<VisualReviewItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isMistakeReview, setIsMistakeReview] = useState(false);
  const [isMockExam, setIsMockExam] = useState(false);
  const [mockStartedAt, setMockStartedAt] = useState<number | null>(null);
  const [mockCompletedAt, setMockCompletedAt] = useState<number | null>(null);
  const [mockAnswers, setMockAnswers] = useState<Record<string, string>>({});
  const [clockTick, setClockTick] = useState(Date.now());
  const answerTapTimestampRef = useRef(0);
  const answerCommitLockRef = useRef<{ questionId: string; until: number } | null>(null);
  const {
    availableVoices,
    clearTranscript,
    isListening,
    isRecognitionSupported,
    isSpeaking,
    isSpeechSupported,
    readExplanation,
    readQuestion,
    selectedVoiceId,
    setSelectedVoiceId,
    speechRatePreset,
    speakFeedback,
    startListening,
    status: voiceStatus,
    setSpeechRatePreset,
    stopAudio,
    transcript: voiceTranscript,
  } = useAudioReview();
  const {
    bookmarkedQuestions,
    isBookmarked,
    mistakeEntries,
    mistakeQuestions,
    recordAnswer,
    reviewQueue,
    stats,
    toggleBookmark,
  } = useStudyProgress(questions, mockQuestions);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === "paper" ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, subscriptionTier);
  }, [subscriptionTier]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(BILLING_DEVICE_STORAGE_KEY, deviceId);
  }, [deviceId]);

  useEffect(() => {
    const load = async () => {
      const apiAvailable = await canReachApi();
      const apiBundle = apiAvailable ? await loadStudyApi() : emptyStudyBundle;
      const nextBundle = hasUsableStudyBundle(apiBundle) ? apiBundle : await loadStudyBundle();

      setTopics(nextBundle.topics);
      setQuestions(nextBundle.questions.length ? nextBundle.questions : [fallbackQuestion]);
      setFlashcards(nextBundle.flashcards);
      setIdentifications(nextBundle.identification);
      setVisualReviewItems(nextBundle.visual_review);
      setMockQuestions(nextBundle.mock_questions);

      if (!apiAvailable) {
        if (nativeBetaPremiumOverride) {
          setSubscriptionTier("premium");
          setBillingMessage("Native beta premium override is active for this test APK.");
        }
        return;
      }

      const nextBillingConfig = await fetchBillingConfig();
      setBillingConfig(nextBillingConfig);

      const entitlement = await fetchEntitlement(deviceId);
      setSubscriptionTier(nativeBetaPremiumOverride || entitlement.premium_active ? "premium" : "free");
      if (nativeBetaPremiumOverride) {
        setBillingMessage("Native beta premium override is active for this test APK.");
      }
    };
    load();
  }, [deviceId, nativeBetaPremiumOverride]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get("checkout");
    const sessionId = params.get("session_id");

    if (checkoutState === "canceled") {
      setBillingMessage("Stripe checkout was canceled. The free plan is still active.");
      setBillingError(null);
      setScreen("Upgrade");
      clearCheckoutParams();
      return;
    }

    if (checkoutState === "success" && sessionId) {
      void verifyReturnedCheckout(sessionId);
    }
  }, [deviceId]);

  const resetReviewCard = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
  };

  const stopAudioForNavigation = () => {
    if (IS_NATIVE_RUNTIME && screen === "Landing") {
      return;
    }
    void stopAudio();
  };

  const refreshEntitlement = async () => {
    const apiAvailable = await canReachApi(true);
    if (!apiAvailable) {
      setBillingError("Backend billing is offline. Premium checkout needs the API running.");
      return;
    }

    setBillingError(null);
    const nextBillingConfig = await fetchBillingConfig();
    setBillingConfig(nextBillingConfig);

    const entitlement = await fetchEntitlement(deviceId);
    setSubscriptionTier(nativeBetaPremiumOverride || entitlement.premium_active ? "premium" : "free");
    setBillingMessage(
      nativeBetaPremiumOverride || entitlement.premium_active
        ? "Premium is active on this device."
        : nextBillingConfig.checkout_ready
          ? "This device is still on the free plan."
          : "Live checkout is not configured yet, so the app is still using the prototype path.",
    );
  };

  const verifyReturnedCheckout = async (sessionId: string) => {
    const apiAvailable = await canReachApi(true);
    if (!apiAvailable) {
      setBillingError("Checkout returned, but the billing API is offline. Start the backend and refresh.");
      clearCheckoutParams();
      return;
    }

    const nextBillingConfig = await fetchBillingConfig();
    setBillingConfig(nextBillingConfig);

    const result = await postApiJson<
      BillingSessionVerifyResponse,
      { session_id: string; device_id: string }
    >("/api/v1/billing/verify-checkout-session", {
      session_id: sessionId,
      device_id: deviceId,
    });

    if (!result) {
      setBillingError("Stripe checkout could not be verified yet. Try Refresh premium status.");
      clearCheckoutParams();
      return;
    }

    const premiumActive = result.premium_active || result.tier === "premium";
    setSubscriptionTier(nativeBetaPremiumOverride || premiumActive ? "premium" : "free");
    setBillingError(null);
    setBillingMessage(
      nativeBetaPremiumOverride || premiumActive
        ? "Premium unlocked successfully on this device."
        : "Checkout returned, but payment is not marked paid yet. Try Refresh premium status.",
    );
    setScreen("Upgrade");
    clearCheckoutParams();
  };

  const startStripeCheckout = async () => {
    const apiAvailable = await canReachApi(true);
    if (!apiAvailable) {
      setBillingError("Backend billing is offline. Start the API before launching card checkout.");
      return;
    }

    const nextBillingConfig = await fetchBillingConfig();
    setBillingConfig(nextBillingConfig);
    if (!nextBillingConfig.checkout_ready) {
      setBillingError("Stripe card checkout is not configured yet. Set the server billing env first.");
      return;
    }

    setIsStartingCheckout(true);
    setBillingError(null);
    setBillingMessage(null);

    const session = await postApiJson<
      { session_id: string; checkout_url: string },
      { device_id: string; gate: PremiumGate; success_path: string; cancel_path: string }
    >("/api/v1/billing/create-checkout-session", {
      device_id: deviceId,
      gate: upgradeGate,
      success_path: "/?screen=upgrade&checkout=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_path: "/?screen=upgrade&checkout=canceled",
    });

    setIsStartingCheckout(false);

    if (!session?.checkout_url) {
      setBillingError("Stripe checkout session could not be created. Check the server billing env.");
      return;
    }

    window.location.assign(session.checkout_url);
  };

  const openUpgrade = (gate: PremiumGate = "premium") => {
    stopAudioForNavigation();
    setUpgradeGate(gate);
    setBillingError(null);
    setBillingMessage(null);
    setScreen("Upgrade");
  };

  const openSettings = () => {
    stopAudioForNavigation();
    setScreen("Settings");
  };

  const startStandardReview = () => {
    stopAudioForNavigation();
    resetReviewCard();
    setSelectedTopicName(null);
    setIsMistakeReview(false);
    setIsMockExam(false);
    setMockStartedAt(null);
    setMockCompletedAt(null);
    setMockAnswers({});
    setActiveIndex(0);
    setMode("Voice");
    setScreen("Review");
  };

  const startTopicFocusSession = (topicName?: string | null) => {
    if (!topicName) {
      startStandardReview();
      return;
    }

    stopAudioForNavigation();
    resetReviewCard();
    setSelectedTopicName(topicName);
    setIsMistakeReview(false);
    setIsMockExam(false);
    setMockStartedAt(null);
    setMockCompletedAt(null);
    setMockAnswers({});
    setActiveIndex(0);
    setMode("Voice");
    setScreen("Review");
  };

  const startMistakeReplay = (questionId?: string) => {
    stopAudioForNavigation();
    resetReviewCard();
    setSelectedTopicName(null);
    setIsMistakeReview(true);
    setIsMockExam(false);
    setMockStartedAt(null);
    setMockCompletedAt(null);
    setMockAnswers({});
    setMode("Voice");
    setActiveIndex(
      questionId
        ? Math.max(
            0,
            mistakeQuestions.findIndex((item) => item.id === questionId),
          )
        : 0,
    );
    setScreen("Review");
  };

  const startMockExamSession = () => {
    if (subscriptionTier !== "premium") {
      openUpgrade("mock");
      return;
    }

    stopAudioForNavigation();
    resetReviewCard();
    setSelectedTopicName(null);
    setIsMistakeReview(false);
    setIsMockExam(true);
    setMockStartedAt(Date.now());
    setMockCompletedAt(null);
    setMockAnswers({});
    setActiveIndex(0);
    setMode("Hybrid");
    setScreen("Review");
  };

  const startVisualReview = () => {
    if (subscriptionTier !== "premium") {
      openUpgrade("visual");
      return;
    }

    stopAudioForNavigation();
    setSelectedTopicName(null);
    setIsMistakeReview(false);
    setIsMockExam(false);
    setMockStartedAt(null);
    setMockCompletedAt(null);
    setMockAnswers({});
    setScreen("VisualReview");
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const modeParam = new URLSearchParams(window.location.search).get("mode");
    if (modeParam === "voice" || modeParam === "audio") {
      stopAudio();
      resetReviewCard();
      setMode("Voice");
      setSelectedTopicName(null);
      setIsMockExam(false);
      setIsMistakeReview(false);
      setMockStartedAt(null);
      setMockCompletedAt(null);
      setMockAnswers({});
      setActiveIndex(0);
      setScreen("Review");
      return;
    }

    if (modeParam === "mistakes") {
      stopAudio();
      setMode("Voice");
      setSelectedTopicName(null);
      setIsMockExam(false);
      setMockStartedAt(null);
      setMockCompletedAt(null);
      setMockAnswers({});
      setIsMistakeReview(true);
      setScreen("MistakeLibrary");
      return;
    }

    if (modeParam === "recall") {
      setIsMockExam(false);
      setIsMistakeReview(false);
      setSelectedTopicName(null);
      setMockStartedAt(null);
      setMockCompletedAt(null);
      setMockAnswers({});
      setScreen("ActiveStudy");
      return;
    }

    if (modeParam === "visual") {
      if (subscriptionTier !== "premium") {
        openUpgrade("visual");
      } else {
        stopAudio();
        setIsMockExam(false);
        setIsMistakeReview(false);
        setMockStartedAt(null);
        setMockCompletedAt(null);
        setMockAnswers({});
        setScreen("VisualReview");
      }
      return;
    }

    if (modeParam === "mock") {
      if (subscriptionTier !== "premium") {
        openUpgrade("mock");
      } else {
        stopAudio();
        resetReviewCard();
        setMode("Hybrid");
        setSelectedTopicName(null);
        setIsMockExam(true);
        setIsMistakeReview(false);
        setMockStartedAt(Date.now());
        setMockCompletedAt(null);
        setMockAnswers({});
        setActiveIndex(0);
        setScreen("Review");
      }
    }
  }, [subscriptionTier]);

  const currentQuestions = useMemo(() => {
    if (isMockExam) {
      return mockQuestions;
    }
    if (isMistakeReview) {
      return mistakeQuestions;
    }
    if (!selectedTopicName) {
      return reviewQueue;
    }
    const filtered = reviewQueue.filter((item) => item.topic === selectedTopicName);
    return filtered.length ? filtered : reviewQueue;
  }, [isMistakeReview, isMockExam, mistakeQuestions, mockQuestions, reviewQueue, selectedTopicName]);

  const question = currentQuestions[activeIndex] ?? fallbackQuestion;
  const activeMockAnswer = isMockExam ? mockAnswers[question.id] ?? null : null;
  const effectiveSelectedAnswer = isMockExam ? activeMockAnswer : selectedAnswer;
  const daysToExam = useMemo(() => {
    const examDate = new Date(MASTER_PLUMBER_EXAM.examDate);
    const diff = examDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, []);
  const applicationDeadlineLabel = useMemo(
    () => formatDateLabel(MASTER_PLUMBER_EXAM.applicationDeadline),
    [],
  );

  const progressLabel = useMemo(() => {
    return `${activeIndex + 1}/${Math.max(currentQuestions.length, 1)}`;
  }, [activeIndex, currentQuestions.length]);
  const mockTimeRemainingLabel = useMemo(() => {
    if (!isMockExam || !mockStartedAt) {
      return "60:00";
    }
    const remainingMs = Math.max(0, 60 * 60 * 1000 - (clockTick - mockStartedAt));
    return formatDurationLabel(remainingMs);
  }, [clockTick, isMockExam, mockStartedAt]);
  const mockAnsweredCount = useMemo(
    () => Object.keys(mockAnswers).length,
    [mockAnswers],
  );
  const mockCorrectCount = useMemo(
    () =>
      mockQuestions.reduce(
        (sum, item) => sum + (mockAnswers[item.id] === item.answer_key ? 1 : 0),
        0,
      ),
    [mockAnswers, mockQuestions],
  );
  const mockRemainingCount = Math.max(mockQuestions.length - mockAnsweredCount, 0);
  const firstUnansweredIndex = useMemo(
    () => currentQuestions.findIndex((item) => !mockAnswers[item.id]),
    [currentQuestions, mockAnswers],
  );
  const mockSegments = useMemo(
    () => buildMockSegments(mockQuestions.length, MASTER_PLUMBER_EXAM.subjects),
    [mockQuestions.length],
  );
  const mockSegmentPerformance = useMemo(
    () =>
      mockSegments.map((segment) => {
        const segmentQuestions = mockQuestions.slice(segment.startIndex, segment.endIndex + 1);
        const answeredCount = segmentQuestions.filter((item) => mockAnswers[item.id]).length;
        const correctCount = segmentQuestions.filter(
          (item) => mockAnswers[item.id] === item.answer_key,
        ).length;

        return {
          ...segment,
          answeredCount,
          correctCount,
          remainingCount: Math.max(segment.itemCount - answeredCount, 0),
          accuracy: answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0,
        };
      }),
    [mockAnswers, mockQuestions, mockSegments],
  );
  const currentMockSegment = useMemo(() => {
    if (!isMockExam || mockSegments.length === 0) {
      return null;
    }

    return (
      mockSegments.find(
        (segment) => activeIndex >= segment.startIndex && activeIndex <= segment.endIndex,
      ) ?? mockSegments[mockSegments.length - 1]
    );
  }, [activeIndex, isMockExam, mockSegments]);
  const mockElapsedLabel = useMemo(() => {
    if (!mockStartedAt) {
      return "00:00";
    }
    const endedAt = mockCompletedAt ?? clockTick;
    return formatDurationLabel(endedAt - mockStartedAt);
  }, [clockTick, mockCompletedAt, mockStartedAt]);
  const mockScore = mockQuestions.length
    ? Math.round((mockCorrectCount / mockQuestions.length) * 100)
    : 0;
  const isMockComplete = isMockExam && mockCompletedAt !== null;
  const sessionHeadline = useMemo(() => {
    if (isMockExam && currentMockSegment) {
      return currentMockSegment.name;
    }
    if (isMistakeReview) {
      return "Error Replay Loop";
    }
    return question.topic || "Mixed Review";
  }, [currentMockSegment, isMistakeReview, isMockExam, question.topic]);
  const sessionMeta = useMemo(() => {
    if (isMockExam && currentMockSegment) {
      return `${currentMockSegment.examDay} • ${currentMockSegment.timeWindow} • ${mockAnsweredCount}/${mockQuestions.length} answered`;
    }
    if (isMistakeReview) {
      return `${mistakeQuestions.length} weak questions in replay • ${stats.dueCount} due now`;
    }
    return `${stats.dueCount} due now • ${bookmarkedQuestions.length} bookmarked • ${stats.accuracy}% accuracy`;
  }, [
    bookmarkedQuestions.length,
    currentMockSegment,
    isMistakeReview,
    isMockExam,
    mistakeQuestions.length,
    mockAnsweredCount,
    mockQuestions.length,
    stats.accuracy,
    stats.dueCount,
  ]);
  const reviewHeaderTitle = isMockExam
    ? "Mock Exam Run"
    : isMistakeReview
    ? "Error Replay"
    : "Voice Sprint";
  const reviewHeaderSummary = isMockExam
    ? "Timed pressure mode with locked answers and post-run correction."
    : isMistakeReview
    ? "Loop your missed items until the right answer becomes automatic."
    : "Listen, answer, confirm, and keep moving through the live bank.";

  useEffect(() => {
    clearTranscript();
    answerCommitLockRef.current = null;
  }, [activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
  }, [isMistakeReview, isMockExam, selectedTopicName]);

  const jumpToTopic = (topicName: string | null) => {
    if (isMockExam || isMistakeReview) {
      return;
    }

    stopAudio();
    resetReviewCard();
    setSelectedTopicName((previousTopic) => {
      if (topicName === null) {
        return null;
      }
      return previousTopic === topicName ? null : topicName;
    });
    setActiveIndex(0);
  };

  useEffect(() => {
    if (!isMockExam || screen !== "Review") {
      return;
    }

    const intervalId = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [isMockExam, screen]);

  useEffect(() => {
    if (!isMockExam || mockQuestions.length === 0 || mockCompletedAt) {
      return;
    }

    if (mockAnsweredCount >= mockQuestions.length) {
      stopAudio();
      setMockCompletedAt(Date.now());
    }
  }, [isMockExam, mockAnsweredCount, mockCompletedAt, mockQuestions.length, stopAudio]);

  useEffect(() => {
    if (!isMockExam || !mockStartedAt || mockCompletedAt) {
      return;
    }

    const remainingMs = 60 * 60 * 1000 - (clockTick - mockStartedAt);
    if (remainingMs <= 0) {
      stopAudio();
      setMockCompletedAt(Date.now());
    }
  }, [clockTick, isMockExam, mockCompletedAt, mockStartedAt, stopAudio]);

  useEffect(() => {
    setActiveIndex((prev) => {
      if (currentQuestions.length === 0) {
        return 0;
      }
      return Math.min(prev, currentQuestions.length - 1);
    });
  }, [currentQuestions.length]);

  const goNext = () => {
    if (Date.now() - answerTapTimestampRef.current < 360) {
      return;
    }
    stopAudio();
    resetReviewCard();
    if (isMockExam) {
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(currentQuestions.length - 1, 0)));
      return;
    }
    setActiveIndex((prev) => (prev + 1) % Math.max(currentQuestions.length, 1));
  };

  const goPrevious = () => {
    if (Date.now() - answerTapTimestampRef.current < 360) {
      return;
    }
    stopAudio();
    resetReviewCard();
    if (isMockExam) {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    setActiveIndex(
      (prev) => (prev - 1 + Math.max(currentQuestions.length, 1)) % Math.max(currentQuestions.length, 1)
    );
  };

  const registerAnswerIntent = () => {
    answerTapTimestampRef.current = Date.now();
  };

  const handleAnswer = (choiceLabel: string) => {
    const now = Date.now();
    const existingLock = answerCommitLockRef.current;
    if (existingLock && existingLock.questionId === question.id && now < existingLock.until) {
      return;
    }

    if (question.id === fallbackQuestion.id) {
      return;
    }

    answerCommitLockRef.current = { questionId: question.id, until: now + 700 };
    answerTapTimestampRef.current = now;

    if (isMockExam) {
      if (mockAnswers[question.id] || mockCompletedAt) {
        return;
      }

      setMockAnswers((prev) => ({ ...prev, [question.id]: choiceLabel }));
      recordAnswer(question, choiceLabel === question.answer_key, "mock");
      setShowExplanation(false);
      clearTranscript();
      stopAudio();
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(currentQuestions.length - 1, 0)));
      return;
    }

    if (selectedAnswer) {
      return;
    }
    setSelectedAnswer(choiceLabel);
    setShowExplanation(true);
    clearTranscript();
    recordAnswer(
      question,
      choiceLabel === question.answer_key,
      isMockExam ? "mock" : isMistakeReview ? "mistake" : "study",
    );
    if (mode !== "Screen" && question.id !== fallbackQuestion.id) {
      speakFeedback(question, choiceLabel);
    }
  };

  const handleTranscript = (nextTranscript: string) => {
    const answer = parseVoiceAnswer(nextTranscript, question);
    if (answer) {
      handleAnswer(answer);
    }
  };

  const jumpToFirstUnanswered = () => {
    if (!isMockExam || firstUnansweredIndex < 0) {
      return;
    }
    if (Date.now() - answerTapTimestampRef.current < 360) {
      return;
    }
    stopAudio();
    resetReviewCard();
    setActiveIndex(firstUnansweredIndex);
  };

  useEffect(() => {
    if (
      screen !== "Review" ||
      mode === "Screen" ||
      question.id === fallbackQuestion.id ||
      (isMockExam && mockCompletedAt !== null)
    ) {
      if (isListening || isSpeaking) {
        void stopAudio();
      }
      return;
    }

    if (nativeSafeUi) {
      return;
    }

    readQuestion(question, mode === "Voice" ? () => startListening(handleTranscript) : null);

    return () => {
      void stopAudio();
    };
  }, [
    activeIndex,
    isMistakeReview,
    isMockExam,
    mockCompletedAt,
    mode,
    nativeSafeUi,
    isListening,
    question.id,
    screen,
    isSpeaking,
    startListening,
    stopAudio,
  ]);

  if (screen === "Landing") {
    return (
      <div className="landing-shell">
        <div className="landing-bg" aria-hidden="true">
          <div className="pipe-field">
            <span className="pipe pipe-1" />
            <span className="pipe pipe-2" />
            <span className="pipe pipe-3" />
            <span className="pipe pipe-4" />
            <span className="pipe pipe-5" />
          </div>
          <span className="bubble bubble-1" />
          <span className="bubble bubble-2" />
          <span className="bubble bubble-3" />
          <span className="flow-lines" />
          <img className="landing-diagram landing-diagram--one" src="/visual-review/visual-code-public-sewer-layout.png" alt="" />
          <img className="landing-diagram landing-diagram--two" src="/visual-review/visual-week4-water-meter-details.png" alt="" />
          <img className="landing-diagram landing-diagram--three" src="/visual-review/visual-code-vent-stack-diagram.png" alt="" />
        </div>
        <header className="landing-header">
          <div className="brand-lockup">
            <span className="brand-dot" />
            <p className="landing-eyebrow">{APP_BRAND.name}</p>
          </div>
          <div className="landing-nav">
            <ThemeToggle theme={theme} onChange={setTheme} />
            <button type="button" onClick={() => setScreen("Dashboard")}>
              Enter Dashboard
            </button>
            <button type="button" onClick={openSettings}>
              Settings
            </button>
            <button type="button" onClick={startStandardReview}>
              Jump to Audio Review
            </button>
          </div>
        </header>
        <main className="landing-hero">
          <div className="landing-copy">
            <div className="landing-tag">
              {APP_BRAND.examFocus} • {APP_BRAND.jurisdiction}
            </div>
            <h1>Fast voice review built for real-world, hands-busy study.</h1>
            <p>
              {APP_BRAND.name} is a voice-first {APP_BRAND.examFocus.toLowerCase()} for the {APP_BRAND.jurisdiction},
              built to read questions aloud, capture spoken A-E answers, and keep
              weak topics moving through a faster memory loop.
            </p>
            <div className="landing-kicker">
              <span>{daysToExam} days to {MASTER_PLUMBER_EXAM.examWindowLabel}</span>
              <span>{isRecognitionSupported ? "Voice answering live" : "Screen fallback ready"}</span>
              <span>Application deadline {applicationDeadlineLabel}</span>
            </div>
            <div className="landing-actions">
              <button type="button" onClick={startStandardReview}>
                Start voice review
              </button>
              <button type="button" className="ghost" onClick={() => openUpgrade("premium")}>
                Compare plans
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setScreen("Dashboard")}
              >
                Open dashboard
              </button>
              <button type="button" className="ghost" onClick={() => setScreen("ActiveStudy")}>
                Start rapid recall
              </button>
              <button type="button" className="ghost" onClick={startVisualReview}>
                Open figure drill
              </button>
              <button type="button" className="ghost" onClick={openSettings}>
                Open settings
              </button>
            </div>
            <div className="landing-company">
              <strong>Created by {APP_BRAND.creatorCompany}</strong>
              <a href={APP_BRAND.website} target="_blank" rel="noreferrer">
                {APP_BRAND.websiteLabel}
              </a>
              <span>
                {APP_BRAND.examFocus} • {APP_BRAND.jurisdiction}
              </span>
            </div>
            <div className="landing-trust">
              <div>
                <strong>{questions.length}</strong>
                <span>study MCQs ready</span>
              </div>
              <div>
                <strong>{mockQuestions.length}</strong>
                <span>mock exam questions</span>
              </div>
              <div>
                <strong>{flashcards.length}</strong>
                <span>flashcards</span>
              </div>
              <div>
                <strong>{identifications.length}</strong>
                <span>identification items</span>
              </div>
              <div>
                <strong>{visualReviewItems.length}</strong>
                <span>visual figure cards</span>
              </div>
              <div>
                <strong>{stats.dueCount}</strong>
                <span>due right now</span>
              </div>
            </div>
          </div>
          <div className="landing-illustration">
            <div className="illustration-card">
              <div className="gauge">
                <span>Audio loop</span>
                <strong>{isRecognitionSupported ? "Live" : "Tap"}</strong>
              </div>
              <h2>Review during commutes, chores, and downtime.</h2>
              <p>
                The primary loop is listen, answer by voice, hear feedback, and
                move to the next weak point without breaking focus.
              </p>
              <div className="pipe-strip">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="phone-preview">
              <div className="phone-preview__frame">
                <div className="phone-preview__notch" />
                <div className="phone-preview__screen">
                  <div className="phone-preview__status">
                    <span>{APP_BRAND.name}</span>
                    <strong>{daysToExam}d</strong>
                  </div>
                  <div className="phone-preview__mission">
                    <p>Today&apos;s mission</p>
                    <h3>Clear the due queue first.</h3>
                    <div className="phone-preview__mission-pills">
                      <span>{stats.dueCount} due</span>
                      <span>{stats.accuracy}% accuracy</span>
                    </div>
                    <button type="button">Start Audio Sprint</button>
                  </div>
                  <div className="phone-preview__chips">
                    <span>{stats.streakDays} day streak</span>
                    <span>{visualReviewItems.length} figure cards</span>
                    <span>{flashcards.length + identifications.length} recall prompts</span>
                  </div>
                  <div className="phone-preview__stack">
                    <div className="phone-preview__tile phone-preview__tile--voice">
                      <p>Next focus</p>
                      <h3>Error Replay</h3>
                      <span>{mistakeQuestions.length} weak questions ready for correction</span>
                    </div>
                    <div className="phone-preview__tile phone-preview__tile--map">
                      <p>Official blueprint</p>
                      <h3>40-10-40</h3>
                      <span>SPDI, Code, and Practical weight the most on exam day.</span>
                    </div>
                  </div>
                  <div className="phone-preview__mini-grid">
                    <div>
                      <small>Study</small>
                      <strong>{questions.length}</strong>
                    </div>
                    <div>
                      <small>Mock</small>
                      <strong>{mockQuestions.length}</strong>
                    </div>
                    <div>
                      <small>Recall</small>
                      <strong>{flashcards.length + identifications.length}</strong>
                    </div>
                    <div>
                      <small>Visual</small>
                      <strong>{visualReviewItems.length}</strong>
                    </div>
                  </div>
                  <div className="phone-preview__nav">
                    <span className="is-active">Home</span>
                    <span>Replay</span>
                    <span>Mock</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="illustration-panel">
              <p>Android-ready cues</p>
              <h3>Voice answering + readable fallback</h3>
              <ul>
                <li>Read-aloud question flow</li>
                <li>Voice answer capture A-E</li>
                <li>On-screen backup when noisy</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (screen === "Dashboard") {
    if (nativeSafeUi) {
      return (
        <NativeSafeDashboard
          theme={theme}
          onThemeChange={setTheme}
          onOpenSettings={openSettings}
          onStartSession={startStandardReview}
          onStartRecallLab={() => {
            stopAudioForNavigation();
            setIsMistakeReview(false);
            setIsMockExam(false);
            setMockStartedAt(null);
            setMockCompletedAt(null);
            setMockAnswers({});
            setScreen("ActiveStudy");
          }}
          onStartMockExam={startMockExamSession}
          onStartVisualReview={startVisualReview}
          onViewReport={() => setScreen("MasteryReport")}
          onViewMistakes={() => setScreen("MistakeLibrary")}
          onOpenUpgrade={() => openUpgrade("premium")}
          subscriptionTier={subscriptionTier}
          questionCount={questions.length}
          mockQuestionCount={mockQuestions.length}
          flashcardCount={flashcards.length}
          identificationCount={identifications.length}
          visualReviewCount={visualReviewItems.length}
          dueCount={stats.dueCount}
          accuracy={stats.accuracy}
          daysToExam={daysToExam}
        />
      );
    }

    return (
      <Dashboard
        theme={theme}
        onThemeChange={setTheme}
        onOpenSettings={openSettings}
        onStartSession={startStandardReview}
        onFocusTopic={() => startTopicFocusSession(stats.topicPerformance[0]?.topic ?? null)}
        onStartMockExam={startMockExamSession}
        onStartRecallLab={() => {
          stopAudio();
          setIsMistakeReview(false);
          setIsMockExam(false);
          setMockStartedAt(null);
          setMockCompletedAt(null);
          setMockAnswers({});
          setScreen("ActiveStudy");
        }}
        onStartVisualReview={startVisualReview}
        onViewReport={() => setScreen("MasteryReport")}
        onViewMistakes={() => setScreen("MistakeLibrary")}
        onOpenUpgrade={() => openUpgrade("premium")}
        subscriptionTier={subscriptionTier}
        examWindowLabel={MASTER_PLUMBER_EXAM.examWindowLabel}
        questionCount={questions.length}
        mockQuestionCount={mockQuestions.length}
        flashcardCount={flashcards.length}
        identificationCount={identifications.length}
        visualReviewCount={visualReviewItems.length}
        dueCount={stats.dueCount}
        readiness={stats.readiness}
        accuracy={stats.accuracy}
        streakDays={stats.streakDays}
        reviewedToday={stats.reviewedToday}
        daysToExam={daysToExam}
        focusTopic={stats.topicPerformance[0]?.topic ?? "Mixed Review"}
        focusSubtopic={stats.topicPerformance[0]?.nextFocus ?? "General drilling"}
        unresolvedMistakeCount={mistakeEntries.length}
      />
    );
  }

  if (screen === "Upgrade") {
    return (
      <UpgradeScreen
        theme={theme}
        onThemeChange={setTheme}
        onBack={() => setScreen("Dashboard")}
        onStartCheckout={startStripeCheckout}
        onRefreshEntitlement={() => {
          void refreshEntitlement();
        }}
        onPrototypeUnlock={() => {
          setSubscriptionTier("premium");
          setBillingMessage("Prototype premium unlock is active on this device.");
          setScreen("Dashboard");
        }}
        currentTier={subscriptionTier}
        gate={upgradeGate}
        billingConfig={billingConfig}
        checkoutMessage={billingMessage}
        checkoutError={billingError}
        isStartingCheckout={isStartingCheckout}
      />
    );
  }

  if (screen === "ActiveStudy") {
    return (
      <ActiveStudy
        theme={theme}
        onThemeChange={setTheme}
        onBack={() => setScreen("Dashboard")}
        flashcards={flashcards}
        identifications={identifications}
      />
    );
  }

  if (screen === "VisualReview") {
    return (
      <VisualReview
        theme={theme}
        onThemeChange={setTheme}
        onBack={() => setScreen("Dashboard")}
        items={visualReviewItems}
      />
    );
  }

  if (screen === "MasteryReport") {
    return (
      <MasteryReport
        theme={theme}
        onThemeChange={setTheme}
        onBack={() => setScreen("Dashboard")}
        onStartVoiceReview={startStandardReview}
        onFocusWeakestTopic={() => startTopicFocusSession(stats.topicPerformance[0]?.topic ?? null)}
        onOpenMistakes={() => setScreen("MistakeLibrary")}
        daysToExam={daysToExam}
        stats={stats}
        examWindowLabel={MASTER_PLUMBER_EXAM.examWindowLabel}
        applicationDeadline={applicationDeadlineLabel}
        subjects={MASTER_PLUMBER_EXAM.subjects}
      />
    );
  }

  if (screen === "MistakeLibrary") {
    return (
      <MistakeLibraryScreen
        theme={theme}
        onThemeChange={setTheme}
        onBack={() => setScreen("Dashboard")}
        onStudy={() => startMistakeReplay()}
        onReviewItem={(questionId) => startMistakeReplay(questionId)}
        mistakes={mistakeEntries}
      />
    );
  }

  if (screen === "Settings") {
    return (
      <SettingsScreen
        theme={theme}
        onThemeChange={setTheme}
        onBack={() => setScreen("Dashboard")}
        speechRateOptions={speechRateOptions}
        speechRatePreset={speechRatePreset}
        onSpeechRateChange={setSpeechRatePreset}
        availableVoices={availableVoices}
        selectedVoiceId={selectedVoiceId}
        onSelectedVoiceChange={setSelectedVoiceId}
        isSpeechSupported={isSpeechSupported}
        isRecognitionSupported={isRecognitionSupported}
        voiceStatus={voiceStatus}
        transcript={voiceTranscript}
        onReadSample={() => readQuestion(question)}
        onTestMicrophone={() => startListening(() => undefined, { preferDialog: true })}
        onStopAudio={stopAudio}
      />
    );
  }

  return (
    <div className="app-shell">
      <nav className="screen-toggle">
        <button
          type="button"
          className=""
          onClick={() => {
            setIsMistakeReview(false);
            setIsMockExam(false);
            setMockStartedAt(null);
            setMockCompletedAt(null);
            setMockAnswers({});
            setScreen("Dashboard");
          }}
        >
          Dashboard
        </button>
        <button
          type="button"
          className="active"
          onClick={() => {
            setIsMistakeReview(false);
            setIsMockExam(false);
            setMockStartedAt(null);
            setMockCompletedAt(null);
            setMockAnswers({});
            setScreen("Review");
          }}
        >
          Review
        </button>
      </nav>

      <header className="app-header app-header--review">
        <div className="app-header__copy">
          <p className="eyebrow">
            {APP_BRAND.name}
            {isMockExam ? " • Mock Exam" : isMistakeReview ? " • Mistake Review" : ""}
          </p>
          <h1>{reviewHeaderTitle}</h1>
          <p className="subtitle">{reviewHeaderSummary}</p>
          <div className="app-header__pills">
            <span>{progressLabel}</span>
            <span>{mode} mode</span>
            <span>{daysToExam}d to exam</span>
            <span>
              {isMockExam ? `${mockRemainingCount} remaining` : `${stats.dueCount} due now`}
            </span>
          </div>
        </div>
        <div className="app-header__controls">
          <button type="button" className="header-settings-button" onClick={openSettings}>
            Settings
          </button>
          <ThemeToggle theme={theme} onChange={setTheme} />
          <ModeToggle mode={mode} modes={modes} onChange={setMode} />
        </div>
      </header>

      <main className="app-content">
        <aside className="sidebar">
          <TopicList
            topics={topics}
            activeTopic={selectedTopicName}
            onSelectTopic={jumpToTopic}
          />
          <div className="quick-actions">
            <h3>Quick actions</h3>
            <button type="button" onClick={() => toggleBookmark(question.id)}>
              {isBookmarked(question.id) ? "Remove bookmark" : "Bookmark"}
            </button>
            <button type="button" onClick={() => readQuestion(question)}>
              Repeat audio
            </button>
            <button
              type="button"
              disabled={isMockExam}
              onClick={() => {
                if (isMockExam) {
                  return;
                }
                setShowExplanation(true);
                if (mode !== "Screen") {
                  readExplanation(question);
                }
              }}
            >
              {isMockExam ? "Explanation hidden in mock" : "Read explanation"}
            </button>
          </div>
          <MistakeLibrary items={mistakeQuestions} />
        </aside>

        <section className="question-area">
          <div className="progress-row">
            <span className="pill">{isMockExam ? "Mock Exam" : question.difficulty || "Session"}</span>
            <span className="progress">{progressLabel}</span>
            <span className="pill">
              {isMockExam ? mockTimeRemainingLabel : question.quality_flag ?? "study"}
            </span>
          </div>

          <section className="exam-brief">
            <div className="exam-brief__header">
              <div>
                <p className="exam-brief__eyebrow">
                  {isMockExam ? MASTER_PLUMBER_EXAM.title : "Review Focus"}
                </p>
                <h2>{sessionHeadline}</h2>
              </div>
              <div className="exam-brief__countdown">
                <span>{MASTER_PLUMBER_EXAM.examWindowLabel}</span>
                <strong>{daysToExam}d</strong>
              </div>
            </div>
            <p className="exam-brief__meta">{sessionMeta}</p>
            <div className="exam-brief__chips">
              <span>Deadline {applicationDeadlineLabel}</span>
              {isMockExam ? (
                <>
                  <span>{mockAnsweredCount} answered</span>
                  <span>{mockRemainingCount} remaining</span>
                  <span>{mockTimeRemainingLabel} left</span>
                </>
              ) : (
                <>
                  <span>{MASTER_PLUMBER_EXAM.applicationFeeLabel}</span>
                  <span>{stats.reviewedToday} answered today</span>
                </>
              )}
            </div>
            {isMockExam ? (
              <div className="exam-brief__subject-grid">
                {mockSegmentPerformance.map((segment) => (
                  <article
                    key={segment.name}
                    className={`exam-brief__subject ${
                      currentMockSegment?.name === segment.name && !isMockComplete ? "is-active" : ""
                    }`}
                  >
                    <div>
                      <p>{segment.examDay}</p>
                      <h3>{segment.name}</h3>
                    </div>
                    <strong>{segment.weight}%</strong>
                    <span>
                      {segment.answeredCount}/{segment.itemCount} answered
                      {isMockComplete ? ` • ${segment.accuracy}%` : ""}
                    </span>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          {isMockComplete ? (
            <section className="mock-summary">
              <div className="mock-summary__hero">
                <p>Mock exam completed</p>
                <h2>{mockScore}% score</h2>
                <span>
                  {mockCorrectCount} correct of {mockQuestions.length} questions in {mockElapsedLabel}
                </span>
              </div>

              <div className="mock-summary__stats">
                <article>
                  <span>Answered</span>
                  <strong>{mockAnsweredCount}</strong>
                </article>
                <article>
                  <span>Correct</span>
                  <strong>{mockCorrectCount}</strong>
                </article>
                <article>
                  <span>Remaining</span>
                  <strong>{mockRemainingCount}</strong>
                </article>
                <article>
                  <span>Error Replay</span>
                  <strong>{mistakeEntries.length}</strong>
                </article>
              </div>

              <div className="mock-summary__subject-grid">
                {mockSegmentPerformance.map((segment) => (
                  <article key={segment.name} className="mock-summary__subject">
                    <p>
                      {segment.examDay} • {segment.timeWindow}
                    </p>
                    <h3>{segment.name}</h3>
                    <strong>{segment.accuracy}%</strong>
                    <span>
                      {segment.correctCount}/{segment.itemCount} correct
                    </span>
                  </article>
                ))}
              </div>

              <div className="mock-summary__actions">
                <button type="button" onClick={startMockExamSession}>
                  Retake Mock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopAudio();
                    setIsMockExam(false);
                    setIsMistakeReview(false);
                    setMockStartedAt(null);
                    setMockCompletedAt(null);
                    setMockAnswers({});
                    setScreen("MistakeLibrary");
                  }}
                >
                  Open Error Replay
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    stopAudio();
                    setIsMockExam(false);
                    setIsMistakeReview(false);
                    setMockStartedAt(null);
                    setMockCompletedAt(null);
                    setMockAnswers({});
                    setScreen("Dashboard");
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
            </section>
          ) : (
            <>
              <QuestionCard
                question={question}
                mode={mode}
                showExplanation={isMockExam ? false : showExplanation}
                allowExplanation={!isMockExam}
                revealAnswer={!isMockExam}
                onToggleExplanation={() => {
                  const nextValue = !showExplanation;
                  setShowExplanation(nextValue);
                  if (nextValue && mode !== "Screen") {
                    readExplanation(question);
                  }
                }}
                onAnswer={handleAnswer}
                onChoiceIntent={registerAnswerIntent}
                selectedAnswer={effectiveSelectedAnswer}
                onSwipeNext={goNext}
                onSwipePrevious={goPrevious}
                onSwipeUp={() => {
                  if (isMockExam) {
                    jumpToFirstUnanswered();
                    return;
                  }
                  setShowExplanation(true);
                  if (mode !== "Screen") {
                    readExplanation(question);
                  }
                }}
                onSwipeDown={() => toggleBookmark(question.id)}
              />

              <div className="voice-panel">
                <div className="voice-panel__header">
                  <div>
                    <strong>Audio Reviewer</strong>
                    <p>
                      {isMockExam
                        ? "Mock mode locks answers and saves corrections for the post-run replay."
                        : "Primary mobile loop: listen, answer, confirm, advance."}
                    </p>
                  </div>
                  <span className="voice-badge">
                    {isListening ? "Listening" : isSpeaking ? "Speaking" : "Ready"}
                  </span>
                </div>

                <div className="voice-capabilities">
                  <span className={isSpeechSupported ? "is-ready" : "is-offline"}>
                    TTS {isSpeechSupported ? "On" : "Off"}
                  </span>
                  <span className={isRecognitionSupported ? "is-ready" : "is-offline"}>
                    Voice Answers {isRecognitionSupported ? "On" : "Off"}
                  </span>
                  {question.quality_flag ? (
                    <span className="quality-chip">{question.quality_flag}</span>
                  ) : null}
                </div>

                <div className="voice-speed">
                  <p>Dictation speed</p>
                  <div className="voice-speed__options">
                    {speechRateOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={speechRatePreset === option.id ? "is-active" : ""}
                        onClick={() => setSpeechRatePreset(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="voice-voice">
                  <label htmlFor="voice-option">Narrator voice</label>
                  <select
                    id="voice-option"
                    value={selectedVoiceId}
                    onChange={(event) => setSelectedVoiceId(event.target.value)}
                    disabled={!isSpeechSupported || availableVoices.length <= 1}
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="voice-row">
                  <button type="button" onClick={() => readQuestion(question)}>
                    Read Question
                  </button>
                  <button
                    type="button"
                    disabled={!isRecognitionSupported}
                    onClick={() => startListening(handleTranscript, { preferDialog: true })}
                  >
                    {isListening ? "Listening..." : "Answer by Voice"}
                  </button>
                  <button type="button" className="ghost-button" onClick={stopAudio}>
                    Stop
                  </button>
                </div>

                <p className="voice-hint">
                  Say the letter A-E or speak the option text itself.{" "}
                  Captured: {effectiveSelectedAnswer ?? "—"} ·{" "}
                  {isMockExam
                    ? effectiveSelectedAnswer
                      ? "Answer locked for final scoring."
                      : "Mock answers stay hidden until the run ends."
                    : `Correct answer: ${effectiveSelectedAnswer ? question.answer_key : "hidden until you answer"}`}
                </p>
                <p className="voice-transcript">
                  Transcript: {voiceTranscript || "Awaiting voice input."}
                </p>
                <p className="voice-status">{voiceStatus}</p>
                {question.source_ref ? (
                  <p className="voice-source">Source: {question.source_ref}</p>
                ) : null}
              </div>

              <div className="nav-row">
                <button
                  type="button"
                  disabled={isMockExam && activeIndex === 0}
                  onClick={goPrevious}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={isMockExam && firstUnansweredIndex < 0}
                  onClick={() => {
                    if (isMockExam) {
                      jumpToFirstUnanswered();
                      return;
                    }
                    setShowExplanation(true);
                    if (mode !== "Screen") {
                      readExplanation(question);
                    }
                  }}
                >
                  {isMockExam ? "Next Unanswered" : "Explain"}
                </button>
                <button
                  type="button"
                  disabled={isMockExam && activeIndex >= currentQuestions.length - 1}
                  onClick={goNext}
                >
                  Next
                </button>
              </div>

              <div className="swipe-hints">
                <span>Swipe ←/→: Previous/Next</span>
                <span>{isMockExam ? "Swipe ↑: Next unanswered" : "Swipe ↑: Explain"}</span>
                <span>Swipe ↓: Bookmark</span>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
