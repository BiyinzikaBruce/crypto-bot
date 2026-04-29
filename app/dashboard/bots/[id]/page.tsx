"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ComposedChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Play, Square, Zap, Trash2, Loader2, AlertTriangle,
  TrendingUp, TrendingDown, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import {
  simulatePrice, simulateIndicator,
  generateCandles, PIP, PIP_VALUE,
  type Candle,
} from "@/lib/price-sim";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trade {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number | null;
  lotSize: number;
  profit: number | null;
  openedAt: string;
  closedAt: string | null;
  status: "OPEN" | "CLOSED";
}

interface BotDetail {
  id: string;
  name: string;
  status: "RUNNING" | "STOPPED" | "ERROR";
  startedAt: string | null;
  strategy: { name: string; pair: string; timeframe: string };
  _count: { trades: number };
}

// ─── Candlestick custom shape ─────────────────────────────────────────────────

function CandleShape(props: {
  x?: number; y?: number; width?: number; height?: number;
  payload?: Candle;
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload || height <= 0) return null;

  const { open, high, low, close } = payload;
  const priceRange = high - low || 0.0001;
  const isGreen = close >= open;
  const color = isGreen ? "#4ade80" : "#f87171";
  const wickX = x + width / 2;

  const toY = (price: number) => y + height * (1 - (price - low) / priceRange);

  const bodyTop = toY(Math.max(open, close));
  const bodyBot = toY(Math.min(open, close));
  const bodyH = Math.max(1.5, bodyBot - bodyTop);
  const bodyW = Math.max(3, width * 0.65);
  const bodyX = x + (width - bodyW) / 2;

  return (
    <g>
      <line x1={wickX} y1={toY(high)} x2={wickX} y2={bodyTop} stroke={color} strokeWidth={1} />
      <line x1={wickX} y1={bodyBot} x2={wickX} y2={toY(low)} stroke={color} strokeWidth={1} />
      <rect x={bodyX} y={bodyTop} width={bodyW} height={bodyH} fill={color} stroke={color} strokeWidth={0.5} />
    </g>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CandleTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Candle }> }) {
  if (!active || !payload?.[0]) return null;
  const c = payload[0].payload;
  const isGreen = c.close >= c.open;
  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-[12px] space-y-0.5 shadow-xl">
      <p className="text-slate-400 mb-1">{c.timeLabel}</p>
      <div className="grid grid-cols-2 gap-x-3">
        <span className="text-slate-500">O</span><span className="font-mono">{c.open.toFixed(3)}</span>
        <span className="text-slate-500">H</span><span className="font-mono text-profit-400">{c.high.toFixed(3)}</span>
        <span className="text-slate-500">L</span><span className="font-mono text-loss-400">{c.low.toFixed(3)}</span>
        <span className={cn("font-mono font-semibold", isGreen ? "text-profit-400" : "text-loss-400")}>
          C
        </span>
        <span className={cn("font-mono font-semibold", isGreen ? "text-profit-400" : "text-loss-400")}>
          {c.close.toFixed(3)}
        </span>
      </div>
    </div>
  );
}

// ─── RSI mini chart ───────────────────────────────────────────────────────────

