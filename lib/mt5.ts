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
import { simulatePrice, simulateIndicator, SPREAD, PIP, PIP_VALUE } from "@/lib/price-sim";

export { simulatePrice, simulateIndicator } from "@/lib/price-sim";

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
    case "GREATER_THAN":  return curr > rule.value;
    case "LESS_THAN":     return curr < rule.value;
    case "CROSSES_ABOVE": return prev <= rule.value && curr > rule.value;
    case "CROSSES_BELOW": return prev >= rule.value && curr < rule.value;
    default:              return false;
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

const LOT = 0.1;

function calcProfit(pair: string, entry: number, exit: number): number {
  const pip = PIP[pair] ?? 0.0001;
  const pipVal = PIP_VALUE[pair] ?? 10;
  return ((exit - entry) / pip) * pipVal * LOT;
}

// ─── Core tick processor ──────────────────────────────────────────────────────

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

  const openTrade = await db.trade.findFirst({ where: { botId, status: "OPEN" } });

  if (!openTrade) {
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

      const userChat = await db.user.findUnique({
        where: { id: bot.userId },
        select: { telegramChatId: true },
      });
      if (userChat?.telegramChatId) {
        sendAndLog(bot.userId, userChat.telegramChatId, "TRADE_OPENED",
          tradeOpenedMsg(bot.strategy.pair, "BUY", ask)).catch(() => {});
      }
      return `BUY opened at ${ask.toFixed(5)}`;
    }
    return "No entry signal";
  } else {
    if (evalRules(exitRules, bot.strategy.pair, now)) {
      const profit = calcProfit(bot.strategy.pair, openTrade.entryPrice, bid);
      const rounded = Math.round(profit * 100) / 100;
      await db.trade.update({
        where: { id: openTrade.id },
        data: { exitPrice: bid, profit: rounded, closedAt: new Date(), status: "CLOSED" },
      });

      const userChat2 = await db.user.findUnique({
        where: { id: bot.userId },
        select: { telegramChatId: true },
      });
      if (userChat2?.telegramChatId) {
        sendAndLog(bot.userId, userChat2.telegramChatId, "TRADE_CLOSED",
          tradeClosedMsg(bot.strategy.pair, "BUY", openTrade.entryPrice, bid, rounded)).catch(() => {});
      }
      return `BUY closed at ${bid.toFixed(5)} — P&L: $${profit.toFixed(2)}`;
    }
    return "Holding open trade";
  }
}
