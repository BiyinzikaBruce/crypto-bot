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

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  pair: z.enum(["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]).optional(),
  timeframe: z.enum(["M1", "M5", "M15", "M30", "H1", "H4", "D1"]).optional(),
  entryRules: z.array(ruleSchema).min(1).optional(),
  exitRules: z.array(ruleSchema).min(1).optional(),
  status: z.enum(["DRAFT", "ACTIVE"]).optional(),
});

async function getOwned(id: string, userId: string) {
  const strategy = await db.strategy.findFirst({
    where: { id, userId },
    include: { rules_rel: true, _count: { select: { backtests: true } } },
  });
  return strategy;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const strategy = await getOwned(id, session.user.id);
    if (!strategy) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(strategy);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch strategy" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await getOwned(id, session.user.id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { entryRules, exitRules, ...rest } = parsed.data;

    // If rules are provided, replace them entirely
    if (entryRules || exitRules) {
      const allRules = [
        ...(entryRules ?? []).map((r) => ({ ...r, ruleType: "ENTRY" as const })),
        ...(exitRules ?? []).map((r) => ({ ...r, ruleType: "EXIT" as const })),
      ];

      await db.strategyRule.deleteMany({ where: { strategyId: id } });
      await db.strategyRule.createMany({
        data: allRules.map((r) => ({ ...r, strategyId: id })),
      });
    }

    const strategy = await db.strategy.update({
      where: { id },
      data: rest,
      include: { rules_rel: true },
    });

    return NextResponse.json(strategy);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update strategy" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await getOwned(id, session.user.id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.strategy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete strategy" }, { status: 500 });
  }
}
