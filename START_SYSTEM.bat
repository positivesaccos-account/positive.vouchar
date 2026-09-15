@echo off
title Positive Saving & Credit Co-operative Ltd. - Voucher System
color 0A
cls
echo ================================================================
echo   POSITIVE SAVING & CREDIT CO-OPERATIVE LTD.
echo   Digital Voucher & Internal Accounting Control System
echo ================================================================
echo.
echo Starting Accounting Server...
echo Please wait...
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this computer!
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b
)

echo Starting server on http://localhost:5000 ...
start http://localhost:5000
node server/index.js
pause
