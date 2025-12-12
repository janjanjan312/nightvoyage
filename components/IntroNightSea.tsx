import React, { useMemo } from 'react';
import { AppMode } from '../types';

interface IntroNightSeaProps {
  onModeSelect: (mode: AppMode) => void;
  currentMode: AppMode | null;
}

// Reusable Constellation Component
const ConstellationNode: React.FC<{
  mode: AppMode;
  label: string;
  subLabel: string;
  isActive: boolean;
  onClick: () => void;
  stars: { cx: number; cy: number; r: number; opacity?: number }[];
  lines: string[]; // SVG Path d strings
  viewBox: string;
  color: string;
  className: string;
}> = ({ mode, label, subLabel, isActive, onClick, stars, lines, viewBox, color, className }) => {
  return (
    <div 
      className={`star-node ${className} ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ '--node-color': color } as React.CSSProperties}
    >
      <div className="constellation-svg-wrapper">
        <svg viewBox={viewBox} className="constellation-svg">
          {/* Connecting Lines (Visible on Hover/Active) */}
          <g className="constellation-lines-group">
            {lines.map((d, i) => (
              <path key={i} d={d} stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" className="draw-path" />
            ))}
          </g>
          
          {/* Stars (Always visible, maybe pulse) */}
          <g className="constellation-stars-group">
            {stars.map((s, i) => (
              <circle 
                key={i} 
                cx={s.cx} 
                cy={s.cy} 
                r={s.r} 
                fill="white" 
                style={{ opacity: s.opacity ?? 0.8 }} 
                className="star-dot"
              />
            ))}
          </g>
        </svg>
      </div>
      
      <div className="star-label-container">
        <div className="star-label-main">{label}</div>
        <div className="star-label-sub">{subLabel}</div>
      </div>
    </div>
  );
};

// Animated Headline for Night Sea (Gold)
const AnimatedNightSeaHeadline: React.FC<{ text: string }> = ({ text }) => {
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


const IntroNightSea: React.FC<IntroNightSeaProps> = ({ onModeSelect, currentMode }) => {
  return (
    <>
      {/* 
        STATIC ATMOSPHERE LAYER
        No SVGs, no animations, no turbulence.
        Just the CSS gradient defined in index.html (.ocean-perspective) 
        provides the deep, quiet blue anchor at the bottom of the screen.
      */}
      <div className="ocean-perspective">
        <div className="ocean-plane">
           <div className="ocean-vignette"></div>
        </div>
      </div>

      {/* Horizontal Title (Replacing the Vertical one) */}
      <div className="night-sea-title-container">
        <AnimatedNightSeaHeadline text="夜航船" />
        <AnimatedEnglishSubtitle text="Night Voyage" />
      </div>

      {/* Constellation Navigation Map */}
      <div className="constellation-map">
        
        {/* 1. PROJECTION (The Eye) */}
        <ConstellationNode
          mode={AppMode.PROJECTION}
          label="情绪投射"
          subLabel="Projection"
          isActive={currentMode === AppMode.PROJECTION}
          onClick={() => onModeSelect(AppMode.PROJECTION)}
          className="node-projection"
          color="var(--projection-blue)"
          viewBox="0 0 100 60"
          stars={[
            { cx: 50, cy: 30, r: 3 },    // Pupil
            { cx: 10, cy: 30, r: 1.5 },  // Left corner
            { cx: 90, cy: 30, r: 1.5 },  // Right corner
            { cx: 30, cy: 15, r: 1.5 },  // Top arch
            { cx: 70, cy: 15, r: 1.5 },
            { cx: 30, cy: 45, r: 1.5 },  // Bottom arch
            { cx: 70, cy: 45, r: 1.5 },
          ]}
          lines={[
            "M 10 30 Q 50 -5 90 30", // Upper lid
            "M 10 30 Q 50 65 90 30", // Lower lid
            "M 50 30 m -6, 0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0", // Pupil
          ]}
        />

        {/* 2. DREAM (The Moon) */}
        <ConstellationNode
          mode={AppMode.DREAM}
          label="梦境解析"
          subLabel="Dream Analysis"
          isActive={currentMode === AppMode.DREAM}
          onClick={() => onModeSelect(AppMode.DREAM)}
          className="node-dream"
          color="var(--mystic-gold)"
          viewBox="0 0 80 80"
          stars={[
            { cx: 40, cy: 10, r: 1.5 }, // Top tip
            { cx: 40, cy: 70, r: 1.5 }, // Bottom tip
            { cx: 20, cy: 40, r: 2.5 }, // Outer bulge center
            { cx: 55, cy: 40, r: 1.5 }, // Inner curve center
            { cx: 25, cy: 20, r: 1.5 },
            { cx: 25, cy: 60, r: 1.5 },
          ]}
          lines={[
            "M 40 10 Q -5 40 40 70", // Outer curve (bulge left)
            "M 40 10 Q 25 40 40 70", // Inner curve
          ]}
        />

        {/* 3. IMAGINATION (The 8-Petal Flower) - Corrected Icon */}
        <ConstellationNode
          mode={AppMode.ACTIVE_IMAGINATION}
          label="主动想象"
          subLabel="Active Imagination"
          isActive={currentMode === AppMode.ACTIVE_IMAGINATION}
          onClick={() => onModeSelect(AppMode.ACTIVE_IMAGINATION)}
          className="node-imagination"
          color="var(--imagination-green)"
          viewBox="0 0 100 100"
          stars={[
            { cx: 50, cy: 50, r: 2.5 },
          ]}
          lines={[
            // Scaled down versions of the 8-petal flower paths
            "M50,50 C42.2,30.5 46.1,10.2 50,6.2 C53.9,10.2 57.8,30.5 50,50 Z",
            "M50,50 C62.5,37.5 79,29 82,20 C71.3,29 62.5,37.5 50,50 Z",
            "M50,50 C69.5,42.2 89.8,46.1 93.8,50 C89.8,53.9 69.5,57.8 50,50 Z",
            "M50,50 C62.5,62.5 79,71 82,80 C71.3,71 62.5,62.5 50,50 Z",
            "M50,50 C42.2,69.5 46.1,89.8 50,93.8 C53.9,89.8 57.8,69.5 50,50 Z",
            "M50,50 C37.5,62.5 21,71 18,80 C28.7,71 37.5,62.5 50,50 Z",
            "M50,50 C30.5,42.2 10.2,46.1 6.2,50 C10.2,53.9 30.5,57.8 50,50 Z",
            "M50,50 C37.5,37.5 21,29 18,20 C28.7,29 37.5,37.5 50,50 Z",
          ]}
        />

      </div>
    </>
  );
};

export default IntroNightSea;