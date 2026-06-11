@echo off
title WealthFlow Dev Server Launcher
echo ===================================================
echo   🟢 Starting WealthFlow Dev Server...
echo ===================================================
cd /d "f:\All_Works\Programming\React_Programming\MoneyLust"

:: Start Vite dev server in a minimized window
start /min cmd /c "yarn dev || npm run dev"

echo Waiting for the server to spin up...
timeout /t 2 /nobreak >nul

:: Open browser at port 9999
echo 🚀 Opening WealthFlow in default browser...
start http://localhost:9999

echo ===================================================
echo   🟢 WealthFlow is running successfully!
echo   You can close this window now.
echo ===================================================
timeout /t 3 >nul
exit
