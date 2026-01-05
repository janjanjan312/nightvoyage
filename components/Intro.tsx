import React, { useMemo, useRef } from 'react';
import { AppMode, StoredArchetype } from '../types';
import ConstellationIcon from './ConstellationIcon';
import { getArchetypeImageUrl } from '../services/archetypeImageService';
import { getArchetypeBaseInfo } from '../services/archetypeData';

interface IntroProps {
  onModeSelect: (mode: AppMode) => void;
  currentMode: AppMode | null;
  inputSection?: React.ReactNode;
  cards: (StoredArchetype & { isRandom?: boolean })[];
  inputSectionRef?: React.RefObject<HTMLDivElement>;
}

const smoothScrollToTarget = (target: HTMLElement, duration: number) => {
  const start = window.scrollY;
  const targetPosition = target.getBoundingClientRect().top + window.scrollY;
  const distance = targetPosition - start;
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, start + distance * ease);
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };
  requestAnimationFrame(animation);
};

// Helper to create animated characters for the headline
const AnimatedHeadline: React.FC<{ text: string }> = ({ text }) => {
  const chars = useMemo(() => {
    return text.split('').map((char, index) => ({
      char,
      delay: index * 0.4,
      duration: 8
    }));
  }, [text]);

  return (
    <h1 className="headline gold">
      {chars.map((item, index) => (
        <span key={index} style={{ '--delay': `${item.delay}s`, '--duration': `${item.duration}s` } as React.CSSProperties}>
          {item.char}
        </span>
      ))}
    </h1>
  );
};

const AnimatedEnglishSubtitle: React.FC<{ text: string }> = ({ text }) => {
  const chars = useMemo(() => {
    return text.split('').map((char, index) => ({
      char: char === ' ' ? '\u00A0' : char,
      delay: 0.2 + index * 0.1,
      duration: 8
    }));
  }, [text]);

  return (
    <p className="headline-english-subtitle">
      {chars.map((item, index) => (
        <span key={index} style={{ '--delay': `${item.delay}s`, '--duration': `${item.duration}s` } as React.CSSProperties}>
          {item.char}
        </span>
      ))}
    </p>
  );
};

const AnimatedChineseSubtitle: React.FC<{ text: string }> = ({ text }) => {
  const chars = useMemo(() => {
    return text.split('').map((char, index) => ({
      char,
      delay: 0.5 + index * 0.08,
      duration: 8 
    }));
  }, [text]);

  return (
    <p className="headline-subtitle">
      {chars.map((item, index) => (
        <span key={index} style={{ '--delay': `${item.delay}s`, '--duration': `${item.duration}s` } as React.CSSProperties}>
          {item.char}
        </span>
      ))}
    </p>
  );
};

