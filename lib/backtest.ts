import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Candle {
  time: number; // ms timestamp
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TradeLogEntry {
  index: number;
  pair: string;
  direction: "BUY";
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  profit: number;
  pips: number;
  duration: string;
}

export interface EquityPoint {
  time: string;
  equity: number;
}

// ─── Candle generation ────────────────────────────────────────────────────────

const BASE_PRICES: Record<string, number> = {
  XAUUSD: 2010,
  EURUSD: 1.082,
  GBPUSD: 1.263,
  USDJPY: 148.5,
};

const DAILY_VOL: Record<string, number> = {
  XAUUSD: 0.009,
  EURUSD: 0.006,
  GBPUSD: 0.007,
  USDJPY: 0.006,
};

const TF_MS: Record<string, number> = {
  M1: 60_000,
  M5: 300_000,
  M15: 900_000,
  M30: 1_800_000,
  H1: 3_600_000,
  H4: 14_400_000,
  D1: 86_400_000,
};

const DAY_MS = 86_400_000;

function seedRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function pairSeed(pair: string) {
  return pair.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 17) >>> 0;
}

export function generateCandles(
  pair: string,
  timeframe: string,
  fromDate: Date,
  toDate: Date
): Candle[] {
  const tfMs = TF_MS[timeframe] ?? TF_MS.H1;
  const dayFraction = tfMs / DAY_MS;
  const dailyVol = DAILY_VOL[pair] ?? 0.007;
  const candleVol = dailyVol * Math.sqrt(dayFraction);

  // Add 50-candle warm-up before fromDate so indicators have enough history
  const warmup = 50;
  const start = fromDate.getTime() - warmup * tfMs;
  const end = toDate.getTime();

  const rand = seedRand(pairSeed(pair) ^ (fromDate.getFullYear() * 17));
  const base = BASE_PRICES[pair] ?? 1.0;

  const candles: Candle[] = [];
  let price = base;

  for (let t = start; t <= end; t += tfMs) {
    const move = (rand() - 0.5) * 2 * candleVol * price;
    const open = price;
    const close = open + move;
    const wick1 = rand() * candleVol * price * 0.5;
    const wick2 = rand() * candleVol * price * 0.5;
    const high = Math.max(open, close) + wick1;
    const low = Math.min(open, close) - wick2;

    candles.push({ time: t, open, high, low, close });
    price = close;
  }

  return candles;
}

// ─── Indicator calculations ───────────────────────────────────────────────────

function ema(values: number[], period: number, index: number): number {
  if (index < period - 1) return values[0];
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i <= index; i++) {
    e = values[i] * k + e * (1 - k);
  }
  return e;
}

function sma(values: number[], period: number, index: number): number {
  if (index < period - 1) return values[0];
  let sum = 0;
  for (let i = index - period + 1; i <= index; i++) sum += values[i];
  return sum / period;
}

