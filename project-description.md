# FXAU — Project Description

## What This App Does
FXAU is a multi-user algorithmic trading SaaS platform for Gold (XAUUSD) and USD currency pairs. Traders sign up, connect their MetaTrader 5 account, build no-code trading strategies using a rule builder, backtest those strategies against historical data, and deploy live bots that execute trades automatically. A central Telegram bot and email system keep users informed of all trading activity in real time.

## Target Users
- **Primary user (Trader):** Retail forex/gold traders who want to automate their trading strategies without writing code. They need a simple interface to define rules, validate them via backtesting, and run live bots.
- **Secondary user (Admin):** Platform owner who manages all users, monitors active bots, views subscription statuses, and oversees platform health.

## Core Value Proposition
FXAU lets any trader automate XAUUSD and USD pair trading through MetaTrader 5 without writing a single line of code — with built-in backtesting, live alerts, and a clean dashboard to manage everything.

## User Roles & Permissions
- **Trader (Basic — Monthly):** Can create up to 2 strategies, run 1 bot at a time, backtest strategies, receive Telegram + email notifications, view trade history.
- **Trader (Pro — One-time):** Unlimited strategies, unlimited simultaneous bots, full backtest history, priority Telegram alerts, advanced analytics.
- **Admin:** Full platform access — view/manage all users, bots, strategies, subscriptions, Telegram bot settings, system health dashboard.

## Features — Complete List
1. **User Authentication** — Sign up, sign in, email verification, password reset via Better Auth with Google OAuth.
2. **MT5 Account Connection** — Users enter their MT5 login, password, and server to link their broker account. Credentials stored encrypted.
3. **No-Code Strategy Builder** — Form-based rule builder where users define entry/exit conditions using indicators (RSI, Moving Average, MACD, Bollinger Bands, Stochastic) with dropdowns, value inputs, and logic operators (AND/OR). Supports XAUUSD and USD pairs only.
4. **Strategy Management** — List, view, edit, duplicate, and delete strategies. Each strategy has a name, pair, timeframe, and rule set.
5. **Backtesting Engine** — Run a strategy against historical price data for a selected date range. Returns win rate %, trade-by-trade log table, and an equity curve chart.
6. **Bot Deployment** — Deploy a strategy as a live bot connected to the user's MT5 account. Users can start/stop bots from the dashboard.
7. **Multi-Bot Support** — Pro users can run multiple bots simultaneously, one per strategy.
8. **Live Trade Dashboard** — Real-time view of open positions, recent trades, P&L summary, and bot status indicators.
9. **Trade History** — Full paginated log of all executed trades with pair, direction, entry/exit price, profit/loss, and duration.
10. **Telegram Notifications** — Central bot sends alerts to users' linked Telegram chat IDs for: trade opened, trade closed, bot started, bot stopped.
11. **Email Notifications** — Automated emails for: welcome on signup, trade summary (daily), bot stopped due to error, subscription confirmation.
12. **Subscription & Billing** — Basic plan (monthly via Stripe) and Pro plan (one-time payment via Stripe). Feature gating enforced based on active plan.
13. **Billing Management** — Users can view their plan, payment history, and upgrade from Basic to Pro.
14. **Admin Dashboard** — Overview of total users, active bots, revenue, subscriptions. Manage users (view, suspend, change plan). View all running bots and their status.
15. **Admin Telegram Bot Settings** — Configure the central Telegram bot token and manage which users are subscribed to notifications.
16. **User Profile & Settings** — Update name, email, password, Telegram chat ID, MT5 credentials, notification preferences.
17. **Analytics (Pro)** — Per-strategy performance analytics: total trades, win rate, average RR, drawdown, monthly P&L chart.

## Data Model

