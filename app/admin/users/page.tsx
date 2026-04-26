"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  planExpiresAt: string | null;
  createdAt: string;
  emailVerified: boolean;
  _count: { bots: number; trades: number; strategies: number };
}

const PLAN_BADGE: Record<string, string> = {
  FREE: "bg-muted text-muted-foreground",
  BASIC: "bg-blue-500/10 text-blue-600",
  PRO: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

function EditCell({
  userId,
  field,
  value,
  options,
  onSave,
}: {
  userId: string;
  field: string;
  value: string;
  options: string[];
  onSave: (id: string, field: string, val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-transparent hover:border-border transition-colors"
      >
        {value}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute z-10 top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-md py-1 min-w-[90px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onSave(userId, field, opt);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors",
                opt === value && "font-medium text-primary"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ users: AdminUser[] }>({
    queryKey: ["admin-users", search, plan],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (plan) params.set("plan", plan);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const patchMutation = useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string;
      field: string;
      value: string;
    }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated");
    },
    onError: () => toast.error("Failed to update user"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.users.length ?? 0} users
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All plans</option>
          <option value="FREE">FREE</option>
          <option value="BASIC">BASIC</option>
          <option value="PRO">PRO</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["User", "Plan", "Role", "Verified", "Bots", "Trades", "Joined"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <EditCell
                      userId={u.id}
                      field="plan"
                      value={u.plan}
                      options={["FREE", "BASIC", "PRO"]}
                      onSave={(id, field, val) => patchMutation.mutate({ id, field, value: val })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <EditCell
                      userId={u.id}
                      field="role"
                      value={u.role}
                      options={["TRADER", "ADMIN"]}
                      onSave={(id, field, val) => patchMutation.mutate({ id, field, value: val })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-medium",
                        u.emailVerified
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {u.emailVerified ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u._count.bots}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u._count.trades}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}
