import React, { useState, useEffect } from 'react';
import * as storageService from '../services/storageService';
import { getArchetypeImageUrl } from '../services/archetypeImageService';
import { StoredArchetype } from '../types';

interface MindAtlasProps {
  onBack: () => void;
}

// Fixed descriptions for each archetype
const ARCHETYPE_DESCRIPTIONS: { [key: string]: string } = {
  "The Self (自性)": "心灵的终极核心与完整性。超越小我，象征意识与潜意识的统一。",
  "The Shadow (阴影)": "被压抑的黑暗面。既包含不愿面对的弱点，也潜藏着巨大的生命力。",
  "The Anima (阿尼玛)": "男性内在的女性意象。掌管情感与直觉，是通往潜意识的向导。",
  "The Animus (阿尼姆斯)": "女性内在的男性意象。象征理性与行动力。积极时提供勇气，消极时则化为霸道权威。",
  "The Persona (人格面具)": "适应社会的外部角色。它保护内在，但若过度认同面具，便会迷失真实自我。",
  "The Hero (英雄)": "象征自我意识的觉醒。必须战胜潜意识的吞噬力量（恶龙），历经磨难，完成自我实现。",
  "The Wise Old Man (智慧老人)": "象征精神与古老智慧。在迷途时作为导师出现，但也可能化为僵化的教条。",
  "The Great Mother (大母神)": "生命的源头，兼具滋养与吞噬的双重性。象征对归属的渴望以及被淹没的恐惧。",
  "The Puer Aeternus (永恒少年)": "象征永恒青春与潜能。渴望飞翔、拒绝受限，充满灵性却难以在世俗中落地。",
  "The Trickster (捣蛋鬼)": "混乱与无序的化身。通过打破规则揭示真理，是促成改变与转机的催化剂。",
  "The Child (圣婴/儿童)": "象征新开端与无限潜能。它是过去的遗留，也是通往未来的桥梁，预示人格更新。",
  "The Father (父亲)": "象征权威、秩序与传统。代表外部世界的规则与保护，消极面则表现为压抑性的控制。",
};

