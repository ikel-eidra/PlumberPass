import { Question } from "../App";
import "../styles/mistake-library.css";

type MistakeLibraryScreenProps = {
  onBack: () => void;
  mistakes: Question[];
};

export default function MistakeLibraryScreen({
  onBack,
  mistakes
}: MistakeLibraryScreenProps) {
  return (
    <div className="mistake-library">
      <header className="mistake-library__topbar">
        <button type="button" className="mistake-library__icon" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2>Mistake Library</h2>
        <button type="button" className="mistake-library__icon">
          <span className="material-symbols-outlined">mic</span>
        </button>
      </header>

      <section className="mistake-library__intro">
        <h1>Field Notes Index</h1>
        <p>
          {mistakes.length} topics require attention. Your personal guide to
          strengthening technical weaknesses.
        </p>
      </section>

      <section className="mistake-library__search">
        <div className="mistake-library__search-row">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="Search topics or say 'Review mistakes'" />
        </div>
      </section>

      <section className="mistake-library__filters">
        <button className="is-active">All</button>
        <button>Sort by Date</button>
        <button>Code Sections</button>
        <button>Hydraulics</button>
      </section>

      <div className="mistake-library__divider" />

      <section className="mistake-library__list">
        {mistakes.length === 0 ? (
          <div className="mistake-library__empty">
            <p>No mistakes logged yet. Good job, Apprentice!</p>
          </div>
        ) : (
          mistakes.map((mistake) => (
            <article key={mistake.id} className="mistake-card">
              <div className="mistake-card__image">
                {/* Fallback image for dynamic mistakes */}
                <img
                  src="https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=200"
                  alt={mistake.topic}
                  loading="lazy"
                />
                <span className="mistake-card__overlay" />
              </div>
              <div className="mistake-card__body">
                <div className="mistake-card__header">
                  <span className="mistake-card__tag">Needs Review</span>
                  <span className="mistake-card__date">Today</span>
                </div>
                <h3>{mistake.prompt.slice(0, 40)}...</h3>
                <div className="mistake-card__detail">
                  <span className="material-symbols-outlined">menu_book</span>
                  <p>
                    {mistake.topic} • {mistake.subtopic}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="mistake-library__footer">
        <button type="button" disabled={mistakes.length === 0}>
          Study Mistakes Now
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
}
