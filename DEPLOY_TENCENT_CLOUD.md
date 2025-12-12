# 🚀 腾讯云轻量应用服务器部署指南

快速部署指南，适用于已有腾讯云轻量应用服务器的用户。

---

## 📋 前提条件

- ✅ 已有腾讯云轻量应用服务器
- ✅ 服务器已安装 Node.js（建议 v16 或以上）
- ✅ 服务器可以通过 SSH 访问

---

## 🚀 部署步骤

### 第 1 步：连接到服务器

```bash
# 使用腾讯云控制台提供的 IP 和密码
ssh root@你的服务器IP

# 或者使用密钥
ssh -i ~/.ssh/your_key.pem root@你的服务器IP
```

---

### 第 2 步：检查环境

```bash
# 检查 Node.js 版本（需要 v16+）
node -v

# 检查 npm 版本
npm -v

# 如果没有安装或版本太低，安装/升级 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs  # Ubuntu/Debian

# 或者 CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs
```

---

### 第 3 步：上传代码

#### 方式 A：使用 SCP（推荐）

在**本地电脑**运行：

```bash
# 上传打包好的文件
scp ~/Desktop/nightvoyage.tar.gz root@你的服务器IP:/root/

# 或者直接上传整个项目（比较慢）
scp -r "/Users/chenshiliang/Desktop/夜航船---荣格心理学解析工具 (2)" root@你的服务器IP:/root/
```

然后在**服务器上**解压：

```bash
cd /root
tar -xzf nightvoyage.tar.gz -C nightvoyage
cd nightvoyage
```

#### 方式 B：使用 Git（如果代码在 GitHub）

在**服务器上**运行：

```bash
cd /root
git clone https://github.com/你的用户名/你的仓库.git nightvoyage
cd nightvoyage
```

#### 方式 C：使用腾讯云控制台上传

1. 登录腾讯云控制台
2. 找到你的轻量应用服务器
3. 使用「文件传输」功能上传 `nightvoyage.tar.gz`
4. SSH 连接后解压

---

### 第 4 步：安装依赖

```bash
cd /root/nightvoyage  # 或你的项目目录

# 安装依赖
npm install

# 如果速度慢，使用国内镜像
npm config set registry https://registry.npmmirror.com
npm install
```

---

### 第 5 步：配置环境

确保 `vite.config.ts` 中的 API Key 已配置：

```bash
# 查看配置
cat vite.config.ts | grep DEEPSEEK_API_KEY

# 应该看到：78aef6f9-14c8-4838-ba61-53910bf10a44
```

---

### 第 6 步：测试运行

```bash
# 开发模式运行（测试）
npm run dev

# 应该看到：
#   VITE v6.4.1  ready in XXX ms
#   ➜  Local:   http://localhost:3000/
```

**测试**：
```bash
# 在服务器上测试
curl http://localhost:3000

# 应该返回 HTML 内容
```

---

### 第 7 步：配置防火墙

#### 方式 A：腾讯云控制台（推荐）

1. 登录腾讯云控制台
2. 找到你的轻量应用服务器
3. 点击「防火墙」
4. 添加规则：
   - **应用类型**: 自定义
   - **协议**: TCP
   - **端口**: 3000
   - **策略**: 允许
5. 保存

#### 方式 B：命令行（如果使用 ufw）

```bash
# Ubuntu/Debian
ufw allow 3000
ufw reload

# 或者使用 firewalld（CentOS）
firewall-cmd --zone=public --add-port=3000/tcp --permanent
firewall-cmd --reload
```

---

### 第 8 步：使用 PM2 守护进程（推荐）⭐

**为什么用 PM2**：
- ✅ 自动重启（程序崩溃时）
- ✅ 后台运行（关闭 SSH 后继续运行）
- ✅ 日志管理
- ✅ 开机自启

**安装 PM2**：

```bash
npm install -g pm2
```

