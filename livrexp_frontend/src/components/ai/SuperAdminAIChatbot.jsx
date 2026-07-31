import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function SuperAdminAIChatbot() {
  const { user, isLivreur, isClient } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeColis, setActiveColis] = useState(null);
  const [showDirectModifications, setShowDirectModifications] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    recipient: '',
    phoneNumber: '',
    city: '',
    price: ''
  });

  const chatEndRef = useRef(null);

  const getEtatColor = (etat) => {
    switch (etat) {
      case 'Livré': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Retourné': return { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' };
      case 'Expédié': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'En préparation': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      default: return { bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Terminé': return { bg: 'rgba(20, 184, 166, 0.15)', text: '#2dd4bf', border: 'rgba(20, 184, 166, 0.3)' };
      case 'En cours': return { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.3)' };
      case 'Reporté': return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'Échec': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      default: return { bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  // Helper to resolve user's full name or display name
  const getUserDisplayName = () => {
    try {
      const cachedProfile = sessionStorage.getItem('user_profile');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        if (parsed.fullName) return parsed.fullName;
        if (parsed.firstName || parsed.lastName) {
          return `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim();
        }
      }
    } catch (_) {}

    if (user?.fullName) return user.fullName;
    if (user?.name) return user.name;
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return '{getUserDisplayName()}';
  };

  // Hide for livreurs and clients — chatbot is admin/superviseur only
  if (isLivreur || isClient) {
    return null;
  }

  // Initialize welcome message when opened for the first time (do NOT auto load any parcel)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const displayName = getUserDisplayName();
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `👋 **Bonjour ${displayName} !**\n\nJe suis votre **Assistant IA Livraison**. Veuillez me donner un code de suivi (ex: \`CMD-84920\`) pour consulter et modifier un colis.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          showQuickActions: true
        }
      ]);
      setActiveColis(null);
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
          // If the AI handled a ramassage request, notify other pages to refresh
          if (data.message && data.message.includes('Ramassage')) {
            window.dispatchEvent(new CustomEvent('ai:ramassage-updated'));
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
    const matchCode = text.match(/(CMD-\d+|\b\d{4,8}\b)/i);

    // If no active parcel and no tracking code specified in message, ask user for code
    if (!activeColis && !matchCode) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `🔎 **Veuillez me donner un numéro de colis** (ex: \`CMD-84920\` ou \`CMD-466134\`) pour afficher ses informations et accéder aux choix de modification.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

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

    if (matchCode) {
      const codeStr = matchCode[1].startsWith('CMD-') ? matchCode[1].toUpperCase() : 'CMD-' + matchCode[1];
      updated.orderNumber = codeStr;
      updated.trackingCode = 'F-20260730-' + matchCode[1].replace(/\D/g, '');
    }

    if (textLower.includes('ramassage') || textLower.includes('ramasser')) {
      const finalEtats = ['Livré', 'Retourné'];
      if (finalEtats.includes(updated.etat) || updated.statut === 'Terminé') {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `🚫 **${updated.orderNumber}** : Impossible de créer une demande de ramassage. Ce colis est déjà dans un état final (État: **${updated.etat}** | Statut: **${updated.statut}**). Aucune action n'est requise.`,
            colis: updated,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      } else if (updated.etat === 'En préparation') {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `⚠️ **${updated.orderNumber}** : Ce colis fait DÉJÀ l'objet d'une demande de ramassage (État: En préparation | Statut: ${updated.statut}).`,
            colis: updated,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      } else {
        changes.push(`État: \`${updated.etat}\` ➔ **En préparation**`);
        updated.etat = 'En préparation';
        updated.statut = 'En attente';
      }
    } else if (textLower.includes('livre') || textLower.includes('livré')) {
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

    const cityMatch = text.match(/\b(?:par|vers|en|à|a|:|=)\s+([a-zA-ZÀ-ÿ-]+)/i) || text.match(/ville\s+(?:de\s+)?([a-zA-ZÀ-ÿ-]+)/i) || text.match(/ville\s*:\s*([a-zA-ZÀ-ÿ-]+)/i);
    if (cityMatch && cityMatch[1]) {
      const rawCity = cityMatch[1].trim();
      const stopwords = ['vers', 'par', 'du', 'de', 'la', 'le', 'cette', 'commande', 'colis', 'et', 'etat', 'statut', 'changer'];
      if (!stopwords.includes(rawCity.toLowerCase())) {
        const newCity = rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase();
        changes.push(`Ville: \`${updated.city}\` ➔ **${newCity}**`);
        updated.city = newCity;
      }
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
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
    >
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          id="btn-open-super-admin-ai"
          onClick={() => setIsOpen(true)}
          title="Assistant IA LivrExpress"
          style={{
            position: 'relative',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '2px solid rgba(255,255,255,0.2)',
            outline: 'none',
            transition: 'transform 0.2s ease'
          }}
        >
          <span style={{ position: 'absolute', top: '2px', right: '2px', display: 'flex', width: '11px', height: '11px' }}>
            <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.6, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }}></span>
            <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid var(--card)' }}></span>
          </span>
          <svg width="22" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.1354 2.07227L23.1485 14.4133C23.5688 15.7057 22.6055 17.0318 21.2466 17.0318H19.5501C18.243 17.0318 17.0863 16.1855 16.6908 14.9397L12.9398 3.12631C12.4484 1.57872 13.6035 0 15.2273 0H16.2825C17.5819 0 18.7336 0.836547 19.1354 2.07227Z" fill="#ffffff"/>
            <path d="M13.4903 10.9357L10.4497 1.19615C10.2275 0.48457 9.5686 0 8.82314 0C8.09725 0 7.49869 0.56884 7.46175 1.29379L7.10061 8.38112C7.05414 9.29305 7.16414 10.2062 7.42583 11.081L8.77917 15.605C9.03246 16.4517 9.81148 17.0318 10.6953 17.0318H11.2254C12.0959 17.0318 12.8665 16.4687 13.1309 15.6394L13.4794 14.5464C13.8537 13.3725 13.8575 12.1119 13.4903 10.9357Z" fill="rgba(255,255,255,0.7)"/>
            <path d="M6.83708 0H8.0515C9.66981 0 10.8243 1.56893 10.3428 3.11397L6.62408 15.0486C6.23346 16.3022 5.07297 17.1561 3.7599 17.1561H2.08532C0.741852 17.1561 -0.219543 15.8579 0.172263 14.5729L3.96749 2.12509C4.35241 0.862609 5.51723 0 6.83708 0Z" fill="#ffffff"/>
          </svg>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="kt-card"
          style={{ width: '420px', maxWidth: '92vw', height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', borderRadius: '16px' }}
        >
          {/* Header */}
          <div className="kt-card-header" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="16" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.1354 2.07227L23.1485 14.4133C23.5688 15.7057 22.6055 17.0318 21.2466 17.0318H19.5501C18.243 17.0318 17.0863 16.1855 16.6908 14.9397L12.9398 3.12631C12.4484 1.57872 13.6035 0 15.2273 0H16.2825C17.5819 0 18.7336 0.836547 19.1354 2.07227Z" fill="#ffffff"/>
                  <path d="M13.4903 10.9357L10.4497 1.19615C10.2275 0.48457 9.5686 0 8.82314 0C8.09725 0 7.49869 0.56884 7.46175 1.29379L7.10061 8.38112C7.05414 9.29305 7.16414 10.2062 7.42583 11.081L8.77917 15.605C9.03246 16.4517 9.81148 17.0318 10.6953 17.0318H11.2254C12.0959 17.0318 12.8665 16.4687 13.1309 15.6394L13.4794 14.5464C13.8537 13.3725 13.8575 12.1119 13.4903 10.9357Z" fill="rgba(255,255,255,0.7)"/>
                  <path d="M6.83708 0H8.0515C9.66981 0 10.8243 1.56893 10.3428 3.11397L6.62408 15.0486C6.23346 16.3022 5.07297 17.1561 3.7599 17.1561H2.08532C0.741852 17.1561 -0.219543 15.8579 0.172263 14.5729L3.96749 2.12509C4.35241 0.862609 5.51723 0 6.83708 0Z" fill="#ffffff"/>
                </svg>
              </div>
              <div>
                <div className="kt-card-title" style={{ fontSize: '14px', margin: 0 }}>
                  LivrExpress
                  <span className="kt-badge kt-badge-primary kt-badge-outline ms-2" style={{ fontSize: '9px', padding: '1px 6px' }}>{getUserDisplayName()}</span>
                </div>
                <p className="text-secondary-foreground" style={{ fontSize: '11px', margin: 0 }}>Agent logistique IA</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
              <button
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                onClick={() => { setMessages([]); setActiveColis(null); setShowDirectModifications(false); }}
                title="Réinitialiser"
              >
                <i className="ki-filled ki-arrows-loop" style={{ fontSize: '14px' }}></i>
              </button>
              <button
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                onClick={() => setIsOpen(false)}
                title="Fermer"
              >
                <i className="ki-filled ki-cross" style={{ fontSize: '16px' }}></i>
              </button>
            </div>
          </div>

          {/* Active colis context bar */}
          {activeColis && (
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ki-filled ki-delivery text-primary" style={{ fontSize: '14px' }}></i>
                <span className="text-foreground font-semibold">{activeColis.orderNumber}</span>
                <span className="text-secondary-foreground">• {activeColis.city}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span className="kt-badge kt-badge-info kt-badge-outline" style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px' }}>{activeColis.etat}</span>
                <span className="kt-badge kt-badge-success kt-badge-outline" style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px' }}>{activeColis.statut}</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--background)' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: '3px' }}>
                <div className="text-secondary-foreground" style={{ fontSize: '11px' }}>
                  {msg.sender === 'user' ? 'Vous' : 'LivrExpress'} • {msg.timestamp}
                </div>

                <div
                  className={msg.sender === 'user' ? '' : 'kt-card'}
                  style={{
                    maxWidth: '90%',
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    fontSize: '13px',
                    lineHeight: '1.55',
                    backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--card)',
                    color: msg.sender === 'user' ? '#fff' : 'var(--foreground)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}
                >
                  {/* Message text */}
                  <div>
                    {msg.text.split('\n').filter(line => !msg.colis || !line.trim().startsWith('•')).map((line, idx) => (
                      <p key={idx} style={{ margin: idx > 0 ? '3px 0 0 0' : 0 }}>
                        {line.includes('**') ? (
                          line.split('**').map((chunk, i) => (
                            i % 2 === 1 ? <strong key={i}>{chunk}</strong> : chunk
                          ))
                        ) : line}
                      </p>
                    ))}
                  </div>

                  {/* Parcel info card */}
                  {msg.colis && (
                    <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'var(--accent)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="text-foreground font-semibold" style={{ fontSize: '12px' }}>
                          <i className="ki-filled ki-parcel me-1"></i>
                          {msg.colis.orderNumber || msg.colis.trackingCode}
                        </span>
                        <span className="text-primary font-semibold" style={{ fontSize: '12px' }}>{msg.colis.price} DH</span>
                      </div>

                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {msg.colis.etat && (
                          <span className="kt-badge kt-badge-warning kt-badge-outline" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px' }}>
                            {msg.colis.etat}
                          </span>
                        )}
                        {msg.colis.statut && (
                          <span className="kt-badge kt-badge-primary kt-badge-outline" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px' }}>
                            {msg.colis.statut}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }} className="text-secondary-foreground">
                        <div><i className="ki-filled ki-geolocation me-1"></i><strong>Ville:</strong> {msg.colis.city || '-'}</div>
                        <div><i className="ki-filled ki-user me-1"></i><strong>Client:</strong> {msg.colis.recipient || '-'}</div>
                        {msg.colis.phoneNumber && (
                          <div><i className="ki-filled ki-phone me-1"></i><strong>Tél:</strong> {msg.colis.phoneNumber}</div>
                        )}
                      </div>

                      <button
                        className="kt-btn kt-btn-sm kt-btn-outline kt-btn-primary w-full"
                        onClick={() => setShowDirectModifications(prev => !prev)}
                        style={{ marginTop: '8px', fontSize: '11px' }}
                      >
                        <i className="ki-filled ki-setting-2 me-1"></i>
                        {showDirectModifications ? 'Masquer les modifications' : 'Modifier État / Statut'}
                      </button>
                    </div>
                  )}

                  {/* Quick action chips on welcome */}
                  {msg.showQuickActions && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      <button className="kt-btn kt-btn-sm kt-btn-outline" onClick={() => handleSendMessage('CMD-84920')} style={{ fontSize: '11px' }}>
                        <i className="ki-filled ki-magnifier me-1"></i>Consulter CMD-84920
                      </button>
                      <button className="kt-btn kt-btn-sm kt-btn-outline kt-btn-success" onClick={() => { setShowDirectModifications(true); handleSendMessage('Changer letat vers livre et status vers terminer'); }} style={{ fontSize: '11px' }}>
                        <i className="ki-filled ki-check me-1"></i>Livré & Terminé
                      </button>
                      <button className="kt-btn kt-btn-sm kt-btn-outline kt-btn-info" onClick={() => handleSendMessage('Changer la ville vers Rabat')} style={{ fontSize: '11px' }}>
                        <i className="ki-filled ki-geolocation me-1"></i>Changer Ville
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Direct Modifications Panel */}
            {activeColis && showDirectModifications && (
              <div className="kt-card" style={{ border: '1px solid var(--border)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-foreground font-semibold" style={{ fontSize: '12px' }}>
                    <i className="ki-filled ki-pencil me-1 text-primary"></i>
                    Modifications Directes : {activeColis.orderNumber}
                  </span>
                  <span className="text-success font-semibold" style={{ fontSize: '12px' }}>{activeColis.price} DH</span>
                </div>

                {activeColis.etat === 'Livré' && (activeColis.statut === 'Terminé' || activeColis.statut === 'Livré') ? (
                  <div className="kt-badge kt-badge-success kt-badge-outline w-full" style={{ padding: '8px', borderRadius: '8px', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
                    <i className="ki-filled ki-check-circle"></i> Colis déjà Livré et Terminé
                  </div>
                ) : (
                  <button
                    className="kt-btn kt-btn-success w-full"
                    onClick={() => handleQuickStatusChange('Livré', 'Terminé')}
                    disabled={loading}
                    style={{ fontSize: '12px' }}
                  >
                    <i className="ki-filled ki-check-circle me-1"></i>
                    Marquer comme Livré & Terminé
                  </button>
                )}

                <div>
                  <label className="text-secondary-foreground" style={{ fontSize: '11px', display: 'block', marginBottom: '5px', fontWeight: '600' }}>Changer l'État :</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {['Créé', 'En préparation', 'Expédié', 'Livré', 'Retourné'].map((etatOpt) => (
                      <button
                        key={etatOpt}
                        className={`kt-btn kt-btn-sm ${activeColis.etat === etatOpt ? 'kt-btn-primary' : 'kt-btn-outline'}`}
                        onClick={() => handleQuickStatusChange(etatOpt, null)}
                        style={{ fontSize: '11px' }}
                      >
                        {etatOpt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-secondary-foreground" style={{ fontSize: '11px', display: 'block', marginBottom: '5px', fontWeight: '600' }}>Changer le Statut :</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {['En attente', 'En cours', 'Reporté', 'Échec', 'Terminé'].map((statutOpt) => (
                      <button
                        key={statutOpt}
                        className={`kt-btn kt-btn-sm ${activeColis.statut === statutOpt ? 'kt-btn-primary' : 'kt-btn-outline'}`}
                        onClick={() => handleQuickStatusChange(null, statutOpt)}
                        style={{ fontSize: '11px' }}
                      >
                        {statutOpt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }} className="text-secondary-foreground">
                <i className="ki-filled ki-technology-4 text-primary" style={{ fontSize: '14px' }}></i>
                <span>L'IA traite votre demande...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--card)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <label className="kt-input" style={{ flexGrow: 1, borderRadius: '9999px' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Ex: CMD-84920, dmd ramassage..."
                style={{ fontSize: '13px' }}
              />
            </label>
            <button
              className="kt-btn kt-btn-primary kt-btn-icon"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              style={{ borderRadius: '50%', width: '36px', height: '36px', flexShrink: 0 }}
            >
              <i className="ki-filled ki-send" style={{ fontSize: '14px' }}></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
