#!/bin/bash

# 火山引擎云函数部署脚本

echo "📦 准备部署到火山引擎 veFaaS..."

# 1. 检查是否安装了 zip
if ! command -v zip &> /dev/null; then
    echo "❌ 错误：需要安装 zip 工具"
    echo "   macOS: brew install zip"
    echo "   Linux: sudo apt-get install zip"
    exit 1
fi

# 2. 清理旧的部署包
rm -f function.zip

# 3. 安装依赖（如果需要）
echo "📥 安装依赖..."
npm install --production

# 4. 打包云函数
echo "📦 打包云函数代码..."
zip -r function.zip index.js package.json node_modules/

# 5. 完成
echo ""
echo "✅ 部署包已准备好: function.zip"
echo ""
echo "📋 下一步："
echo "   1. 登录火山引擎控制台: https://console.volcengine.com/vefaas"
echo "   2. 创建新函数"
echo "   3. 上传 function.zip"
echo "   4. 配置环境变量 DEEPSEEK_API_KEY"
echo "   5. 配置 HTTP 触发器"
echo ""
echo "📖 详细步骤请查看 DEPLOY_VOLCENGINE.md"

