import React, { useMemo } from 'react';
import { AppMode } from '../types';

interface LoadingViewProps {
  message: string;
  mode: AppMode;
}

const LoadingView: React.FC<LoadingViewProps> = ({ message, mode }) => {
  
  // Unified Palette: White Gold (Alchemy)
  // A pale, luminous gold-silver blend
  const C_WHITE_GOLD = '#F3EAD3'; 
  
  // Text animation logic (Main Message)
  const chars = useMemo(() => {
    return message.split('').map((char, index) => ({
      char: char === ' ' ? '\u00A0' : char,
      delay: index * 0.08, // Slightly slower wave propagation for main text
    }));
  }, [message]);

  // Subtitle animation logic (Wave Effect)
  const subtitle = "Constructing the Self";
  const subChars = useMemo(() => {
    return subtitle.split('').map((char, index) => ({
      char: char === ' ' ? '\u00A0' : char,
      delay: index * 0.03 + 0.5, // Start slightly later
    }));
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '400px',
      position: 'relative',
      width: '100%'
    }}>
      <style>
        {`
          /* Smooth Line Drawing */
          @keyframes mandala-draw-smooth {
            0% { stroke-dashoffset: 400; opacity: 0; }
            10% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 1; }
          }
          
          /* Organic Pop-in for dots */
          @keyframes dot-pop {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.4); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          /* Ray extension animation - appearing late */
          @keyframes ray-shoot-out {
            0% { stroke-dashoffset: 60; opacity: 0; }
            100% { stroke-dashoffset: 0; opacity: 0.6; }
          }

          /* Very slow rotation for the whole mandala */
          @keyframes mandala-spin-eternal {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Floating Wave + Breathe for Main Text */
          @keyframes text-wave-main {
            0%, 100% { 
                transform: translateY(0);
                opacity: 0.8; 
                text-shadow: 0 0 10px rgba(243, 234, 211, 0.3); 
            }
            50% { 
                transform: translateY(-5px);
                opacity: 1; 
                text-shadow: 0 0 35px rgba(243, 234, 211, 0.9); 
            }
          }
          
          /* Floating wave animation for subtitle */
          @keyframes float-char-sub {
            0%, 100% { transform: translateY(0); opacity: 0.5; }
            50% { transform: translateY(-4px); opacity: 0.9; }
          }

          /* SUPER INTENSE GLOW: Double drop-shadow for maximum bloom */
          @keyframes glow-pulse {
             0% { filter: drop-shadow(0 0 5px rgba(243, 234, 211, 0.5)) drop-shadow(0 0 10px rgba(243, 234, 211, 0.2)); }
             50% { filter: drop-shadow(0 0 20px rgba(243, 234, 211, 1)) drop-shadow(0 0 40px rgba(243, 234, 211, 0.6)); }
             100% { filter: drop-shadow(0 0 5px rgba(243, 234, 211, 0.5)) drop-shadow(0 0 10px rgba(243, 234, 211, 0.2)); }
          }

          /* Ambient background breathe */
          @keyframes ambient-breathe {
            0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.8); }
            50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.4); }
          }
        `}
      </style>
      
      {/* Ambient Glow Background Layer */}
      <div style={{
        position: 'absolute',
        top: '40%', 
        left: '50%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(243, 234, 211, 0.25) 0%, rgba(243, 234, 211, 0.05) 50%, rgba(243, 234, 211, 0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'ambient-breathe 4s ease-in-out infinite'
      }}></div>

      {/* Mandala Container - Reduced Margin Bottom to bring text up */}
      <div style={{
        position: 'relative',
        width: '260px', 
        height: '260px',
        marginBottom: '24px', 
        zIndex: 1
      }}>
         <svg 
            // Expanded viewBox to allow rays to go far outside
            viewBox="-60 -60 320 320" 
            style={{ 
                width: '100%', 
                height: '100%', 
                overflow: 'visible',
                animation: 'glow-pulse 3s ease-in-out infinite' 
            }}
         >
            {/* MAIN ROTATING GROUP */}
            <g style={{ transformOrigin: '100px 100px', animation: 'mandala-spin-eternal 60s linear infinite' }}>
                
                {/* LAYER 0: FINAL RAYS (Crown Effect - Shortened) */}
                {/* Placing them here ensures they are behind everything else */}
                <g>
                    {/* 1. Primary Rays (8) - Shortened to r=125 */}
                    {[...Array(8)].map((_, i) => (
                        <line 
                            key={`final-ray-${i}`}
                            x1="100" y1="-5"   // r=105 (Start outside petals)
                            x2="100" y2="-25"  // r=125 (End point, was -35)
                            stroke={C_WHITE_GOLD}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            transform={`rotate(${i * 45} 100 100)`}
                            style={{
                                strokeDasharray: 60,
                                strokeDashoffset: 60,
                                animation: 'ray-shoot-out 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards',
                                animationDelay: `${9.5 + i * 0.1}s`, // Late appearance
                                opacity: 0
                            }}
                        />
                    ))}

                    {/* 2. Intermediate Rays (8) - Even Shorter (r=114) */}
                    {[...Array(8)].map((_, i) => (
                        <line 
                            key={`final-ray-mid-${i}`}
                            x1="100" y1="-5"   // r=105
                            x2="100" y2="-14"  // r=114 (Shorter than primary, was -20)
                            stroke={C_WHITE_GOLD}
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            transform={`rotate(${i * 45 + 22.5} 100 100)`} // Offset by 22.5 degrees
                            style={{
                                strokeDasharray: 60,
                                strokeDashoffset: 60,
                                animation: 'ray-shoot-out 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards',
                                animationDelay: `${9.5 + i * 0.1}s`, // Same timing sequence
                                opacity: 0
                            }}
                        />
                    ))}
                </g>

                {/* LAYER 1: 8 OUTER PETALS - Outline Only */}
                {[...Array(8)].map((_, i) => (
                    <g key={`petal-${i}`} transform={`rotate(${i * 45} 100 100)`}>
                        {/* 1.1 Outline */}
                        <path 
                            d="M100,58 C85,55 70,40 75,20 C80,5 95,5 100,5 C105,5 120,5 125,20 C130,40 115,55 100,58"
                            fill="none" 
                            stroke={C_WHITE_GOLD} 
                            strokeWidth="1"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: 400,
                                strokeDashoffset: 400,
                                animation: 'mandala-draw-smooth 10s ease-out forwards', 
                                animationDelay: `${i * 0.2}s`
                            }}
                        />
                        
                        {/* 1.2 Inner Detail - MANDORLA */}
                        {/* Left Arc */}
                        <path 
                            d="M100,50 Q88,32 100,15"
                            fill="none"
                            stroke={C_WHITE_GOLD}
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: 60,
                                strokeDashoffset: 60,
                                animation: 'mandala-draw-smooth 8s ease-out forwards', 
                                animationDelay: `${2 + i * 0.15}s`
                            }}
                        />
                        {/* Right Arc */}
                         <path 
                            d="M100,50 Q112,32 100,15"
                            fill="none"
                            stroke={C_WHITE_GOLD}
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: 60,
                                strokeDashoffset: 60,
                                animation: 'mandala-draw-smooth 8s ease-out forwards', 
                                animationDelay: `${2.2 + i * 0.15}s`
                            }}
                        />
                        {/* Central Axis / Pupil */}
                        <path 
                            d="M100,42 L100,23"
                            fill="none"
                            stroke={C_WHITE_GOLD}
                            strokeWidth="0.6"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: 20,
                                strokeDashoffset: 20,
                                animation: 'mandala-draw-smooth 8s ease-out forwards',
                                animationDelay: `${2.5 + i * 0.15}s`
                            }}
                        />
                    </g>
                ))}

                {/* LAYER 2: INNER RING (Beads) */}
                {/* Background Ring Line */}
                <circle 
                    cx="100" cy="100" r="40" 
                    fill="none" 
                    stroke={C_WHITE_GOLD} 
                    strokeWidth="0.5" 
                    strokeDasharray="2 4"
                    opacity="0.5"
                    style={{
                        transformOrigin: '100px 100px',
                        animation: 'mandala-spin-eternal 30s linear infinite reverse'
                    }}
                />
                
                {/* 16 Dots/Beads */}
                {[...Array(16)].map((_, i) => (
                     <g key={`bead-group-${i}`} transform={`rotate(${i * 22.5} 100 100)`}>
                        <circle 
                            cx="100" cy="62" 
                            r={i % 2 === 0 ? "2.5" : "1.5"}
                            fill={C_WHITE_GOLD}
                            stroke="none"
                            style={{
                                transformBox: 'fill-box',
                                transformOrigin: 'center',
                                animation: 'dot-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                                opacity: 0,
                                animationDelay: `${4 + i * 0.15}s`
                            }}
                        />
                     </g>
                ))}

                {/* LAYER 3: CORE BOUNDARY */}
                <circle 
                    cx="100" cy="100" r="32" 
                    fill="none"
                    stroke={C_WHITE_GOLD}
                    strokeWidth="0.5"
                    style={{
                         strokeDasharray: 200,
                         strokeDashoffset: 200,
                         animation: 'mandala-draw-smooth 5s ease-out forwards',
                         animationDelay: '1s',
                         transformOrigin: '100px 100px',
                         transform: 'rotate(-90deg)'
                    }}
                />

                {/* LAYER 4: ORGANIC STONES (Inner texture) */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                     <g key={`stone-${i}`} transform={`rotate(${deg + 22.5} 100 100)`}>
                         <path 
                            d="M100,78 Q95,78 95,82 Q95,86 100,86 Q105,86 105,82 Q105,78 100,78"
                            fill="none"
                            stroke={C_WHITE_GOLD}
                            strokeWidth="0.5"
                            style={{
                                strokeDasharray: 20,
                                strokeDashoffset: 20,
                                animation: 'mandala-draw-smooth 3s ease-out forwards',
                                animationDelay: `${5 + i * 0.1}s`,
                                opacity: 0.6
                            }}
                         />
                     </g>
                ))}

                {/* LAYER 5: CENTER RADIANCE (Lines) */}
                <g style={{ 
                    transformOrigin: '100px 100px', 
                }}>
                    {/* Radiating Lines */}
                    {[...Array(8)].map((_, i) => (
                        <path 
                            key={`radiance-${i}`}
                            d="M100,100 L100,75" 
                            stroke={C_WHITE_GOLD}
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            transform={`rotate(${i * 45} 100 100)`} 
                            style={{
                                strokeDasharray: 30,
                                strokeDashoffset: 30,
                                animation: 'mandala-draw-smooth 4s ease-out forwards',
                                animationDelay: `${7 + i * 0.1}s`
                            }}
                        />
                    ))}
                    
                    {/* Central Core Light - Added Intense Glow Circle */}
                    <circle 
                        cx="100" cy="100" r="6" 
                        fill={C_WHITE_GOLD} 
                        fillOpacity="0.5"
                         style={{
                            transformBox: 'fill-box',
                            transformOrigin: 'center',
                            animation: 'dot-pop 2s ease-out infinite alternate',
                            animationDelay: '8s',
                            filter: 'blur(2px)'
                        }}
                    />
                    
                    {/* Central Core Dot */}
                    <circle 
                        cx="100" cy="100" r="3.5" 
                        fill={C_WHITE_GOLD} 
                        style={{
                            transformBox: 'fill-box',
                            transformOrigin: 'center',
                            animation: 'dot-pop 1s ease-out forwards',
                            opacity: 0,
                            animationDelay: '9s'
                        }}
                    />
                </g>

            </g>
         </svg>
      </div>

      {/* Message Text */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <h3 style={{
          fontFamily: '"Noto Serif SC", serif',
          fontSize: '1.0rem', // Reduced font size
          color: C_WHITE_GOLD, 
          margin: '0 0 8px 0', // Reduced margin
          letterSpacing: '3px',
          fontWeight: 300,
          textShadow: '0 0 20px rgba(243, 234, 211, 0.8)'
        }}>
          {chars.map((item, index) => (
            <span 
              key={index} 
              style={{ 
                display: 'inline-block',
                // Updated to new combined wave animation
                animation: 'text-wave-main 4s ease-in-out infinite',
                animationDelay: `${item.delay}s`
              }}
            >
              {item.char}
            </span>
          ))}
        </h3>
        <p style={{
            fontFamily: '"Cinzel", serif',
            fontSize: '0.65rem', // Reduced font size
            color: '#8b9bb4',
            margin: 0,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            opacity: 0.5
        }}>
           {/* Animated Subtitle */}
           {subChars.map((item, index) => (
            <span 
              key={index} 
              style={{ 
                display: 'inline-block',
                animation: 'float-char-sub 4s ease-in-out infinite',
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
