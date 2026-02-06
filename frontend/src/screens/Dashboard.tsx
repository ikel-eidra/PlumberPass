import "../styles/dashboard.css";

type DashboardProps = {
  onStartSession: () => void;
  onViewReport: () => void;
  onViewMistakes: () => void;
};

export default function Dashboard({
  onStartSession,
  onViewReport,
  onViewMistakes
}: DashboardProps) {
  return (
    <div className="dashboard-vintage">
      <header className="dashboard-topbar">
        <div className="dashboard-topbar__slot">
          <button className="icon-button" type="button" aria-label="Open menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
        <h1 className="dashboard-title">PlumberPass</h1>
        <div className="dashboard-topbar__slot dashboard-topbar__slot--end">
          <button className="icon-button" type="button" aria-label="Settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      <section className="dashboard-greeting">
        <h2>
          Good Morning,
          <span>Apprentice.</span>
        </h2>
        <p>Tuesday, Oct 24 • Exam in 14 Days</p>
      </section>

      <section className="dashboard-gauge">
        <div className="gauge-shell">
          <span className="gauge-screw gauge-screw--top" />
          <span className="gauge-screw gauge-screw--bottom" />
          <span className="gauge-screw gauge-screw--left" />
          <span className="gauge-screw gauge-screw--right" />
          <div className="gauge-face">
            <div className="gauge-ticks">
              <span className="tick tick-major tick-major--vertical" />
              <span className="tick tick-major tick-major--horizontal" />
              <span className="tick tick-minor tick-minor--30" />
              <span className="tick tick-minor tick-minor--60" />
              <span className="tick tick-minor tick-minor--120" />
              <span className="tick tick-minor tick-minor--150" />
            </div>
            <p className="gauge-label">Pressure Level</p>
            <div className="gauge-metric">
              <div>
                <strong>85</strong>
                <span>%</span>
              </div>
              <p>Daily Goal</p>
            </div>
            <div className="gauge-needle" aria-hidden="true">
              <span className="gauge-needle__pin" />
              <span className="gauge-needle__arm" />
              <span className="gauge-needle__weight" />
            </div>
            <span className="gauge-cap" />
            <span className="gauge-glass" aria-hidden="true" />
          </div>
        </div>
        <div className="gauge-footer">
          <span className="material-symbols-outlined">local_fire_department</span>
          <span>14 Day Streak</span>
        </div>
      </section>

      <section className="dashboard-stories">
        <div className="stories-header">
          <h3>Feature Stories</h3>
          <button type="button">View All</button>
        </div>

        <article className="story-card">
          <div className="story-card__media story-card__media--session">
            <span className="story-card__tag">In Progress</span>
          </div>
          <div className="story-card__body">
            <span className="story-card__eyebrow">Module 04 • Hydraulics</span>
            <h4>Mastering Vents &amp; Drains</h4>
            <p>
              An in-depth look at the hydraulic principles behind effective
              residential drainage systems and trap seals.
            </p>
            <button type="button" className="story-card__primary">
              Continue Session
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button type="button" className="story-card__secondary" onClick={onViewMistakes}>
              Mistake Library
            </button>
          </div>
        </article>

        <article className="story-card">
          <div className="story-card__media story-card__media--exam" />
          <div className="story-card__body">
            <span className="story-card__eyebrow">Mock Inspection</span>
            <h4>The Pressure Test</h4>
            <p>
              Simulate the real exam environment. 50 questions, 60 minutes. Can
              you handle the heat?
            </p>
            <div className="story-card__actions">
              <button type="button" className="story-card__secondary">
                Start Exam
              </button>
              <button type="button" className="story-card__ghost" onClick={onStartSession}>
                Start Study
              </button>
              <button type="button" className="story-card__ghost" onClick={onViewReport}>
                View Report
              </button>
            </div>
          </div>
        </article>
      </section>

      <nav className="dashboard-nav">
        <button type="button" className="dashboard-nav__item is-active">
          <span className="material-symbols-outlined">home</span>
          <span>Home</span>
        </button>
        <button type="button" className="dashboard-nav__item">
          <span className="material-symbols-outlined">menu_book</span>
          <span>Library</span>
        </button>
        <div className="dashboard-nav__fab">
          <button type="button" aria-label="Voice Mode">
            <span className="material-symbols-outlined">mic</span>
          </button>
          <span>Voice Mode</span>
        </div>
        <button type="button" className="dashboard-nav__item">
          <span className="material-symbols-outlined">bar_chart</span>
          <span>Stats</span>
        </button>
        <button type="button" className="dashboard-nav__item">
          <span className="material-symbols-outlined">person</span>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
