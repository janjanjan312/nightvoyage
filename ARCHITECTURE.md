# 📐 夜航船 - 技术架构

---

## 🏗️ 系统架构

### 开发环境（本地）

```
┌─────────────┐
│  浏览器      │
│ localhost   │
└─────┬───────┘
      │ HTTP
      ↓
┌─────────────┐
│ Vite Server │ ← 你现在在这里
│ localhost:  │
│   3000      │
└─────┬───────┘
      │ Proxy
      ↓
┌─────────────────────────┐
│ 火山引擎 DeepSeek API    │
│ ark.cn-beijing.volces   │
│   .com                  │
└─────────────────────────┘
```

**优点**：
- ✅ 最快速度（<10ms）
- ✅ 免费
- ✅ 热更新开发体验

**缺点**：
- ❌ 只能自己用
- ❌ 需要保持终端运行

---

### 生产环境 - 火山引擎（推荐）

```
┌─────────────┐
│  用户浏览器  │
│  anywhere   │
└─────┬───────┘
      │ HTTPS
      ↓
┌─────────────────────┐
│ veImageX / TOS      │ ← 前端静态文件
│ 对象存储 + CDN      │    (HTML/JS/CSS)
│ (中国境内)          │
└─────┬───────────────┘
      │ 调用 API
      ↓
┌─────────────────────┐
│ veFaaS 云函数       │ ← 后端 API 代理
│ (Node.js)           │
│ (北京区域)          │
└─────┬───────────────┘
      │ 内网
      ↓
┌─────────────────────┐
│ 火山方舟             │ ← DeepSeek API
│ DeepSeek API        │
│ (北京区域)          │
└─────────────────────┘
```

**延迟分析**：
- 用户 → CDN: ~10-30ms（中国境内）
- CDN → 云函数: ~5-10ms（内网）
- 云函数 → DeepSeek: ~5-10ms（同区域内网）
- **总延迟**: ~20-50ms ⚡

**优点**：
- ✅ 速度最快（全部在中国境内）
- ✅ 成本低（基本免费）
- ✅ 稳定可靠
- ✅ 可以分享给朋友

---

### 生产环境 - Vercel（备选）

```
┌─────────────┐
│  用户浏览器  │
│  (中国)     │
└─────┬───────┘
      │ HTTPS
      ↓
┌─────────────────────┐
│ Vercel CDN          │ ← 前端静态文件
│ (全球节点)          │
└─────┬───────────────┘
      │ 调用 API
      ↓
┌─────────────────────┐
│ Vercel Serverless   │ ← 后端 API 代理
│ (美国东部)          │    ⚠️ 跨越太平洋
└─────┬───────────────┘
      │ 跨境
      ↓
┌─────────────────────┐
│ 火山方舟             │ ← DeepSeek API
│ DeepSeek API        │
│ (中国北京)          │
└─────────────────────┘
```

**延迟分析**：
- 用户 → Vercel CDN: ~50-100ms
- Vercel → 中国: ~200-400ms（跨境）
- 云函数 → DeepSeek: ~50-100ms
- **总延迟**: ~300-600ms 🐌

**优点**：
- ✅ 部署简单（5分钟）
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN

**缺点**：
- ❌ 延迟较高（跨境）
- ❌ 对中国用户不友好

---

## 🔧 技术栈

### 前端
- **框架**: React 19
- **构建工具**: Vite 6
- **语言**: TypeScript
- **样式**: 原生 CSS（无框架）

### 后端
- **API 代理**: 
  - 开发：Vite Proxy
  - 生产：veFaaS / Vercel Serverless Functions
- **AI 模型**: DeepSeek v3 (火山引擎方舟)

### 基础设施
- **开发**: 本地 Vite Server
- **部署（推荐）**: 
  - 前端: 火山引擎 veImageX / TOS
  - 后端: 火山引擎 veFaaS
- **部署（备选）**: Vercel

---

## 📦 项目文件说明

### 核心文件

| 文件 | 说明 |
|------|------|
| `index.tsx` | React 应用入口 |
| `App.tsx` | 主应用组件（模式选择、状态管理） |
| `services/geminiService.ts` | DeepSeek API 调用（**自动检测环境**） |
| `vite.config.ts` | Vite 配置（开发代理） |

### 部署文件

| 文件 | 用途 |
|------|------|
| `volcengine-function/` | 火山引擎云函数代码 |
| `api/deepseek/` | Vercel Serverless Functions |
| `vercel.json` | Vercel 配置 |
| `DEPLOY_VOLCENGINE.md` | 火山引擎部署指南 ⭐ |
| `DEPLOY.md` | Vercel 部署指南 |

---

## 🔐 安全性

### API Key 管理

**开发环境**：
- API Key 在 `vite.config.ts` 中配置
- 通过代理注入到请求头
- 前端代码不包含 API Key

**生产环境**：
- API Key 存储在云函数环境变量
- 前端调用云函数，云函数调用 DeepSeek
- 用户无法看到 API Key

### CORS 处理

**开发环境**：
- Vite 代理自动处理 CORS

**生产环境**：
- 云函数返回 CORS 头部允许前端访问

---

## 🎯 数据流

### 用户输入 → AI 回复

1. **用户输入**：在前端输入文本
2. **前端调用**：`services/geminiService.ts` 发起请求
3. **环境检测**：自动判断开发/生产环境
4. **API 调用**：
   - 开发：Vite Proxy → DeepSeek
   - 生产：云函数 → DeepSeek
5. **流式响应**：DeepSeek 返回流式数据
6. **打字机效果**：前端逐字显示

---

## 💡 设计亮点

### 1. 环境自适应

```typescript
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const DEEPSEEK_API_URL = isDevelopment 
  ? "/api/deepseek/chat/completions"  // 本地代理
  : import.meta.env.VITE_API_URL;      // 云函数
```

**好处**：
- 开发无需配置
- 生产一键切换
- 代码无需修改

### 2. 错误重试机制

- 自动重试（最多2次）
- 指数退避（1秒 → 2秒）
- 友好的错误提示

### 3. 分步流式渲染

- 先显示摘要（Summary）
- 再显示原型卡片（Archetypes）
- 最后显示深度分析（Shadow, Anima, Self）
- 打字机效果提升用户体验

---

## 🚀 性能优化

### 已实现

- ✅ 图片懒加载（Unsplash CDN）
- ✅ 组件按需渲染
- ✅ API 请求防抖
- ✅ 本地存储缓存（Mind Atlas）

### 可优化

- 🔄 代码分割（Dynamic Import）
- 🔄 Service Worker（离线支持）
- 🔄 预加载关键资源

---

## 📊 对比总结

| 指标 | 本地开发 | 火山引擎 | Vercel |
|------|---------|---------|--------|
| **部署难度** | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| **速度** | ⚡⚡⚡ | ⚡⚡⚡ | ⚡ |
| **成本** | 免费 | 0-5元/月 | 免费 |
| **稳定性** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **可分享** | ❌ | ✅ | ✅ |

**推荐**：
- 🏠 **自己用** → 本地开发
- 🚀 **分享** → 火山引擎
- 🌍 **海外** → Vercel

