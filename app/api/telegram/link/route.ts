import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { generateLinkToken } from "@/lib/telegram";

export async function GET() {
  try {
    const session = await requireSession();
    const token = await generateLinkToken(session.user.id);
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "";
    const deepLink = botUsername
      ? `https://t.me/${botUsername}?start=${token}`
      : null;

    return NextResponse.json({ token, deepLink, botUsername });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
  }
}
