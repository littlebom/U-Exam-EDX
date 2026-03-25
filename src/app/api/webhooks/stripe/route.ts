import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { processPayment, markPaymentFailed } from "@/services/payment.service";
import type Stripe from "stripe";

// ---------------------------------------------------------------------------
// Stripe Webhook Handler
// ---------------------------------------------------------------------------
// Events handled:
// - checkout.session.completed       → Card payment succeeded (sync)
// - checkout.session.async_payment_succeeded → PromptPay succeeded (async)
// - checkout.session.async_payment_failed    → PromptPay failed (async)
// - checkout.session.expired         → Session expired (no payment)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Process the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // For card payments, payment is already complete
        // For PromptPay, payment_status may be "unpaid" (wait for async event)
        if (session.payment_status === "paid") {
          await handlePaymentSuccess(session);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        // PromptPay payment succeeded (async confirmation from bank)
        const session = event.data.object as Stripe.Checkout.Session;
        await handlePaymentSuccess(session);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handlePaymentFailed(session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handlePaymentFailed(session);
        break;
      }

      default:
        // Unhandled event type — ignore
        // [stripe](`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing Stripe event ${event.type}:`, err);
    // Return 200 anyway to prevent Stripe retries for processing errors
    // The payment can be manually reconciled
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  const { paymentId, tenantId } = session.metadata ?? {};

  if (!paymentId || !tenantId) {
    console.error("Missing metadata in Stripe session:", session.id);
    return;
  }

  const transactionId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id;

  try {
    await processPayment(tenantId, paymentId, {
      transactionId,
      gatewayRef: session.id,
    });
    // [stripe](`Payment ${paymentId} processed successfully via Stripe`);
  } catch (err) {
    // processPayment throws if payment is not PENDING (idempotent guard)
    // [stripe-warn](`Payment ${paymentId} already processed or error:`, err);
  }
}

async function handlePaymentFailed(session: Stripe.Checkout.Session) {
  const { paymentId, tenantId } = session.metadata ?? {};

  if (!paymentId || !tenantId) {
    console.error("Missing metadata in Stripe session:", session.id);
    return;
  }

  try {
    await markPaymentFailed(tenantId, paymentId);
    // [stripe](`Payment ${paymentId} marked as failed`);
  } catch (err) {
    // [stripe-warn](`Error marking payment ${paymentId} as failed:`, err);
  }
}
