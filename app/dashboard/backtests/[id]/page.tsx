"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import type { TradeLogEntry, EquityPoint } from "@/lib/backtest";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BacktestDetail {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  winRate: number | null;
  totalTrades: number | null;
  fromDate: string;
  toDate: string;
  createdAt: string;
  resultLog: TradeLogEntry[] | null;
  equityCurve: EquityPoint[] | null;
  strategy: { name: string; pair: string; timeframe: string };
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "profit" | "loss" | "neutral";
  icon: React.ElementType;
}) {
  const valueColor =
    accent === "profit"
      ? "text-profit-400"
      : accent === "loss"
        ? "text-loss-400"
        : "text-[var(--foreground)]";

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <p className={cn("text-3xl font-bold tabular-nums font-mono", valueColor)}>{value}</p>
      {sub && <p className="text-[12px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BacktestDetail["status"] }) {
  const styles: Record<string, string> = {
    PENDING: "bg-warning-500/10 text-warning-400 border-warning-500/20",
    RUNNING: "bg-primary-500/10 text-primary-400 border-primary-500/20",
    COMPLETED: "bg-profit-400/10 text-profit-400 border-profit-400/20",
    FAILED: "bg-loss-600/10 text-loss-400 border-loss-600/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border",
        styles[status]
      )}
    >
      {status === "RUNNING" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
      {status}
    </span>
  );
}

// ─── Equity curve chart ───────────────────────────────────────────────────────

