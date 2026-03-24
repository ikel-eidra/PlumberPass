import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import { QueueStrategy, TextToSpeech } from "@capacitor-community/text-to-speech";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "../App";

export type SpeechRatePreset = "extraSlow" | "slow" | "normal" | "fast";

export type VoiceOption = {
  id: string;
  label: string;
  lang: string;
  source: "auto" | "native" | "web";
  gender: "female" | "male";
  nativeIndex?: number;
  webVoiceURI?: string;
  default?: boolean;
};

const SPEECH_RATE_STORAGE_KEY = "pp_speech_rate_preset_v2";
const VOICE_STORAGE_KEY = "pp_voice_option_id_v1";
const DEFAULT_VOICE_ID = "auto";
const NATIVE_LANGUAGE = "en-PH";
const FALLBACK_LANGUAGE = "en-US";

type BrowserSpeechRecognitionAlternative = {
  transcript?: string;
};

type BrowserSpeechRecognitionResult = ArrayLike<BrowserSpeechRecognitionAlternative> & {
  isFinal?: boolean;
};

type BrowserSpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<BrowserSpeechRecognitionResult>;
};

type BrowserSpeechRecognitionErrorEvent = {
  error: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  maxAlternatives: number;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

const SPEECH_RATE_MAP: Record<SpeechRatePreset, number> = {
  extraSlow: 0.58,
  slow: 0.76,
  normal: 0.94,
  fast: 1.08,
};

const AUTO_VOICE_OPTION: VoiceOption = {
  id: DEFAULT_VOICE_ID,
  label: "Automatic • Device default",
  lang: "system",
  source: "auto",
  gender: "female",
  default: true,
};

const preferredLanguageOrder = ["en-PH", "en-US", "en-GB", "en-AU", "fil-PH", "tl-PH"];

const normalizeTranscript = (value: string) => value.trim().toLowerCase();

const calmVoiceKeywords = [
  "aria",
  "ava",
  "calm",
  "enhanced",
  "female",
  "grace",
  "jenny",
  "journey",
  "natural",
  "neural",
  "premium",
  "salli",
  "sara",
  "serena",
  "studio",
  "warm",
  "wavenet",
];

const harshVoiceKeywords = ["legacy", "male", "robot", "test"];

const languagePriority = (language: string) => {
  const normalized = language.toLowerCase();
  const exactMatch = preferredLanguageOrder.findIndex((entry) => entry.toLowerCase() === normalized);
  if (exactMatch >= 0) {
    return exactMatch;
  }
  if (normalized.startsWith("en")) {
    return preferredLanguageOrder.length + 1;
  }
  if (normalized.startsWith("fil") || normalized.startsWith("tl")) {
    return preferredLanguageOrder.length + 2;
  }
  return preferredLanguageOrder.length + 10;
};

const shouldIncludeVoice = (language: string) => {
  const normalized = language.toLowerCase();
  return normalized.startsWith("en") || normalized.startsWith("fil") || normalized.startsWith("tl");
};

const voicePreferenceScore = (name: string) => {
  const normalized = name.toLowerCase();
  let score = 0;

  if (normalized.includes("female")) {
    score += 2;
  }

  if (normalized.includes("natural") || normalized.includes("neural")) {
    score += 2;
  }

  if (normalized.includes("enhanced") || normalized.includes("premium") || normalized.includes("studio")) {
    score += 2;
  }

  for (const keyword of calmVoiceKeywords) {
    if (normalized.includes(keyword)) {
      score += 1;
    }
  }

  for (const keyword of harshVoiceKeywords) {
    if (normalized.includes(keyword)) {
      score -= 1;
    }
  }

  return score;
};

const detectVoiceGender = (name: string, fallbackIndex = 0): VoiceOption["gender"] => {
  const normalized = name.toLowerCase();
  if (
    normalized.includes("female") ||
    normalized.includes("woman") ||
    normalized.includes("girl") ||
    normalized.includes("jenny") ||
    normalized.includes("aria") ||
    normalized.includes("ava") ||
    normalized.includes("grace") ||
    normalized.includes("sara") ||
    normalized.includes("serena")
  ) {
    return "female";
  }

  if (
    normalized.includes("male") ||
    normalized.includes("man") ||
    normalized.includes("boy") ||
    normalized.includes("guy")
  ) {
    return "male";
  }

  return fallbackIndex % 2 === 0 ? "female" : "male";
};

const buildVoiceLabel = (
  gender: VoiceOption["gender"],
  slot: number,
) =>
  `Calm ${gender === "female" ? "Female" : "Male"} ${slot}`;

const expandSpeechAcronyms = (value: string) =>
  value
    .replace(/\bR\.?\s*A\.?\s*(\d+)\b/gi, "R. A. $1")
    .replace(/\bP\.?\s*D\.?\s*(\d+)\b/gi, "P. D. $1")
    .replace(/\bB\.?\s*P\.?\s*(\d+)\b/gi, "B. P. $1")
    .replace(/\bA\.?\s*N\.?\s*S\.?\s*I\b/gi, "A. N. S. I.")
    .replace(/\bA\.?\s*S\.?\s*T\.?\s*M\b/gi, "A. S. T. M.")
    .replace(/\bN\.?\s*F\.?\s*P\.?\s*A\b/gi, "N. F. P. A.")
    .replace(/\bD\.?\s*F\.?\s*U\b/gi, "D. F. U.")
    .replace(/\bU\.?\s*P\.?\s*C\b/gi, "U. P. C.")
    .replace(/\s+/g, " ")
    .trim();

const uniqueById = <T extends { id: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
};

const curateVoiceOptions = <
  TVoice extends {
    default: boolean;
    lang: string;
    name: string;
  },
>(
  voices: TVoice[],
  toOption: (voice: TVoice, gender: VoiceOption["gender"], slot: number) => VoiceOption,
) => {
  const femaleVoices: Array<{ voice: TVoice; score: number }> = [];
  const maleVoices: Array<{ voice: TVoice; score: number }> = [];

  voices.forEach((voice, index) => {
    const gender = detectVoiceGender(voice.name, index);
    const candidate = { voice, score: voicePreferenceScore(voice.name) };
    if (gender === "female") {
      femaleVoices.push(candidate);
    } else {
      maleVoices.push(candidate);
    }
  });

  const curated = [
    ...femaleVoices.slice(0, 2).map((item, index) => toOption(item.voice, "female", index + 1)),
    ...maleVoices.slice(0, 2).map((item, index) => toOption(item.voice, "male", index + 1)),
  ];

  if (curated.length >= 4) {
    return curated;
  }

  const usedNames = new Set(curated.map((voice) => voice.id));
  const fallbackPool = [...femaleVoices, ...maleVoices]
    .map((item) => item.voice)
    .filter((voice, index, list) => list.findIndex((candidate) => candidate.name === voice.name) === index);

  for (const voice of fallbackPool) {
    const gender = detectVoiceGender(voice.name);
    const existingCount = curated.filter((item) => item.gender === gender).length;
    const option = toOption(voice, gender, existingCount + 1);
    if (usedNames.has(option.id)) {
      continue;
    }
    curated.push(option);
    usedNames.add(option.id);
    if (curated.length >= 4) {
      break;
    }
  }

  return curated;
};

const buildNativeVoiceOptions = (
  voices: Array<{
    default: boolean;
    lang: string;
    localService: boolean;
    name: string;
    voiceURI: string;
  }>,
): VoiceOption[] => {
  const rankedVoices = voices
    .map((voice, index) => ({ ...voice, index }))
    .filter((voice) => voice.lang && shouldIncludeVoice(voice.lang))
    .sort((left, right) => {
      const preferenceDifference = voicePreferenceScore(right.name) - voicePreferenceScore(left.name);
      if (preferenceDifference !== 0) {
        return preferenceDifference;
      }
      const languageDifference = languagePriority(left.lang) - languagePriority(right.lang);
      if (languageDifference !== 0) {
        return languageDifference;
      }
      if (left.default !== right.default) {
        return left.default ? -1 : 1;
      }
      if (left.localService !== right.localService) {
        return left.localService ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });

  return uniqueById(
    curateVoiceOptions(rankedVoices, (voice, gender, slot) => ({
      id: `native:${voice.index}:${voice.voiceURI || voice.name}`,
      label: buildVoiceLabel(gender, slot),
      lang: voice.lang,
      source: "native",
      gender,
      nativeIndex: voice.index,
      default: voice.default,
    })),
  );
};

const buildWebVoiceOptions = (voices: SpeechSynthesisVoice[]): VoiceOption[] => {
  const rankedVoices = voices
    .filter((voice) => voice.lang && shouldIncludeVoice(voice.lang))
    .sort((left, right) => {
      const preferenceDifference = voicePreferenceScore(right.name) - voicePreferenceScore(left.name);
      if (preferenceDifference !== 0) {
        return preferenceDifference;
      }
      const languageDifference = languagePriority(left.lang) - languagePriority(right.lang);
      if (languageDifference !== 0) {
        return languageDifference;
      }
      if (left.default !== right.default) {
        return left.default ? -1 : 1;
      }
      if (left.localService !== right.localService) {
        return left.localService ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });

  return uniqueById(
    curateVoiceOptions(rankedVoices, (voice, gender, slot) => ({
      id: `web:${voice.voiceURI || voice.name}`,
      label: buildVoiceLabel(gender, slot),
      lang: voice.lang,
      source: "web",
      gender,
      webVoiceURI: voice.voiceURI,
      default: voice.default,
    })),
  );
};

const readStoredSpeechRatePreset = (): SpeechRatePreset => {
  if (typeof window === "undefined") {
    return "normal";
  }

  const raw = window.localStorage.getItem(SPEECH_RATE_STORAGE_KEY);
  return raw === "extraSlow" || raw === "slow" || raw === "normal" || raw === "fast"
    ? raw
    : "normal";
};

const readStoredVoiceId = (): string => {
  if (typeof window === "undefined") {
    return DEFAULT_VOICE_ID;
  }

  return window.localStorage.getItem(VOICE_STORAGE_KEY) || DEFAULT_VOICE_ID;
};

const hasStoredVoicePreference = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(VOICE_STORAGE_KEY) !== null;
};

const resolveSpeechSynthesis = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.speechSynthesis ?? null;
};

const resolveSpeechRecognitionCtor = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const browserWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionCtor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
  };

  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
};

