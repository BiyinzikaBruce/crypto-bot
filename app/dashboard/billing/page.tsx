"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { Loader2, CheckCircle2, Zap, Star, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { PLAN_FEATURES, PLAN_NAMES, PLAN_PRICES } from "@/lib/stripe";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = "FREE" | "BASIC" | "PRO";

const PLAN_ICONS: Record<Plan, React.ElementType> = {
  FREE: Shield,
  BASIC: Zap,
  PRO: Star,
};

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  currentPlan,
  onUpgrade,
  onManage,
  isLoading,
}: {
  plan: Plan;
  currentPlan: Plan;
  onUpgrade: (plan: Plan) => void;
  onManage: () => void;
  isLoading: boolean;
}) {
  const Icon = PLAN_ICONS[plan];
  const price = PLAN_PRICES[plan];
  const features = PLAN_FEATURES[plan];
  const isCurrent = plan === currentPlan;
  const isDowngrade =
    (currentPlan === "PRO" && plan === "BASIC") ||
    (currentPlan === "PRO" && plan === "FREE") ||
    (currentPlan === "BASIC" && plan === "FREE");

  return (
    <div
      className={cn(
        "rounded-xl border p-6 flex flex-col gap-4 transition-colors",
        isCurrent
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            plan === "PRO"
              ? "bg-yellow-500/10 text-yellow-500"
              : plan === "BASIC"
              ? "bg-blue-500/10 text-blue-500"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{PLAN_NAMES[plan]}</span>
            {isCurrent && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Current
              </span>
            )}
          </div>
          <span className="text-2xl font-bold">
            {price === 0 ? "Free" : `$${price}`}
            {price > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
          </span>
        </div>
      </div>

      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-500" />
            {f}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        plan !== "FREE" ? (
          <button
            onClick={onManage}
            disabled={isLoading}
            className="w-full py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            Manage subscription
          </button>
        ) : (
          <div className="w-full py-2 rounded-lg bg-muted text-center text-sm text-muted-foreground">
            Current plan
          </div>
        )
      ) : isDowngrade ? (
        <button
          onClick={onManage}
          disabled={isLoading}
          className="w-full py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          Manage subscription
        </button>
      ) : (
        <button
          onClick={() => onUpgrade(plan)}
          disabled={isLoading}
          className={cn(
            "w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
            plan === "PRO"
              ? "bg-yellow-500 hover:bg-yellow-600 text-black"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
          Upgrade to {PLAN_NAMES[plan]}
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { data: sessionData } = useSession();
  const searchParams = useSearchParams();
  const user = sessionData?.user as
    | { plan?: string; planExpiresAt?: string | null }
    | undefined;
  const currentPlan = (user?.plan ?? "FREE") as Plan;

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Subscription activated! Your plan has been upgraded.");
    } else if (searchParams.get("cancelled") === "1") {
      toast.info("Checkout cancelled — no charge was made.");
    }
  }, [searchParams]);

  const checkoutMutation = useMutation({
    mutationFn: async (plan: Plan) => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed");
      }
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed");
      }
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to open billing portal");
    },
  });

  const isLoading = checkoutMutation.isPending || portalMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" />

      {user?.planExpiresAt && currentPlan !== "FREE" && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
          Your {PLAN_NAMES[currentPlan]} plan renews on{" "}
          {new Date(user.planExpiresAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          .
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {(["FREE", "BASIC", "PRO"] as Plan[]).map((plan) => (
          <PlanCard
            key={plan}
            plan={plan}
            currentPlan={currentPlan}
            onUpgrade={(p) => checkoutMutation.mutate(p)}
            onManage={() => portalMutation.mutate()}
            isLoading={isLoading}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Payments are processed securely by Stripe. You can cancel or change your plan at any time
        from the billing portal. Downgrading to Free will stop all running bots.
      </p>
    </div>
  );
}
