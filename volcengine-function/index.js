/**
 * 火山引擎 veFaaS 云函数入口
 * 用于转发前端请求到火山引擎 DeepSeek API
 */

exports.handler = async (event, context) => {
  console.log('📡 收到请求:', event.path);

  // 解析请求
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  // 从环境变量获取 API Key
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('❌ DEEPSEEK_API_KEY 未配置');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'API Key not configured' })
    };
  }

  console.log('🔑 使用 API Key:', apiKey.substring(0, 10) + '...');

  try {
    // 调用火山引擎 DeepSeek API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    console.log('📥 API 响应状态:', response.status);
    
    if (!response.ok) {
      console.error('❌ API 错误:', data);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }

    console.log('✅ 成功返回数据');
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // 允许跨域
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    console.error('❌ 函数错误:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

