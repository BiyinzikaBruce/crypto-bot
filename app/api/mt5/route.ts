import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const account = await db.mT5Account.findUnique({
      where: { userId },
      select: {
        id: true,
        server: true,
        isConnected: true,
        lastConnectedAt: true,
      },
    });

    return NextResponse.json({ account });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch MT5 account" }, { status: 500 });
  }
}
