import React, { useState, useCallback, useEffect, useRef } from 'react';
import Intro from './components/Intro';
import AnalysisResult from './components/AnalysisResult';
import LoadingView from './components/LoadingView';
import ActiveImagination from './components/ActiveImagination';
import MindAtlas from './components/MindAtlas';
import Library, { preloadLibraryImages } from './components/Library';
import StarField from './components/StarField';
import { startStreamAnalysis, analyzeImaginationSession } from './services/geminiService';
import * as storageService from './services/storageService';
import { LoadingState, DreamResult, AppMode, ChatMessage } from './types';

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
  const [input, setInput] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<DreamResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isImaginationActive, setIsImaginationActive] = useState(false);
  const [currentView, setCurrentView] = useState<'intro' | 'atlas' | 'library'>('intro');
  const [hasNewCards, setHasNewCards] = useState(false);

  const [isRetryableError, setIsRetryableError] = useState(false);
  const [lastImaginationHistory, setLastImaginationHistory] = useState<ChatMessage[] | null>(null);
  
  const inputSectionRef = useRef<HTMLDivElement>(null);

  // Preload Library images on mount
  useEffect(() => {
    preloadLibraryImages();
  }, []);

  // Check for new atlas cards on mount and after analysis
  useEffect(() => {
    setHasNewCards(storageService.hasNewAtlasCards());
  }, []);

  // Re-check for new cards when returning to intro view or after completing analysis
  useEffect(() => {
    if (currentView === 'intro' || loadingState === LoadingState.COMPLETE) {
      setHasNewCards(storageService.hasNewAtlasCards());
    }
  }, [currentView, loadingState]);

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
    setInput('');
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

      <div style={{ position: 'fixed', top: '40px', right: '40px', zIndex: 1000, display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => {
              setCurrentView('atlas');
              setHasNewCards(false); // Clear the glow when clicked
            }} 
            className={`atlas-nav-button ${hasNewCards ? 'has-new-content' : ''}`}
            title="原型航志"
            style={{ width: '50px', height: '50px' }}
          >
             <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              stroke="none" 
              style={{ width: '24px', height: '24px' }}
            >
              <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
              <path d="M20 2 L22 4 L20 6 L18 4 Z"/>
              <circle cx="4" cy="20" r="2.2"/>
            </svg>
          </button>
          <button 
            onClick={() => setCurrentView('library')} 
            className="atlas-nav-button" 
            title="心理文库"
            style={{ width: '50px', height: '50px' }}
          >
             <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              stroke="none" 
              style={{ width: '24px', height: '24px' }}
            >
              <path d="M2 6l6-2v14l-6 2V6z M9 4l6 2v14l-6-2V4z M16 6l6-2v14l-6 2V6z" />
            </svg>
          </button>
      </div>

      <div className="section splash">
        <div className="container">
          
          {loadingState === LoadingState.IDLE && (
              <Intro onModeSelect={setMode} currentMode={mode} />
          )}

          {loadingState === LoadingState.IDLE && mode && (
            <div ref={inputSectionRef} className="input-section" style={{ position: 'relative', zIndex: 20 }}>
              <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', fontFamily: 'var(--font-serif)', fontWeight: 600 }}>
                    {mode === AppMode.DREAM && <svg width="1.1em" height="1.1em" viewBox="0 0 512 512" fill="var(--mystic-gold)" style={{ verticalAlign: '-0.15em' }}><path d={DREAM_ICON_PATH} /></svg>}
                    {mode === AppMode.PROJECTION && <svg width="1.1em" height="1.1em" viewBox="0 0 512 512" fill="var(--projection-blue)" style={{ verticalAlign: '-0.15em' }}><path d={PROJECTION_ICON_PATH} /></svg>}
                    {mode === AppMode.ACTIVE_IMAGINATION && <svg width="1.1em" height="1.1em" viewBox="0 0 512 512" fill="var(--imagination-green)" style={{ verticalAlign: '-0.15em' }}>{IMAGINATION_ICON_PATHS.map((path, i) => <path key={i} d={path} />)}</svg>}
                    
                    {mode === AppMode.DREAM ? "记录梦境" : mode === AppMode.PROJECTION ? "情绪投射" : "主动想象"}
                  </label>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '8px', lineHeight: 1.7 }}>
                    {mode === AppMode.DREAM 
                      ? "梦是通往无意识的皇家大道。当意识的审查放松，心灵深处的本能与智慧便借由象征符号上演戏剧。请记录下那些荒诞的意象、强烈的情感或重复出现的主题，它们往往携带着心灵整合所需的关键信息。"
                      : mode === AppMode.PROJECTION
                      ? '「投射」是无意识的镜子。我们常将自己无意识中未被接纳的阴影或未被发掘的潜能，不由自主地“投射”到他人身上。识别这些投射，便是收回力量、整合自我的契机。'
                      : '由荣格开创的“主动想象”是一种特殊的“清醒梦”技术。它邀请我们在意识清醒时，放下理性的控制，进入内心的“戏剧舞台”。这里潜意识的意象不再是静止的画面，而是鲜活的角色，与它们对话、互动，将分裂的能量重新整合为生命力。'}
                  </p>
                </div>
              
              { (mode === AppMode.DREAM || mode === AppMode.PROJECTION) &&
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === AppMode.DREAM ? dreamPlaceholder : projectionPlaceholder}
                />
              }
              
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button
                  onClick={mode === AppMode.ACTIVE_IMAGINATION ? () => setIsImaginationActive(true) : handleAnalyze}
                  disabled={(mode === AppMode.DREAM || mode === AppMode.PROJECTION) && !input.trim()}
                  className="analyze-button"
                >
                  {mode === AppMode.DREAM ? "解析梦境" : mode === AppMode.PROJECTION ? "分析投射" : "开始想象"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;