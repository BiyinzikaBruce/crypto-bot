import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { bridgeKey: true },
    });
    return NextResponse.json({ bridgeKey: user?.bridgeKey ?? null });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST() {
  try {
    const session = await requireSession();
    const bridgeKey = randomBytes(32).toString("base64url");
    await db.user.update({
      where: { id: session.user.id },
      data: { bridgeKey },
    });
    return NextResponse.json({ bridgeKey });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
