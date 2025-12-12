import React, { useMemo } from 'react';
import { AppMode } from '../types';
import ConstellationIcon from './ConstellationIcon';

interface IntroProps {
  onModeSelect: (mode: AppMode) => void;
  currentMode: AppMode | null;
}

// Helper to create animated characters for the headline
const AnimatedHeadline: React.FC<{ text: string }> = ({ text }) => {
  const chars = useMemo(() => {
    const DELAY_INCREMENT = 0.4; // Increased for a more noticeable wave effect
    return text.split('').map((char, index) => ({
      char,
      delay: index * DELAY_INCREMENT, // Incremental delay
      duration: 8 // Set a fixed duration for consistent speed
    }));
  }, [text]);

  return (
    <h1 className="headline gold">
      {chars.map((item, index) => (
        <span 
          key={index} 
          style={{ 
            '--delay': `${item.delay}s`,
            '--duration': `${item.duration}s`
          } as React.CSSProperties}
        >
          {item.char}
        </span>
      ))}
    </h1>
  );
};

// Helper to create animated characters for the English subtitle
const AnimatedEnglishSubtitle: React.FC<{ text: string }> = ({ text }) => {
  const chars = useMemo(() => {
    const DELAY_INCREMENT = 0.1; // Faster wave for the subtitle
    const INITIAL_DELAY = 0.2; // Start animation slightly after the main title
    return text.split('').map((char, index) => ({
      char: char === ' ' ? '\u00A0' : char, // Use non-breaking space for layout
      delay: INITIAL_DELAY + index * DELAY_INCREMENT,
      duration: 8 // Keep overall animation speed consistent
    }));
  }, [text]);

  return (
    <p className="headline-english-subtitle">
      {chars.map((item, index) => (
        <span 
          key={index} 
          style={{ 
            '--delay': `${item.delay}s`,
            '--duration': `${item.duration}s`
          } as React.CSSProperties}
        >
          {item.char}
        </span>
      ))}
    </p>
  );
};

// Helper to create animated characters for the Chinese subtitle
const AnimatedChineseSubtitle: React.FC<{ text: string }> = ({ text }) => {
  const chars = useMemo(() => {
    const DELAY_INCREMENT = 0.08; // Slower, more subtle wave
    const INITIAL_DELAY = 0.5; // Start animation after the English title
    return text.split('').map((char, index) => ({
      char,
      delay: INITIAL_DELAY + index * DELAY_INCREMENT,
      duration: 8 
    }));
  }, [text]);

  return (
    <p className="headline-subtitle">
      {chars.map((item, index) => (
        <span 
          key={index} 
          style={{ 
            '--delay': `${item.delay}s`,
            '--duration': `${item.duration}s`
          } as React.CSSProperties}
        >
          {item.char}
        </span>
      ))}
    </p>
  );
};


