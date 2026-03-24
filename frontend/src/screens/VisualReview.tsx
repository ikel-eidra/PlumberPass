import { useEffect, useMemo, useState } from "react";
import type { VisualReviewItem } from "../App";
import ThemeToggle, { type UiTheme } from "../components/ThemeToggle";
import "../styles/visual-review.css";

type VisualReviewProps = {
  theme: UiTheme;
  onThemeChange: (theme: UiTheme) => void;
  items: VisualReviewItem[];
  onBack: () => void;
};

type ReviewState = "idle" | "correct" | "incorrect" | "revealed";

const normalizeAnswer = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const shuffleItems = (items: VisualReviewItem[]) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export default function VisualReview({ theme, onThemeChange, items, onBack }: VisualReviewProps) {
  const [activeTopic, setActiveTopic] = useState("All cards");
  const [activeIndex, setActiveIndex] = useState(0);
  const [shuffleRound, setShuffleRound] = useState(0);
  const [guess, setGuess] = useState("");
  const [reviewState, setReviewState] = useState<ReviewState>("idle");

  useEffect(() => {
    setActiveTopic("All cards");
    setActiveIndex(0);
    setShuffleRound(0);
    setGuess("");
    setReviewState("idle");
  }, [items.length]);

  useEffect(() => {
    setGuess("");
    setReviewState("idle");
  }, [activeIndex]);

  const topicOptions = useMemo(
    () => ["All cards", ...Array.from(new Set(items.map((entry) => entry.topic))).sort()],
    [items],
  );
  const filteredItems = useMemo(
    () => (activeTopic === "All cards" ? items : items.filter((entry) => entry.topic === activeTopic)),
    [activeTopic, items],
  );
  const deckItems = useMemo(
    () => (shuffleRound === 0 ? filteredItems : shuffleItems(filteredItems)),
    [filteredItems, shuffleRound],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [activeTopic, shuffleRound]);

  const item = deckItems[activeIndex];
  const progressLabel = `${Math.min(activeIndex + 1, Math.max(deckItems.length, 1))}/${Math.max(deckItems.length, 1)}`;
  const isCorrectGuess = useMemo(() => {
    if (!item) {
      return false;
    }
    const normalizedGuess = normalizeAnswer(guess);
    if (!normalizedGuess) {
      return false;
    }

    const acceptedAnswers = [item.answer, ...item.accepted_answers].map(normalizeAnswer);
    return acceptedAnswers.includes(normalizedGuess);
  }, [guess, item]);

  const submitGuess = () => {
    if (!guess.trim()) {
      return;
    }
    setReviewState(isCorrectGuess ? "correct" : "incorrect");
  };

  const revealAnswer = () => {
    setReviewState("revealed");
  };

  const goNext = () => {
    if (!deckItems.length) {
      return;
    }
    setActiveIndex((current) => (current + 1) % deckItems.length);
  };

  const goPrevious = () => {
    if (!deckItems.length) {
      return;
    }
    setActiveIndex((current) => (current - 1 + deckItems.length) % deckItems.length);
  };

  if (!item) {
    return (
      <div className="visual-review-shell">
        <header className="visual-review-header">
          <button type="button" className="visual-review-back" onClick={onBack}>
            Back
          </button>
          <div>
            <p>Visual Review</p>
            <h1>No visual items published yet</h1>
          </div>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </header>
      </div>
    );
  }

  const answerVisible = reviewState !== "idle";

  return (
    <div className="visual-review-shell">
      <header className="visual-review-header">
        <button type="button" className="visual-review-back" onClick={onBack}>
          Back
        </button>
        <div>
          <p>Visual Review</p>
          <h1>Figure drills and illustrated details</h1>
        </div>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
        <span className="visual-review-progress">{progressLabel}</span>
      </header>

      <section className="visual-review-hero">
        <div>
          <p className="visual-review-eyebrow">{item.topic}</p>
          <h2>{item.subtopic}</h2>
          <span>{item.caption}</span>
        </div>
        <div className="visual-review-chip-row">
          <span>{deckItems.length} cards in this deck</span>
          <span>{items.length} visual cards total</span>
          <span>Screen-first drill</span>
          <span>{item.quality_flag}</span>
        </div>
      </section>

      <section className="visual-review-deck-bar">
        <div className="visual-review-deck-copy">
          <span>Deck</span>
          <strong>{activeTopic}</strong>
        </div>
        <div className="visual-review-deck-list">
          {topicOptions.map((topic) => (
            <button
              key={topic}
              type="button"
              className={topic === activeTopic ? "is-active" : undefined}
              onClick={() => setActiveTopic(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="visual-review-shuffle"
          onClick={() => setShuffleRound((current) => current + 1)}
        >
          Shuffle Deck
        </button>
      </section>

      <section className="visual-review-card">
        <div className="visual-review-image-frame">
          <img src={item.image_path} alt={item.caption} className="visual-review-image" />
        </div>

        <div className="visual-review-content">
          <div className="visual-review-copy">
            <p className="visual-review-prompt">{item.prompt}</p>
            <label className="visual-review-input">
              <span>Your answer</span>
              <input
                type="text"
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    submitGuess();
                  }
                }}
                placeholder="Type the figure or detail name"
              />
            </label>
          </div>

          <div className="visual-review-actions">
            <button type="button" onClick={submitGuess} disabled={!guess.trim()}>
              Check answer
            </button>
            <button type="button" className="ghost" onClick={revealAnswer}>
              Reveal
            </button>
          </div>

          {answerVisible ? (
            <div className={`visual-review-feedback visual-review-feedback--${reviewState}`}>
              <strong>
                {reviewState === "correct"
                  ? "Correct"
                  : reviewState === "incorrect"
                  ? "Not yet"
                  : "Answer revealed"}
              </strong>
              <p>{item.answer}</p>
              <span>{item.explanation_short}</span>
              <small>{item.explanation_long}</small>
            </div>
          ) : (
            <div className="visual-review-hint">
              Try to name the figure from memory first, then reveal if you need the cue.
            </div>
          )}
        </div>
      </section>

      <section className="visual-review-meta">
        <article>
          <span>Caption</span>
          <strong>{item.caption}</strong>
        </article>
        <article>
          <span>Source</span>
          <strong>{item.source_ref}</strong>
        </article>
      </section>

      <nav className="visual-review-nav">
        <button type="button" onClick={goPrevious}>
          Previous
        </button>
        <button type="button" onClick={goNext}>
          Next Card
        </button>
      </nav>
    </div>
  );
}
