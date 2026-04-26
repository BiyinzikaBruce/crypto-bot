"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Send, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  message: string;
  sentAt: string;
  success: boolean;
  user: { name: string; email: string };
}

interface AdminTelegramData {
  notifications: Notification[];
  botInfo: { username: string; name: string } | null;
  tokenConfigured: boolean;
}

// ─── Type label ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  TRADE_OPENED: "Trade Opened",
  TRADE_CLOSED: "Trade Closed",
  BOT_STARTED: "Bot Started",
  BOT_STOPPED: "Bot Stopped",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTelegramPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-telegram"],
    queryFn: async () => {
      const res = await fetch("/api/admin/telegram");
      if (res.status === 403) throw new Error("Forbidden");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<AdminTelegramData>;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 mt-8">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center mt-8">
        <AlertTriangle className="h-10 w-10 text-loss-400 mb-3" />
        <p className="text-sm font-medium text-slate-300">
          {error.message === "Forbidden" ? "Admin access required" : "Failed to load"}
        </p>
        <Link href="/dashboard" className="mt-3 text-[13px] text-primary-400 hover:text-primary-300">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { notifications, botInfo, tokenConfigured } = data!;
  const successCount = notifications.filter((n) => n.success).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="Telegram Admin"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Telegram" },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bot status */}
        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">
              Bot Status
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-500">Token</span>
                <span className={tokenConfigured ? "text-profit-400" : "text-loss-400"}>
                  {tokenConfigured ? "Configured" : "Missing"}
                </span>
              </div>
              {botInfo ? (
                <>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Bot name</span>
                    <span className="text-slate-300">{botInfo.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Username</span>
                    <span className="font-mono text-primary-400">@{botInfo.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-profit-400 bot-running-dot" />
                    <span className="text-[12px] text-profit-400 font-medium">Online</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-[13px] text-slate-500">
                  <XCircle className="h-4 w-4 text-loss-400" />
                  Bot offline or not configured
                </div>
              )}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">
              Stats
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500">Total sent</span>
                <span className="font-mono tabular-nums text-[var(--foreground)]">
                  {notifications.length}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500">Successful</span>
                <span className="font-mono tabular-nums text-profit-400">{successCount}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500">Failed</span>
                <span className="font-mono tabular-nums text-loss-400">
                  {notifications.length - successCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification log */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">
              Notification Log{" "}
              <span className="normal-case tracking-normal font-normal text-slate-600 ml-1">
                (last 100)
              </span>
            </p>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Send className="h-8 w-8 text-slate-600 mb-3" />
                <p className="text-sm text-slate-500">No notifications sent yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--card-border)]">
                      {["User", "Type", "Message", "Sent At", "Status"].map((h) => (
                        <th
                          key={h}
                          className="text-left py-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((n) => (
                      <tr
                        key={n.id}
                        className="border-b border-[var(--card-border)]/50 hover:bg-slate-800/20"
                      >
                        <td className="py-2.5 px-2">
                          <div>
                            <p className="text-slate-300">{n.user.name}</p>
                            <p className="text-[11px] text-slate-600">{n.user.email}</p>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-slate-400 whitespace-nowrap">
                          {TYPE_LABELS[n.type] ?? n.type}
                        </td>
                        <td className="py-2.5 px-2 text-slate-500 max-w-[200px] truncate">
                          {n.message}
                        </td>
                        <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">
                          {new Date(n.sentAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-2">
                          {n.success ? (
                            <CheckCircle2 className="h-4 w-4 text-profit-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-loss-400" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
