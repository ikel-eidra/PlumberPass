import UiIcon from "../components/UiIcon";
import ThemeToggle, { type UiTheme } from "../components/ThemeToggle";
import { APP_BRAND } from "../config/brand";
import {
  COMMERCE_CONFIG,
  type BillingConfig,
  type PremiumGate,
  type SubscriptionTier,
} from "../config/commerce";
import "../styles/upgrade-screen.css";

type UpgradeScreenProps = {
  theme: UiTheme;
  onThemeChange: (theme: UiTheme) => void;
  onBack: () => void;
  onStartCheckout: () => void;
  onRefreshEntitlement: () => void;
  onPrototypeUnlock: () => void;
  currentTier: SubscriptionTier;
  gate: PremiumGate;
  billingConfig: BillingConfig;
  checkoutMessage: string | null;
  checkoutError: string | null;
  isStartingCheckout: boolean;
};

export default function UpgradeScreen({
  theme,
  onThemeChange,
  onBack,
  onStartCheckout,
  onRefreshEntitlement,
  onPrototypeUnlock,
  currentTier,
  gate,
  billingConfig,
  checkoutMessage,
  checkoutError,
  isStartingCheckout,
}: UpgradeScreenProps) {
  const currentPlan =
    currentTier === "premium" ? COMMERCE_CONFIG.premiumPlan : COMMERCE_CONFIG.freePlan;

  return (
    <div className="upgrade-screen">
      <header className="upgrade-screen__topbar">
        <button type="button" className="upgrade-screen__icon" aria-label="Back" onClick={onBack}>
          <UiIcon name="arrowLeft" size={18} />
        </button>
        <p className="upgrade-screen__brand">{APP_BRAND.name}</p>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
        <span className="upgrade-screen__tier">{currentPlan.label}</span>
      </header>

      <section className="upgrade-screen__hero">
        <p className="upgrade-screen__eyebrow">{APP_BRAND.examFocus}</p>
        <h1>Premium unlock path</h1>
        <p>{COMMERCE_CONFIG.gateCopy[gate]}</p>
        <div className="upgrade-screen__hero-pills">
          <span>{APP_BRAND.creatorCompany}</span>
          <span>{APP_BRAND.jurisdiction}</span>
          <span>{APP_BRAND.websiteLabel}</span>
        </div>
      </section>

      <section className="upgrade-screen__plans">
        <article className="upgrade-card upgrade-card--free">
          <p>Current free path</p>
          <h2>{COMMERCE_CONFIG.freePlan.label}</h2>
          <strong>{COMMERCE_CONFIG.freePlan.priceLabel}</strong>
          <span>{COMMERCE_CONFIG.freePlan.summary}</span>
          <ul>
            {COMMERCE_CONFIG.freePlan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </article>

        <article className="upgrade-card upgrade-card--premium">
          <p>Paid version</p>
          <h2>{COMMERCE_CONFIG.premiumPlan.label}</h2>
          <strong>{billingConfig.price_label}</strong>
          <span>{COMMERCE_CONFIG.premiumPlan.summary}</span>
          <ul>
            {COMMERCE_CONFIG.premiumPlan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="upgrade-screen__payments">
        <div className="upgrade-screen__section-head">
          <h2>Payment rollout</h2>
          <span>{billingConfig.checkout_ready ? "Checkout ready" : "Cards first"}</span>
        </div>
        <div className="upgrade-screen__payment-grid">
          <article>
            <p>Planned now</p>
            <strong>{billingConfig.payments_now.join(" • ")}</strong>
            <span>
              {billingConfig.checkout_ready
                ? "Stripe-hosted card checkout is active for the paid unlock path."
                : "Stripe-backed card checkout is the primary paid path for v1."}
            </span>
          </article>
          <article>
            <p>Later</p>
            <strong>{billingConfig.payments_planned.join(" • ")}</strong>
            <span>GCash is still outside the current live implementation.</span>
          </article>
          <article>
            <p>Not in v1</p>
            <strong>{billingConfig.payments_deferred.join(" • ")}</strong>
            <span>Crypto is deferred until after the launch-critical billing path is stable.</span>
          </article>
        </div>
      </section>

      {checkoutMessage ? (
        <div className="upgrade-screen__status upgrade-screen__status--success">{checkoutMessage}</div>
      ) : null}
      {checkoutError ? (
        <div className="upgrade-screen__status upgrade-screen__status--error">{checkoutError}</div>
      ) : null}

      <footer className="upgrade-screen__footer">
        <a
          href={billingConfig.premium_url || COMMERCE_CONFIG.premiumUrl}
          target="_blank"
          rel="noreferrer"
          className="upgrade-screen__primary"
        >
          Open premium website
        </a>
        {billingConfig.checkout_ready ? (
          <button
            type="button"
            className="upgrade-screen__primary upgrade-screen__primary-button"
            onClick={onStartCheckout}
            disabled={isStartingCheckout}
          >
            {isStartingCheckout ? "Redirecting to Stripe..." : "Unlock with card"}
          </button>
        ) : null}
        <button type="button" className="upgrade-screen__ghost" onClick={onRefreshEntitlement}>
          Refresh premium status
        </button>
        {!billingConfig.checkout_ready ? (
          <button type="button" className="upgrade-screen__ghost" onClick={onPrototypeUnlock}>
            Internal prototype unlock
          </button>
        ) : null}
        <button type="button" className="upgrade-screen__ghost" onClick={onBack}>
          Continue with free plan
        </button>
      </footer>
    </div>
  );
}
