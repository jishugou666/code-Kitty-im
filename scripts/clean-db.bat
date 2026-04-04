@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo        IM Chat 数据库清理脚本
echo ============================================
echo.

set ROOT_DIR=%~dp0
set ROOT_DIR=%ROOT_DIR:~0,-1%

cd /d "%ROOT_DIR%"

echo 警告: 此操作将删除数据库中的所有数据!
echo.
set /p CONFIRM=输入 "yes" 确认清空数据库:

if not "%CONFIRM%"=="yes" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 正在执行数据库清理...
cd /d "%ROOT_DIR%\database"
call node clean-db.js

echo.
echo 按任意键退出...
pause >nul