const IntroCard: React.FC<{
  archetype: StoredArchetype & { isRandom?: boolean };
  delay: number;
}> = ({ archetype, delay }) => {
  const { name, insights, isRandom } = archetype;
  const { enName, zhName, description } = getArchetypeBaseInfo(name);
  const imageUrl = getArchetypeImageUrl(name);

  // 展示最近的最多3条洞察，最新的在前
  const displayInsights = [...(insights || [])].reverse().slice(0, 3);

  return (
    <div className="intro-card" style={{ animationDelay: `${delay}s` } as React.CSSProperties}>
      <div className="intro-card-inner">
        <div className="intro-card-front">
           <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 0,
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden'
           }} />
           <div className="intro-card-overlay" />
           <div className="intro-card-content">
             <h3 style={{ fontSize: '1.25rem' }}>{enName}</h3>
             <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{zhName}</span>
           </div>
           {!isRandom && (
             <div style={{
               position: 'absolute', top: '12px', right: '12px', zIndex: 10,
               color: 'var(--mystic-gold)', fontSize: '0.7rem',
               WebkitBackfaceVisibility: 'hidden',
               backfaceVisibility: 'hidden'
             }}>
               <i className="fas fa-certificate"></i>
             </div>
           )}
        </div>
        <div className="intro-card-back">
          {isRandom || displayInsights.length === 0 ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: '0.9rem', textAlign: 'justify', lineHeight: '1.8' }}>{description}</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                fontFamily: '"Cinzel", serif', 
                color: 'var(--mystic-gold)', 
                fontSize: '0.6rem',
                letterSpacing: '1.5px',
                marginBottom: '12px',
                opacity: 0.6,
                textAlign: 'center'
              }}>
                VOYAGE INSIGHTS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
                {displayInsights.map((insight, idx) => (
                  <div key={idx} className="home-insight-item" style={{ 
                    borderLeft: '1px solid rgba(247, 227, 150, 0.3)',
                    paddingLeft: '10px',
                    position: 'relative'
                  }}>
                    <p style={{ 
                      fontSize: '0.72rem', 
                      lineHeight: 1.4, 
                      color: 'rgba(255,255,255,0.95)',
                      margin: '0 0 3px 0',
                      fontFamily: '"Noto Serif SC", serif',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {insight.text}
                    </p>
                    <div style={{ 
                      fontSize: '0.5rem', 
                      color: 'var(--muted)',
                      fontFamily: '"Cinzel", serif',
                      opacity: 0.6
                    }}>
                      {new Date(insight.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '8px', textAlign: 'center' }}>
                 <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 auto' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Intro: React.FC<IntroProps> = ({ onModeSelect, currentMode, inputSection, cards, inputSectionRef }) => {
  const modeSectionRef = useRef<HTMLDivElement>(null);

  const scrollToModes = () => {
    // If mode is already selected and input section exists, scroll to center input
    if (currentMode && inputSectionRef?.current) {
      const element = inputSectionRef.current;
      const rect = element.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      // Calculate target to center the element in viewport (same as initial mode selection)
      const targetY = absoluteTop - (window.innerHeight / 2) + (rect.height / 2);
      const startY = window.scrollY;
      const distance = targetY - startY;
      let startTime: number | null = null;

      const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / 1500, 1);
        const ease = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, startY + distance * ease);
        if (timeElapsed < 1500) {
          requestAnimationFrame(animation);
        }
      };
      requestAnimationFrame(animation);
    } else if (modeSectionRef.current) {
      smoothScrollToTarget(modeSectionRef.current, 1500);
    }
  };

  const projectionData = {
    viewBox: "0 0 512 512",
    stars: [{ cx: 40, cy: 256, r: 8 }, { cx: 472, cy: 256, r: 8 }, { cx: 256, cy: 120, r: 8 }, { cx: 256, cy: 392, r: 8 }, { cx: 256, cy: 256, r: 10 }],
    lines: ["M256 120c-126 0-216 136-216 136s90 136 216 136 216-136 216-136-90-136-216-136z M256 322c-36.5 0-66-29.5-66-66s29.5-66 66-66 66 29.5 66 66-29.5 66-66 66z"]
  };

  const dreamData = {
    viewBox: "0 0 512 512",
    stars: [{ cx: 256, cy: 64, r: 8 }, { cx: 256, cy: 448, r: 8 }, { cx: 64, cy: 256, r: 8 }, { cx: 200, cy: 256, r: 6 }],
    lines: ["M256 64C160 64 64 160 64 256s96 192 192 192c48 0 91-18 124-47-5-1-10-1-16-1-106 0-192-86-192-192 0-66 33-125 84-161-17-4-35-7-54-7z"]
  };

  const imaginationData = {
    viewBox: "0 0 512 512",
    stars: [{ cx: 256, cy: 256, r: 12 }],
    lines: ["M256,256 C216,156 236,52 256,32 C276,52 296,156 256,256 Z", "M256,256 C320,192 404,148 419,103 C365,148 320,192 256,256 Z", "M256,256 C356,216 460,236 480,256 C460,276 356,296 256,256 Z", "M256,256 C320,320 404,364 419,409 C365,364 320,320 256,256 Z", "M256,256 C216,356 236,460 256,480 C276,460 296,356 256,256 Z", "M256,256 C192,320 108,364 93,409 C147,364 192,320 256,256 Z", "M256,256 C156,216 52,236 32,256 C52,276 156,296 256,256 Z", "M256,256 C192,192 108,148 93,103 C147,148 192,192 256,256 Z"]
  };

  return (
    <div className="splash-inner">
      <div className="intro-screen intro-screen-1">
        <div style={{ marginTop: 'auto', marginBottom: 'auto', width: '100%' }}>
          <AnimatedHeadline text="夜航船" />
          <AnimatedEnglishSubtitle text="Night Voyage" />
          <AnimatedChineseSubtitle text="以荣格理论为航图，潜入你的无意识海洋" />

          <div className="intro-showcase">
            {cards.map((card, idx) => (
              <IntroCard key={card.name} archetype={card} delay={idx * 0.4} />
            ))}
          </div>
        </div>

        <div className="scroll-down-indicator" onClick={scrollToModes}>
          <span className="scroll-text">EXPLORE</span>
          <i className="fas fa-chevron-down"></i>
        </div>
      </div>

      <div className="intro-screen intro-screen-2" ref={modeSectionRef}>
        <div className="section-divider"></div>
        <div className="mode-selection-grid">
          <div onClick={() => onModeSelect(AppMode.PROJECTION)} className={`mode-card ${currentMode === AppMode.PROJECTION ? 'active' : ''}`} style={{ '--icon-color': 'var(--projection-blue)' } as React.CSSProperties}>
             <div className="card-icon-wrapper"><div className="icon-container"><ConstellationIcon {...projectionData} color="var(--projection-blue)" /></div></div>
            <h3>情绪投射</h3>
            <p>外界是你内心的镜子。无论是强烈的反感、过度的崇拜，还是莫名的焦虑，都隐藏着你未被整合的潜能。</p>
          </div>
          <div onClick={() => onModeSelect(AppMode.DREAM)} className={`mode-card ${currentMode === AppMode.DREAM ? 'active' : ''}`} style={{ '--icon-color': 'var(--mystic-gold)' } as React.CSSProperties}>
            <div className="card-icon-wrapper"><div className="icon-container"><ConstellationIcon {...dreamData} color="var(--mystic-gold)" /></div></div>
            <h3>梦境解析</h3>
            <p>梦是潜意识的来信。解梦师将识别梦境中的原型符号，揭示潜意识试图告诉你的指引。</p>
          </div>
          <div onClick={() => onModeSelect(AppMode.ACTIVE_IMAGINATION)} className={`mode-card ${currentMode === AppMode.ACTIVE_IMAGINATION ? 'active' : ''}`} style={{ '--icon-color': 'var(--imagination-green)' } as React.CSSProperties}>
            <div className="card-icon-wrapper"><div className="icon-container"><ConstellationIcon {...imaginationData} color="var(--imagination-green)" /></div></div>
            <h3>主动想象</h3>
            <p>跟随梦境引导师，主动进入潜意识，与内心浮现的形象对话，探索并化解内在的冲突。</p>
          </div>
        </div>
        {inputSection && <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>{inputSection}</div>}
      </div>
    </div>
  );
};

export default Intro;