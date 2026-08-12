@echo off
:: ═══════════════════════════════════════════════════════════════════
::  SHORTCUT VIRUS REMOVER LAUNCHER
::  Double-click to run. Automatically requests Admin rights.
:: ═══════════════════════════════════════════════════════════════════

title Shortcut Virus Remover

:: ─── Check for Admin rights ───────────────────────────────────────
NET SESSION >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [!] Administrator rights required.
    echo  [!] Requesting elevation...
    echo.
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: ─── Set window size and color ────────────────────────────────────
mode con: cols=72 lines=50
color 0B

cls
echo.
echo  ┌──────────────────────────────────────────────────────────────┐
echo  │         SHORTCUT VIRUS REMOVER  v2.0  - AntiGravity          │
echo  │              Running as Administrator...                      │
echo  └──────────────────────────────────────────────────────────────┘
echo.
echo  Launching PowerShell engine...
echo.
timeout /t 2 /nobreak >nul

:: ─── Run the PowerShell engine ────────────────────────────────────
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0engine.ps1"

echo.
echo  ┌──────────────────────────────────────────────────────────────┐
echo  │  Done! Check your Desktop for the full cleanup report.       │
echo  │  It is recommended to RESTART your PC after cleaning.        │
echo  └──────────────────────────────────────────────────────────────┘
echo.
pause
