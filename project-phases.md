# FXAU — Build Phases

## Phase 1 — Foundation
**Goal:** Project scaffolded, design system applied, env files created, database connected, auth working, sidebar layout complete.

### Tasks
- [ ] Initialize Next.js 16 project with TypeScript, Tailwind v4, shadcn/ui
- [ ] Create `.env.example` (committed) and `.env.local` (gitignored) with ALL env vars:
  - `DATABASE_URL` — Neon PostgreSQL connection string
  - `BETTER_AUTH_SECRET` — Random 32+ char string
  - `BETTER_AUTH_URL` — App URL (http://localhost:3000 in dev)
  - `GOOGLE_CLIENT_ID` — From Google Cloud Console
  - `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
  - `RESEND_API_KEY` — From Resend dashboard
  - `RESEND_FROM_EMAIL` — Verified sender address
  - `STRIPE_SECRET_KEY` — From Stripe dashboard
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — From Stripe dashboard
  - `STRIPE_WEBHOOK_SECRET` — From Stripe webhook config
  - `TELEGRAM_BOT_TOKEN` — From BotFather on Telegram
  - `TELEGRAM_BOT_USERNAME` — The bot's @username
  - `NEXT_PUBLIC_API_URL` — App base URL
  - `ENCRYPTION_KEY` — 32-char key for encrypting MT5 credentials
- [ ] Add `.env.local` to `.gitignore`
- [ ] Set up Prisma v7 with Neon PostgreSQL (schema stub, config, db client at `lib/db.ts`)
- [ ] Apply design-style-guide.md tokens to `globals.css` (electric blue primary, dark mode CSS vars, Geist font variables)
- [ ] Load Geist font via `next/font/google` in root layout
- [ ] Create root layout with: QueryClientProvider, ThemeProvider (next-themes), Sonner toaster
- [ ] Build collapsible sidebar layout with nav items: Dashboard, Strategies, Bots, Trades, Backtests, Analytics, Billing, Settings
- [ ] Build page header component (breadcrumb + page title + action slot)
- [ ] Add dark mode toggle to sidebar footer
- [ ] Install JB Better Auth UI: `pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json`
- [ ] **Integrate installed auth files — do NOT overwrite existing `page.tsx` or `layout.tsx`. Edit and merge.**
- [ ] Configure Better Auth with Google OAuth + Resend email
- [ ] Create protected route middleware (`middleware.ts`) — redirect unauthenticated users to `/auth/sign-in`
- [ ] Add `role` and `plan` fields to User model in Prisma schema
- [ ] Build custom 404, error, and loading pages styled with FXAU design tokens
- [ ] Verify: sign-up, sign-in, Google OAuth, email verification, protected routes all work

### Dependencies
- Neon database created, `DATABASE_URL` set in `.env.local`
- Resend account created, `RESEND_API_KEY` and `RESEND_FROM_EMAIL` set
- Google OAuth app created in Google Cloud Console

---

## Phase 2 — Core Data Models & MT5 Connection
**Goal:** Full Prisma schema defined, database migrated, MT5 account connection UI built.

### Tasks
- [ ] Define complete Prisma schema for all models:
  - `User` (add: role, plan, planExpiresAt, telegramChatId)
  - `MT5Account` (login encrypted, password encrypted, server, isConnected)
  - `Strategy` (name, pair, timeframe, rules JSON, status)
  - `StrategyRule` (indicator, condition, value, logicOperator, ruleType)
  - `Backtest` (fromDate, toDate, status, winRate, resultLog JSON, equityCurve JSON)
  - `Bot` (name, status, startedAt, stoppedAt)
  - `Trade` (pair, direction, entryPrice, exitPrice, lotSize, profit, openedAt, closedAt, status)
  - `Subscription` (plan, stripeCustomerId, stripeSubscriptionId, stripePaymentIntentId, amount, status, expiresAt)
  - `TelegramNotification` (type, message, sentAt, success)
- [ ] Run: `pnpm db:push && pnpm db:generate`
- [ ] Build MT5 account connection form on `/dashboard/settings`:
  - Fields: MT5 Login (number), MT5 Password, MT5 Server (searchable select)
  - Encrypt credentials before saving using `ENCRYPTION_KEY`
  - POST `/api/mt5/connect` — saves and tests the MT5 connection
  - Show connection status badge (Connected / Disconnected) on settings page
- [ ] Build `/api/mt5/connect` route handler (validate credentials, save encrypted to DB)
- [ ] Build `/api/mt5/disconnect` route handler
- [ ] Show MT5 connection status card on main dashboard

### Dependencies
- Phase 1 complete (auth + layout working)

---

## Phase 3 — Strategy Builder & Management
**Goal:** Users can create, view, edit, and manage trading strategies using the no-code rule builder.

### Tasks
- [ ] Install JB Searchable Select: `pnpm dlx shadcn@latest add https://jb.desishub.com/r/searchable-select.json`
- [ ] Install JB Data Table: `pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json`
- [ ] Build `/dashboard/strategies` page — strategies list using Data Table (name, pair, timeframe, status, rule count, actions)
- [ ] Build `/dashboard/strategies/new` — multi-step strategy builder form:
  - Step 1: Name, pair (XAUUSD | EURUSD | GBPUSD | USDJPY), timeframe (M1–D1)
  - Step 2: Entry rules — dynamic rule rows (add/remove), each row: indicator dropdown, condition dropdown, value input, AND/OR logic operator
  - Step 3: Exit rules — same pattern as entry rules
  - Step 4: Review & save
  - React Hook Form + Zod validation throughout
- [ ] Build `/api/strategies` — GET (list with pagination) and POST (create)
- [ ] Build `/api/strategies/[id]` — GET (detail), PUT (update), DELETE (delete)
- [ ] Build `/dashboard/strategies/[id]` — strategy detail page: rule summary, backtest history, deploy bot CTA
- [ ] Build `/dashboard/strategies/[id]/edit` — edit form pre-filled with existing rules
- [ ] Enforce Basic plan limit: max 2 strategies (check on POST, show upgrade prompt if exceeded)
- [ ] Add empty states and loading skeletons for strategy list and detail pages

### Dependencies
- Phase 2 complete (Prisma schema + DB migrated)

---

## Phase 4 — Backtesting Engine
**Goal:** Users can run backtests on their strategies and view detailed results.

### Tasks
- [ ] Build POST `/api/backtests` — accepts strategyId, fromDate, toDate; creates Backtest record with PENDING status; triggers async backtest job
- [ ] Build backtesting service (`lib/backtest.ts`):
  - Fetch historical OHLCV data for the selected pair and date range (use a free historical data source or mock data in v1 if MT5 historical feed is unavailable)
  - Apply strategy rules to historical candles
  - Generate: trade-by-trade log array, win rate %, equity curve data points
  - Update Backtest record with COMPLETED status and results
- [ ] Build GET `/api/backtests/[id]` — return backtest result with resultLog and equityCurve
- [ ] Build `/dashboard/backtests` page — list of all backtests (Data Table: strategy name, date range, status, win rate, total trades, actions)
- [ ] Build `/dashboard/backtests/[id]` — result detail page:
  - Win rate stat card (large % figure)
  - Total trades stat card
  - Profitable trades stat card
  - Equity curve chart (Recharts LineChart — time on X, equity value on Y)
  - Trade-by-trade log (Data Table: #, pair, direction, entry, exit, profit/loss, duration)
- [ ] Add "Run Backtest" button on `/dashboard/strategies/[id]` with date range picker modal
- [ ] Add loading/progress state while backtest is running (poll GET `/api/backtests/[id]` status every 3s)

### Dependencies
- Phase 3 complete (strategies working)

---

## Phase 5 — Bot Deployment & Live Trading
**Goal:** Users can deploy live trading bots connected to their MT5 account.

### Tasks
- [ ] Build POST `/api/bots` — create a bot for a strategy + MT5 account, set status RUNNING
- [ ] Build POST `/api/bots/[id]/stop` — set bot status to STOPPED, record stoppedAt
- [ ] Build POST `/api/bots/[id]/start` — restart a stopped bot
- [ ] Build GET `/api/bots` — list user's bots with pagination
- [ ] Build MT5 bridge service (`lib/mt5.ts`):
  - Connect to user's MT5 account using stored credentials
  - Subscribe to price feed for XAUUSD and USD pairs
  - Evaluate strategy rules against live tick data
  - Execute BUY/SELL orders via MT5 API when conditions are met
  - Record each trade to the `Trade` model
- [ ] Build `/dashboard/bots` page — bot list with Data Table (name, strategy, status, started, trades today, actions: start/stop)
- [ ] Build live status indicator component (green dot = RUNNING, red = STOPPED, yellow = ERROR)
- [ ] Enforce Basic plan limit: max 1 bot running at a time
- [ ] Build `/dashboard/trades` page — full trade history Data Table (pair, direction, entry, exit, profit, bot, opened, closed)
- [ ] Add trade filters: pair, direction (BUY/SELL), date range, bot
- [ ] Main dashboard stat cards: Open Positions count, Today's P&L, Total Trades, Bots Running
- [ ] Add empty states and loading skeletons for bots and trades pages

### Dependencies
- Phase 4 complete (backtesting working)
- MT5 API access configured

---

## Phase 6 — Telegram Notifications
**Goal:** Central Telegram bot sends trade and bot status alerts to all subscribed users.

### Tasks
- [ ] Install `node-telegram-bot-api` package
- [ ] Build Telegram bot service (`lib/telegram.ts`):
  - Initialize bot with `TELEGRAM_BOT_TOKEN`
  - `sendNotification(chatId, message)` — send message to a user's Telegram chat
  - `broadcastNotification(type, payload)` — fetch all users with telegramChatId set, send to all
- [ ] Wire Telegram notification on trade open (called from MT5 bridge on order execution)
- [ ] Wire Telegram notification on trade close
- [ ] Wire Telegram notification on bot start
- [ ] Wire Telegram notification on bot stop/error
- [ ] Build POST `/api/telegram/webhook` — receive Telegram updates (for `/start` command to link chat ID)
- [ ] When user sends `/start` to the bot, auto-link their Telegram chat ID if they're logged in (via deep link with token)
- [ ] Build Telegram chat ID linking flow in `/dashboard/settings`:
  - Show "Connect Telegram" button → generate deep link → user clicks → sends `/start` to bot → chat ID auto-saved
- [ ] Save each notification attempt to `TelegramNotification` model (for admin logs)
- [ ] Build `/admin/telegram` page — show bot status, notification log table, configure bot token

### Dependencies
- Phase 5 complete (bots + trades working)
- Telegram bot created via BotFather, `TELEGRAM_BOT_TOKEN` set

---

## Phase 7 — Email Notifications
**Goal:** App sends automated emails for key events.

### Tasks
- [ ] Install and configure Resend + React Email: `pnpm add resend @react-email/components`
- [ ] Build email templates in `emails/` folder:
  - `welcome.tsx` — Welcome email on signup (name, login link, quick start steps)
  - `trade-summary.tsx` — Daily trade summary (date, total trades, net P&L, win rate)
  - `bot-error.tsx` — Bot stopped due to error (bot name, strategy, error message, fix link)
  - `subscription-confirmation.tsx` — Payment confirmed (plan name, amount, expiry if applicable)
- [ ] Build email service (`lib/email.ts`) with `sendEmail(template, to, data)` helper
- [ ] Wire welcome email on user signup (Better Auth webhook or post-register hook)
- [ ] Wire subscription confirmation email on Stripe payment success (webhook handler)
- [ ] Wire bot error email when bot status changes to ERROR
- [ ] Set up daily trade summary cron job (Vercel Cron) — runs at 11PM UTC, sends summary to all active users with trades that day

### Dependencies
- Phase 6 complete
- Resend account with verified sending domain

---

## Phase 8 — Payments & Subscriptions
**Goal:** Users can subscribe to Basic (monthly) or upgrade to Pro (one-time), with feature gating enforced.

### Tasks
- [ ] Install Zustand Cart: `pnpm dlx shadcn@latest add https://jb.desishub.com/r/zustand-cart.json`
- [ ] Install Stripe UI: `pnpm dlx shadcn@latest add https://stripe-ui-component.desishub.com/r/stripe-ui-component.json`
- [ ] Configure Stripe env vars (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] Create products in Stripe dashboard:
  - Basic Plan (monthly recurring)
  - Pro Plan (one-time payment)
- [ ] Build `/dashboard/billing` page:
  - Current plan badge (FREE / BASIC / PRO)
  - Plan features comparison table
  - Upgrade CTA button (Basic users → upgrade to Pro, Free users → choose plan)
  - Payment history table (Stripe invoices)
- [ ] Build POST `/api/stripe/create-checkout-session` — create Stripe session for selected plan
- [ ] Build POST `/api/stripe/webhook` — handle events:
  - `checkout.session.completed` → update user plan + save Subscription record + send confirmation email
  - `customer.subscription.deleted` → downgrade user to FREE
  - `invoice.payment_failed` → notify user via email
- [ ] Gate features throughout the app:
  - Basic: max 2 strategies, 1 bot running — show upgrade prompt when limit hit
  - Pro: unlimited strategies + bots, analytics page unlocked
  - FREE: strategies readable but no bot deployment

### Dependencies
- Phase 7 complete
- Better Auth + Zustand Cart installed (Stripe UI prerequisite)
- Stripe account with products created

---

## Phase 9 — Admin Dashboard
**Goal:** Admin users can manage users, monitor bots, view subscriptions, and configure the Telegram bot.

### Tasks
- [ ] Create admin middleware — restrict `/admin/*` routes to users with `role = ADMIN`
- [ ] Build `/admin` overview page:
  - Stat cards: Total Users, Active Bots, MRR (sum of active Basic subscriptions), Pro Users
  - Recent signups list (last 10 users)
  - Platform health: total trades today, error bots count
- [ ] Build `/admin/users` — full user management Data Table:
  - Columns: name, email, plan, bots running, joined date, status, actions
  - Actions: View profile, Change plan (dropdown), Suspend account
  - Search by name/email, filter by plan
- [ ] Build `/admin/bots` — all bots across platform:
  - Data Table: user, bot name, strategy, status, trades today, started at
  - Admin can force-stop any bot
- [ ] Build `/admin/subscriptions` — all subscriptions table:
  - Columns: user, plan, amount, status, start date, expiry date
  - Filter by plan, status
- [ ] Build `/admin/telegram` — Telegram bot management:
  - Show bot token (masked), bot username, connection status
  - Notification log table (Data Table: user, type, message, sent at, success)
  - Resend failed notifications button

### Dependencies
- Phase 8 complete (subscriptions + billing working)

---

## Phase 10 — Analytics (Pro Feature)
**Goal:** Pro users get advanced per-strategy performance analytics.

### Tasks
- [ ] Build `/dashboard/analytics` page — gated behind Pro plan check
- [ ] Build GET `/api/analytics` — aggregate trade data per strategy for logged-in user
- [ ] Analytics components:
  - Strategy selector dropdown (select which strategy to analyze)
  - Stat cards: Total Trades, Win Rate %, Average RR, Max Drawdown, Total Profit
  - Monthly P&L bar chart (Recharts BarChart — month on X, net profit on Y)
  - Win rate trend line chart (Recharts LineChart — week on X, win % on Y)
  - Strategy comparison table (if multiple strategies)
- [ ] Show upgrade prompt/lock overlay for Basic/Free users on this page

### Dependencies
- Phase 9 complete

---

## Phase 11 — Landing Page
**Goal:** Public marketing page with hero, features, pricing, and CTAs.

### Tasks
- [ ] Install Website UI: `pnpm dlx shadcn@latest add https://ui-components.desishub.com/r/website-ui.json`
- [ ] Customize landing page sections:
  - Hero: headline "Automate Your Gold & Forex Trading — No Code Required", subheadline, CTA buttons (Get Started Free, See Pricing)
  - Features grid: Strategy Builder, Backtesting, Live Bots, Telegram Alerts, MT5 Integration, Multi-Bot Support
  - How It Works: 3-step flow (Connect MT5 → Build Strategy → Deploy Bot)
  - Pricing: Basic (monthly price) vs Pro (one-time price) card with feature checklist
  - CTA banner: "Start trading smarter today"
- [ ] Add navbar with logo, nav links (Features, Pricing, Login, Get Started button)
- [ ] Add footer with links

### Dependencies
- Phase 10 complete (all features ready to showcase)

---

## Phase 12 — Polish & Deploy
**Goal:** App is production-ready and live on Vercel with custom domain.

### Tasks
- [ ] Test all CRUD operations end-to-end (strategies, bots, trades, backtests)
- [ ] Test auth flows on mobile and desktop (sign-up, Google OAuth, email verify)
- [ ] Test Stripe payment flow in test mode (Basic monthly + Pro one-time)
- [ ] Test Telegram bot notifications for all 4 event types
- [ ] Test feature gating (Basic limits, Pro unlock, FREE restrictions)
- [ ] Test admin dashboard (user management, bot monitoring)
- [ ] Verify responsive design on mobile for all dashboard pages
- [ ] Set all environment variables in Vercel dashboard
- [ ] Deploy to Vercel (connect GitHub repo, configure project)
- [ ] Configure Cloudflare DNS + custom domain for FXAU
- [ ] Verify Resend sending domain (SPF/DKIM records)
- [ ] Set Stripe webhook endpoint to production URL
- [ ] Set Telegram bot webhook to production URL
- [ ] Run production checklist

### Production Checklist
- [ ] All env vars set in Vercel (all 14 vars from .env.example)
- [ ] Database migrations applied to production Neon instance
- [ ] Auth flows work on production URL (Google OAuth redirect URI updated)
- [ ] Custom domain live with SSL
- [ ] Emails land in inbox (not spam) — test welcome + subscription emails
- [ ] Stripe webhooks receiving events in production mode
- [ ] Telegram bot responding to /start command in production
- [ ] Admin account created (manually set role = ADMIN in DB)
- [ ] 404 and error pages styled correctly
- [ ] All bot error states handled gracefully (no unhandled exceptions)
