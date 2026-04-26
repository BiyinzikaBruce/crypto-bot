import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { runBacktest } from "@/lib/backtest";

const createSchema = z.object({
  strategyId: z.string().min(1),
  fromDate: z.string().date(),
  toDate: z.string().date(),
});

export async function GET(_request: NextRequest) {
  try {
    const session = await requireSession();

    const backtests = await db.backtest.findMany({
      where: { userId: session.user.id },
      include: {
        strategy: { select: { name: true, pair: true, timeframe: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ backtests, total: backtests.length });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch backtests" }, { status: 500 });
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

    const { strategyId, fromDate, toDate } = parsed.data;

    // Verify strategy ownership
    const strategy = await db.strategy.findFirst({
      where: { id: strategyId, userId: session.user.id },
    });
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from >= to) {
      return NextResponse.json({ error: "fromDate must be before toDate" }, { status: 400 });
    }

    const backtest = await db.backtest.create({
      data: {
        strategyId,
        userId: session.user.id,
        fromDate: from,
        toDate: to,
        status: "PENDING",
      },
    });

    // Fire-and-forget: run the backtest asynchronously
    runBacktest(backtest.id, strategyId, from, to).catch(() => {});

    return NextResponse.json(backtest, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create backtest" }, { status: 500 });
  }
}
