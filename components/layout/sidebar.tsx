"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  GitBranch,
  Bot,
  TrendingUp,
  FlaskConical,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Trading",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/strategies", label: "Strategies", icon: GitBranch },
      { href: "/dashboard/bots", label: "Bots", icon: Bot },
      { href: "/dashboard/trades", label: "Trades", icon: TrendingUp },
      { href: "/dashboard/backtests", label: "Backtests", icon: FlaskConical },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  user?: { name: string; email: string; plan: string; image?: string };
}

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full border-r transition-all duration-200 ease-in-out",
        "bg-[var(--sidebar-bg)] border-[var(--sidebar-border)]",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo block */}
      <div
        className={cn(
          "flex items-center h-[60px] border-b border-[var(--sidebar-border)] px-4 shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-primary-400">
              FXAU
            </span>
          </Link>
        )}
        {collapsed && (
          <span className="text-lg font-bold text-primary-400">FX</span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-[72px] z-10 flex h-6 w-6 items-center justify-center",
          "rounded-full border bg-[var(--card)] border-[var(--card-border)]",
          "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          "transition-colors duration-150"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors duration-150",
                        active
                          ? [
                              "bg-primary-500/10 text-primary-400",
                              "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2",
                              "before:h-5 before:w-0.5 before:rounded-full before:bg-primary-500",
                            ]
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                        collapsed && "justify-center px-0"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon
                        className={cn(
                          "shrink-0",
                          collapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
                          active
                            ? "text-primary-400"
                            : "text-slate-500 group-hover:text-slate-300"
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: theme toggle + user */}
      <div className="shrink-0 border-t border-[var(--sidebar-border)] p-3 space-y-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex items-center gap-3 h-10 w-full px-3 rounded-lg",
            "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
            "text-sm font-medium transition-colors duration-150",
            collapsed && "justify-center px-0"
          )}
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px] shrink-0" />
          ) : (
            <Moon className="h-[18px] w-[18px] shrink-0" />
          )}
          {!collapsed && (
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          )}
        </button>

        {/* User block */}
        {user && (
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg",
              collapsed && "justify-center px-0"
            )}
          >
            <div className="relative shrink-0">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user.name}
                </p>
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded",
                    user.plan === "PRO"
                      ? "bg-primary-500/20 text-primary-400"
                      : user.plan === "BASIC"
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-800 text-slate-500"
                  )}
                >
                  {user.plan}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sign out */}
        <button
          className={cn(
            "flex items-center gap-3 h-10 w-full px-3 rounded-lg",
            "text-slate-400 hover:bg-loss-600/10 hover:text-loss-400",
            "text-sm font-medium transition-colors duration-150",
            collapsed && "justify-center px-0"
          )}
          aria-label="Sign out"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
