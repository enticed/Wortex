@echo off
REM Woodles Project Setup Script for Windows
REM This is a wrapper that calls the PowerShell script

echo ==========================================
echo   Woodles Project Setup
echo   Launching PowerShell script...
echo ==========================================
echo.

REM Check if we're in the Wortex directory
if not exist "package.json" (
    echo Error: This script must be run from the Wortex root directory
    pause
    exit /b 1
)

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0clone-for-woodles.ps1"

if errorlevel 1 (
    echo.
    echo Script failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo Done!
pause