const Intro: React.FC<IntroProps> = ({ onModeSelect, currentMode }) => {
  const subtitleText = "以荣格理论为航图，潜入你的无意识海洋";

  // --- CONSTELLATION & ICON PATH DATA (ViewBox 0 0 512 512) ---
  
  // 1. PROJECTION (EYE) - UNCHANGED
  const projectionData = {
    viewBox: "0 0 512 512",
    stars: [
      { cx: 40, cy: 256, r: 8 },    // Left corner
      { cx: 472, cy: 256, r: 8 },   // Right corner
      { cx: 256, cy: 120, r: 8 },   // Top center
      { cx: 256, cy: 392, r: 8 },   // Bottom center
      { cx: 256, cy: 256, r: 10 },  // Pupil center
      { cx: 256, cy: 190, r: 6 },   // Pupil top highlight
    ],
    lines: [
      "M256 120c-126 0-216 136-216 136s90 136 216 136 216-136 216-136-90-136-216-136z M256 322c-36.5 0-66-29.5-66-66s29.5-66 66-66 66 29.5 66 66-29.5 66-66 66z"
    ]
  };

  // 2. DREAM (MOON) - UNCHANGED
  const dreamData = {
    viewBox: "0 0 512 512",
    stars: [
      { cx: 256, cy: 64, r: 8 },    // Top tip
      { cx: 256, cy: 448, r: 8 },   // Bottom tip
      { cx: 64, cy: 256, r: 8 },    // Back curve center
      { cx: 200, cy: 256, r: 6 },   // Inner curve center area
      { cx: 120, cy: 140, r: 6 },
      { cx: 120, cy: 372, r: 6 },
    ],
    lines: [
      "M256 64C160 64 64 160 64 256s96 192 192 192c48 0 91-18 124-47-5-1-10-1-16-1-106 0-192-86-192-192 0-66 33-125 84-161-17-4-35-7-54-7z"
    ]
  };

  // 3. IMAGINATION (8-Petal Flower) - NEW ICON
  const imaginationData = {
    viewBox: "0 0 512 512",
    stars: [
      { cx: 256, cy: 256, r: 12 }, // Center
    ],
    lines: [
      // N
      "M256,256 C216,156 236,52 256,32 C276,52 296,156 256,256 Z",
      // NE
      "M256,256 C320,192 404,148 419,103 C365,148 320,192 256,256 Z",
      // E
      "M256,256 C356,216 460,236 480,256 C460,276 356,296 256,256 Z",
      // SE
      "M256,256 C320,320 404,364 419,409 C365,364 320,320 256,256 Z",
      // S
      "M256,256 C216,356 236,460 256,480 C276,460 296,356 256,256 Z",
      // SW
      "M256,256 C192,320 108,364 93,409 C147,364 192,320 256,256 Z",
      // W
      "M256,256 C156,216 52,236 32,256 C52,276 156,296 256,256 Z",
      // NW
      "M256,256 C192,192 108,148 93,103 C147,148 192,192 256,256 Z"
    ]
  };

  return (
    <div className="splash-inner">
      <AnimatedHeadline text="夜航船" />
      <AnimatedEnglishSubtitle text="Night Voyage" />
      <AnimatedChineseSubtitle text={subtitleText} />

      <div className="mode-selection-grid">
        
        {/* Card 1: Projection */}
        <div 
          onClick={() => onModeSelect(AppMode.PROJECTION)}
          className={`mode-card ${currentMode === AppMode.PROJECTION ? 'active' : ''}`}
          style={{ '--icon-color': 'var(--projection-blue)' } as React.CSSProperties}
        >
           <div className="card-icon-wrapper">
              <div className="icon-container">
                <ConstellationIcon {...projectionData} color="var(--projection-blue)" />
              </div>
           </div>
          <h3>情绪投射</h3>
          <p>外界是你内心的镜子。无论是强烈的反感、过度的崇拜，还是莫名的焦虑，都隐藏着你未被整合的潜能。</p>
        </div>

        {/* Card 2: Dream */}
        <div 
          onClick={() => onModeSelect(AppMode.DREAM)}
          className={`mode-card ${currentMode === AppMode.DREAM ? 'active' : ''}`}
          style={{ '--icon-color': 'var(--mystic-gold)' } as React.CSSProperties}
        >
          <div className="card-icon-wrapper">
             <div className="icon-container">
                <ConstellationIcon {...dreamData} color="var(--mystic-gold)" />
              </div>
          </div>
          <h3>梦境解析</h3>
          <p>梦是潜意识的来信。解梦师将识别梦境中的原型符号，揭示潜意识试图告诉你的指引。</p>
        </div>

        {/* Card 3: Active Imagination */}
        <div 
          onClick={() => onModeSelect(AppMode.ACTIVE_IMAGINATION)}
          className={`mode-card ${currentMode === AppMode.ACTIVE_IMAGINATION ? 'active' : ''}`}
          style={{ '--icon-color': 'var(--imagination-green)' } as React.CSSProperties}
        >
          <div className="card-icon-wrapper">
             <div className="icon-container">
                <ConstellationIcon {...imaginationData} color="var(--imagination-green)" />
              </div>
          </div>
          <h3>主动想象</h3>
          <p>跟随梦境引导师，主动进入潜意识，与内心浮现的形象对话，探索并化解内在的冲突。</p>
        </div>

      </div>
    </div>
  );
};

export default Intro;