const pickBestMatch = (matches?: string[]) => {
  if (!matches || matches.length === 0) {
    return "";
  }

  return [...matches]
    .map((match) => match.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)[0] ?? "";
};

const buildQuestionNarration = (question: Question) => {
  const choiceLines = question.choices
    .filter((choice) => choice.text.trim().length > 0)
    .map((choice) => `${choice.label}. ${choice.text}.`)
    .join(" ");

  return expandSpeechAcronyms(`Question. ${question.prompt} ${choiceLines}`.trim());
};

const buildExplanationNarration = (question: Question) =>
  expandSpeechAcronyms(
    question.explanation_long || question.explanation_short || "No explanation is available yet.",
  );

const buildFeedbackNarration = (question: Question, choiceLabel: string) => {
  const selectedChoice = question.choices.find((choice) => choice.label === choiceLabel);
  const correctChoice = question.choices.find((choice) => choice.label === question.answer_key);

  if (choiceLabel === question.answer_key) {
    return expandSpeechAcronyms(
      `Correct. ${question.explanation_short || "Good work."} ${question.explanation_long}`.trim(),
    );
  }

  return expandSpeechAcronyms(
    `Not quite. You answered ${choiceLabel}${selectedChoice?.text ? `, ${selectedChoice.text}` : ""}. The correct answer is ${question.answer_key}${correctChoice?.text ? `, ${correctChoice.text}` : ""}. ${question.explanation_short} ${question.explanation_long}`.trim(),
  );
};