function calcRSI(closes: number[], period: number, index: number): number {
  if (index < period) return 50;
  let gains = 0, losses = 0;
  for (let i = index - period + 1; i <= index; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function calcMACD(closes: number[], index: number): number {
  return ema(closes, 12, index) - ema(closes, 26, index);
}

function calcBB(closes: number[], period: number, index: number): number {
  return sma(closes, period, index);
}

function calcSTOCH(candles: Candle[], period: number, index: number): number {
  if (index < period - 1) return 50;
  let low = Infinity, high = -Infinity;
  for (let i = index - period + 1; i <= index; i++) {
    if (candles[i].low < low) low = candles[i].low;
    if (candles[i].high > high) high = candles[i].high;
  }
  if (high === low) return 50;
  return ((candles[index].close - low) / (high - low)) * 100;
}

function indicatorValue(
  indicator: string,
  candles: Candle[],
  closes: number[],
  i: number
): number {
  switch (indicator) {
    case "RSI":   return calcRSI(closes, 14, i);
    case "MA":    return sma(closes, 20, i);
    case "MACD":  return calcMACD(closes, i);
    case "BB":    return calcBB(closes, 20, i);
    case "STOCH": return calcSTOCH(candles, 14, i);
    default:      return 0;
  }
}

// ─── Rule evaluation ──────────────────────────────────────────────────────────

interface RuleSpec {
  indicator: string;
  condition: string;
  value: number;
  logicOperator: string;
}

function evalSingle(
  rule: RuleSpec,
  candles: Candle[],
  closes: number[],
  i: number
): boolean {
  const curr = indicatorValue(rule.indicator, candles, closes, i);
  const prev = i > 0 ? indicatorValue(rule.indicator, candles, closes, i - 1) : curr;
  switch (rule.condition) {
    case "GREATER_THAN":   return curr > rule.value;
    case "LESS_THAN":      return curr < rule.value;
    case "CROSSES_ABOVE":  return prev <= rule.value && curr > rule.value;
    case "CROSSES_BELOW":  return prev >= rule.value && curr < rule.value;
    default:               return false;
  }
}

function evalRules(
  rules: RuleSpec[],
  candles: Candle[],
  closes: number[],
  i: number
): boolean {
  if (rules.length === 0) return false;
  let result = evalSingle(rules[0], candles, closes, i);
  for (let r = 1; r < rules.length; r++) {
    const val = evalSingle(rules[r], candles, closes, i);
    if (rules[r].logicOperator === "OR") result = result || val;
    else result = result && val;
  }
  return result;
}

// ─── P&L helpers ──────────────────────────────────────────────────────────────

const PIP_SIZE: Record<string, number> = {
  XAUUSD: 0.01,
  EURUSD: 0.0001,
  GBPUSD: 0.0001,
  USDJPY: 0.01,
};

const PIP_VALUE_PER_LOT: Record<string, number> = {
  XAUUSD: 1,
  EURUSD: 10,
  GBPUSD: 10,
  USDJPY: 7,
};

const LOT_SIZE = 0.1;

function calcProfit(pair: string, entryPrice: number, exitPrice: number): number {
  const pip = PIP_SIZE[pair] ?? 0.0001;
  const pipVal = PIP_VALUE_PER_LOT[pair] ?? 10;
  const pips = (exitPrice - entryPrice) / pip;
  return pips * pipVal * LOT_SIZE;
}

function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

// ─── Main backtest runner ─────────────────────────────────────────────────────

export async function runBacktest(
  backtestId: string,
  strategyId: string,
  fromDate: Date,
  toDate: Date
): Promise<void> {
  try {
    await db.backtest.update({
      where: { id: backtestId },
      data: { status: "RUNNING" },
    });

    const strategy = await db.strategy.findUnique({
      where: { id: strategyId },
      include: { rules_rel: true },
    });
    if (!strategy) throw new Error("Strategy not found");

    const entryRules = strategy.rules_rel
      .filter((r) => r.ruleType === "ENTRY")
      .map((r) => ({
        indicator: r.indicator as string,
        condition: r.condition as string,
        value: r.value,
        logicOperator: r.logicOperator as string,
      }));

    const exitRules = strategy.rules_rel
      .filter((r) => r.ruleType === "EXIT")
      .map((r) => ({
        indicator: r.indicator as string,
        condition: r.condition as string,
        value: r.value,
        logicOperator: r.logicOperator as string,
      }));

    const allCandles = generateCandles(strategy.pair, strategy.timeframe, fromDate, toDate);
    const tfMs = TF_MS[strategy.timeframe] ?? TF_MS.H1;

    // Filter to only candles within the actual date range (excluding warmup)
    const warmupStart = fromDate.getTime() - 50 * tfMs;
    const dataStart = fromDate.getTime();
    const closes = allCandles.map((c) => c.close);

    let inTrade = false;
    let entryPrice = 0;
    let entryTime = 0;
    let tradeNum = 0;

    const tradeLog: TradeLogEntry[] = [];
    const equityCurve: EquityPoint[] = [];
    let equity = 10_000;

    equityCurve.push({
      time: new Date(dataStart).toISOString().slice(0, 10),
      equity,
    });

    for (let i = 0; i < allCandles.length; i++) {
      const candle = allCandles[i];
      if (candle.time < dataStart) continue; // skip warmup candles

      if (!inTrade) {
        if (evalRules(entryRules, allCandles, closes, i)) {
          inTrade = true;
          entryPrice = candle.close;
          entryTime = candle.time;
        }
      } else {
        if (evalRules(exitRules, allCandles, closes, i)) {
          const exitPrice = candle.close;
          const profit = calcProfit(strategy.pair, entryPrice, exitPrice);
          const pip = PIP_SIZE[strategy.pair] ?? 0.0001;
          const pips = (exitPrice - entryPrice) / pip;

          tradeNum++;
          tradeLog.push({
            index: tradeNum,
            pair: strategy.pair,
            direction: "BUY",
            entryPrice,
            exitPrice,
            entryTime: new Date(entryTime).toISOString(),
            exitTime: new Date(candle.time).toISOString(),
            profit: Math.round(profit * 100) / 100,
            pips: Math.round(pips * 10) / 10,
            duration: formatDuration(candle.time - entryTime),
          });

          equity += profit;
          equityCurve.push({
            time: new Date(candle.time).toISOString().slice(0, 10),
            equity: Math.round(equity * 100) / 100,
          });

          inTrade = false;
        }
      }
    }

    const totalTrades = tradeLog.length;
    const winners = tradeLog.filter((t) => t.profit > 0).length;
    const winRate = totalTrades > 0 ? (winners / totalTrades) * 100 : 0;

    await db.backtest.update({
      where: { id: backtestId },
      data: {
        status: "COMPLETED",
        winRate: Math.round(winRate * 10) / 10,
        totalTrades,
        // JSON.parse/stringify strips typed array to plain JSON accepted by Prisma
        resultLog: JSON.parse(JSON.stringify(tradeLog)),
        equityCurve: JSON.parse(JSON.stringify(equityCurve)),
      },
    });
  } catch {
    await db.backtest.update({
      where: { id: backtestId },
      data: { status: "FAILED" },
    }).catch(() => {});
  }
}
