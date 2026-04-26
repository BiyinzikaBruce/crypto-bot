"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table";
import { SortableColumn, ActionColumn } from "@/components/column-helpers";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BacktestListItem {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  winRate: number | null;
  totalTrades: number | null;
  fromDate: string;
  toDate: string;
  createdAt: string;
  strategy: { name: string; pair: string; timeframe: string };
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BacktestListItem["status"] }) {
  const styles: Record<string, string> = {
    PENDING: "bg-warning-500/10 text-warning-400 border-warning-500/20",
    RUNNING: "bg-primary-500/10 text-primary-400 border-primary-500/20",
    COMPLETED: "bg-profit-400/10 text-profit-400 border-profit-400/20",
    FAILED: "bg-loss-600/10 text-loss-400 border-loss-600/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border",
        styles[status]
      )}
    >
      {status === "RUNNING" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
      {status}
    </span>
  );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

function useColumns(onDelete: (id: string) => void): ColumnDef<BacktestListItem>[] {
  return [
    {
      accessorKey: "strategy.name",
      header: ({ column }) => <SortableColumn column={column} title="Strategy" />,
      cell: ({ row }) => (
        <Link
          href={`/dashboard/backtests/${row.original.id}`}
          className="font-medium text-[var(--foreground)] hover:text-primary-400 transition-colors"
        >
          {row.original.strategy.name}
        </Link>
      ),
    },
    {
      id: "pair",
      header: "Pair / TF",
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">
          {row.original.strategy.pair}{" "}
          <span className="text-slate-500">{row.original.strategy.timeframe}</span>
        </span>
      ),
    },
    {
      id: "dateRange",
      header: "Date Range",
      cell: ({ row }) => (
        <span className="text-[13px] text-slate-400 tabular-nums">
          {new Date(row.original.fromDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {" — "}
          {new Date(row.original.toDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "winRate",
      header: ({ column }) => <SortableColumn column={column} title="Win Rate" />,
      cell: ({ row }) =>
        row.original.winRate != null ? (
          <span
            className={cn(
              "font-mono tabular-nums text-[13px] font-semibold",
              row.original.winRate >= 50 ? "text-profit-400" : "text-loss-400"
            )}
          >
            {row.original.winRate.toFixed(1)}%
          </span>
        ) : (
          <span className="text-slate-600 text-[13px]">—</span>
        ),
    },
    {
      accessorKey: "totalTrades",
      header: "Trades",
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-[13px] text-slate-400">
          {row.original.totalTrades ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableColumn column={column} title="Run At" />,
      cell: ({ row }) => (
        <span className="text-[13px] text-slate-500">
          {new Date(row.original.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) =>
        row.original.status === "COMPLETED" ? (
          <ActionColumn
            editHref={`/dashboard/backtests/${row.original.id}`}
            onDelete={() => onDelete(row.original.id)}
            deleteLabel="Delete Backtest"
          />
        ) : (
          <ActionColumn onDelete={() => onDelete(row.original.id)} deleteLabel="Delete Backtest" />
        ),
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BacktestsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["backtests"],
    queryFn: async () => {
      const res = await fetch("/api/backtests");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ backtests: BacktestListItem[]; total: number }>;
    },
    refetchInterval: (query) => {
      const items = query.state.data?.backtests ?? [];
      const hasActive = items.some((b) => b.status === "PENDING" || b.status === "RUNNING");
      return hasActive ? 3000 : false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/backtests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Backtest deleted");
      queryClient.invalidateQueries({ queryKey: ["backtests"] });
    },
    onError: () => toast.error("Failed to delete backtest"),
  });

  const columns = useColumns((id) => deleteMutation.mutate(id));
  const backtests = data?.backtests ?? [];

  return (
    <div>
      <PageHeader
        title="Backtests"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Backtests" }]}
      />

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg skeleton" />
            ))}
          </div>
        ) : backtests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-800 mb-4">
              <FlaskConical className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">No backtests yet</p>
            <p className="text-[13px] text-slate-600 mt-1 max-w-xs">
              Open a strategy and click &ldquo;Run Backtest&rdquo; to start.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={backtests}
            searchPlaceholder="Search backtests…"
          />
        )}
      </div>
    </div>
  );
}