const nativePlatform = Capacitor.isNativePlatform();

export function useAudioReview() {
  const [status, setStatus] = useState("Voice reviewer ready.");
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  const [speechRatePreset, setSpeechRatePresetState] =
    useState<SpeechRatePreset>(readStoredSpeechRatePreset);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([AUTO_VOICE_OPTION]);
  const [selectedVoiceId, setSelectedVoiceIdState] = useState(readStoredVoiceId);
  const [hadStoredVoicePreference] = useState(hasStoredVoicePreference);

  const answerHandlerRef = useRef<((value: string) => void) | null>(null);
  const browserRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const nativeListenerHandlesRef = useRef<PluginListenerHandle[]>([]);
  const manualStopRef = useRef(false);
  const lastDeliveredTranscriptRef = useRef("");
  const speakTicketRef = useRef(0);
  const afterSpeakTimeoutRef = useRef<number | null>(null);

  const selectedVoice = useMemo(
    () => availableVoices.find((voice) => voice.id === selectedVoiceId) ?? AUTO_VOICE_OPTION,
    [availableVoices, selectedVoiceId],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SPEECH_RATE_STORAGE_KEY, speechRatePreset);
  }, [speechRatePreset]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(VOICE_STORAGE_KEY, selectedVoiceId);
  }, [selectedVoiceId]);

  const clearAfterSpeakTimeout = () => {
    if (afterSpeakTimeoutRef.current !== null) {
      window.clearTimeout(afterSpeakTimeoutRef.current);
      afterSpeakTimeoutRef.current = null;
    }
  };

  const clearTranscript = () => {
    lastDeliveredTranscriptRef.current = "";
    setTranscript("");
  };

  const emitTranscript = (value: string, isFinal = false) => {
    const nextValue = value.trim();
    if (!nextValue) {
      return;
    }

    const normalized = normalizeTranscript(nextValue);
    if (!isFinal && normalized === lastDeliveredTranscriptRef.current) {
      return;
    }

    lastDeliveredTranscriptRef.current = normalized;
    setTranscript(nextValue);
    setStatus(isFinal ? `Captured: ${nextValue}` : `Hearing: ${nextValue}`);
    answerHandlerRef.current?.(nextValue);
  };

  const stopRecognitionOnly = async () => {
    manualStopRef.current = true;

    if (nativePlatform) {
      try {
        await SpeechRecognition.stop();
      } catch {
        // Ignored: native stop throws when not active.
      }
    } else {
      try {
        browserRecognitionRef.current?.stop();
      } catch {
        // Ignored: browser stop throws when recognition was idle.
      }
    }

    setIsListening(false);
  };

  const stopSpeechOnly = async () => {
    speakTicketRef.current += 1;
    clearAfterSpeakTimeout();

    if (nativePlatform) {
      try {
        await TextToSpeech.stop();
      } catch {
        // Ignored: native stop throws when nothing is queued.
      }
    } else {
      resolveSpeechSynthesis()?.cancel();
    }

    setIsSpeaking(false);
  };

  const stopAudio = async () => {
    await Promise.all([stopRecognitionOnly(), stopSpeechOnly()]);
    setStatus("Audio stopped.");
  };

  const queueAfterSpeak = (ticket: number, callback?: (() => void) | null) => {
    if (!callback) {
      return;
    }

    clearAfterSpeakTimeout();
    afterSpeakTimeoutRef.current = window.setTimeout(() => {
      afterSpeakTimeoutRef.current = null;
      if (ticket !== speakTicketRef.current) {
        return;
      }
      callback();
    }, 220);
  };

  const speak = async (text: string, onComplete?: (() => void) | null) => {
    const cleanText = expandSpeechAcronyms(text.trim());
    if (!cleanText) {
      return;
    }

    await stopRecognitionOnly();
    await stopSpeechOnly();

    const nextTicket = speakTicketRef.current + 1;
    speakTicketRef.current = nextTicket;
    setIsSpeaking(true);
    setStatus("Reading aloud...");

    if (nativePlatform) {
      try {
        await TextToSpeech.speak({
          text: cleanText,
          lang: selectedVoice.lang !== "system" ? selectedVoice.lang : NATIVE_LANGUAGE,
          rate: SPEECH_RATE_MAP[speechRatePreset],
          pitch: 0.98,
          volume: 1,
          voice: selectedVoice.source === "native" ? selectedVoice.nativeIndex : undefined,
          queueStrategy: QueueStrategy.Flush,
        });

        if (nextTicket !== speakTicketRef.current) {
          return;
        }

        setIsSpeaking(false);
        setStatus("Ready for the next answer.");
        queueAfterSpeak(nextTicket, onComplete);
        return;
      } catch (error) {
        setIsSpeaking(false);
        setStatus(
          error instanceof Error ? `Voice playback failed: ${error.message}` : "Voice playback failed.",
        );
        return;
      }
    }

    const speechSynthesis = resolveSpeechSynthesis();
    if (!speechSynthesis) {
      setIsSpeaking(false);
      setStatus("Speech playback is unavailable on this device.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = selectedVoice.lang !== "system" ? selectedVoice.lang : FALLBACK_LANGUAGE;
    utterance.rate = SPEECH_RATE_MAP[speechRatePreset];
    utterance.pitch = 0.98;
    utterance.volume = 1;

    const webVoice =
      selectedVoice.source === "web"
        ? speechSynthesis.getVoices().find((voice) => voice.voiceURI === selectedVoice.webVoiceURI)
        : null;
    if (webVoice) {
      utterance.voice = webVoice;
      utterance.lang = webVoice.lang;
    }

    await new Promise<void>((resolve) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });

    if (nextTicket !== speakTicketRef.current) {
      return;
    }

    setIsSpeaking(false);
    setStatus("Ready for the next answer.");
    queueAfterSpeak(nextTicket, onComplete);
  };

  const startListening = async (handler: (value: string) => void) => {
    answerHandlerRef.current = handler;
    lastDeliveredTranscriptRef.current = "";
    setTranscript("");
    await stopSpeechOnly();
    manualStopRef.current = false;

    if (nativePlatform) {
      try {
        const permission = await SpeechRecognition.requestPermissions();
        if (permission.speechRecognition !== "granted") {
          setIsRecognitionSupported(false);
          setStatus("Microphone permission is required for voice answers.");
          return;
        }

        const availability = await SpeechRecognition.available();
        if (!availability.available) {
          setIsRecognitionSupported(false);
          setStatus("Native speech recognition is unavailable on this device.");
          return;
        }

        setIsRecognitionSupported(true);
        setStatus("Listening for A to E or the option text.");

        const immediateResult = await SpeechRecognition.start({
          language: NATIVE_LANGUAGE,
          maxResults: 5,
          partialResults: true,
          popup: false,
          allowForSilence: 2200,
        });

        const immediateTranscript = pickBestMatch(immediateResult.matches);
        if (immediateTranscript) {
          emitTranscript(immediateTranscript, true);
        }
      } catch (error) {
        setIsListening(false);
        setStatus(
          error instanceof Error ? `Voice capture failed: ${error.message}` : "Voice capture failed.",
        );
      }
      return;
    }

    const RecognitionCtor = resolveSpeechRecognitionCtor();
    if (!RecognitionCtor) {
      setIsRecognitionSupported(false);
      setStatus("Browser speech recognition is unavailable on this device.");
      return;
    }

    try {
      const recognition = new RecognitionCtor();
      recognition.lang = NATIVE_LANGUAGE;
      recognition.maxAlternatives = 5;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setStatus("Listening for A to E or the option text.");
      };

      recognition.onresult = (event) => {
        const matches: string[] = [];
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const alternative = event.results[index]?.[0]?.transcript?.trim();
          if (alternative) {
            matches.push(alternative);
          }
        }

        const bestMatch = pickBestMatch(matches);
        if (!bestMatch) {
          return;
        }

        const lastResult = event.results[event.results.length - 1];
        emitTranscript(bestMatch, Boolean(lastResult?.isFinal));
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setStatus(`Voice capture failed: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (manualStopRef.current) {
          manualStopRef.current = false;
          return;
        }

        setStatus(
          transcript
            ? "Listening finished."
            : "No answer was captured. Try speaking only the letter, like B.",
        );
      };

      browserRecognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      setStatus(
        error instanceof Error ? `Voice capture failed: ${error.message}` : "Voice capture failed.",
      );
    }
  };

  const readQuestion = async (question: Question, onComplete?: (() => void) | null) => {
    await speak(buildQuestionNarration(question), onComplete);
  };

  const readExplanation = async (question: Question) => {
    await speak(buildExplanationNarration(question));
  };

  const speakFeedback = async (question: Question, choiceLabel: string) => {
    await speak(buildFeedbackNarration(question, choiceLabel));
  };

  useEffect(() => {
    const initializeRecognition = async () => {
      if (nativePlatform) {
        try {
          const availability = await SpeechRecognition.available();
          setIsRecognitionSupported(availability.available);
        } catch {
          setIsRecognitionSupported(false);
        }
        return;
      }

      setIsRecognitionSupported(Boolean(resolveSpeechRecognitionCtor()));
    };

    void initializeRecognition();
  }, []);

  useEffect(() => {
    const loadVoices = async () => {
      if (nativePlatform) {
        let nextVoices: VoiceOption[] = [];
        let nextSpeechSupport = false;

        try {
          const languages = await TextToSpeech.getSupportedLanguages();
          nextSpeechSupport = languages.languages.length > 0;
        } catch {
          nextSpeechSupport = false;
        }

        try {
          const voiceResponse = await TextToSpeech.getSupportedVoices();
          const nativeVoices = buildNativeVoiceOptions(voiceResponse.voices);
          nextVoices = nativeVoices;
          nextSpeechSupport = nextSpeechSupport || nativeVoices.length > 0;
        } catch {
          nextVoices = [AUTO_VOICE_OPTION];
        }

        if (nextVoices.length === 0) {
          nextVoices = [AUTO_VOICE_OPTION];
        }
        setAvailableVoices(nextVoices);
        setIsSpeechSupported(nextSpeechSupport);
        return;
      }

      const speechSynthesis = resolveSpeechSynthesis();
      if (!speechSynthesis) {
        setAvailableVoices([AUTO_VOICE_OPTION]);
        setIsSpeechSupported(false);
        return;
      }

      const refreshVoices = () => {
        const voices = buildWebVoiceOptions(speechSynthesis.getVoices());
        setAvailableVoices(voices.length ? voices : [AUTO_VOICE_OPTION]);
        setIsSpeechSupported(true);
      };

      refreshVoices();
      speechSynthesis.onvoiceschanged = refreshVoices;

      return () => {
        speechSynthesis.onvoiceschanged = null;
      };
    };

    const cleanupPromise = loadVoices();

    return () => {
      void cleanupPromise?.then((cleanup) => cleanup?.());
    };
  }, []);

  useEffect(() => {
    if (availableVoices.some((voice) => voice.id === selectedVoiceId)) {
      return;
    }

    setSelectedVoiceIdState(DEFAULT_VOICE_ID);
  }, [availableVoices, selectedVoiceId]);

  useEffect(() => {
    if (hadStoredVoicePreference || selectedVoiceId !== DEFAULT_VOICE_ID || availableVoices.length <= 1) {
      return;
    }

    const recommendedVoice =
      availableVoices.find((voice) => voice.source !== "auto" && voice.gender === "female") ??
      availableVoices.find((voice) => voice.source !== "auto");

    if (recommendedVoice) {
      setSelectedVoiceIdState(recommendedVoice.id);
    }
  }, [availableVoices, hadStoredVoicePreference, selectedVoiceId]);

  useEffect(() => {
    if (!nativePlatform) {
      return;
    }

    let disposed = false;

    const registerNativeListeners = async () => {
      try {
        const handles = await Promise.all([
          SpeechRecognition.addListener("partialResults", (event) => {
            const bestMatch = pickBestMatch(event.matches);
            if (bestMatch) {
              emitTranscript(bestMatch);
            }
          }),
          SpeechRecognition.addListener("segmentResults", (event) => {
            const bestMatch = pickBestMatch(event.matches);
            if (bestMatch) {
              emitTranscript(bestMatch, true);
            }
          }),
          SpeechRecognition.addListener("listeningState", (event) => {
            const started = event.status === "started";
            setIsListening(started);

            if (started) {
              setStatus("Listening for A to E or the option text.");
              return;
            }

            if (manualStopRef.current) {
              manualStopRef.current = false;
              return;
            }

            setStatus(
              lastDeliveredTranscriptRef.current
                ? "Listening finished."
                : "No answer was captured. Try speaking only the letter, like B.",
            );
          }),
        ]);

        if (disposed) {
          await Promise.all(handles.map((handle) => handle.remove()));
          return;
        }

        nativeListenerHandlesRef.current = handles;
      } catch {
        setStatus("Native voice listeners failed to initialize.");
      }
    };

    void registerNativeListeners();

    return () => {
      disposed = true;
      const handles = nativeListenerHandlesRef.current;
      nativeListenerHandlesRef.current = [];
      void Promise.all(handles.map((handle) => handle.remove()));
    };
  }, []);

  useEffect(() => {
    return () => {
      clearAfterSpeakTimeout();
      void stopAudio();
    };
  }, []);

  return {
    availableVoices,
    clearTranscript,
    isListening,
    isRecognitionSupported,
    isSpeaking,
    isSpeechSupported,
    readExplanation,
    readQuestion,
    selectedVoiceId,
    setSelectedVoiceId: setSelectedVoiceIdState,
    speechRatePreset,
    speak,
    speakFeedback,
    startListening,
    status,
    setSpeechRatePreset: setSpeechRatePresetState,
    stopAudio,
    transcript,
  };
}