**创建启动脚本**：

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nightvoyage',
    script: 'npm',
    args: 'run dev',
    cwd: '/root/nightvoyage',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    watch: false,
    autorestart: true,
    max_memory_restart: '500M'
  }]
}
EOF
```

**启动应用**：

```bash
# 启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs nightvoyage

# 设置开机自启
pm2 startup
pm2 save
```

**常用 PM2 命令**：

```bash
pm2 restart nightvoyage  # 重启
pm2 stop nightvoyage     # 停止
pm2 delete nightvoyage   # 删除
pm2 logs nightvoyage     # 查看日志
pm2 monit                # 监控面板
```

---

### 第 9 步：访问应用

在浏览器访问：

```
http://你的服务器IP:3000
```

**成功标志**：
- ✅ 看到「夜航船」应用界面
- ✅ 可以正常选择分析模式
- ✅ AI 能正常回复

---

## 🔧 高级配置（可选）

### 配置 Nginx 反向代理

如果你想用 80 端口访问（不需要 `:3000`）：

#### 1. 安装 Nginx

```bash
# Ubuntu/Debian
apt update && apt install -y nginx

# CentOS/RHEL
yum install -y nginx
```

#### 2. 配置 Nginx

```bash
cat > /etc/nginx/sites-available/nightvoyage << 'EOF'
server {
    listen 80;
    server_name 你的服务器IP;  # 或者你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/nightvoyage /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

#### 3. 更新防火墙

```bash
# 打开 80 端口
ufw allow 80
# 或者在腾讯云控制台防火墙中添加 80 端口
```

现在可以直接访问：`http://你的服务器IP`

---

### 配置域名（可选）

如果你有域名：

1. 在域名服务商添加 A 记录：
   ```
   @ 或 www  →  你的服务器IP
   ```

2. 修改 Nginx 配置中的 `server_name`：
   ```nginx
   server_name yourdomain.com www.yourdomain.com;
   ```

3. 配置 HTTPS（使用 Let's Encrypt）：
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 🔍 故障排查

### 应用无法访问

```bash
# 检查应用是否运行
pm2 status

# 检查端口是否监听
netstat -tulnp | grep 3000

# 检查防火墙
ufw status
# 或
firewall-cmd --list-all

# 查看应用日志
pm2 logs nightvoyage
```

### API 调用失败

```bash
# 检查 API Key
cat vite.config.ts | grep DEEPSEEK_API_KEY

# 测试 API 连接（在服务器上）
curl -X POST https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Authorization: Bearer 78aef6f9-14c8-4838-ba61-53910bf10a44" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v3-2-251201","messages":[{"role":"user","content":"你好"}]}'
```

### 性能优化

```bash
# 使用生产模式构建
npm run build

# 使用 serve 运行（比 dev 模式快）
npm install -g serve
pm2 delete nightvoyage
pm2 start serve --name nightvoyage -- dist -p 3000
```

---

## 📊 成本估算

| 项目 | 费用 |
|------|------|
| 腾讯云轻量服务器 | ~50-100元/年 |
| DeepSeek API | 免费（50万 tokens） |
| 带宽流量 | 包含在服务器套餐 |
| **总计** | **~50-100元/年** |

---

## 🎯 后续维护

### 更新代码

```bash
# 停止应用
pm2 stop nightvoyage

# 拉取最新代码（如果用 Git）
cd /root/nightvoyage
git pull

# 或上传新的 tar.gz 并解压

# 安装新依赖
npm install

# 重启应用
pm2 restart nightvoyage
```

### 查看日志

```bash
pm2 logs nightvoyage
# 或
pm2 logs nightvoyage --lines 100
```

### 监控资源

```bash
pm2 monit
# 或
htop
```

---

## ✅ 部署完成！

现在你的应用已经：
- ✅ 24/7 在线运行
- ✅ 可以从任何地方访问
- ✅ 自动重启（崩溃时）
- ✅ 全部在中国境内（速度快）

**访问地址**：`http://你的服务器IP:3000`

祝使用愉快！🎉

