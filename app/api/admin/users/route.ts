import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, adminError } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const plan = searchParams.get("plan");
    const role = searchParams.get("role");

    const users = await db.user.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(plan ? { plan: plan as "FREE" | "BASIC" | "PRO" } : {}),
        ...(role ? { role: role as "TRADER" | "ADMIN" } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        createdAt: true,
        emailVerified: true,
        _count: { select: { bots: true, trades: true, strategies: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (error) {
    return adminError(error);
  }
}
