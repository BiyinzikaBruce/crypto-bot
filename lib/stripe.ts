import Stripe from "stripe";

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export const STRIPE_PRICES = {
  BASIC: process.env.STRIPE_PRICE_BASIC ?? "",
  PRO: process.env.STRIPE_PRICE_PRO ?? "",
} as const;

export const PLAN_NAMES: Record<string, string> = {
  FREE: "Free",
  BASIC: "Basic",
  PRO: "Pro",
};

export const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  BASIC: 29,
  PRO: 79,
};

export const PLAN_FEATURES: Record<string, string[]> = {
  FREE: ["Unlimited backtesting", "Strategy builder", "1 bot (stopped only)"],
  BASIC: ["Everything in Free", "1 live trading bot", "Telegram notifications", "Email summaries"],
  PRO: ["Everything in Basic", "Unlimited live bots", "Advanced analytics", "Priority support"],
};
