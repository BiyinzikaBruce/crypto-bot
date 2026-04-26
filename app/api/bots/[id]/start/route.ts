import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { sendAndLog, botStartedMsg } from "@/lib/telegram";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const userId = session.user.id;

    const bot = await db.bot.findFirst({ where: { id, userId } });
    if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (bot.status === "RUNNING") {
      return NextResponse.json({ error: "Bot is already running" }, { status: 400 });
    }

    // Basic plan: max 1 running bot
    const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (user?.plan === "BASIC" || user?.plan === "FREE") {
      const runningCount = await db.bot.count({ where: { userId, status: "RUNNING" } });
      if (runningCount >= 1) {
        return NextResponse.json(
          { error: "PLAN_LIMIT", message: "Basic plan allows 1 running bot." },
          { status: 403 }
        );
      }
    }

    const updated = await db.bot.update({
      where: { id },
      data: { status: "RUNNING", startedAt: new Date(), stoppedAt: null },
      include: { strategy: { select: { name: true } } },
    });

    // Fire-and-forget Telegram notification
    const userWithChat = await db.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true },
    });
    if (userWithChat?.telegramChatId) {
      sendAndLog(
        userId,
        userWithChat.telegramChatId,
        "BOT_STARTED",
        botStartedMsg(updated.name, updated.strategy.name)
      ).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to start bot" }, { status: 500 });
  }
}
