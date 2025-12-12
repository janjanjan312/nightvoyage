#!/bin/bash

# 部署前环境检查脚本

echo "🔍 检查部署环境..."
echo ""

# 检查 Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js 未安装"
    echo "   请访问: https://nodejs.org"
    exit 1
fi

# 检查 npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm 未安装"
    exit 1
fi

# 检查依赖
if [ -d "node_modules" ]; then
    echo "✅ 依赖已安装"
else
    echo "⚠️  依赖未安装，正在安装..."
    npm install
fi

# 检查 dist 目录
if [ -d "dist" ]; then
    echo "✅ 构建输出目录已存在"
else
    echo "⚠️  未构建，需要运行 npm run build"
fi

# 检查火山引擎函数目录
if [ -d "volcengine-function" ]; then
    echo "✅ 火山引擎云函数代码已准备"
else
    echo "❌ 缺少 volcengine-function 目录"
    exit 1
fi

echo ""
echo "📋 部署选项："
echo "   1. 火山引擎（推荐）: 查看 DEPLOY_VOLCENGINE.md"
echo "   2. Vercel:          查看 DEPLOY.md"
echo ""
echo "✅ 环境检查完成！"

