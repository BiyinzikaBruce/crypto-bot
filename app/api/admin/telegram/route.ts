import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { getBotInfo } from "@/lib/telegram";

export async function GET() {
  try {
    const session = await requireSession();

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [notifications, botInfo] = await Promise.all([
      db.telegramNotification.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { sentAt: "desc" },
        take: 100,
      }),
      getBotInfo(),
    ]);

    const tokenConfigured = !!process.env.TELEGRAM_BOT_TOKEN;

    return NextResponse.json({ notifications, botInfo, tokenConfigured });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
