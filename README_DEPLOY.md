# 🚀 夜航船 - 荣格心理学解析工具 - 部署指南

本项目支持两种部署方式：**火山引擎**（推荐）和 **Vercel**

---

## ⭐ 推荐方案：火山引擎（速度最快）

### 为什么选择火山引擎？

- ✅ **全部在中国境内** - 延迟最低（10-50ms）
- ✅ **50万 tokens 免费额度** - 个人使用足够
- ✅ **基本免费** - 最多几元/月
- ✅ **和 DeepSeek API 在同一个平台** - 内网通信更快

### 快速开始

```bash
# 1. 部署云函数（后端）
cd volcengine-function
./deploy.sh

# 2. 构建前端
cd ..
echo "VITE_API_URL=<你的云函数URL>" > .env.production
npm run build

# 3. 上传 dist/ 到火山引擎对象存储
```

### 📖 详细步骤

请查看：**[DEPLOY_VOLCENGINE.md](./DEPLOY_VOLCENGINE.md)**

---

## 备选方案：Vercel（国际化部署）

### 适用场景

- 🌍 面向海外用户
- 🚀 快速体验部署流程
- 💻 不想配置云服务器

### ⚠️ 注意事项

- 火山引擎 API 在中国北京，Vercel 免费版在美国
- 可能会有 **300-500ms** 的额外延迟

### 快速开始

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod

# 4. 设置环境变量
vercel env add DEEPSEEK_API_KEY
# 输入：78aef6f9-14c8-4838-ba61-53910bf10a44
```

### 📖 详细步骤

请查看：**[DEPLOY.md](./DEPLOY.md)**

---

## 📁 项目结构

```
.
├── volcengine-function/       # 火山引擎云函数代码
│   ├── index.js              # 函数入口
│   ├── package.json          # 依赖配置
│   └── deploy.sh             # 部署脚本
├── api/                       # Vercel Serverless Functions
│   └── deepseek/
│       └── chat/
│           └── completions.ts
├── services/                  # 前端服务
│   └── geminiService.ts      # API 调用（自动检测环境）
├── dist/                      # 构建输出（部署这个目录）
├── vercel.json               # Vercel 配置
├── DEPLOY_VOLCENGINE.md      # 火山引擎部署详细指南 ⭐
├── DEPLOY.md                 # Vercel 部署详细指南
└── README_DEPLOY.md          # 本文件
```

---

## 🔧 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

本地开发会自动使用 Vite 代理，直接连接火山引擎 API。

---

## 🌍 环境变量

### 开发环境（自动）
使用 `vite.config.ts` 中的代理配置，无需额外配置。

### 生产环境（需要配置）

**火山引擎**：
```bash
# 复制示例文件
cp env.production.example .env.production

# 编辑文件，填入你的云函数 URL
VITE_API_URL=https://xxxxx.cn-beijing.vefaas.volcengineapi.com/api/deepseek/chat/completions
```

**Vercel**：
在 Vercel 控制台设置环境变量 `DEEPSEEK_API_KEY`

---

## 💰 成本对比

| 方案 | 月成本 | 延迟 | 备注 |
|------|--------|------|------|
| **火山引擎** | 0-5元 | 10-50ms | ⭐ 推荐 |
| **Vercel 免费版** | 0元 | 300-800ms | 延迟较高 |
| **Vercel Pro** | ~140元 | 100-200ms | 可选新加坡节点 |
| **本地运行** | 0元 | <10ms | 仅自己使用 |

---

## 📞 问题反馈

如有问题，请参考：
- 火山引擎部署：[DEPLOY_VOLCENGINE.md](./DEPLOY_VOLCENGINE.md) 的「常见问题」章节
- Vercel 部署：[DEPLOY.md](./DEPLOY.md) 的「常见问题」章节

---

## 🎉 开始部署

1. **推荐新手**：先在本地运行体验（`npm run dev`）
2. **想要分享**：使用火山引擎部署（最快最稳定）
3. **快速测试**：使用 Vercel 部署（5分钟搞定）

祝部署顺利！🚀

