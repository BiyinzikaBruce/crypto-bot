"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Bot, Play, Square, Trash2, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table";
import { SortableColumn } from "@/components/column-helpers";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BotListItem {
  id: string;
  name: string;
  status: "RUNNING" | "STOPPED" | "ERROR";
  startedAt: string | null;
  stoppedAt: string | null;
  createdAt: string;
  strategy: { name: string; pair: string; timeframe: string };
  _count: { trades: number };
}

// ─── Status indicator ─────────────────────────────────────────────────────────

function BotStatusBadge({ status }: { status: BotListItem["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border",
        status === "RUNNING"
          ? "bg-profit-400/10 text-profit-400 border-profit-400/20"
          : status === "ERROR"
            ? "bg-loss-600/10 text-loss-400 border-loss-600/20"
            : "bg-slate-800 text-slate-400 border-slate-700"
      )}
    >
      {status === "RUNNING" && (
        <span className="h-1.5 w-1.5 rounded-full bg-profit-400 bot-running-dot" />
      )}
      {status}
    </span>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function BotActions({ bot, onRefresh }: { bot: BotListItem; onRefresh: () => void }) {
  const [loading, setLoading] = useState<"start" | "stop" | "tick" | "delete" | null>(null);

  async function act(action: "start" | "stop" | "tick" | "delete") {
    setLoading(action);
    try {
      const method = action === "delete" ? "DELETE" : "POST";
      const url =
        action === "delete"
          ? `/api/bots/${bot.id}`
          : `/api/bots/${bot.id}/${action}`;

      const res = await fetch(url, { method });
      if (!res.ok) {
        const err = await res.json();
        if (err.error === "PLAN_LIMIT") {
          toast.error(err.message);
          return;
        }
        throw new Error(err.error);
      }

      const messages = {
        start: "Bot started",
        stop: "Bot stopped",
        tick: undefined, // show tick result inline
        delete: "Bot deleted",
      };

      if (action === "tick") {
        const data = await res.json();
        toast.info(`Tick: ${data.result}`);
      } else if (messages[action]) {
        toast.success(messages[action]);
      }

      onRefresh();
    } catch {
      toast.error(`Failed to ${action} bot`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      {bot.status === "STOPPED" || bot.status === "ERROR" ? (
        <button
          onClick={() => act("start")}
          disabled={loading !== null}
          title="Start bot"
          className="h-7 w-7 flex items-center justify-center rounded-md text-profit-400 hover:bg-profit-400/10 transition-colors disabled:opacity-40"
        >
          {loading === "start" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
        </button>
      ) : (
        <button
          onClick={() => act("stop")}
          disabled={loading !== null}
          title="Stop bot"
          className="h-7 w-7 flex items-center justify-center rounded-md text-loss-400 hover:bg-loss-600/10 transition-colors disabled:opacity-40"
        >
          {loading === "stop" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
        </button>
      )}

      {bot.status === "RUNNING" && (
        <button
          onClick={() => act("tick")}
          disabled={loading !== null}
          title="Simulate tick"
          className="h-7 w-7 flex items-center justify-center rounded-md text-primary-400 hover:bg-primary-500/10 transition-colors disabled:opacity-40"
        >
          {loading === "tick" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
        </button>
      )}

      <button
        onClick={() => act("delete")}
        disabled={loading !== null}
        title="Delete bot"
        className="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:text-loss-400 hover:bg-loss-600/10 transition-colors disabled:opacity-40"
      >
        {loading === "delete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function useColumns(onRefresh: () => void): ColumnDef<BotListItem>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableColumn column={column} title="Bot" />,
      cell: ({ row }) => (
        <span className="font-medium text-[var(--foreground)]">{row.original.name}</span>
      ),
    },
    {
      id: "strategy",
      header: "Strategy",
      cell: ({ row }) => (
        <div className="text-[13px]">
          <Link
            href={`/dashboard/strategies/${row.original.strategy.name}`}
            className="text-slate-300 hover:text-primary-400 transition-colors"
          >
            {row.original.strategy.name}
          </Link>
          <span className="ml-1.5 font-mono text-slate-500 text-[12px]">
            {row.original.strategy.pair} {row.original.strategy.timeframe}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <BotStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "_count.trades",
      header: "Trades",
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-[13px] text-slate-400">
          {row.original._count.trades}
        </span>
      ),
    },
    {
      accessorKey: "startedAt",
      header: ({ column }) => <SortableColumn column={column} title="Started" />,
      cell: ({ row }) => (
        <span className="text-[13px] text-slate-500">
          {row.original.startedAt
            ? new Date(row.original.startedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => <BotActions bot={row.original} onRefresh={onRefresh} />,
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BotsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["bots"],
    queryFn: async () => {
      const res = await fetch("/api/bots");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ bots: BotListItem[]; total: number }>;
    },
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["bots"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  const columns = useColumns(refresh);
  const bots = data?.bots ?? [];

  return (
    <div>
      <PageHeader
        title="Bots"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots" }]}
      />

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg skeleton" />
            ))}
          </div>
        ) : bots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-800 mb-4">
              <Bot className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">No bots deployed</p>
            <p className="text-[13px] text-slate-600 mt-1 max-w-xs">
              Open a strategy and click &ldquo;Deploy as Bot&rdquo; to get started.
            </p>
            <Link
              href="/dashboard/strategies"
              className="mt-4 inline-flex h-9 items-center gap-2 px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors"
            >
              View Strategies
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-slate-600 mb-4">
              Click <span className="text-primary-400">⚡</span> to simulate a price tick (dev) —
              start/stop with the play/stop buttons.
            </p>
            <DataTable columns={columns} data={bots} searchPlaceholder="Search bots…" />
          </>
        )}
      </div>
    </div>
  );
}
