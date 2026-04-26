import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeLinkToken, sendMessage } from "@/lib/telegram";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; first_name: string; username?: string };
    text?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify secret token header to prevent unauthorized requests
    const secret = request.headers.get("x-telegram-bot-api-secret-token");
    if (
      process.env.TELEGRAM_WEBHOOK_SECRET &&
      secret !== process.env.TELEGRAM_WEBHOOK_SECRET
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    // Handle /start command (with optional token)
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const token = parts[1]?.trim();

      if (token) {
        const userId = await consumeLinkToken(token);
        if (userId) {
          await db.user.update({
            where: { id: userId },
            data: { telegramChatId: String(chatId) },
          });
          await sendMessage(
            chatId,
            "Telegram connected! You will now receive trade and bot notifications here."
          );
        } else {
          await sendMessage(
            chatId,
            "Link expired or invalid. Go to Settings and click Connect Telegram again."
          );
        }
      } else {
        await sendMessage(
          chatId,
          "Welcome to FXAU! To link your account, go to Dashboard > Settings > Connect Telegram and click the link."
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
