import React, { useState, useEffect } from 'react';

interface LibraryProps {
  onBack: () => void;
}

interface Article {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  readTime: string;
  color: string; // Used for category tags/accents
  imageUrl: string; // Cover image
  content: React.ReactNode;
}

const ARTICLES: Article[] = [
  {
    id: 'individuation',
    title: '成为你自己：个体化之路',
    subtitle: 'The Process of Individuation',
    category: '核心概念',
    readTime: '5 min',
    color: 'var(--mystic-gold)',
    imageUrl: 'https://images.unsplash.com/photo-1702588209582-1e9255f74f6d?q=80&w=1011&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    content: (
      <>
        <p>荣格心理学的核心目标是“个体化”（Individuation）。这不是通常意义上的“个人主义”，而是一个整合的过程——将意识与无意识、光明与阴影、理性与感性统合为一个完整的“自性”（Self）。</p>
        <p>在这个过程中，我们首先要剥离“人格面具”（Persona），即我们在社会中扮演的角色；接着要面对“阴影”（Shadow），那些被我们压抑的、不被认可的特质；随后我们要与内在的异性意象“阿尼玛/阿尼姆斯”（Anima/Animus）建立连接。</p>
        <p>正如炼金术将贱金属转化为黄金，个体化是将分裂的心灵碎片熔炼为完整人格的终极旅程。</p>
      </>
    )
  },
  {
    id: 'shadow',
    title: '与其做好人，不如做完整的人',
    subtitle: 'Meeting the Shadow',
    category: '阴影工作',
    readTime: '4 min',
    color: 'var(--projection-blue)',
    imageUrl: 'https://images.unsplash.com/photo-1702628909173-96b23bee3f49?q=80&w=1997&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    content: (
      <>
        <p>“阴影”是指那些我们不愿承认、试图隐藏或投射给他人的特质。它不仅包含邪恶与破坏力，也蕴藏着巨大的生命力、创造力和本能智慧。</p>
        <p>当我们否认阴影时，它会在无意识中操控我们，导致情绪失控或对他人的莫名敌意（投射）。荣格曾说：“在这个世界上，如果在这个人身上看不到自己的影子，那他就永远无法真正了解这个人。”</p>
        <p>接纳阴影并不意味着放纵恶行，而是承认这些冲动的存在，并将其转化为有意识的建设性力量。</p>
      </>
    )
  },
  {
    id: 'synchronicity',
    title: '共时性：有意义的巧合',
    subtitle: 'Synchronicity',
    category: '现象学',
    readTime: '3 min',
    color: '#D4AF37', // Alchemy Gold
    imageUrl: 'https://images.unsplash.com/photo-1702591539493-e8baaab87f66?q=80&w=1488&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    content: (
      <>
        <p>你是否有过这样的经历：刚想到一个很久没见的朋友，他就打来了电话？或者在困惑时，偶然翻开书，正好看到解答困惑的句子？</p>
        <p>荣格将这种内心状态与外部事件非因果性的连接称为“共时性”。他认为，物质与心灵并非截然二分，在更深层的“大一统世界”（Unus Mundus）中，它们是相互关联的。</p>
        <p>共时性事件往往发生在情感强烈或人生转折的时刻，它们像是宇宙眨了一下眼睛，暗示着生命背后隐藏的秩序与意义。</p>
      </>
    )
  },
  {
    id: 'active_imagination',
    title: '主动想象：与无意识对话',
    subtitle: 'Active Imagination',
    category: '技术',
    readTime: '6 min',
    color: 'var(--imagination-green)',
    imageUrl: 'https://images.unsplash.com/photo-1702628907317-a99a7eed04d9?q=80&w=963&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    content: (
      <>
        <p>梦是无意识的独白，而“主动想象”则是意识与无意识的对话。这是荣格在《红书》时期发展出的关键技术。</p>
        <p>它要求我们在清醒状态下，放松意识的控制，让内心的意象自由浮现。不同于被动的幻想，我们需要像对待真实人物一样与这些意象（如智者、动物、阴影人物）互动、交谈甚至争论。</p>
        <p>通过这种对话，原本对立的心理能量得以流动，意识的态度得以扩展，新的生命可能性随之诞生。</p>
      </>
    )
  }
];

// Global cache to track loaded images across unmounts/remounts
const loadedImagesCache = new Set<string>();

// Preload function exposed for App.tsx
export const preloadLibraryImages = () => {
  ARTICLES.forEach((article) => {
    if (!loadedImagesCache.has(article.imageUrl)) {
        const img = new Image();
        img.src = article.imageUrl;
        img.onload = () => loadedImagesCache.add(article.imageUrl);
        img.onerror = () => loadedImagesCache.add(article.imageUrl);
    }
  });
};

