@echo off
echo ============================================================
echo  FXAU Python Bridge Setup
echo ============================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Download from https://python.org
    pause
    exit /b 1
)

echo Installing dependencies...
pip install MetaTrader5 requests python-dotenv

echo.
if not exist .env (
    copy .env.example .env
    echo Created .env from template. Edit it with your details before running.
) else (
    echo .env already exists - skipping copy.
)

echo.
echo ============================================================
echo  Setup complete!
echo  1. Edit .env with your bridge key + MT5 credentials
echo  2. Make sure MetaTrader 5 is open and logged in
echo  3. Run:  python fxau_bridge.py
echo ============================================================
pause
