@echo off
chcp 65001 >nul
title Ebara Workbench - Stop Server

echo ========================================
echo   Ebara Workbench - Stop Server
echo ========================================
echo.

netstat -ano | findstr ":3015" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Server is not running on port 3015
    echo.
    pause
    exit /b 0
)

echo [INFO] Stopping development server on port 3015...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3015" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [INFO] Server stopped successfully.
echo.
timeout /t 2 /nobreak >nul
