"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSubscription {
  id: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  startsAt: string;
  expiresAt: string | null;
  stripeSubscriptionId: string | null;
  user: { id: string; name: string; email: string };
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-600",
  CANCELLED: "bg-red-500/10 text-red-500",
  EXPIRED: "bg-slate-500/10 text-slate-500",
};

const PLAN_BADGE: Record<string, string> = {
  BASIC: "bg-blue-500/10 text-blue-600",
  PRO: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

export default function AdminSubscriptionsPage() {
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<{ subscriptions: AdminSubscription[]; mrr: number }>({
    queryKey: ["admin-subscriptions", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/subscriptions?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.subscriptions.length ?? 0} subscriptions
        </p>
      </div>

      {data && (
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 w-fit">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
            <DollarSign size={18} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Monthly Recurring Revenue</div>
            <div className="text-2xl font-bold">
              ${data.mrr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">All statuses</option>
        <option value="ACTIVE">ACTIVE</option>
        <option value="CANCELLED">CANCELLED</option>
        <option value="EXPIRED">EXPIRED</option>
      </select>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["User", "Plan", "Status", "Amount", "Started", "Expires", "Stripe ID"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.user.name}</div>
                    <div className="text-xs text-muted-foreground">{s.user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        PLAN_BADGE[s.plan] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        STATUS_BADGE[s.status] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ${s.amount.toFixed(2)}
                    <span className="text-xs text-muted-foreground ml-1">{s.currency.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(s.startsAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {s.stripeSubscriptionId ? s.stripeSubscriptionId.slice(0, 18) + "…" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.subscriptions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No subscriptions found</div>
          )}
        </div>
      )}
    </div>
  );
}
