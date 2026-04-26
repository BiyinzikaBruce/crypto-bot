"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import {
  PAIRS,
  TIMEFRAMES,
  INDICATORS,
  CONDITIONS,
  LOGIC_OPS,
  INDICATOR_LABELS,
  CONDITION_LABELS,
  strategyFormSchema,
  type StrategyFormValues,
  type RuleFormValue,
} from "@/lib/strategy";

// ─── Shared input styling ─────────────────────────────────────────────────────
const sel =
  "h-10 rounded-lg text-sm bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] px-3 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/20 transition-colors cursor-pointer appearance-none";

const inp = (err?: boolean) =>
  cn(
    "h-10 rounded-lg text-sm px-3 bg-[var(--input-bg)] border text-[var(--input-text)]",
    "placeholder:text-slate-500 focus:outline-none focus:ring-[3px] transition-colors",
    err
      ? "border-loss-600 focus:border-loss-600 focus:ring-loss-600/20"
      : "border-[var(--input-border)] focus:border-primary-500 focus:ring-primary-500/20"
  );

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = ["Details", "Entry Rules", "Exit Rules", "Review"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                done
                  ? "bg-profit-400/20 text-profit-400"
                  : active
                    ? "bg-primary-500 text-white"
                    : "bg-slate-800 text-slate-500"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[13px] font-medium hidden sm:block",
                active ? "text-[var(--foreground)]" : "text-slate-500"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-8 mx-1 transition-colors",
                  done ? "bg-profit-400/30" : "bg-slate-700"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Rule row ─────────────────────────────────────────────────────────────────
function RuleRow({
  index,
  total,
  value,
  onChange,
  onRemove,
  errors,
}: {
  index: number;
  total: number;
  value: RuleFormValue;
  onChange: (v: RuleFormValue) => void;
  onRemove: () => void;
  errors?: { indicator?: { message?: string }; condition?: { message?: string }; value?: { message?: string } };
}) {
  return (
    <div className="space-y-2">
      {index > 0 && (
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-slate-700/50" />
          <select
            value={value.logicOperator}
            onChange={(e) => onChange({ ...value, logicOperator: e.target.value as "AND" | "OR" })}
            className="h-7 px-2 text-[11px] font-semibold uppercase tracking-wide rounded border border-slate-700 bg-slate-800 text-primary-400 focus:outline-none cursor-pointer"
          >
            {LOGIC_OPS.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
          <div className="h-px flex-1 bg-slate-700/50" />
        </div>
      )}

      <div className="flex items-start gap-2">
        <div className="grid grid-cols-3 gap-2 flex-1">
          {/* Indicator */}
          <div>
            <select
              value={value.indicator}
              onChange={(e) => onChange({ ...value, indicator: e.target.value as RuleFormValue["indicator"] })}
              className={cn(sel, "w-full", errors?.indicator && "border-loss-600")}
            >
              {INDICATORS.map((ind) => (
                <option key={ind} value={ind}>{INDICATOR_LABELS[ind]}</option>
              ))}
            </select>
            {errors?.indicator && (
              <p className="mt-0.5 text-[11px] text-loss-400">{errors.indicator.message}</p>
            )}
          </div>

          {/* Condition */}
          <div>
            <select
              value={value.condition}
              onChange={(e) => onChange({ ...value, condition: e.target.value as RuleFormValue["condition"] })}
              className={cn(sel, "w-full", errors?.condition && "border-loss-600")}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
              ))}
            </select>
            {errors?.condition && (
              <p className="mt-0.5 text-[11px] text-loss-400">{errors.condition.message}</p>
            )}
          </div>

          {/* Value */}
          <div>
            <input
              type="number"
              step="any"
              value={value.value}
              onChange={(e) => onChange({ ...value, value: Number(e.target.value) })}
              className={cn(inp(!!errors?.value), "w-full font-mono text-right")}
              placeholder="0"
            />
            {errors?.value && (
              <p className="mt-0.5 text-[11px] text-loss-400">{errors.value.message}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={total === 1}
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg text-slate-500 hover:text-loss-400 hover:bg-loss-600/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Remove rule"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Rules section used in steps 2 & 3 ───────────────────────────────────────
function RulesSection({
  fields,
  errors,
  onUpdate,
  onAppend,
  onRemove,
  ruleType,
}: {
  fields: (RuleFormValue & { id: string })[];
  errors?: Record<number, { indicator?: { message?: string }; condition?: { message?: string }; value?: { message?: string } }>;
  onUpdate: (i: number, v: RuleFormValue) => void;
  onAppend: () => void;
  onRemove: (i: number) => void;
  ruleType: "Entry" | "Exit";
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-0.5">
            Indicator / Condition / Value
          </p>
        </div>
        <button
          type="button"
          onClick={onAppend}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </button>
      </div>

      {fields.map((field, i) => (
        <RuleRow
          key={field.id}
          index={i}
          total={fields.length}
          value={field}
          onChange={(v) => onUpdate(i, v)}
          onRemove={() => onRemove(i)}
          errors={errors?.[i]}
        />
      ))}

      <p className="text-[12px] text-slate-600 pt-2">
        {ruleType} rule: bot {ruleType === "Entry" ? "opens" : "closes"} a trade when ALL/ANY conditions are met.
      </p>
    </div>
  );
}

// ─── Review step ──────────────────────────────────────────────────────────────
function ReviewStep({ values }: { values: StrategyFormValues }) {
  const renderRules = (rules: RuleFormValue[]) =>
    rules.map((r, i) => (
      <div key={i} className="text-[13px] text-slate-300">
        {i > 0 && (
          <span className="text-[11px] font-semibold uppercase text-primary-400 mr-2">
            {r.logicOperator}
          </span>
        )}
        <span className="font-mono text-slate-400">{INDICATOR_LABELS[r.indicator]}</span>{" "}
        <span className="text-slate-500">{CONDITION_LABELS[r.condition]}</span>{" "}
        <span className="font-mono tabular-nums">{r.value}</span>
      </div>
    ));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Name", value: values.name },
          { label: "Pair", value: values.pair, mono: true },
          { label: "Timeframe", value: values.timeframe, mono: true },
        ].map(({ label, value, mono }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
            <p className={cn("text-sm font-medium text-[var(--foreground)]", mono && "font-mono")}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">Entry Rules</p>
        <div className="space-y-1">{renderRules(values.entryRules)}</div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-3">Exit Rules</p>
        <div className="space-y-1">{renderRules(values.exitRules)}</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const DEFAULT_RULE: RuleFormValue = {
  indicator: "RSI",
  condition: "GREATER_THAN",
  value: 50,
  logicOperator: "AND",
};

export default function NewStrategyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues: {
      name: "",
      pair: "XAUUSD",
      timeframe: "H1",
      entryRules: [{ ...DEFAULT_RULE }],
      exitRules: [{ ...DEFAULT_RULE, condition: "LESS_THAN", value: 30 }],
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const entryFields = useFieldArray({ control: form.control, name: "entryRules" });
  const exitFields = useFieldArray({ control: form.control, name: "exitRules" });

  const values = watch();

  async function nextStep() {
    let valid = false;
    if (step === 0) valid = await trigger(["name", "pair", "timeframe"]);
    else if (step === 1) valid = await trigger("entryRules");
    else if (step === 2) valid = await trigger("exitRules");
    else valid = true;
    if (valid) setStep((s) => s + 1);
  }

  async function onSubmit(data: StrategyFormValues) {
    setSaving(true);
    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          pair: data.pair,
          timeframe: data.timeframe,
          entryRules: data.entryRules.map((r) => ({ ...r, ruleType: "ENTRY" })),
          exitRules: data.exitRules.map((r) => ({ ...r, ruleType: "EXIT" })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.error === "PLAN_LIMIT") {
          toast.error(err.message);
          return;
        }
        throw new Error(err.error ?? "Failed to save");
      }

      const created = await res.json();
      toast.success("Strategy created");
      router.push(`/dashboard/strategies/${created.id}`);
    } catch {
      toast.error("Failed to create strategy");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="New Strategy"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Strategies", href: "/dashboard/strategies" },
          { label: "New" },
        ]}
      />

      <div className="mt-8 max-w-2xl">
        <StepIndicator current={step} />

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* ── Step 0: Details ─────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">
                  Strategy Details
                </h2>

                <div>
                  <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
                    Strategy Name
                  </label>
                  <input
                    {...register("name")}
                    placeholder="e.g. RSI Breakout XAUUSD"
                    className={cn(inp(!!errors.name), "w-full")}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[12px] text-loss-400">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
                      Trading Pair
                    </label>
                    <select {...register("pair")} className={cn(sel, "w-full")}>
                      {PAIRS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    {errors.pair && (
                      <p className="mt-1 text-[12px] text-loss-400">{errors.pair.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
                      Timeframe
                    </label>
                    <select {...register("timeframe")} className={cn(sel, "w-full")}>
                      {TIMEFRAMES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {errors.timeframe && (
                      <p className="mt-1 text-[12px] text-loss-400">{errors.timeframe.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Entry Rules ──────────────────────────────── */}
            {step === 1 && (
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">
                  Entry Rules
                </h2>
                <p className="text-[13px] text-slate-500 mb-5">
                  Define when the bot should open a trade.
                </p>
                <RulesSection
                  fields={entryFields.fields.map((f, i) => ({ ...f, ...values.entryRules[i] }))}
                  errors={errors.entryRules as Record<number, { indicator?: { message?: string }; condition?: { message?: string }; value?: { message?: string } }>}
                  onUpdate={(i, v) => setValue(`entryRules.${i}`, v)}
                  onAppend={() => entryFields.append({ ...DEFAULT_RULE })}
                  onRemove={(i) => entryFields.remove(i)}
                  ruleType="Entry"
                />
                {errors.entryRules?.root && (
                  <p className="mt-2 text-[12px] text-loss-400">{errors.entryRules.root.message}</p>
                )}
              </div>
            )}

            {/* ── Step 2: Exit Rules ───────────────────────────────── */}
            {step === 2 && (
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">
                  Exit Rules
                </h2>
                <p className="text-[13px] text-slate-500 mb-5">
                  Define when the bot should close a trade.
                </p>
                <RulesSection
                  fields={exitFields.fields.map((f, i) => ({ ...f, ...values.exitRules[i] }))}
                  errors={errors.exitRules as Record<number, { indicator?: { message?: string }; condition?: { message?: string }; value?: { message?: string } }>}
                  onUpdate={(i, v) => setValue(`exitRules.${i}`, v)}
                  onAppend={() => exitFields.append({ ...DEFAULT_RULE })}
                  onRemove={(i) => exitFields.remove(i)}
                  ruleType="Exit"
                />
                {errors.exitRules?.root && (
                  <p className="mt-2 text-[12px] text-loss-400">{errors.exitRules.root.message}</p>
                )}
              </div>
            )}

            {/* ── Step 3: Review ───────────────────────────────────── */}
            {step === 3 && (
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">
                  Review & Save
                </h2>
                <p className="text-[13px] text-slate-500 mb-5">
                  Check your strategy before saving.
                </p>
                <ReviewStep values={values} />
              </div>
            )}

            {/* ── Footer navigation ────────────────────────────────── */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Strategy
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
