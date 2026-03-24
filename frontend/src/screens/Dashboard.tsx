import type { CSSProperties } from "react";
import { LIVE_MCQ_TARGET, buildLaunchChecklist } from "../config/launchChecklist";
import { MASTER_PLUMBER_EXAM } from "../config/examBlueprint";
import { APP_BRAND } from "../config/brand";
import type { SubscriptionTier } from "../config/commerce";
import ThemeToggle, { type UiTheme } from "../components/ThemeToggle";
import UiIcon from "../components/UiIcon";
import "../styles/dashboard.css";

type DashboardProps = {
  theme: UiTheme;
  onThemeChange: (theme: UiTheme) => void;
  onOpenSettings: () => void;
  onStartSession: () => void;
  onStartMockExam: () => void;
  onStartRecallLab: () => void;
  onStartVisualReview: () => void;
  onViewReport: () => void;
  onViewMistakes: () => void;
  onOpenUpgrade: () => void;
  subscriptionTier: SubscriptionTier;
  examWindowLabel?: string;
  questionCount?: number;
  mockQuestionCount?: number;
  flashcardCount?: number;
  identificationCount?: number;
  visualReviewCount?: number;
  dueCount?: number;
  readiness?: number;
  accuracy?: number;
  streakDays?: number;
  reviewedToday?: number;
  daysToExam?: number;
};

