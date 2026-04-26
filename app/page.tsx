import Link from "next/link";
import {
  Bot,
  BarChart3,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Star,
} from "lucide-react";

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-extrabold text-lg tracking-tight text-white">
          FX<span className="text-blue-400">AU</span>
        </span>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/sign-in"
            className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Start Free
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-medium mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        Algorithmic trading for everyone
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white max-w-4xl">
        Automate Gold &amp; Forex{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          Trade Profitabily.
        </span>
      </h1>

      <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
        Build trading strategies with a visual rule builder, backtest against historical data, and
        deploy live bots connected to your MetaTrader 5 account — all in one platform.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/auth/sign-up"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-900/30"
        >
          Get started free
          <ArrowRight size={16} />
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 font-semibold text-sm transition-colors"
        >
          See how it works
        </a>
      </div>

      <p className="mt-5 text-xs text-slate-600">
        Free forever · No credit card required · Cancel anytime
      </p>

      {/* Mock dashboard preview */}
      <div className="relative mt-16 w-full max-w-4xl mx-auto">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 backdrop-blur overflow-hidden shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/60">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs text-slate-500">FXAU Dashboard</span>
          </div>
          <div className="grid grid-cols-4 gap-px bg-slate-700/30">
            {[
              { label: "Running Bots", value: "3", color: "text-green-400" },
              { label: "Open Positions", value: "2", color: "text-blue-400" },
              { label: "Today&apos;s P&L", value: "+$284", color: "text-green-400" },
              { label: "Win Rate", value: "68%", color: "text-white" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/80 p-4">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="p-4 flex items-end gap-1 h-24">
            {[30, 55, 42, 70, 48, 85, 62, 90, 55, 78, 64, 95, 72, 88].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: h > 60 ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.35)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BarChart3,
    title: "Visual Strategy Builder",
    description:
      "Compose entry and exit rules from indicators like RSI, MACD, Bollinger Bands, and Stochastics — no code, just logic.",
    color: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: TrendingUp,
    title: "Historical Backtesting",
    description:
      "Run your strategy against simulated historical data. See equity curves, win rates, drawdown, and detailed trade logs.",
    color: "bg-indigo-500/10 text-indigo-400",
  },
  {
    icon: Bot,
    title: "Live Trading Bots",
    description:
      "Deploy strategies as live bots connected to MetaTrader 5. Start, stop, and monitor them from your dashboard.",
    color: "bg-violet-500/10 text-violet-400",
  },
  {
    icon: Zap,
    title: "Telegram Alerts",
    description:
      "Receive instant notifications when your bot opens or closes a trade, or encounters an error — direct to your phone.",
    color: "bg-yellow-500/10 text-yellow-400",
  },
  {
    icon: BarChart3,
    title: "Pro Analytics",
    description:
      "Deep performance insights: cumulative P&L curves, pair breakdowns, direction stats, profit factor, and more.",
    color: "bg-green-500/10 text-green-400",
  },
  {
    icon: Shield,
    title: "Plan-based Access Control",
    description:
      "Free backtesting for everyone. Upgrade to Basic for one live bot or Pro for unlimited bots and analytics.",
    color: "bg-slate-500/10 text-slate-400",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything you need to trade algorithmically
          </h2>
          <p className="mt-3 text-slate-400 max-w-lg mx-auto">
            From strategy design to live execution — one platform, no code required.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 hover:border-slate-600 transition-colors`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    title: "Build your strategy",
    desc: "Use the rule builder to define entry and exit conditions using technical indicators. No coding required.",
  },
  {
    num: "02",
    title: "Backtest it",
    desc: "Run your strategy against simulated historical price data to see how it would have performed.",
  },
  {
    num: "03",
    title: "Connect MT5",
    desc: "Link your MetaTrader 5 account credentials in Settings. FXAU simulates the MT5 bridge for demo trading.",
  },
  {
    num: "04",
    title: "Deploy your bot",
    desc: "Hit deploy on your strategy. Your bot runs 24/7, executing trades and sending you Telegram alerts.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-slate-800">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Up and running in minutes
          </h2>
          <p className="mt-3 text-slate-400">
            Four steps from sign-up to live automated trading.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                {s.num}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Free",
    price: "$0",
    sub: "forever",
    description: "For traders who want to explore and backtest strategies.",
    features: [
      "Unlimited strategy builder",
      "Unlimited backtesting",
      "Up to 1 bot (stopped only)",
      "Email notifications",
    ],
    cta: "Start Free",
    href: "/auth/sign-up",
    highlight: false,
  },
  {
    name: "Basic",
    price: "$29",
    sub: "/ month",
    description: "For active traders ready to deploy live automated bots.",
    features: [
      "Everything in Free",
      "1 live trading bot",
      "Telegram notifications",
      "Daily email trade summaries",
    ],
    cta: "Get Basic",
    href: "/auth/sign-up",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$79",
    sub: "/ month",
    description: "For serious traders who want unlimited power and deep insights.",
    features: [
      "Everything in Basic",
      "Unlimited live bots",
      "Advanced analytics dashboard",
      "Priority support",
    ],
    cta: "Get Pro",
    href: "/auth/sign-up",
    highlight: true,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 border-t border-slate-800">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-slate-400">Start free. Upgrade when you&apos;re ready.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-6 flex flex-col gap-5 transition-colors ${
                p.highlight
                  ? "border-blue-500/50 bg-blue-600/5 shadow-lg shadow-blue-900/20"
                  : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
                  <Star size={10} />
                  Most Popular
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-slate-300 mb-1">{p.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">{p.price}</span>
                  <span className="text-sm text-slate-500">{p.sub}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{p.description}</p>
              </div>
              <ul className="space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors ${
                  p.highlight
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 px-6 border-t border-slate-800">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Start trading smarter today
        </h2>
        <p className="mt-4 text-slate-400">
          Build your first strategy in minutes. Free forever — no credit card required.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-900/30"
          >
            Create free account
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 font-semibold text-sm transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-slate-800 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-extrabold text-sm text-slate-500">
          FX<span className="text-blue-500">AU</span>
        </span>
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} FXAU. Not financial advice. Trade responsibly.
        </p>
        <div className="flex items-center gap-5 text-xs text-slate-600">
          <Link href="/auth/sign-in" className="hover:text-slate-400 transition-colors">Sign in</Link>
          <Link href="/auth/sign-up" className="hover:text-slate-400 transition-colors">Sign up</Link>
          <Link href="/dashboard" className="hover:text-slate-400 transition-colors">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
