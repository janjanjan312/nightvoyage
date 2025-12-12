import React, { useMemo } from 'react';
import { AppMode } from '../types';

interface LoadingViewProps {
  message: string;
  mode: AppMode;
}

const LoadingView: React.FC<LoadingViewProps> = ({ message, mode }) => {
  
  let glowColor;
  switch (mode) {
    case AppMode.PROJECTION:
      glowColor = 'var(--projection-blue)';
      break;
    case AppMode.ACTIVE_IMAGINATION:
      glowColor = 'var(--imagination-green)';
      break;
    case AppMode.DREAM:
    default:
      glowColor = 'var(--mystic-gold)'; 
      break;
  }

  // Split message for floating animation
  const chars = useMemo(() => {
    return message.split('').map((char, index) => ({
      char: char === ' ' ? '\u00A0' : char,
      delay: index * 0.1, 
    }));
  }, [message]);

  // --- Construct the 8-Petal Flower Shape ---
  const petalCount = 8;
  const petals = Array.from({ length: petalCount }).map((_, i) => {
    const rotation = i * (360 / petalCount);
    return (
      <g key={i} transform={`rotate(${rotation})`}>
        {/* 
           Petal Shape (Slimmer/Elegant):
           M 0 -4: Start
           C 9 -18 9 -40 0 -54: Right curve (Reduced X control from 14 to 9 for slimmer look)
           C -9 -40 -9 -18 0 -4: Left curve mirrored
        */}
        <path 
          d="M 0 -4 C 9 -18 9 -40 0 -54 C -9 -40 -9 -18 0 -4" 
          fill="#FFFFFF" 
          fillOpacity="0.95"
        />
        
        {/* Inner Vein / Detail */}
        <path
           d="M 0 -10 L 0 -42" 
           stroke="#000" 
           strokeOpacity="0.1"
           strokeWidth="1"
           strokeLinecap="round"
        />
      </g>
    );
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      color: 'var(--text)',
      textAlign: 'center',
      height: '100%',
      minHeight: '400px',
      position: 'relative'
    }}>
      <style>
        {`
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes breathe-glow {
            0%, 100% { filter: drop-shadow(0 0 6px ${glowColor}) opacity(0.85); }
            50% { filter: drop-shadow(0 0 36px ${glowColor}) opacity(1); }
          }
          @keyframes float-char {
            0%, 100% { transform: translateY(0); opacity: 0.5; }
            50% { transform: translateY(-4px); opacity: 0.9; }
          }
        `}
      </style>
      
      {/* Container Size */}
      <div style={{
        position: 'relative',
        width: '80px', 
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
         {/* The Rotating Flower */}
         <svg 
            style={{ 
                width: '100%', 
                height: '100%', 
                overflow: 'visible',
                animation: 'spin-slow 16s linear infinite', 
            }}
            viewBox="-60 -60 120 120"
         >
            {/* Apply the breathing glow filter */}
            <g style={{ animation: 'breathe-glow 3s ease-in-out infinite' }}>
                
                {/* Petals */}
                <g>{petals}</g>

                {/* Center Core */}
                <circle cx="0" cy="0" r="5" fill={glowColor} />
                <circle cx="0" cy="0" r="2.5" fill="#fff" fillOpacity="0.8" />
            </g>
         </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <p style={{
          fontFamily: '"Noto Serif SC", serif',
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.5)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          {chars.map((item, index) => (
            <span 
              key={index} 
              style={{ 
                display: 'inline-block',
                animation: 'float-char 3s ease-in-out infinite',
                animationDelay: `${item.delay}s`
              }}
            >
              {item.char}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};

export default LoadingView;