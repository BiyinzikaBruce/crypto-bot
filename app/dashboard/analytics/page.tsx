"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Loader2, Lock, TrendingUp, TrendingDown, Target, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  summary: {
    totalTrades: number;
    winRate: number;
    netPnl: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
  };
  dailyPnl: { date: string; pnl: number; equity: number; trades: number }[];
  pairBreakdown: { pair: string; wins: number; losses: number; pnl: number; winRate: number }[];
  directionBreakdown: { direction: string; wins: number; losses: number; pnl: number }[];
}

// ─── Upgrade gate ─────────────────────────────────────────────────────────────

function UpgradeGate() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
        <Lock size={28} className="text-yellow-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">Analytics is a Pro feature</h2>
        <p className="text-muted-foreground max-w-sm">
          Upgrade to Pro to unlock deep insights into your trading performance — P&L curves, pair
          breakdowns, win rates, and more.
        </p>
      </div>
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg text-sm transition-colors"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  positive?: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div
        className={cn(
          "text-2xl font-bold",
          positive === true && "text-green-500",
          positive === false && "text-red-500"
        )}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user as { plan?: string } | undefined;
  const isPro = user?.plan === "PRO";
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics", days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?days=${days}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isPro,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        action={
          isPro ? (
            <div className="flex gap-2">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                    days === d
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      {!isPro ? (
        <UpgradeGate />
      ) : isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              label="Total Trades"
              value={data.summary.totalTrades}
              icon={BarChart3}
            />
            <StatCard
              label="Win Rate"
              value={`${data.summary.winRate}%`}
              positive={data.summary.winRate >= 50}
              icon={Target}
            />
            <StatCard
              label="Net P&L"
              value={`$${data.summary.netPnl.toLocaleString()}`}
              positive={data.summary.netPnl >= 0}
              icon={data.summary.netPnl >= 0 ? TrendingUp : TrendingDown}
            />
            <StatCard
              label="Avg Win"
              value={`$${data.summary.avgWin.toFixed(2)}`}
              positive
              icon={TrendingUp}
            />
            <StatCard
              label="Avg Loss"
              value={`$${data.summary.avgLoss.toFixed(2)}`}
              positive={false}
              icon={TrendingDown}
            />
            <StatCard
              label="Profit Factor"
              value={data.summary.profitFactor.toFixed(2)}
              positive={data.summary.profitFactor >= 1}
              sub="win/loss ratio"
              icon={Target}
            />
          </div>

          {/* Equity curve */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-4">Cumulative P&L</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.dailyPnl} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => v.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `$${v}`}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Equity"]}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 2" />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Daily P&L bars */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-4">Daily P&L</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.dailyPnl} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => v.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `$${v}`}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "P&L"]}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {data.dailyPnl.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pair breakdown */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold mb-4">Performance by Pair</h2>
              {data.pairBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data for this period</p>
              ) : (
                <div className="space-y-3">
                  {data.pairBreakdown.map((p) => (
                    <div key={p.pair} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-medium w-24">{p.pair}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${p.winRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {p.winRate}%
                        </span>
                      </div>
                      <span
                        className={cn(
                          "ml-4 font-mono text-xs font-medium w-20 text-right",
                          p.pnl >= 0 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direction breakdown */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold mb-4">Long vs Short</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={data.directionBreakdown}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="direction" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `$${v}`} width={56} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "P&L"]}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {data.directionBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {data.directionBreakdown.map((d) => (
                  <div key={d.direction} className="rounded-lg bg-muted/50 p-3">
                    <div className="text-xs text-muted-foreground mb-1">{d.direction}</div>
                    <div className="text-sm font-semibold">
                      {d.wins}W / {d.losses}L
                    </div>
                    <div
                      className={cn(
                        "text-xs font-mono mt-0.5",
                        d.pnl >= 0 ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
