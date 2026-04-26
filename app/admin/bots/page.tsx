"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminBot {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  strategy: { name: string; pair: string } | null;
  _count: { trades: number };
}

const STATUS_DOT: Record<string, string> = {
  RUNNING: "bg-green-500",
  STOPPED: "bg-slate-400",
  ERROR: "bg-red-500",
};

export default function AdminBotsPage() {
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<{ bots: AdminBot[] }>({
    queryKey: ["admin-bots", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/bots?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bots</h1>
        <p className="text-sm text-muted-foreground mt-1">{data?.bots.length ?? 0} bots</p>
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">All statuses</option>
        <option value="RUNNING">RUNNING</option>
        <option value="STOPPED">STOPPED</option>
        <option value="ERROR">ERROR</option>
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
                {["Bot", "Status", "Owner", "Strategy", "Trades", "Created"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.bots.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", STATUS_DOT[b.status] ?? "bg-muted")} />
                      <span className="text-xs">{b.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{b.user.name}</div>
                    <div className="text-xs text-muted-foreground">{b.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.strategy ? `${b.strategy.name} (${b.strategy.pair})` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b._count.trades}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.bots.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No bots found</div>
          )}
        </div>
      )}
    </div>
  );
}
