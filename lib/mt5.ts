/**
 * MT5 bridge service — v1 simulation.
 *
 * In production this would be a Python MetaTrader 5 bridge process
 * communicating over WebSocket. Here every "tick" is synthesised so
 * the UI, API, and database plumbing can be developed and tested
 * without a live broker connection.
 */

import { db } from "@/lib/db";
import { sendAndLog, tradeOpenedMsg, tradeClosedMsg } from "@/lib/telegram";

// ─── Price simulation ─────────────────────────────────────────────────────────

const BASE: Record<string, number> = {
  XAUUSD: 2015,
  EURUSD: 1.082,
  GBPUSD: 1.264,
  USDJPY: 148.8,
};

const SPREAD: Record<string, number> = {
  XAUUSD: 0.3,
  EURUSD: 0.00015,
  GBPUSD: 0.0002,
  USDJPY: 0.02,
};

/** Deterministic simulated mid-price for a pair at a given ms timestamp. */
export function simulatePrice(pair: string, nowMs = Date.now()): number {
  const base = BASE[pair] ?? 1.0;
  const vol = base * 0.006;
  // slow cycle (~4 h) + fast cycle (~15 min) + micro noise
  const t = nowMs / 1000;
  const slow = Math.sin(t / 14400) * vol * 0.6;
  const fast = Math.sin(t / 900 + 1.3) * vol * 0.3;
  const micro = Math.sin(t / 60 + 2.7) * vol * 0.1;
  return base + slow + fast + micro;
}

// ─── Indicator simulation ─────────────────────────────────────────────────────

/**
 * Returns a simulated indicator value for rule evaluation.
 * Values cycle through their natural ranges over time so that
 * entry and exit conditions are periodically triggered.
 */
export function simulateIndicator(
  indicator: string,
  pair: string,
  nowMs = Date.now()
): number {
  const t = nowMs / 1000;
  switch (indicator) {
    case "RSI": {
      // oscillates 15–85 with ~2 h period
      const raw = Math.sin(t / 7200 + 0.5);
      return 50 + raw * 35;
    }
    case "MA": {
      // MA ≈ price with a slight lag
      return simulatePrice(pair, nowMs - 900_000);
    }
    case "MACD": {
      // oscillates −1 to +1
      return Math.sin(t / 5400 + 1.1);
    }
    case "BB": {
      // middle band ≈ current price
      return simulatePrice(pair, nowMs);
    }
    case "STOCH": {
      // oscillates 5–95 with ~1 h period
      const raw = Math.sin(t / 3600 + 0.8);
      return 50 + raw * 45;
    }
    default:
      return 50;
  }
}

// ─── Rule evaluation ──────────────────────────────────────────────────────────

interface RuleSpec {
  indicator: string;
  condition: string;
  value: number;
  logicOperator: string;
}

function evalSingle(rule: RuleSpec, pair: string, nowMs: number): boolean {
  const curr = simulateIndicator(rule.indicator, pair, nowMs);
  const prev = simulateIndicator(rule.indicator, pair, nowMs - 60_000);
  switch (rule.condition) {
    case "GREATER_THAN":   return curr > rule.value;
    case "LESS_THAN":      return curr < rule.value;
    case "CROSSES_ABOVE":  return prev <= rule.value && curr > rule.value;
    case "CROSSES_BELOW":  return prev >= rule.value && curr < rule.value;
    default:               return false;
  }
}

function evalRules(rules: RuleSpec[], pair: string, nowMs: number): boolean {
  if (rules.length === 0) return false;
  let result = evalSingle(rules[0], pair, nowMs);
  for (let i = 1; i < rules.length; i++) {
    const val = evalSingle(rules[i], pair, nowMs);
    result = rules[i].logicOperator === "OR" ? result || val : result && val;
  }
  return result;
}

// ─── P&L ──────────────────────────────────────────────────────────────────────

const PIP: Record<string, number> = {
  XAUUSD: 0.01,
  EURUSD: 0.0001,
  GBPUSD: 0.0001,
  USDJPY: 0.01,
};