function EquityChart({ data }: { data: EquityPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
        Not enough data points
      </div>
    );
  }

  const start = data[0].equity;
  const end = data[data.length - 1].equity;
  const isProfit = end >= start;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
        <XAxis
          dataKey="time"
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => v.slice(5)} // show MM-DD
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${v.toLocaleString()}`}
          width={72}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--card-border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "#94a3b8" }}
          itemStyle={{ color: isProfit ? "#4ade80" : "#f87171" }}
          formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, "Equity"]}
        />
        <Line
          type="monotone"
          dataKey="equity"
          stroke={isProfit ? "#4ade80" : "#f87171"}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Trade log table ──────────────────────────────────────────────────────────

function TradeLogTable({ trades }: { trades: TradeLogEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[var(--card-border)]">
            {["#", "Pair", "Dir", "Entry", "Exit", "Pips", "P&L", "Duration"].map((h) => (
              <th
                key={h}
                className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr
              key={t.index}
              className="border-b border-[var(--card-border)]/50 hover:bg-slate-800/30 transition-colors"
            >
              <td className="py-2.5 px-3 font-mono text-slate-500">{t.index}</td>
              <td className="py-2.5 px-3 font-mono">{t.pair}</td>
              <td className="py-2.5 px-3">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-500/15 text-primary-400">
                  {t.direction}
                </span>
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-slate-300">
                {t.entryPrice.toFixed(5)}
              </td>
              <td className="py-2.5 px-3 font-mono tabular-nums text-slate-300">
                {t.exitPrice.toFixed(5)}
              </td>
              <td
                className={cn(
                  "py-2.5 px-3 font-mono tabular-nums font-medium",
                  t.pips >= 0 ? "text-profit-400" : "text-loss-400"
                )}
              >
                {t.pips >= 0 ? "+" : ""}
                {t.pips.toFixed(1)}
              </td>
              <td
                className={cn(
                  "py-2.5 px-3 font-mono tabular-nums font-medium",
                  t.profit >= 0 ? "text-profit-400" : "text-loss-400"
                )}
              >
                {t.profit >= 0 ? "+" : ""}${Math.abs(t.profit).toFixed(2)}
              </td>
              <td className="py-2.5 px-3 text-slate-500">{t.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BacktestDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: backtest, isLoading, error } = useQuery({
    queryKey: ["backtest", id],
    queryFn: async () => {
      const res = await fetch(`/api/backtests/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<BacktestDetail>;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PENDING" || status === "RUNNING" ? 3000 : false;
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

  if (error || !backtest) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center mt-8">
        <AlertTriangle className="h-10 w-10 text-loss-400 mb-3" />
        <p className="text-sm font-medium text-slate-300">Backtest not found</p>
        <Link
          href="/dashboard/backtests"
          className="mt-3 text-[13px] text-primary-400 hover:text-primary-300"
        >
          Back to backtests
        </Link>
      </div>
    );
  }

  const trades = (backtest.resultLog as TradeLogEntry[] | null) ?? [];
  const equity = (backtest.equityCurve as EquityPoint[] | null) ?? [];
  const winners = trades.filter((t) => t.profit > 0).length;
  const losers = trades.filter((t) => t.profit <= 0).length;
  const netPnl = trades.reduce((s, t) => s + t.profit, 0);
  const isRunning = backtest.status === "PENDING" || backtest.status === "RUNNING";

  return (
    <div>
      <PageHeader
        title={`Backtest — ${backtest.strategy.name}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Backtests", href: "/dashboard/backtests" },
          { label: backtest.strategy.name },
        ]}
        action={<StatusBadge status={backtest.status} />}
      />

      {/* Meta row */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-[13px] text-slate-500">
        <span>
          <span className="font-mono text-slate-300">{backtest.strategy.pair}</span>{" "}
          {backtest.strategy.timeframe}
        </span>
        <span>
          {new Date(backtest.fromDate).toLocaleDateString()} —{" "}
          {new Date(backtest.toDate).toLocaleDateString()}
        </span>
        <span>Run {new Date(backtest.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Running / pending state */}
      {isRunning && (
        <div className="mt-8 flex flex-col items-center justify-center py-16 text-center bg-[var(--card)] border border-[var(--card-border)] rounded-xl">
          <Loader2 className="h-10 w-10 text-primary-400 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-300">
            {backtest.status === "PENDING" ? "Queued…" : "Running backtest…"}
          </p>
          <p className="text-[13px] text-slate-500 mt-1">Results will appear automatically</p>
        </div>
      )}

      {/* Failed state */}
      {backtest.status === "FAILED" && (
        <div className="mt-8 flex flex-col items-center justify-center py-16 text-center bg-[var(--card)] border border-[var(--card-border)] rounded-xl">
          <AlertTriangle className="h-10 w-10 text-loss-400 mb-3" />
          <p className="text-sm font-medium text-slate-300">Backtest failed</p>
          <p className="text-[13px] text-slate-500 mt-1">
            Check that the strategy has valid entry and exit rules.
          </p>
        </div>
      )}

      {/* Completed results */}
      {backtest.status === "COMPLETED" && (
        <div className="mt-8 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Win Rate"
              value={`${backtest.winRate?.toFixed(1) ?? 0}%`}
              sub={`${winners}W / ${losers}L`}
              accent={
                (backtest.winRate ?? 0) >= 50 ? "profit" : "loss"
              }
              icon={Target}
            />
            <StatCard
              label="Total Trades"
              value={String(backtest.totalTrades ?? 0)}
              accent="neutral"
              icon={BarChart2}
            />
            <StatCard
              label="Net P&L"
              value={`${netPnl >= 0 ? "+" : ""}$${Math.abs(netPnl).toFixed(2)}`}
              sub="on $10,000 account"
              accent={netPnl >= 0 ? "profit" : "loss"}
              icon={netPnl >= 0 ? TrendingUp : TrendingDown}
            />
            <StatCard
              label="Profitable"
              value={`${winners}`}
              sub={`of ${backtest.totalTrades ?? 0} trades`}
              accent={winners > losers ? "profit" : "loss"}
              icon={TrendingUp}
            />
          </div>

          {/* Equity curve */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-5">
              Equity Curve
            </p>
            {equity.length > 1 ? (
              <EquityChart data={equity} />
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
                No equity data
              </div>
            )}
          </div>

          {/* Trade log */}
          {trades.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">
                Trade Log{" "}
                <span className="normal-case text-slate-600 tracking-normal font-normal ml-1">
                  ({trades.length} trades)
                </span>
              </p>
              <TradeLogTable trades={trades} />
            </div>
          )}

          {trades.length === 0 && (
            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-8 text-center">
              <p className="text-sm text-slate-500">
                No trades were triggered. Try widening the date range or adjusting the strategy
                rules.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
