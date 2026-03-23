import Stripe from "stripe";

// ---------------------------------------------------------------------------
// Stripe Singleton (same pattern as prisma.ts)
// ---------------------------------------------------------------------------

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

function createStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.startsWith("sk_test_placeholder")) {
    return null;
  }
  return new Stripe(secretKey, {
    typescript: true,
  });
}

export const stripe = globalForStripe.stripe ?? createStripeClient();

if (process.env.NODE_ENV !== "production" && stripe) {
  globalForStripe.stripe = stripe;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if Stripe is configured with real keys */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && !key.startsWith("sk_test_placeholder") && key.startsWith("sk_");
}

/** Get Stripe mode (test or live) based on secret key prefix */
export function getStripeMode(): "test" | "live" | "not_configured" {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_test_placeholder")) return "not_configured";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "not_configured";
}

/** Mask a Stripe key for display: sk_test_4eC39H...p7dc → sk_test_****p7dc */
export function maskStripeKey(key: string): string {
  if (!key || key.length < 12) return "****";
  const prefix = key.startsWith("sk_live_")
    ? "sk_live_"
    : key.startsWith("sk_test_")
      ? "sk_test_"
      : key.startsWith("pk_live_")
        ? "pk_live_"
        : key.startsWith("pk_test_")
          ? "pk_test_"
          : "";
  const lastFour = key.slice(-4);
  return `${prefix}****${lastFour}`;
}

/** Get the Stripe publishable key (safe to expose to client) */
export function getPublishableKey(): string {
  return process.env.STRIPE_PUBLISHABLE_KEY ?? "";
}

/** Get base URL for Stripe redirect URLs */
export function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
