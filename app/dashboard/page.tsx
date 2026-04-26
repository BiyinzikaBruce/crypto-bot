"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Link2,
  CheckCircle2,
  XCircle,
  Bot,
  TrendingUp,
  Activity,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MT5Account {
  id: string;
  server: string;
  isConnected: boolean;
  lastConnectedAt: string | null;
}

interface RecentTrade {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  profit: number | null;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  bot: { name: string } | null;
}

interface DashboardStats {
  botsRunning: number;
  openPositions: number;
  todayPnl: number;
  recentTrades: RecentTrade[];
}

// ─── MT5 status card ──────────────────────────────────────────────────────────

function MT5StatusCard({
  account,
  isLoading,
}: {
  account: MT5Account | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading MT5 status…
        </div>
      </div>
    );
  }

  const connected = account?.isConnected ?? false;

  return (
    <div
      className={cn(
        "bg-[var(--card)] border rounded-xl p-5 transition-all",
        connected ? "border-primary-500/30 shadow-glow" : "border-[var(--card-border)]"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
            MT5 Account
          </p>
          {connected && account ? (
            <>
              <p className="text-sm font-medium text-[var(--foreground)]">{account.server}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-profit-400 bot-running-dot" />
                <span className="text-[12px] text-profit-400 font-medium">Connected</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400">No account connected</p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 mt-2 text-[12px] text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                <Link2 className="h-3.5 w-3.5" />
                Connect MT5
              </Link>
            </>
          )}
        </div>
        <div className={cn("p-2 rounded-lg", connected ? "bg-primary-500/10" : "bg-slate-800")}>
          {connected ? (
            <CheckCircle2 className="h-5 w-5 text-primary-400" />
          ) : (
            <XCircle className="h-5 w-5 text-slate-600" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  valueClass,
  href,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  valueClass?: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
          {label}
        </p>
        <p
          className={cn(
            "text-[28px] font-bold leading-none font-mono tabular-nums",
            valueClass ?? "text-[var(--foreground)]"
          )}
        >
          {value}
        </p>
      </div>
      <div className="p-2 rounded-lg bg-slate-800">
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 hover:border-slate-600 transition-colors block"
    >
      {inner}
    </Link>
  ) : (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
      {inner}
    </div>
  );
}

// ─── Recent trades list ───────────────────────────────────────────────────────

function RecentTradeRow({ trade }: { trade: RecentTrade }) {
  const profit = trade.profit;
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]/50 last:border-0">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
            trade.direction === "BUY"
              ? "bg-primary-500/15 text-primary-400"
              : "bg-loss-600/15 text-loss-400"
          )}
        >
          {trade.direction}
        </span>
        <div>
          <span className="font-mono text-[13px] text-[var(--foreground)]">{trade.pair}</span>
          {trade.bot && (
            <span className="ml-2 text-[12px] text-slate-500">{trade.bot.name}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {trade.status === "OPEN" ? (
          <span className="text-[11px] text-primary-400 font-semibold uppercase tracking-wide">
            Open
          </span>
        ) : profit != null ? (
          <span
            className={cn(
              "font-mono text-[13px] font-semibold flex items-center gap-0.5",
              profit >= 0 ? "text-profit-400" : "text-loss-400"
            )}
          >
            {profit >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            ${Math.abs(profit).toFixed(2)}
          </span>
        ) : null}
        <span className="text-[12px] text-slate-600">
          {new Date(trade.openedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: mt5Data, isLoading: mt5Loading } = useQuery({
    queryKey: ["mt5-account"],
    queryFn: async () => {
      const res = await fetch("/api/mt5");
      if (!res.ok) return { account: null };
      return res.json() as Promise<{ account: MT5Account | null }>;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return null;
      return res.json() as Promise<DashboardStats>;
    },
    refetchInterval: 15_000,
  });

  const todayPnl = stats?.todayPnl ?? 0;

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MT5StatusCard account={mt5Data?.account ?? null} isLoading={mt5Loading} />

        <StatCard
          label="Bots Running"
          value={String(stats?.botsRunning ?? 0)}
          icon={Bot}
          valueClass="text-primary-400"
          href="/dashboard/bots"
        />
        <StatCard
          label="Open Positions"
          value={String(stats?.openPositions ?? 0)}
          icon={Activity}
          href="/dashboard/trades"
        />
        <StatCard
          label="Today's P&L"
          value={`${todayPnl >= 0 ? "+" : ""}$${Math.abs(todayPnl).toFixed(2)}`}
          icon={TrendingUp}
          valueClass={todayPnl >= 0 ? "text-profit-400" : "text-loss-400"}
        />
      </div>

      <div className="mt-8 bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Recent Trades
          </p>
          <Link
            href="/dashboard/trades"
            className="text-[11px] text-primary-400 hover:text-primary-300"
          >
            View all
          </Link>
        </div>

        {!stats || stats.recentTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-800 mb-4">
              <TrendingUp className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">No trades yet</p>
            <p className="text-[13px] text-slate-600 mt-1 max-w-xs">
              Deploy a bot to start executing trades automatically.
            </p>
            <Link
              href="/dashboard/strategies/new"
              className="mt-4 inline-flex h-9 items-center px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors"
            >
              Build a Strategy
            </Link>
          </div>
        ) : (
          <div>
            {stats.recentTrades.map((trade) => (
              <RecentTradeRow key={trade.id} trade={trade} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
