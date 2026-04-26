# FXAU — Design Style Guide

> Single source of truth for all visual and interaction decisions in FXAU. Reference this file before writing any UI code.
>
> **Aesthetic**: Modern, Trustworthy, Powerful
> **Scope**: Dashboard, Landing Page, Admin Panel, Email Templates
> **Dark mode: YES — full dark/light theme support required.**

---

## 1. Design Philosophy

FXAU is a professional algorithmic trading platform for serious retail traders. The UI must feel **powerful, precise, and trustworthy** — the kind of tool that a trader would trust with their real money.

**Three core principles:**

1. **Command center energy** — The dashboard should feel like a trading terminal: data-dense but organized. Dark mode is the default feel. Every pixel serves a purpose.
2. **Electric blue as the signal** — One electric blue primary on a dark, near-black canvas. Blue signals action, alerts, and live data. Everything else stays controlled and dark.
3. **Data clarity above all** — Numbers, charts, and status indicators must be instantly readable. No ambiguity. Green = profit/running, Red = loss/stopped, Blue = active/selected.

---

## 2. Typography

### Font Family

**Primary font: [Geist](https://fonts.google.com/specimen/Geist)** (Google Fonts)

Load via `next/font/google`:

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});
```

Apply both variables on root layout. Use `--font-geist-mono` for all numbers, prices, and trading data — never regular sans for financial figures.

**Why Geist**: engineered by Vercel for technical interfaces. Excellent numeric legibility. The mono variant is perfect for price data, trade logs, and bot output.

### Type Scale

| Style | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| `display` | 48px | 600 | 1.1 | -0.02em | Landing hero |
| `display-sm` | 36px | 600 | 1.15 | -0.02em | Section headers on landing |
| `h1` | 30px | 600 | 1.2 | -0.015em | Page titles in dashboard |
| `h2` | 24px | 600 | 1.25 | -0.01em | Section headings |
| `h3` | 20px | 600 | 1.3 | -0.005em | Card titles, modal titles |
| `h4` | 16px | 600 | 1.4 | 0 | List item titles, labels |
| `body-lg` | 16px | 400 | 1.55 | 0 | Marketing body copy |
| `body` | 14px | 400 | 1.5 | 0 | Default dashboard body text |
| `body-sm` | 13px | 400 | 1.5 | 0 | Secondary info, table data |
| `caption` | 12px | 500 | 1.4 | 0.01em | Meta, timestamps, badges |
| `micro` | 11px | 600 | 1.3 | 0.04em | Uppercase labels (always uppercase) |
| `price` | 28px | 700 | 1.1 | -0.02em | P&L totals, equity values — always mono |
| `ticker` | 14px | 500 | 1.5 | 0.02em | Pair names (XAUUSD), always mono uppercase |
| `tabular` | 14px | 500 | 1.5 | 0 | All numeric data — font-variant-numeric: tabular-nums + mono |

**Rules:**
- **ALL financial numbers** (prices, P&L, percentages) use `--font-geist-mono` + `tabular-nums`. No exceptions.
- Pair names (XAUUSD, EURUSD) always uppercase, mono, `ticker` style.
- Headings weight 600 in app chrome. 700 reserved for P&L totals and landing display.
- Line-height: tight (1.1–1.3) for headings, 1.5 for body.

---

## 3. Color Palette

### Primary (Electric Blue)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#EFF6FF` | Light mode: subtle highlight bg |
| `primary-100` | `#DBEAFE` | Light mode: hover surfaces, selected rows |
| `primary-400` | `#60A5FA` | Dark mode: links, secondary accents |
| `primary-500` | `#3B82F6` | Dark mode: primary brand, active states |
| `primary-600` | `#2563EB` | **Light mode primary** — buttons, CTAs, active states |
| `primary-700` | `#1D4ED8` | Light mode: button hover/pressed |
| `primary-900` | `#1E3A8A` | Deep accent (rarely used) |

