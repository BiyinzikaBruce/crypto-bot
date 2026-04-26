"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/data-table";
import { SortableColumn, ActionColumn } from "@/components/column-helpers";
import { cn } from "@/lib/utils";
import type { StrategyListItem } from "@/lib/strategy";

// ─── Status badge ─────────────────────────────────────────────────────────────
function StrategyStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide",
        status === "ACTIVE"
          ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
          : "bg-slate-800 text-slate-400 border border-slate-700"
      )}
    >
      {status}
    </span>
  );
}

// ─── Columns ──────────────────────────────────────────────────────────────────
function useColumns(onDelete: (id: string) => void): ColumnDef<StrategyListItem>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableColumn column={column} title="Name" />,
      cell: ({ row }) => (
        <Link
          href={`/dashboard/strategies/${row.original.id}`}
          className="font-medium text-[var(--foreground)] hover:text-primary-400 transition-colors"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "pair",
      header: "Pair",
      cell: ({ row }) => (
        <span className="font-mono text-[13px] uppercase tracking-wide">
          {row.original.pair}
        </span>
      ),
    },
    {
      accessorKey: "timeframe",
      header: "Timeframe",
      cell: ({ row }) => (
        <span className="font-mono text-[13px]">{row.original.timeframe}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StrategyStatusBadge status={row.original.status} />,
    },
    {
      id: "rules",
      header: "Rules",
      cell: ({ row }) => (
        <span className="text-[13px] text-slate-400 tabular-nums font-mono">
          {row.original._count.rules_rel}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableColumn column={column} title="Created" />,
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
      cell: ({ row }) => (
        <ActionColumn
          editHref={`/dashboard/strategies/${row.original.id}/edit`}
          onDelete={() => onDelete(row.original.id)}
          deleteLabel="Delete Strategy"
        />
      ),
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StrategiesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["strategies"],
    queryFn: async () => {
      const res = await fetch("/api/strategies");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ strategies: StrategyListItem[]; total: number }>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Strategy deleted");
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
    onError: () => toast.error("Failed to delete strategy"),
  });

  const columns = useColumns((id) => deleteMutation.mutate(id));
  const strategies = data?.strategies ?? [];

  return (
    <div>
      <PageHeader
        title="Strategies"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Strategies" }]}
        action={
          <Link
            href="/dashboard/strategies/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors duration-150"
          >
            <Plus className="h-4 w-4" />
            New Strategy
          </Link>
        }
      />

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg skeleton" />
            ))}
          </div>
        ) : strategies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-800 mb-4">
              <GitBranch className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">No strategies yet</p>
            <p className="text-[13px] text-slate-600 mt-1 max-w-xs">
              Build your first no-code trading strategy to get started.
            </p>
            <Link
              href="/dashboard/strategies/new"
              className="mt-4 inline-flex h-9 items-center gap-2 px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors duration-150"
            >
              <Plus className="h-4 w-4" />
              Build a Strategy
            </Link>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={strategies}
            searchPlaceholder="Search strategies…"
          />
        )}
      </div>
    </div>
  );
}
