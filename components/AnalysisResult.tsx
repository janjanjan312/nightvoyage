import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DreamResult, ChatMessage, DreamAnalysis, AppMode } from '../types';
import { sendAnalysisChatMessage, refineDreamAnalysis, fetchArchetypesStep, fetchDeepDynamicsStep, switchToChatMode } from '../services/geminiService';
import * as storageService from '../services/storageService';

interface AnalysisResultProps {
  result: DreamResult;
  onReset: () => void;
  mode: AppMode;
}

const renderFormattedText = (text: string) => {
  if (!text) return null;
  
  // 先替换转义的换行符为真实换行符
  const processedText = text
    .replace(/\\n\\n/g, '\n\n')  // 转义的段落换行
    .replace(/\\n/g, '\n');       // 转义的普通换行
  
  // 首先按段落分割（连续两个换行符）
  const paragraphs = processedText.split('\n\n');
  
  return paragraphs.map((paragraph, paraIndex) => {
    // 每个段落内按单换行符分割
    const lines = paragraph.split('\n');
    
    const paragraphContent = lines.map((line, lineIndex) => {
      // 对每一行处理粗体标记
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const lineContent = parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} style={{ color: 'var(--active-glow)' }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      });
      
      // 段落内的换行：只加 <br />，不空行
      return (
        <React.Fragment key={lineIndex}>
          {lineContent}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
    
    // 段落之间：空一行（使用 margin）
    return (
      <div key={paraIndex} style={{ marginBottom: paraIndex < paragraphs.length - 1 ? '1em' : '0' }}>
        {paragraphContent}
      </div>
    );
  });
};

interface TypewriterProps {
    text: string;
    start: boolean;
    done: boolean;
    onComplete?: () => void;
    onTyping?: () => void;
}

const TypewriterText: React.FC<TypewriterProps> = ({ text, start, done, onComplete, onTyping }) => {
  const [displayedText, setDisplayedText] = useState("");
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    // Safety check: ensure text is not undefined or null
    const safeText = text || "";
    
    // If done, show full text immediately and ensure we don't re-trigger completion logic excessively
    if (done) {
        setDisplayedText(safeText);
        return;
    }

    // If not started, show nothing
    if (!start) {
        setDisplayedText("");
        hasCompletedRef.current = false;
        return;
    }

    // Start typing animation
    setDisplayedText("");
    hasCompletedRef.current = false;
    let currentIndex = 0;

    const timer = setInterval(() => {
      if (currentIndex < safeText.length) {
        setDisplayedText(safeText.slice(0, currentIndex + 1));
        currentIndex++;
        onTyping?.();
      } else {
        clearInterval(timer);
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();
        }
      }
    }, 20); // Slightly faster for better UX

    return () => clearInterval(timer);
  }, [text, start, done]);

  return <span style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>{renderFormattedText(displayedText)}</span>;
};

interface CardProps {
    start: boolean;
    done: boolean;
    onComplete: () => void;
    onTyping: () => void;
}

const ArchetypesCard: React.FC<{ data: DreamAnalysis['archetypes'] } & CardProps> = ({ data, start, done, onComplete, onTyping }) => {
  const [localStep, setLocalStep] = useState(0);
  
  // Safety check: ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  // If the card is marked 'done' from parent, we skip local sequencing
  const isCardDone = done;

  const handleItemComplete = () => {
     setLocalStep(prev => prev + 1);
  };

  useEffect(() => {
     if (localStep >= safeData.length && !isCardDone) {
         onComplete();
     }
  }, [localStep, safeData.length, isCardDone, onComplete]);

  return (
    <div className="analysis-card">
        <div className="analysis-card-header" style={{ color: 'var(--archetype-parchment)'}}>
        <i className="fas fa-shapes"></i>
        <span>原型图谱 (Archetypes)</span>
        </div>
        <div className="analysis-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.8' }}>
        {safeData.map((arch, idx) => {
            // Logic for internal sequence
            // Item is done if card is done OR if localStep has passed this item
            const itemDone = isCardDone || localStep > idx;
            // Item starts if card has started AND localStep reached this item
            const itemStart = start && localStep >= idx;
            
            // If item hasn't started yet, don't render content to keep it clean (or render empty)
            if (!itemStart && !itemDone) return null;

            return (
                <div key={idx}>
                    <div style={{ color: 'var(--archetype-parchment)', fontWeight: '600', marginBottom: '4px' }}>{arch.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px'}}>{arch.description}</div>
                    <div style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
                        <TypewriterText 
                            text={arch.manifestation} 
                            start={itemStart} 
                            done={itemDone} 
                            onComplete={handleItemComplete}
                            onTyping={onTyping}
                        />
                    </div>
                </div>
            );
        })}
        </div>
    </div>
  );
};

const DynamicsCard: React.FC<{ title: string; subtitle: string; icon: string; text: string; color: string } & CardProps> = ({ 
    title, subtitle, icon, text, color, start, done, onComplete, onTyping 
}) => {
    // Safety check: ensure text is a string
    const safeText = text || "";
    
    return (
    <div className="analysis-card">
        <div className="analysis-card-header" style={{ color }}>
            <i className={icon}></i>
            <span>{title}</span>
        </div>
        <div className="analysis-card-body" style={{ lineHeight: '1.8' }}>
            <span style={{ color, fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{subtitle}</span>
            <div style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
                <TypewriterText 
                    text={safeText} 
                    start={start} 
                    done={done} 
                    onComplete={onComplete}
                    onTyping={onTyping}
                />
            </div>
        </div>
    </div>
    );
};

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onReset, mode }) => {
  const { analysis, originalText, isComplete, guideQuestion, initialSession } = result;
  
  // 确保 analysis 有完整的结构
  const safeAnalysis: DreamAnalysis = {
    summary: analysis.summary || '',
    archetypes: analysis.archetypes || [],
    jungianPerspective: analysis.jungianPerspective || {
      shadow: '',
      anima_animus: '',
      self: ''
    }
  };
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // SEQUENTIAL TYPING STATE
  // Points to the index of the message currently being typed/revealed.
  // Messages < visibleIndex are DONE.
  // Messages > visibleIndex are HIDDEN/WAITING.
  const [visibleIndex, setVisibleIndex] = useState(0);

  const [isInquiryMode, setIsInquiryMode] = useState(!isComplete);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const conversationHistory = useRef(originalText);
  const currentAnalysis = useRef<DreamAnalysis>(safeAnalysis);

  const scrollToBottom = () => {
    // Only scroll if we are near bottom or forcing it? 
    // For typewriters, auto-scroll is usually good.
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Ensure visibleIndex advances for user messages automatically
  useEffect(() => {
      const currentMsg = chatMessages[visibleIndex];
      if (currentMsg && currentMsg.role === 'user') {
          // User messages appear instantly
          setVisibleIndex(prev => prev + 1);
      }
  }, [chatMessages, visibleIndex]);

  // Handle auto-scroll when new messages are added (specifically user messages)
  useEffect(() => {
      if (chatMessages.length > 0) {
        scrollToBottom();
      }
  }, [chatMessages.length]);

  // Handle auto-scroll during typing
  const handleTypingActivity = useCallback(() => {
      scrollToBottom();
  }, []);

  const handleMessageComplete = useCallback(() => {
      setVisibleIndex(prev => prev + 1);
  }, []);

  // Ref to track the last analysis timestamp
  const lastAnalysisRef = useRef<number>(0);

  // --- STREAMING SEQUENCE EFFECT ---
  useEffect(() => {
    // Prevent duplicate execution for the same analysis
    const currentTimestamp = result.timestamp;
    if (lastAnalysisRef.current === currentTimestamp) {
      console.log('⏭️ 跳过重复执行');
      return;
    }
    lastAnalysisRef.current = currentTimestamp;
    console.log('✨ 开始新的分析流程');

    let isCancelled = false;

    const runStream = async () => {
      // Early exit if cancelled
      if (isCancelled) return;
      setChatMessages([]); 
      setVisibleIndex(0); // Reset sequence

      const initialSummary = mode === AppMode.PROJECTION 
        ? `基于你的描述，这是你的"情绪投射"分析。\n${safeAnalysis.summary}`
        : `我已聆听了你的叙述。这是初步的印象：\n${safeAnalysis.summary}`;
      
      setChatMessages([{ role: 'model', type: 'TEXT', text: initialSummary }]);

      if (initialSession) {
          setIsStreaming(true);
          try {
              // Check if cancelled before each async operation
              if (isCancelled) return;

              // OPTIMIZATION: Check if Archetypes are already available in result (batched from Step 1)
              let archetypes = safeAnalysis.archetypes;
              
              if (!archetypes || archetypes.length === 0) {
                 // Fallback to fetch if not present (legacy path or error in batching)
                 archetypes = await fetchArchetypesStep(initialSession);
              }

              if (isCancelled) return;

              if (archetypes.length > 0) {
                  // 过滤掉空的原型对象
                  const validArchetypes = archetypes.filter(arch => 
                    arch.name && arch.name.trim() && 
                    arch.manifestation && arch.manifestation.trim()
                  );
                  if (validArchetypes.length > 0) {
                    // Push to UI queue immediately
                    setChatMessages(prev => [...prev, { role: 'model', type: 'ARCHETYPES_CARD', text: '', data: validArchetypes }]);
                    // Update ref if it was fetched via fallback
                    currentAnalysis.current.archetypes = validArchetypes;
                  }
              }

              if (isCancelled) return;

              // Step 3: Deep Dynamics (Still fetched separately to allow reading time for first part)
              console.log('开始获取深度动力学分析...');
              const dynamics = await fetchDeepDynamicsStep(initialSession);
              console.log('深度动力学分析结果:', dynamics);
              
              if (isCancelled) return;

              if (dynamics.shadow) {
                  console.log('添加阴影卡片');
                  setChatMessages(prev => [...prev, { role: 'model', type: 'DYNAMICS_SHADOW', text: '', data: dynamics.shadow }]);
                  currentAnalysis.current.jungianPerspective.shadow = dynamics.shadow;
              }
              if (dynamics.anima) {
                  console.log('添加阿尼玛卡片');
                  setChatMessages(prev => [...prev, { role: 'model', type: 'DYNAMICS_ANIMA', text: '', data: dynamics.anima }]);
                  currentAnalysis.current.jungianPerspective.anima_animus = dynamics.anima;
              }
              if (dynamics.self) {
                  console.log('添加自性卡片');
                  setChatMessages(prev => [...prev, { role: 'model', type: 'DYNAMICS_SELF', text: '', data: dynamics.self }]);
                  currentAnalysis.current.jungianPerspective.self = dynamics.self;
              }
              
              if (isCancelled) return;

              // 如果是不完整的分析，显示引导问题而不是结束语
              if (!isComplete && guideQuestion) {
                  setChatMessages(prev => [...prev, { role: 'model', type: 'TEXT', text: guideQuestion }]);
              } else {
                  const closingText = await switchToChatMode(initialSession, mode);
                  if (isCancelled) return;
                  setChatMessages(prev => [...prev, { role: 'model', type: 'TEXT', text: closingText }]);
              }

          } catch (e) {
              if (!isCancelled) {
                  console.error("Streaming error", e);
                  setChatMessages(prev => [...prev, { role: 'model', type: 'TEXT', text: "分析过程似乎中断了，但我们可以就目前的内容进行交流。" }]);
              }
          } finally {
              if (!isCancelled) {
                  setIsStreaming(false);
              }
          }
          } else if (safeAnalysis.archetypes && safeAnalysis.archetypes.length > 0) {
              // Legacy/Instant fallback
              await new Promise(r => setTimeout(r, 600)); 
              setChatMessages(prev => [...prev, { role: 'model', type: 'ARCHETYPES_CARD', text: '', data: safeAnalysis.archetypes }]);
              if (safeAnalysis.jungianPerspective.shadow) {
                setChatMessages(prev => [...prev, { role: 'model', type: 'DYNAMICS_SHADOW', text: '', data: safeAnalysis.jungianPerspective.shadow }]);
              }
              if (safeAnalysis.jungianPerspective.anima_animus) {
                setChatMessages(prev => [...prev, { role: 'model', type: 'DYNAMICS_ANIMA', text: '', data: safeAnalysis.jungianPerspective.anima_animus }]);
              }
              if (safeAnalysis.jungianPerspective.self) {
                setChatMessages(prev => [...prev, { role: 'model', type: 'DYNAMICS_SELF', text: '', data: safeAnalysis.jungianPerspective.self }]);
              }
      }
    };
    runStream();

    // Cleanup function to cancel if component unmounts or re-executes
    return () => {
      isCancelled = true;
    };
  }, [result.timestamp, analysis, mode, isComplete, guideQuestion, initialSession]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', type: 'TEXT', text: input };
    setChatMessages(prev => [...prev, userMsg]);
    // visibleIndex will auto-increment via useEffect for user msg
    
    const userInput = input;
    setInput('');
    setIsChatLoading(true);

    try {
      if (isInquiryMode) {
        const refinementResponse = await refineDreamAnalysis(conversationHistory.current, userInput);
        conversationHistory.current += `\n\n[User Clarification]: ${userInput}`;

        if (refinementResponse.isRefined && refinementResponse.refinedAnalysis && refinementResponse.refinedAnalysisSummaryText) {
          currentAnalysis.current = refinementResponse.refinedAnalysis;
          setChatMessages(prev => [...prev, { role: 'model', type: 'TEXT', text: refinementResponse.refinedAnalysisSummaryText }]);
          setIsInquiryMode(false);
          
          const r = refinementResponse.refinedAnalysis;
          // 只显示有实际内容的原型卡片
          if (r.archetypes && r.archetypes.length > 0) {
            // 过滤掉空的原型对象
            const validArchetypes = r.archetypes.filter(arch => 
              arch.name && arch.name.trim() && 
              arch.manifestation && arch.manifestation.trim()
            );
            if (validArchetypes.length > 0) {
              setChatMessages(prev => [...prev, { role: 'model', type: 'ARCHETYPES_CARD', text: '', data: validArchetypes }]);
            }
          }
          if (r.jungianPerspective) {
            if (r.jungianPerspective.shadow) {
              setChatMessages(prev => [...prev, { role: 'model', type: 'DYNAMICS_SHADOW', text: '', data: r.jungianPerspective.shadow }]);
            }
            if (r.jungianPerspective.anima_animus) {
              setChatMessages(prev => [...prev, { role: 'model', type: 'DYNAMICS_ANIMA', text: '', data: r.jungianPerspective.anima_animus }]);
            }
            if (r.jungianPerspective.self) {
              setChatMessages(prev => [...prev, { role: 'model', type: 'DYNAMICS_SELF', text: '', data: r.jungianPerspective.self }]);
            }
          }

        } else if (refinementResponse.nextQuestion) {
          setChatMessages(prev => [...prev, { role: 'model', type: 'TEXT', text: refinementResponse.nextQuestion }]);
          conversationHistory.current += `\n[AI Question]: ${refinementResponse.nextQuestion}`;
        }
      } else {
        if (initialSession) {
             const response = await sendAnalysisChatMessage(initialSession, userInput);
             setChatMessages(prev => [...prev, { role: 'model', type: 'TEXT', text: response }]);
        } else {
             setChatMessages(prev => [...prev, { role: 'model', type: 'TEXT', text: "（会话已过期，无法继续深入对话）" }]);
        }
      }
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', type: 'TEXT', text: "在深入思考时遇到了一些困难，请稍后再试。" }]);
    } finally {
      setIsChatLoading(false);
    }
  };
  
  const handleResetAndSave = () => {
    try {
      if (currentAnalysis.current && currentAnalysis.current.archetypes) {
        currentAnalysis.current.archetypes.forEach(arch => {
          const insightText = arch.manifestation || `在关于“${originalText.substring(0, 20)}...”的体验中，它象征着：“${currentAnalysis.current.summary}”`;
          storageService.saveArchetypeInsight(arch.name, insightText);
        });
      }
    } catch (e) {
      console.error("Failed to save to Mind Atlas:", e);
    }
    onReset();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getHeaderConfig = () => {
    const commonColor = '#FFFFFF'; 
    switch(mode) {
      case AppMode.PROJECTION:
        return { color: commonColor, icon: 'fas fa-eye', title: '情绪投射分析' };
      case AppMode.ACTIVE_IMAGINATION:
        return { color: commonColor, icon: 'fas fa-feather-alt', title: '主动想象分析' };
      case AppMode.DREAM:
      default:
        return { color: commonColor, icon: 'fas fa-moon', title: '梦境深度分析' };
    }
  };
  const headerConfig = getHeaderConfig();
  
  return (
    <div className="chat-section">
      <header className="chat-header">
        <div style={{ flex: 1, textAlign: 'left' }}>
            <button onClick={handleResetAndSave} style={{ 
              background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem', padding: 0,
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <i className="fas fa-chevron-left"></i><span>返回</span>
            </button>
        </div>
        <h2 style={{ 
          fontFamily: '"Noto Serif SC", serif', color: headerConfig.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 2, margin: 0, fontSize: '1.1rem'
        }}>
          <i className={headerConfig.icon}></i><span>{headerConfig.title}</span>
        </h2>
        <div style={{ flex: 1 }}></div>
      </header>

      <div className="chat-log">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px' }}>
            {chatMessages.map((msg, idx) => {
                // If this message is ahead of the sequence, hide it (but render to keep DOM structure if needed, or just return null)
                // Returning null is better for performance and cleanliness.
                if (idx > visibleIndex) return null;

                const isStart = idx === visibleIndex;
                const isDone = idx < visibleIndex;

                if (msg.role === 'user') {
                  return (
                    <div key={idx} className="bubble user-bubble" style={{ lineHeight: '1.8' }}>
                      <span style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>{renderFormattedText(msg.text)}</span>
                    </div>
                  );
                }

                if (msg.type === 'ARCHETYPES_CARD') return <ArchetypesCard key={idx} data={msg.data} start={isStart} done={isDone} onComplete={handleMessageComplete} onTyping={handleTypingActivity} />;
                
                if (msg.type === 'DYNAMICS_SHADOW') return <DynamicsCard key={idx} title="阴影 (The Shadow)" subtitle="内在冲突 / 压抑面" icon="fas fa-theater-masks" text={msg.data} color="var(--projection-blue)" start={isStart} done={isDone} onComplete={handleMessageComplete} onTyping={handleTypingActivity} />;
                
                if (msg.type === 'DYNAMICS_ANIMA') return <DynamicsCard key={idx} title="阿尼玛/阿尼姆斯" subtitle="灵魂意象 / 异性原型" icon="fas fa-link" text={msg.data} color="var(--imagination-green)" start={isStart} done={isDone} onComplete={handleMessageComplete} onTyping={handleTypingActivity} />;
                
                if (msg.type === 'DYNAMICS_SELF') return <DynamicsCard key={idx} title="自性 (The Self)" subtitle="整合方向 / 建议" icon="fas fa-gem" text={msg.data} color="var(--mystic-gold)" start={isStart} done={isDone} onComplete={handleMessageComplete} onTyping={handleTypingActivity} />;
                
                // Normal model text bubble
                return (
                  <div key={idx} className="bubble model-bubble" style={{ lineHeight: '1.8' }}>
                    <TypewriterText text={msg.text} start={isStart} done={isDone} onComplete={handleMessageComplete} onTyping={handleTypingActivity} />
                  </div>
                );
            })}
            
            {/* Show Loading Dots only if we have exhausted visible messages BUT are still expecting more (streaming/loading) */}
            {((isChatLoading || isStreaming) && visibleIndex >= chatMessages.length) && (
              <div className="bubble model-bubble">
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', background: 'var(--muted)', borderRadius: '50%', animation: 'dotUp 1s ease-in-out infinite' }}></span>
                  <span style={{ width: '8px', height: '8px', background: 'var(--muted)', borderRadius: '50%', animation: 'dotUp 1s ease-in-out infinite .15s' }}></span>
                  <span style={{ width: '8px', height: '8px', background: 'var(--muted)', borderRadius: '50%', animation: 'dotUp 1s ease-in-out infinite .3s' }}></span>
                </div>
              </div>
            )}
        </div>
        <div ref={chatEndRef} />
      </div>

      <footer className="chat-input-area">
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isInquiryMode ? "回答引导问题以获得更深解读..." : "对这个分析结果有什么想法？"}
            disabled={isChatLoading || isStreaming}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading || isStreaming}
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AnalysisResult;