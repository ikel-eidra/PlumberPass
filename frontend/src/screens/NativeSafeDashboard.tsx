import ThemeToggle, { type UiTheme } from "../components/ThemeToggle";
import { APP_BRAND } from "../config/brand";
import type { SubscriptionTier } from "../config/commerce";
import "../styles/native-safe-dashboard.css";

type NativeSafeDashboardProps = {
  theme: UiTheme;
  onThemeChange: (theme: UiTheme) => void;
  onOpenSettings: () => void;
  onStartSession: () => void;
  onStartRecallLab: () => void;
  onStartMockExam: () => void;
  onStartVisualReview: () => void;
  onViewReport: () => void;
  onViewMistakes: () => void;
  onOpenUpgrade: () => void;
  subscriptionTier: SubscriptionTier;
  questionCount: number;
  mockQuestionCount: number;
  flashcardCount: number;
  identificationCount: number;
  visualReviewCount: number;
  dueCount: number;
  accuracy: number;
  daysToExam: number;
};

export default function NativeSafeDashboard({
  theme,
  onThemeChange,
  onOpenSettings,
  onStartSession,
  onStartRecallLab,
  onStartMockExam,
  onStartVisualReview,
  onViewReport,
  onViewMistakes,
  onOpenUpgrade,
  subscriptionTier,
  questionCount,
  mockQuestionCount,
  flashcardCount,
  identificationCount,
  visualReviewCount,
  dueCount,
  accuracy,
  daysToExam,
}: NativeSafeDashboardProps) {
  return (
    <div className="native-safe-dashboard">
      <header className="native-safe-dashboard__header">
        <div>
          <p className="native-safe-dashboard__eyebrow">{APP_BRAND.name}</p>
          <h1>Android Safe Mode</h1>
          <span className="native-safe-dashboard__subline">
            Simplified runtime while we harden the full phone build.
          </span>
        </div>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </header>

      <section className="native-safe-dashboard__card">
        <strong>{daysToExam} days left</strong>
        <span>{dueCount} due now • {accuracy}% accuracy</span>
        <p>
          Use this stripped-down dashboard first. If this screen stays stable, the next issues are
          likely in the heavier Android UI path rather than the core study engine.
        </p>
      </section>

      <section className="native-safe-dashboard__stats">
        <article>
          <strong>{questionCount}</strong>
          <span>Study MCQs</span>
        </article>
        <article>
          <strong>{mockQuestionCount}</strong>
          <span>Mock items</span>
        </article>
        <article>
          <strong>{flashcardCount + identificationCount}</strong>
          <span>Recall prompts</span>
        </article>
        <article>
          <strong>{visualReviewCount}</strong>
          <span>Visual cards</span>
        </article>
      </section>

      <section className="native-safe-dashboard__actions">
        <button type="button" onClick={onStartSession}>Open Review</button>
        <button type="button" onClick={onStartRecallLab}>Open Recall Lab</button>
        <button type="button" onClick={onViewMistakes}>Open Mistakes</button>
        <button type="button" onClick={onViewReport}>Open Readiness</button>
        <button type="button" onClick={onOpenSettings}>Open Settings</button>
        {subscriptionTier === "premium" ? (
          <>
            <button type="button" onClick={onStartMockExam}>Open Mock Exam</button>
            <button type="button" onClick={onStartVisualReview}>Open Figure Drill</button>
          </>
        ) : (
          <button type="button" onClick={onOpenUpgrade}>Open Premium Screen</button>
        )}
      </section>

      <section className="native-safe-dashboard__note">
        <p>Voice note</p>
        <span>
          In this safe pass, Android auto-read is reduced. Start with tap answers first, then test
          voice manually from Review or Settings.
        </span>
      </section>
    </div>
  );
}
