"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot, FlaskConical, Pencil, Trash2, Loader2,
  ArrowUpCircle, ArrowDownCircle, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rule {
  id: string;
  indicator: string;
  condition: string;
  value: number;
  logicOperator: string;
  ruleType: "ENTRY" | "EXIT";
}

interface Strategy {
  id: string;
  name: string;
  pair: string;
  timeframe: string;
  status: "DRAFT" | "ACTIVE";
  createdAt: string;
  rules_rel: Rule[];
  _count: { backtests: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONDITION_LABEL: Record<string, string> = {
  CROSSES_ABOVE: "crosses above",
  CROSSES_BELOW: "crosses below",
  GREATER_THAN: ">",
  LESS_THAN: "<",
};

function RuleRow({ rule, index }: { rule: Rule; index: number }) {
  const isEntry = rule.ruleType === "ENTRY";
  return (
    <div className="flex items-center gap-3 py-3">
      {index > 0 ? (
        <span className="min-w-[32px] text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {rule.logicOperator}
        </span>
      ) : (
        <span className="min-w-[32px]" />
      )}
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide",
          isEntry ? "bg-profit-400/10 text-profit-400" : "bg-loss-600/10 text-loss-400"
        )}
      >
        {rule.indicator}
      </span>
      <span className="text-[13px] text-slate-400">
        {CONDITION_LABEL[rule.condition] ?? rule.condition}
      </span>
      <span className="font-mono text-[13px] font-semibold text-[var(--foreground)]">
        {rule.value}
      </span>
    </div>
  );
}

function RulesSection({ rules, type }: { rules: Rule[]; type: "ENTRY" | "EXIT" }) {
  const filtered = rules.filter((r) => r.ruleType === type);
  const isEntry = type === "ENTRY";

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3 border-b border-[var(--card-border)]",
          isEntry ? "bg-profit-400/5" : "bg-loss-600/5"
        )}
      >
        {isEntry
          ? <ArrowUpCircle className="h-4 w-4 text-profit-400" />
          : <ArrowDownCircle className="h-4 w-4 text-loss-400" />
        }
        <span className="text-sm font-semibold">
          {isEntry ? "Entry Rules" : "Exit Rules"}
        </span>
        <span className="ml-auto text-[11px] text-slate-500">
          {filtered.length} rule{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="px-4 divide-y divide-[var(--card-border)]">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-slate-600">No rules defined</p>
        ) : (
          filtered.map((rule, i) => <RuleRow key={rule.id} rule={rule} index={i} />)
        )}
      </div>
    </div>
  );
}

// ─── Deploy as Bot dialog ─────────────────────────────────────────────────────

function DeployBotDialog({
  strategy,
  open,
  onClose,
}: {
  strategy: Strategy;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [botName, setBotName] = useState(`${strategy.name} Bot`);
  const [loading, setLoading] = useState(false);

  async function deploy() {
    setLoading(true);
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: strategy.id, name: botName }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "MT5_REQUIRED") {
          toast.error("Connect your MT5 account first — go to Settings.");
          return;
        }
        if (data.error === "PLAN_LIMIT") {
          toast.error(data.message);
          return;
        }
        throw new Error(data.error);
      }
      toast.success("Bot deployed! Go to Bots to start it.");
      onClose();
      router.push("/dashboard/bots");
    } catch {
      toast.error("Failed to deploy bot");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deploy as Bot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-slate-800/60 px-3 py-2.5 text-[13px] text-slate-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Strategy</span>
              <span className="text-[var(--foreground)] font-medium">{strategy.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Pair</span>
              <span className="text-[var(--foreground)] font-medium">{strategy.pair}</span>
            </div>
            <div className="flex justify-between">
              <span>Timeframe</span>
              <span className="text-[var(--foreground)] font-medium">{strategy.timeframe}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-slate-300">Bot name</label>
            <input
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--card-border)] bg-slate-800/60 px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-sm text-slate-400 hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={deploy}
            disabled={loading || !botName.trim()}
            className="h-9 px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Deploy Bot
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Run Backtest dialog ───────────────────────────────────────────────────────