const PIP_VALUE: Record<string, number> = {
  XAUUSD: 1,
  EURUSD: 10,
  GBPUSD: 10,
  USDJPY: 7,
};

const LOT = 0.1;

function calcProfit(pair: string, entry: number, exit: number): number {
  const pip = PIP[pair] ?? 0.0001;
  const pipVal = PIP_VALUE[pair] ?? 10;
  return ((exit - entry) / pip) * pipVal * LOT;
}

// ─── Core tick processor ──────────────────────────────────────────────────────

/**
 * Process a single price tick for a running bot.
 * - If no open trade: evaluate entry rules; open BUY if triggered.
 * - If open trade:    evaluate exit rules; close if triggered.
 * Returns a short description of what happened.
 */
export async function processTick(botId: string): Promise<string> {
  const bot = await db.bot.findUnique({
    where: { id: botId },
    include: {
      strategy: { include: { rules_rel: true } },
    },
  });

  if (!bot || bot.status !== "RUNNING") return "Bot not running";

  const now = Date.now();
  const spread = SPREAD[bot.strategy.pair] ?? 0.0002;
  const midPrice = simulatePrice(bot.strategy.pair, now);
  const ask = midPrice + spread / 2;
  const bid = midPrice - spread / 2;

  const entryRules = bot.strategy.rules_rel
    .filter((r) => r.ruleType === "ENTRY")
    .map((r) => ({
      indicator: r.indicator as string,
      condition: r.condition as string,
      value: r.value,
      logicOperator: r.logicOperator as string,
    }));

  const exitRules = bot.strategy.rules_rel
    .filter((r) => r.ruleType === "EXIT")
    .map((r) => ({
      indicator: r.indicator as string,
      condition: r.condition as string,
      value: r.value,
      logicOperator: r.logicOperator as string,
    }));

  // Check for an existing open trade
  const openTrade = await db.trade.findFirst({
    where: { botId, status: "OPEN" },
  });

  if (!openTrade) {
    // Evaluate entry
    if (evalRules(entryRules, bot.strategy.pair, now)) {
      await db.trade.create({
        data: {
          botId,
          userId: bot.userId,
          pair: bot.strategy.pair,
          direction: "BUY",
          entryPrice: ask,
          lotSize: LOT,
          status: "OPEN",
          openedAt: new Date(),
        },
      });

      // Notify user
      const userChat = await db.user.findUnique({
        where: { id: bot.userId },
        select: { telegramChatId: true },
      });
      if (userChat?.telegramChatId) {
        sendAndLog(
          bot.userId,
          userChat.telegramChatId,
          "TRADE_OPENED",
          tradeOpenedMsg(bot.strategy.pair, "BUY", ask)
        ).catch(() => {});
      }

      return `BUY opened at ${ask.toFixed(5)}`;
    }
    return "No entry signal";
  } else {
    // Evaluate exit
    if (evalRules(exitRules, bot.strategy.pair, now)) {
      const profit = calcProfit(bot.strategy.pair, openTrade.entryPrice, bid);
      const rounded = Math.round(profit * 100) / 100;
      await db.trade.update({
        where: { id: openTrade.id },
        data: {
          exitPrice: bid,
          profit: rounded,
          closedAt: new Date(),
          status: "CLOSED",
        },
      });

      const userChat2 = await db.user.findUnique({
        where: { id: bot.userId },
        select: { telegramChatId: true },
      });
      if (userChat2?.telegramChatId) {
        sendAndLog(
          bot.userId,
          userChat2.telegramChatId,
          "TRADE_CLOSED",
          tradeClosedMsg(bot.strategy.pair, "BUY", openTrade.entryPrice, bid, rounded)
        ).catch(() => {});
      }

      return `BUY closed at ${bid.toFixed(5)} — P&L: $${profit.toFixed(2)}`;
    }
    return "Holding open trade";
  }
}
