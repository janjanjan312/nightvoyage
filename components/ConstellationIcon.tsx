import React from 'react';

interface ConstellationIconProps {
  viewBox: string;
  color: string;
  stars: { cx: number; cy: number; r: number; opacity?: number }[];
  lines: string[];
}

const ConstellationIcon: React.FC<ConstellationIconProps> = ({ viewBox, color, stars, lines }) => {
  return (
    <svg viewBox={viewBox} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <g>
        {lines.map((d, i) => (
          <path 
            key={i} 
            d={d} 
            stroke={color} 
            strokeWidth="1.5" 
            fill="none" 
            strokeLinecap="round" 
            fillRule="evenodd"
            className="draw-path" 
          />
        ))}
      </g>
      <g>
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
  );
};

export default ConstellationIcon;