function BacktestDialog({
  strategy,
  open,
  onClose,
}: {
  strategy: Strategy;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(sixMonthsAgo);
  const [toDate, setToDate] = useState(today);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/backtests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: strategy.id, fromDate, toDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Backtest started — check the Backtests page for results.");
      onClose();
      router.push("/dashboard/backtests");
    } catch {
      toast.error("Failed to start backtest");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Run Backtest</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-[13px] text-slate-400">
            Simulate{" "}
            <span className="text-[var(--foreground)] font-medium">{strategy.name}</span> on{" "}
            {strategy.pair} {strategy.timeframe} over a historical date range.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-300">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--card-border)] bg-slate-800/60 px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-300">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--card-border)] bg-slate-800/60 px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-sm text-slate-400 hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={run}
            disabled={loading || !fromDate || !toDate}
            className="h-9 px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Run Backtest
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StrategyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deployOpen, setDeployOpen] = useState(false);
  const [backtestOpen, setBacktestOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: strategy, isLoading, isError } = useQuery({
    queryKey: ["strategy", id],
    queryFn: async () => {
      const res = await fetch(`/api/strategies/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<Strategy>;
    },
  });

  async function handleDelete() {
    if (!confirm("Delete this strategy? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Strategy deleted");
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      router.push("/dashboard/strategies");
    } catch {
      toast.error("Failed to delete strategy");
      setDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 rounded-lg skeleton mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl skeleton" />)}
        </div>
      </div>
    );
  }

  if (isError || !strategy) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 mb-4">Strategy not found.</p>
        <Link href="/dashboard/strategies" className="text-primary-400 text-sm hover:underline">
          Back to Strategies
        </Link>
      </div>
    );
  }

  const entryRules = strategy.rules_rel.filter((r) => r.ruleType === "ENTRY");
  const exitRules = strategy.rules_rel.filter((r) => r.ruleType === "EXIT");
  const hasNoRules = entryRules.length === 0 || exitRules.length === 0;

  return (
    <div>
      <PageHeader
        title={strategy.name}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Strategies", href: "/dashboard/strategies" },
          { label: strategy.name },
        ]}
      />

      {/* Meta row */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border bg-slate-800 text-slate-400 border-slate-700">
          {strategy.status}
        </span>
        <span className="font-mono text-sm text-slate-400">{strategy.pair}</span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
        <span className="font-mono text-sm text-slate-400">{strategy.timeframe}</span>
        <span className="text-slate-600 text-[13px] ml-1">
          · {strategy.rules_rel.length} rule{strategy.rules_rel.length !== 1 ? "s" : ""}
          {" · "}
          {strategy._count.backtests} backtest{strategy._count.backtests !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setDeployOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
        >
          <Bot className="h-4 w-4" />
          Deploy as Bot
        </button>
        <button
          onClick={() => setBacktestOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-[var(--foreground)] transition-colors"
        >
          <FlaskConical className="h-4 w-4" />
          Run Backtest
        </button>
        <Link
          href={`/dashboard/strategies/${id}/edit`}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-[var(--foreground)] transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium text-loss-400 hover:bg-loss-600/10 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete
        </button>
      </div>

      {/* Warning if strategy is incomplete */}
      {hasNoRules && (
        <div className="mt-4 rounded-lg border border-warning-500/30 bg-warning-500/5 px-4 py-3 text-[13px] text-warning-400">
          This strategy is missing {entryRules.length === 0 ? "entry" : "exit"} rules. Edit it before deploying a bot.
        </div>
      )}

      {/* Rules */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <RulesSection rules={strategy.rules_rel} type="ENTRY" />
        <RulesSection rules={strategy.rules_rel} type="EXIT" />
      </div>

      {/* Dialogs */}
      {deployOpen && (
        <DeployBotDialog
          strategy={strategy}
          open={deployOpen}
          onClose={() => setDeployOpen(false)}
        />
      )}
      {backtestOpen && (
        <BacktestDialog
          strategy={strategy}
          open={backtestOpen}
          onClose={() => setBacktestOpen(false)}
        />
      )}
    </div>
  );
}