function RsiBar({ value }: { value: number }) {
  const pct = ((value - 0) / 100) * 100;
  const color = value > 70 ? "#f87171" : value < 30 ? "#4ade80" : "#94a3b8";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-500">RSI</span>
        <span className="font-mono font-semibold" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-700">
        <span>0</span><span>30</span><span>50</span><span>70</span><span>100</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [rsi, setRsi] = useState<number>(50);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: bot, isLoading: botLoading } = useQuery({
    queryKey: ["bot", id],
    queryFn: async () => {
      const res = await fetch(`/api/bots/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<BotDetail>;
    },
    refetchInterval: 10_000,
  });

  const { data: tradesData, isLoading: tradesLoading } = useQuery({
    queryKey: ["bot-trades", id],
    queryFn: async () => {
      const res = await fetch(`/api/trades?botId=${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ trades: Trade[] }>;
    },
    refetchInterval: 10_000,
  });

  const trades = tradesData?.trades ?? [];
  const openTrade = trades.find((t) => t.status === "OPEN");

  // Live price + candle update every 5 seconds
  useEffect(() => {
    if (!bot) return;
    const pair = bot.strategy.pair;
    const tf = bot.strategy.timeframe;

    function update() {
      const now = Date.now();
      setLivePrice(simulatePrice(pair, now));
      setRsi(simulateIndicator("RSI", pair, now));
      setCandles(generateCandles(pair, tf, 40));
    }

    update();
    const interval = setInterval(update, 5_000);
    return () => clearInterval(interval);
  }, [bot]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["bot", id] });
    queryClient.invalidateQueries({ queryKey: ["bot-trades", id] });
    queryClient.invalidateQueries({ queryKey: ["bots"] });
  }, [queryClient, id]);

  async function action(type: "start" | "stop" | "tick") {
    setActionLoading(type);
    try {
      const res = await fetch(`/api/bots/${id}/${type}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message ?? err.error);
        return;
      }
      if (type === "tick") {
        const data = await res.json();
        const result = data.result as string;
        if (result.startsWith("BUY opened")) toast.success(`Trade opened: ${result}`);
        else if (result.startsWith("BUY closed")) toast.success(`Trade closed: ${result}`);
        else toast.info(`Tick: ${result}`);
      } else {
        toast.success(type === "start" ? "Bot started" : "Bot stopped");
      }
      refresh();
    } catch {
      toast.error(`Failed to ${type}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this bot? Trades are kept.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bots/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Bot deleted");
      queryClient.invalidateQueries({ queryKey: ["bots"] });
      router.push("/dashboard/bots");
    } catch {
      toast.error("Failed to delete bot");
      setDeleting(false);
    }
  }

  const unrealizedPnl =
    openTrade && livePrice
      ? ((livePrice - openTrade.entryPrice) / (PIP[openTrade.pair] ?? 0.0001)) *
        (PIP_VALUE[openTrade.pair] ?? 10) *
        openTrade.lotSize
      : null;

  if (botLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg skeleton" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl skeleton" />)}
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400">Bot not found.</p>
        <Link href="/dashboard/bots" className="text-primary-400 text-sm mt-2 block hover:underline">
          Back to Bots
        </Link>
      </div>
    );
  }

  const isRunning = bot.status === "RUNNING";
  const lastClose = candles[candles.length - 1]?.close ?? livePrice ?? 0;
  const prevClose = candles[candles.length - 2]?.close ?? lastClose;
  const priceChange = lastClose - prevClose;
  const priceChangePct = prevClose > 0 ? (priceChange / prevClose) * 100 : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title={bot.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Bots", href: "/dashboard/bots" },
          { label: bot.name },
        ]}
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border",
            isRunning
              ? "bg-profit-400/10 text-profit-400 border-profit-400/20"
              : "bg-slate-800 text-slate-400 border-slate-700"
          )}
        >
          {isRunning && <span className="h-1.5 w-1.5 rounded-full bg-profit-400 animate-pulse" />}
          {bot.status}
        </span>
        <span className="text-[13px] text-slate-500">
          {bot.strategy.name} · {bot.strategy.pair} · {bot.strategy.timeframe}
        </span>
        <div className="ml-auto flex gap-2">
          {isRunning ? (
            <>
              <button
                onClick={() => action("tick")}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 text-[var(--foreground)] transition-colors disabled:opacity-50"
              >
                {actionLoading === "tick" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-primary-400" />}
                Tick Now
              </button>
              <button
                onClick={() => action("stop")}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm bg-loss-600/20 hover:bg-loss-600/30 text-loss-400 transition-colors disabled:opacity-50"
              >
                {actionLoading === "stop" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
                Stop
              </button>
            </>
          ) : (
            <button
              onClick={() => action("start")}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm bg-profit-400/20 hover:bg-profit-400/30 text-profit-400 transition-colors disabled:opacity-50"
            >
              {actionLoading === "start" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Start
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm text-slate-500 hover:text-loss-400 hover:bg-loss-600/10 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Simulation warning */}
      <div className="rounded-xl border border-warning-500/30 bg-warning-500/5 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-warning-400 mt-0.5 shrink-0" />
        <div className="text-[13px]">
          <span className="font-semibold text-warning-400">SIMULATION MODE</span>
          <span className="text-slate-400 ml-1">
            — Trades shown here are <strong>NOT</strong> on your real Exness account.
            Prices and indicators are mathematically simulated. To trade real money,
            you need to run the <strong>Python Bridge</strong> on your PC — ask me to build it.
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Live price */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Live Price</p>
          <p className="text-xl font-bold font-mono tabular-nums">
            {livePrice ? livePrice.toFixed(3) : "—"}
          </p>
          <p className={cn("text-[12px] font-mono mt-0.5", priceChange >= 0 ? "text-profit-400" : "text-loss-400")}>
            {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(3)} ({priceChangePct >= 0 ? "+" : ""}{priceChangePct.toFixed(3)}%)
          </p>
        </div>

        {/* Open trade */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Open Trade</p>
          {openTrade ? (
            <>
              <p className="text-sm font-semibold text-profit-400 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> BUY @ {openTrade.entryPrice.toFixed(3)}
              </p>
              <p className={cn("text-[13px] font-mono font-semibold mt-0.5",
                unrealizedPnl != null && unrealizedPnl >= 0 ? "text-profit-400" : "text-loss-400"
              )}>
                {unrealizedPnl != null
                  ? `${unrealizedPnl >= 0 ? "+" : ""}$${unrealizedPnl.toFixed(2)} unrealized`
                  : "—"}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No open trade</p>
          )}
        </div>

        {/* Total trades */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Total Trades</p>
          <p className="text-xl font-bold">{bot._count.trades}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {trades.filter((t) => t.profit != null && t.profit > 0).length} wins ·{" "}
            {trades.filter((t) => t.profit != null && t.profit < 0).length} losses
          </p>
        </div>

        {/* Total P&L */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Realized P&L</p>
          {(() => {
            const closed = trades.filter((t) => t.profit != null);
            const total = closed.reduce((s, t) => s + (t.profit ?? 0), 0);
            return (
              <>
                <p className={cn("text-xl font-bold font-mono tabular-nums",
                  total >= 0 ? "text-profit-400" : "text-loss-400"
                )}>
                  {total >= 0 ? "+" : ""}${total.toFixed(2)}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">{closed.length} closed trades</p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Candlestick chart */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold">{bot.strategy.pair} · {bot.strategy.timeframe}</span>
            {isRunning && (
              <span className="inline-flex items-center gap-1 text-[11px] text-profit-400">
                <span className="h-1.5 w-1.5 rounded-full bg-profit-400 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          {livePrice && (
            <span className="font-mono text-sm font-bold tabular-nums">
              {livePrice.toFixed(3)}
            </span>
          )}
        </div>

        {candles.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={candles} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                interval={7}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                width={55}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip content={<CandleTooltip />} />
              {openTrade && (
                <ReferenceLine
                  y={openTrade.entryPrice}
                  stroke="#4ade80"
                  strokeDasharray="4 2"
                  strokeWidth={1}
                  label={{ value: `Entry ${openTrade.entryPrice.toFixed(3)}`, fill: "#4ade80", fontSize: 10, position: "right" }}
                />
              )}
              <Bar
                dataKey={(d: Candle) => [d.low, d.high] as [number, number]}
                shape={(props: unknown) => <CandleShape {...(props as Parameters<typeof CandleShape>[0])} />}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] rounded-lg skeleton" />
        )}
      </div>

      {/* RSI indicator */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3">
        <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-3">Indicators</p>
        <div className="max-w-sm">
          <RsiBar value={rsi} />
        </div>
      </div>

      {/* Recent trades */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--card-border)]">
          <span className="text-sm font-semibold">Trade History</span>
          <span className="ml-2 text-[11px] text-slate-500">{trades.length} total</span>
        </div>
        {tradesLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded skeleton" />)}
          </div>
        ) : trades.length === 0 ? (
          <p className="text-center text-[13px] text-slate-600 py-8">
            No trades yet — {isRunning ? "waiting for next tick" : "start the bot to begin"}
          </p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[11px] text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2">Dir</th>
                <th className="text-left px-4 py-2">Entry</th>
                <th className="text-left px-4 py-2">Exit</th>
                <th className="text-left px-4 py-2">P&L</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {trades.slice(0, 20).map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                      t.direction === "BUY" ? "bg-primary-500/15 text-primary-400" : "bg-loss-600/15 text-loss-400"
                    )}>
                      {t.direction === "BUY" ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {t.direction}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums">{t.entryPrice.toFixed(3)}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-400">
                    {t.exitPrice ? t.exitPrice.toFixed(3) : (
                      <span className="inline-flex items-center gap-1 text-profit-400 font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-profit-400 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums font-semibold">
                    {t.profit != null ? (
                      <span className={t.profit >= 0 ? "text-profit-400" : "text-loss-400"}>
                        {t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}
                      </span>
                    ) : (
                      unrealizedPnl != null && t.status === "OPEN" ? (
                        <span className={cn("text-[12px]", unrealizedPnl >= 0 ? "text-profit-400" : "text-loss-400")}>
                          {unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(2)}*
                        </span>
                      ) : <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      t.status === "OPEN" ? "text-profit-400" : "text-slate-500"
                    )}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {new Date(t.openedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
