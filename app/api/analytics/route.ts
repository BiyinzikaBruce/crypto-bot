import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (user?.plan !== "PRO") {
      return NextResponse.json({ error: "PRO plan required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get("days") ?? "30"), 90);

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const trades = await db.trade.findMany({
      where: {
        userId,
        status: "CLOSED",
        closedAt: { gte: since },
      },
      select: {
        pair: true,
        direction: true,
        profit: true,
        closedAt: true,
        entryPrice: true,
        exitPrice: true,
      },
      orderBy: { closedAt: "asc" },
    });

    // ── Daily P&L ──────────────────────────────────────────────────────────────
    const dailyMap = new Map<string, { pnl: number; trades: number; wins: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { pnl: 0, trades: 0, wins: 0 });
    }
    for (const t of trades) {
      const key = t.closedAt!.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.pnl += t.profit ?? 0;
        entry.trades += 1;
        if ((t.profit ?? 0) > 0) entry.wins += 1;
      }
    }

    let runningEquity = 0;
    const dailyPnl = Array.from(dailyMap.entries()).map(([date, v]) => {
      runningEquity += v.pnl;
      return {
        date,
        pnl: Math.round(v.pnl * 100) / 100,
        equity: Math.round(runningEquity * 100) / 100,
        trades: v.trades,
      };
    });

    // ── Pair breakdown ─────────────────────────────────────────────────────────
    const pairMap = new Map<string, { wins: number; losses: number; pnl: number }>();
    for (const t of trades) {
      const entry = pairMap.get(t.pair) ?? { wins: 0, losses: 0, pnl: 0 };
      entry.pnl += t.profit ?? 0;
      if ((t.profit ?? 0) > 0) entry.wins += 1;
      else entry.losses += 1;
      pairMap.set(t.pair, entry);
    }
    const pairBreakdown = Array.from(pairMap.entries())
      .map(([pair, v]) => ({
        pair,
        wins: v.wins,
        losses: v.losses,
        pnl: Math.round(v.pnl * 100) / 100,
        winRate: v.wins + v.losses > 0 ? Math.round((v.wins / (v.wins + v.losses)) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    // ── Direction breakdown ────────────────────────────────────────────────────
    const dirMap = { BUY: { wins: 0, losses: 0, pnl: 0 }, SELL: { wins: 0, losses: 0, pnl: 0 } };
    for (const t of trades) {
      const dir = t.direction as "BUY" | "SELL";
      dirMap[dir].pnl += t.profit ?? 0;
      if ((t.profit ?? 0) > 0) dirMap[dir].wins += 1;
      else dirMap[dir].losses += 1;
    }
    const directionBreakdown = (["BUY", "SELL"] as const).map((dir) => ({
      direction: dir,
      ...dirMap[dir],
      pnl: Math.round(dirMap[dir].pnl * 100) / 100,
    }));

    // ── Summary stats ──────────────────────────────────────────────────────────
    const totalTrades = trades.length;
    const winningTrades = trades.filter((t) => (t.profit ?? 0) > 0).length;
    const netPnl = trades.reduce((s, t) => s + (t.profit ?? 0), 0);
    const profits = trades.filter((t) => (t.profit ?? 0) > 0).map((t) => t.profit ?? 0);
    const losses = trades.filter((t) => (t.profit ?? 0) <= 0).map((t) => t.profit ?? 0);
    const avgWin = profits.length ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
    const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

    return NextResponse.json({
      summary: {
        totalTrades,
        winRate: totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 1000) / 10 : 0,
        netPnl: Math.round(netPnl * 100) / 100,
        avgWin: Math.round(avgWin * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
        profitFactor: Math.round(profitFactor * 100) / 100,
      },
      dailyPnl,
      pairBreakdown,
      directionBreakdown,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
