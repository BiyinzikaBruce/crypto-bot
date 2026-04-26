import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const pair = searchParams.get("pair");
    const direction = searchParams.get("direction");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (pair) where.pair = pair;
    if (direction) where.direction = direction;
    if (status) where.status = status;

    const trades = await db.trade.findMany({
      where,
      include: { bot: { select: { name: true } } },
      orderBy: { openedAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ trades, total: trades.length });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }
}
