import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

async function getOwned(id: string, userId: string) {
  return db.bot.findFirst({
    where: { id, userId },
    include: {
      strategy: { select: { name: true, pair: true, timeframe: true } },
      _count: { select: { trades: true } },
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const bot = await getOwned(id, session.user.id);
    if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(bot);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch bot" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const bot = await getOwned(id, session.user.id);
    if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.bot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 });
  }
}
