# Claude Code — FXAU Build Prompt

Read the following files in order before doing anything:
1. `master_prompt.md` — Your tech stack rules, Prisma v7 patterns, and coding standards. Follow EXACTLY.
2. `design-style-guide.md` — The visual design system for FXAU. Apply to every component you build. Electric blue primary, Geist font, dark mode required on every component.
3. `jb-components.md` — The JB component reference. Always check this before building auth, tables, file uploads, checkout, or data tables from scratch.
4. `project-description.md` — What we are building. Every feature decision must align with this document.
5. `project-phases.md` — The build plan. Work through phases in exact order.

## Core Rules

- Work through **ONE phase at a time**. Complete ALL tasks in a phase before moving to the next.
- After completing each phase, **stop and confirm with me** before proceeding to the next.
- Follow `design-style-guide.md` exactly — Geist font, electric blue (#3B82F6 dark / #2563EB light), slate neutrals, dark mode CSS vars on every component.
- Use **Prisma v7 patterns** (NOT v6). See `master_prompt.md` for exact setup.
- Use **React Query** for all data fetching. Never `useEffect` for data.
- Use **React Hook Form + Zod** for all forms. Every form field must be validated.
- Use **API Routes (Route Handlers)** for all server-side logic. No server actions for data mutations.
- Use **Recharts** for all charts (equity curve, P&L bar chart, win rate trend).
- Use **node-telegram-bot-api** for Telegram bot integration.
- **Before building auth, data tables, checkout, or file uploads from scratch — check `jb-components.md` and install the relevant component first.**

## FXAU-specific Rules

- ALL financial numbers (prices, P&L, percentages, win rates) must use `--font-geist-mono` + `tabular-nums`. No exceptions.
- Trading pair names (XAUUSD, EURUSD, etc.) always uppercase, always mono font.
- P&L values: always show `+` prefix for positive, `-` for negative, always colored (green profit / red loss).
- Bot status always shown with a pulsing dot for RUNNING bots.
- BUY direction badge: green. SELL direction badge: red.
- MT5 credentials (login, password) must be encrypted with `ENCRYPTION_KEY` before saving to database.
- Feature gating: Basic plan = max 2 strategies, max 1 running bot. Pro = unlimited. FREE = read-only, no bot deployment. Check on every relevant API route and show upgrade prompt in UI.
- Admin routes (`/admin/*`) must be protected by role check (`role === 'ADMIN'`).
- Dark mode: implement BOTH light and dark styles for every single component. Use `next-themes` with class strategy.

## Environment Variables Required

Ensure ALL of these are in `.env.example` with comments and `.env.local`:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Random 32+ char secret
- `BETTER_AUTH_URL` — App URL
- `GOOGLE_CLIENT_ID` — Google OAuth
- `GOOGLE_CLIENT_SECRET` — Google OAuth
- `RESEND_API_KEY` — Resend email API key
- `RESEND_FROM_EMAIL` — Verified sender email
- `STRIPE_SECRET_KEY` — Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `TELEGRAM_BOT_TOKEN` — From BotFather
- `TELEGRAM_BOT_USERNAME` — Bot @username
- `NEXT_PUBLIC_API_URL` — App base URL
- `ENCRYPTION_KEY` — 32-char key for encrypting MT5 credentials

## Install Order for JB Components

Install in this exact order (prerequisites matter):
1. `pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json` (Phase 1)
2. `pnpm dlx shadcn@latest add https://jb.desishub.com/r/searchable-select.json` (Phase 3)
3. `pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json` (Phase 3)
4. `pnpm dlx shadcn@latest add https://jb.desishub.com/r/zustand-cart.json` (Phase 8 — before Stripe UI)
5. `pnpm dlx shadcn@latest add https://stripe-ui-component.desishub.com/r/stripe-ui-component.json` (Phase 8)
6. `pnpm dlx shadcn@latest add https://ui-components.desishub.com/r/website-ui.json` (Phase 11)

## Start

Begin with **Phase 1 — Foundation** from `project-phases.md`. Read all phase tasks carefully and execute them in order. When Phase 1 is complete, show me a summary of what was built and wait for my confirmation before starting Phase 2.
