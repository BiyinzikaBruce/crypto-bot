import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, adminError } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const subscriptions = await db.subscription.findMany({
      where: status ? { status: status as "ACTIVE" | "CANCELLED" | "EXPIRED" } : {},
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const revenue = await db.subscription.aggregate({
      where: { status: "ACTIVE" },
      _sum: { amount: true },
    });

    return NextResponse.json({ subscriptions, mrr: revenue._sum.amount ?? 0 });
  } catch (error) {
    return adminError(error);
  }
}
