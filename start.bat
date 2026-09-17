@echo off
chcp 65001 >nul
title Ebara Workbench - Dev Server

echo ========================================
echo   Ebara Workbench Development Server
echo ========================================
echo.

:: Check if already running
netstat -ano | findstr ":3015" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Server is already running on port 3015
    echo [INFO] Access at: http://localhost:3015
    echo.
    pause
    exit /b 0
)

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call pnpm install
)

echo [2/3] Starting development server...
start /b cmd /c "cd /d "%~dp0" && pnpm dev >nul 2>&1"

echo [3/3] Waiting for server to be ready...
timeout /t 3 /nobreak >nul

:check
netstat -ano | findstr ":3015" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 /nobreak >nul
    goto check
)

echo.
echo ========================================
echo   Server is running!
echo   Local:   http://localhost:3015
echo   Network: http://%COMPUTERNAME%:3015
echo ========================================
echo.
echo Press any key to stop the server...
pause >nul

echo.
echo [INFO] Stopping server...
taskkill /f /im node.exe >nul 2>&1
echo [INFO] Server stopped.
timeout /t 2 /nobreak >nul
