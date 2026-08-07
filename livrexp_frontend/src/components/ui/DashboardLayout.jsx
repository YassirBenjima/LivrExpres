import React, { useState, useEffect, useRef } from 'react';

import { getUserRoles } from '../../hooks/useAuth';
import SuperAdminAIChatbot from '../ai/SuperAdminAIChatbot';
import LivreurAIChatbotWidget from '../ai/LivreurAIChatbotWidget';
import { useLanguage } from '../../context/LanguageContext';


class MenuErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("User Menu Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #f87171', borderRadius: '8px', zIndex: 9999, position: 'absolute', right: 0, top: '100%', width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>⚠️ Erreur dans le menu utilisateur :</strong>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DashboardLayout({ children, activeMenu, activeItem }) {

  const currentActive = activeMenu || activeItem || 'dashboard';
  // ── Role-based access control ────────────────────────────────────────────
  const userRoles = getUserRoles();
  const isLivreur    = userRoles.includes('ROLE_LIVREUR');
  const isSuperAdmin = userRoles.includes('ROLE_SUPER_ADMIN');
  const isSuperviseur= userRoles.includes('ROLE_SUPERVISEUR');
  const isAdmin      = userRoles.includes('ROLE_ADMIN') || isSuperAdmin || isSuperviseur;
  // ROLE_CLIENT or any authenticated user who is not a livreur or admin sees the full client view
  const isClientOrFull = !isLivreur;
  // ─────────────────────────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState(localStorage.getItem('kt-theme') || 'light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const langOptions = [
    { code: 'fr', label: 'Français', flag: '/assets/media/flags/france.svg' },
    { code: 'en', label: 'English', flag: '/assets/media/flags/united-states.svg' },
  ];

  const currentLangObj = langOptions.find(o => o.code === language) || langOptions[0] || { label: 'Français', flag: '/assets/media/flags/france.svg' };


  const [isColisMenuOpen, setIsColisMenuOpen] = useState(currentActive.startsWith('colis'));
  const [isStockMenuOpen, setIsStockMenuOpen] = useState(currentActive.startsWith('stock'));
  const [isRamassageMenuOpen, setIsRamassageMenuOpen] = useState(currentActive.startsWith('ramassage'));
  const [isBonLivraisonMenuOpen, setIsBonLivraisonMenuOpen] = useState(currentActive.startsWith('bon_livraison'));
  const [isSuiviMenuOpen, setIsSuiviMenuOpen] = useState(currentActive.startsWith('suivi') || currentActive === 'dispatch-map');
  const [isRetourMenuOpen, setIsRetourMenuOpen] = useState(currentActive.startsWith('retour'));
  const [isFacturationMenuOpen, setIsFacturationMenuOpen] = useState(currentActive.startsWith('facturation'));
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(currentActive.startsWith('ai'));
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      let initialUser = storedUser ? JSON.parse(storedUser) : null;
      const cachedProfile = sessionStorage.getItem('user_profile');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        if (parsed.fullName) {
          initialUser = initialUser ? { ...initialUser, name: parsed.fullName, email: parsed.email } : { name: parsed.fullName, email: parsed.email };
        }
      }
      return initialUser;
    } catch {
      return null;
    }
  });
  const [avatarUrl, setAvatarUrl] = useState(() => {
    try {
      const cachedProfile = sessionStorage.getItem('user_profile');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        return parsed.avatarUrl || null;
      }
    } catch {
      // Ignore
    }
    return null;
  });
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
        setIsLangMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {

    const fetchNotifications = async () => {
      let rawNotifs;
      let rawUnread;
      const defaultList = [
          { id: '1', title: 'Colis Livré avec succès', message: 'Le colis F-20260731-001 à Casablanca a été livré.', type: 'success', icon: 'ki-check-circle', createdAt: 'Il y a 10 min', isRead: false, link: '/colis' },
          { id: '2', title: 'Nouvelle demande de ramassage', message: 'Une nouvelle demande a été soumise pour Agadir.', type: 'info', icon: 'ki-delivery-3', createdAt: 'Il y a 30 min', isRead: false, link: '/ramassage' },
          { id: '3', title: 'Colis En cours de livraison', message: 'Le colis F-20260731-992 est pris en charge par le livreur.', type: 'info', icon: 'ki-geolocation', createdAt: 'Il y a 1 heure', isRead: false, link: '/colis' },
          { id: '4', title: 'Nouveau bon de livraison', message: 'Le bon BL-20260730-04 a été généré.', type: 'info', icon: 'ki-document', createdAt: 'Hier', isRead: false, link: '/bon_livraison' },
          { id: '5', title: 'Colis Retourné', message: 'Le colis F-20260730-84920 à Rabat a été refusé.', type: 'warning', icon: 'ki-time', createdAt: 'Hier', isRead: false, link: '/retour/demandes' },
          { id: '6', title: 'Paiement CRBT Reçu', message: 'Un versement de 2 957,50 MAD a été crédité.', type: 'success', icon: 'ki-wallet', createdAt: 'Il y a 2 jours', isRead: false, link: '/facturation' },
          { id: '7', title: 'Demande de retrait acceptée', message: 'Le client a validé le retour de la commande.', type: 'success', icon: 'ki-check-circle', createdAt: 'Il y a 3 jours', isRead: false, link: '/retour/demandes' },
        ];
      try {
        const t = localStorage.getItem('auth_token');
        const r = await fetch('/api/notifications', {
          headers: { 'Accept': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
          credentials: 'include',
        });
        if (r.ok) {
          const d = await r.json();
          if (d.success && Array.isArray(d.notifications) && d.notifications.length > 0) {
            rawNotifs = d.notifications;
            rawUnread = d.unreadCount || 0;
          } else {
            rawNotifs = defaultList;
            rawUnread = 7;
          }
        } else {
          rawNotifs = defaultList;
          rawUnread = 7;
        }
      } catch {
        rawNotifs = defaultList;
        rawUnread = 7;
      }

      // Restore read state across page refreshes (F5)
      const isAllRead = localStorage.getItem('notifs_all_read') === 'true';
      const readIds = JSON.parse(localStorage.getItem('read_notif_ids') || '[]');

      if (isAllRead) {
        setNotifications(rawNotifs.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } else if (readIds.length > 0) {
        const updated = rawNotifs.map(n => readIds.includes(String(n.id)) ? { ...n, isRead: true } : n);
        setNotifications(updated);
        setUnreadCount(updated.filter(n => !n.isRead).length);
      } else {
        setNotifications(rawNotifs);
        setUnreadCount(rawUnread);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    localStorage.setItem('notifs_all_read', 'true');
    try {
      const t = localStorage.getItem('auth_token');
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Accept': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        credentials: 'include',
      });
    } catch {
      // Ignore network errors
    }
  };

  const handleNotifClick = async (notif) => {
    setIsNotifMenuOpen(false);
    if (!notif.isRead) {
      setNotifications(prev => {
        const updated = prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n);
        const readIds = JSON.parse(localStorage.getItem('read_notif_ids') || '[]');
        localStorage.setItem('read_notif_ids', JSON.stringify([...new Set([...readIds, String(notif.id)])]));
        return updated;
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
      try {
        const t = localStorage.getItem('auth_token');
        await fetch(`/api/notifications/${notif.id}/read`, {
          method: 'PATCH',
          headers: { 'Accept': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
          credentials: 'include',
        });
      } catch {
        // Ignore network errors
      }
    }
    if (notif.link) {
      window.history.pushState({}, '', notif.link);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  useEffect(() => {
    // Check if profile is already cached in sessionStorage to prevent refetching on every page change
    const cachedProfile = sessionStorage.getItem('user_profile');
    if (cachedProfile) {
      return;
    }

    // Fetch real avatar from profile API if not cached
    const token = localStorage.getItem('auth_token');
    fetch('/api/profile', {
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          sessionStorage.setItem('user_profile', JSON.stringify(data.user));
          setAvatarUrl(data.user.avatarUrl || null);
          // Also update display name from profile
          setUser(prev => prev ? { ...prev, name: data.user.fullName, email: data.user.email } : prev);
        }
      })
      .catch(() => {});
  }, []);

  const getUserInitials = (u) => {

    if (u && typeof u.name === 'string' && u.name.trim()) {
      return u.name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (u && typeof u.email === 'string' && u.email.trim()) {
      return u.email.trim().slice(0, 2).toUpperCase();
    }
    return 'LE';
  };

  const getUserDisplayName = (u) => {
    if (u && typeof u.name === 'string' && u.name.trim()) return u.name;
    if (u && typeof u.email === 'string' && u.email.trim()) return u.email.split('@')[0];
    return 'Utilisateur';
  };

  const getUserDisplayEmail = (u) => {
    if (u && typeof u.email === 'string' && u.email.trim()) return u.email;
    return 'demo@livrexpress.ma';
  };

  useEffect(() => {

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    let activeTheme = themeMode;
    if (themeMode === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    root.classList.add(activeTheme);
    root.setAttribute('data-kt-theme-mode', themeMode);
    localStorage.setItem('kt-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const titles = {
      dashboard: t('nav.dashboard', 'Tableau de Bord'),
      colis_list: t('nav.parcelsList', 'Liste des colis'),
      colis_new: t('nav.addParcel', 'Nouveau Colis'),
      colis_pickup: t('nav.pickupParcels', 'Colis pour ramassage'),
      colis_import: t('nav.importParcels', 'Importer Colis'),
      colis_settings: t('nav.parcelSettings', 'Paramètres des colis'),
      stock_products: t('nav.productList', 'Liste des produits'),
      stock_products_new: t('nav.addProduct', 'Ajouter un produit'),
      stock_colis: t('nav.stockParcels', 'Colis du stock'),
      stock_entry: t('nav.stockEntry', 'Stock Entrée'),
      ramassage_list: t('nav.pickupList', 'Liste des ramassages'),
      ramassage_new: t('nav.newPickupRequest', 'Nouvelle demande'),
      ramassage_planning: t('nav.planning', 'Planification'),
      bon_livraison_list: t('nav.deliverySlipList', 'Liste bons de livraison'),
      bon_livraison_new: t('nav.addDeliverySlip', 'Ajouter Bon de Livraison'),
      suivi_changement_destinataire: t('nav.changeRecipient', 'Changement destinataire'),
      suivi_whatsapp_template: t('nav.whatsappTracking', 'Suivi par Whatsapp'),
      dispatch_map: t('nav.gpsTrackingMap', 'Carte Suivi GPS'),
      retour_demandes: t('nav.returnRequest', 'Demande de retour'),
      retour_bons: t('nav.returnSlips', 'Bons de retour'),
      facturation_crbt: t('nav.crbtList', 'Liste CRBT'),
      clients: t('clients.title', 'Gestion des Clients'),
      livreurs: t('drivers.title', 'Gestion des Livreurs'),
      livreurs_list: t('drivers.title', 'Gestion des Livreurs'),
      livreurs_new: t('drivers.addDriverTitle', 'Ajouter un livreur'),
      livreurs_fiche: t('drivers.ficheTitle', 'Fiche Livreur'),
      livreurs_auto_assign: t('drivers.autoAssignTitle', 'Attribution des Colis'),
      affiliate: t('affiliate.title', "Programme d'Affiliation"),
      api_docs: t('apiDocs.title', 'Documentation API'),
      profile: t('nav.myProfile', 'Mon Profil'),
      ai_predictions: t('nav.aiPredictions', 'Prédiction des retours'),
      ai_anomalies: t('nav.aiAnomalies', 'Détection des anomalies'),
      ai_tournees: t('nav.aiOptimization', 'Optimisation de tournées'),
    };
    const pageName = titles[activeMenu] || t('nav.dashboard', 'Tableau de Bord');
    const brand = activeMenu && activeMenu.startsWith('ai') ? 'LivrExpress PRO' : 'LivrExpress';
    document.title = `${pageName} - ${brand}`;
  }, [activeMenu, language, t]);


  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('user_profile');
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`antialiased flex h-full text-base text-foreground bg-background demo1 kt-sidebar-fixed kt-header-fixed ${isSidebarCollapsed ? 'kt-sidebar-collapse' : ''}`}>
      {/* Sidebar */}
      <div 
        id="sidebar" 
        className={`kt-sidebar bg-background border-e border-e-border fixed top-0 bottom-0 z-20 flex flex-col items-stretch shrink-0 transition-[width] duration-300 lg:flex ${
          isMobileSidebarOpen ? 'flex w-[250px]' : 'hidden lg:flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="kt-sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0" id="sidebar_header">
          <a href="/dashboard" className="dark:hidden">
            <img className="default-logo min-h-[22px] max-w-none" src="/assets/media/app/default-logo.svg" alt="LivrExpress Logo" />
            <img className="small-logo min-h-[22px] max-w-none" src="/assets/media/app/default-logo.svg" alt="Logo" />
          </a>
          <a href="/dashboard" className="hidden dark:block">
            <img className="default-logo min-h-[22px] max-w-none" src="/assets/media/app/default-logo-dark.svg" alt="LivrExpress Logo" />
            <img className="small-logo min-h-[22px] max-w-none" src="/assets/media/app/default-logo-dark.svg" alt="Logo" />
          </a>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="kt-btn kt-btn-outline kt-btn-icon size-[30px] absolute start-full top-2/4 -translate-x-2/4 -translate-y-2/4 rtl:translate-x-2/4"
            id="sidebar_toggle"
          >
            <i className={`ki-filled ki-black-left-line transition-all duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}></i>
          </button>
        </div>

        {/* Sidebar Content */}
        <div 
          className="kt-sidebar-content flex flex-col grow shrink py-5 pe-2" 
          id="sidebar_content"
          style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 65px)', minHeight: 0 }}
        >
          <div 
            className="kt-scrollable-y-hover grow shrink flex flex-col ps-2 lg:ps-5 pe-1 lg:pe-3" 
            id="sidebar_scrollable"
            style={{ overflowY: 'auto', maxHeight: '100%', minHeight: 0 }}
          >
            <div className="kt-menu flex flex-col grow gap-1 pb-16" id="sidebar_menu">
              
              {/* Dashboard */}
              <div className={`kt-menu-item ${activeMenu === 'dashboard' ? 'here' : ''}`}>
                <a 
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]" 
                  href="/dashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/dashboard');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-element-11 text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">
                    {t('nav.dashboard', 'Dashboard')}
                  </span>
                </a>
              </div>

              {/* User Section Heading */}
              <div className="kt-menu-item pt-2.25 pb-px">
                <span className="kt-menu-heading uppercase text-xs font-medium text-muted-foreground ps-[10px] pe-[10px]">
                  {isLivreur ? t('nav.myDeliveries', 'Mes Livraisons') : t('nav.logisticsManagement', 'Gestion Logistique')}
                </span>
              </div>

              {/* Colis — hidden from ROLE_LIVREUR */}
              {isClientOrFull && <div className={`kt-menu-item ${isColisMenuOpen ? 'here show' : ''}`}>
                <div 
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => setIsColisMenuOpen(!isColisMenuOpen)}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-delivery-3 text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">
                    {t('nav.parcels', 'Colis')}
                  </span>
                  <span className="kt-menu-arrow text-muted-foreground w-[20px] shrink-0 justify-end ms-1 me-[-10px]">
                    <i className={`ki-filled ${isColisMenuOpen ? 'ki-minus' : 'ki-plus'} text-[11px]`}></i>
                  </span>
                </div>
                
                {isColisMenuOpen && (
                  <div className="kt-menu-accordion gap-1 ps-[10px] relative before:absolute before:start-[20px] before:top-0 before:bottom-0 before:border-s before:border-border flex flex-col">
                    <div className={`kt-menu-item ${activeMenu === 'colis_list' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/colis"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/colis'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">
                          {t('nav.parcelsList', 'Liste des colis')}
                        </span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'colis_new' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/colis/new"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/colis/new'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">
                          {t('nav.addParcel', 'Ajouter un colis')}
                        </span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'colis_pickup' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/colis/pickup"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/colis/pickup'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">
                          {t('nav.pickupParcels', 'Colis pour ramassage')}
                        </span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'colis_import' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/colis/import"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/colis/import'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">
                          {t('nav.importParcels', 'Importer Colis')}
                        </span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'colis_settings' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/colis/settings"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/colis/settings'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">
                          {t('nav.parcelSettings', 'Paramètres des colis')}
                        </span>
                      </a>
                    </div>
                  </div>
                )}
              </div>}

              {/* Stock — hidden from ROLE_LIVREUR */}
              {isClientOrFull && <div className={`kt-menu-item ${isStockMenuOpen ? 'here show' : ''}`}>
                <div
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => setIsStockMenuOpen(!isStockMenuOpen)}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-archive text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">{t('nav.stock', 'Stock')}</span>
                  <span className="kt-menu-arrow text-muted-foreground w-[20px] shrink-0 justify-end ms-1 me-[-10px]">
                    <i className={`ki-filled ${isStockMenuOpen ? 'ki-minus' : 'ki-plus'} text-[11px]`}></i>
                  </span>
                </div>
                {isStockMenuOpen && (
                  <div className="kt-menu-accordion gap-1 ps-[10px] relative before:absolute before:start-[20px] before:top-0 before:bottom-0 before:border-s before:border-border flex flex-col">
                    <div className={`kt-menu-item ${['stock_products', 'stock_products_edit'].includes(activeMenu) ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/stock/produits"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/stock/produits'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.productList', 'Liste des produits')}</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'stock_products_new' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/stock/produits/new"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/stock/produits/new'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.addProduct', 'Ajouter un produit')}</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'stock_colis' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/stock/colis"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/stock/colis'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.stockParcels', 'Colis du stock')}</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'stock_entry' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/stock/entree"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/stock/entree'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.stockEntry', 'Stock Entrée')}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>}

              {/* Ramassage — hidden from ROLE_LIVREUR */}
              {isClientOrFull && <div className={`kt-menu-item ${activeMenu.startsWith('ramassage') ? 'here show' : ''}`}>
                <div
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => setIsRamassageMenuOpen(!isRamassageMenuOpen)}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-delivery text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">{t('nav.pickup', 'Ramassage')}</span>
                  <span className="kt-menu-arrow text-muted-foreground w-[20px] shrink-0 justify-end ms-1 me-[-10px]">
                    <i className={`ki-filled ${isRamassageMenuOpen ? 'ki-minus' : 'ki-plus'} text-[11px]`}></i>
                  </span>
                </div>
                {isRamassageMenuOpen && (
                  <div className="kt-menu-accordion gap-1 ps-[10px] relative before:absolute before:start-[20px] before:top-0 before:bottom-0 before:border-s before:border-border flex flex-col">
                    <div className={`kt-menu-item ${activeMenu === 'ramassage_list' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/ramassage"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/ramassage'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.pickupList', 'Liste des ramassages')}</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'ramassage_new' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/ramassage/new"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/ramassage/new'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.newPickupRequest', 'Nouvelle demande')}</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'ramassage_planning' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/ramassage/planning"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/ramassage/planning'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.planning', 'Planification')}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>}

              {/* Bon de Livraison — always visible (ROLE_LIVREUR primary section) */}
              <div className={`kt-menu-item ${activeMenu.startsWith('bon_livraison') ? 'here show' : ''}`}>
                <div
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => setIsBonLivraisonMenuOpen(!isBonLivraisonMenuOpen)}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-directbox-default text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">{t('nav.deliverySlip', 'Bon de Livraison')}</span>
                  <span className="kt-menu-arrow text-muted-foreground w-[20px] shrink-0 justify-end ms-1 me-[-10px]">
                    <i className={`ki-filled ${isBonLivraisonMenuOpen ? 'ki-minus' : 'ki-plus'} text-[11px]`}></i>
                  </span>
                </div>
                {isBonLivraisonMenuOpen && (
                  <div className="kt-menu-accordion gap-1 ps-[10px] relative before:absolute before:start-[20px] before:top-0 before:bottom-0 before:border-s before:border-border flex flex-col">
                    <div className={`kt-menu-item ${activeMenu === 'bon_livraison_list' || activeMenu === 'bon_livraison' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/bon-livraison"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/bon-livraison'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.deliverySlipList', 'Liste bons de livraison')}</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'bon_livraison_new' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/bon-livraison/new"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/bon-livraison/new'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.addDeliverySlip', 'Ajouter Bon de Livraison')}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Suivi — hidden from ROLE_LIVREUR */}
              {isClientOrFull && <div className={`kt-menu-item ${currentActive.startsWith('suivi') || currentActive === 'dispatch-map' ? 'here show' : ''}`}>
                <div
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => setIsSuiviMenuOpen(!isSuiviMenuOpen)}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-route text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">{t('nav.tracking', 'Suivi')}</span>
                  <span className="kt-menu-arrow text-muted-foreground w-[20px] shrink-0 justify-end ms-1 me-[-10px]">
                    <i className={`ki-filled ${isSuiviMenuOpen ? 'ki-minus' : 'ki-plus'} text-[11px]`}></i>
                  </span>
                </div>
                {isSuiviMenuOpen && (
                  <div className="kt-menu-accordion gap-1 ps-[10px] relative before:absolute before:start-[20px] before:top-0 before:bottom-0 before:border-s before:border-border flex flex-col">
                    <div className={`kt-menu-item ${currentActive === 'suivi_changement_destinataire' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/suivi/changement-destinataire"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/suivi/changement-destinataire'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.changeRecipient', 'Changement destinataire')}</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${currentActive === 'suivi_whatsapp_template' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/suivi/modele-whatsapp"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/suivi/modele-whatsapp'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.whatsappTracking', 'Suivi par Whatsapp')}</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${currentActive === 'dispatch-map' || currentActive === 'suivi_carte' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/dispatch-map"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/dispatch-map'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.gpsTrackingMap', 'Carte Suivi GPS')}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>}

              {/* Retour — hidden from ROLE_LIVREUR */}
              {isClientOrFull && <div className={`kt-menu-item ${activeMenu.startsWith('retour') ? 'here show' : ''}`}>
                <div
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => setIsRetourMenuOpen(!isRetourMenuOpen)}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-delivery-time text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">{t('nav.returns', 'Retour')}</span>
                  <span className="kt-menu-arrow text-muted-foreground w-[20px] shrink-0 justify-end ms-1 me-[-10px]">
                    <i className={`ki-filled ${isRetourMenuOpen ? 'ki-minus' : 'ki-plus'} text-[11px]`}></i>
                  </span>
                </div>
                {isRetourMenuOpen && (
                  <div className="kt-menu-accordion gap-1 ps-[10px] relative before:absolute before:start-[20px] before:top-0 before:bottom-0 before:border-s before:border-border flex flex-col">
                    <div className={`kt-menu-item ${activeMenu === 'retour_demandes' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/retour/demandes"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/retour/demandes'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.returnRequest', 'Demande de retour')}</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'retour_bons' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/retour/bons"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/retour/bons'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.returnSlips', 'Bons de retour')}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>}

              {/* Facturation — hidden from ROLE_LIVREUR */}
              {isClientOrFull && <div className={`kt-menu-item ${activeMenu.startsWith('facturation') ? 'here show' : ''}`}>
                <div
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => setIsFacturationMenuOpen(!isFacturationMenuOpen)}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-bill text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">{t('nav.finances', 'Facturation')}</span>
                  <span className="kt-menu-arrow text-muted-foreground w-[20px] shrink-0 justify-end ms-1 me-[-10px]">
                    <i className={`ki-filled ${isFacturationMenuOpen ? 'ki-minus' : 'ki-plus'} text-[11px]`}></i>
                  </span>
                </div>
                {isFacturationMenuOpen && (
                  <div className="kt-menu-accordion gap-1 ps-[10px] relative before:absolute before:start-[20px] before:top-0 before:bottom-0 before:border-s before:border-border flex flex-col">
                    <div className={`kt-menu-item ${activeMenu === 'facturation_crbt' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/facturation/crbt"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/facturation/crbt'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.crbtList', 'Liste CRBT')}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>}

              {/* Clients Multi-Tenant — visible to Admin/Super Admin */}
              {isAdmin && <div className={`kt-menu-item ${currentActive.startsWith('clients') ? 'here show' : ''}`}>
                <div
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => { window.history.pushState({}, '', '/clients'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-users text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">{t('nav.clients', 'Gestion des Clients')}</span>
                </div>
              </div>}

              {/* Livreurs — visible to Admin/Super Admin only */}
              {isAdmin && <div className={`kt-menu-item ${currentActive.startsWith('livreurs') ? 'here show' : ''}`}>
                <div
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => { window.history.pushState({}, '', '/livreurs'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-user text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">{t('nav.livreurs', 'Livreurs')}</span>
                </div>
              </div>}

              {/* Affiliate — hidden from ROLE_LIVREUR */}
              {isClientOrFull && <div className={`kt-menu-item ${activeMenu === 'affiliate' ? 'active' : ''}`}>
                <a className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]" href="/affiliate"
                  onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/affiliate'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-share text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">
                    {t('nav.affiliate', 'Affiliation')}
                  </span>
                </a>
              </div>}

              {/* API — hidden from ROLE_LIVREUR */}
              {isClientOrFull && <div className={`kt-menu-item ${activeMenu === 'api_docs' ? 'active' : ''}`}>
                <a className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]" href="/api-docs"
                  onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/api-docs'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-code text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">
                    {t('nav.apiDocs', 'API')}
                  </span>
                </a>
              </div>}

              {/* Intelligence Artificielle (IA) Accordion */}
              <div className={`kt-menu-item ${currentActive.startsWith('ai') ? 'here show' : ''}`}>
                <div
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                >
                  <span className="kt-menu-icon items-start text-primary w-[20px]">
                    <i className="ki-filled ki-technology-4 text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-semibold text-foreground">
                    {t('nav.proSection', 'LivrExpress PRO')}
                    <span className="kt-badge kt-badge-primary kt-badge-outline text-[10px] px-1 py-0.2 rounded font-bold ms-1.5">PRO</span>
                  </span>
                  <span className="kt-menu-arrow text-muted-foreground w-[20px] shrink-0 justify-end ms-1 me-[-10px]">
                    <i className={`ki-filled ${isAiMenuOpen ? 'ki-minus' : 'ki-plus'} text-[11px]`}></i>
                  </span>
                </div>
                {isAiMenuOpen && (
                  <div className="kt-menu-accordion gap-1 ps-[10px] relative before:absolute before:start-[20px] before:top-0 before:bottom-0 before:border-s before:border-border flex flex-col">
                    {!isLivreur && (
                      <div className={`kt-menu-item ${currentActive === 'ai_predictions' ? 'active' : ''}`}>
                        <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/ai/prediction-retours"
                          onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/ai/prediction-retours'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                          <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                          <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.aiPredictions', 'Prédiction des retours')}</span>
                        </a>
                      </div>
                    )}
                    {!isLivreur && (
                      <div className={`kt-menu-item ${currentActive === 'ai_anomalies' ? 'active' : ''}`}>
                        <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/ai/anomalies"
                          onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/ai/anomalies'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                          <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                          <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.aiAnomalies', 'Détection des anomalies')}</span>
                        </a>
                      </div>
                    )}
                    <div className={`kt-menu-item ${currentActive === 'ai_tournees' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/ai/tournees-optimisees"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/ai/tournees-optimisees'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">{t('nav.aiOptimization', 'Optimisation de tournées')}</span>
                      </a>
                    </div>

                  </div>
                )}

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 z-15 lg:hidden"
        ></div>
      )}

      {/* Main Wrapper */}
      <div className="kt-wrapper flex grow flex-col ms-2" id="wrapper">
        {/* Header */}
        <header className="kt-header fixed top-0 z-10 start-0 end-0 flex items-stretch shrink-0 bg-background border-b border-border" id="header">
          <div className="kt-container-fixed flex justify-between items-stretch lg:gap-4 w-full" id="headerContainer">
            {/* Mobile Header elements */}
            <div className="flex gap-2.5 lg:hidden items-center -ms-1">
              <a className="shrink-0" href="/dashboard">
                <img className="max-h-[25px] w-full" src="/assets/media/app/mini-logo.svg" alt="Logo" />
              </a>
              <button 
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} 
                className="kt-btn kt-btn-icon kt-btn-ghost"
              >
                <i className="ki-filled ki-menu text-xl"></i>
              </button>
            </div>

            {/* Breadcrumb / Section Name */}
            <div className="hidden lg:flex items-center gap-2">
              <a 
                href="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/dashboard');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
              >
                {t('nav.home', 'Accueil')}
              </a>
              <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
              {activeMenu.startsWith('colis_') && (
                <>
                  <a 
                    href="/colis" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', '/colis');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    {t('nav.parcels', 'Colis')}
                  </a>
                  <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                </>
              )}
              {activeMenu.startsWith('stock_') && (
                <>
                  <a 
                    href="/stock/produits" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', '/stock/produits');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    {t('nav.stock', 'Stock')}
                  </a>
                  <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                  {['stock_products_new', 'stock_products_edit'].includes(activeMenu) && (
                    <>
                      <a 
                        href="/stock/produits" 
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState({}, '', '/stock/produits');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }}
                      >
                        {t('nav.productList', 'Liste des produits')}
                      </a>
                      <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                    </>
                  )}
                </>
              )}
              {activeMenu.startsWith('ramassage') && (
                <>
                  <a 
                    href="/ramassage" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', '/ramassage');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    {t('nav.pickup', 'Ramassage')}
                  </a>
                  <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                </>
              )}
              {activeMenu.startsWith('bon_livraison') && (
                <>
                  <a 
                    href="/bon-livraison" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', '/bon-livraison');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    {t('nav.deliverySlip', 'Bon de Livraison')}
                  </a>
                  <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                </>
              )}
              {activeMenu.startsWith('livreurs') && activeMenu !== 'livreurs_list' && activeMenu !== 'livreurs' && (
                <>
                  <a 
                    href="/livreurs" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', '/livreurs');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    {t('nav.livreurs', 'Livreurs')}
                  </a>
                  <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                </>
              )}
              {activeMenu.startsWith('ai') && activeMenu !== 'ai_suite' && (
                <>
                  <a 
                    href="/ai/prediction-retours" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', '/ai/prediction-retours');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    {t('nav.proSection', 'LivrExpress PRO')}
                  </a>
                  <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                </>
              )}
              {(activeMenu.startsWith('suivi') || activeMenu === 'dispatch-map') && (
                <>
                  <a 
                    href="/suivi/changement-destinataire" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', '/suivi/changement-destinataire');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    {t('nav.tracking', 'Suivi')}
                  </a>
                  <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                </>
              )}
              {activeMenu.startsWith('retour') && (
                <>
                  <a 
                    href="/retour/demandes" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', '/retour/demandes');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    {t('nav.returns', 'Retour')}
                  </a>
                  <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                </>
              )}
              {activeMenu.startsWith('facturation') && (
                <>
                  <a 
                    href="/facturation/crbt" 
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState({}, '', '/facturation/crbt');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                  >
                    {t('nav.finances', 'Facturation')}
                  </a>
                  <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                </>
              )}
              <span className="text-sm font-semibold text-foreground">
                {activeMenu === 'dashboard' ? t('nav.dashboard', 'Tableau de bord')
                  : activeMenu === 'colis_list' ? t('nav.parcelsList', 'Liste des colis')
                  : activeMenu === 'colis_new' ? t('nav.addParcel', 'Ajouter un colis')
                  : activeMenu === 'colis_pickup' ? t('nav.pickupParcels', 'Colis pour ramassage')
                  : activeMenu === 'colis_import' ? t('nav.importParcels', 'Importer Colis')
                  : activeMenu === 'colis_settings' ? t('nav.parcelSettings', 'Paramètres des colis')
                  : activeMenu === 'stock' ? t('nav.stock', 'Stock')
                  : activeMenu === 'stock_products' ? t('nav.productList', 'Liste des produits')
                  : activeMenu === 'stock_products_new' ? t('nav.addProduct', 'Ajouter un produit')
                  : activeMenu === 'stock_products_edit' ? t('common.edit', 'Modifier le produit')
                  : activeMenu === 'stock_entry' ? t('nav.stockEntry', 'Stock Entrée')
                  : activeMenu === 'stock_colis' ? t('nav.stockParcels', 'Colis du stock')
                  : activeMenu === 'ramassage_list' ? t('nav.pickupList', 'Liste des ramassages')
                  : activeMenu === 'ramassage_new' ? t('nav.newPickupRequest', 'Nouvelle demande de ramassage')
                  : activeMenu === 'ramassage_planning' ? t('nav.planning', 'Planification des ramassages')
                  : activeMenu === 'ramassage' ? t('nav.pickup', 'Ramassage')
                  : activeMenu === 'bon_livraison_list' || activeMenu === 'bon_livraison' ? t('nav.deliverySlipList', 'Liste bons de livraison')
                  : activeMenu === 'bon_livraison_new' ? t('nav.addDeliverySlip', 'Ajouter Bon de Livraison')
                  : activeMenu === 'livreurs_list' || activeMenu === 'livreurs' ? t('drivers.title', 'Gestion des Livreurs')
                  : activeMenu === 'livreurs_new' ? t('drivers.addDriverTitle', 'Ajouter un livreur')
                  : activeMenu === 'livreurs_fiche' ? t('drivers.ficheTitle', 'Fiche Livreur')
                  : activeMenu === 'livreurs_auto_assign' ? t('drivers.autoAssignTitle', 'Attribution des Colis')
                  : activeMenu === 'suivi_changement_destinataire' ? t('nav.changeRecipient', 'Changement destinataire')
                  : activeMenu === 'suivi_whatsapp_template' ? t('nav.whatsappTracking', 'Suivi par Whatsapp')
                  : activeMenu === 'dispatch-map' || activeMenu === 'suivi_carte' ? t('nav.gpsTrackingMap', 'Carte Suivi GPS')
                  : activeMenu === 'retour_demandes' ? t('nav.returnRequest', 'Demande de retour')
                  : activeMenu === 'retour_bons' ? t('nav.returnSlips', 'Liste des bons de retour')
                  : activeMenu === 'suivi' ? t('nav.tracking', 'Suivi')
                  : activeMenu === 'retour' ? t('nav.returns', 'Retour')
                  : activeMenu === 'facturation' ? t('nav.finances', 'Facturation')
                  : activeMenu === 'facturation_crbt' ? t('nav.crbtList', 'Liste CRBT')
                  : activeMenu === 'clients' ? t('nav.clients', 'Gestion des Clients')
                  : activeMenu === 'affiliate' ? t('nav.affiliate', 'Affiliation')
                  : activeMenu === 'api_docs' ? t('nav.apiDocs', 'Documentation API')
                  : activeMenu === 'profile' ? t('nav.myProfile', 'Profil')
                  : activeMenu === 'ai_predictions' ? t('nav.aiPredictions', 'Prédiction des retours')
                  : activeMenu === 'ai_anomalies' ? t('nav.aiAnomalies', 'Détection des anomalies')
                  : activeMenu === 'ai_tournees' ? t('nav.aiOptimization', 'Optimisation de tournées')
                  : activeMenu === 'ai_chatbot' ? t('nav.aiAssistant', 'Chatbot Livreur')
                  : activeMenu.startsWith('ai') ? t('nav.proSection', 'LivrExpress PRO')
                  : t('nav.dashboard', 'Tableau de bord')}
              </span>
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-3">
              {/* Notification Bell Dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => { setIsNotifMenuOpen(!isNotifMenuOpen); setIsUserMenuOpen(false); }}
                  className="kt-btn kt-btn-icon kt-btn-ghost text-muted-foreground hover:text-foreground relative"
                  title={t('header.notifications', 'Notifications')}
                >
                  <i className="ki-filled ki-notification-on text-lg"></i>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 size-2.5 rounded-full bg-destructive animate-pulse ring-2 ring-background"></span>
                  )}
                </button>

                {isNotifMenuOpen && (
                  <>
                    <div onClick={() => setIsNotifMenuOpen(false)} className="fixed inset-0 z-20"></div>
                    <div className="absolute end-0 top-full mt-2 w-[340px] sm:w-[380px] rounded-xl shadow-xl bg-background border border-border z-30 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-accent/30">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{t('header.notifications', 'Notifications')}</span>
                          {unreadCount > 0 && (
                            <span className="kt-badge kt-badge-primary kt-badge-outline rounded-full text-xs font-semibold px-2 py-0.5">
                              {unreadCount} {unreadCount > 1 ? t('header.newsLabel', 'nouvelles') : t('header.newLabel', 'nouvelle')}
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-primary hover:underline font-medium bg-transparent border-0 cursor-pointer"
                          >
                            {t('header.markAllRead', 'Tout marquer comme lu')}
                          </button>
                        )}
                      </div>

                      <div 
                        className="divide-y divide-border"
                        style={{
                          maxHeight: '220px',
                          overflowY: 'auto'
                        }}
                      >
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-sm text-secondary-foreground">
                            {t('header.noNotifications', 'Aucune notification')}
                          </div>
                        ) : (
                          notifications.map((rawN) => {
                            const notifMap = {
                              '1': { title: t('notifs.n1Title', rawN.title), message: t('notifs.n1Msg', rawN.message), createdAt: t('notifs.10min', rawN.createdAt) },
                              '2': { title: t('notifs.n2Title', rawN.title), message: t('notifs.n2Msg', rawN.message), createdAt: t('notifs.30min', rawN.createdAt) },
                              '3': { title: t('notifs.n3Title', rawN.title), message: t('notifs.n3Msg', rawN.message), createdAt: t('notifs.1hour', rawN.createdAt) },
                              '4': { title: t('notifs.n4Title', rawN.title), message: t('notifs.n4Msg', rawN.message), createdAt: t('notifs.yesterday', rawN.createdAt) },
                              '5': { title: t('notifs.n5Title', rawN.title), message: t('notifs.n5Msg', rawN.message), createdAt: t('notifs.yesterday', rawN.createdAt) },
                              '6': { title: t('notifs.n6Title', rawN.title), message: t('notifs.n6Msg', rawN.message), createdAt: t('notifs.2days', rawN.createdAt) },
                              '7': { title: t('notifs.n7Title', rawN.title), message: t('notifs.n7Msg', rawN.message), createdAt: t('notifs.3days', rawN.createdAt) }
                            };
                            const n = notifMap[String(rawN.id)] ? { ...rawN, ...notifMap[String(rawN.id)] } : rawN;
                            return (
                              <div
                                key={n.id}
                                onClick={() => handleNotifClick(n)}
                                className={`p-3.5 flex items-start gap-3 hover:bg-accent/50 transition-colors cursor-pointer ${!n.isRead ? 'bg-primary/5' : ''}`}
                              >
                                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                  n.type === 'success' ? 'bg-success/15 text-success' :
                                  n.type === 'warning' ? 'bg-destructive/15 text-destructive' :
                                  'bg-primary/15 text-primary'
                                }`}>
                                  <i className={`ki-filled ${n.icon || 'ki-notification-on'} text-base`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <p className={`text-xs font-semibold truncate ${!n.isRead ? 'text-foreground font-bold' : 'text-secondary-foreground'}`}>
                                      {n.title}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{n.createdAt}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                                    {n.message}
                                  </p>
                                </div>
                                {!n.isRead && (
                                  <span className="size-2 rounded-full bg-primary shrink-0 self-center"></span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="p-2.5 text-center border-t border-border bg-accent/10">
                        <button
                          onClick={() => { setIsNotifMenuOpen(false); window.history.pushState({}, '', '/colis'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                          className="text-xs font-medium text-primary hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          {t('header.viewAllActivity', "Voir toute l'activité →")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>


              {/* Theme Mode Toggle */}
              <button 
                onClick={toggleTheme} 
                className="kt-btn kt-btn-icon kt-btn-ghost text-muted-foreground hover:text-foreground"
                title="Changer le thème"
              >
                {themeMode === 'dark' ? (
                  <i className="ki-filled ki-moon text-lg"></i>
                ) : (
                  <i className="ki-filled ki-sun text-lg"></i>
                )}
              </button>

              {/* User Dropdown */}
              <div ref={userMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsUserMenuOpen(prev => !prev);
                    setIsLangMenuOpen(false);
                    setIsNotifMenuOpen(false);
                  }}
                  className="cursor-pointer shrink-0 focus:outline-none"
                >
                  {avatarUrl ? (
                    <img
                      alt="Avatar"
                      className="size-9 rounded-full ring-2 ring-border shadow-sm shrink-0 object-cover hover:ring-primary/50 transition-all"
                      src={avatarUrl}
                      onError={() => setAvatarUrl(null)}
                    />
                  ) : (
                    <div
                      className="size-9 rounded-full flex items-center justify-center font-bold text-white text-sm ring-2 ring-border shadow-sm hover:ring-primary/50 transition-all"
                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
                    >
                      {getUserInitials(user)}
                    </div>
                  )}
                </button>

                {isUserMenuOpen && (
                  <MenuErrorBoundary>
                    {/* Metronic Professional User Menu Dropdown */}
                    <div className="absolute end-0 top-full mt-2 w-[285px] rounded-xl shadow-xl bg-card border border-border/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                      
                      {/* User Info Header Banner */}
                      <div className="p-3 bg-accent/30 dark:bg-accent/10 border-b border-border/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            {avatarUrl ? (
                              <img alt="Avatar" className="size-9 rounded-full ring-2 ring-primary/20 shadow-2xs object-cover" src={avatarUrl} onError={() => setAvatarUrl(null)} />
                            ) : (
                              <div
                                className="size-9 rounded-full flex items-center justify-center font-bold text-white text-xs ring-2 ring-primary/20 shadow-2xs"
                                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                              >
                                {getUserInitials(user)}
                              </div>
                            )}
                            <span className="absolute bottom-0 end-0 size-2 bg-emerald-500 rounded-full ring-2 ring-card"></span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-foreground leading-tight truncate">
                              {getUserDisplayName(user)}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground leading-tight truncate mt-0.5">
                              {getUserDisplayEmail(user)}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSuperAdmin ? (
                            <span className="kt-badge kt-badge-sm kt-badge-primary kt-badge-outline">Super Admin</span>
                          ) : isSuperviseur ? (
                            <span className="kt-badge kt-badge-sm kt-badge-warning kt-badge-outline">Superviseur</span>
                          ) : isAdmin ? (
                            <span className="kt-badge kt-badge-sm kt-badge-info kt-badge-outline">Admin</span>
                          ) : isLivreur ? (
                            <span className="kt-badge kt-badge-sm kt-badge-success kt-badge-outline">Livreur</span>
                          ) : (
                            <span className="kt-badge kt-badge-sm kt-badge-secondary kt-badge-outline">Client</span>
                          )}
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="p-1 space-y-0.5">
                        <a
                          href="/profile"
                          className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent hover:text-primary rounded-lg transition-colors"
                          onClick={e => {
                            e.preventDefault();
                            setIsUserMenuOpen(false);
                            window.history.pushState({}, '', '/profile');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                          }}
                        >
                          <i className="ki-filled ki-profile-circle text-base text-primary/80"></i>
                          <span>{t('nav.myProfile', 'Mon Profil')}</span>
                        </a>

                        {/* Language Selector */}
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsLangMenuOpen(!isLangMenuOpen); }}
                            className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent hover:text-primary rounded-lg transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <i className="ki-filled ki-icon text-base text-muted-foreground"></i>
                              <span>{t('nav.language', 'Langue')}</span>
                            </span>

                            <span className="flex items-center gap-1 kt-badge kt-badge-stroke shrink-0 text-[10px] px-1.5 py-0.5">
                              {currentLangObj?.label || 'Français'}
                              <img alt="" className="inline-block size-3 rounded-full object-cover ms-0.5" src={currentLangObj?.flag || '/assets/media/flags/france.svg'} />
                            </span>
                          </button>

                          {isLangMenuOpen && (
                            <div className="absolute end-full top-0 me-1.5 w-[170px] rounded-lg shadow-xl bg-card border border-border z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                              {langOptions.map(({ code, label, flag }) => (
                                <button
                                  key={code}
                                  className={`flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    language === code ? 'bg-accent text-primary font-bold' : 'text-foreground hover:bg-accent'
                                  }`}
                                  onClick={() => { setLanguage(code); setIsLangMenuOpen(false); }}
                                >
                                  <span className="flex items-center gap-2">
                                    <img alt="" className="size-3.5 rounded-full object-cover" src={flag} />
                                    {label}
                                  </span>
                                  {language === code && <i className="ki-solid ki-check-circle text-primary text-sm"></i>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="border-t border-border/70 mx-2.5 my-0.5"></div>

                      {/* Dark Mode & Logout */}
                      <div className="p-2 space-y-2">
                        <div className="flex items-center justify-between px-1 py-0.5">
                          <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                            <i className="ki-filled ki-moon text-base text-muted-foreground"></i>
                            <span className="text-2sm font-medium">{t('header.darkMode', 'Mode sombre')}</span>
                          </span>

                          <button
                            onClick={toggleTheme}
                            type="button"
                            role="switch"
                            aria-checked={themeMode === 'dark'}
                            style={{
                              width: '34px',
                              height: '18px',
                              backgroundColor: themeMode === 'dark' ? '#3b82f6' : 'rgb(228, 228, 231)',
                              borderRadius: '9999px',
                              position: 'relative',
                              transition: 'background-color 0.2s',
                              border: themeMode === 'dark' ? '1px solid #3b82f6' : '1px solid rgb(212, 212, 216)',
                              cursor: 'pointer',
                              padding: 0,
                              outline: 'none'
                            }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: 'rgb(255, 255, 255)',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '2px',
                                left: themeMode === 'dark' ? '18px' : '2px',
                                transition: 'left 0.2s',
                                boxShadow: 'rgba(0, 0, 0, 0.15) 0px 1px 3px'
                              }}
                            />
                          </button>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="kt-btn kt-btn-outline kt-btn-sm justify-center w-full text-xs font-semibold gap-1.5 hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-150"
                        >
                          <i className="ki-filled ki-exit-right text-xs"></i>
                          <span>{t('nav.logout', 'Se déconnecter')}</span>
                        </button>
                      </div>

                    </div>
                  </MenuErrorBoundary>
                )}

              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-grow pb-10">
          {children}
        </div>

        {/* Footer */}
        <footer className="kt-footer border-t border-border mt-auto">
          <div className="kt-container-fixed">
            <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
              <div className="flex order-2 md:order-1 gap-2 font-normal text-sm">
                <span className="text-secondary-foreground">
                  {t('footer.copyright', '2026© Yassir - LivrExpress')}
                </span>
              </div>
              <nav className="flex order-1 md:order-2 gap-4 font-normal text-sm text-secondary-foreground">
                <a className="hover:text-primary" href="/api-docs">{t('footer.docs', 'Docs')}</a>
                <a className="hover:text-primary" href="#">{t('footer.faq', 'FAQ')}</a>
                <a className="hover:text-primary" href="#">{t('footer.support', 'Support')}</a>
                <a className="hover:text-primary" href="#">{t('footer.license', 'Licence')}</a>
              </nav>
            </div>
          </div>
        </footer>

      </div>

      {/* Super Admin AI Chatbot Widget (Floating bottom-right, visible exclusively for ROLE_SUPER_ADMIN) */}
      <SuperAdminAIChatbot />
      {/* Livreur AI Chatbot Widget (Floating bottom-right, visible exclusively for ROLE_LIVREUR) */}
      <LivreurAIChatbotWidget />
    </div>
  );
}
