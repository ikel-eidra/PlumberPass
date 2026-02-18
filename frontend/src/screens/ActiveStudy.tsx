import "../styles/active-study.css";

type ActiveStudyProps = {
  onBack: () => void;
};

export default function ActiveStudy({ onBack }: ActiveStudyProps) {
  return (
    <div className="active-study">
      <header className="active-study__header">
        <div className="active-study__topbar">
          <button
            className="active-study__icon-button"
            type="button"
            aria-label="Back"
            onClick={onBack}
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h2 className="active-study__title">Drainage Systems</h2>
          <div className="active-study__timer">
            <span className="material-symbols-outlined">timer</span>
            <span>04:52</span>
          </div>
        </div>
        <div className="active-study__progress">
          <span style={{ width: "28%" }} />
        </div>
      </header>

      <main className="active-study__content">
        <section className="active-study__card">
          <div className="active-study__card-top" />
          <div className="active-study__card-shell">
            <div className="active-study__diagram">
              <div className="active-study__diagram-image" />
            </div>
            <div className="active-study__body">
              <div className="active-study__meta">
                <span>Section 4.2</span>
                <span>14 of 50</span>
              </div>
              <p>
                Referring to the diagram above: What is the minimum required
                liquid seal depth for a standard P-trap fixture in a residential
                drainage system according to the Uniform Plumbing Code?
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="active-study__footer">
        <div className="active-study__voice">
          <div className="active-study__glow" aria-hidden="true" />
          <button type="button" className="active-study__mic">
            <span className="material-symbols-outlined">mic</span>
            Hold to Talk
            <span className="active-study__texture" aria-hidden="true" />
          </button>
        </div>
        <div className="active-study__actions">
          <button type="button">Reveal Answer</button>
          <button type="button">
            Skip <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
