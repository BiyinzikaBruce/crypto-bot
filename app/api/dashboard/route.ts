import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [botsRunning, openPositions, todayTrades, recentTrades] = await Promise.all([
      db.bot.count({ where: { userId, status: "RUNNING" } }),
      db.trade.count({ where: { userId, status: "OPEN" } }),
      db.trade.findMany({
        where: { userId, status: "CLOSED", closedAt: { gte: todayStart } },
        select: { profit: true },
      }),
      db.trade.findMany({
        where: { userId },
        include: {
          bot: { select: { name: true, strategy: { select: { pair: true } } } },
        },
        orderBy: { openedAt: "desc" },
        take: 5,
      }),
    ]);

    const todayPnl = todayTrades.reduce((sum, t) => sum + (t.profit ?? 0), 0);

    return NextResponse.json({
      botsRunning,
      openPositions,
      todayPnl: Math.round(todayPnl * 100) / 100,
      recentTrades,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
