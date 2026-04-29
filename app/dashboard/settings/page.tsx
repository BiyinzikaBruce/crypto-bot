"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { Loader2, Link2, Link2Off, CheckCircle2, XCircle, Send, Key, Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

// ─── MT5 server list ────────────────────────────────────────────────────────
const MT5_SERVERS = [
  "ICMarkets-Demo",
  "ICMarkets-Live",
  "Exness-MT5Real",
  "Exness-MT5Demo",
  "XM.COM-MT5 1",
  "XM.COM-MT5 Demo",
  "Pepperstone-MT5-01",
  "Pepperstone-MT5-Demo01",
  "FusionMarkets-Live",
  "FusionMarkets-Demo",
  "Tickmill-MT5 Live",
  "Tickmill-MT5 Demo",
  "FP Markets-Live Server",
  "FP Markets-Demo Server",
  "Vantage-Live",
  "Vantage-Demo",
  "OctaFX-MT5",
  "OctaFX-MT5Demo",
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface MT5Account {
  id: string;
  server: string;
  isConnected: boolean;
  lastConnectedAt: string | null;
}

const connectSchema = z.object({
  login: z.string().min(1, "MT5 login is required"),
  password: z.string().min(1, "MT5 password is required"),
  server: z.string().min(1, "Select an MT5 server"),
});

type ConnectForm = z.infer<typeof connectSchema>;

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function fetchMT5Account(): Promise<{ account: MT5Account | null }> {
  const res = await fetch("/api/mt5");
  if (!res.ok) throw new Error("Failed to fetch MT5 account");
  return res.json();
}

async function connectMT5(data: ConnectForm) {
  const res = await fetch("/api/mt5/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Connection failed");
  }
  return res.json();
}

async function disconnectMT5() {
  const res = await fetch("/api/mt5/disconnect", { method: "POST" });
  if (!res.ok) throw new Error("Disconnect failed");
  return res.json();
}

// ─── Components ───────────────────────────────────────────────────────────────
function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide",
        connected
          ? "bg-[#052e16] text-profit-400 border border-profit-400/20"
          : "bg-slate-800 text-slate-400 border border-slate-600/30"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          connected ? "bg-profit-400 bot-running-dot" : "bg-slate-500"
        )}
      />
      {connected ? "Connected" : "Disconnected"}
    </span>
  );
}

function inputCls(hasError?: boolean) {
  return cn(
    "w-full h-10 px-3 rounded-lg text-sm",
    "bg-[var(--input-bg)] border text-[var(--input-text)]",
    "placeholder:text-slate-500 transition-colors duration-150",
    "focus:outline-none focus:ring-[3px]",
    hasError
      ? "border-loss-600 focus:border-loss-600 focus:ring-loss-600/20"
      : "border-[var(--input-border)] focus:border-primary-500 focus:ring-primary-500/20"
  );
}

// ─── Telegram section ─────────────────────────────────────────────────────────

