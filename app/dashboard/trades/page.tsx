"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table";
import { SortableColumn } from "@/components/column-helpers";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeItem {
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
  bot: { name: string } | null;
}

interface TradesResponse {
  trades: TradeItem[];
  total: number;
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<TradeItem>[] = [
  {
    accessorKey: "pair",
    header: "Pair",
    cell: ({ row }) => (
      <span className="font-mono text-[13px] uppercase tracking-wide">{row.original.pair}</span>
    ),
  },
  {
    accessorKey: "direction",
    header: "Dir",
    cell: ({ row }) => (
      <span
        className={cn(
          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
          row.original.direction === "BUY"
            ? "bg-primary-500/15 text-primary-400"
            : "bg-loss-600/15 text-loss-400"
        )}
      >
        {row.original.direction}
      </span>
    ),
  },
  {
    accessorKey: "entryPrice",
    header: ({ column }) => <SortableColumn column={column} title="Entry" />,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-[13px] text-slate-300">
        {row.original.entryPrice.toFixed(5)}
      </span>
    ),
  },
  {
    accessorKey: "exitPrice",
    header: "Exit",
    cell: ({ row }) =>
      row.original.exitPrice != null ? (
        <span className="font-mono tabular-nums text-[13px] text-slate-300">
          {row.original.exitPrice.toFixed(5)}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-profit-400 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-profit-400 animate-pulse" />
          LIVE
        </span>
      ),
  },
  {
    accessorKey: "profit",
    header: ({ column }) => <SortableColumn column={column} title="P&L" />,
    cell: ({ row }) => {
      const p = row.original.profit;
      if (p == null) return <span className="text-slate-600 text-[13px]">—</span>;
      return (
        <span
          className={cn(
            "font-mono tabular-nums text-[13px] font-semibold",
            p >= 0 ? "text-profit-400" : "text-loss-400"
          )}
        >
          {p >= 0 ? "+" : ""}${Math.abs(p).toFixed(2)}
        </span>
      );
    },
  },
  {
    accessorKey: "bot",
    header: "Bot",
    cell: ({ row }) => (
      <span className="text-[13px] text-slate-500">{row.original.bot?.name ?? "—"}</span>
    ),
  },
  {
    accessorKey: "openedAt",
    header: ({ column }) => <SortableColumn column={column} title="Opened" />,
    cell: ({ row }) => (
      <span className="text-[13px] text-slate-500">
        {new Date(row.original.openedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    ),
  },
  {
    accessorKey: "closedAt",
    header: "Closed",
    cell: ({ row }) => (
      <span className="text-[13px] text-slate-500">
        {row.original.closedAt
          ? new Date(row.original.closedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </span>
    ),
  },
];

// ─── Filters ──────────────────────────────────────────────────────────────────

const PAIRS = ["All", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY"];
const DIRECTIONS = ["All", "BUY", "SELL"];
const STATUSES = ["All", "OPEN", "CLOSED"];

function FilterBar({
  pair, setpair,
  direction, setDirection,
  status, setStatus,
}: {
  pair: string; setpair: (v: string) => void;
  direction: string; setDirection: (v: string) => void;
  status: string; setStatus: (v: string) => void;
}) {
  const sel =
    "h-8 rounded-lg text-[13px] bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] px-2.5 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer appearance-none";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <select value={pair} onChange={(e) => setpair(e.target.value)} className={sel}>
        {PAIRS.map((p) => <option key={p} value={p}>{p === "All" ? "All Pairs" : p}</option>)}
      </select>
      <select value={direction} onChange={(e) => setDirection(e.target.value)} className={sel}>
        {DIRECTIONS.map((d) => <option key={d} value={d}>{d === "All" ? "All Directions" : d}</option>)}
      </select>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel}>
        {STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
      </select>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TradesPage() {
  const [pair, setPair] = useState("All");
  const [direction, setDirection] = useState("All");
  const [status, setStatus] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["trades", pair, direction, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (pair !== "All") params.set("pair", pair);
      if (direction !== "All") params.set("direction", direction);
      if (status !== "All") params.set("status", status);
      const res = await fetch(`/api/trades?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<TradesResponse>;
    },
    refetchInterval: 10_000, // poll every 10 s to catch new/closed trades
  });

  const trades = data?.trades ?? [];

  return (
    <div>
      <PageHeader
        title="Trades"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Trades" }]}
      />

      <div className="mt-8">
        <FilterBar
          pair={pair} setpair={setPair}
          direction={direction} setDirection={setDirection}
          status={status} setStatus={setStatus}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg skeleton" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-800 mb-4">
              <TrendingUp className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">No trades found</p>
            <p className="text-[13px] text-slate-600 mt-1">
              {pair !== "All" || direction !== "All" || status !== "All"
                ? "Try clearing the filters."
                : "Deploy a bot to start trading."}
            </p>
          </div>
        ) : (
          <DataTable columns={columns} data={trades} searchPlaceholder="Search trades…" />
        )}
      </div>
    </div>
  );
}
