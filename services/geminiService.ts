import { DreamAnalysis, AppMode, RefinementResponse, ChatMessage, ChatSession } from '../types';

// Constants
const API_KEY = "78aef6f9-14c8-4838-ba61-53910bf10a44"; // 火山引擎 API Key

// 自动检测环境：开发环境用本地代理，生产环境用环境变量
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const DEEPSEEK_API_URL = isDevelopment 
  ? "/api/deepseek/chat/completions"  // 本地开发：使用 Vite 代理
  : import.meta.env.VITE_API_URL || "/api/deepseek/chat/completions"; // 生产环境：使用环境变量

const DEEPSEEK_MODEL = "deepseek-v3-2-251201"; // 火山引擎模型名称

console.log('🌍 运行环境:', isDevelopment ? '开发环境 (本地代理)' : '生产环境');
console.log('📡 API 端点:', DEEPSEEK_API_URL);

// --- HELPERS ---

/**
 * 清理 markdown 代码块标记，提取纯 JSON
 */
function cleanJsonResponse(text: string): string {
    // 移除 ```json 和 ``` 标记
    let cleaned = text.trim();
    
    // 检查是否包含 markdown 标记
    if (cleaned.includes('```')) {
        console.log('🧹 检测到 markdown 代码块，正在清理...');
        console.log('原始内容（前100字符）:', cleaned.substring(0, 100));
        
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '');
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.replace(/\s*```$/, '');
        }
        
        console.log('清理后内容（前100字符）:', cleaned.substring(0, 100));
    }
    
    return cleaned.trim();
}

/**
 * Fetcher that uses Vite proxy to avoid CORS issues
 * 火山引擎使用标准 OpenAI 格式，无需转换
 */
async function fetchDeepSeek(payload: any, retries = 2): Promise<any> {
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`🔄 重试第 ${attempt} 次...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 递增延迟
            } else {
                console.log(`📡 调用火山引擎 DeepSeek API（标准 OpenAI 格式）...`);
                console.log('请求 payload:', {
                    model: payload.model,
                    messages_count: payload.messages?.length,
                    temperature: payload.temperature,
                    response_format: payload.response_format
                });
            }
            
            // 火山引擎使用标准 OpenAI 格式，直接发送 payload
            const response = await fetch(DEEPSEEK_API_URL, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(payload)
            });
            
            console.log(`响应状态: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                    console.error(`API ${response.status} 错误详情:`, errorText);
                } catch (e) {
                    console.error(`无法读取错误响应`);
                }
                
                // If it's an auth error (401), stop immediately.
                if (response.status === 401) {
                    throw new Error(`无效的 API Key (401)。请检查您的密钥。`);
                }
                // If it's a quota error (402/429), stop immediately.
                if (response.status === 402 || response.status === 429) {
                    throw new Error(`DeepSeek 配额已超限 (${response.status})。请稍后重试。`);
                }
                
                // 对于 500 错误，可能是配额用完或服务器问题
                if (response.status === 500) {
                    // 如果错误信息包含配额相关，不重试
                    if (errorText.includes('quota') || errorText.includes('insufficient_quota') || errorText.includes('limit')) {
                        throw new Error(`DeepSeek API 配额可能已用完 (500)。请稍后重试或检查配额。`);
                    }
                    // 否则，如果还有重试次数，继续重试
                    if (attempt < retries) {
                        console.warn(`API 错误 500，准备重试...`);
                        continue;
                    }
                    throw new Error(`DeepSeek 服务器错误 (500)。服务可能暂时不可用，请稍后重试。详情: ${errorText.substring(0, 100)}`);
                }
                
                // 对于其他错误，如果还有重试次数，继续重试
                if (attempt < retries) {
                    console.warn(`API 错误 ${response.status}，准备重试...`);
                    continue;
                }
                
                throw new Error(`DeepSeek API 错误 ${response.status}: ${errorText.substring(0, 200)}`);
            }

            const data = await response.json();
            console.log(`✅ 火山引擎 API 调用成功（标准 OpenAI 响应）`);
            return data;
        } catch (e: any) {
            // 如果是认证或配额错误，立即抛出不重试
            if (e.message?.includes('401') || e.message?.includes('429') || e.message?.includes('配额')) {
                throw e;
            }
            
            // 如果还有重试次数，继续
            if (attempt < retries) {
                console.warn(`连接失败，准备重试 (${attempt + 1}/${retries})...`, e.message);
                continue;
            }
            
            console.error("❌ DeepSeek API 调用失败:", e);
            throw new Error(`连接失败: ${e.message || e}`);
        }
    }
    
    throw new Error('所有重试均失败');
}


// --- CUSTOM CHAT SESSION IMPLEMENTATION ---

class DeepSeekSession implements ChatSession {
  public history: { role: string; content: string }[] = [];
  private systemInstruction: string;

  constructor(systemInstruction: string) {
    this.systemInstruction = systemInstruction;
  }

  /**
   * Sends a message to DeepSeek and appends the response to history.
   */
  async sendMessage(params: { message: string }, forceJson: boolean = false): Promise<{ text: string }> {
    // 1. Add user message to history
    this.history.push({ role: 'user', content: params.message });

    // 2. Construct payload
    const messages = [
        { role: 'system', content: this.systemInstruction },
        ...this.history
    ];

    const body: any = {
        model: DEEPSEEK_MODEL, // 使用火山引擎模型
        messages: messages,
        stream: false,
        temperature: 0.6,
        max_tokens: 4000
    };

    // 注意：火山引擎不支持 response_format 参数，需要在 prompt 中要求 JSON 格式

    try {
        const data = await fetchDeepSeek(body);
        const text = data.choices?.[0]?.message?.content || "";

        // 3. Add assistant response to history
        this.history.push({ role: 'assistant', content: text });

        return { text };

    } catch (e) {
        console.error("DeepSeek Session Error:", e);
        this.history.pop(); // Revert user message on failure
        throw e;
    }
  }

  setHistory(history: { role: string; content: string }[]) {
      this.history = history;
  }
}

// --- SHARED CONSTANTS ---

const MASTER_ARCHETYPE_LIST = `
**严格选择列表（仅限从此处选择）：**

1.  **The Self (自性)**: 心灵的中心；完整性，统一性。
2.  **The Shadow (阴影)**: 被压抑的、低劣的或被排斥的面向。
3.  **The Anima (阿尼玛)**: 男性内在的女性面。
4.  **The Animus (阿尼姆斯)**: 女性内在的男性面。
5.  **The Persona (人格面具)**: 社会面具，适应外界的角色。
6.  **The Hero (英雄)**: 与无意识抗争的自我意识。
7.  **The Wise Old Man (智慧老人)**: 精神，意义，智慧。
8.  **The Great Mother (大母神)**: 滋养与吞噬；自然母亲。
9.  **The Puer Aeternus (永恒少年)**: 永恒的青春，拒绝长大。
10. **The Trickster (捣蛋鬼)**: 混沌，无序，打破界限者。
11. **The Child (圣婴/儿童)**: 潜力，新的开始，纯真。
12. **The Father (父亲)**: 权威，法律，秩序。
`;

// --- NORMALIZATION LOGIC ---

const CANONICAL_ARCHETYPE_NAMES = MASTER_ARCHETYPE_LIST
    .split('\n')
    .filter(line => /^\d+\./.test(line)) 
    .map(line => {
        const match = line.match(/\*\*(.*?)\*\*/); 
        return match ? match[1].trim() : '';
    })
    .filter(name => name); 

function normalizeArchetypeName(nameFromApi: string): string {
    if (!nameFromApi) return nameFromApi;
    const trimmedName = nameFromApi.trim();
    if (CANONICAL_ARCHETYPE_NAMES.includes(trimmedName)) return trimmedName;
    const chinesePart = (trimmedName.match(/[\u4e00-\u9fa5]+/) || [])[0];
    if (chinesePart) {
        const match = CANONICAL_ARCHETYPE_NAMES.find(canonical => canonical.includes(chinesePart));
        if (match) return match;
    }
    const englishPart = trimmedName.replace(/[\u4e00-\u9fa5()]/g, '').trim();
    if (englishPart) {
        const match = CANONICAL_ARCHETYPE_NAMES.find(canonical => canonical.startsWith(englishPart));
        if (match) return match;
    }
    return nameFromApi;
}

function normalizeAnalysis(analysis: DreamAnalysis): DreamAnalysis {
    if (analysis && analysis.archetypes) {
        analysis.archetypes = analysis.archetypes.map(arch => ({
            ...arch,
            name: normalizeArchetypeName(arch.name)
        }));
    }
    return analysis;
}

// --- MAIN SERVICE FUNCTIONS ---

const SYSTEM_INSTRUCTION_BASE = `
温暖的荣格分析师，专注内心世界。

**绝对禁止在对话中返回以下格式**：
- {"shadow": "...", "anima": "...", "self": "..."}
- 任何包含 "shadow"、"anima"、"anima_animus"、"self" 作为JSON字段的内容

**响应格式**：始终返回自然对话文本；历史中如有JSON，忽略它们的格式，用对话文本回应。

**对话风格**（80-100字）：
- 引导探索，不给结论。用"你注意到...？"代替"你应该..."
- 1-2个开放式提问，口语化、直击核心
`;

/**
 * Step 1: Initialize Session & Get Summary AND Archetypes (Batched)
 */
export const startStreamAnalysis = async (text: string, mode: AppMode): Promise<{ 
    session: ChatSession, 
    summary: string, 
    isComplete: boolean, 
    guideQuestion?: string,
    archetypes: DreamAnalysis['archetypes']
}> => {
    let contextPrompt = "";
    if (mode === AppMode.PROJECTION) {
        contextPrompt = `用户的投射体验："${text}"。\n\n请以“荣格阴影分析师”的身份进行分析。他人是一面镜子，请重点分析这揭示了用户内心什么被压抑或未被接纳的部分。`;
    } else {
        contextPrompt = `用户的梦境："${text}"。\n\n请以“荣格分析师”的身份进行分析。`;
    }

    const firstStepPrompt = `
    **【强制JSON模式】必须返回且仅返回纯JSON数据，不要包含任何对话文本！**
    
    ${contextPrompt}

    任务：
    1. 摘要（40-50字）
    2. 识别2-3个原型（从下方列表精确选择）
    3. manifestation 30-40字，description 简要定义

    ${MASTER_ARCHETYPE_LIST}

    **仅返回以下JSON格式**：
    {
        "summary": "...",
        "isComplete": boolean,
        "guideQuestion": "..." (若false时的简短提问),
        "archetypes": [{ "name": "...", "description": "...", "manifestation": "..." }]
    }
    `;

    // Create session
    const session = new DeepSeekSession(SYSTEM_INSTRUCTION_BASE);

    try {
        const result = await session.sendMessage({ message: firstStepPrompt }, true); // Force JSON
        const cleanedText = cleanJsonResponse(result.text || "{}");
        const json = JSON.parse(cleanedText);
        
        let archetypes = json.archetypes || [];
        archetypes = archetypes.map((a: any) => ({
            ...a,
            name: normalizeArchetypeName(a.name)
        }));

        return {
            session,
            summary: json.summary || "无法生成摘要。",
            isComplete: json.isComplete !== false, 
            guideQuestion: json.guideQuestion,
            archetypes: archetypes
        };
    } catch (e) {
        console.error("Initialization error", e);
        throw e;
    }
};

export const fetchArchetypesStep = async (session: ChatSession): Promise<DreamAnalysis['archetypes']> => {
    const prompt = `
    **【强制JSON模式】忽略历史中的对话格式，现在必须返回纯JSON数据！**
    
    任务：识别2-3个主要荣格原型
    从下方列表选择：
    ${MASTER_ARCHETYPE_LIST}
    
    **必须返回且仅返回以下格式**：
    { "archetypes": [ { "name": "...", "description": "...", "manifestation": "..." } ] }
    
    **绝对不要**：返回对话文本、提问、解释性文字
    `;
    
    try {
        const response = await session.sendMessage({ message: prompt }, true);
        const cleanedText = cleanJsonResponse(response.text);
        const json = JSON.parse(cleanedText);
        let list = json.archetypes || [];
        return list.map((a: any) => ({ ...a, name: normalizeArchetypeName(a.name) }));
    } catch (e) {
        console.error("Archetypes fetch error", e);
        return [];
    }
};

export const fetchDeepDynamicsStep = async (session: ChatSession): Promise<{ shadow: string, anima: string, self: string }> => {
    const prompt = `
    **【强制JSON模式】忽略历史中的对话格式，现在必须返回纯JSON数据！**
    
    任务：深度动力学分析
    生成三个字段（各80-100字，无换行）：
    - shadow: 阴影元素
    - anima: 阿尼玛/阿尼姆斯
    - self: 自性整合方向
    
    **必须返回且仅返回以下格式**：
    { "shadow": "...", "anima": "...", "self": "..." }
    
    **绝对不要**：返回对话文本、提问、解释性文字
    `;

    try {
        console.log('发送深度动力学分析请求...');
        const response = await session.sendMessage({ message: prompt }, true);
        console.log('收到深度动力学响应:', response.text);
        
        if (!response.text) {
            throw new Error('API 返回空响应');
        }
        
        const cleanedText = cleanJsonResponse(response.text);
        console.log('清理后的响应:', cleanedText);
        
        const json = JSON.parse(cleanedText);
        const result = {
            shadow: json.shadow || "",
            anima: json.anima || json.animus || json.soul_image || "",
            self: json.self || ""
        };
        console.log('✅ 解析后的深度动力学:', result);
        return result;
    } catch (e: any) {
        console.error("❌ 深度动力学获取错误:", e);
        console.error("错误详情:", e.message, e.stack);
        
        // 返回更友好的错误信息
        const errorMsg = e.message?.includes('Failed to fetch') 
            ? "网络连接中断，请稍后重试。"
            : e.message?.includes('parse') 
            ? "数据解析失败，请重新分析。"
            : "深度分析暂时无法获取，请重试。";
            
        return { 
            shadow: errorMsg, 
            anima: errorMsg, 
            self: errorMsg 
        };
    }
};

export const switchToChatMode = async (session: ChatSession, mode: AppMode): Promise<string> => {
    const prompt = `
    **返回对话文本，非JSON！**
    分析已完成，用1个开放式问题邀请用户继续探索。
    要求：40-60字，以问句结尾。
    `;
    try {
        const response = await session.sendMessage({ message: prompt });
        return response.text;
    } catch (e) {
        return "感谢你分享这段体验。\n\n我能感受到那份被跟随带来的烦扰，它像一面镜子，映照出我们内心那些等待被看见、被理解的部分。\n\n如果你愿意，我们可以聊聊此刻的感受？";
    }
};

export const sendAnalysisChatMessage = async (session: ChatSession, message: string): Promise<string> => {
    try {
        const response = await session.sendMessage({ message });
        let text = response.text.trim();
        
        // 检测是否错误地返回了JSON格式
        if (text.includes('"shadow"') || text.includes('"anima"') || text.includes('"self"') || 
            (text.startsWith('{') && text.endsWith('}'))) {
            console.warn('⚠️ 检测到对话中返回了JSON格式，将重新生成对话文本');
            
            // 重新发送一个明确的提示
            const retryPrompt = `**重要：请用自然的对话文本回应，不要返回JSON格式！**\n\n用户问："${message}"\n\n请用80-100字的对话文本回应，以1-2个开放式问题引导用户思考。`;
            const retryResponse = await session.sendMessage({ message: retryPrompt });
            text = retryResponse.text.trim();
            
            // 如果还是JSON，返回默认文本
            if (text.includes('"shadow"') || text.includes('"anima"') || text.startsWith('{')) {
                return "这个问题很重要。\n\n此刻，你内心对这个部分最直接的感受是什么？如果让它用一个画面或一句话来表达，会是什么？";
            }
        }
        
        return text;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const refineDreamAnalysis = async (historyContext: string, userInput: string): Promise<RefinementResponse> => {
    const prompt = `
    **【强制JSON模式】必须返回且仅返回纯JSON数据！**
    
    上下文：${historyContext}
    用户输入："${userInput}"
    
    判断：信息是否充足？
    - 不足 -> isRefined: false, nextQuestion（50-80字）
    - 充足 -> isRefined: true, refinedAnalysisSummaryText（对话文本100-120字）+ refinedAnalysis
    
    **仅返回以下JSON格式**：
    {
       "isRefined": boolean,
       "nextQuestion": "...",
       "refinedAnalysisSummaryText": "流畅中文对话，绝不含JSON字段名！",
       "refinedAnalysis": {
          "summary": "...",
          "archetypes": [从下方列表选2个],
          "jungianPerspective": { "shadow": "...", "anima_animus": "...", "self": "..." }
       }
    }
    
    ${MASTER_ARCHETYPE_LIST}
    `;

    try {
        const payload = {
            model: DEEPSEEK_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5
        };
        const data = await fetchDeepSeek(payload);
        const rawContent = data.choices?.[0]?.message?.content || "{}";
        const cleanedContent = cleanJsonResponse(rawContent);
        const json = JSON.parse(cleanedContent);
        
        console.log("🔍 refineDreamAnalysis 返回:", {
            isRefined: json.isRefined,
            hasRefinedAnalysis: !!json.refinedAnalysis,
            refinedAnalysisSummaryText: json.refinedAnalysisSummaryText?.substring(0, 100) + "..."
        });
        
        // 检查 refinedAnalysisSummaryText 是否错误地包含了 JSON 格式
        if (json.isRefined && json.refinedAnalysisSummaryText) {
            const summaryText = json.refinedAnalysisSummaryText.trim();
            // 如果包含 JSON 字段标记，说明 AI 返回了错误格式
            if (summaryText.includes('"shadow"') || summaryText.includes('"anima"') || summaryText.includes('"self"') || summaryText.startsWith('{')) {
                console.warn('⚠️ refinedAnalysisSummaryText 包含 JSON 格式，将替换为默认文本');
                // 生成默认的对话式文本
                json.refinedAnalysisSummaryText = "感谢你分享这些细节。\\n\\n结合你提到的情况，我对这个体验有了更深入的理解。让我为你呈现一个更完整的分析视角。";
            }
        }
        
        if (json.isRefined && json.refinedAnalysis) {
            json.refinedAnalysis = normalizeAnalysis(json.refinedAnalysis);
        }
        return json;
    } catch (e) {
        console.error("Refinement error", e);
        return { isRefined: false, nextQuestion: "我明白。你能多说说那个部分的细节吗？" };
    }
};

// --- ACTIVE IMAGINATION SERVICES ---

let activeImaginationSession: DeepSeekSession | null = null;

export const startImaginationSession = async (): Promise<string> => {
    const instruction = `
    主动想象引导者。引导用户沉浸体验，不分析。
    
    **规则**：
    - 80-120字，2-3句话，\\n\\n分段
    - 调动感官（视听触嗅情），现在时
    - 每次必须以开放式问题结尾，让用户自由描述
    - 问题示例：
      * "你看到了什么？"
      * "你听到什么声音？"
      * "接下来发生了什么？"
      * "你感受到什么？"
      * "那个形象对你说了什么？"
      * "它是什么样子的？"
    - **严格禁止**封闭式问题（"是吗？""好吗？""愿意吗？""对吗？""你注意到...吗？"）
    
    **开场**：随机选一个场景（森林/海边/山谷/花园/图书馆/湖泊），创建具体开场。
    `;
    activeImaginationSession = new DeepSeekSession(instruction);
    const response = await activeImaginationSession.sendMessage({ message: "开始引导，创建一个具体的开场场景。" });
    return response.text;
};

export const sendImaginationMessage = async (text: string): Promise<string> => {
    if (!activeImaginationSession) throw new Error("No active imagination session");
    const response = await activeImaginationSession.sendMessage({ message: text });
    return response.text;
};

export const analyzeImaginationSession = async (history: ChatMessage[]): Promise<{
    analysis: DreamAnalysis;
    isComplete: boolean;
    guideQuestion?: string;
    session: ChatSession;
}> => {
    const transcript = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    const prompt = `
    **【强制JSON模式】必须返回且仅返回纯JSON数据，不要包含对话文本！**
    
    主动想象对话记录：
    ${transcript}
    
    作为荣格分析师解析。
    
    **仅返回以下JSON格式**：
    {
      "summary": "...",
      "archetypes": [从下方列表选，manifestation 30-40字],
      "jungianPerspective": { "shadow": "...", "anima_animus": "...", "self": "..." } (各80-100字，无换行),
      "isComplete": false,
      "guideQuestion": "..." (60-80字，开放式提问)
    }
    
    ${MASTER_ARCHETYPE_LIST}
    `;
    
    try {
        const payload = {
            model: DEEPSEEK_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5
        };
        const data = await fetchDeepSeek(payload);
        const rawContent = data.choices?.[0]?.message?.content || "{}";
        const cleanedContent = cleanJsonResponse(rawContent);
        const json = JSON.parse(cleanedContent);
        
        console.log("🔍 主动想象分析返回的原始数据:", json);
        console.log("📊 isComplete:", json.isComplete);
        console.log("💬 guideQuestion:", json.guideQuestion);
        console.log("🎭 archetypes 原始数据:", json.archetypes);
        
        let archetypes = json.archetypes || [];
        archetypes = archetypes.map((a: any) => ({
            ...a,
            name: normalizeArchetypeName(a.name)
        }));
        
        console.log("🎭 archetypes 标准化后:", archetypes);

        // 创建一个新的 session 用于后续对话
        const chatSession = new DeepSeekSession(SYSTEM_INSTRUCTION_BASE);
        
        // 将主动想象的体验作为背景上下文（而非完整对话），明确现在是分析对话模式
        const contextSummary = `[背景]
用户刚完成了一次主动想象体验，主要内容包括：${json.summary}

我已经为用户呈现了分析结果（包括原型、阴影、阿尼玛/阿尼姆斯、自性）。

现在，作为荣格分析师，用对话的方式帮助用户理解和整合这次体验。记住：
- 你现在是分析师，不是主动想象的引导者
- 用引导式提问帮助用户自我觉察
- 绝不返回JSON格式`;
        
        chatSession.history.push({ role: 'system', content: contextSummary });

        const result = {
            analysis: {
                summary: json.summary || "无法生成总结。",
                archetypes: archetypes,
                jungianPerspective: {
                    shadow: json.jungianPerspective?.shadow || "",
                    anima_animus: json.jungianPerspective?.anima_animus || "",
                    self: json.jungianPerspective?.self || ""
                }
            },
            isComplete: json.isComplete === true, // 默认 false，邀请用户分享感受
            guideQuestion: json.guideQuestion || "看到这些分析，你有什么感受？哪个部分让你特别有共鸣，或者有什么疑问想要探讨？",
            session: chatSession // 返回 session 用于后续对话
        };
        
        console.log("✅ 最终返回:", { isComplete: result.isComplete, guideQuestion: result.guideQuestion, hasSession: !!result.session });
        
        return result;
    } catch (e) {
        console.error("Imagination analysis error", e);
        throw e;
    }
};