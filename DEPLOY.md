# 部署到 Vercel 指南

## 📋 前置准备

1. 注册 Vercel 账号：https://vercel.com
2. 安装 Vercel CLI（可选）：`npm i -g vercel`

---

## 🚀 部署步骤

### 方式一：通过 Vercel 网站（推荐，最简单）

#### 1. 连接 Git 仓库

1. 登录 Vercel：https://vercel.com
2. 点击 **"Add New..."** → **"Project"**
3. 选择你的 Git 仓库（GitHub/GitLab/Bitbucket）
4. 如果还没上传代码到 Git：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <你的仓库地址>
   git push -u origin main
   ```

#### 2. 配置项目

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 3. 配置环境变量

在 **Environment Variables** 中添加：

| Name | Value |
|------|-------|
| `DEEPSEEK_API_KEY` | `78aef6f9-14c8-4838-ba61-53910bf10a44` |

#### 4. 部署

点击 **"Deploy"** 按钮，等待 1-2 分钟。

---

### 方式二：通过 Vercel CLI

```bash
# 1. 安装依赖
npm install

# 2. 登录 Vercel
vercel login

# 3. 部署（首次）
vercel

# 4. 添加环境变量
vercel env add DEEPSEEK_API_KEY
# 输入值：78aef6f9-14c8-4838-ba61-53910bf10a44

# 5. 生产部署
vercel --prod
```

---

## ✅ 部署成功后

你会得到一个 URL，例如：`https://your-app.vercel.app`

访问这个 URL，应用就可以正常使用了！

---

## 🔍 常见问题

### 1. API 调用失败

**原因**：环境变量未设置
**解决**：在 Vercel 控制台 → Settings → Environment Variables 中添加 `DEEPSEEK_API_KEY`

### 2. 构建失败

**原因**：依赖未安装
**解决**：运行 `npm install` 确保 `@vercel/node` 已安装

### 3. 404 错误

**原因**：路由配置问题
**解决**：确保 `vercel.json` 配置正确

---

## 📊 成本

- **Vercel 免费版**：
  - ✅ 每月 100GB 带宽
  - ✅ 无限制的部署次数
  - ✅ 自动 HTTPS
  - ✅ 全球 CDN

对于个人使用完全免费！🎉

