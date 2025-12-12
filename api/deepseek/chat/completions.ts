import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 从环境变量获取 API Key
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('❌ DEEPSEEK_API_KEY 未配置');
    return res.status(500).json({ error: 'API Key not configured' });
  }

  console.log('🔑 使用 API Key:', apiKey.substring(0, 10) + '...');
  console.log('📡 转发请求到火山引擎...');

  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    console.log('📥 火山引擎响应状态:', response.status);
    
    if (!response.ok) {
      console.error('❌ 火山引擎错误:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ 成功返回数据');
    return res.status(200).json(data);
    
  } catch (error: any) {
    console.error('❌ Serverless Function 错误:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

