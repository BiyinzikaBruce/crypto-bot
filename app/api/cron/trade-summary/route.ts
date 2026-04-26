import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTradeSummaryEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const dateLabel = todayStart.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Find all users who have closed trades today
  const usersWithTrades = await db.user.findMany({
    where: {
      trades: {
        some: {
          status: "CLOSED",
          closedAt: { gte: todayStart, lte: todayEnd },
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      trades: {
        where: {
          status: "CLOSED",
          closedAt: { gte: todayStart, lte: todayEnd },
        },
        select: { profit: true },
      },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const user of usersWithTrades) {
    const trades = user.trades;
    const totalTrades = trades.length;
    const winningTrades = trades.filter((t) => (t.profit ?? 0) > 0).length;
    const losingTrades = totalTrades - winningTrades;
    const netPnl = trades.reduce((sum, t) => sum + (t.profit ?? 0), 0);
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    try {
      await sendTradeSummaryEmail(user.email, {
        name: user.name,
        date: dateLabel,
        totalTrades,
        winningTrades,
        losingTrades,
        netPnl: Math.round(netPnl * 100) / 100,
        winRate: Math.round(winRate * 10) / 10,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    sent,
    failed,
    total: usersWithTrades.length,
    date: dateLabel,
  });
}