- **User:** id, name, email, emailVerified, image, role (TRADER | ADMIN), plan (FREE | BASIC | PRO), planExpiresAt, telegramChatId, createdAt, updatedAt
- **MT5Account:** id, userId, login (encrypted), password (encrypted), server, isConnected, lastConnectedAt, createdAt
- **Strategy:** id, userId, name, pair (XAUUSD | EURUSD | GBPUSD | USDJPY), timeframe (M1|M5|M15|M30|H1|H4|D1), rules (JSON), status (DRAFT | ACTIVE), createdAt, updatedAt
- **StrategyRule:** id, strategyId, indicator (RSI | MA | MACD | BB | STOCH), condition (CROSSES_ABOVE | CROSSES_BELOW | GREATER_THAN | LESS_THAN), value (Float), logicOperator (AND | OR), ruleType (ENTRY | EXIT)
- **Backtest:** id, strategyId, userId, fromDate, toDate, status (PENDING | RUNNING | COMPLETED | FAILED), winRate (Float), totalTrades (Int), resultLog (JSON), equityCurve (JSON), createdAt
- **Bot:** id, userId, strategyId, mt5AccountId, name, status (RUNNING | STOPPED | ERROR), startedAt, stoppedAt, createdAt
- **Trade:** id, botId, userId, pair, direction (BUY | SELL), entryPrice, exitPrice, lotSize, profit, openedAt, closedAt, status (OPEN | CLOSED)
- **Subscription:** id, userId, plan, stripeCustomerId, stripeSubscriptionId, stripePaymentIntentId, amount, currency, status (ACTIVE | CANCELLED | EXPIRED), startsAt, expiresAt, createdAt
- **TelegramNotification:** id, userId, type (TRADE_OPENED | TRADE_CLOSED | BOT_STARTED | BOT_STOPPED), message, sentAt, success (Boolean)
- **Relationships:** A User has one MT5Account, many Strategies, many Bots, many Trades, one Subscription. A Strategy has many StrategyRules and many Backtests. A Bot belongs to a Strategy and an MT5Account and has many Trades.

## Pages / Screens

1. `/` — Landing page: hero, features section, pricing section (Basic vs Pro), testimonials, CTA
2. `/auth/sign-in` — Sign in with email/password or Google OAuth
3. `/auth/sign-up` — Register with name, email, password
4. `/auth/verify-email` — Email verification OTP screen
5. `/auth/forgot-password` — Password reset request
6. `/auth/reset-password` — New password entry
7. `/dashboard` — Main dashboard: live bot status cards, open positions summary, P&L today, recent trades list
8. `/dashboard/strategies` — Strategy list: table of all strategies with name, pair, timeframe, status, actions
9. `/dashboard/strategies/new` — Strategy builder: multi-step form for creating a new strategy with rule builder
10. `/dashboard/strategies/[id]` — Strategy detail: view rules, run backtest, deploy as bot
11. `/dashboard/strategies/[id]/edit` — Edit strategy rules and settings
12. `/dashboard/backtests` — List of all backtests across strategies
13. `/dashboard/backtests/[id]` — Backtest result: win rate stat, equity curve chart, trade-by-trade log table
14. `/dashboard/bots` — Bot management: list of all bots with status, strategy name, start/stop controls
15. `/dashboard/trades` — Full trade history table with filters (pair, direction, date range, bot)
16. `/dashboard/analytics` — Pro-only: per-strategy analytics, monthly P&L chart, win rate trends (gated for Basic)
17. `/dashboard/billing` — Current plan, payment history, upgrade CTA
18. `/dashboard/settings` — Profile info, MT5 credentials, Telegram chat ID, notification preferences, change password
19. `/admin` — Admin overview: total users, active bots, MRR, recent signups
20. `/admin/users` — User management table: search, filter by plan, view/suspend/change plan
21. `/admin/bots` — All active bots across platform with user, strategy, status
22. `/admin/subscriptions` — All subscriptions table with plan, status, revenue
23. `/admin/telegram` — Configure Telegram bot token, view notification logs

## Integrations
- **Auth:** Better Auth + Google OAuth + Email (Resend)
- **Broker:** MetaTrader 5 API (via mt5 Python bridge or MT5 REST API connector)
- **Email:** Resend + React Email
- **Payments:** Stripe (monthly subscription for Basic, one-time payment for Pro)
- **Telegram:** node-telegram-bot-api (central bot for all user notifications)
- **Charts:** Recharts (equity curve, P&L charts)
- **File uploads:** None required
- **AI features:** None
- **Dark mode:** Yes — full dark/light theme support

## JB Components to Install
- **JB Better Auth UI:** `pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json`
- **JB Data Table:** `pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json`
- **Zustand Cart:** `pnpm dlx shadcn@latest add https://jb.desishub.com/r/zustand-cart.json`
- **Stripe UI:** `pnpm dlx shadcn@latest add https://stripe-ui-component.desishub.com/r/stripe-ui-component.json`
- **Website UI:** `pnpm dlx shadcn@latest add https://ui-components.desishub.com/r/website-ui.json`
- **Searchable Select:** `pnpm dlx shadcn@latest add https://jb.desishub.com/r/searchable-select.json`

## Out of Scope (v1)
- Support for currency pairs beyond XAUUSD and the 4 listed USD pairs
- Mobile app (iOS/Android)
- Social/copy trading (following another trader's bot)
- Custom MQL5 script upload or code editor
- AI-generated strategy suggestions
- Multi-broker support (only MT5 in v1)
- Referral/affiliate system
