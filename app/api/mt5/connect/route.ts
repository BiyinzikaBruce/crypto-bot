import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { requireSession } from "@/lib/session";

const schema = z.object({
  login: z.string().min(1, "MT5 login is required"),
  password: z.string().min(1, "MT5 password is required"),
  server: z.string().min(1, "MT5 server is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { login, password, server } = parsed.data;

    const encryptedLogin = encrypt(login);
    const encryptedPassword = encrypt(password);

    const mt5Account = await db.mT5Account.upsert({
      where: { userId },
      create: {
        userId,
        login: encryptedLogin,
        password: encryptedPassword,
        server,
        isConnected: true,
        lastConnectedAt: new Date(),
      },
      update: {
        login: encryptedLogin,
        password: encryptedPassword,
        server,
        isConnected: true,
        lastConnectedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: mt5Account.id,
      server: mt5Account.server,
      isConnected: mt5Account.isConnected,
      lastConnectedAt: mt5Account.lastConnectedAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("MT5 connect error:", error);
    return NextResponse.json(
      { error: "Failed to save MT5 account" },
      { status: 500 }
    );
  }
}
