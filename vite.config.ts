import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/deepseek': {
            target: 'https://ark.cn-beijing.volces.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/deepseek/, '/api/v3'),
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                const apiKey = env.DEEPSEEK_API_KEY || '78aef6f9-14c8-4838-ba61-53910bf10a44';
                console.log('🔑 火山引擎代理 API Key:', apiKey.substring(0, 10) + '...');
                console.log('🔗 转发路径:', req.url, '→ /api/v3' + req.url.replace('/api/deepseek', ''));
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
                proxyReq.setHeader('Content-Type', 'application/json');
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log('📥 火山引擎响应:', proxyRes.statusCode);
              });
              proxy.on('error', (err, req, res) => {
                console.error('❌ 代理错误:', err);
              });
            }
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY),
        'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
