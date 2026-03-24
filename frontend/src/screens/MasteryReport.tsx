import type { StudyStats } from "../hooks/useStudyProgress";
import type { ExamSubjectBlueprint } from "../config/examBlueprint";
import { APP_BRAND } from "../config/brand";
import ThemeToggle, { type UiTheme } from "../components/ThemeToggle";
import UiIcon from "../components/UiIcon";
import "../styles/mastery-report.css";

type MasteryReportProps = {
  theme: UiTheme;
  onThemeChange: (theme: UiTheme) => void;
  onBack: () => void;
  onStartVoiceReview: () => void;
  onFocusWeakestTopic: () => void;
  onOpenMistakes: () => void;
  daysToExam: number;
  stats: StudyStats;
  examWindowLabel: string;
  applicationDeadline: string;
  subjects: ExamSubjectBlueprint[];
};

const getReadinessMessage = (readiness: number) => {
  if (readiness >= 80) {
    return "Your review pattern is strong. Keep pressure-testing weak spots and mock timing.";
  }
  if (readiness >= 55) {
    return "Foundation is forming. The fastest gains are now in due cards and repeated mistakes.";
  }
  return "The biggest gains are still ahead. Prioritize daily voice sprints and weak-topic repetition.";
};

export default function MasteryReport({
  theme,
  onThemeChange,
  onBack,
  onStartVoiceReview,
  onFocusWeakestTopic,
  onOpenMistakes,
  daysToExam,
  stats,
  examWindowLabel,
  applicationDeadline,
  subjects,
}: MasteryReportProps) {
  const weakestTopic = stats.topicPerformance[0];
  const coachHeadline =
    stats.dueCount > 0
      ? "Start with the due queue, then zoom into the weakest topic."
      : "The queue is light, so use the weakest topic as your next pressure point.";

  return (
    <div className="mastery-report">
      <header className="mastery-report__topbar">
        <button
          className="mastery-report__icon"
          type="button"
          aria-label="Back"
          onClick={onBack}
        >
          <UiIcon name="arrowLeft" size={18} />
        </button>
        <p className="mastery-report__brand">{APP_BRAND.name}</p>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
        <button className="mastery-report__icon" type="button" aria-label="Voice review" onClick={onStartVoiceReview}>
          <UiIcon name="mic" size={18} />
        </button>
      </header>

      <section className="mastery-report__hero">
        <h1>Mastery Report</h1>
        <div className="mastery-report__meta">
          <span>{examWindowLabel}</span>
          <span>{daysToExam} days remaining</span>
          <span>{stats.reviewedToday} items answered today</span>
          <span>{APP_BRAND.examFocus} • {APP_BRAND.jurisdiction}</span>
        </div>
      </section>

      <section className="mastery-report__overview">
        <div className="mastery-report__overview-header">
          <h2>System Overview</h2>
          <span>{stats.readiness}% readiness</span>
        </div>
        <div className="mastery-report__panel">
          <div className="mastery-report__panel-visual" />
          <div className="mastery-report__panel-quote">
            <p>{getReadinessMessage(stats.readiness)}</p>
          </div>
        </div>
      </section>

      <section className="mastery-report__dispatch">
        <div className="mastery-report__section-head">
          <h2>Weekly Dispatch</h2>
          <span>Current cadence</span>
        </div>
        <div className="mastery-report__dispatch-card">
          <div className="mastery-report__streak">
            <span>Streak</span>
            <strong>{stats.streakDays}</strong>
            <p>Days</p>
          </div>
          <div>
            <h3>Pressure-ready habits</h3>
            <p>
              Accuracy is {stats.accuracy}% across {stats.totalAnswered} answered
              items. {stats.dueCount} items are due for replay now.
            </p>
          </div>
        </div>
      </section>

      <section className="mastery-report__coach">
        <div className="mastery-report__section-head">
          <h2>Coach Brief</h2>
          <span>Next best move</span>
        </div>
        <div className="mastery-report__coach-card">
          <div className="mastery-report__coach-copy">
            <h3>{coachHeadline}</h3>
            <p>
              {weakestTopic
                ? `${weakestTopic.topic} is currently the weakest live zone, with ${weakestTopic.due} due and ${weakestTopic.accuracy}% accuracy.`
                : "Run the due queue, then start mixed review while the bank is still fresh."}
            </p>
            <div className="mastery-report__coach-pills">
              <span>{stats.dueCount} due now</span>
              <span>{stats.reviewedToday} answered today</span>
              {weakestTopic ? <span>Next focus: {weakestTopic.nextFocus}</span> : null}
            </div>
          </div>
          <div className="mastery-report__coach-actions">
            <button type="button" onClick={onStartVoiceReview}>
              Due Sprint
            </button>
            <button type="button" onClick={onFocusWeakestTopic}>
              {weakestTopic ? `Focus ${weakestTopic.topic}` : "Open Mixed Review"}
            </button>
            <button type="button" className="mastery-report__ghost-button" onClick={onOpenMistakes}>
              Open Mistakes
            </button>
          </div>
        </div>
      </section>

      <section className="mastery-report__blueprint">
        <div className="mastery-report__section-head">
          <h2>Official Exam Blueprint</h2>
          <span>PRC-aligned</span>
        </div>
        <div className="mastery-report__blueprint-card">
          <p>
            Application deadline: <strong>{applicationDeadline}</strong>
          </p>
          <div className="mastery-report__blueprint-list">
            {subjects.map((subject) => (
              <article key={subject.name} className="mastery-report__blueprint-item">
                <div className="mastery-report__blueprint-top">
                  <div>
                    <h3>{subject.name}</h3>
                    <span>
                      {subject.examDay} · {subject.timeWindow}
                    </span>
                  </div>
                  <strong>{subject.weight}%</strong>
                </div>
                <div className="mastery-report__bar mastery-report__bar--blueprint">
                  <span style={{ width: `${subject.weight}%` }} />
                </div>
                <p>{subject.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mastery-report__topics">
        <div className="mastery-report__section-head">
          <h2>Topic Breakdown</h2>
          <button type="button">Focus Order</button>
        </div>
        {stats.topicPerformance.map((topic) => (
          <div key={topic.topic} className="mastery-report__topic-card">
            <div className="mastery-report__topic-icon">
              <UiIcon name="pipe" size={18} />
            </div>
            <div className="mastery-report__topic-body">
              <div className="mastery-report__topic-title">
                <h3>{topic.topic}</h3>
                <span>{topic.accuracy}%</span>
              </div>
              <div className="mastery-report__bar">
                <span style={{ width: `${topic.accuracy}%` }} />
              </div>
              <p>
                {topic.reviewed} reviews logged • {topic.due} due now • Next focus: {topic.nextFocus}
              </p>
            </div>
          </div>
        ))}
      </section>

      <footer className="mastery-report__footer">
        <button type="button" onClick={onStartVoiceReview}>Prioritize Due Cards</button>
        <button type="button" onClick={onFocusWeakestTopic}>
          {weakestTopic ? `Focus ${weakestTopic.topic}` : "Mixed Review"}
        </button>
        <button className="mastery-report__fab" type="button" aria-label="Voice" onClick={onStartVoiceReview}>
          <UiIcon name="mic" size={18} />
        </button>
      </footer>
    </div>
  );
}
