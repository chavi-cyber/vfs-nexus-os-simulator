
@echo off
setlocal

title VFS NEXUS - Startup

echo ========================================
echo       VFS NEXUS - STARTUP
echo ========================================
echo.

cd /d "%~dp0"

if not exist "backend\package.json" (
    echo ERROR: Backend folder not found.
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: Frontend folder not found.
    pause
    exit /b 1
)

if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    pushd backend
    call npm install
    if errorlevel 1 (
        echo Backend installation failed.
        pause
        exit /b 1
    )
    popd
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    pushd frontend
    call npm install
    if errorlevel 1 (
        echo Frontend installation failed.
        pause
        exit /b 1
    )
    popd
)

echo Starting backend...
start "VFS NEXUS - Backend" cmd /k "cd /d ""%~dp0backend"" && npm run dev"

echo Waiting for backend startup...
timeout /t 3 /nobreak >nul

echo Starting frontend...
start "VFS NEXUS - Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo Both terminal windows have been opened.
echo.
echo Backend:  http://localhost:5000/api/health
echo Frontend: http://localhost:5173
echo.
echo Keep both terminal windows open.
echo Check their output for any startup errors.
echo.
pause