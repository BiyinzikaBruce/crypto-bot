import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return session;
}

export function adminError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.error("[admin]", error);
  return NextResponse.json({ error: "Failed" }, { status: 500 });
}
