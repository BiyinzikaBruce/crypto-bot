import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";

// Called once after the user's first sign-in to send the welcome email.
// The client can fire this and forget — idempotent via the welcomeSent check.
export async function POST() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only send if the account is less than 5 minutes old (fresh sign-up)
    const ageMs = Date.now() - new Date(user.createdAt).getTime();
    if (ageMs < 5 * 60 * 1000) {
      sendWelcomeEmail(user.email, user.name).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
