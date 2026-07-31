import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function LivreurAIChatbotWidget() {
  const { isLivreur } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Only show for ROLE_LIVREUR
  if (!isLivreur) return null;

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: '👋 **Bonjour livreur !**\n\nJe suis votre **Assistant IA Terrain**. Donnez-moi un code colis (ex: `CMD-900021`) pour voir ses détails, ou posez-moi une question sur votre tournée du jour.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quick_actions: [
            { label: '📦 Ma tournée du jour' },
            { label: '🔍 Chercher un colis' },
          ]
        }
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || loading) return;
    if (!customText) setInputMessage('');

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/ai/livreur-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: textToSend }),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: data.reply || data.message || "Je n'ai pas pu traiter votre demande.",
            quick_actions: data.quick_actions || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error('API error');
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: "⚠️ Impossible de joindre l'assistant IA. Vérifiez votre connexion et réessayez.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text) =>
    text.split('\n').map((line, i) => (
      <p key={i} style={{ margin: i > 0 ? '3px 0 0 0' : 0 }}>
        {line.includes('**')
          ? line.split('**').map((chunk, j) =>
              j % 2 === 1 ? <strong key={j}>{chunk}</strong> : chunk
            )
          : line}
      </p>
    ));

  return (
    <div
      id="livreur-ai-chatbot-container"
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
    >
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          id="btn-open-livreur-ai"
          onClick={() => setIsOpen(true)}
          title="Assistant IA Livreur"
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--primary)', color: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: '2px solid rgba(255,255,255,0.2)',
            outline: 'none', position: 'relative', transition: 'transform 0.2s ease'
          }}
        >
          {/* Live pulse dot */}
          <span style={{ position: 'absolute', top: '2px', right: '2px', display: 'flex', width: '11px', height: '11px' }}>
            <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.6, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid var(--card)' }} />
          </span>
          {/* Truck icon */}
          <i className="ki-filled ki-delivery" style={{ fontSize: '22px' }} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="kt-card"
          style={{
            width: '380px', maxWidth: '92vw', height: '520px',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)', borderRadius: '16px'
          }}
        >
          {/* Header */}
          <div className="kt-card-header" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--primary)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0
              }}>
                <i className="ki-filled ki-delivery" style={{ fontSize: '18px', color: '#fff' }} />
              </div>
              <div>
                <div className="kt-card-title" style={{ fontSize: '14px', margin: 0 }}>
                  Assistant IA
                  <span className="kt-badge kt-badge-success kt-badge-outline ms-2" style={{ fontSize: '9px', padding: '1px 6px' }}>Terrain</span>
                </div>
                <p className="text-secondary-foreground" style={{ fontSize: '11px', margin: 0 }}>Votre copilote de tournée</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
              <button
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                onClick={() => setMessages([])}
                title="Réinitialiser"
              >
                <i className="ki-filled ki-arrows-loop" style={{ fontSize: '14px' }} />
              </button>
              <button
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                onClick={() => setIsOpen(false)}
                title="Fermer"
              >
                <i className="ki-filled ki-cross" style={{ fontSize: '16px' }} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flexGrow: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            backgroundColor: 'var(--background)'
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: '3px' }}
              >
                <div className="text-secondary-foreground" style={{ fontSize: '11px' }}>
                  {msg.sender === 'user' ? 'Vous' : 'Assistant IA'} • {msg.timestamp}
                </div>
                <div
                  style={{
                    maxWidth: '90%', padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    fontSize: '13px', lineHeight: '1.55',
                    backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--card)',
                    color: msg.sender === 'user' ? '#fff' : 'var(--foreground)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}
                >
                  {renderText(msg.text)}

                  {/* Quick action chips */}
                  {msg.quick_actions && msg.quick_actions.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {msg.quick_actions.map((act, i) => (
                        <button
                          key={i}
                          className="kt-btn kt-btn-sm kt-btn-outline"
                          onClick={() => handleSendMessage(act.label)}
                          style={{ fontSize: '11px' }}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }} className="text-secondary-foreground">
                <i className="ki-filled ki-technology-4 text-primary" style={{ fontSize: '14px' }} />
                <span>L'IA traite votre demande...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px', borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--card)', display: 'flex', alignItems: 'center',
            gap: '8px', flexShrink: 0
          }}>
            <label className="kt-input" style={{ flexGrow: 1, borderRadius: '9999px' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Ex: CMD-900021 ou ma tournée..."
                style={{ fontSize: '13px' }}
              />
            </label>
            <button
              className="kt-btn kt-btn-primary kt-btn-icon"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              style={{ borderRadius: '50%', width: '36px', height: '36px', flexShrink: 0 }}
            >
              <i className="ki-filled ki-send" style={{ fontSize: '14px' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
