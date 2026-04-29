"""
FXAU Python Bridge — connects your MetaTrader 5 account to the FXAU web app.

What it does:
  - Connects to your MT5 terminal (must be running on this PC)
  - Fetches your running bots + strategy rules from the FXAU app
  - Every 30 seconds: evaluates RSI/MA/MACD/BB/STOCH rules against real MT5 data
  - Places real BUY orders when entry rules trigger
  - Closes orders when exit rules trigger
  - Reports every trade to the FXAU app (visible in your dashboard)

Requirements:
  pip install MetaTrader5 requests python-dotenv

Usage:
  python fxau_bridge.py
"""

import os
import sys
import time
import json
import logging
from datetime import datetime

import requests
from dotenv import load_dotenv

load_dotenv()

# ─── Config ───────────────────────────────────────────────────────────────────

APP_URL    = os.getenv("APP_URL", "https://crypto-bot-orcin.vercel.app").rstrip("/")
BRIDGE_KEY = os.getenv("BRIDGE_KEY", "")
MT5_LOGIN  = int(os.getenv("MT5_LOGIN", "0"))
MT5_PASSWORD = os.getenv("MT5_PASSWORD", "")
MT5_SERVER   = os.getenv("MT5_SERVER", "")
LOT_SIZE     = float(os.getenv("LOT_SIZE", "0.01"))   # default 0.01 = micro lot
MAGIC        = int(os.getenv("MAGIC_NUMBER", "20250429"))
INTERVAL_SEC = int(os.getenv("CHECK_INTERVAL", "30"))

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("fxau")

# ─── Timeframe map ────────────────────────────────────────────────────────────

def get_mt5_timeframe(tf: str):
    import MetaTrader5 as mt5
    return {
        "M1":  mt5.TIMEFRAME_M1,
        "M5":  mt5.TIMEFRAME_M5,
        "M15": mt5.TIMEFRAME_M15,
        "M30": mt5.TIMEFRAME_M30,
        "H1":  mt5.TIMEFRAME_H1,
        "H4":  mt5.TIMEFRAME_H4,
        "D1":  mt5.TIMEFRAME_D1,
    }.get(tf, mt5.TIMEFRAME_M15)

# ─── Pip / value tables ───────────────────────────────────────────────────────

PIP = {
    "XAUUSD": 0.01,
    "EURUSD": 0.0001,
    "GBPUSD": 0.0001,
    "USDJPY": 0.01,
}
PIP_VALUE = {
    "XAUUSD": 1.0,
    "EURUSD": 10.0,
    "GBPUSD": 10.0,
    "USDJPY": 7.0,
}

# ─── Indicator calculations ───────────────────────────────────────────────────