export default function Dashboard({
  theme,
  onThemeChange,
  onOpenSettings,
  onStartSession,
  onStartMockExam,
  onStartRecallLab,
  onStartVisualReview,
  onViewReport,
  onViewMistakes,
  onOpenUpgrade,
  subscriptionTier,
  examWindowLabel = MASTER_PLUMBER_EXAM.examWindowLabel,
  questionCount = 0,
  mockQuestionCount = 0,
  flashcardCount = 0,
  identificationCount = 0,
  visualReviewCount = 0,
  dueCount = 0,
  readiness = 0,
  accuracy = 0,
  streakDays = 0,
  reviewedToday = 0,
  daysToExam = 0,
}: DashboardProps) {
  const checklist = buildLaunchChecklist({
    questionCount,
    mockQuestionCount,
    flashcardCount,
    identificationCount,
    visualReviewCount,
  });
  const currentGate = checklist.find((item) => item.status !== "done") ?? checklist[checklist.length - 1];
  const contentProgress = Math.min(100, Math.round((questionCount / LIVE_MCQ_TARGET) * 100));
  const subjectBlueprint = MASTER_PLUMBER_EXAM.subjects;

  return (
    <div className="dashboard-mobile">
      <header className="dashboard-mobile__topbar">
        <div>
          <p className="dashboard-mobile__eyebrow">{APP_BRAND.name}</p>
          <h1>Reviewer Home</h1>
          <span className="dashboard-mobile__subline">
            {APP_BRAND.examFocus} • {APP_BRAND.jurisdiction}
          </span>
          <a className="dashboard-mobile__creator" href={APP_BRAND.website} target="_blank" rel="noreferrer">
            {APP_BRAND.creatorCompany} • {APP_BRAND.websiteLabel}
          </a>
          <span className="dashboard-mobile__plan-pill">
            {subscriptionTier === "premium" ? "Premium active" : "Freemium active"}
          </span>
        </div>
        <div className="dashboard-mobile__topbar-tools">
          <button type="button" className="dashboard-mobile__settings-button" onClick={onOpenSettings}>
            <UiIcon name="settings" size={16} />
            Settings
          </button>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
          <div className="dashboard-mobile__countdown">
            <span>{examWindowLabel}</span>
            <strong>{daysToExam}</strong>
            <em>days left</em>
          </div>
        </div>
      </header>

      <section className="dashboard-mobile__hero">
        <div className="dashboard-mobile__hero-copy">
          <p className="dashboard-mobile__tag">Today&apos;s mission</p>
          <h2>Clear the due queue. Then drill mixed-topic recall.</h2>
          <p>
            Start with the spoken loop, then switch to figure or recall drills when
            you need precision work on weak spots.
          </p>
          <div className="dashboard-mobile__hero-meta">
            <span>{dueCount} due right now</span>
            <span>{accuracy}% answer accuracy</span>
            <span>{streakDays} day streak</span>
          </div>
          <div className="dashboard-mobile__hero-actions">
            <button type="button" className="dashboard-mobile__primary" onClick={onStartSession}>
              <UiIcon name="playCircle" size={20} />
              Start Voice Sprint
            </button>
            <button type="button" className="dashboard-mobile__hero-ghost" onClick={onViewMistakes}>
              <UiIcon name="warning" size={18} />
              Open Error Replay
            </button>
          </div>
        </div>
        <div className="dashboard-mobile__mission-card">
          <div className="dashboard-mobile__mission-head">
            <span>Exam readiness</span>
            <strong>{readiness}%</strong>
            <p>{reviewedToday} answers logged today</p>
          </div>
          <div className="dashboard-mobile__mission-grid">
            <div
              className="dashboard-mobile__dial"
              style={{ "--dial-progress": `${Math.max(8, readiness)}%` } as CSSProperties}
              aria-hidden="true"
            >
              <span>{readiness}%</span>
              <small>ready</small>
            </div>
            <div className="dashboard-mobile__mission-metrics">
              <article>
                <span>Due now</span>
                <strong>{dueCount}</strong>
              </article>
              <article>
                <span>Today</span>
                <strong>{reviewedToday}</strong>
              </article>
              <article>
                <span>Accuracy</span>
                <strong>{accuracy}%</strong>
              </article>
              <article>
                <span>Exam clock</span>
                <strong>{daysToExam}d</strong>
              </article>
            </div>
          </div>
          <div className="dashboard-mobile__mission-pill-row">
            <span>Voice-first</span>
            <span>Offline bundle ready</span>
            <span>{questionCount} live MCQs</span>
          </div>
        </div>
      </section>

      <section className="dashboard-mobile__quick-grid">
        <button type="button" className="quick-card quick-card--recall" onClick={onStartRecallLab}>
          <div className="quick-card__icon">
            <UiIcon name="brain" size={22} />
          </div>
          <p>Recall Lab</p>
          <h3>{flashcardCount + identificationCount} support prompts</h3>
          <span>Flashcards and direct-answer drills for rapid retrieval work.</span>
        </button>
        <button type="button" className="quick-card quick-card--visual" onClick={onStartVisualReview}>
          <span className="quick-card__pill">Premium</span>
          <div className="quick-card__icon">
            <UiIcon name="image" size={22} />
          </div>
          <p>Figure Drill</p>
          <h3>{visualReviewCount} visual cards</h3>
          <span>Illustrated code details, fixture layouts, and technical diagrams.</span>
        </button>
        <button type="button" className="quick-card quick-card--mock" onClick={onStartMockExam}>
          <span className="quick-card__pill">Premium</span>
          <div className="quick-card__icon">
            <UiIcon name="timer" size={22} />
          </div>
          <p>Mock Exam</p>
          <h3>{mockQuestionCount} timed items</h3>
          <span>Pressure-test pacing and subject switching under exam conditions.</span>
        </button>
        <button type="button" className="quick-card quick-card--report" onClick={onViewReport}>
          <div className="quick-card__icon">
            <UiIcon name="chart" size={22} />
          </div>
          <p>Readiness</p>
          <h3>{questionCount} live MCQs</h3>
          <span>Track coverage, accuracy, and the next weak topic to attack.</span>
        </button>
        {subscriptionTier !== "premium" ? (
          <button type="button" className="quick-card quick-card--upgrade" onClick={onOpenUpgrade}>
            <div className="quick-card__icon">
              <UiIcon name="chart" size={22} />
            </div>
            <p>Upgrade</p>
            <h3>Unlock Premium</h3>
            <span>Move from freemium into mock exams and the visual reviewer.</span>
          </button>
        ) : null}
      </section>

      <section className="dashboard-mobile__exam-map">
        <div className="dashboard-mobile__section-head">
          <h3>Exam Blueprint</h3>
          <span className="dashboard-mobile__section-badge">Official weighting</span>
        </div>
        <div className="dashboard-mobile__blueprint-grid">
          {subjectBlueprint.map((subject) => (
            <article key={subject.name} className="blueprint-card">
              <span>{subject.examDay}</span>
              <strong>{subject.weight}%</strong>
              <p>{subject.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-mobile__checklist">
        <div className="dashboard-mobile__section-head">
          <h3>Build Status</h3>
          <span className="dashboard-mobile__section-badge">{currentGate.title}</span>
        </div>
        <div className="dashboard-mobile__checklist-bar" aria-hidden="true">
          <span style={{ width: `${Math.max(18, contentProgress)}%` }} />
        </div>
        <div className="dashboard-mobile__checklist-meta">
          <span>Current hard gate: {currentGate.id.toUpperCase()}</span>
          <span>{questionCount}/{LIVE_MCQ_TARGET} live MCQs toward launch target</span>
        </div>
        <div className="dashboard-mobile__checklist-items">
          {checklist.map((item) => (
            <article key={item.id} className={`checklist-card checklist-card--${item.status}`}>
              <div className="checklist-card__header">
                <p>{item.id.toUpperCase()}</p>
                <span>{item.status === "done" ? "Done" : item.status === "in_progress" ? "In Progress" : "Pending"}</span>
              </div>
              <h4>{item.title}</h4>
              <strong>{item.summary}</strong>
              <span>{item.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-mobile__loop">
        <div className="dashboard-mobile__section-head">
          <h3>Training Modes</h3>
          <button type="button" onClick={onViewReport}>
            Readiness View
          </button>
        </div>
        <div className="dashboard-mobile__pill-row">
          <span>Retrieval Practice</span>
          <span>Corrective Feedback</span>
          <span>Spaced Replay</span>
        </div>
        <div className="dashboard-mobile__cards">
          <button type="button" className="dashboard-card dashboard-card--voice" onClick={onStartSession}>
            <div className="dashboard-card__icon">
              <UiIcon name="waveform" size={22} />
            </div>
            <p>Voice Sprint</p>
            <h4>Hands-free burst review</h4>
            <span>Hit due cards first, then new mixed-topic questions.</span>
            <strong>{dueCount} prompts already waiting in the loop</strong>
          </button>
          <button type="button" className="dashboard-card dashboard-card--mistakes" onClick={onViewMistakes}>
            <div className="dashboard-card__icon">
              <UiIcon name="flame" size={22} />
            </div>
            <p>Error Replay</p>
            <h4>Hammer weak spots</h4>
            <span>Loop your misses until the right answer becomes automatic.</span>
            <strong>Best when your recall is close but still noisy</strong>
          </button>
          <button type="button" className="dashboard-card dashboard-card--recall" onClick={onStartRecallLab}>
            <div className="dashboard-card__icon">
              <UiIcon name="brain" size={22} />
            </div>
            <p>Recall Lab</p>
            <h4>Use all the fast-recall items</h4>
            <span>Run flashcards and identification prompts in one audio-driven stream.</span>
            <strong>{flashcardCount + identificationCount} support items ready</strong>
          </button>
          <button type="button" className="dashboard-card dashboard-card--visual" onClick={onStartVisualReview}>
            <div className="dashboard-card__icon">
              <UiIcon name="imageSearch" size={22} />
            </div>
            <p>Figure Drill</p>
            <h4>Train with illustrated review cards</h4>
            <span>Use rendered diagrams, fixture details, and code visuals in a dedicated screen-first loop.</span>
            <strong>{visualReviewCount} visual cards currently published</strong>
          </button>
        </div>
      </section>

      <nav className="dashboard-mobile__nav">
        <button type="button" className="is-active">
          <UiIcon name="home" size={18} />
          Home
        </button>
        <button type="button" onClick={onViewMistakes}>
          <UiIcon name="warning" size={18} />
          Mistakes
        </button>
        <button type="button" className="dashboard-mobile__fab" onClick={onStartSession}>
          <UiIcon name="mic" size={20} />
        </button>
        <button type="button" onClick={onViewReport}>
          <UiIcon name="chart" size={18} />
          Readiness
        </button>
        <button type="button" onClick={onStartMockExam}>
          <UiIcon name="timer" size={18} />
          Mock
        </button>
        <button type="button" onClick={onOpenSettings}>
          <UiIcon name="settings" size={18} />
          Settings
        </button>
      </nav>
    </div>
  );
}
