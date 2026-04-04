#!/bin/bash

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}       IM Chat App 一键启动脚本${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

echo "[1/6] 检查 Node.js 安装状态..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] Node.js 未安装，请先安装 Node.js 18+${NC}"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}[OK]${NC} Node.js 版本: $NODE_VERSION"

echo ""
echo "[2/6] 检查 MySQL 安装状态..."
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}[警告] MySQL 命令行工具未在 PATH 中${NC}"
    echo "请确保 MySQL 服务器已安装并正在运行"
fi

echo ""
echo "[3/6] 安装前端依赖..."
if [ ! -d "frontend/node_modules" ]; then
    cd "$ROOT_DIR/frontend"
    npm install
    cd "$ROOT_DIR"
else
    echo -e "${GREEN}[跳过]${NC} 前端依赖已安装"
fi

echo ""
echo "[4/6] 安装后端依赖..."
if [ ! -d "backend/node_modules" ]; then
    cd "$ROOT_DIR/backend"
    npm install
    cd "$ROOT_DIR"
else
    echo -e "${GREEN}[跳过]${NC} 后端依赖已安装"
fi

echo ""
echo "[5/6] 检查数据库配置..."
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}[警告]${NC} backend/.env 文件不存在，请检查数据库配置"
fi

echo ""
echo "[6/6] 启动服务..."
echo ""

echo -e "${CYAN}[后端]${NC} 启动中 on http://localhost:3000 ..."
cd "$ROOT_DIR/backend"
node src/app.js &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}       服务启动中...${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo "后端 API: http://localhost:3000/api"
echo "前端界面: http://localhost:5173"
echo "WebSocket: ws://localhost:3000/ws"
echo ""
echo "停止服务请按 Ctrl+C"
echo -e "${CYAN}============================================${NC}"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

wait
