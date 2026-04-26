import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendSubscriptionConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as "BASIC" | "PRO" | undefined;
        if (!userId || !plan) break;

        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const customerId = session.customer as string;
        const firstItem = subscription.items.data[0];
        const periodEnd = new Date((firstItem?.current_period_end ?? 0) * 1000);

        await db.$transaction([
          db.user.update({
            where: { id: userId },
            data: { plan, planExpiresAt: periodEnd },
          }),
          db.subscription.upsert({
            where: { userId },
            create: {
              userId,
              plan,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscription.id,
              amount: (subscription.items.data[0]?.price.unit_amount ?? 0) / 100,
              status: "ACTIVE",
              expiresAt: periodEnd,
            },
            update: {
              plan,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscription.id,
              amount: (subscription.items.data[0]?.price.unit_amount ?? 0) / 100,
              status: "ACTIVE",
              expiresAt: periodEnd,
            },
          }),
        ]);

        const user = await db.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });
        if (user) {
          sendSubscriptionConfirmationEmail(user.email, {
            name: user.name,
            planName: plan === "PRO" ? "Pro" : "Basic",
            amount: (subscription.items.data[0]?.price.unit_amount ?? 0) / 100,
            currency: "usd",
            expiresAt: periodEnd.toISOString(),
          }).catch(() => {});
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        const updatedItem = subscription.items.data[0];
        const periodEnd = new Date((updatedItem?.current_period_end ?? 0) * 1000);
        const status = subscription.status === "active" ? "ACTIVE" : "CANCELLED";

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status, expiresAt: periodEnd },
        });

        if (status === "ACTIVE") {
          await db.user.update({
            where: { id: userId },
            data: { planExpiresAt: periodEnd },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: "CANCELLED" },
        });

        if (userId) {
          await db.user.update({
            where: { id: userId },
            data: { plan: "FREE", planExpiresAt: null },
          });

          // Stop all running bots when plan downgrades to FREE
          await db.bot.updateMany({
            where: { userId, status: "RUNNING" },
            data: { status: "STOPPED" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
