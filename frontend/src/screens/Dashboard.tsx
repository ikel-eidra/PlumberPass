import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <div className="dashboard__avatar">
            <img
              alt="Profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrrkEJRDyKwE0ekWRRaCn88luvL3kCkN_g63uYSljBTf8qEh7QRBZUT62UcR6nlI7Y8D9T_1aDC14wfgylK2zZcHbkz6lAm3FxrjYQ1qYUDkryb5uXzOvrY4M0bH3quFdIuRrXv0bYqoSWHfutOlMUR12GW0I3aFNInbrFK8wjXeCyZm4Kdv0CXoqvk1QfHEDc06gppHco9jySbNb3eiEeuigDAhj7WSotMFmeB6RCfl0chbN0068xSZzp0Veg090o_BFhZ8MJUBc"
            />
          </div>
          <div>
            <p className="dashboard__welcome">Welcome back</p>
            <h1>Good Morning, Alex</h1>
          </div>
        </div>
        <button className="dashboard__icon-button" type="button">
          <span className="material-symbols-outlined">notifications</span>
          <span className="dashboard__notification-dot" aria-hidden="true"></span>
        </button>
      </header>

      <section className="dashboard__readiness">
        <div className="dashboard__ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" className="dashboard__ring-bg" />
            <circle cx="50" cy="50" r="42" className="dashboard__ring-progress" />
            <defs>
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0d7ff2" />
                <stop offset="100%" stopColor="#00f2fe" />
              </linearGradient>
            </defs>
          </svg>
          <div className="dashboard__ring-content">
            <span>85%</span>
            <p>Exam Readiness</p>
          </div>
        </div>
      </section>

      <section className="dashboard__card">
        <div className="dashboard__card-header">
          <div>
            <p>Today's Focus</p>
            <h2>Hydronic Heating Systems</h2>
            <span>Module 4 • Ventilation &amp; Flow</span>
          </div>
          <button type="button" className="dashboard__play">
            <span className="material-symbols-outlined">play_arrow</span>
          </button>
        </div>
        <div className="dashboard__progress">
          <div>
            <span>Daily Progress</span>
            <span className="dashboard__accent">20 mins remaining</span>
          </div>
          <div className="dashboard__progress-bar">
            <span style={{ width: "65%" }} />
          </div>
        </div>
      </section>

      <section className="dashboard__quick-grid">
        <button type="button">
          <span className="material-symbols-outlined">style</span>
          Flashcards
        </button>
        <button type="button">
          <span className="material-symbols-outlined">quiz</span>
          Mock Exam
        </button>
        <button type="button">
          <span className="material-symbols-outlined">graphic_eq</span>
          Voice Review
        </button>
      </section>

      <section className="dashboard__insights">
        <article>
          <p>Weakest Topic</p>
          <h3>Pipe Sizing</h3>
          <span>
            <span className="material-symbols-outlined">warning</span>
            Needs review
          </span>
        </article>
        <article>
          <p>Current Streak</p>
          <h3>12 Days</h3>
          <span>
            <span className="material-symbols-outlined">local_fire_department</span>
            On fire!
          </span>
        </article>
      </section>

      <section className="dashboard__commute">
        <button type="button">
          <span className="material-symbols-outlined">headphones</span>
          <div>
            <strong>Commute Mode</strong>
            <span>Hands-free voice study</span>
          </div>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </section>
    </div>
  );
}
