@echo off
cd /d "%~dp0"
setlocal

rem --- 1. Find Python (py -> python -> python3) ---
set "PYTHON_CMD="

where py >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=py"

if "%PYTHON_CMD%"=="" (
    where python >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if "%PYTHON_CMD%"=="" (
    where python3 >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=python3"
)

if "%PYTHON_CMD%"=="" (
    echo Error: Python not found.
    echo Please install Python from https://www.python.org/
    echo.
    pause
    exit /b 1
)

rem --- 2. Configuration ---
set "PORT=8000"
rem 每次启动生成一个随机数，用来绕过缓存
set "CACHE_BUSTER=%RANDOM%"
set "URL=http://localhost:%PORT%/index.html?t=%CACHE_BUSTER%"

echo ========================================
echo Starting Pixels Survivor Local Server...
echo Game URL: %URL%
echo Keep this window open to play.
echo ========================================

rem --- 3. Open Browser Async (Delayed) ---
rem Use start /b to run in background within same console context
rem ping -n 3 simulates ~2 seconds delay
start "" /b cmd /c "ping 127.0.0.1 -n 3 >nul & start "" "%URL%""

rem --- 4. Start Server (Foreground) ---
"%PYTHON_CMD%" -m http.server %PORT%

endlocal
