import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await requireSession();
    await db.user.update({
      where: { id: session.user.id },
      data: { telegramChatId: null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