def rsi(closes: list, period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    gains, losses = [], []
    for i in range(1, len(closes)):
        delta = closes[i] - closes[i - 1]
        (gains if delta > 0 else losses).append(abs(delta))
    avg_gain = sum(gains[-period:]) / period if gains else 0.0
    avg_loss = sum(losses[-period:]) / period if losses else 1e-9
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def sma(values: list, period: int) -> float:
    if not values:
        return 0.0
    return sum(values[-period:]) / min(period, len(values))

def get_indicator(indicator: str, bars) -> float:
    closes = [b["close"] for b in bars]
    highs  = [b["high"]  for b in bars]
    lows   = [b["low"]   for b in bars]

    if indicator == "RSI":
        return rsi(closes)
    elif indicator == "MA":
        return sma(closes, 14)
    elif indicator == "MACD":
        ma12 = sma(closes, 12)
        ma26 = sma(closes, 26)
        return ma12 - ma26
    elif indicator == "BB":
        return sma(closes, 20)          # middle band
    elif indicator == "STOCH":
        period = 14
        recent_h = max(highs[-period:]) if len(highs) >= period else max(highs)
        recent_l = min(lows[-period:])  if len(lows)  >= period else min(lows)
        if recent_h == recent_l:
            return 50.0
        return (closes[-1] - recent_l) / (recent_h - recent_l) * 100
    return 50.0

# ─── Rule evaluation ──────────────────────────────────────────────────────────

def eval_rule(rule: dict, bars_curr, bars_prev) -> bool:
    curr = get_indicator(rule["indicator"], bars_curr)
    cond = rule["condition"]
    val  = rule["value"]
    if cond == "GREATER_THAN":   return curr > val
    if cond == "LESS_THAN":      return curr < val
    if cond == "CROSSES_ABOVE":
        prev = get_indicator(rule["indicator"], bars_prev)
        return prev <= val and curr > val
    if cond == "CROSSES_BELOW":
        prev = get_indicator(rule["indicator"], bars_prev)
        return prev >= val and curr < val
    return False

def eval_rules(rules: list, bars_curr, bars_prev) -> bool:
    if not rules:
        return False
    result = eval_rule(rules[0], bars_curr, bars_prev)
    for r in rules[1:]:
        val = eval_rule(r, bars_curr, bars_prev)
        result = (result or val) if r["logicOperator"] == "OR" else (result and val)
    return result

# ─── MT5 order helpers ────────────────────────────────────────────────────────

def open_buy(symbol: str) -> tuple[int, float]:
    import MetaTrader5 as mt5
    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        raise RuntimeError(f"No tick data for {symbol} — is the symbol visible in MT5?")
    price = tick.ask
    filling = mt5.symbol_info(symbol).filling_mode
    # Try IOC first, then FOK
    for fill in [mt5.ORDER_FILLING_IOC, mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_RETURN]:
        if filling & fill:
            req = {
                "action":      mt5.TRADE_ACTION_DEAL,
                "symbol":      symbol,
                "volume":      LOT_SIZE,
                "type":        mt5.ORDER_TYPE_BUY,
                "price":       price,
                "magic":       MAGIC,
                "comment":     "FXAU",
                "type_time":   mt5.ORDER_TIME_GTC,
                "type_filling": fill,
            }
            result = mt5.order_send(req)
            if result.retcode == mt5.TRADE_RETCODE_DONE:
                return result.order, price
    raise RuntimeError(f"Order failed: {result.comment} (retcode={result.retcode})")

def close_buy(ticket: int, symbol: str) -> float:
    import MetaTrader5 as mt5
    positions = mt5.positions_get(ticket=ticket)
    if not positions:
        raise RuntimeError(f"Position {ticket} not found")
    pos   = positions[0]
    tick  = mt5.symbol_info_tick(symbol)
    price = tick.bid
    filling = mt5.symbol_info(symbol).filling_mode
    for fill in [mt5.ORDER_FILLING_IOC, mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_RETURN]:
        if filling & fill:
            req = {
                "action":      mt5.TRADE_ACTION_DEAL,
                "symbol":      symbol,
                "volume":      pos.volume,
                "type":        mt5.ORDER_TYPE_SELL,
                "position":    ticket,
                "price":       price,
                "magic":       MAGIC,
                "comment":     "FXAU close",
                "type_time":   mt5.ORDER_TIME_GTC,
                "type_filling": fill,
            }
            result = mt5.order_send(req)
            if result.retcode == mt5.TRADE_RETCODE_DONE:
                return price
    raise RuntimeError(f"Close failed: {result.comment} (retcode={result.retcode})")

# ─── FXAU app API helpers ─────────────────────────────────────────────────────

HEADERS = lambda: {"Authorization": f"Bearer {BRIDGE_KEY}", "Content-Type": "application/json"}

def fetch_bots() -> list:
    r = requests.get(f"{APP_URL}/api/bridge/bots", headers=HEADERS(), timeout=10)
    r.raise_for_status()
    return r.json()["bots"]

def report_open(bot_id: str, symbol: str, entry: float, lot: float, ticket: int) -> str:
    payload = {"botId": bot_id, "pair": symbol, "direction": "BUY",
               "entryPrice": entry, "lotSize": lot, "mt5Ticket": ticket}
    r = requests.post(f"{APP_URL}/api/bridge/trades", headers=HEADERS(),
                      json=payload, timeout=10)
    r.raise_for_status()
    return r.json()["id"]

def report_close(trade_id: str, exit_price: float, profit: float):
    payload = {"exitPrice": exit_price, "profit": profit}
    r = requests.patch(f"{APP_URL}/api/bridge/trades/{trade_id}", headers=HEADERS(),
                       json=payload, timeout=10)
    r.raise_for_status()

# ─── Recovery: match existing MT5 positions to app open trades ────────────────

def recover_open_trades(bots: list) -> dict:
    """On startup, find any MT5 positions already open with our magic number."""
    import MetaTrader5 as mt5
    open_trades = {}
    positions = mt5.positions_get() or []
    for pos in positions:
        if pos.magic != MAGIC:
            continue
        for bot in bots:
            if bot["strategy"]["pair"] == pos.symbol and pos.type == mt5.ORDER_TYPE_BUY:
                # Try to find matching app trade
                try:
                    r = requests.get(
                        f"{APP_URL}/api/trades?botId={bot['id']}&status=OPEN",
                        headers=HEADERS(), timeout=10
                    )
                    trades = r.json().get("trades", [])
                    if trades:
                        app_trade = trades[0]
                        open_trades[bot["id"]] = {
                            "ticket":       pos.ticket,
                            "app_trade_id": app_trade["id"],
                            "entry_price":  pos.price_open,
                            "symbol":       pos.symbol,
                        }
                        log.info(f"Recovered: bot={bot['name']} ticket={pos.ticket} @ {pos.price_open:.5f}")
                except Exception as e:
                    log.warning(f"Recovery lookup failed: {e}")
    return open_trades

# ─── Main loop ────────────────────────────────────────────────────────────────

def process_bot(bot: dict, open_trades: dict):
    import MetaTrader5 as mt5

    bot_id   = bot["id"]
    name     = bot["name"]
    strategy = bot["strategy"]
    symbol   = strategy["pair"]
    tf_mt5   = get_mt5_timeframe(strategy["timeframe"])

    entry_rules = [r for r in strategy["rules"] if r["ruleType"] == "ENTRY"]
    exit_rules  = [r for r in strategy["rules"] if r["ruleType"] == "EXIT"]

    # Fetch 100 bars for current + 1-bar-ago indicator calculation
    bars_curr = mt5.copy_rates_from_pos(symbol, tf_mt5, 0, 100)
    bars_prev = mt5.copy_rates_from_pos(symbol, tf_mt5, 1, 100)

    if bars_curr is None or len(bars_curr) == 0:
        log.warning(f"[{name}] No bars for {symbol} — skipping")
        return

    current_price = bars_curr[-1]["close"]

    if bot_id not in open_trades:
        # ── Evaluate entry ──
        if eval_rules(entry_rules, bars_curr, bars_prev):
            try:
                ticket, entry = open_buy(symbol)
                app_id = report_open(bot_id, symbol, entry, LOT_SIZE, ticket)
                open_trades[bot_id] = {
                    "ticket":       ticket,
                    "app_trade_id": app_id,
                    "entry_price":  entry,
                    "symbol":       symbol,
                }
                pnl_preview = ((current_price - entry) / PIP.get(symbol, 0.0001)) \
                              * PIP_VALUE.get(symbol, 10) * LOT_SIZE
                log.info(f"[{name}] ✅ BUY opened @ {entry:.5f}  ticket={ticket}")
            except Exception as e:
                log.error(f"[{name}] ❌ Open failed: {e}")
        else:
            log.info(f"[{name}] No entry signal  price={current_price:.5f}")
    else:
        # ── Evaluate exit ──
        trade = open_trades[bot_id]
        unrealized = ((current_price - trade["entry_price"]) / PIP.get(symbol, 0.0001)) \
                     * PIP_VALUE.get(symbol, 10) * LOT_SIZE
        log.info(f"[{name}] Holding  entry={trade['entry_price']:.5f}  "
                 f"now={current_price:.5f}  unrealized=${unrealized:+.2f}")

        if eval_rules(exit_rules, bars_curr, bars_prev):
            try:
                exit_price = close_buy(trade["ticket"], symbol)
                profit = ((exit_price - trade["entry_price"]) / PIP.get(symbol, 0.0001)) \
                         * PIP_VALUE.get(symbol, 10) * LOT_SIZE
                report_close(trade["app_trade_id"], exit_price, profit)
                del open_trades[bot_id]
                log.info(f"[{name}] ✅ BUY closed @ {exit_price:.5f}  P&L=${profit:+.2f}")
            except Exception as e:
                log.error(f"[{name}] ❌ Close failed: {e}")


def main():
    # ── Validate config ──
    if not BRIDGE_KEY:
        log.error("BRIDGE_KEY not set. Generate one in Settings → Python Bridge Key.")
        sys.exit(1)
    if not MT5_LOGIN or not MT5_PASSWORD or not MT5_SERVER:
        log.error("MT5_LOGIN / MT5_PASSWORD / MT5_SERVER not set in .env")
        sys.exit(1)

    # ── Import MT5 ──
    try:
        import MetaTrader5 as mt5
    except ImportError:
        log.error("MetaTrader5 not installed. Run: pip install MetaTrader5")
        sys.exit(1)

    # ── Init MT5 ──
    if not mt5.initialize():
        log.error(f"MT5 initialize() failed: {mt5.last_error()}")
        log.error("Make sure MetaTrader 5 terminal is open and logged in.")
        sys.exit(1)

    if not mt5.login(MT5_LOGIN, password=MT5_PASSWORD, server=MT5_SERVER):
        log.error(f"MT5 login failed: {mt5.last_error()}")
        mt5.shutdown()
        sys.exit(1)

    info = mt5.account_info()
    log.info(f"Connected: {info.name}  Balance: {info.balance:.2f} {info.currency}  Server: {MT5_SERVER}")
    log.info(f"App: {APP_URL}  Interval: {INTERVAL_SEC}s  LotSize: {LOT_SIZE}")
    log.info("─" * 60)

    open_trades: dict = {}

    try:
        while True:
            try:
                bots = fetch_bots()
            except Exception as e:
                log.warning(f"Could not fetch bots from app: {e}")
                time.sleep(INTERVAL_SEC)
                continue

            if not bots:
                log.info("No running bots — waiting…")
            else:
                # Recover on first run
                if not open_trades and bots:
                    open_trades = recover_open_trades(bots)

                for bot in bots:
                    try:
                        process_bot(bot, open_trades)
                    except Exception as e:
                        log.error(f"[{bot['name']}] Unhandled error: {e}")

            log.info(f"Next check in {INTERVAL_SEC}s  (open positions: {len(open_trades)})")
            time.sleep(INTERVAL_SEC)

    except KeyboardInterrupt:
        log.info("Stopped by user")
    finally:
        mt5.shutdown()
        log.info("MT5 disconnected")


if __name__ == "__main__":
    main()