function TelegramSection() {
  const { data: sessionData, refetch: refetchSession } = useSession();
  const telegramChatId = (sessionData?.user as { telegramChatId?: string | null } | undefined)?.telegramChatId ?? null;
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function generateLink() {
    setGenerating(true);
    try {
      const res = await fetch("/api/telegram/link");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { deepLink: string | null; token: string; botUsername: string };
      if (data.deepLink) {
        setDeepLink(data.deepLink);
      } else {
        toast.error("TELEGRAM_BOT_USERNAME not configured. Set it in .env.local.");
      }
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/telegram/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Telegram disconnected");
      setDeepLink(null);
      refetchSession();
    } catch {
      toast.error("Failed to disconnect Telegram");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Telegram Notifications</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Receive trade alerts and bot status updates via Telegram.
          </p>
        </div>
        {telegramChatId && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[#052e16] text-profit-400 border border-profit-400/20">
            <span className="h-1.5 w-1.5 rounded-full bg-profit-400 bot-running-dot" />
            Connected
          </span>
        )}
      </div>

      {telegramChatId ? (
        <div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-[#052e16] border border-profit-400/15 mb-4">
            <CheckCircle2 className="h-5 w-5 text-profit-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-profit-400">Telegram connected</p>
              <p className="text-[12px] text-slate-500 mt-0.5">Chat ID: {telegramChatId}</p>
            </div>
          </div>
          <button
            onClick={disconnect}
            disabled={disconnecting}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-loss-600/50 text-loss-400 hover:bg-loss-600/10 transition-colors disabled:opacity-60"
          >
            {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Disconnect Telegram
          </button>
        </div>
      ) : deepLink ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
            <p className="text-[13px] text-slate-300 mb-3 font-medium">
              Click the link below to open Telegram and activate notifications:
            </p>
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors"
            >
              <Send className="h-4 w-4" />
              Open Telegram &amp; Connect
            </a>
            <p className="mt-3 text-[12px] text-slate-500">
              This link expires in 10 minutes. After clicking, send the message to the bot to complete the link.
            </p>
          </div>
          <button
            onClick={() => setDeepLink(null)}
            className="text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={generateLink}
            disabled={generating}
            className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Connect Telegram
          </button>
          <p className="mt-3 text-[12px] text-slate-600">
            Requires <code className="font-mono">TELEGRAM_BOT_TOKEN</code> and{" "}
            <code className="font-mono">TELEGRAM_BOT_USERNAME</code> to be set in your environment.
          </p>
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["mt5-account"],
    queryFn: fetchMT5Account,
  });

  const account = data?.account ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConnectForm>({ resolver: zodResolver(connectSchema) });

  const connectMutation = useMutation({
    mutationFn: connectMT5,
    onSuccess: () => {
      toast.success("MT5 account connected");
      queryClient.invalidateQueries({ queryKey: ["mt5-account"] });
      reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectMT5,
    onSuccess: () => {
      toast.success("MT5 account disconnected");
      queryClient.invalidateQueries({ queryKey: ["mt5-account"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Settings"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
      />

      <div className="mt-8 max-w-2xl space-y-8">
        {/* ── MT5 Connection ─────────────────────────────────────────────── */}
        <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                MetaTrader 5 Account
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Connect your MT5 broker account to deploy live bots.
              </p>
            </div>
            {!isLoading && account && (
              <StatusBadge connected={account.isConnected} />
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : account?.isConnected ? (
            /* ── Connected state ─────────────────────────────────── */
            <div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[#052e16] border border-profit-400/15 mb-4">
                <CheckCircle2 className="h-5 w-5 text-profit-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-profit-400">
                    Connected to {account.server}
                  </p>
                  {account.lastConnectedAt && (
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      Last connected{" "}
                      {new Date(account.lastConnectedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-loss-600/50 text-loss-400 hover:bg-loss-600/10 transition-colors duration-150 disabled:opacity-60"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2Off className="h-4 w-4" />
                )}
                Disconnect MT5
              </button>
            </div>
          ) : (
            /* ── Connection form ─────────────────────────────────── */
            <div>
              {account && !account.isConnected && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/60 border border-slate-700 mb-5">
                  <XCircle className="h-5 w-5 text-slate-500 shrink-0" />
                  <p className="text-sm text-slate-400">
                    Account on <span className="text-slate-300 font-medium">{account.server}</span> is disconnected.
                    Re-enter credentials to reconnect.
                  </p>
                </div>
              )}

              <form
                onSubmit={handleSubmit((d) => connectMutation.mutate(d))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
                      MT5 Login
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="12345678"
                      {...register("login")}
                      className={cn(inputCls(!!errors.login), "font-mono")}
                    />
                    {errors.login && (
                      <p className="mt-1 text-[12px] text-loss-400">{errors.login.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
                      MT5 Password
                    </label>
                    <input
                      type="password"
                      placeholder="Broker password"
                      {...register("password")}
                      className={inputCls(!!errors.password)}
                    />
                    {errors.password && (
                      <p className="mt-1 text-[12px] text-loss-400">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-400 mb-1.5">
                    MT5 Server
                  </label>
                  <select
                    {...register("server")}
                    className={cn(
                      inputCls(!!errors.server),
                      "cursor-pointer appearance-none"
                    )}
                  >
                    <option value="">Select your broker server…</option>
                    {MT5_SERVERS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.server && (
                    <p className="mt-1 text-[12px] text-loss-400">{errors.server.message}</p>
                  )}
                  <p className="mt-1.5 text-[12px] text-slate-500">
                    Can&apos;t find your broker? Type the server name manually via your MT5 terminal.
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={connectMutation.isPending}
                    className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors duration-150 disabled:opacity-60"
                  >
                    {connectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    Connect MT5 Account
                  </button>
                </div>
              </form>

              <p className="mt-4 text-[12px] text-slate-600">
                Your credentials are encrypted with AES-256-GCM before being stored.
              </p>
            </div>
          )}
        </section>

        <TelegramSection />
        <BridgeKeySection />
      </div>
    </div>
  );
}

// ─── Bridge Key section ───────────────────────────────────────────────────────

function BridgeKeySection() {
  const [bridgeKey, setBridgeKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    fetch("/api/settings/bridge-key")
      .then((r) => r.json())
      .then((d) => { setBridgeKey(d.bridgeKey); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/settings/bridge-key", { method: "POST" });
      const d = await res.json();
      setBridgeKey(d.bridgeKey);
      setRevealed(true);
      toast.success("Bridge key generated — copy it now");
    } catch {
      toast.error("Failed to generate key");
    } finally {
      setGenerating(false);
    }
  }

  function copy() {
    if (!bridgeKey) return;
    navigator.clipboard.writeText(bridgeKey);
    toast.success("Copied to clipboard");
  }

  const masked = bridgeKey ? "•".repeat(24) + bridgeKey.slice(-6) : null;

  return (
    <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Key className="h-4 w-4 text-primary-400" />
          Python Bridge Key
        </h2>
        <p className="mt-0.5 text-[13px] text-slate-500">
          Used by the Python Bridge script running on your PC to authenticate with FXAU and place real MT5 trades.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : bridgeKey ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 font-mono text-[13px] text-slate-300">
              {revealed ? bridgeKey : masked}
            </code>
            <button onClick={() => setRevealed((v) => !v)} title={revealed ? "Hide" : "Show"}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-[var(--foreground)] transition-colors">
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button onClick={copy} title="Copy"
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-[var(--foreground)] transition-colors">
              <Copy className="h-4 w-4" />
            </button>
            <button onClick={generate} disabled={generating} title="Regenerate"
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-loss-400 transition-colors disabled:opacity-50">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[12px] text-warning-400">
            Keep this secret. Regenerating invalidates the old key immediately.
          </p>
        </div>
      ) : (
        <button onClick={generate} disabled={generating}
          className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white transition-colors disabled:opacity-60">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
          Generate Bridge Key
        </button>
      )}

      {bridgeKey && (
        <div className="mt-5 rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-[12px] font-mono text-slate-400 space-y-1">
          <p className="text-slate-300 font-sans font-semibold text-[13px] mb-2">Quick setup (Windows)</p>
          <p><span className="text-primary-400">1.</span> Install Python 3.10+ and MetaTrader5 terminal</p>
          <p><span className="text-primary-400">2.</span> Download the bridge: <code className="text-slate-300">bridge/fxau_bridge.py</code> from the GitHub repo</p>
          <p><span className="text-primary-400">3.</span> Run: <code className="text-profit-400">pip install MetaTrader5 requests python-dotenv</code></p>
          <p><span className="text-primary-400">4.</span> Create <code className="text-slate-300">.env</code> next to the script:</p>
          <div className="ml-4 mt-1 rounded bg-slate-800 px-3 py-2 text-slate-300 space-y-0.5">
            <p>APP_URL=https://crypto-bot-orcin.vercel.app</p>
            <p>BRIDGE_KEY=<span className="text-primary-400">{revealed ? bridgeKey : "<your-bridge-key>"}</span></p>
            <p>MT5_LOGIN=<span className="text-slate-500">your_login</span></p>
            <p>MT5_PASSWORD=<span className="text-slate-500">your_password</span></p>
            <p>MT5_SERVER=<span className="text-slate-500">Exness-MT5Real</span></p>
          </div>
          <p className="mt-2"><span className="text-primary-400">5.</span> Run: <code className="text-profit-400">python fxau_bridge.py</code></p>
        </div>
      )}
    </section>
  );
}
