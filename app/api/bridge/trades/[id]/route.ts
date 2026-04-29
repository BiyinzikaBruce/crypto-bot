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

const closeSchema = z.object({
  exitPrice: z.number(),
  profit: z.number(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireBridgeAuth(request);
    const { id } = await params;

    const trade = await db.trade.findFirst({ where: { id, userId: user.id, status: "OPEN" } });
    if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

    const body = await request.json();
    const parsed = closeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const updated = await db.trade.update({
      where: { id },
      data: {
        exitPrice: parsed.data.exitPrice,
        profit: Math.round(parsed.data.profit * 100) / 100,
        closedAt: new Date(),
        status: "CLOSED",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
