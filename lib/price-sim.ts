// Pure client+server safe price/indicator simulation — no DB imports

export const BASE_PRICE: Record<string, number> = {
  XAUUSD: 2015,
  EURUSD: 1.082,
  GBPUSD: 1.264,
  USDJPY: 148.8,
};

export const PIP: Record<string, number> = {
  XAUUSD: 0.01,
  EURUSD: 0.0001,
  GBPUSD: 0.0001,
  USDJPY: 0.01,
};

export const PIP_VALUE: Record<string, number> = {
  XAUUSD: 1,
  EURUSD: 10,
  GBPUSD: 10,
  USDJPY: 7,
};

export const SPREAD: Record<string, number> = {
  XAUUSD: 0.3,
  EURUSD: 0.00015,
  GBPUSD: 0.0002,
  USDJPY: 0.02,
};

export const TF_MINUTES: Record<string, number> = {
  M1: 1, M5: 5, M15: 15, M30: 30, H1: 60, H4: 240, D1: 1440,
};

export function simulatePrice(pair: string, nowMs = Date.now()): number {
  const base = BASE_PRICE[pair] ?? 1.0;
  const vol = base * 0.006;
  const t = nowMs / 1000;
  const slow = Math.sin(t / 14400) * vol * 0.6;
  const fast = Math.sin(t / 900 + 1.3) * vol * 0.3;
  const micro = Math.sin(t / 60 + 2.7) * vol * 0.1;
  return base + slow + fast + micro;
}

export function simulateIndicator(indicator: string, pair: string, nowMs = Date.now()): number {
  const t = nowMs / 1000;
  switch (indicator) {
    case "RSI": {
      const raw = Math.sin(t / 7200 + 0.5);
      return 50 + raw * 35;
    }
    case "MA":
      return simulatePrice(pair, nowMs - 900_000);
    case "MACD":
      return Math.sin(t / 5400 + 1.1);
    case "BB":
      return simulatePrice(pair, nowMs);
    case "STOCH": {
      const raw = Math.sin(t / 3600 + 0.8);
      return 50 + raw * 45;
    }
    default:
      return 50;
  }
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  timeLabel: string;
}

export function generateCandles(pair: string, timeframe: string, count = 40): Candle[] {
  const intervalMs = (TF_MINUTES[timeframe] ?? 15) * 60_000;
  const now = Date.now();
  const currentStart = Math.floor(now / intervalMs) * intervalMs;

  return Array.from({ length: count }, (_, i) => {
    const startMs = currentStart - (count - 1 - i) * intervalMs;
    const samples = Array.from({ length: 12 }, (_, j) =>
      simulatePrice(pair, startMs + (j / 12) * intervalMs)
    );
    const isLive = i === count - 1;
    const close = isLive ? simulatePrice(pair, now) : samples[samples.length - 1];
    const date = new Date(startMs);
    const label =
      intervalMs < 3_600_000
        ? `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
        : `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}h`;

    return {
      time: startMs,
      open: samples[0],
      high: Math.max(...samples, close),
      low: Math.min(...samples, close),
      close,
      timeLabel: label,
    };
  });
}
