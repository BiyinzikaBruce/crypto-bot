import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const { plan } = await request.json();

    if (plan !== "BASIC" && plan !== "PRO") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = STRIPE_PRICES[plan as "BASIC" | "PRO"];
    if (!priceId) {
      return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
    }

    const [user, subscription] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      }),
      db.subscription.findUnique({
        where: { userId },
        select: { stripeCustomerId: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stripe = getStripe();
    const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

    const existingCustomerId = subscription?.stripeCustomerId ?? undefined;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: existingCustomerId,
      customer_email: existingCustomerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard/billing?success=1`,
      cancel_url: `${baseUrl}/dashboard/billing?cancelled=1`,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[stripe/checkout]", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
