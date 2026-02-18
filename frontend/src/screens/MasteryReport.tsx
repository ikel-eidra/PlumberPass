import "../styles/mastery-report.css";

type MasteryReportProps = {
  onBack: () => void;
};

export default function MasteryReport({ onBack }: MasteryReportProps) {
  return (
    <div className="mastery-report">
      <header className="mastery-report__topbar">
        <button
          className="mastery-report__icon"
          type="button"
          aria-label="Back"
          onClick={onBack}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <p className="mastery-report__brand">PlumberPass</p>
        <button className="mastery-report__icon" type="button" aria-label="Profile">
          <span className="material-symbols-outlined">person</span>
        </button>
      </header>

      <section className="mastery-report__hero">
        <h1>Mastery Report</h1>
        <div className="mastery-report__meta">
          <span>Vol. 14</span>
          <span>Oct 24, 2023</span>
          <span>Candidate J. Doe</span>
        </div>
      </section>

      <section className="mastery-report__overview">
        <div className="mastery-report__overview-header">
          <h2>System Overview</h2>
          <span>75% Proficiency</span>
        </div>
        <div className="mastery-report__panel">
          <div className="mastery-report__panel-visual" />
          <div className="mastery-report__panel-quote">
            <p>
              “You are nearing expert proficiency in Flow Dynamics. The valve is
              nearly open.”
            </p>
          </div>
        </div>
      </section>

      <section className="mastery-report__dispatch">
        <div className="mastery-report__section-head">
          <h2>Weekly Dispatch</h2>
          <span>Week 42</span>
        </div>
        <div className="mastery-report__dispatch-card">
          <div className="mastery-report__streak">
            <span>Streak</span>
            <strong>07</strong>
            <p>Days</p>
          </div>
          <div>
            <h3>Path of the Master</h3>
            <p>
              Your consistent study habits have earned the Apprentice Badge.
            </p>
          </div>
        </div>
      </section>

      <section className="mastery-report__topics">
        <div className="mastery-report__section-head">
          <h2>Topic Breakdown</h2>
          <button type="button">View All</button>
        </div>
        <div className="mastery-report__topic-card">
          <div className="mastery-report__topic-icon">
            <span className="material-symbols-outlined">plumbing</span>
          </div>
          <div className="mastery-report__topic-body">
            <div className="mastery-report__topic-title">
              <h3>Residential Codes</h3>
              <span>92%</span>
            </div>
            <div className="mastery-report__bar">
              <span style={{ width: "92%" }} />
            </div>
            <p>IPC Chapter 3-6 • Recent focus: Venting</p>
          </div>
        </div>
        <div className="mastery-report__topic-card">
          <div className="mastery-report__topic-icon">
            <span className="material-symbols-outlined">water_drop</span>
          </div>
          <div className="mastery-report__topic-body">
            <div className="mastery-report__topic-title">
              <h3>Hydraulics &amp; Drainage</h3>
              <span>45%</span>
            </div>
            <div className="mastery-report__bar">
              <span style={{ width: "45%" }} />
            </div>
            <p>Flow Rates • Recent focus: Slope calc</p>
          </div>
        </div>
        <div className="mastery-report__topic-card">
          <div className="mastery-report__topic-icon">
            <span className="material-symbols-outlined">architecture</span>
          </div>
          <div className="mastery-report__topic-body">
            <div className="mastery-report__topic-title">
              <h3>Isometrics</h3>
              <span>12%</span>
            </div>
            <div className="mastery-report__bar">
              <span style={{ width: "12%" }} />
            </div>
            <p>Plan Reading • Needs attention</p>
          </div>
        </div>
      </section>

      <footer className="mastery-report__footer">
        <button type="button">Try “Review Drainage”</button>
        <button className="mastery-report__fab" type="button" aria-label="Voice">
          <span className="material-symbols-outlined">mic</span>
        </button>
      </footer>
    </div>
  );
}
