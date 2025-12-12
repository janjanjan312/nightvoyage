# 🔥 火山引擎部署指南

完整的火山引擎部署教程，全部在中国境内，速度最快！

---

## 📋 前置准备

### 1. 注册火山引擎账号
- 访问：https://www.volcengine.com
- 点击「注册」，完成个人实名认证

### 2. 开通服务
登录后，开通以下服务：
- ✅ **火山方舟** - DeepSeek API（已有 API Key）
- ✅ **veFaaS** - 云函数服务（处理 API 请求）
- ✅ **veImageX** 或 **TOS** - 对象存储（托管静态网站）

---

## 🚀 部署步骤

### 第一步：部署云函数（后端 API）

#### 1.1 打包云函数代码

```bash
cd volcengine-function
chmod +x deploy.sh
./deploy.sh
```

你会得到一个 `function.zip` 文件。

#### 1.2 创建云函数

1. 访问火山引擎控制台：https://console.volcengine.com/vefaas
2. 点击「创建函数」
3. **选择函数类型**：「事件函数」（⚠️ 不是 Web 应用函数）
4. 配置如下：
   - **函数名称**: `deepseek-proxy`
   - **运行时**: 选择 `Node.js 20.x` ⭐（推荐）或 `Node.js 14.x`
   - **上传方式**: 选择「上传 ZIP 包」
   - **ZIP 文件**: 上传 `function.zip`
   - **入口函数**: `index.handler`
   - **内存**: 128 MB（够用了）
   - **超时时间**: 60 秒

#### 1.3 配置环境变量

在函数配置页面，添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `DEEPSEEK_API_KEY` | `78aef6f9-14c8-4838-ba61-53910bf10a44` |

#### 1.4 配置 HTTP 触发器

1. 点击「添加触发器」
2. 选择「HTTP 触发器」
3. 配置：
   - **路径**: `/api/deepseek/chat/completions`
   - **方法**: `POST`
   - **鉴权**: 关闭（前端公开访问）

4. 保存后，你会得到一个 **触发器 URL**，例如：
   ```
   https://xxxxx.cn-beijing.vefaas.volcengineapi.com/api/deepseek/chat/completions
   ```

   **📝 记下这个 URL，后面会用到！**

---

### 第二步：部署前端静态网站

#### 2.1 构建前端

```bash
# 回到项目根目录
cd ..

# 设置生产环境的 API 端点（使用你在第一步得到的云函数 URL）
echo "VITE_API_URL=https://xxxxx.cn-beijing.vefaas.volcengineapi.com/api/deepseek/chat/completions" > .env.production

# 构建前端
npm run build
```

构建完成后，会在 `dist/` 目录生成静态文件。

#### 2.2 上传到对象存储

##### 方式 A：使用 veImageX（推荐，有 CDN）

1. 访问：https://console.volcengine.com/imagex
2. 创建「服务」
3. 开启「静态网站托管」
4. 上传 `dist/` 目录下的所有文件
5. 配置：
   - **首页**: `index.html`
   - **错误页面**: `index.html`（SPA 单页应用必须设置）
6. 获取访问域名，例如：`https://your-app.imagex.volcengineapi.com`

##### 方式 B：使用 TOS 对象存储

1. 访问：https://console.volcengine.com/tos
2. 创建 Bucket
3. 开启「静态网站托管」
4. 上传 `dist/` 目录下的所有文件
5. 配置：
   - **首页**: `index.html`
   - **错误页面**: `index.html`
6. 获取访问域名

---

### 第三步：绑定自定义域名（可选）

如果你有自己的域名：

1. 在火山引擎控制台配置 CNAME
2. 在你的域名服务商添加 CNAME 记录
3. 等待 DNS 生效（通常 5-10 分钟）

---

## ✅ 部署完成！

访问你的域名或对象存储提供的 URL，应用就可以正常使用了！🎉

---

## 🔍 常见问题

### 1. 云函数调用失败

**检查项**：
- ✅ 环境变量 `DEEPSEEK_API_KEY` 是否正确配置
- ✅ HTTP 触发器是否正确配置
- ✅ 函数日志中是否有错误信息

**查看日志**：
- 控制台 → veFaaS → 函数详情 → 调用日志

### 2. 前端无法连接到云函数

**检查项**：
- ✅ `.env.production` 中的 `VITE_API_URL` 是否正确
- ✅ 是否重新构建了前端（`npm run build`）
- ✅ 云函数的 HTTP 触发器是否开启了 CORS

**修复 CORS**：
如果遇到跨域问题，确保云函数返回了正确的 CORS 头部（已在代码中配置）。

### 3. 页面刷新后 404

**原因**：SPA 单页应用的路由问题

**解决**：
- 在对象存储的「静态网站托管」配置中
- 将「错误页面」设置为 `index.html`

### 4. 速度还是慢

**检查项**：
- ✅ 确认云函数和对象存储都在「华北-北京」区域
- ✅ 开启了 CDN 加速
- ✅ 浏览器 F12 → Network 查看实际延迟

---

## 💰 成本估算（个人使用）

| 服务 | 免费额度 | 超出后价格 | 预计成本 |
|------|----------|------------|----------|
| DeepSeek API | 50万 tokens | 0.0008元/千tokens | **免费** |
| veFaaS 云函数 | 100万次调用 | 0.000133元/次 | **免费** |
| 对象存储 | 10GB 存储 | 0.099元/GB/月 | **免费** |
| CDN 流量 | 10GB 流量 | 0.24元/GB | **可能 1-5元/月** |

**总成本：基本免费，最多几元/月** 🎉

---

## 📞 技术支持

如果遇到问题：
- 火山引擎工单系统：https://console.volcengine.com/workorder
- 开发者社区：https://developer.volcengine.com

---

## 🎓 进阶优化

### 1. 使用自定义域名 + HTTPS
- 提升品牌形象
- 获得更好的 SEO

### 2. 配置 CDN 缓存策略
- 静态资源（JS/CSS/图片）设置长缓存
- HTML 设置短缓存或不缓存

### 3. 监控和告警
- 配置云函数调用告警
- 监控 API 使用量

### 4. 日志分析
- 定期查看云函数日志
- 分析用户使用情况

---

祝你部署成功！🚀

