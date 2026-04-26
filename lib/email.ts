import { Resend } from "resend";
import { render } from "@react-email/components";
import { WelcomeEmail } from "@/emails/welcome";
import { TradeSummaryEmail, type TradeSummaryEmailProps } from "@/emails/trade-summary";
import { BotErrorEmail, type BotErrorEmailProps } from "@/emails/bot-error";
import {
  SubscriptionConfirmationEmail,
  type SubscriptionConfirmationEmailProps,
} from "@/emails/subscription-confirmation";

const FROM = process.env.RESEND_FROM_EMAIL ?? "FXAU <noreply@fxau.app>";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// ─── Low-level send ───────────────────────────────────────────────────────────

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log(`[email] To: ${to} | Subject: ${subject}`);
    return true;
  }
  try {
    const body = html ? { html } : text ? { text } : { html: "" };
    const { error } = await resend.emails.send({ from: FROM, to, subject, ...body });
    return !error;
  } catch {
    return false;
  }
}

// ─── Typed senders ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const dashboardUrl = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/dashboard`;
  const html = await render(WelcomeEmail({ name, loginUrl: dashboardUrl }));
  await sendEmail({ to, subject: "Welcome to FXAU — let's get started", html });
}

export async function sendTradeSummaryEmail(
  to: string,
  data: Omit<TradeSummaryEmailProps, "dashboardUrl">
): Promise<void> {
  const dashboardUrl = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/dashboard/trades`;
  const html = await render(TradeSummaryEmail({ ...data, dashboardUrl }));
  await sendEmail({ to, subject: `FXAU Daily Summary — ${data.date}`, html });
}

export async function sendBotErrorEmail(
  to: string,
  data: Omit<BotErrorEmailProps, "settingsUrl">
): Promise<void> {
  const settingsUrl = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/dashboard/settings`;
  const html = await render(BotErrorEmail({ ...data, settingsUrl }));
  await sendEmail({ to, subject: `FXAU Alert — Bot "${data.botName}" stopped with error`, html });
}

export async function sendSubscriptionConfirmationEmail(
  to: string,
  data: Omit<SubscriptionConfirmationEmailProps, "dashboardUrl">
): Promise<void> {
  const dashboardUrl = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/dashboard/billing`;
  const html = await render(SubscriptionConfirmationEmail({ ...data, dashboardUrl }));
  await sendEmail({ to, subject: `FXAU — ${data.planName} plan activated`, html });
}
