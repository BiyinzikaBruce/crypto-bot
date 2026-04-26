import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

const ruleSchema = z.object({
  indicator: z.enum(["RSI", "MA", "MACD", "BB", "STOCH"]),
  condition: z.enum(["CROSSES_ABOVE", "CROSSES_BELOW", "GREATER_THAN", "LESS_THAN"]),
  value: z.number(),
  logicOperator: z.enum(["AND", "OR"]).default("AND"),
  ruleType: z.enum(["ENTRY", "EXIT"]),
});

const createSchema = z.object({
  name: z.string().min(1).max(100),
  pair: z.enum(["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]),
  timeframe: z.enum(["M1", "M5", "M15", "M30", "H1", "H4", "D1"]),
  entryRules: z.array(ruleSchema).min(1),
  exitRules: z.array(ruleSchema).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));
    const skip = (page - 1) * limit;

    const [strategies, total] = await Promise.all([
      db.strategy.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { _count: { select: { rules_rel: true, backtests: true } } },
      }),
      db.strategy.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({ strategies, total, page, limit });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Plan limit: Basic = max 2, Free = 0 deployable (can still create)
    const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (user?.plan === "BASIC") {
      const count = await db.strategy.count({ where: { userId } });
      if (count >= 2) {
        return NextResponse.json(
          { error: "PLAN_LIMIT", message: "Basic plan allows a maximum of 2 strategies. Upgrade to Pro for unlimited." },
          { status: 403 }
        );
      }
    }

    const { name, pair, timeframe, entryRules, exitRules } = parsed.data;
    const allRules = [
      ...entryRules.map((r) => ({ ...r, ruleType: "ENTRY" as const })),
      ...exitRules.map((r) => ({ ...r, ruleType: "EXIT" as const })),
    ];

    const strategy = await db.strategy.create({
      data: {
        userId,
        name,
        pair,
        timeframe,
        status: "DRAFT",
        rules_rel: { create: allRules },
      },
      include: { rules_rel: true },
    });

    return NextResponse.json(strategy, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create strategy error:", error);
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 });
  }
}
