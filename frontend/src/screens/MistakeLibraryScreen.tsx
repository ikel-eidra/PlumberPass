import { useMemo, useState } from "react";
import type { MistakeEntry } from "../hooks/useStudyProgress";
import ThemeToggle, { type UiTheme } from "../components/ThemeToggle";
import UiIcon from "../components/UiIcon";
import "../styles/mistake-library.css";

type MistakeLibraryScreenProps = {
  theme: UiTheme;
  onThemeChange: (theme: UiTheme) => void;
  onBack: () => void;
  onStudy: () => void;
  onReviewItem: (questionId: string) => void;
  mistakes: MistakeEntry[];
};

type ViewMode = "due" | "all" | "hardest" | "recent";

const formatRelativeReview = (timestamp: number | null) => {
  if (!timestamp) {
    return "Queued";
  }

  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  return `${diffDays}d ago`;
};

const truncatePrompt = (prompt: string) => {
  const compact = prompt.replace(/\s+/g, " ").trim();
  if (compact.length <= 88) {
    return compact;
  }
  return `${compact.slice(0, 85).trim()}...`;
};

export default function MistakeLibraryScreen({
  theme,
  onThemeChange,
  onBack,
  onStudy,
  onReviewItem,
  mistakes
}: MistakeLibraryScreenProps) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("due");

  const dueCount = mistakes.filter((entry) => entry.dueNow).length;
  const totalLapses = mistakes.reduce((sum, entry) => sum + entry.lapses, 0);
  const topTopic = useMemo(() => {
    const topicMap = new Map<string, number>();
    for (const mistake of mistakes) {
      topicMap.set(
        mistake.question.topic,
        (topicMap.get(mistake.question.topic) ?? 0) + mistake.lapses,
      );
    }

    return Array.from(topicMap.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "General Plumbing";
  }, [mistakes]);

  const visibleMistakes = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = mistakes.filter((entry) => {
      const haystack = [
        entry.question.prompt,
        entry.question.topic,
        entry.question.subtopic,
        entry.question.source_ref ?? "",
      ]
        .join(" ")
        .toLowerCase();

      if (!search) {
        return true;
      }

      return haystack.includes(search);
    });

    const sorted = [...filtered];
    if (viewMode === "due") {
      sorted.sort((left, right) => {
        if (left.dueNow !== right.dueNow) {
          return left.dueNow ? -1 : 1;
        }
        if (left.lapses !== right.lapses) {
          return right.lapses - left.lapses;
        }
        return (right.lastReviewedAt ?? 0) - (left.lastReviewedAt ?? 0);
      });
    } else if (viewMode === "hardest") {
      sorted.sort((left, right) => {
        if (left.lapses !== right.lapses) {
          return right.lapses - left.lapses;
        }
        return left.accuracy - right.accuracy;
      });
    } else if (viewMode === "recent") {
      sorted.sort((left, right) => (right.lastReviewedAt ?? 0) - (left.lastReviewedAt ?? 0));
    }

    return viewMode === "due" ? sorted.filter((entry) => entry.dueNow || !query) : sorted;
  }, [mistakes, query, viewMode]);

  return (
    <div className="mistake-library">
      <header className="mistake-library__topbar">
        <button type="button" className="mistake-library__icon" onClick={onBack}>
          <UiIcon name="arrowLeft" size={18} />
        </button>
        <h2>Mistake Library</h2>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
        <button type="button" className="mistake-library__icon" onClick={onStudy}>
          <UiIcon name="mic" size={18} />
        </button>
      </header>

      <section className="mistake-library__intro">
        <h1>Field Notes Index</h1>
        <p>
          {mistakes.length} unresolved misses, {dueCount} due now. Focus stays on {topTopic}.
        </p>
      </section>

      <section className="mistake-library__summary">
        <article>
          <span>Due Now</span>
          <strong>{dueCount}</strong>
        </article>
        <article>
          <span>Total Misses</span>
          <strong>{totalLapses}</strong>
        </article>
        <article>
          <span>Weakest Zone</span>
          <strong>{topTopic}</strong>
        </article>
      </section>

      <section className="mistake-library__search">
        <div className="mistake-library__search-row">
          <UiIcon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompt, topic, or source"
          />
        </div>
      </section>

      <section className="mistake-library__filters">
        <button className={viewMode === "due" ? "is-active" : ""} onClick={() => setViewMode("due")}>
          Due Now
        </button>
        <button className={viewMode === "all" ? "is-active" : ""} onClick={() => setViewMode("all")}>
          All
        </button>
        <button className={viewMode === "hardest" ? "is-active" : ""} onClick={() => setViewMode("hardest")}>
          Hardest
        </button>
        <button className={viewMode === "recent" ? "is-active" : ""} onClick={() => setViewMode("recent")}>
          Recent
        </button>
      </section>

      <div className="mistake-library__divider" />

      <section className="mistake-library__list">
        {mistakes.length === 0 ? (
          <div className="mistake-library__empty">
            <p>No mistakes logged yet. Run voice sprint and your weak spots will collect here.</p>
          </div>
        ) : visibleMistakes.length === 0 ? (
          <div className="mistake-library__empty">
            <p>No mistake cards match this filter.</p>
          </div>
        ) : (
          visibleMistakes.map((mistake) => (
            <article key={mistake.question.id} className="mistake-card">
              <div className="mistake-card__image">
                <div className="mistake-card__placeholder" aria-hidden="true">
                  <UiIcon name="pipe" size={20} />
                </div>
                <span className="mistake-card__overlay" />
              </div>
              <div className="mistake-card__body">
                <div className="mistake-card__header">
                  <span className="mistake-card__tag">{mistake.dueNow ? "Due Now" : "Logged"}</span>
                  <span className="mistake-card__date">
                    {formatRelativeReview(mistake.lastReviewedAt)}
                  </span>
                </div>
                <h3>{truncatePrompt(mistake.question.prompt)}</h3>
                <div className="mistake-card__detail">
                  <UiIcon name="book" size={16} />
                  <p>
                    {mistake.question.topic} • {mistake.question.subtopic}
                  </p>
                </div>
                <div className="mistake-card__metrics">
                  <span>{mistake.lapses} misses</span>
                  <span>{mistake.accuracy}% recovered</span>
                  <span>{mistake.lastSource ?? "study"}</span>
                </div>
                <div className="mistake-card__actions">
                  <button type="button" onClick={() => onReviewItem(mistake.question.id)}>
                    Replay Now
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="mistake-library__footer">
        <button type="button" disabled={mistakes.length === 0} onClick={onStudy}>
          Start Error Replay
          <UiIcon name="arrowRight" size={16} />
        </button>
      </footer>
    </div>
  );
}
