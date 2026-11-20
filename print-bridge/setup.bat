@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js mungon. Instaloje nga https://nodejs.org dhe provo perseri.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 (
  echo Instalimi deshtoi.
  pause
  exit /b 1
)
echo.
echo Bridge gati — nis me: node bridge.js
echo.
pause
