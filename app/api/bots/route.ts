import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const createSchema = z.object({
  strategyId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const session = await requireSession();

    const bots = await db.bot.findMany({
      where: { userId: session.user.id },
      include: {
        strategy: { select: { name: true, pair: true, timeframe: true } },
        _count: { select: { trades: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bots, total: bots.length });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch bots" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { strategyId, name } = parsed.data;
    const userId = session.user.id;

    // Verify strategy ownership
    const strategy = await db.strategy.findFirst({
      where: { id: strategyId, userId },
    });
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    // Require MT5 account
    const mt5Account = await db.mT5Account.findUnique({ where: { userId } });
    if (!mt5Account) {
      return NextResponse.json(
        { error: "MT5_REQUIRED", message: "Connect an MT5 account before deploying a bot." },
        { status: 400 }
      );
    }

    // Basic plan: max 1 running bot
    const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (user?.plan === "BASIC" || user?.plan === "FREE") {
      const runningCount = await db.bot.count({ where: { userId, status: "RUNNING" } });
      if (runningCount >= 1) {
        return NextResponse.json(
          { error: "PLAN_LIMIT", message: "Basic plan allows 1 running bot. Upgrade to Pro for unlimited bots." },
          { status: 403 }
        );
      }
    }

    const bot = await db.bot.create({
      data: {
        userId,
        strategyId,
        mt5AccountId: mt5Account.id,
        name: name ?? `${strategy.name} Bot`,
        status: "STOPPED",
      },
      include: {
        strategy: { select: { name: true, pair: true, timeframe: true } },
      },
    });

    return NextResponse.json(bot, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create bot" }, { status: 500 });
  }
}
