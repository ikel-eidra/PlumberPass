import { Capacitor } from "@capacitor/core";
import { useEffect, useMemo, useState } from "react";
import type { Flashcard, IdentificationItem } from "../App";
import ThemeToggle, { type UiTheme } from "../components/ThemeToggle";
import UiIcon from "../components/UiIcon";
import { useAudioReview } from "../hooks/useAudioReview";
import "../styles/active-study.css";

type ActiveStudyProps = {
  theme: UiTheme;
  onThemeChange: (theme: UiTheme) => void;
  onBack: () => void;
  flashcards: Flashcard[];
  identifications: IdentificationItem[];
};

type RecallItem = {
  id: string;
  topic: string;
  subtopic: string;
  prompt: string;
  answer: string;
  explanationShort: string;
  explanationLong: string;
  acceptedAnswers: string[];
  type: "flashcard" | "identification";
  sourceRef: string;
  qualityFlag: string;
};

type RecallRecord = {
  correct: number;
  incorrect: number;
  intervalMinutes: number;
  dueAt: number;
  lastReviewedAt: number | null;
};

const STORAGE_KEY = "pp_recall_cards_v1";

const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const interleaveByTopic = <T extends { topic: string }>(items: T[]) => {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const bucket = buckets.get(item.topic) ?? [];
    bucket.push(item);
    buckets.set(item.topic, bucket);
  }

  const topics = Array.from(buckets.keys()).sort((left, right) => left.localeCompare(right));
  const queue: T[] = [];
  let remaining = true;

  while (remaining) {
    remaining = false;
    for (const topic of topics) {
      const nextItem = buckets.get(topic)?.shift();
      if (nextItem) {
        queue.push(nextItem);
        remaining = true;
      }
    }
  }

  return queue;
};

const buildRecallItems = (flashcards: Flashcard[], identifications: IdentificationItem[]): RecallItem[] => [
  ...flashcards.map((flashcard) => ({
    id: flashcard.id,
    topic: flashcard.topic,
    subtopic: flashcard.subtopic,
    prompt: flashcard.front,
    answer: flashcard.back,
    explanationShort: flashcard.explanation_short,
    explanationLong: flashcard.explanation_long,
    acceptedAnswers: [flashcard.back],
    type: "flashcard" as const,
    sourceRef: flashcard.source_ref,
    qualityFlag: flashcard.quality_flag,
  })),
  ...identifications.map((identification) => ({
    id: identification.id,
    topic: identification.topic,
    subtopic: identification.subtopic,
    prompt: identification.prompt,
    answer: identification.accepted_answers.join(" / "),
    explanationShort: identification.explanation_short,
    explanationLong: identification.explanation_long,
    acceptedAnswers: identification.accepted_answers,
    type: "identification" as const,
    sourceRef: identification.source_ref,
    qualityFlag: identification.quality_flag,
  })),
];

const buildSessionDeck = (items: RecallItem[], records: Record<string, RecallRecord>) => {
  const now = Date.now();
  const due: RecallItem[] = [];
  const fresh: RecallItem[] = [];
  const later: Array<{ item: RecallItem; dueAt: number }> = [];

  for (const item of items) {
    const record = records[item.id];
    if (!record) {
      fresh.push(item);
      continue;
    }

    if (record.dueAt <= now) {
      due.push(item);
    } else {
      later.push({ item, dueAt: record.dueAt });
    }
  }

  later.sort((left, right) => left.dueAt - right.dueAt);
  return [...interleaveByTopic(due), ...interleaveByTopic(fresh), ...later.map((entry) => entry.item)];
};

const formatElapsed = (milliseconds: number) => {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const matchesAcceptedAnswer = (transcript: string, acceptedAnswers: string[]) => {
  const normalizedTranscript = normalizeText(transcript);
  if (!normalizedTranscript) {
    return false;
  }

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalizeText(answer);
    if (!normalizedAnswer) {
      return false;
    }
    if (normalizedTranscript === normalizedAnswer) {
      return true;
    }
    if (
      normalizedTranscript.includes(normalizedAnswer) ||
      normalizedAnswer.includes(normalizedTranscript)
    ) {
      return true;
    }

    const answerTokens = new Set(normalizedAnswer.split(" "));
    const transcriptTokens = normalizedTranscript.split(" ").filter(Boolean);
    const overlap = transcriptTokens.filter((token) => answerTokens.has(token)).length;
    return overlap >= Math.max(1, Math.min(answerTokens.size, transcriptTokens.length));
  });
};

