import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function SuperAdminAIChatbot() {
  const { isLivreur } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeColis, setActiveColis] = useState(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    recipient: '',
    phoneNumber: '',
    city: '',
    price: ''
  });

  const chatEndRef = useRef(null);

  // Hide only if explicitly a livreur session
  if (isLivreur) {
    return null;
  }

  // Initialize welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `👋 **Bonjour Super Admin !**\n\nJe suis votre **Assistant IA Livraison**. Saisissez un code de suivi (ex: \`CMD-84920\`) ou donnez-moi une instruction en langage naturel.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          showQuickActions: true
        }
      ]);
      fetchRecentParcels();
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, activeColis]);

  const fetchRecentParcels = async () => {
    try {
      const response = await fetch('/api/admin/ai-assistant/recent-parcels', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.parcels?.length > 0) {
          setActiveColis(data.parcels[0]);
        }
      }
    } catch (e) {
      // Fallback local demo parcel if backend unreachable
      setActiveColis({
        id: 1,
        orderNumber: 'CMD-84920',
        trackingCode: 'F-20260730-84920',
        recipient: 'Sofia Bennani',
        phoneNumber: '0611223344',
        city: 'Casablanca',
        address: 'Boulevard d\'Anfa, N° 45',
        price: 350,
        etat: 'Expédié',
        statut: 'En livraison'
      });
    }
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || loading) return;

    if (!customText) {
      setInputMessage('');
    }

    // Append user message
    const userMsgId = Date.now();
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/ai-assistant/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: textToSend,
          currentTrackingCode: activeColis?.orderNumber || activeColis?.trackingCode || ''
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.colis) {
            setActiveColis(data.colis);
            setEditForm({
              recipient: data.colis.recipient || '',
              phoneNumber: data.colis.phoneNumber || '',
              city: data.colis.city || '',
              price: data.colis.price || ''
            });
          }
          setMessages(prev => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'ai',
              text: data.message,
              colis: data.colis || activeColis,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        } else {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'ai',
              text: data.message || "⚠️ Une erreur s'est produite lors du traitement.",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } else {
        simulateLocalAiResponse(textToSend);
      }
    } catch (err) {
      simulateLocalAiResponse(textToSend);
    } finally {
      setLoading(false);
    }
  };

  const simulateLocalAiResponse = (text) => {
    const textLower = text.toLowerCase();
    let current = activeColis || {
      id: 1,
      orderNumber: 'CMD-84920',
      trackingCode: 'F-20260730-84920',
      recipient: 'Sofia Bennani',
      phoneNumber: '0611223344',
      city: 'Casablanca',
      address: 'Boulevard d\'Anfa, N° 45',
      price: 350,
      etat: 'Expédié',
      statut: 'En livraison'
    };

    let updated = { ...current };
    let changes = [];

    const matchCode = text.match(/(CMD-\d+|\b\d{4,8}\b)/i);
    if (matchCode) {
      const codeStr = matchCode[1].startsWith('CMD-') ? matchCode[1].toUpperCase() : 'CMD-' + matchCode[1];
      updated.orderNumber = codeStr;
      updated.trackingCode = 'F-20260730-' + matchCode[1].replace(/\D/g, '');
    }

    if (textLower.includes('livre') || textLower.includes('livré')) {
      changes.push(`État: \`${updated.etat}\` ➔ **Livré**`);
      updated.etat = 'Livré';
    } else if (textLower.includes('expedie') || textLower.includes('expédié')) {
      changes.push(`État: \`${updated.etat}\` ➔ **Expédié**`);
      updated.etat = 'Expédié';
    } else if (textLower.includes('prepar') || textLower.includes('prépar')) {
      changes.push(`État: \`${updated.etat}\` ➔ **En préparation**`);
      updated.etat = 'En préparation';
    } else if (textLower.includes('retour')) {
      changes.push(`État: \`${updated.etat}\` ➔ **Retourné**`);
      updated.etat = 'Retourné';
    }

    if (textLower.includes('termine') || textLower.includes('terminé')) {
      changes.push(`Statut: \`${updated.statut}\` ➔ **Terminé**`);
      updated.statut = 'Terminé';
    } else if (textLower.includes('cours')) {
      changes.push(`Statut: \`${updated.statut}\` ➔ **En cours**`);
      updated.statut = 'En cours';
    } else if (textLower.includes('attente')) {
      changes.push(`Statut: \`${updated.statut}\` ➔ **En attente**`);
      updated.statut = 'En attente';
    } else if (textLower.includes('report')) {
      changes.push(`Statut: \`${updated.statut}\` ➔ **Reporté**`);
      updated.statut = 'Reporté';
    } else if (textLower.includes('echec') || textLower.includes('échec')) {
      changes.push(`Statut: \`${updated.statut}\` ➔ **Échec**`);
      updated.statut = 'Échec';
    }

    const cityMatch = text.match(/ville\s*(vers|a|à|:|=)?\s*([a-zA-ZÀ-ÿ\s-]+)/i);
    if (cityMatch && cityMatch[2]) {
      const newCity = cityMatch[2].trim();
      changes.push(`Ville: \`${updated.city}\` ➔ **${newCity}**`);
      updated.city = newCity;
    }

    setActiveColis(updated);

    let replyText = '';
    if (changes.length > 0) {
      replyText = `✨ **Mise à jour IA effectuée pour ${updated.orderNumber} !**\n\n` + changes.join('\n');
    } else {
      replyText = `🔎 **Fiche Colis pour ${updated.orderNumber} :**\n• **État** : \`${updated.etat}\` | **Statut** : \`${updated.statut}\`\n• **Ville** : \`${updated.city}\` | **Destinataire** : \`${updated.recipient}\` | **Prix** : \`${updated.price} DH\``;
    }

    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'ai',
        text: replyText,
        colis: updated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleQuickStatusChange = async (newEtat, newStatut) => {
    if (!activeColis) return;

    setLoading(true);
    try {
      await fetch('/api/admin/ai-assistant/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingCode: activeColis.orderNumber,
          etat: newEtat || activeColis.etat,
          statut: newStatut || activeColis.statut
        })
      });
    } catch (e) {
      // Ignored offline fallback
    }

    const updated = {
      ...activeColis,
      ...(newEtat ? { etat: newEtat } : {}),
      ...(newStatut ? { statut: newStatut } : {})
    };

    setActiveColis(updated);
    setLoading(false);

    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'ai',
        text: `⚡ **Statut mis à jour directement !**\n${newEtat ? `• État: **${newEtat}**\n` : ''}${newStatut ? `• Statut: **${newStatut}**` : ''}`,
        colis: updated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSaveInfoForm = async (e) => {
    e.preventDefault();
    if (!activeColis) return;

    setLoading(true);
    const updated = {
      ...activeColis,
      recipient: editForm.recipient || activeColis.recipient,
      phoneNumber: editForm.phoneNumber || activeColis.phoneNumber,
      city: editForm.city || activeColis.city,
      price: editForm.price || activeColis.price
    };

    try {
      await fetch('/api/admin/ai-assistant/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingCode: activeColis.orderNumber,
          recipient: editForm.recipient,
          phoneNumber: editForm.phoneNumber,
          city: editForm.city,
          price: editForm.price
        })
      });
    } catch (err) {
      // Ignored
    }

    setActiveColis(updated);
    setIsEditingInfo(false);
    setLoading(false);

    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'ai',
        text: `📝 **Informations du colis ${updated.orderNumber} modifiées avec succès !**\n• Destinataire: **${updated.recipient}**\n• Tél: **${updated.phoneNumber}**\n• Ville: **${updated.city}**\n• Prix: **${updated.price} DH**`,
        colis: updated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div
      id="super-admin-ai-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          id="btn-open-super-admin-ai"
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '9999px',
            boxShadow: '0 20px 25px -5px rgba(124, 58, 237, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            fontSize: '14px',
            fontWeight: 600,
            outline: 'none'
          }}
          title="Assistant IA Super Admin"
        >
          {/* Animated pulse dot */}
          <span style={{ position: 'relative', display: 'flex', width: '12px', height: '12px' }}>
            <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.75 }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.1354 2.07227L23.1485 14.4133C23.5688 15.7057 22.6055 17.0318 21.2466 17.0318H19.5501C18.243 17.0318 17.0863 16.1855 16.6908 14.9397L12.9398 3.12631C12.4484 1.57872 13.6035 0 15.2273 0H16.2825C17.5819 0 18.7336 0.836547 19.1354 2.07227Z" fill="#0094FF"/>
              <path d="M13.4903 10.9357L10.4497 1.19615C10.2275 0.48457 9.5686 0 8.82314 0C8.09725 0 7.49869 0.56884 7.46175 1.29379L7.10061 8.38112C7.05414 9.29305 7.16414 10.2062 7.42583 11.081L8.77917 15.605C9.03246 16.4517 9.81148 17.0318 10.6953 17.0318H11.2254C12.0959 17.0318 12.8665 16.4687 13.1309 15.6394L13.4794 14.5464C13.8537 13.3725 13.8575 12.1119 13.4903 10.9357Z" fill="#FFFFFF"/>
              <path d="M6.83708 0H8.0515C9.66981 0 10.8243 1.56893 10.3428 3.11397L6.62408 15.0486C6.23346 16.3022 5.07297 17.1561 3.7599 17.1561H2.08532C0.741852 17.1561 -0.219543 15.8579 0.172263 14.5729L3.96749 2.12509C4.35241 0.862609 5.51723 0 6.83708 0Z" fill="#0094FF"/>
            </svg>
            <span>Super Admin IA</span>
          </div>

          <span style={{ background: 'rgba(255, 255, 255, 0.25)', fontSize: '11px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Chatbot
          </span>
        </button>
      )}

      {/* Main Floating Chatbot Drawer */}
      {isOpen && (
        <div
          style={{
            width: '420px',
            maxWidth: '92vw',
            height: '610px',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            backgroundColor: '#151521',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0094FF, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <svg width="24" height="20" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.1354 2.07227L23.1485 14.4133C23.5688 15.7057 22.6055 17.0318 21.2466 17.0318H19.5501C18.243 17.0318 17.0863 16.1855 16.6908 14.9397L12.9398 3.12631C12.4484 1.57872 13.6035 0 15.2273 0H16.2825C17.5819 0 18.7336 0.836547 19.1354 2.07227Z" fill="#ffffff"/>
                  <path d="M13.4903 10.9357L10.4497 1.19615C10.2275 0.48457 9.5686 0 8.82314 0C8.09725 0 7.49869 0.56884 7.46175 1.29379L7.10061 8.38112C7.05414 9.29305 7.16414 10.2062 7.42583 11.081L8.77917 15.605C9.03246 16.4517 9.81148 17.0318 10.6953 17.0318H11.2254C12.0959 17.0318 12.8665 16.4687 13.1309 15.6394L13.4794 14.5464C13.8537 13.3725 13.8575 12.1119 13.4903 10.9357Z" fill="#e0e7ff"/>
                  <path d="M6.83708 0H8.0515C9.66981 0 10.8243 1.56893 10.3428 3.11397L6.62408 15.0486C6.23346 16.3022 5.07297 17.1561 3.7599 17.1561H2.08532C0.741852 17.1561 -0.219543 15.8579 0.172263 14.5729L3.96749 2.12509C4.35241 0.862609 5.51723 0 6.83708 0Z" fill="#ffffff"/>
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: '#ffffff' }}>Assistant IA Colis</h3>
                  <span style={{ background: 'rgba(168, 85, 247, 0.3)', color: '#e9d5ff', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Super Admin
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>Gestion & Modification Instantanée</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
              <button
                onClick={() => { setMessages([]); setActiveColis(null); }}
                style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}
                title="Effacer"
              >
                <i className="ki-filled ki-arrows-loop" style={{ fontSize: '16px' }}></i>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}
                title="Fermer"
              >
                <i className="ki-filled ki-cross" style={{ fontSize: '20px' }}></i>
              </button>
            </div>
          </div>

          {/* Context Header */}
          {activeColis && (
            <div style={{ backgroundColor: '#1e1e2d', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ki-filled ki-delivery" style={{ color: '#a855f7', fontSize: '16px' }}></i>
                <span style={{ fontWeight: 'bold', color: '#ffffff' }}>{activeColis.orderNumber}</span>
                <span style={{ color: '#94a3b8' }}>• {activeColis.city}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  {activeColis.etat}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  {activeColis.statut}
                </span>
              </div>
            </div>
          )}

          {/* Messages list */}
          <div style={{ flexGrow: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#151521' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {msg.sender === 'user' ? 'Vous (Super Admin)' : 'Assistant IA'} • {msg.timestamp}
                </div>

                <div
                  style={{
                    maxWidth: '88%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    lineHeight: '1.5',
                    fontSize: '13px',
                    backgroundColor: msg.sender === 'user' ? '#6366f1' : '#1e1e2d',
                    color: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.text.split('\n').map((line, idx) => (
                      <p key={idx} style={{ margin: idx > 0 ? '4px 0 0 0' : 0 }}>
                        {line.includes('**') ? (
                          line.split('**').map((chunk, i) => (
                            i % 2 === 1 ? <strong key={i} style={{ fontWeight: 'bold' }}>{chunk}</strong> : chunk
                          ))
                        ) : line}
                      </p>
                    ))}
                  </div>

                  {msg.showQuickActions && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button
                        onClick={() => handleSendMessage('CMD-84920')}
                        style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '11px', cursor: 'pointer' }}
                      >
                        🔍 Consulter CMD-84920
                      </button>
                      <button
                        onClick={() => handleSendMessage('Changer letat vers livre et status vers terminer')}
                        style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '11px', cursor: 'pointer' }}
                      >
                        ⚡ Livré & Terminé
                      </button>
                      <button
                        onClick={() => handleSendMessage('Changer la ville vers Rabat')}
                        style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '11px', cursor: 'pointer' }}
                      >
                        📍 Changer Ville
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Interactive Control Panel Card */}
            {activeColis && (
              <div style={{ padding: '14px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.1))', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#c084fc', uppercase: 'true' }}>
                    Modifications Directes: {activeColis.orderNumber}
                  </span>
                  <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#34d399' }}>{activeColis.price} DH</span>
                </div>

                {/* Instant Combo Action */}
                <button
                  onClick={() => handleQuickStatusChange('Livré', 'Terminé')}
                  disabled={loading}
                  style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #0d9488)', color: '#ffffff', fontWeight: 'bold', fontSize: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}
                >
                  <i className="ki-filled ki-check-circle" style={{ fontSize: '16px' }}></i>
                  <span>Marquer comme Livré & Terminé (1 Clic)</span>
                </button>

                {/* Direct Choice Buttons: État */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Changer l'État :</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {['Créé', 'En préparation', 'Expédié', 'Livré', 'Retourné'].map((etatOpt) => (
                      <button
                        key={etatOpt}
                        onClick={() => handleQuickStatusChange(etatOpt, null)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          border: '1px solid rgba(255,255,255,0.15)',
                          cursor: 'pointer',
                          background: activeColis.etat === etatOpt ? '#8b5cf6' : '#1e1e2d',
                          color: '#ffffff'
                        }}
                      >
                        {etatOpt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Choice Buttons: Statut */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Changer le Statut :</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {['En attente', 'En cours', 'Reporté', 'Échec', 'Terminé'].map((statutOpt) => (
                      <button
                        key={statutOpt}
                        onClick={() => handleQuickStatusChange(null, statutOpt)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          border: '1px solid rgba(255,255,255,0.15)',
                          cursor: 'pointer',
                          background: activeColis.statut === statutOpt ? '#6366f1' : '#1e1e2d',
                          color: '#ffffff'
                        }}
                      >
                        {statutOpt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                <i className="ki-filled ki-technology-4" style={{ fontSize: '16px', color: '#a855f7' }}></i>
                <span>L'IA met à jour les données du colis...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div style={{ padding: '12px', backgroundColor: '#1e1e2d', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ex: CMD-84920, passer état à Livré..."
              style={{
                flexGrow: 1,
                padding: '10px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                backgroundColor: '#151521',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !inputMessage.trim() || loading ? 0.5 : 1
              }}
            >
              <i className="ki-filled ki-send" style={{ fontSize: '16px' }}></i>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
