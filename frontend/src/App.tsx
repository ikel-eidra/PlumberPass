import { useEffect, useMemo, useState } from "react";
import ModeToggle from "./components/ModeToggle";
import MistakeLibrary from "./components/MistakeLibrary";
import QuestionCard from "./components/QuestionCard";
import TopicList from "./components/TopicList";
import Dashboard from "./screens/Dashboard";
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
type Screen = "Landing" | "Dashboard" | "Review";

const fetchJson = async <T,>(path: string, fallback: T): Promise<T> => {
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<Question[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [voiceStatus, setVoiceStatus] = useState("Awaiting voice input.");

  useEffect(() => {
    const load = async () => {
      const [topicResponse, questionResponse] = await Promise.all([
        fetchJson<Topic[]>("/api/topics", []),
        fetchJson<Question[]>("/api/questions", [fallbackQuestion])
      ]);
      setTopics(topicResponse);
      setQuestions(questionResponse.length ? questionResponse : [fallbackQuestion]);
    };
    load();
  }, []);

  useEffect(() => {
    setVoiceStatus("Awaiting voice input.");
  }, [activeIndex]);

  const question = questions[activeIndex] ?? fallbackQuestion;

  const progressLabel = useMemo(() => {
    return `${activeIndex + 1}/${questions.length}`;
  }, [activeIndex, questions.length]);

  const goNext = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    setActiveIndex((prev) => (prev + 1) % questions.length);
  };

  const goPrevious = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    setActiveIndex((prev) => (prev - 1 + questions.length) % questions.length);
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
          <span className="landing-orb orb-1" />
          <span className="landing-orb orb-2" />
          <span className="landing-orb orb-3" />
          <span className="landing-lines" />
        </div>
        <header className="landing-header">
          <p className="landing-eyebrow">PlumberPass</p>
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
            <h1>Train like a licensed pro with a living study flow.</h1>
            <p>
              PlumberPass blends voice-first practice with visual cues, so you can
              learn codes, systems, and field instincts faster than flashcards
              alone.
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
          </div>
          <div className="landing-card">
            <h2>What feels alive?</h2>
            <ul>
              <li>Animated flow backdrops inspired by water pressure.</li>
              <li>Voice, screen, and hybrid review options.</li>
              <li>Targeted practice for plumbing codes & systems.</li>
            </ul>
            <div className="landing-stats">
              <div>
                <span>40+</span>
                <p>Curated questions</p>
              </div>
              <div>
                <span>3</span>
                <p>Study modes</p>
              </div>
              <div>
                <span>24/7</span>
                <p>On-demand practice</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <nav className="screen-toggle">
        <button
          type="button"
          className={screen === "Dashboard" ? "active" : ""}
          onClick={() => setScreen("Dashboard")}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={screen === "Review" ? "active" : ""}
          onClick={() => setScreen("Review")}
        >
          Review
        </button>
      </nav>
      <header className="app-header">
        <div>
          <p className="eyebrow">PlumberPass</p>
          <h1>Voice-first reviewer with full visual + hybrid modes</h1>
          <p className="subtitle">
            Switch between voice-only, screen-only, or hybrid review. Swipe, tap,
            or speak A–E answers with confidence.
          </p>
        </div>
        <ModeToggle mode={mode} modes={modes} onChange={setMode} />
      </header>

      <main className="app-content">
        {screen === "Dashboard" ? (
          <section className="dashboard-shell">
            <Dashboard />
          </section>
        ) : null}
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
