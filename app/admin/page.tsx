"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Bot, TrendingUp, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewData {
  totalUsers: number;
  totalBots: number;
  runningBots: number;
  totalTrades: number;
  totalSubscriptions: number;
  recentUsers: { id: string; name: string; email: string; plan: string; createdAt: string }[];
  planCounts: { plan: string; _count: { _all: number } }[];
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-slate-500",
  BASIC: "bg-blue-500",
  PRO: "bg-yellow-500",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon size={16} />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const planMap = Object.fromEntries(data.planCounts.map((p) => [p.plan, p._count._all]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data.totalUsers} icon={Users} />
        <StatCard
          label="Active Bots"
          value={data.runningBots}
          sub={`${data.totalBots} total`}
          icon={Bot}
        />
        <StatCard label="Total Trades" value={data.totalTrades} icon={TrendingUp} />
        <StatCard
          label="Paid Subscribers"
          value={data.totalSubscriptions}
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Users by Plan</h2>
          <div className="space-y-3">
            {["FREE", "BASIC", "PRO"].map((plan) => {
              const count = planMap[plan] ?? 0;
              const pct = data.totalUsers > 0 ? (count / data.totalUsers) * 100 : 0;
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{plan}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", PLAN_COLORS[plan])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Recent Sign-ups</h2>
          <div className="space-y-3">
            {data.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      u.plan === "PRO"
                        ? "bg-yellow-500/10 text-yellow-600"
                        : u.plan === "BASIC"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {u.plan}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
