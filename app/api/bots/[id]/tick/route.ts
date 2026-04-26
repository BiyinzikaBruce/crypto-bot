import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { processTick } from "@/lib/mt5";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const bot = await db.bot.findFirst({ where: { id, userId: session.user.id } });
    if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const result = await processTick(id);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to process tick" }, { status: 500 });
  }
}
