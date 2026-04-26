import { db } from "@/lib/db";

const API_BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// ─── Core send ────────────────────────────────────────────────────────────────

export async function sendMessage(
  chatId: string | number,
  text: string
): Promise<boolean> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return false;
  try {
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Log + send ───────────────────────────────────────────────────────────────

type NotifType = "TRADE_OPENED" | "TRADE_CLOSED" | "BOT_STARTED" | "BOT_STOPPED";

export async function sendAndLog(
  userId: string,
  chatId: string,
  type: NotifType,
  message: string
): Promise<void> {
  const success = await sendMessage(chatId, message);
  await db.telegramNotification.create({
    data: { userId, type, message, success },
  }).catch(() => {}); // don't block on log failure
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

export async function broadcastNotification(
  type: NotifType,
  message: string
): Promise<void> {
  const users = await db.user.findMany({
    where: { telegramChatId: { not: null } },
    select: { id: true, telegramChatId: true },
  });
  await Promise.allSettled(
    users.map((u) => sendAndLog(u.id, u.telegramChatId!, type, message))
  );
}

// ─── Message templates ────────────────────────────────────────────────────────

export function tradeOpenedMsg(pair: string, direction: string, price: number) {
  return `Trade Opened\n${pair} ${direction} at ${price.toFixed(5)}`;
}

export function tradeClosedMsg(
  pair: string,
  direction: string,
  entryPrice: number,
  exitPrice: number,
  profit: number
) {
  const sign = profit >= 0 ? "+" : "";
  return `Trade Closed\n${pair} ${direction}\nEntry: ${entryPrice.toFixed(5)} → Exit: ${exitPrice.toFixed(5)}\nP&L: ${sign}$${Math.abs(profit).toFixed(2)}`;
}

export function botStartedMsg(botName: string, strategyName: string) {
  return `Bot Started\n<b>${botName}</b> is now live\nStrategy: ${strategyName}`;
}

export function botStoppedMsg(botName: string) {
  return `Bot Stopped\n<b>${botName}</b> has been stopped`;
}

// ─── Deep link token ──────────────────────────────────────────────────────────

import { randomBytes } from "crypto";

export async function generateLinkToken(userId: string): Promise<string> {
  const token = randomBytes(20).toString("hex");

  // Remove any existing pending tokens for this user
  await db.verification.deleteMany({
    where: { identifier: { startsWith: "telegram_link:" }, value: userId },
  });

  await db.verification.create({
    data: {
      identifier: `telegram_link:${token}`,
      value: userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    },
  });

  return token;
}

export async function consumeLinkToken(
  token: string
): Promise<string | null> {
  const record = await db.verification.findFirst({
    where: {
      identifier: `telegram_link:${token}`,
      expiresAt: { gt: new Date() },
    },
  });
  if (!record) return null;

  await db.verification.delete({ where: { id: record.id } });
  return record.value; // userId
}

// ─── Bot status ───────────────────────────────────────────────────────────────

export async function getBotInfo(): Promise<{ username: string; name: string } | null> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null;
  try {
    const res = await fetch(`${API_BASE}/getMe`);
    if (!res.ok) return null;
    const data = await res.json() as { ok: boolean; result: { username: string; first_name: string } };
    if (!data.ok) return null;
    return { username: data.result.username, name: data.result.first_name };
  } catch {
    return null;
  }
}
