import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function requireBridgeAuth(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const key = auth.slice(7).trim();
  const user = await db.user.findUnique({ where: { bridgeKey: key } });
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireBridgeAuth(request);

    const bots = await db.bot.findMany({
      where: { userId: user.id, status: "RUNNING" },
      include: {
        strategy: {
          include: { rules_rel: true },
        },
      },
    });

    const payload = bots.map((b) => ({
      id: b.id,
      name: b.name,
      strategy: {
        id: b.strategy.id,
        name: b.strategy.name,
        pair: b.strategy.pair,
        timeframe: b.strategy.timeframe,
        rules: b.strategy.rules_rel.map((r) => ({
          indicator: r.indicator,
          condition: r.condition,
          value: r.value,
          logicOperator: r.logicOperator,
          ruleType: r.ruleType,
        })),
      },
    }));

    return NextResponse.json({ bots: payload });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
