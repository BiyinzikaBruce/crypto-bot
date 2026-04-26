import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, adminError } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const bots = await db.bot.findMany({
      where: status ? { status: status as "RUNNING" | "STOPPED" | "ERROR" } : {},
      include: {
        user: { select: { id: true, name: true, email: true } },
        strategy: { select: { name: true, pair: true } },
        _count: { select: { trades: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ bots });
  } catch (error) {
    return adminError(error);
  }
}
