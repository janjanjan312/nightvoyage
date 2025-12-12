import React, { useState, useEffect, useRef } from 'react';
import { startImaginationSession, sendImaginationMessage } from '../services/geminiService';
import { ChatMessage, AppMode } from '../types';

interface ActiveImaginationProps {
  onEndSession: (history: ChatMessage[]) => void;
  onBack: () => void;
}

// Helper to render bold text from markdown-style **text**
const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} style={{ color: 'var(--mystic-gold)' }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

// Typewriter Component for smooth text revealing (Fixed logic using slice)
const TypewriterText: React.FC<{ text: string; onComplete?: () => void }> = ({ text, onComplete }) => {
  const [displayLength, setDisplayLength] = useState(0);

  useEffect(() => {
    let currentLength = 0;
    const totalLength = text.length;
    const speed = 25; // ms per char

    const timer = setInterval(() => {
      if (currentLength < totalLength) {
        currentLength++;
        setDisplayLength(currentLength);
      } else {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text]);

  return <>{renderFormattedText(text.slice(0, displayLength))}</>;
};

const ActiveImagination: React.FC<ActiveImaginationProps> = ({ onEndSession, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const turnCount = Math.floor(messages.length / 2);
  const MIN_RECOMMENDED_TURNS = 6;
  const IDEAL_MAX_TURNS = 10;
  
  const progressPercent = Math.min((turnCount / IDEAL_MAX_TURNS) * 100, 100);
  const isDepthSufficient = turnCount >= MIN_RECOMMENDED_TURNS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const initialText = await startImaginationSession();
        setMessages([{ role: 'model', type: 'TEXT', text: initialText }]);
      } catch (e) {
        console.error(e);
        setMessages([{ role: 'model', type: 'TEXT', text: '开启想象时遇到阻碍，请返回重试。'}])
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', type: 'TEXT', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const responseText = await sendImaginationMessage(inputText);
      setMessages(prev => [...prev, { role: 'model', type: 'TEXT', text: responseText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', type: 'TEXT', text: '引导者暂时失联，请稍后重试或结束本次想象。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-section">
      <header className="chat-header" style={{ borderBottom: 'none' }}>
        <div style={{ flex: 1, textAlign: 'left' }}>
            <button onClick={onBack} style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer', 
              fontSize: '0.9rem',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
                <i className="fas fa-chevron-left"></i>
                <span>返回</span>
            </button>
        </div>
        <h2 style={{ 
            fontFamily: '"Noto Serif SC", serif', 
            color: 'var(--text)', 
            flex: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            margin: 0,
            fontSize: '1.1rem'
        }}>
            <i className="fas fa-feather-alt"></i>
            <span>主动想象</span>
        </h2>
        <div style={{flex: 1, textAlign: 'right'}}>
            <button 
                onClick={() => onEndSession(messages)}
                style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: `1px solid ${isDepthSufficient ? 'var(--mystic-gold)' : 'rgba(255,255,255,0.2)'}`,
                    background: isDepthSufficient ? 'var(--mystic-gold)' : 'rgba(255,255,255,0.1)',
                    color: isDepthSufficient ? '#0c0f14' : 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.3s, color 0.3s, border-color 0.3s'
                }}
            >
                结束并解析
            </button>
        </div>
      </header>
      
      <div style={{ 
        padding: '0 24px 12px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div className="depth-meter" style={{flex: 1}}>
            <div className="depth-meter-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <span style={{
          color: 'var(--muted)',
          fontSize: '0.9rem',
          fontVariantNumeric: 'tabular-nums',
          minWidth: '45px',
          textAlign: 'right'
        }}>
          {turnCount} / {IDEAL_MAX_TURNS}
        </span>
      </div>
      
      <div className="chat-log">
         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`bubble ${msg.role === 'user' ? 'user-bubble' : 'model-bubble'}`}>
                {msg.role === 'user' ? (
                  renderFormattedText(msg.text)
                ) : (
                  <TypewriterText text={msg.text} onComplete={scrollToBottom} />
                )}
              </div>
            ))}
            {isLoading && (
              <div className="bubble model-bubble">
                 <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--muted)', borderRadius: '50%', animation: 'dotUp 1s ease-in-out infinite' }}></span>
                    <span style={{ width: '8px', height: '8px', background: 'var(--muted)', borderRadius: '50%', animation: 'dotUp 1s ease-in-out infinite .15s' }}></span>
                    <span style={{ width: '8px', height: '8px', background: 'var(--muted)', borderRadius: '50%', animation: 'dotUp 1s ease-in-out infinite .3s' }}></span>
                </div>
              </div>
            )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <footer className="chat-input-area">
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "请等待引导..." : "描述你看到的，或回答引导者..."}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ActiveImagination;