// Extracted Card Component to handle Image Loading State individually
const LibraryCard: React.FC<{
  article: Article;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ article, isExpanded, onToggle }) => {
  // Check cache for initial state to avoid re-animating on second visit
  const [isImageLoaded, setIsImageLoaded] = useState(loadedImagesCache.has(article.imageUrl));

  useEffect(() => {
    if (!isImageLoaded) {
        const img = new Image();
        img.src = article.imageUrl;
        img.onload = () => {
            loadedImagesCache.add(article.imageUrl);
            setIsImageLoaded(true);
        };
        img.onerror = () => {
            loadedImagesCache.add(article.imageUrl);
            setIsImageLoaded(true);
        };
    }
  }, [article.imageUrl, isImageLoaded]);

  return (
    <div 
      onClick={onToggle}
      style={{
        background: 'rgba(21, 25, 34, 0.6)',
        border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isExpanded ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 1. Image Area */}
      <div style={{
          width: '100%',
          height: '180px',
          backgroundColor: '#1a1e26', // Dark neutral placeholder instead of bright color
          position: 'relative',
          overflow: 'hidden'
      }}>
           {/* The Image - Absolute with Fade Transition */}
           <div style={{
               position: 'absolute',
               top: 0, left: 0, right: 0, bottom: 0,
               backgroundImage: `url(${article.imageUrl})`,
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               opacity: isImageLoaded ? 1 : 0,
               transition: 'opacity 0.7s ease-in-out',
               transform: isExpanded ? 'scale(1.05)' : 'scale(1)',
               transitionProperty: 'opacity, transform',
               transitionDuration: '0.7s, 0.5s'
           }} />
           
           {/* Overlay gradient for depth - Always visible */}
           <div style={{
               position: 'absolute',
               bottom: 0, left: 0, right: 0,
               height: '100%',
               background: 'linear-gradient(to top, rgba(21, 25, 34, 0.9) 0%, transparent 60%)',
               zIndex: 2,
               pointerEvents: 'none'
           }} />
      </div>

      {/* 2. Content Area */}
      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Metadata Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px', 
                  color: article.color,
                  border: `1px solid ${article.color}`,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  opacity: 0.9
              }}>
                  {article.category}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {article.readTime} 阅读
              </span>
          </div>

          <h3 style={{ 
              fontFamily: '"Noto Serif SC", serif', 
              fontSize: '1.4rem', 
              margin: '0 0 8px 0', 
              color: 'var(--text)',
              lineHeight: '1.3'
          }}>
              {article.title}
          </h3>
          
          <h4 style={{ 
              fontFamily: '"Inter", sans-serif',
              fontSize: '0.85rem',
              fontWeight: 400,
              color: 'var(--muted)',
              margin: '0 0 16px 0',
              opacity: 0.8,
              lineHeight: '1.4'
          }}>
              {article.subtitle}
          </h4>

          {/* Expanded Content */}
          <div style={{ 
              maxHeight: isExpanded ? '1500px' : '0', 
              opacity: isExpanded ? 1 : 0,
              overflow: 'hidden',
              transition: 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: '1.8',
              fontSize: '0.95rem',
              fontFamily: '"Noto Serif SC", serif'
          }}>
              <div style={{ 
                  paddingTop: '20px', 
                  marginTop: '4px',
                  borderTop: '1px solid rgba(255,255,255,0.1)' 
              }}>
                  {article.content}
              </div>
          </div>

          {/* Read More / Collapse Toggle */}
          <div style={{ marginTop: 'auto', paddingTop: isExpanded ? '20px' : '12px' }}>
              {!isExpanded ? (
                  <div style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--text)', 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '8px',
                      opacity: 0.8,
                      fontWeight: 500
                  }}>
                      <span>阅读全文</span>
                      <i className="fas fa-arrow-right" style={{ fontSize: '0.8rem' }}></i>
                  </div>
              ) : (
                  <div style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--muted)', 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '8px',
                      opacity: 0.6,
                      justifyContent: 'center'
                  }}>
                      <i className="fas fa-chevron-up" style={{ fontSize: '0.8rem' }}></i>
                      <span>收起</span>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

const Library: React.FC<LibraryProps> = ({ onBack }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleArticle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="section" style={{ display: 'block', paddingTop: '100px', minHeight: '100vh', background: '#0c0f14' }}>
      
      {/* Header */}
      <header className="chat-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'rgba(12, 15, 20, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 50 }}>
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
          fontFamily: '"Noto Serif SC", serif', color: 'var(--text)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 2, margin: 0, fontSize: '1.2rem'
        }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            stroke="none" 
            style={{ width: '1.2em', height: '1.2em' }}
          >
            <path d="M2 6l6-2v14l-6 2V6z M9 4l6 2v14l-6-2V4z M16 6l6-2v14l-6 2V6z" />
          </svg>
          <span>心理文库</span>
        </h2>
        <div style={{ flex: 1 }}></div>
      </header>
      
      {/* Content */}
      <div className="container wide" style={{ margin: '20px auto 0', paddingBottom: '60px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: '"Noto Serif SC", serif', fontSize: '2rem', marginBottom: '16px', color: 'var(--text)' }}>
            心灵的炼金术
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto' }}>
            在这里，我们整理了一些荣格心理学的核心概念。这些文章旨在为你提供一张简略的地图，助你在无意识的夜航中辨识方向。
          </p>
        </div>

        {/* Grid Layout for Vertical Cards */}
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '24px',
            alignItems: 'start'
        }}>
          {ARTICLES.map((article) => (
            <LibraryCard 
                key={article.id}
                article={article}
                isExpanded={expandedId === article.id}
                onToggle={() => toggleArticle(article.id)}
            />
          ))}
        </div>

        <div style={{ marginTop: '80px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', opacity: 0.6 }}>
          <p>“只有当你看向内心时，你的视线才会清晰。”<br/>—— C.G. Jung</p>
        </div>
      </div>
    </div>
  );
};

export default Library;