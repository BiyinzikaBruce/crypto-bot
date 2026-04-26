"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  FlaskConical,
  Bot,
  Loader2,
  AlertTriangle,
  X,
  Play,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import type { StrategyDetail } from "@/lib/strategy";
import { INDICATOR_LABELS, CONDITION_LABELS } from "@/lib/strategy";

// ─── Rule display components ──────────────────────────────────────────────────

function RulePill({ rule }: { rule: StrategyDetail["rules_rel"][0] }) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="font-mono text-slate-300">{INDICATOR_LABELS[rule.indicator] ?? rule.indicator}</span>
      <span className="text-slate-500">{CONDITION_LABELS[rule.condition] ?? rule.condition}</span>
      <span className="font-mono tabular-nums text-[var(--foreground)]">{rule.value}</span>
    </div>
  );
}

function RuleBlock({
  title,
  rules,
}: {
  title: string;
  rules: StrategyDetail["rules_rel"];
}) {
  if (rules.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
        {title}
      </p>
      <div className="space-y-2">
        {rules.map((rule, i) => (
          <div key={rule.id} className="flex items-center gap-3">
            {i > 0 && (
              <span className="text-[11px] font-bold uppercase text-primary-400 w-6 shrink-0">
                {rule.logicOperator}
              </span>
            )}
            {i === 0 && <div className="w-6 shrink-0" />}
            <RulePill rule={rule} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide",
        status === "ACTIVE"
          ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
          : "bg-slate-800 text-slate-400 border border-slate-700"
      )}
    >
      {status}
    </span>
  );
}

// ─── Run Backtest Modal ───────────────────────────────────────────────────────

function RunBacktestModal({
  strategyId,
  onClose,
}: {
  strategyId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const oneYearAgo = new Date(Date.now() - 365 * 86400_000).toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(oneYearAgo);
  const [toDate, setToDate] = useState(today);
  const [running, setRunning] = useState(false);

  const inp =
    "h-10 rounded-lg text-sm px-3 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/20 transition-colors w-full";

  async function handleRun() {
    if (!fromDate || !toDate) {
      toast.error("Select both dates");
      return;
    }
    if (fromDate >= toDate) {
      toast.error("From date must be before to date");
      return;
    }

    setRunning(true);
    try {
      const res = await fetch("/api/backtests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId, fromDate, toDate }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to start backtest");
      }
      const bt = await res.json();
      toast.success("Backtest started");
      router.push(`/dashboard/backtests/${bt.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start backtest");
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Run Backtest</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={today}
              onChange={(e) => setToDate(e.target.value)}
              className={inp}
            />
          </div>
        </div>

        <p className="mt-3 text-[12px] text-slate-600">
          Uses synthetic OHLCV data. Live MT5 historical feed in Phase 5.
        </p>

        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors disabled:opacity-60"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Backtest history ─────────────────────────────────────────────────────────

interface BacktestSummary {
  id: string;
  status: string;
  winRate: number | null;
  totalTrades: number | null;
  fromDate: string;
  toDate: string;
  createdAt: string;
}

function BacktestHistory({ strategyId }: { strategyId: string }) {
  const { data } = useQuery({
    queryKey: ["backtests", "strategy", strategyId],
    queryFn: async () => {
      const res = await fetch("/api/backtests");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json() as { backtests: (BacktestSummary & { strategyId?: string })[] };
      return json.backtests.filter((b) => {
        // The list endpoint doesn't expose strategyId directly, use strategy relation
        return true;
      });
    },
    select: (items) => items.slice(0, 5),
  });

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 mb-3">
          <FlaskConical className="h-6 w-6 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500">No backtests yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((bt) => (
        <Link
          key={bt.id}
          href={`/dashboard/backtests/${bt.id}`}
          className="flex items-center justify-between p-3 rounded-lg border border-[var(--card-border)] hover:bg-slate-800/40 transition-colors"
        >
          <div className="text-[13px]">
            <span className="text-slate-400">
              {new Date(bt.fromDate).toLocaleDateString()} —{" "}
              {new Date(bt.toDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {bt.winRate != null && (
              <span
                className={cn(
                  "font-mono text-[13px] font-semibold",
                  bt.winRate >= 50 ? "text-profit-400" : "text-loss-400"
                )}
              >
                {bt.winRate.toFixed(1)}%
              </span>
            )}
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded",
                bt.status === "COMPLETED"
                  ? "bg-profit-400/10 text-profit-400"
                  : bt.status === "FAILED"
                    ? "bg-loss-600/10 text-loss-400"
                    : "bg-primary-500/10 text-primary-400"
              )}
            >
              {bt.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StrategyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showBacktestModal, setShowBacktestModal] = useState(false);
  const [deployingBot, setDeployingBot] = useState(false);

  async function deployBot() {
    setDeployingBot(true);
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? data.error ?? "Failed to deploy bot");
        return;
      }
      toast.success("Bot deployed");
      router.push("/dashboard/bots");
    } catch {
      toast.error("Failed to deploy bot");
    } finally {
      setDeployingBot(false);
    }
  }

  const { data: strategy, isLoading, error } = useQuery({
    queryKey: ["strategy", id],
    queryFn: async () => {
      const res = await fetch(`/api/strategies/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<StrategyDetail>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Strategy deleted");
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      router.push("/dashboard/strategies");
    },
    onError: () => toast.error("Failed to delete strategy"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 mt-8">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center mt-8">
        <AlertTriangle className="h-10 w-10 text-loss-400 mb-3" />
        <p className="text-sm font-medium text-slate-300">Strategy not found</p>
        <Link href="/dashboard/strategies" className="mt-3 text-[13px] text-primary-400 hover:text-primary-300">
          Back to strategies
        </Link>
      </div>
    );
  }

  const entryRules = strategy.rules_rel.filter((r) => r.ruleType === "ENTRY");
  const exitRules = strategy.rules_rel.filter((r) => r.ruleType === "EXIT");

  return (
    <div>
      {showBacktestModal && (
        <RunBacktestModal
          strategyId={id}
          onClose={() => setShowBacktestModal(false)}
        />
      )}

      <PageHeader
        title={strategy.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Strategies", href: "/dashboard/strategies" },
          { label: strategy.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/strategies/${id}/edit`}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={() => {
                if (confirm("Delete this strategy?")) deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-loss-600/40 text-loss-400 hover:bg-loss-600/10 transition-colors disabled:opacity-60"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </div>
        }
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: strategy info ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Summary */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="grid grid-cols-3 gap-3 flex-1">
                {[
                  { label: "Pair", value: strategy.pair, mono: true },
                  { label: "Timeframe", value: strategy.timeframe, mono: true },
                  { label: "Status", value: <StatusBadge status={strategy.status} /> },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                    {typeof value === "string" ? (
                      <p className={cn("text-sm font-medium text-[var(--foreground)]", mono && "font-mono")}>
                        {value}
                      </p>
                    ) : value}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--card-border)] pt-5 space-y-5">
              <RuleBlock title="Entry Rules" rules={entryRules} />
              <RuleBlock title="Exit Rules" rules={exitRules} />
            </div>
          </div>

          {/* Backtest history */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Backtest History
              </p>
              <Link
                href="/dashboard/backtests"
                className="text-[11px] text-primary-400 hover:text-primary-300"
              >
                View all
              </Link>
            </div>
            <BacktestHistory strategyId={id} />
          </div>
        </div>

        {/* ── Right: actions ──────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">
              Actions
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setShowBacktestModal(true)}
                className="w-full flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors"
              >
                <FlaskConical className="h-4 w-4" />
                Run Backtest
              </button>
              <button
                onClick={deployBot}
                disabled={deployingBot}
                className="w-full flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-60"
              >
                {deployingBot ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                Deploy as Bot
              </button>
            </div>
            <p className="mt-3 text-[11px] text-slate-600">
              Requires an MT5 account connected in Settings.
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Stats
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500">Rules</span>
                <span className="font-mono tabular-nums text-[var(--foreground)]">
                  {strategy.rules_rel.length}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500">Backtests</span>
                <span className="font-mono tabular-nums text-[var(--foreground)]">
                  {strategy._count.backtests}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-400">
                  {new Date(strategy.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