const MindAtlas: React.FC<MindAtlasProps> = ({ onBack }) => {
  const [atlasData, setAtlasData] = useState<{ [key: string]: StoredArchetype }>({});
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

  useEffect(() => {
    setAtlasData(storageService.getMindAtlasData());
  }, []);

  const handleCardClick = (archetypeName: string) => {
    setFlippedCard(flippedCard === archetypeName ? null : archetypeName);
  };

  const formatArchetypeName = (name: string) => {
    // Splits "The Hero (英雄)" into "The Hero" and "(英雄)"
    const match = name.match(/^(.*?)\s*(\(.*\))$/);
    if (match) {
      return (
        <>
          <span style={{ display: 'block', lineHeight: '1.2' }}>{match[1]}</span>
          <span style={{ display: 'block', fontSize: '0.65em', marginTop: '6px', opacity: 0.9, fontWeight: 300 }}>{match[2]}</span>
        </>
      );
    }
    return name;
  };

  const hasData = Object.keys(atlasData).length > 0;

  return (
    <div className="section" style={{ display: 'block', paddingTop: '140px' }}>
      <header className="chat-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#0d1117' }}>
         <div style={{ flex: 1, textAlign: 'left' }}>
            <button onClick={onBack} style={{ 
              background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.9rem', padding: 0,
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
                <i className="fas fa-chevron-left"></i>
                <span>返回</span>
            </button>
        </div>
         <h2 style={{ 
          fontFamily: '"Noto Serif SC", serif', color: 'var(--active-glow)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 2, margin: 0, fontSize: '1.2rem'
        }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            stroke="none" 
            style={{ width: '1.2em', height: '1.2em' }}
          >
            <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
            <path d="M20 2 L22 4 L20 6 L18 4 Z"/>
            <circle cx="4" cy="20" r="2.2"/>
          </svg>
          <span>原型航志</span>
        </h2>
        <div style={{ flex: 1 }}></div>
      </header>
      
      <div className="container wide">
        {hasData ? (
          <div className="atlas-grid">
            {Object.values(atlasData).map((archetype: StoredArchetype) => {
              const imageUrl = getArchetypeImageUrl(archetype.name);
              const hasInsights = archetype.insights && archetype.insights.length > 0;
              const description = ARCHETYPE_DESCRIPTIONS[archetype.name] || "荣格心理学核心原型，象征人类集体潜意识中的普遍行为模式与心理结构。";
              
              return (
              <div 
                key={archetype.name} 
                className={`atlas-card ${flippedCard === archetype.name ? 'is-flipped' : ''}`}
                onClick={() => handleCardClick(archetype.name)}
              >
                <div className="atlas-card-inner">
                  <div className="atlas-card-front">
                    
                    {/* 
                       1. Background Image Layer
                       Absolute positioned, z-index 0.
                    */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 0
                    }} />

                    {/* 
                       2. Gradient Overlay Layer 
                       Bleeds slightly outside (-2px) to prevent any subpixel rendering gaps (the colored line).
                       
                       Gradient adjusted:
                       - 0%: Solid black (covers the bleeding edge artifacts)
                       - 30%: 60% opacity (reduced from 80% to be lighter)
                       - 55%: Fully transparent (ends sooner to reveal more image)
                    */}
                    <div style={{
                        position: 'absolute',
                        bottom: -2, left: -2, right: -2, 
                        height: '100%',
                        background: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0) 55%)',
                        zIndex: 1,
                        pointerEvents: 'none' 
                    }} />

                    {/* 3. Content Layer (z-index higher than overlay) */}
                    <div style={{ textAlign: 'center', width: '100%', position: 'relative', zIndex: 2 }}>
                      <h3 style={{ fontFamily: '"Noto Serif SC", serif', fontSize: '1.6rem', color: 'var(--active-glow)', margin: '0 0 12px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        {formatArchetypeName(archetype.name)}
                      </h3>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.95rem', 
                        color: 'rgba(255, 255, 255, 0.9)', 
                        fontFamily: '"Noto Serif SC", serif',
                        lineHeight: '1.5',
                        fontWeight: 300,
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                      }}>
                        {description}
                      </p>
                    </div>
                  </div>
                  <div className="atlas-card-back">
                    <h4 style={{ fontFamily: '"Noto Serif SC", serif', color: 'var(--active-glow)', marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '12px', width: '100%' }}>
                      {archetype.name} - 相关洞见
                    </h4>
                    <div style={{ width: '100%' }}>
                      {hasInsights ? (
                        // Reverse the array to show the latest insights first
                        [...archetype.insights].reverse().map((insight, idx) => (
                          <div key={insight.timestamp + idx} className="insight-item">
                             <span className="insight-date">{new Date(insight.timestamp).toLocaleDateString()}</span>
                             <p style={{ margin: 0 }}>{insight.text}</p>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--muted)', fontStyle: 'italic', marginTop: '20px' }}>
                            暂无具体洞察记录。继续探索以点亮此原型。
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              stroke="none" 
              style={{ width: '3.5rem', height: '3.5rem', marginBottom: '32px', opacity: 0.6, display: 'inline-block' }}
            >
              <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
              <path d="M20 2 L22 4 L20 6 L18 4 Z"/>
              <circle cx="4" cy="20" r="2.2"/>
            </svg>
            <h3 style={{ color: 'var(--text)', fontFamily: '"Noto Serif SC", serif', fontSize: '1.5rem', marginBottom: '24px' }}>心灵航海图尚未展开</h3>
            <div style={{ lineHeight: '1.8', fontSize: '0.95rem', color: 'var(--muted)', textAlign: 'left' }}>
              <p style={{ marginBottom: '16px' }}>
                荣格所说的“原型”（Archetypes），并非具体的形象，而是潜伏在人类集体无意识深处的古老引力场。它们如同深海中看不见的洋流与暗礁，时刻牵引着我们的爱恨与命运。
              </p>
              <p>
                这份航志旨在将这些无形的力量具象化。当你通过梦境或情绪投射，辨认出那些在暗中影响你的原型时，它们便从混沌中显形，被标记在这张海图之上。看见，即是驾驭的开始。
              </p>
              <p style={{ marginTop: '32px', color: 'var(--active-glow)', fontWeight: 300, borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '24px', textAlign: 'center' }}>
                若要展开航图，请前往 <span style={{ color: 'var(--projection-blue)' }}>情绪投射</span>、<span style={{ color: 'var(--mystic-gold)' }}>梦境解析</span> 或 <span style={{ color: 'var(--imagination-green)' }}>主动想象</span> 进行探索
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindAtlas;