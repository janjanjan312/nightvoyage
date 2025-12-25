import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Intro from './components/Intro';
import AnalysisResult from './components/AnalysisResult';
import LoadingView from './components/LoadingView';
import ActiveImagination from './components/ActiveImagination';
import MindAtlas from './components/MindAtlas';
import Library, { preloadLibraryImages } from './components/Library';
import StarField from './components/StarField';
import { startStreamAnalysis, analyzeImaginationSession } from './services/geminiService';
import * as storageService from './services/storageService';
import { ARCHETYPE_DESCRIPTIONS } from './services/archetypeData';
import { LoadingState, DreamResult, AppMode, ChatMessage, StoredArchetype } from './types';

// Icon paths duplicated from Intro.tsx to avoid prop-drilling or complex state management.
const PROJECTION_ICON_PATH = "M256 120c-126 0-216 136-216 136s90 136 216 136 216-136 216-136-90-136-216-136z M256 322c-36.5 0-66-29.5-66-66s29.5-66 66-66 66 29.5 66 66-29.5 66-66 66z";
const DREAM_ICON_PATH = "M256 64C160 64 64 160 64 256s96 192 192 192c48 0 91-18 124-47-5-1-10-1-16-1-106 0-192-86-192-192 0-66 33-125 84-161-17-4-35-7-54-7z";
const IMAGINATION_ICON_PATHS = [
  "M256,256 C216,156 236,52 256,32 C276,52 296,156 256,256 Z", "M256,256 C320,192 404,148 419,103 C365,148 320,192 256,256 Z", "M256,256 C356,216 460,236 480,256 C460,276 356,296 256,256 Z", "M256,256 C320,320 404,364 419,409 C365,364 320,320 256,256 Z", "M256,256 C216,356 236,460 256,480 C276,460 296,356 256,256 Z", "M256,256 C192,320 108,364 93,409 C147,364 192,320 256,256 Z", "M256,256 C156,216 52,236 32,256 C52,276 156,296 256,256 Z", "M256,256 C192,192 108,148 93,103 C147,148 192,192 256,256 Z"
];

// Helper for custom smooth scrolling with easing
const smoothScrollTo = (targetY: number, duration: number) => {
  const startY = window.scrollY;
  const distance = targetY - startY;
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    // Ease in-out cubic
    const ease = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, startY + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode | null>(null);
  const [dreamInput, setDreamInput] = useState('');
  const [projectionInput, setProjectionInput] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<DreamResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isImaginationActive, setIsImaginationActive] = useState(false);
  const [currentView, setCurrentView] = useState<'intro' | 'atlas' | 'library'>('intro');

  const [isRetryableError, setIsRetryableError] = useState(false);
  const [lastImaginationHistory, setLastImaginationHistory] = useState<ChatMessage[] | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const isStopping = useRef(false);
  
  const inputSectionRef = useRef<HTMLDivElement>(null);

  // 根据当前模式获取对应的输入内容
  const input = mode === AppMode.DREAM ? dreamInput : projectionInput;
  const setInput = mode === AppMode.DREAM ? setDreamInput : setProjectionInput;

  // 计算要在主页显示的卡片
  const introCards = useMemo(() => {
    const atlasData = storageService.getMindAtlasData();
    const userArchetypes = Object.values(atlasData);

    if (userArchetypes.length > 0) {
      // 如果有用户数据，按最后一次洞察的时间倒序排列（最新的在左边），只显示最新的5个
      return userArchetypes.sort((a, b) => {
        const timeA = a.insights[a.insights.length - 1]?.timestamp || 0;
        const timeB = b.insights[b.insights.length - 1]?.timestamp || 0;
        return timeB - timeA;
      }).slice(0, 5);
    } else {
      // 如果没有用户数据，随机从标准列表中选5个
      const allNames = Object.keys(ARCHETYPE_DESCRIPTIONS);
      const shuffled = [...allNames].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 5).map(name => ({
        name,
        insights: [],
        isRandom: true
      })) as (StoredArchetype & { isRandom: boolean })[];
    }
  }, [currentView, loadingState]); // 当返回主页或完成解析时重新计算

  // Preload Library images on mount
  useEffect(() => {
    preloadLibraryImages();
  }, []);

  // Auto-scroll to input section when mode is selected
  useEffect(() => {
    if (mode && inputSectionRef.current) {
      // Small delay to allow layout to stabilize, then trigger slow smooth scroll
      setTimeout(() => {
        if (!inputSectionRef.current) return;
        
        const element = inputSectionRef.current;
        const rect = element.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        // Calculate target to center the element in viewport
        const targetY = absoluteTop - (window.innerHeight / 2) + (rect.height / 2);
        
        // Execute smooth scroll over 1200ms for a peaceful effect
        smoothScrollTo(targetY, 1200);
      }, 100);
    }
  }, [mode]);

  // --- ERROR HELPER ---
  const handleError = (error: any) => {
    console.error(error);
    setLoadingState(LoadingState.ERROR);
    setIsRetryableError(false);
    
    const errString = error.toString();
    if (errString.includes('429') || errString.includes('quota')) {
      setErrorMsg(
        "⚠️ 灵感通道暂时拥堵 (429)\n\n" +
        "🔵 情况 A：频率过快 (最常见)\n请深呼吸，等待 60 秒后再试。\n\n" +
        "🔴 情况 B：今日能量耗尽\n如果等待无效，说明已达每日免费限额。\n额度将在 北京时间下午 4:00 (16:00) 自动充满。"
      );
    } else if (errString.includes('503') || errString.includes('500') || errString.includes('Server Error')) {
      setErrorMsg("AI 服务暂时繁忙 (Server Error)。\n\n系统已自动重试 2 次但仍未成功。\n请等待 30-60 秒后点击【重试】。");
      setIsRetryableError(true);
    } else if (errString.includes('Failed to fetch') || errString.includes('ECONNRESET') || errString.includes('连接失败')) {
      setErrorMsg("网络连接不稳定。\n\n系统已自动重试但未成功。\n请检查网络后点击【重试】。");
      setIsRetryableError(true);
    } else {
      setErrorMsg("解析过程中遇到了迷雾。\n\n可能的原因：\n• 网络连接问题\n• API Key 失效\n• 服务暂时不可用\n\n请稍后点击【重试】。");
      setIsRetryableError(true);
    }
  };

  // --- AUTO SAVE HELPER ---
  const autoSaveToAtlas = (analysisData: any, sourceText: string) => {
    try {
      if (analysisData.archetypes && Array.isArray(analysisData.archetypes)) {
        analysisData.archetypes.forEach((arch: any) => {
           const insightText = arch.manifestation || `在关于“${sourceText.substring(0, 15)}...”的分析中，它象征着：${analysisData.summary.substring(0, 30)}...`;
           storageService.saveArchetypeInsight(arch.name, insightText);
        });
        console.log("Auto-saved insights to Mind Atlas.");
      }
    } catch (e) {
      console.warn("Auto-save failed:", e);
    }
  };

  // --- ANALYSIS HANDLER (Dream & Projection) ---
  const handleAnalyze = useCallback(async () => {
    if (!input.trim() || !mode) return;

    setLoadingState(LoadingState.ANALYZING);
    setErrorMsg(null);
    
    try {
      // START STREAMING ANALYSIS: Step 1 (Summary + Archetypes Check)
      // This returns quickly, allowing us to enter the Result page.
      const initialStep = await startStreamAnalysis(input, mode);
      
      // Construct a partial result. 
      // Archetypes are now populated immediately from Step 1.
      setResult({
        analysis: {
          summary: initialStep.summary,
          archetypes: initialStep.archetypes || [], 
          jungianPerspective: { shadow: '', anima_animus: '', self: '' } // To be populated by stream
        },
        originalText: input,
        timestamp: Date.now(),
        isComplete: initialStep.isComplete,
        guideQuestion: initialStep.guideQuestion,
        initialSession: initialStep.session // Pass the live session!
      });
      
      setLoadingState(LoadingState.COMPLETE);

    } catch (error) {
      handleError(error);
    }
  }, [input, mode]);

  // --- IMAGINATION MODE: ANALYSIS LOGIC (extracted for retry) ---
  const runImaginationAnalysis = useCallback(async (history: ChatMessage[]) => {
    setLoadingState(LoadingState.ANALYZING);
    setErrorMsg(null);
    setMode(AppMode.ACTIVE_IMAGINATION);

    try {
      const { analysis: analysisData, isComplete, guideQuestion, session } = await analyzeImaginationSession(history);
      autoSaveToAtlas(analysisData, "主动想象会话"); 
      setResult({
        analysis: analysisData,
        originalText: "Active Imagination Session Transcript",
        timestamp: Date.now(),
        isComplete: isComplete,
        guideQuestion: guideQuestion,
        initialSession: session // 传递 session 用于后续对话
      });
      setLoadingState(LoadingState.COMPLETE);
    } catch (error) {
      handleError(error);
    }
  }, []);

  const handleEndImaginationSession = useCallback(async (history: ChatMessage[]) => {
    setIsImaginationActive(false);
    if (history.length < 2) {
      setMode(null);
      return;
    }
    setLastImaginationHistory(history);
    await runImaginationAnalysis(history);
  }, [runImaginationAnalysis]);

  const handleReset = useCallback(() => {
    setResult(null);
    setDreamInput('');
    setProjectionInput('');
    setErrorMsg(null);
    setLoadingState(LoadingState.IDLE);
    setMode(null); 
    setIsImaginationActive(false);
    setCurrentView('intro');
    setIsRetryableError(false);
    setLastImaginationHistory(null);
  }, []);
  
  const handleRetry = useCallback(() => {
    if (mode === AppMode.ACTIVE_IMAGINATION && lastImaginationHistory) {
      runImaginationAnalysis(lastImaginationHistory);
    } else if (mode === AppMode.DREAM || mode === AppMode.PROJECTION) {
      handleAnalyze();
    }
  }, [mode, lastImaginationHistory, handleAnalyze, runImaginationAnalysis]);

  const projectionPlaceholder = `请描述一个最近让你产生强烈情绪反应的人或事——无论是无法抑制的愤怒、莫名的反感，还是过度的崇拜与迷恋。具体是哪一个瞬间、哪一种特质击中了你？...`;
  const dreamPlaceholder = `请尽可能详细地描述梦境：环境是昏暗还是明亮？出现了哪些熟悉或陌生的人？你感受到了怎样的情绪（恐惧、焦虑、欣喜）？即使是看似荒诞或支离破碎的片段，往往也蕴含着最关键的心理隐喻...`;

  // 语音识别功能
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别功能。请使用 Chrome、Edge 或 Safari 浏览器。');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setInterimTranscript('');
      isStopping.current = false;
    };

    recognition.onresult = (event: any) => {
      // 如果正在停止过程中，忽略后续结果
      if (isStopping.current) return;
      
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // 实时显示临时识别结果
      setInterimTranscript(interim);

      // 将确定的文字追加到输入框
      if (final) {
        setInput(prev => {
          // 如果前面有内容且不是以空格结尾，添加空格
          if (prev && !prev.endsWith(' ') && !prev.endsWith('\n')) {
            return prev + ' ' + final;
          }
          return prev + final;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      setIsRecording(false);
      setInterimTranscript('');
      if (event.error === 'no-speech') {
        alert('没有检测到语音，请重试');
      } else if (event.error === 'not-allowed') {
        alert('请允许浏览器访问麦克风');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript('');
      isStopping.current = false;
      (window as any).currentRecognition = null;
    };

    recognition.start();

    // 保存 recognition 实例以便停止
    (window as any).currentRecognition = recognition;
  };

  const stopVoiceRecognition = () => {
    if ((window as any).currentRecognition) {
      // 先设置停止标志，阻止新的识别结果
      isStopping.current = true;
      
      // 保存当前的临时文字
      const currentInterim = interimTranscript.trim();
      
      // 如果有临时文字，添加到输入框
      if (currentInterim) {
        setInput(prev => {
          // 如果前面有内容且不是以空格结尾，添加空格
          if (prev && !prev.endsWith(' ') && !prev.endsWith('\n')) {
            return prev + ' ' + currentInterim;
          }
          return prev + currentInterim;
        });
      }
      
      // 停止识别
      (window as any).currentRecognition.stop();
      (window as any).currentRecognition = null;
      
      // 清空临时文字和录音状态
      setInterimTranscript('');
      setIsRecording(false);
    }
  };

  if (currentView === 'atlas') {
    return <MindAtlas onBack={() => setCurrentView('intro')} />;
  }

  if (currentView === 'library') {
    return <Library onBack={() => setCurrentView('intro')} />;
  }

  if (isImaginationActive) {
    return <ActiveImagination onEndSession={handleEndImaginationSession} onBack={() => {setIsImaginationActive(false); setMode(null);}} />;
  }

  if (result && mode) {
    return <AnalysisResult result={result} onReset={handleReset} mode={mode} />;
  }
  
  if (loadingState === LoadingState.ANALYZING && mode) {
    return (
      <div className="section" style={{ justifyContent: 'center', paddingTop: 0, paddingBottom: 0 }}>
        <LoadingView 
          message={mode === AppMode.PROJECTION ? "正在解析情绪投射..." : "正在潜入无意识深处..."}
          mode={mode}
        />
      </div>
    );
  }

  if (loadingState === LoadingState.ERROR && errorMsg) {
    return (
      <div className="error-overlay">
        <div className="error-card">
          <div className="error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <p className="error-message">{errorMsg}</p>
          <div className="error-buttons">
            <button onClick={handleReset} className="error-btn secondary">
              返回
            </button>
            {isRetryableError && (
              <button onClick={handleRetry} className="error-btn primary">
                重试
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed-background" />
      <StarField />
      <div className="ocean-perspective">
        <div className="ocean-plane">
           <div className="ocean-vignette"></div>
        </div>
      </div>

      {loadingState === LoadingState.IDLE && !isImaginationActive && currentView === 'intro' && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 100, display: 'flex', gap: '16px' }}>
          <button className="atlas-nav-button" title="原型航志" onClick={() => setCurrentView('atlas')}><i className="fas fa-compass"></i></button>
          <button className="atlas-nav-button" title="心理文库" onClick={() => setCurrentView('library')}><i className="fas fa-book-open"></i></button>
        </div>
      )}

      <div className="section splash">
          {loadingState === LoadingState.IDLE && (
              <Intro 
                onModeSelect={setMode} 
                currentMode={mode}
                cards={introCards}
                inputSectionRef={inputSectionRef}
                inputSection={
                  mode && (
                    <div className="container" ref={inputSectionRef}>
                      {mode === AppMode.ACTIVE_IMAGINATION ? (
                        <div className="input-section" style={{ textAlign: 'center' }}>
                           <p style={{ color: 'var(--muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                             主动想象是一种与潜意识对话的技术。建议在安静环境下进行。
                           </p>
                           <button className="analyze-button" onClick={() => setIsImaginationActive(true)}>开始旅程</button>
                        </div>
                      ) : (
                        <div className="input-section">
                          <textarea
                            placeholder={mode === AppMode.DREAM ? dreamPlaceholder : projectionPlaceholder}
                            value={input + (interimTranscript && input && !input.endsWith(' ') && !input.endsWith('\n') ? ' ' : '') + interimTranscript}
                            onChange={(e) => setInput(e.target.value)}
                            style={isRecording ? { 
                              borderColor: 'rgba(200, 220, 255, 0.6)',
                              boxShadow: '0 0 20px rgba(200, 220, 255, 0.3)'
                            } : {}}
                          />
                          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                            <button
                              onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                              className={`voice-button ${isRecording ? 'recording' : ''}`}
                              title={isRecording ? "停止录音" : "语音输入"}
                              type="button"
                            >
                              <i className={isRecording ? "fas fa-stop-circle" : "fas fa-microphone"}></i>
                            </button>
                            <button className="analyze-button" disabled={!input.trim()} onClick={handleAnalyze}>开启解析</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
              />
          )}
      </div>
    </>
  );
};

export default App;