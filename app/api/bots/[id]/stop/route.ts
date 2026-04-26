import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { sendAndLog, botStoppedMsg } from "@/lib/telegram";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const bot = await db.bot.findFirst({ where: { id, userId: session.user.id } });
    if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (bot.status === "STOPPED") {
      return NextResponse.json({ error: "Bot is already stopped" }, { status: 400 });
    }

    // Close any open trades when bot stops
    await db.trade.updateMany({
      where: { botId: id, status: "OPEN" },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    const updated = await db.bot.update({
      where: { id },
      data: { status: "STOPPED", stoppedAt: new Date() },
    });

    const userWithChat = await db.user.findUnique({
      where: { id: session.user.id },
      select: { telegramChatId: true },
    });
    if (userWithChat?.telegramChatId) {
      sendAndLog(
        session.user.id,
        userWithChat.telegramChatId,
        "BOT_STOPPED",
        botStoppedMsg(updated.name)
      ).catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to stop bot" }, { status: 500 });
  }
}
