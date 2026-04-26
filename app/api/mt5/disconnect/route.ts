import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    await db.mT5Account.update({
      where: { userId },
      data: { isConnected: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("MT5 disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect MT5 account" },
      { status: 500 }
    );
  }
}
