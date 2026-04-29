import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

async function requireBridgeAuth(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const key = auth.slice(7).trim();
  const user = await db.user.findUnique({ where: { bridgeKey: key } });
  if (!user) throw new Error("Unauthorized");
  return user;
}

const openSchema = z.object({
  botId: z.string().min(1),
  pair: z.string().min(1),
  direction: z.enum(["BUY", "SELL"]),
  entryPrice: z.number(),
  lotSize: z.number(),
  mt5Ticket: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireBridgeAuth(request);

    const body = await request.json();
    const parsed = openSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { botId, pair, direction, entryPrice, lotSize, mt5Ticket } = parsed.data;

    // Verify bot belongs to user
    const bot = await db.bot.findFirst({ where: { id: botId, userId: user.id } });
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    const trade = await db.trade.create({
      data: {
        botId,
        userId: user.id,
        pair,
        direction,
        entryPrice,
        lotSize,
        mt5Ticket: mt5Ticket ?? null,
        status: "OPEN",
        openedAt: new Date(),
      },
    });

    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
