import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, adminError } from "@/lib/admin";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      totalBots,
      runningBots,
      totalTrades,
      totalSubscriptions,
      recentUsers,
    ] = await Promise.all([
      db.user.count(),
      db.bot.count(),
      db.bot.count({ where: { status: "RUNNING" } }),
      db.trade.count(),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, plan: true, createdAt: true },
      }),
    ]);

    const planCounts = await db.user.groupBy({
      by: ["plan"],
      _count: { _all: true },
    });

    return NextResponse.json({
      totalUsers,
      totalBots,
      runningBots,
      totalTrades,
      totalSubscriptions,
      recentUsers,
      planCounts,
    });
  } catch (error) {
    return adminError(error);
  }
}
