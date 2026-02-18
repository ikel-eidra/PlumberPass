import { useEffect, useMemo, useState } from "react";
import ModeToggle from "./components/ModeToggle";
import MistakeLibrary from "./components/MistakeLibrary";
import QuestionCard from "./components/QuestionCard";
import TopicList from "./components/TopicList";
import Dashboard from "./screens/Dashboard";
import ActiveStudy from "./screens/ActiveStudy";
import MasteryReport from "./screens/MasteryReport";
import MistakeLibraryScreen from "./screens/MistakeLibraryScreen";
import "./styles/app.css";

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

export type Topic = {
  name: string;
  subtopics: string[];
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
    { label: "D", text: "" }
  ],
  answer_key: "A",
  explanation_short: "",
  explanation_long: "",
  tags: []
};

const modes = ["Voice", "Screen", "Hybrid"] as const;
export type Mode = (typeof modes)[number];
type Screen =
  | "Landing"
  | "Dashboard"
  | "Review"
  | "ActiveStudy"
  | "MasteryReport"
  | "MistakeLibrary";

const API_BASE = import.meta.env.VITE_API_URL || "";

const fetchJson = async <T,>(path: string, fallback: T): Promise<T> => {
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

const parseVoiceAnswer = (transcript: string) => {
  const normalized = transcript.trim().toLowerCase();
  const match = normalized.match(/\b([abcde])\b/);
  if (match) {
    return match[1].toUpperCase();
  }
  const wordMap: Record<string, string> = {
    ay: "A",
    bee: "B",
    be: "B",
    see: "C",
    sea: "C",
    dee: "D",
    di: "D",
    ee: "E",
    e: "E"
  };
  return wordMap[normalized] ?? null;
};

export default function App() {
  const [mode, setMode] = useState<Mode>("Hybrid");
  const [screen, setScreen] = useState<Screen>("Landing");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([fallbackQuestion]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [identifications, setIdentifications] = useState<IdentificationItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<Question[]>([]);
  const [isMistakeReview, setIsMistakeReview] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [voiceStatus, setVoiceStatus] = useState("Awaiting voice input.");

  useEffect(() => {
    const load = async () => {
      const [topicResponse, questionResponse, flashcardResponse, identificationResponse] =
        await Promise.all([
          fetchJson<Topic[]>("/api/v1/study/topics", []),
          fetchJson<Question[]>("/api/v1/study/questions", [fallbackQuestion]),
          fetchJson<Flashcard[]>("/api/v1/study/flashcards", []),
          fetchJson<IdentificationItem[]>("/api/v1/study/identification", [])
        ]);
      setTopics(topicResponse);
      setQuestions(questionResponse.length ? questionResponse : [fallbackQuestion]);
      setFlashcards(flashcardResponse);
      setIdentifications(identificationResponse);
    };
    load();
  }, []);

  useEffect(() => {
    setVoiceStatus("Awaiting voice input.");
  }, [activeIndex]);

  const currentQuestions = useMemo(() => {
    return isMistakeReview ? mistakes : questions;
  }, [isMistakeReview, mistakes, questions]);

  const question = currentQuestions[activeIndex] ?? fallbackQuestion;

  const progressLabel = useMemo(() => {
    return `${activeIndex + 1}/${currentQuestions.length}`;
  }, [activeIndex, currentQuestions.length]);

  const goNext = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    if (currentQuestions.length > 0) {
      setActiveIndex((prev) => (prev + 1) % currentQuestions.length);
    }
  };

  const goPrevious = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    if (currentQuestions.length > 0) {
      setActiveIndex((prev) => (prev - 1 + currentQuestions.length) % currentQuestions.length);
    }
  };

  const handleAnswer = (choiceLabel: string) => {
    setSelectedAnswer(choiceLabel);
    setVoiceStatus(`Captured answer ${choiceLabel}.`);
    if (choiceLabel !== question.answer_key) {
      setMistakes((prev) =>
        prev.some((item) => item.id === question.id) ? prev : [...prev, question]
      );
    }
  };

  const toggleBookmark = () => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(question.id)) {
        next.delete(question.id);
      } else {
        next.add(question.id);
      }
      return next;
    });
  };

  const handleVoiceSubmit = () => {
    const answer = parseVoiceAnswer(voiceTranscript);
    if (answer) {
      handleAnswer(answer);
      setVoiceTranscript("");
    } else {
      setVoiceStatus("Please repeat: A to E. Tap if voice is unclear.");
    }
  };

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
        </div>
        <header className="landing-header">
          <div className="brand-lockup">
            <span className="brand-dot" />
            <p className="landing-eyebrow">PlumberPass</p>
          </div>
          <div className="landing-nav">
            <button type="button" onClick={() => setScreen("Dashboard")}>
              Enter Dashboard
            </button>
            <button type="button" onClick={() => setScreen("Review")}>
              Jump to Review
            </button>
          </div>
        </header>
        <main className="landing-hero">
          <div className="landing-copy">
            <div className="landing-tag">Modern plumbing exam prep</div>
            <h1>Simple, focused prep with a living flow of practice.</h1>
            <p>
              PlumberPass blends voice-first drills with on-screen guidance so you
              can lock in codes, systems, and field instincts faster than static
              flashcards.
            </p>
            <div className="landing-actions">
              <button type="button" onClick={() => setScreen("Dashboard")}>
                Start practicing
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setScreen("Review")}
              >
                See review mode
              </button>
            </div>
            <div className="landing-trust">
              <div>
                <strong>{questions.length}+</strong>
                <span>curated questions</span>
              </div>
              <div>
                <strong>3</strong>
                <span>study modes</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>on-demand review</span>
              </div>
            </div>
          </div>
          <div className="landing-illustration">
            <div className="illustration-card">
              <div className="gauge">
                <span>Live flow</span>
                <strong>83%</strong>
              </div>
              <h2>Built for hands-on memory.</h2>
              <p>
                Track mistakes, repeat weak topics, and stay in a steady rhythm
                with a voice-first loop.
              </p>
              <div className="pipe-strip">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="illustration-panel">
              <p>Plumbing-ready cues</p>
              <h3>System map snapshots</h3>
              <ul>
                <li>Code highlights</li>
                <li>Fixture flow checks</li>
                <li>Safety reminders</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (screen === "Dashboard") {
    return (
      <Dashboard
        onStartSession={() => setScreen("ActiveStudy")}
        onViewReport={() => setScreen("MasteryReport")}
        onViewMistakes={() => setScreen("MistakeLibrary")}
        questionCount={questions.length}
        flashcardCount={flashcards.length}
      />
    );
  }

  if (screen === "ActiveStudy") {
    return <ActiveStudy onBack={() => setScreen("Dashboard")} />;
  }

  if (screen === "MasteryReport") {
    return <MasteryReport onBack={() => setScreen("Dashboard")} />;
  }

  if (screen === "MistakeLibrary") {
    return (
      <MistakeLibraryScreen
        onBack={() => setScreen("Dashboard")}
        onStudy={() => {
          setIsMistakeReview(true);
          setActiveIndex(0);
          setScreen("Review");
        }}
        mistakes={mistakes}
      />
    );
  }

  if (screen === "Review") {
    return (
      <div className="app-shell">
        <nav className="screen-toggle">
          <button
            type="button"
            onClick={() => {
              setIsMistakeReview(false);
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
              setScreen("Review");
            }}
          >
            Review
          </button>
        </nav>
      <header className="app-header">
        <div>
          <p className="eyebrow">PlumberPass {isMistakeReview ? "• Mistake Review" : ""}</p>
          <h1>
            {isMistakeReview
              ? "Strengthening Weak Topics"
              : "Voice-first reviewer with full visual + hybrid modes"}
          </h1>
          <p className="subtitle">
            {isMistakeReview
              ? "Focusing on items you previously missed. Master these to ensure field readiness."
              : "Switch between voice-only, screen-only, or hybrid review. Swipe, tap, or speak A–E answers with confidence."}
          </p>
        </div>
        <ModeToggle mode={mode} modes={modes} onChange={setMode} />
      </header>

      <main className="app-content">
        {screen === "Review" ? (
          <aside className="sidebar">
            <TopicList topics={topics} activeTopic={question.topic} />
            <div className="quick-actions">
              <h3>Quick actions</h3>
              <button type="button" onClick={toggleBookmark}>
                {bookmarks.has(question.id) ? "Remove bookmark" : "Bookmark"}
              </button>
              <button type="button">Report issue</button>
              <button type="button">Repeat audio</button>
            </div>
            <MistakeLibrary items={mistakes} />
          </aside>
        ) : null}

        {screen === "Review" ? (
          <section className="question-area">
            <div className="progress-row">
              <span className="pill">{question.difficulty || "Session"}</span>
              <span className="progress">{progressLabel}</span>
              <span className="pill">Timer: 00:45</span>
            </div>

            <QuestionCard
              question={question}
              mode={mode}
              showExplanation={showExplanation}
              onToggleExplanation={() => setShowExplanation((value) => !value)}
              onAnswer={handleAnswer}
              selectedAnswer={selectedAnswer}
              onSwipeNext={goNext}
              onSwipePrevious={goPrevious}
              onSwipeUp={() => setShowExplanation(true)}
              onSwipeDown={toggleBookmark}
            />

            <div className="voice-panel">
              <label htmlFor="voice-input">Voice transcript (demo)</label>
              <div className="voice-row">
                <input
                  id="voice-input"
                  type="text"
                  placeholder="Say A, B, C, D, or E"
                  value={voiceTranscript}
                  onChange={(event) => setVoiceTranscript(event.target.value)}
                />
                <button type="button" onClick={handleVoiceSubmit}>
                  Parse
                </button>
              </div>
              <p className="voice-hint">
                Parsed: {selectedAnswer ?? "—"} · Answer key: {question.answer_key}
              </p>
              <p className="voice-status">{voiceStatus}</p>
            </div>

            <div className="nav-row">
              <button type="button" onClick={goPrevious}>
                Previous
              </button>
              <button type="button" onClick={() => setShowExplanation(true)}>
                Explain
              </button>
              <button type="button" onClick={goNext}>
                Next
              </button>
            </div>

            <div className="swipe-hints">
              <span>Swipe ←/→: Previous/Next</span>
              <span>Swipe ↑: Explain</span>
              <span>Swipe ↓: Bookmark</span>
            </div>
          </section>
        ) : null}
        </main>
      </div>
    );
  }

  return null;
}