> In dark mode: use `primary-500` (#3B82F6) as the primary action color instead of `primary-600`.

### Neutrals (Slate — Dark-first)

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-950` | `#0A0F1E` | Dark mode: deepest background, sidebar |
| `neutral-900` | `#0F172A` | Dark mode: page background |
| `neutral-800` | `#1E293B` | Dark mode: card background |
| `neutral-700` | `#334155` | Dark mode: elevated card, hover |
| `neutral-600` | `#475569` | Dark mode: borders, dividers |
| `neutral-500` | `#64748B` | Muted text (both modes) |
| `neutral-400` | `#94A3B8` | Secondary text, placeholder |
| `neutral-300` | `#CBD5E1` | Light mode: secondary text |
| `neutral-200` | `#E2E8F0` | Light mode: borders, dividers |
| `neutral-100` | `#F1F5F9` | Light mode: card rails, table header |
| `neutral-50` | `#F8FAFC` | Light mode: page background |
| `white` | `#FFFFFF` | Light mode: cards, modals |

### Semantic (Trading-specific)

| Token | Hex | Usage |
|-------|-----|-------|
| `profit-50` | `#ECFDF5` | Profit bg (light mode) |
| `profit-600` | `#059669` | Positive P&L, profit numbers, RUNNING status |
| `profit-400` | `#34D399` | Dark mode: positive P&L, profit numbers |
| `loss-50` | `#FEF2F2` | Loss bg (light mode) |
| `loss-600` | `#DC2626` | Negative P&L, loss numbers, STOPPED/ERROR status |
| `loss-400` | `#F87171` | Dark mode: negative P&L, loss numbers |
| `warning-50` | `#FFFBEB` | Warning bg (light mode) |
| `warning-600` | `#D97706` | Pending states, caution alerts |
| `warning-400` | `#FBBF24` | Dark mode: warnings |
| `info-600` | `#2563EB` | Info banners (light mode) |
| `info-400` | `#60A5FA` | Info banners (dark mode) |

### Trading Status Colors

| Status | Light Background | Light Text | Dark Background | Dark Text |
|--------|-----------------|------------|-----------------|-----------|
| RUNNING | `profit-50` | `profit-600` | `#052e16` | `profit-400` |
| STOPPED | `neutral-100` | `neutral-600` | `neutral-800` | `neutral-400` |
| ERROR | `loss-50` | `loss-600` | `#2d0000` | `loss-400` |
| OPEN (trade) | `primary-50` | `primary-600` | `#0c1a3a` | `primary-400` |
| CLOSED | `neutral-100` | `neutral-500` | `neutral-800` | `neutral-500` |
| BUY | `profit-50` | `profit-600` | `#052e16` | `profit-400` |
| SELL | `loss-50` | `loss-600` | `#2d0000` | `loss-400` |
| COMPLETED | `profit-50` | `profit-600` | `#052e16` | `profit-400` |
| PENDING | `warning-50` | `warning-600` | `#2d1a00` | `warning-400` |
| FAILED | `loss-50` | `loss-600` | `#2d0000` | `loss-400` |
| DRAFT | `neutral-100` | `neutral-600` | `neutral-800` | `neutral-400` |
| ACTIVE | `primary-50` | `primary-600` | `#0c1a3a` | `primary-400` |
| PRO (plan) | `primary-50` | `primary-700` | `#0c1a3a` | `primary-400` |
| BASIC (plan) | `neutral-100` | `neutral-700` | `neutral-800` | `neutral-300` |

**No decorative gradients in app chrome.** Acceptable gradient uses:
- Landing hero: subtle radial from `primary-900 → transparent` in dark section
- Pro plan pricing card: subtle electric blue gradient border/glow
- Equity curve chart fill: `primary-500` with 20% opacity fade to transparent

---

## 4. Spacing

**8px base grid.** All spacing = multiple of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps (badge padding, icon inner) |
| `space-2` | 8px | Between related inline elements |
| `space-3` | 12px | Input internal padding, inline gaps |
| `space-4` | 16px | Standard gap between components |
| `space-5` | 20px | Card internal padding (compact) |
| `space-6` | 24px | Card internal padding (default) |
| `space-8` | 32px | Between sections within a page |
| `space-10` | 40px | Section separators |
| `space-12` | 48px | Large section breaks |
| `space-16` | 64px | Marketing section padding |
| `space-24` | 96px | Landing hero vertical padding |

**Page-level spacing:**
- Dashboard content max-width: `1280px` with `px-6` on desktop, `px-4` on mobile
- Sidebar width: `256px` (expanded), `64px` (collapsed)
- Main content top padding: `24px` below header
- Section-to-section gap: `32px`
- Card internal padding: `24px` (default), `20px` (compact stat cards)

**Density: Comfortable** — table rows `48px` tall. Trading data needs breathing room.

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Status dots, small chips |
| `radius` | 6px | **Default** — badges, tags, small cards |
| `radius-md` | 8px | Buttons, inputs, table containers |
| `radius-lg` | 10px | Main dashboard cards |
| `radius-xl` | 14px | Modal outer shell, pricing cards |
| `radius-2xl` | 20px | Hero marketing cards only |
| `radius-full` | 9999px | Avatars, status dots, toggle pills |

**Rule:** Dashboard feels sharp and precise — use smaller radii than consumer apps. `radius-md` (8px) is the largest for most interactive elements.

---

## 6. Shadows & Elevation

**Dark mode shadows use blue-tinted glow instead of black drop shadows.**

```
/* Light mode */
shadow-xs:    0 1px 2px 0 rgba(15, 23, 42, 0.05)
shadow-sm:    0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)
shadow-md:    0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)
shadow-lg:    0 10px 15px -3px rgba(15, 23, 42, 0.10), 0 4px 6px -4px rgba(15, 23, 42, 0.04)
shadow-focus: 0 0 0 3px rgba(37, 99, 235, 0.20)  /* Electric blue focus */

/* Dark mode — use glow instead of drop shadow */
shadow-xs-dark:    0 1px 3px 0 rgba(0, 0, 0, 0.4)
shadow-card-dark:  0 0 0 1px rgba(59, 130, 246, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3)
shadow-glow:       0 0 20px rgba(59, 130, 246, 0.15)  /* For active bot cards */
shadow-focus-dark: 0 0 0 3px rgba(59, 130, 246, 0.30)
```

**Usage:**
- Cards (light): `shadow-xs` + `border border-neutral-200`
- Cards (dark): `border border-neutral-700` + `bg-neutral-800`
- Active/running bot card (dark): `shadow-glow` + `border-primary-500/30`
- Modals: `shadow-lg` + border
- Focus rings: `shadow-focus` (light) / `shadow-focus-dark` (dark)
- Inputs: border only, no shadow

---

## 7. Component Specifications

### 7.1 Buttons

**Primary Button**
- Light: bg `primary-600`, text white, hover `primary-700`
- Dark: bg `primary-500`, text white, hover `primary-600`
- Height: `40px` (default), `36px` (sm), `44px` (lg)
- Padding: `16px` horizontal
- Radius: `radius-md` (8px)
- Font: `14px` weight 500
- Focus: `shadow-focus` ring
- Disabled: muted bg, muted text, `cursor-not-allowed`
- Loading: spinner replaces left icon, text stays

**Secondary Button (Outline)**
- Light: bg white, border `neutral-200`, text `neutral-900`, hover `neutral-50` bg
- Dark: bg transparent, border `neutral-600`, text `neutral-200`, hover `neutral-700` bg

**Ghost Button**
- Light: transparent, text `neutral-700`, hover `neutral-100` bg
- Dark: transparent, text `neutral-400`, hover `neutral-800` bg

**Destructive Button**
- bg `loss-600`, text white, hover `#B91C1C`
- Only for delete / force-stop actions

**Danger Outline Button**
- Border `loss-600`, text `loss-600`, transparent bg
- Hover: `loss-50` bg (light) / `#2d0000` bg (dark)

---

### 7.2 Inputs

- Height: `40px`
- Light: bg white, border `neutral-200`, text `neutral-900`
- Dark: bg `neutral-800`, border `neutral-600`, text `neutral-100`
- Radius: `radius-md` (8px)
- Padding: `12px` horizontal
- Placeholder: `neutral-400`
- Focus: `primary-600` border + `shadow-focus`
- Disabled: muted bg, `neutral-400` text
- Invalid: `loss-600` border, error text below (`13px`, `loss-600`)
- Label above: `13px` weight 500, `neutral-400` (dark) / `neutral-700` (light), `6px` gap
- **Numeric inputs** (price values, strategy values): use mono font

**Number Input for strategy rule values:**
- Same styling + `font-family: var(--font-geist-mono)`
- Right-align the value inside

---

### 7.3 Cards

**Default Dashboard Card**
- Light: bg white, border `neutral-200`, radius `radius-lg`, shadow `shadow-xs`, padding `24px`
- Dark: bg `neutral-800`, border `neutral-700`, radius `radius-lg`, padding `24px`

**Bot Status Card (Running)**
- Dark: bg `neutral-800`, border `primary-500/30`, `shadow-glow`
- Pulsing green dot indicator (CSS animation)
- Bot name: `h4`, Strategy: `caption`, Status badge: RUNNING green

**Stat Card (KPI)**
- Label: `micro` uppercase `neutral-400`/`neutral-500`, tracking wider
- Value: `price` style (28px, 700, mono)
- Positive delta: `profit-600` (light) / `profit-400` (dark) with ↑ arrow
- Negative delta: `loss-600` (light) / `loss-400` (dark) with ↓ arrow
- P&L values: always with `+` or `-` prefix, colored accordingly

**Backtest Result Card**
- Win rate: huge number (`48px` weight 700 mono), `profit-600`/`profit-400`
- Total trades: `price` style, `neutral-900`/`neutral-100`

**Feature Card (Landing)**
- Padding `32px`, radius `radius-xl`
- Icon: `40px` in a `primary-600/10` square bg
- Title: `h3`, Description: `body neutral-500`

**Pricing Card**
- Radius `radius-xl`, padding `32px`, border `neutral-200`/`neutral-700`
- Pro card: `2px solid primary-500`, subtle blue glow `shadow-glow`
- Price: `48px` weight 700 mono
- Period: `16px` `neutral-500`
- Feature list: checkmark `profit-600`

---

### 7.4 Tables

- Header: light `bg-neutral-50` / dark `bg-neutral-900`, `13px` weight 600 `neutral-500` uppercase tracking-wider, `48px` tall
- Body row: `52px` tall, `14px`
- Light: body text `neutral-700`, divider `neutral-100`
- Dark: body text `neutral-300`, divider `neutral-700`
- Hover row: light `neutral-50` / dark `neutral-700/50`
- Selected row: light `primary-50` / dark `primary-900/20`
- **All price/number columns**: mono font, right-aligned, tabular-nums
- Pair column: uppercase mono (`XAUUSD`), `ticker` style
- First column padding: `20px` left
- Last column padding: `20px` right
- Sort indicators: `neutral-400`, active `primary-500`/`primary-400`
- Sticky header
- No zebra stripes — use dividers only

**P&L column coloring rule:**
- Positive value: `profit-600` (light) / `profit-400` (dark), always show `+`
- Negative value: `loss-600` (light) / `loss-400` (dark), always show `-`
- Zero: `neutral-500`

---

### 7.5 Status Badges

- Height: `22px`
- Padding: `3px 8px`
- Radius: `radius-full`
- Font: `11px` weight 600 uppercase tracking-wide
- Dot: `6px` circle, `5px` right margin
- See §3 Trading Status Colors for all combinations

**Running badge (dark mode example):**
```
bg-[#052e16] text-emerald-400 border border-emerald-400/20
● RUNNING
```

**Pulsing dot for RUNNING bots:**
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.bot-running-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
```

---

### 7.6 Sidebar

- Width: `256px` expanded, `64px` collapsed
- Light: bg white, border-right `neutral-200`
- Dark: bg `neutral-950`, border-right `neutral-800`
- Padding: `16px`
- Logo block: FXAU logo + wordmark, `64px` tall, bottom border
- Nav section label: `micro` uppercase `neutral-500`, `10px` bottom margin
- Nav item:
  - Height: `40px`, padding `10px 12px`, radius `radius-md`
  - Icon: `18px`, text `14px` weight 500
  - Light inactive: icon `neutral-500`, text `neutral-700`, hover `neutral-100` bg
  - Dark inactive: icon `neutral-500`, text `neutral-400`, hover `neutral-800` bg
  - Light active: bg `primary-50`, text `primary-700`, icon `primary-600`, `2px` left accent bar `primary-600`
  - Dark active: bg `primary-500/10`, text `primary-400`, icon `primary-400`, `2px` left accent bar `primary-500`
- Bottom section: dark mode toggle + user avatar + name
- User block: avatar `32×32` circle + name `14px` + plan badge

---

### 7.7 Top Bar / Page Header

- Height: `60px`
- Light: bg white, border-bottom `neutral-200`
- Dark: bg `neutral-900`, border-bottom `neutral-800`
- Padding: `0 24px`
- Left: breadcrumb + page title (`h1` `neutral-900`/`neutral-100`)
- Right: dark mode toggle + notifications bell + avatar
- Sticky on scroll

---

### 7.8 Charts

All charts use **Recharts**.

**Equity Curve (LineChart)**
- Background: transparent (inherits card)
- Line: `primary-500` (#3B82F6), strokeWidth 2
- Area fill: gradient from `primary-500` at 20% opacity → 0% opacity
- Grid lines: `neutral-700` (dark) / `neutral-200` (light), dashed, 0.5 opacity
- Axis text: `12px` mono `neutral-500`
- Tooltip: dark bg `neutral-800` / light bg white, border `neutral-700`/`neutral-200`, mono font for values
- X-axis: dates
- Y-axis: equity value with currency prefix, right-aligned mono

**Monthly P&L Bar Chart (BarChart)**
- Bars: `profit-400` for positive months, `loss-400` for negative months (dark mode)
- Bars: `profit-600` for positive months, `loss-600` for negative months (light mode)
- Same grid/axis/tooltip rules as above

**Win Rate Trend (LineChart)**
- Line: `primary-400`/`primary-600`
- Reference line at 50%: `warning-400`/`warning-600` dashed

---

### 7.9 Modals & Dialogs

- Overlay: dark mode `rgba(0, 0, 0, 0.7)` / light `rgba(15, 23, 42, 0.5)` + `backdrop-blur-sm`
- Modal: max-width `512px` (default), `640px` (lg)
- Light: bg white, radius `radius-xl`, shadow `shadow-lg`
- Dark: bg `neutral-800`, border `neutral-700`, radius `radius-xl`
- Header: `24px 24px 16px`
- Body: `16px 24px`
- Footer: `16px 24px 24px`, right-aligned buttons `12px` gap
- Title: `h3`
- Close: icon top-right
- Entry animation: scale(0.97) + opacity 0 → scale(1) + opacity 1, `200ms` ease-out

---

### 7.10 Toasts

Using Sonner — bottom-right:
- Light: white bg, `shadow-lg`, `border neutral-200`
- Dark: `neutral-800` bg, `border neutral-700`
- Radius `radius-md` (8px), padding `14px 16px`
- Icon left `18px` colored by type
- Title `14px` weight 500
- Description `13px` `neutral-500`
- Auto-dismiss `4s`
- Success: `profit-600`/`profit-400`
- Error: `loss-600`/`loss-400`
- Warning: `warning-600`/`warning-400`
- Info: `primary-600`/`primary-400`

---

### 7.11 Empty States

- Centered in container
- Icon: `48px` Lucide, `neutral-600` inside `72×72` `neutral-800/neutral-100` circle
- Title: `h3` `neutral-300`/`neutral-700`
- Description: `body` `neutral-500`, max `400px`, centered
- Primary CTA button, `28px` top margin

---

### 7.12 Forms

- Field vertical gap: `20px`
- Label: `13px` weight 500 `neutral-400` (dark) / `neutral-700` (light)
- Helper text: `12px` `neutral-500`, below input
- Section divider: `border-t neutral-700`/`neutral-200`, `28px` margin
- Strategy rule row: horizontal flex — indicator select + condition select + value input + logic operator + remove button
- Form footer: right-aligned Cancel (ghost) + Save (primary), `12px` gap

---

## 8. Iconography

Use **[Lucide Icons](https://lucide.dev)** (`lucide-react`) exclusively.

**Sizing:**
- Nav icons: `18px`
- Inline with body text: `14px`
- Icon buttons: `18px`
- Stat card icons: `20px`
- Empty state icons: `48px`
- Marketing feature icons: `28–36px`

**Color rules:**
- Default: `neutral-500` (light) / `neutral-500` (dark)
- Active/selected: `primary-600` (light) / `primary-400` (dark)
- Profit/positive: `profit-600`/`profit-400`
- Loss/negative: `loss-600`/`loss-400`
- Inside primary CTA: `white`

**Trading-specific icons:**
- Bot: `Bot` icon
- Strategy: `GitBranch` icon
- Trade: `TrendingUp` (BUY) / `TrendingDown` (SELL)
- Backtest: `FlaskConical` icon
- Telegram: `Send` icon
- MT5 Connect: `Link` icon
- Running: `Play` icon
- Stopped: `Square` icon
- Analytics: `BarChart3` icon

---

## 9. Motion & Animation

**Principles:** fast, subtle, terminal-like. No bounce.

| Transition | Duration | Easing |
|-----------|----------|--------|
| Button press | `100ms` | `ease-out` |
| Hover state | `150ms` | `ease-out` |
| Dropdown | `150ms` | `ease-out` |
| Modal enter | `200ms` | `ease-out` |
| Modal exit | `150ms` | `ease-in` |
| Page transition | `250ms` | `ease-out` |
| Sidebar collapse | `200ms` | `ease-in-out` |
| Running dot pulse | `1.5s` | `ease-in-out infinite` |
| Chart line draw | `600ms` | `ease-out` (Recharts animation) |

**Do:**
- `transition-colors` on all interactive elements
- Skeleton shimmer for loading cards (dark: `neutral-700 → neutral-800`)
- Pulsing green dot on RUNNING bots
- Chart animation on first load only

**Don't:**
- Spring animations or bouncing
- Rotation animations (except loading spinners)
- Anything > 400ms in the dashboard

---

## 10. Dark Mode Implementation

Use `next-themes` with `ThemeProvider`. Class strategy (`class` on `<html>`).

```tsx
// globals.css — define both themes
:root {
  --background: #F8FAFC;
  --foreground: #0F172A;
  --card: #FFFFFF;
  --card-border: #E2E8F0;
  --primary: #2563EB;
  --primary-hover: #1D4ED8;
  --muted: #94A3B8;
  --sidebar-bg: #FFFFFF;
  --sidebar-border: #E2E8F0;
}

.dark {
  --background: #0F172A;
  --foreground: #F1F5F9;
  --card: #1E293B;
  --card-border: #334155;
  --primary: #3B82F6;
  --primary-hover: #2563EB;
  --muted: #64748B;
  --sidebar-bg: #0A0F1E;
  --sidebar-border: #1E293B;
}
```

**Rule:** Always use CSS variables, never hardcode colors in components. Every component works in both modes.

---

## 11. Landing Page Specifics

- Hero: dark section (`neutral-950` bg) with electric blue radial glow behind headline
- Headline: `display` 48px weight 600 white, max 2 lines
- Subheadline: `body-lg` `neutral-400`, max `600px`
- CTA cluster: "Start Free" primary button + "See Pricing" ghost button, `20px` gap
- Feature grid: 3 col desktop, 1 col mobile, `28px` gap, dark cards (`neutral-800`)
- "How It Works": 3-step horizontal flow with connector lines
- Pricing section: light `neutral-50` bg (contrast from dark hero)
- Pricing cards: Basic (neutral border) vs Pro (electric blue glow border)
- Max content width: `1200px`
- Section padding: `96px` vertical each

**Navbar:**
- Dark: `neutral-950` bg, border-bottom `neutral-800`
- Logo: FXAU wordmark in `primary-400`
- Links: `neutral-400`, hover `white`
- CTA button: primary (electric blue)

---

## 12. Email Templates (React Email)

- Max width: `600px`
- Background: `#F1F5F9` (neutral-100)
- Card: white, `border: 1px solid #E2E8F0`, radius `12px`
- Header: `#2563EB` electric blue bg with FXAU logo in white
- Body padding: `24px`
- Typography: system stack with Geist fallback — `font-family: 'Geist', -apple-system, 'Segoe UI', Roboto, sans-serif`
- Financial numbers in emails: mono fallback — `font-family: 'Geist Mono', 'SF Mono', 'Fira Code', monospace`
- Buttons: `#2563EB` bg, white text, `12px 24px` padding, radius `8px`, `14px` weight 500
- Footer: `12px` `#94A3B8`, centered
- P&L values: always colored (green for profit, red for loss) with `+`/`-` prefix

**Email types and key content:**
- Welcome: FXAU logo header, user's name, "Connect your MT5 account" CTA button, 3 quick-start steps
- Daily Trade Summary: date, stats row (total trades / win rate / net P&L), trades table (pair, direction, profit/loss), footer
- Bot Error: bot name, error description, "Check your bots" CTA button
- Subscription Confirmation: plan name, amount paid, features unlocked list, "Go to dashboard" CTA

---

## 13. Tailwind Configuration

Extend `tailwind.config.ts`:

```ts
theme: {
  extend: {
    fontFamily: {
      sans: ["var(--font-geist)", "system-ui", "sans-serif"],
      mono: ["var(--font-geist-mono)", "monospace"],
    },
    colors: {
      primary: {
        50: "#EFF6FF",
        100: "#DBEAFE",
        400: "#60A5FA",
        500: "#3B82F6",
        600: "#2563EB",
        700: "#1D4ED8",
        900: "#1E3A8A",
      },
      profit: {
        50: "#ECFDF5",
        400: "#34D399",
        600: "#059669",
      },
      loss: {
        50: "#FEF2F2",
        400: "#F87171",
        600: "#DC2626",
      },
    },
    boxShadow: {
      xs: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
      focus: "0 0 0 3px rgba(37, 99, 235, 0.20)",
      "focus-dark": "0 0 0 3px rgba(59, 130, 246, 0.30)",
      glow: "0 0 20px rgba(59, 130, 246, 0.15)",
    },
    borderRadius: {
      DEFAULT: "0.5rem",
    },
  },
}
```

Use Tailwind's built-in `slate` scale for all neutrals (`text-slate-700`, `bg-slate-900`, etc.) — it matches exactly.

---

## 14. Accessibility

- Minimum touch target: `40×40px` (desktop), `44×44px` (mobile)
- Color contrast: `4.5:1` body text, `3:1` large text and UI components — verify in both light and dark modes
- Focus rings: never removed. `shadow-focus` (light) / `shadow-focus-dark` (dark) on all interactive elements
- Icons alone: always include `aria-label` or `sr-only` span
- All form fields: `<label>` with `htmlFor`
- Status badges: text + dot (never color alone — colorblind traders exist)
- Trading direction (BUY/SELL): never rely only on color — show the text label

---

## 15. Do's & Don'ts

**Do:**
- Use `--font-geist-mono` + `tabular-nums` for ALL financial numbers, prices, P&L
- Color P&L consistently — green profit, red loss, every table, every card
- Use electric blue only for primary actions, links, and active states
- Use slate scale for all neutrals
- Always implement dark and light mode for every component
- Use pulsing dot for RUNNING bot status
- Keep the dashboard data-dense but organized — traders want information, not whitespace
- Uppercase all trading pair names (`XAUUSD`)

**Don't:**
- Use regular sans font for price data or trade numbers
- Hardcode colors — always use CSS variables or Tailwind tokens
- Use gradients in dashboard chrome (landing page only)
- Use font weight above 600 in app chrome (700 reserved for P&L totals)
- Skip dark mode implementation for any component
- Use emoji in the trading dashboard UI
- Use shadows heavier than `shadow-lg` inside the app
- Mix border radius values within a single container
- Show P&L without `+`/`-` prefix AND color — use both always
