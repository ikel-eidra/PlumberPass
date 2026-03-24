import { Capacitor } from "@capacitor/core";

export type SubscriptionTier = "free" | "premium";

export type PremiumGate = "mock" | "visual" | "premium";

export type BillingConfig = {
  provider: string;
  checkout_ready: boolean;
  webhook_ready: boolean;
  prototype_unlock_enabled: boolean;
  billing_model: string;
  plan_label: string;
  plan_summary: string;
  price_label: string;
  currency: string;
  unit_amount: number;
  premium_url: string;
  payments_now: string[];
  payments_planned: string[];
  payments_deferred: string[];
};

export type BillingEntitlement = {
  device_id: string;
  tier: SubscriptionTier;
  premium_active: boolean;
  source: string | null;
  granted_at: string | null;
  checkout_session_id: string | null;
  checkout_ready: boolean;
};

export type BillingSessionVerifyResponse = BillingEntitlement & {
  session_id: string;
  session_status: string | null;
  payment_status: string | null;
  granted_via: string | null;
};

export const COMMERCE_CONFIG = {
  checkoutReady: false,
  nativeBetaPremiumOverride: true,
  premiumUrl: "https://plumberpass.futoltech.com",
  paymentsNow: ["Debit card", "Credit card"],
  paymentsPlanned: ["GCash"],
  paymentsDeferred: ["USDT"],
  freePlan: {
    id: "free" as const,
    label: "Freemium",
    priceLabel: "Free",
    summary: "Core audio review and weak-spot repetition.",
    features: [
      "Voice Sprint study mode",
      "Error Replay and mistake tracking",
      "Dashboard and readiness view",
      "Core reviewer access for daily practice",
    ],
  },
  premiumPlan: {
    id: "premium" as const,
    label: "Premium",
    priceLabel: "Paid",
    summary: "Full exam prep with premium drills and pressure runs.",
    features: [
      "Timed Mock Exam mode",
      "Figure Drill visual review bank",
      "Future paid releases and cycle updates",
      "Full premium reviewer positioning for launch",
    ],
  },
  gateCopy: {
    mock: "Mock Exam is part of Premium because it is the pressure-test mode for full exam simulation.",
    visual: "Figure Drill is part of Premium because it uses the premium illustrated review bank.",
    premium: "Premium unlocks the full paid reviewer experience beyond the freemium core.",
  },
};

export const buildFallbackBillingConfig = (): BillingConfig => ({
  provider: "stripe_checkout",
  checkout_ready: COMMERCE_CONFIG.checkoutReady,
  webhook_ready: false,
  prototype_unlock_enabled: !COMMERCE_CONFIG.checkoutReady,
  billing_model: "one_time_unlock",
  plan_label: COMMERCE_CONFIG.premiumPlan.label,
  plan_summary: COMMERCE_CONFIG.premiumPlan.summary,
  price_label: COMMERCE_CONFIG.premiumPlan.priceLabel,
  currency: "php",
  unit_amount: 0,
  premium_url: COMMERCE_CONFIG.premiumUrl,
  payments_now: COMMERCE_CONFIG.paymentsNow,
  payments_planned: COMMERCE_CONFIG.paymentsPlanned,
  payments_deferred: COMMERCE_CONFIG.paymentsDeferred,
});

export const isNativeBetaPremiumOverrideEnabled = () =>
  COMMERCE_CONFIG.nativeBetaPremiumOverride && Capacitor.isNativePlatform();

export const buildFreeEntitlement = (deviceId: string): BillingEntitlement => ({
  device_id: deviceId,
  tier: "free",
  premium_active: false,
  source: null,
  granted_at: null,
  checkout_session_id: null,
  checkout_ready: COMMERCE_CONFIG.checkoutReady,
});

export const buildNativeBetaPremiumEntitlement = (deviceId: string): BillingEntitlement => ({
  device_id: deviceId,
  tier: "premium",
  premium_active: true,
  source: "native_beta_override",
  granted_at: new Date().toISOString(),
  checkout_session_id: null,
  checkout_ready: COMMERCE_CONFIG.checkoutReady,
});
