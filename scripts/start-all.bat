@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo        IM Chat App 一键启动脚本
echo ============================================
echo.

set ROOT_DIR=%~dp0
set ROOT_DIR=%ROOT_DIR:~0,-1%

cd /d "%ROOT_DIR%"

echo [1/6] 检查 Node.js 安装状态...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js 版本: %NODE_VERSION%

echo.
echo [2/6] 检查 MySQL 安装状态...
where mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] MySQL 命令行工具未在 PATH 中
    echo 请确保 MySQL 服务器已安装并正在运行
)

echo.
echo [3/6] 安装前端依赖...
if not exist "frontend\node_modules" (
    cd /d "%ROOT_DIR%\frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
    cd /d "%ROOT_DIR%"
) else (
    echo [跳过] 前端依赖已安装
)

echo.
echo [4/6] 安装后端依赖...
if not exist "backend\node_modules" (
    cd /d "%ROOT_DIR%\backend"
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 后端依赖安装失败
        pause
        exit /b 1
    )
    cd /d "%ROOT_DIR%"
) else (
    echo [跳过] 后端依赖已安装
)

echo.
echo [5/6] 检查数据库配置...
if not exist "backend\.env" (
    echo [警告] backend\.env 文件不存在，请检查数据库配置
)

echo.
echo [6/6] 启动服务...
echo.

echo [后端] 启动中 on http://localhost:3000 ...
start "IM Backend" cmd /c "cd /d "%ROOT_DIR%\backend" && node src\app.js"

echo [前端] 启动中 on http://localhost:5173 ...
cd /d "%ROOT_DIR%\frontend"
start "IM Frontend" cmd /c "npm run dev"

echo.
echo ============================================
echo        服务启动中...
echo ============================================
echo.
echo 后端 API: http://localhost:3000/api
echo 前端界面: http://localhost:5173
echo WebSocket: ws://localhost:3000/ws
echo.
echo 按任意键关闭此窗口（服务将继续在后台运行）
echo 停止服务请关闭对应的命令行窗口
echo ============================================

pause >nul
