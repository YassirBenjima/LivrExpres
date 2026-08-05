import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

/* ─── helpers ─────────────────────────────────────────────────── */
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

const mapsUrl = (address, city) => {
  const q = [address, city].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};

const WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'ai',
  text: '👋 **Bonjour livreur !**\n\nJe suis votre **Assistant IA Terrain**. Lancez votre tournée ou cherchez un colis par son code (ex: `CMD-900021`).',
  quick_actions: [
    { label: '📦 Ma tournée du jour' },
    { label: '🔍 Chercher un colis' },
  ]
};

/* ─── component ────────────────────────────────────────────────── */
export default function LivreurAIChatbotWidget() {
  const { isLivreur } = useAuth();

  const [isOpen, setIsOpen]           = useState(false);
  const [messages, setMessages]       = useState([WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading]         = useState(false);

  // Tour state
  const [tourStops, setTourStops]     = useState([]);     // full route list
  const [tourIndex, setTourIndex]     = useState(0);      // current stop index
  const [tourMode, setTourMode]       = useState(false);  // are we in tour mode?

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Close AI chatbot panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const container = document.getElementById('livreur-ai-container');
      if (container && !container.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  /* ── fetch tour from backend ── */
  const loadTour = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/ai/route-optimizer', {
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        const stops = data.stops || [];
        if (stops.length === 0) {
          addAiMsg('📭 Aucun colis à livrer pour le moment. Votre tournée est vide !', []);
        } else {
          setTourStops(stops);
          setTourIndex(0);
          setTourMode(true);
          addAiMsg(
            `🗺️ **Tournée chargée !** ${stops.length} arrêt${stops.length > 1 ? 's' : ''} optimisés par l'IA.\n\nPassons au premier arrêt ⬇️`,
            []
          );
          // slight delay before showing first stop card
          setTimeout(() => showStop(stops, 0), 400);
        }
      } else {
        throw new Error();
      }
    } catch {
      addAiMsg('⚠️ Impossible de charger la tournée. Vérifiez votre connexion.', []);
    } finally {
      setLoading(false);
    }
  };

  /* ── add an AI message to chat ── */
  const addAiMsg = (text, quick_actions = []) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender: 'ai',
      text,
      quick_actions,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  /* ── render a stop card ── */
  const showStop = (stops, idx) => {
    const stop = stops[idx];
    if (!stop) return;
    setMessages(prev => [...prev, {
      id: `stop-${idx}-${Date.now()}`,
      sender: 'ai',
      text: `📍 **Arrêt ${stop.stop_number} / ${stops.length}** — ${stop.priority === 'HAUTE' ? '🔴 Priorité haute' : '🟡 Priorité normale'}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stopCard: stop,
      stopIdx: idx,
      totalStops: stops.length
    }]);
  };

  /* ── update colis status in DB ── */
  const updateColisStatus = async (trackingCode, etat, statut) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/admin/ai-assistant/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ trackingCode, etat, statut }),
        credentials: 'include'
      });
    } catch { /* silent */ }
  };

  /* ── action: mark delivered ── */
  const handleLivre = async (stop, idx) => {
    setLoading(true);
    await updateColisStatus(stop.tracking_code, 'Livré', 'Terminé');
    setLoading(false);
    addAiMsg(`✅ **${stop.tracking_code}** marqué comme **Livré / Terminé** !\n\nCRBT encaissé : **${stop.crbt_amount} DH**`, []);
    advanceOrFinish(idx);
  };

  /* ── action: annuler (retourné) ── */
  const handleAnnule = async (stop, idx) => {
    setLoading(true);
    await updateColisStatus(stop.tracking_code, 'Retourné', 'Reporté');
    setLoading(false);
    addAiMsg(`↩️ **${stop.tracking_code}** marqué comme **Retourné / Reporté**.\n\nColis non récupéré ou livraison échouée.`, []);
    advanceOrFinish(idx);
  };

  /* ── go to next stop ── */
  const advanceOrFinish = (currentIdx) => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < tourStops.length) {
      setTourIndex(nextIdx);
      setTimeout(() => {
        addAiMsg(`➡️ Passage à l'arrêt suivant...`, []);
        setTimeout(() => showStop(tourStops, nextIdx), 300);
      }, 600);
    } else {
      setTourMode(false);
      addAiMsg('🎉 **Tournée terminée !**\n\nBravo, vous avez traité tous les arrêts de votre journée.', []);
    }
  };

  /* ── generic chatbot call ── */
  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || loading) return;
    if (!customText) setInputMessage('');

    // intercept special actions
    if (textToSend === '📦 Ma tournée du jour' || textToSend.toLowerCase().includes('tournée') || textToSend.toLowerCase().includes('tournee')) {
      setMessages(prev => [...prev, {
        id: Date.now(), sender: 'user', text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      await loadTour();
      return;
    }

    setMessages(prev => [...prev, {
      id: Date.now(), sender: 'user', text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
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
        addAiMsg(data.reply || data.message || "Je n'ai pas pu traiter votre demande.", data.quick_actions || []);
      } else throw new Error();
    } catch {
      addAiMsg("⚠️ Impossible de joindre l'assistant IA.", []);
    } finally {
      setLoading(false);
    }
  };

  /* ─── RENDER ─────────────────────────────────────────────────── */
  if (!isLivreur) return null;

  return (
    <div
      id="livreur-ai-chatbot-container"
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
    >
      {/* FAB */}
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
          <span style={{ position: 'absolute', top: '2px', right: '2px', display: 'flex', width: '11px', height: '11px' }}>
            <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.6, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid var(--card)' }} />
          </span>
          <i className="ki-filled ki-delivery" style={{ fontSize: '22px' }} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="kt-card"
          style={{
            width: '400px', maxWidth: '94vw', height: '580px',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', borderRadius: '16px'
          }}
        >
          {/* Header */}
          <div className="kt-card-header" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <i className="ki-filled ki-delivery" style={{ fontSize: '18px', color: '#fff' }} />
              </div>
              <div>
                <div className="kt-card-title" style={{ fontSize: '14px', margin: 0 }}>
                  Assistant IA
                  <span className="kt-badge kt-badge-success kt-badge-outline ms-2" style={{ fontSize: '9px', padding: '1px 6px' }}>Terrain</span>
                </div>
                <p className="text-secondary-foreground" style={{ fontSize: '11px', margin: 0 }}>
                  {tourMode ? `Tournée en cours — Arrêt ${tourIndex + 1} / ${tourStops.length}` : 'Votre copilote de tournée'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
              <button
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                onClick={() => { setMessages([WELCOME_MESSAGE]); setTourMode(false); setTourStops([]); setTourIndex(0); }}
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

          {/* Tour progress bar */}
          {tourMode && tourStops.length > 0 && (
            <div style={{ padding: '6px 16px', background: 'var(--accent)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }} className="text-secondary-foreground">
                <span>Progression tournée</span>
                <span>{tourIndex}/{tourStops.length} arrêts</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '9999px', background: 'var(--primary)',
                  width: `${(tourIndex / tourStops.length) * 100}%`,
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{
            flexGrow: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            backgroundColor: 'var(--background)'
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: '3px' }}>
                {msg.timestamp && (
                  <div className="text-secondary-foreground" style={{ fontSize: '11px' }}>
                    {msg.sender === 'user' ? 'Vous' : 'Assistant IA'} • {msg.timestamp}
                  </div>
                )}

                {/* Stop card */}
                {msg.stopCard ? (
                  <StopCard
                    stop={msg.stopCard}
                    idx={msg.stopIdx}
                    total={msg.totalStops}
                    onLivre={() => handleLivre(msg.stopCard, msg.stopIdx)}
                    onAnnule={() => handleAnnule(msg.stopCard, msg.stopIdx)}
                    onNext={() => advanceOrFinish(msg.stopIdx)}
                    loading={loading}
                  />
                ) : (
                  <div
                    style={{
                      maxWidth: '92%', padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                      fontSize: '13px', lineHeight: '1.55',
                      backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--card)',
                      color: msg.sender === 'user' ? '#fff' : 'var(--foreground)',
                      border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}
                  >
                    {renderText(msg.text)}
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
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }} className="text-secondary-foreground">
                <i className="ki-filled ki-technology-4 text-primary" style={{ fontSize: '14px' }} />
                <span>Chargement en cours...</span>
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
                placeholder="Ex: CMD-900021 ou posez une question..."
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

/* ─── StopCard sub-component ──────────────────────────────────── */
function StopCard({ stop, idx, total, onLivre, onAnnule, onNext, loading }) {
  const googleMapsLink = mapsUrl(stop.address, '');

  return (
    <div
      className="kt-card"
      style={{
        width: '100%', border: '1px solid var(--border)',
        borderRadius: '14px', overflow: 'hidden', fontSize: '13px'
      }}
    >
      {/* Card Header */}
      <div style={{
        padding: '10px 14px', background: 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ki-filled ki-delivery" style={{ fontSize: '16px', color: '#fff' }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>{stop.tracking_code}</span>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <span className="kt-badge" style={{
            backgroundColor: stop.priority === 'HAUTE' ? '#ef4444' : '#f59e0b',
            color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600
          }}>
            {stop.priority}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', alignSelf: 'center' }}>
            {stop.stop_number}/{total}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--card)' }}>

        {/* Client Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <i className="ki-filled ki-user text-primary" style={{ fontSize: '14px' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--foreground)' }}>{stop.client_name}</div>
            {stop.phone && (
              <a href={`tel:${stop.phone}`} style={{ fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <i className="ki-filled ki-phone" style={{ fontSize: '11px' }} />
                {stop.phone}
              </a>
            )}
          </div>
          {stop.crbt_amount > 0 && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--secondary-foreground)' }}>CRBT</div>
              <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '14px' }}>{stop.crbt_amount} DH</div>
            </div>
          )}
        </div>

        {/* Address + Maps link */}
        <div style={{
          padding: '8px 10px', background: 'var(--accent)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--foreground)' }}>
            <i className="ki-filled ki-geolocation text-primary me-1" style={{ fontSize: '12px' }} />
            {stop.address || 'Adresse non renseignée'}
          </div>
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flexShrink: 0, padding: '4px 10px', borderRadius: '20px',
              background: '#4285F4', color: '#fff', fontSize: '11px',
              fontWeight: 600, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/>
            </svg>
            Maps
          </a>
        </div>

        {/* ETA */}
        <div style={{ fontSize: '11px', color: 'var(--secondary-foreground)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="ki-filled ki-time text-primary" style={{ fontSize: '11px' }} />
          ETA estimée : <strong>{stop.eta}</strong>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <button
            className="kt-btn kt-btn-success"
            onClick={onLivre}
            disabled={loading}
            style={{ flex: 1, fontSize: '12px', fontWeight: 600 }}
          >
            <i className="ki-filled ki-check-circle me-1" style={{ fontSize: '13px' }} />
            Livré ✓
          </button>
          <button
            className="kt-btn kt-btn-danger"
            onClick={onAnnule}
            disabled={loading}
            style={{ flex: 1, fontSize: '12px', fontWeight: 600 }}
          >
            <i className="ki-filled ki-cross-circle me-1" style={{ fontSize: '13px' }} />
            Annulé ✗
          </button>
          {idx + 1 < stop.stop_number && (
            <button
              className="kt-btn kt-btn-outline"
              onClick={onNext}
              disabled={loading}
              style={{ fontSize: '12px' }}
              title="Passer au suivant"
            >
              <i className="ki-filled ki-arrow-right" style={{ fontSize: '13px' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
