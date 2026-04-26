import { z } from "zod";

export const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"] as const;
export const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"] as const;
export const INDICATORS = ["RSI", "MA", "MACD", "BB", "STOCH"] as const;
export const CONDITIONS = ["CROSSES_ABOVE", "CROSSES_BELOW", "GREATER_THAN", "LESS_THAN"] as const;
export const LOGIC_OPS = ["AND", "OR"] as const;

export const INDICATOR_LABELS: Record<string, string> = {
  RSI: "RSI",
  MA: "Moving Average",
  MACD: "MACD",
  BB: "Bollinger Bands",
  STOCH: "Stochastic",
};

export const CONDITION_LABELS: Record<string, string> = {
  CROSSES_ABOVE: "crosses above",
  CROSSES_BELOW: "crosses below",
  GREATER_THAN: "is greater than",
  LESS_THAN: "is less than",
};

export const ruleSchema = z.object({
  indicator: z.enum(INDICATORS),
  condition: z.enum(CONDITIONS),
  value: z.number({ error: "Enter a number" }).min(0, "Must be ≥ 0"),
  logicOperator: z.enum(LOGIC_OPS),
});

export type RuleFormValue = z.infer<typeof ruleSchema>;

export const strategyFormSchema = z.object({
  name: z.string().min(1, "Strategy name is required").max(100, "Max 100 characters"),
  pair: z.enum(PAIRS, { error: "Select a trading pair" }),
  timeframe: z.enum(TIMEFRAMES, { error: "Select a timeframe" }),
  entryRules: z
    .array(ruleSchema)
    .min(1, "Add at least one entry rule"),
  exitRules: z
    .array(ruleSchema)
    .min(1, "Add at least one exit rule"),
});

export type StrategyFormValues = z.infer<typeof strategyFormSchema>;

// API response shapes
export interface StrategyListItem {
  id: string;
  name: string;
  pair: string;
  timeframe: string;
  status: "DRAFT" | "ACTIVE";
  createdAt: string;
  _count: { rules_rel: number; backtests: number };
}

export interface StrategyDetail extends StrategyListItem {
  rules_rel: {
    id: string;
    indicator: string;
    condition: string;
    value: number;
    logicOperator: string;
    ruleType: "ENTRY" | "EXIT";
  }[];
}