export default function ActiveStudy({
  theme,
  onThemeChange,
  onBack,
  flashcards,
  identifications,
}: ActiveStudyProps) {
  const nativeRuntime = Capacitor.isNativePlatform();
  const recallItems = useMemo(
    () => buildRecallItems(flashcards, identifications),
    [flashcards, identifications],
  );
  const [records, setRecords] = useState<Record<string, RecallRecord>>(() =>
    readJson<Record<string, RecallRecord>>(STORAGE_KEY, {}),
  );
  const [sessionDeck, setSessionDeck] = useState<RecallItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [voiceAttempt, setVoiceAttempt] = useState("");
  const [pendingAssessment, setPendingAssessment] = useState<"correct" | "incorrect" | null>(null);
  const [hasRatedCurrent, setHasRatedCurrent] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());
  const [clockTick, setClockTick] = useState(Date.now());
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const {
    clearTranscript,
    isListening,
    isRecognitionSupported,
    isSpeaking,
    isSpeechSupported,
    speak,
    startListening,
    status,
    stopAudio,
    transcript,
  } = useAudioReview();

  useEffect(() => {
    writeJson(STORAGE_KEY, records);
  }, [records]);

  useEffect(() => {
    setSessionDeck(buildSessionDeck(recallItems, records));
    setActiveIndex(0);
    setSessionStartedAt(Date.now());
    setSessionReviewed(0);
  }, [recallItems]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const intervalId = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setVoiceAttempt(transcript);
  }, [transcript]);

  useEffect(() => {
    setActiveIndex((prev) => {
      if (sessionDeck.length === 0) {
        return 0;
      }
      return Math.min(prev, sessionDeck.length - 1);
    });
  }, [sessionDeck.length]);

  const item = sessionDeck[activeIndex] ?? null;
  const sessionComplete = sessionDeck.length > 0 && activeIndex >= sessionDeck.length;

  const recallDueCount = useMemo(
    () =>
      recallItems.filter((entry) => {
        const record = records[entry.id];
        return Boolean(record) && record.dueAt <= clockTick;
      }).length,
    [clockTick, recallItems, records],
  );

  const recallAccuracy = useMemo(() => {
    const totals = Object.values(records).reduce(
      (summary, record) => ({
        correct: summary.correct + record.correct,
        incorrect: summary.incorrect + record.incorrect,
      }),
      { correct: 0, incorrect: 0 },
    );
    const answered = totals.correct + totals.incorrect;
    return answered ? Math.round((totals.correct / answered) * 100) : 0;
  }, [records]);

  const masteredCount = useMemo(
    () =>
      Object.values(records).filter(
        (record) => record.correct >= 2 && record.intervalMinutes >= 24 * 60,
      ).length,
    [records],
  );

  const progressWidth = useMemo(() => {
    if (sessionDeck.length === 0) {
      return 0;
    }
    return ((activeIndex + 1) / sessionDeck.length) * 100;
  }, [activeIndex, sessionDeck.length]);

  const goNext = () => {
    stopAudio();
    clearTranscript();
    setVoiceAttempt("");
    setPendingAssessment(null);
    setHasRatedCurrent(false);
    setRevealed(false);
    setActiveIndex((prev) => {
      if (sessionDeck.length === 0) {
        return 0;
      }
      return Math.min(prev + 1, sessionDeck.length);
    });
  };

  const goPrevious = () => {
    stopAudio();
    clearTranscript();
    setVoiceAttempt("");
    setPendingAssessment(null);
    setHasRatedCurrent(false);
    setRevealed(false);
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  };

  const speakPrompt = () => {
    if (!item) {
      return;
    }
    const lead =
      item.type === "identification" ? "Identification prompt." : "Rapid recall prompt.";
    speak(`${lead} ${item.prompt}`);
  };

  const speakAnswer = () => {
    if (!item) {
      return;
    }
    const answerLead =
      item.type === "identification" ? "Accepted answer." : "Model answer.";
    const explanation = item.explanationShort || item.explanationLong;
    speak(`${answerLead} ${item.answer}. ${explanation}`.trim());
  };

  useEffect(() => {
    if (!item) {
      return;
    }

    clearTranscript();
    setVoiceAttempt("");
    setPendingAssessment(null);
    setHasRatedCurrent(false);
    setRevealed(false);

    if (nativeRuntime) {
      return;
    }

    void stopAudio();

    if (isSpeechSupported) {
      speakPrompt();
    }

    return () => {
      void stopAudio();
    };
  }, [clearTranscript, isSpeechSupported, item?.id, nativeRuntime, stopAudio]);

  const appendReplay = (currentItem: RecallItem) => {
    setSessionDeck((prev) => {
      const remaining = prev.slice(activeIndex + 1);
      if (remaining.some((entry) => entry.id === currentItem.id)) {
        return prev;
      }
      return [...prev, currentItem];
    });
  };

  const recordResult = (isCorrect: boolean) => {
    if (!item || hasRatedCurrent) {
      return;
    }

    const now = Date.now();
    setRecords((prev) => {
      const current = prev[item.id] ?? {
        correct: 0,
        incorrect: 0,
        intervalMinutes: 0,
        dueAt: now,
        lastReviewedAt: null,
      };
      const nextInterval = isCorrect
        ? current.intervalMinutes === 0
          ? 30
          : current.intervalMinutes < 12 * 60
            ? current.intervalMinutes * 3
            : Math.round(current.intervalMinutes * 1.8)
        : 8;

      return {
        ...prev,
        [item.id]: {
          correct: current.correct + (isCorrect ? 1 : 0),
          incorrect: current.incorrect + (isCorrect ? 0 : 1),
          intervalMinutes: nextInterval,
          dueAt: now + nextInterval * 60 * 1000,
          lastReviewedAt: now,
        },
      };
    });
    setSessionReviewed((prev) => prev + 1);
    setPendingAssessment(isCorrect ? "correct" : "incorrect");
    setHasRatedCurrent(true);
    if (!isCorrect) {
      appendReplay(item);
    }
    speak(isCorrect ? "Locked in. Move to the next prompt." : "Queued for replay later.");
  };

  const revealAnswer = () => {
    if (!item) {
      return;
    }
    setRevealed(true);
    speakAnswer();
  };

  const startVoiceAttempt = () => {
    if (!item) {
      return;
    }

    clearTranscript();
    setVoiceAttempt("");
    startListening((nextTranscript) => {
      setVoiceAttempt(nextTranscript);
      setRevealed(true);

      if (item.type === "identification") {
        const likelyCorrect = matchesAcceptedAnswer(nextTranscript, item.acceptedAnswers);
        setPendingAssessment(likelyCorrect ? "correct" : "incorrect");
        const explanation = item.explanationShort || item.explanationLong;
        speak(
          `${likelyCorrect ? "Likely correct." : "Check the model answer."} ${item.answer}. ${explanation}`.trim(),
        );
        return;
      }

      const explanation = item.explanationShort || item.explanationLong;
      speak(`Compare your recall with the model answer. ${item.answer}. ${explanation}`.trim());
    });
  };

  const restartSession = () => {
    stopAudio();
    clearTranscript();
    setSessionDeck(buildSessionDeck(recallItems, records));
    setActiveIndex(0);
    setVoiceAttempt("");
    setPendingAssessment(null);
    setRevealed(false);
    setSessionReviewed(0);
    setSessionStartedAt(Date.now());
  };

  if (!item) {
    if (sessionComplete) {
      return (
        <div className="active-study active-study--empty">
          <header className="active-study__topbar">
            <button className="active-study__icon-button" type="button" onClick={onBack}>
              <UiIcon name="arrowLeft" size={18} />
            </button>
            <h1 className="active-study__title">Rapid Recall</h1>
            <ThemeToggle theme={theme} onChange={onThemeChange} />
            <span className="active-study__timer">{formatElapsed(clockTick - sessionStartedAt)}</span>
          </header>
          <div className="active-study__empty-card">
            <p className="active-study__eyebrow">Session Complete</p>
            <h2>You cleared the recall loop.</h2>
            <p>
              {sessionReviewed} prompts processed with replay intervals updated from your
              ratings.
            </p>
            <div className="active-study__summary-actions">
              <button type="button" onClick={restartSession}>
                Run Another Pass
              </button>
              <button type="button" className="ghost" onClick={onBack}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="active-study active-study--empty">
        <header className="active-study__topbar">
          <button className="active-study__icon-button" type="button" onClick={onBack}>
            <UiIcon name="arrowLeft" size={18} />
          </button>
          <h1 className="active-study__title">Rapid Recall</h1>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
          <span className="active-study__timer">00:00</span>
        </header>
        <div className="active-study__empty-card">
          <h2>No recall items loaded yet</h2>
          <p>
            Flashcards and identification prompts will appear here once the study bank is
            available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="active-study">
      <header className="active-study__header">
        <div className="active-study__topbar">
          <button
            className="active-study__icon-button"
            type="button"
            aria-label="Back"
            onClick={() => {
              stopAudio();
              onBack();
            }}
          >
            <UiIcon name="arrowLeft" size={18} />
          </button>
          <div className="active-study__title-wrap">
            <p className="active-study__eyebrow">Rapid Recall</p>
            <h1 className="active-study__title">Voice Memory Drill</h1>
          </div>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
          <div className="active-study__timer">
            <UiIcon name="timer" size={18} />
            <span>{formatElapsed(clockTick - sessionStartedAt)}</span>
          </div>
        </div>
        <div className="active-study__progress">
          <span style={{ width: `${progressWidth}%` }} />
        </div>
      </header>

      <main className="active-study__content">
        <section className="active-study__dashboard">
          <article>
            <span>Due Now</span>
            <strong>{recallDueCount}</strong>
            <p>Priority prompts ready for replay</p>
          </article>
          <article>
            <span>Recall Accuracy</span>
            <strong>{recallAccuracy}%</strong>
            <p>Across voice recall confirmations</p>
          </article>
          <article>
            <span>Locked In</span>
            <strong>{masteredCount}</strong>
            <p>Prompts with long replay intervals</p>
          </article>
        </section>

        <section className="active-study__card">
          <div className="active-study__card-top" />
          <div className="active-study__card-shell">
            <div className="active-study__signal">
              <div className="active-study__pulse active-study__pulse--one" />
              <div className="active-study__pulse active-study__pulse--two" />
              <div className="active-study__signal-core">
                <UiIcon
                  name={item.type === "identification" ? "hearing" : "brain"}
                  size={22}
                />
              </div>
              <div className="active-study__signal-chip">
                <UiIcon
                  name={isListening ? "waveform" : isSpeaking ? "speaker" : "mic"}
                  size={16}
                />
                {item.type === "identification" ? "Voice identification" : "Self-graded recall"}
              </div>
            </div>

            <div className="active-study__body">
              <div className="active-study__meta">
                <span>
                  {item.topic} · {item.subtopic}
                </span>
                <span>
                  {activeIndex + 1} / {sessionDeck.length}
                </span>
              </div>

              <div className="active-study__pills">
                <span>{item.type === "identification" ? "Identification" : "Flashcard"}</span>
                <span>{item.qualityFlag || "study"}</span>
                <span>{sessionReviewed} checked this session</span>
              </div>

              <p className="active-study__prompt">{item.prompt}</p>

              <div className="active-study__coach">
                <p>{status}</p>
                <span>
                  {isRecognitionSupported
                    ? "Speak when ready, then compare with the model answer."
                    : "Voice recognition is unavailable here. Use reveal plus self-rating."}
                </span>
              </div>

              {voiceAttempt ? (
                <div className="active-study__transcript">
                  <UiIcon name="chat" size={18} />
                  <p>{voiceAttempt}</p>
                </div>
              ) : null}

              {revealed ? (
                <div className="active-study__answer">
                  <div className="active-study__answer-head">
                    <span>Model Answer</span>
                    {pendingAssessment ? (
                      <strong className={`is-${pendingAssessment}`}>
                        {pendingAssessment === "correct" ? "Likely correct" : "Needs replay"}
                      </strong>
                    ) : null}
                  </div>
                  <h2>{item.answer}</h2>
                  <p>{item.explanationLong || item.explanationShort}</p>
                  <small>{item.sourceRef}</small>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="active-study__footer">
        <div className="active-study__voice">
          <div className="active-study__glow" aria-hidden="true" />
          <button
            type="button"
            className="active-study__mic"
            onClick={startVoiceAttempt}
            disabled={!isRecognitionSupported}
          >
            <UiIcon name={isListening ? "waveform" : "mic"} size={20} />
            {item.type === "identification" ? "Answer by Voice" : "Speak Recall"}
            <span className="active-study__texture" aria-hidden="true" />
          </button>
        </div>

        <div className="active-study__actions">
          <button type="button" onClick={goPrevious} disabled={activeIndex === 0}>
            <UiIcon name="arrowLeft" size={18} />
            Previous
          </button>
          <button type="button" onClick={speakPrompt}>
            <UiIcon name="speaker" size={18} />
            Repeat
          </button>
          <button type="button" onClick={revealed ? speakAnswer : revealAnswer}>
            <UiIcon name={revealed ? "voice" : "visibility"} size={18} />
            {revealed ? "Read Answer" : "Reveal"}
          </button>
          <button type="button" onClick={goNext}>
            Skip
            <UiIcon name="arrowRight" size={18} />
          </button>
        </div>

        {revealed ? (
          <div className="active-study__grading">
            <button
              type="button"
              className={`active-study__grade ${
                pendingAssessment === "incorrect" ? "is-suggested" : ""
              }`}
              onClick={() => recordResult(false)}
              disabled={hasRatedCurrent}
            >
              Replay Later
            </button>
            <button
              type="button"
              className={`active-study__grade active-study__grade--primary ${
                pendingAssessment === "correct" ? "is-suggested" : ""
              }`}
              onClick={() => recordResult(true)}
              disabled={hasRatedCurrent}
            >
              {item.type === "identification" ? "Lock It In" : "I Knew It"}
            </button>
          </div>
        ) : null}
      </footer>
    </div>
  );
}
