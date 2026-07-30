import React, { useState, useEffect } from 'react';
import { getUserRoles } from '../../hooks/useAuth';

export default function DashboardLayout({ children, activeMenu = 'dashboard' }) {
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
  const [selectedLang, setSelectedLang] = useState('Français');
  const [selectedLangFlag, setSelectedLangFlag] = useState('/assets/media/flags/france.svg');
  const [isColisMenuOpen, setIsColisMenuOpen] = useState(activeMenu.startsWith('colis'));
  const [isStockMenuOpen, setIsStockMenuOpen] = useState(activeMenu.startsWith('stock'));
  const [isRamassageMenuOpen, setIsRamassageMenuOpen] = useState(activeMenu.startsWith('ramassage'));
  const [isBonLivraisonMenuOpen, setIsBonLivraisonMenuOpen] = useState(activeMenu.startsWith('bon_livraison'));
  const [isSuiviMenuOpen, setIsSuiviMenuOpen] = useState(activeMenu.startsWith('suivi'));
  const [isRetourMenuOpen, setIsRetourMenuOpen] = useState(activeMenu.startsWith('retour'));
  const [isFacturationMenuOpen, setIsFacturationMenuOpen] = useState(activeMenu.startsWith('facturation'));
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Ignore
      }
    }

    // Check if profile is already cached in sessionStorage to prevent refetching on every page change
    const cachedProfile = sessionStorage.getItem('user_profile');
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        setAvatarUrl(parsed.avatarUrl || null);
        if (parsed.fullName) {
          setUser(prev => prev ? { ...prev, name: parsed.fullName, email: parsed.email } : prev);
        }
        return;
      } catch (e) {
        // Ignore parse error and proceed to fetch
      }
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

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
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
            <img className="small-logo min-h-[22px] max-w-none" src="/assets/media/app/mini-logo.svg" alt="Logo" />
          </a>
          <a href="/dashboard" className="hidden dark:block">
            <img className="default-logo min-h-[22px] max-w-none" src="/assets/media/app/default-logo-dark.svg" alt="LivrExpress Logo" />
            <img className="small-logo min-h-[22px] max-w-none" src="/assets/media/app/mini-logo.svg" alt="Logo" />
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
        <div className="kt-sidebar-content flex grow shrink-0 py-5 pe-2" id="sidebar_content">
          <div className="kt-scrollable-y-hover grow shrink-0 flex ps-2 lg:ps-5 pe-1 lg:pe-3" id="sidebar_scrollable">
            <div className="kt-menu flex flex-col grow gap-1" id="sidebar_menu">
              
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
                    Dashboard
                  </span>
                </a>
              </div>

              {/* User Section Heading */}
              <div className="kt-menu-item pt-2.25 pb-px">
                <span className="kt-menu-heading uppercase text-xs font-medium text-muted-foreground ps-[10px] pe-[10px]">
                  {isLivreur ? 'Mes Livraisons' : 'Utilisateur'}
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
                    Colis
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
                          Liste des colis
                        </span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'colis_new' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/colis/new"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/colis/new'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">
                          Ajouter un colis
                        </span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'colis_pickup' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/colis/pickup"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/colis/pickup'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">
                          Colis pour ramassage
                        </span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'colis_import' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/colis/import"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/colis/import'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">
                          Importer Colis
                        </span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'colis_settings' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/colis/settings"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/colis/settings'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">
                          Paramètres des colis
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
                  <span className="kt-menu-title text-sm font-medium text-foreground">Stock</span>
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
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Liste des produits</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'stock_products_new' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/stock/produits/new"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/stock/produits/new'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Ajouter un produit</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'stock_colis' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/stock/colis"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/stock/colis'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Colis du stock</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'stock_entry' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/stock/entree"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/stock/entree'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Stock Entrée</span>
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
                  <span className="kt-menu-title text-sm font-medium text-foreground">Ramassage</span>
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
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Liste des ramassages</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'ramassage_new' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/ramassage/new"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/ramassage/new'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Nouvelle demande</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'ramassage_planning' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/ramassage/planning"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/ramassage/planning'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Planification</span>
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
                  <span className="kt-menu-title text-sm font-medium text-foreground">Bon de Livraison</span>
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
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Liste bons de livraison</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'bon_livraison_new' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/bon-livraison/new"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/bon-livraison/new'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Ajouter Bon de Livraison</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Suivi — hidden from ROLE_LIVREUR */}
              {isClientOrFull && <div className={`kt-menu-item ${activeMenu.startsWith('suivi') ? 'here show' : ''}`}>
                <div
                  className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]"
                  onClick={() => setIsSuiviMenuOpen(!isSuiviMenuOpen)}
                >
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-route text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">Suivi</span>
                  <span className="kt-menu-arrow text-muted-foreground w-[20px] shrink-0 justify-end ms-1 me-[-10px]">
                    <i className={`ki-filled ${isSuiviMenuOpen ? 'ki-minus' : 'ki-plus'} text-[11px]`}></i>
                  </span>
                </div>
                {isSuiviMenuOpen && (
                  <div className="kt-menu-accordion gap-1 ps-[10px] relative before:absolute before:start-[20px] before:top-0 before:bottom-0 before:border-s before:border-border flex flex-col">
                    <div className={`kt-menu-item ${activeMenu === 'suivi_changement_destinataire' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/suivi/changement-destinataire"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/suivi/changement-destinataire'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Changement destinataire</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'suivi_whatsapp_template' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/suivi/modele-whatsapp"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/suivi/modele-whatsapp'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Suivi par Whatsapp</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'dispatch-map' || activeMenu === 'suivi_carte' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/dispatch-map"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/dispatch-map'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">📍 Carte Suivi GPS</span>
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
                  <span className="kt-menu-title text-sm font-medium text-foreground">Retour</span>
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
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Demande de retour</span>
                      </a>
                    </div>
                    <div className={`kt-menu-item ${activeMenu === 'retour_bons' ? 'active' : ''}`}>
                      <a className="kt-menu-link border border-transparent items-center grow kt-menu-item-active:bg-accent/60 dark:menu-item-active:border-border kt-menu-item-active:rounded-lg hover:bg-accent/60 hover:rounded-lg gap-[14px] ps-[10px] pe-[10px] py-[8px]" href="/retour/bons"
                        onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/retour/bons'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                        <span className="kt-menu-bullet flex w-[6px] -start-[3px] rtl:start-0 relative before:absolute before:top-0 before:size-[6px] before:rounded-full rtl:before:translate-x-1/2 before:-translate-y-1/2 kt-menu-item-active:before:bg-primary kt-menu-item-hover:before:bg-primary"></span>
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Bons de retour</span>
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
                  <span className="kt-menu-title text-sm font-medium text-foreground">Facturation</span>
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
                        <span className="kt-menu-title text-2sm font-normal text-foreground kt-menu-item-active:text-primary kt-menu-item-active:font-semibold kt-menu-link-hover:!text-primary">Liste CRBT</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>}

              {/* Affiliate — hidden from ROLE_LIVREUR */}
              {isClientOrFull && <div className={`kt-menu-item ${activeMenu === 'affiliate' ? 'active' : ''}`}>
                <a className="kt-menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] ps-[10px] pe-[10px] py-[6px]" href="/affiliate"
                  onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/affiliate'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                  <span className="kt-menu-icon items-start text-muted-foreground w-[20px]">
                    <i className="ki-filled ki-share text-lg"></i>
                  </span>
                  <span className="kt-menu-title text-sm font-medium text-foreground">
                    Affiliate
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
                    API
                  </span>
                </a>
              </div>}

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
                Accueil
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
                    Colis
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
                    Stock
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
                        Liste des produits
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
                    Ramassage
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
                    Bon de Livraison
                  </a>
                  <i className="ki-filled ki-right text-xs text-muted-foreground"></i>
                </>
              )}
              <span className="text-sm font-semibold text-foreground">
                {activeMenu === 'dashboard' ? 'Tableau de bord'
                  : activeMenu === 'colis_list' ? 'Liste des colis'
                  : activeMenu === 'colis_new' ? 'Ajouter un colis'
                  : activeMenu === 'colis_pickup' ? 'Colis pour ramassage'
                  : activeMenu === 'colis_import' ? 'Importer Colis'
                  : activeMenu === 'colis_settings' ? 'Paramètres des colis'
                  : activeMenu === 'stock' ? 'Stock'
                  : activeMenu === 'stock_products' ? 'Liste des produits'
                  : activeMenu === 'stock_products_new' ? 'Ajouter un produit'
                  : activeMenu === 'stock_products_edit' ? 'Modifier le produit'
                  : activeMenu === 'stock_entry' ? 'Stock Entrée'
                  : activeMenu === 'stock_colis' ? 'Colis du stock'
                  : activeMenu === 'ramassage_list' ? 'Liste des ramassages'
                  : activeMenu === 'ramassage_new' ? 'Nouvelle demande de ramassage'
                  : activeMenu === 'ramassage_planning' ? 'Planification des ramassages'
                  : activeMenu === 'ramassage' ? 'Ramassage'
                  : activeMenu === 'bon_livraison_list' || activeMenu === 'bon_livraison' ? 'Liste bons de livraison'
                  : activeMenu === 'bon_livraison_new' ? 'Ajouter Bon de Livraison'
                  : activeMenu === 'suivi' ? 'Suivi'
                  : activeMenu === 'retour' ? 'Retour'
                  : activeMenu === 'facturation' ? 'Facturation'
                  : activeMenu === 'facturation_crbt' ? 'Liste CRBT'
                  : activeMenu === 'affiliate' ? 'Affiliate'
                  : activeMenu === 'api_docs' ? 'Documentation API'
                  : activeMenu === 'profile' ? 'Profil'
                  : 'Tableau de bord'}
              </span>
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-3">
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
              <div className="relative shrink-0">
                <button
                  onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsLangMenuOpen(false); }}
                  className="cursor-pointer shrink-0 focus:outline-none"
                >
                  {avatarUrl ? (
                    <img
                      alt="Avatar"
                      className="size-9 rounded-full ring-2 ring-border shadow-sm shrink-0 object-cover hover:ring-primary/50 transition-all"
                      src={avatarUrl}
                    />
                  ) : (
                    <div
                      className="size-9 rounded-full flex items-center justify-center font-bold text-white text-sm ring-2 ring-border shadow-sm hover:ring-primary/50 transition-all"
                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
                    >
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : user?.email ? user.email.slice(0, 2).toUpperCase() : 'LE'}
                    </div>
                  )}
                </button>

                {isUserMenuOpen && (
                  <>
                    {/* Overlay to close on outside click */}
                    <div
                      onClick={() => { setIsUserMenuOpen(false); setIsLangMenuOpen(false); }}
                      className="fixed inset-0 z-20"
                    ></div>

                    {/* Dropdown panel */}
                    <div className="absolute end-0 top-full mt-2 w-[300px] rounded-lg shadow-xl bg-background border border-border z-30 overflow-hidden">

                      {/* User info header */}
                      <div className="flex items-center justify-between px-2.5 py-2 gap-1.5">
                        <div className="flex items-center gap-2">
                          {avatarUrl ? (
                            <img alt="Avatar" className="size-9 shrink-0 rounded-full ring-2 ring-border shadow-sm object-cover" src={avatarUrl} />
                          ) : (
                            <div
                              className="size-9 rounded-full flex items-center justify-center font-bold text-white text-sm ring-2 ring-border shadow-sm"
                              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
                            >
                              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : user?.email ? user.email.slice(0, 2).toUpperCase() : 'LE'}
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-foreground font-semibold leading-none">
                              {user?.name || user?.email?.split('@')[0] || 'Utilisateur'}
                            </span>
                            <span className="text-xs text-secondary-foreground font-medium leading-none">
                              {user?.email || 'demo@livrexpress.ma'}
                            </span>
                          </div>
                        </div>
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

                      {/* Separator */}
                      <div className="border-t border-border mx-2.5"></div>

                      {/* Profile link */}
                      <div className="py-1">
                        <a
                          href="/profile"
                          className="flex items-center gap-2 px-2.5 py-2 text-sm text-foreground hover:bg-accent rounded-md mx-1"
                          onClick={e => {
                            e.preventDefault();
                            setIsUserMenuOpen(false);
                            window.history.pushState({}, '', '/profile');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                          }}
                        >
                          <i className="ki-filled ki-profile-circle text-base"></i>
                          Mon Profil
                        </a>

                        {/* Language selector */}
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsLangMenuOpen(!isLangMenuOpen); }}
                            className="flex items-center justify-between w-full px-2.5 py-2 text-sm text-foreground hover:bg-accent rounded-md mx-1"
                            style={{ width: 'calc(100% - 8px)' }}
                          >
                            <span className="flex items-center gap-2">
                              <i className="ki-filled ki-icon text-base"></i>
                              Langue
                            </span>
                            <span className="flex items-center gap-1 kt-badge kt-badge-stroke shrink-0">
                              {selectedLang}
                              <img alt="" className="inline-block size-3.5 rounded-full" src={selectedLangFlag} />
                            </span>
                          </button>

                          {isLangMenuOpen && (
                            <div className="absolute end-full top-0 me-1 w-[180px] rounded-md shadow-lg bg-background border border-border z-40 py-1">
                              {[
                                { label: 'Français', flag: '/assets/media/flags/france.svg' },
                                { label: 'Anglais', flag: '/assets/media/flags/united-states.svg' },
                                { label: 'Arabe', flag: '/assets/media/flags/saudi-arabia.svg' },
                              ].map(({ label, flag }) => (
                                <button
                                  key={label}
                                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-foreground hover:bg-accent"
                                  onClick={() => { setSelectedLang(label); setSelectedLangFlag(flag); setIsLangMenuOpen(false); }}
                                >
                                  <span className="flex items-center gap-2">
                                    <img alt="" className="inline-block size-4 rounded-full" src={flag} />
                                    {label}
                                  </span>
                                  {selectedLang === label && <i className="ki-solid ki-check-circle text-green-500 text-base"></i>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="border-t border-border mx-2.5 my-1"></div>

                      {/* Dark mode + Logout */}
                      <div className="px-2.5 pt-1 pb-2.5 flex flex-col gap-3">
                        <div className="flex items-center gap-2 justify-between">
                          <span className="flex items-center gap-2">
                            <i className="ki-filled ki-moon text-base text-muted-foreground"></i>
                            <span className="font-medium text-2sm">Mode sombre</span>
                          </span>
                          <button
                            onClick={toggleTheme}
                            type="button"
                            role="switch"
                            aria-checked={themeMode === 'dark'}
                            style={{
                              width: '36px',
                              height: '20px',
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
                                width: '14px',
                                height: '14px',
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
                          className="kt-btn kt-btn-outline justify-center w-full text-sm"
                        >
                          Se déconnecter
                        </button>
                      </div>
                    </div>
                  </>
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
                  2026© Yassir
                </span>
              </div>
              <nav className="flex order-1 md:order-2 gap-4 font-normal text-sm text-secondary-foreground">
                <a className="hover:text-primary" href="https://keenthemes.com/metronic/tailwind/docs" target="_blank" rel="noopener noreferrer">Docs</a>
                <a className="hover:text-primary" href="https://1.envato.market/Vm7VRE" target="_blank" rel="noopener noreferrer">Purchase</a>
                <a className="hover:text-primary" href="https://keenthemes.com/metronic/tailwind/docs/getting-started/license" target="_blank" rel="noopener noreferrer">FAQ</a>
                <a className="hover:text-primary" href="https://devs.keenthemes.com/" target="_blank" rel="noopener noreferrer">Support</a>
                <a className="hover:text-primary" href="https://keenthemes.com/metronic/tailwind/docs/getting-started/license" target="_blank" rel="noopener noreferrer">License</a>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
