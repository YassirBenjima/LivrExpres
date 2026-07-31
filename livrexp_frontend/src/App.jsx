import React, { useState, useEffect } from 'react';
import { getUserRoles } from './hooks/useAuth';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoginStaffPage from './pages/auth/LoginStaffPage';
import CheckEmailPage from './pages/auth/CheckEmailPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import PasswordChangedPage from './pages/auth/PasswordChangedPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ColisListPage from './pages/colis/ColisListPage';
import ColisNewPage from './pages/colis/ColisNewPage';
import ColisEditPage from './pages/colis/ColisEditPage';
import ColisPickupPage from './pages/colis/ColisPickupPage';
import ColisImportPage from './pages/colis/ColisImportPage';
import ColisSettingsPage from './pages/colis/ColisSettingsPage';
import StockProductsPage from './pages/stock/StockProductsPage';
import StockProductNewPage from './pages/stock/StockProductNewPage';
import StockProductEditPage from './pages/stock/StockProductEditPage';
import StockEntryPage from './pages/stock/StockEntryPage';
import StockColisPage from './pages/stock/StockColisPage';
import StockStickerPage from './pages/stock/StockStickerPage';
import RamassageListPage from './pages/ramassage/RamassageListPage';
import RamassageNewPage from './pages/ramassage/RamassageNewPage';
import RamassagePlanningPage from './pages/ramassage/RamassagePlanningPage';
import BonLivraisonListPage from './pages/bon_livraison/BonLivraisonListPage';
import BonLivraisonNewPage from './pages/bon_livraison/BonLivraisonNewPage';
import TrackingChangeRecipientPage from './pages/tracking/TrackingChangeRecipientPage';
import TrackingWhatsappTemplatePage from './pages/tracking/TrackingWhatsappTemplatePage';
import RetourDemandeListPage from './pages/retour/RetourDemandeListPage';
import RetourDemandeNewPage from './pages/retour/RetourDemandeNewPage';
import RetourBonsListPage from './pages/retour/RetourBonsListPage';
import FacturationCrbtPage from './pages/facturation/FacturationCrbtPage';
import AffiliatePage from './pages/affiliate/AffiliatePage';
import ApiDocsPage from './pages/api_docs/ApiDocsPage';
import ProfilePage from './pages/profile/ProfilePage';
import DispatchMapPage from './pages/dispatch/DispatchMapPage';
import LivreurListPage from './pages/livreur/LivreurListPage';
import LivreurNewPage from './pages/livreur/LivreurNewPage';
import LivreurFichePage from './pages/livreur/LivreurFichePage';
import LivreurAutoAssignPage from './pages/livreur/LivreurAutoAssignPage';
import OfflineBanner from './components/ui/OfflineBanner';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const [colisList, setColisList] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('user')
  );
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    // Automatically clear after 4 seconds
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
  };

  // Routes accessible to ROLE_LIVREUR
  const LIVREUR_ALLOWED_ROUTES = [
    '/dashboard',
    '/bon-livraison',
    '/bon-livraison/new',
    '/dispatch-map',
    '/profile',
  ];

  // Returns true if the path is allowed for ROLE_LIVREUR
  const isAllowedForLivreur = (path) => {
    return LIVREUR_ALLOWED_ROUTES.some(allowed =>
      path === allowed || path.startsWith(allowed + '/')
    );
  };



  // Check auth status
  const checkAuth = () => {
    const authed = !!localStorage.getItem('user');
    if (authed !== isAuthenticated) {
      setIsAuthenticated(authed);
      if (!authed) {
        setColisList([]);
        setDashboardData(null);
      }
    }
    return authed;
  };

  // Master fetch function
  const fetchAllData = async (showLoadingSpinner = false) => {
    const authed = checkAuth();
    if (!authed) return;

    if (showLoadingSpinner) {
      setLoading(true);
    }

    try {
      const headers = {
        'Accept': 'application/json'
      };

      // Fetch both endpoints concurrently using credentials: 'include' for HttpOnly cookie auth
      const [colisRes, dashRes] = await Promise.all([
        fetch('/api/colis', { headers, credentials: 'include' }),
        fetch('/api/dashboard', { headers, credentials: 'include' })
      ]);

      if (colisRes.ok) {
        const json = await colisRes.json();
        setColisList(Array.isArray(json) ? json : (json.colis_list || []));
      }

      if (dashRes.ok) {
        const json = await dashRes.json();
        setDashboardData(json);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données en temps réel:', err);
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  // Check auth and apply global route guarding when route changes
  useEffect(() => {
    const authed = checkAuth();
    
    // Auth-only public routes
    const PUBLIC_AUTH_ROUTES = [
      '/login',
      '/login-staff',
      '/register',
      '/forgot-password',
      '/reset-password/check-email',
      '/reset-password/change',
      '/reset-password/changed',
    ];

    const isAuthRoute = PUBLIC_AUTH_ROUTES.includes(currentRoute) || currentRoute === '/';

    const roles = getUserRoles();
    const isLivreur = roles.includes('ROLE_LIVREUR');

    // 1. Unauthenticated users: block access to all protected app routes -> redirect to /login
    if (!authed && !isAuthRoute) {
      navigate('/login');
      return;
    }

    // 2. Authenticated users: prevent returning to login/auth pages -> redirect to home route
    if (authed && isAuthRoute) {
      if (isLivreur) {
        navigate('/bon-livraison');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    // 3. Role-Based Access Control (RBAC): restrict ROLE_LIVREUR from forbidden modules (/stock, /facturation, /colis, etc.)
    if (authed && isLivreur && !isAllowedForLivreur(currentRoute)) {
      navigate('/bon-livraison');
      return;
    }

    // Trigger fetch when entering a protected route to keep data up-to-date
    if (authed && !loading) {
      const needsSpinner = colisList.length === 0;
      fetchAllData(needsSpinner);
    }
  }, [currentRoute, isAuthenticated]);

  // Background polling for real-time updates (every 8 seconds)
  useEffect(() => {
    let intervalId;
    if (isAuthenticated) {
      intervalId = setInterval(() => {
        fetchAllData(false);
      }, 8000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated]);

  // Dynamic document title update based on route
  useEffect(() => {
    let title = 'LivrExpress';
    let route = currentRoute;
    if (route !== '/' && route.endsWith('/')) {
      route = route.slice(0, -1);
    }
    
    if (route.match(/^\/stock\/produits\/([^/]+)\/edit$/)) {
      document.title = 'Modifier un produit - LivrExpress';
      return;
    }
    
    if (route.match(/^\/colis\/([^/]+)\/edit$/)) {
      document.title = 'Modifier le colis - LivrExpress';
      return;
    }

    if (route.match(/^\/stock\/produits\/variant\/([^/]+)\/sticker$/) || route.match(/^\/stock\/produits\/([^/]+)\/sticker$/)) {
      document.title = 'Sticker - LivrExpress';
      return;
    }
    
    switch (route) {
      case '/dashboard':
        title = 'Tableau de Bord - LivrExpress';
        break;
      case '/colis':
        title = 'Liste des colis - LivrExpress';
        break;
      case '/colis/new':
        title = 'Ajouter un colis - LivrExpress';
        break;
      case '/colis/pickup':
        title = 'Colis pour ramassage - LivrExpress';
        break;
      case '/colis/import':
        title = 'Importer Colis - LivrExpress';
        break;
      case '/colis/settings':
        title = 'Paramètres des colis - LivrExpress';
        break;
      case '/stock/produits':
        title = 'Liste des produits - LivrExpress';
        break;
      case '/stock/produits/new':
        title = 'Ajouter un produit - LivrExpress';
        break;
      case '/stock/entree':
        title = 'Stock Entrée - LivrExpress';
        break;
      case '/stock/colis':
        title = 'Colis du stock - LivrExpress';
        break;
      case '/ramassage':
        title = 'Liste des ramassages - LivrExpress';
        break;
      case '/ramassage/new':
        title = 'Nouvelle demande de ramassage - LivrExpress';
        break;
      case '/ramassage/planning':
        title = 'Planification des ramassages - LivrExpress';
        break;
      case '/suivi/changement-destinataire':
        title = 'Changement destinataire - LivrExpress';
        break;
      case '/suivi/modele-whatsapp':
        title = 'Suivi par Whatsapp - LivrExpress';
        break;
      case '/retour/demandes':
        title = 'Demandes de retour - LivrExpress';
        break;
      case '/retour/demandes/new':
        title = 'Nouvelle demande de retour - LivrExpress';
        break;
      case '/retour/bons':
        title = 'Bons de retour - LivrExpress';
        break;
      case '/facturation/crbt':
        title = 'Facturation CRBT - LivrExpress';
        break;
      case '/affiliate':
        title = 'Affiliate - LivrExpress';
        break;
      case '/api-docs':
        title = 'Documentation API - LivrExpress';
        break;
      case '/profile':
        title = 'Mon Profil - LivrExpress';
        break;
      case '/login':
        title = 'Connexion - LivrExpress';
        break;
      case '/login-staff':
        title = 'Connexion Staff - LivrExpress';
        break;
      case '/register':
        title = 'Inscription - LivrExpress';
        break;
      case '/forgot-password':
        title = 'Mot de passe oublié - LivrExpress';
        break;
      case '/reset-password/check-email':
      case '/reset-password/change':
      case '/reset-password/changed':
        title = 'Réinitialiser le mot de passe - LivrExpress';
        break;
      default:
        title = 'LivrExpress';
    }
    document.title = title;
  }, [currentRoute]);

  let normalizedRoute = currentRoute;
  if (normalizedRoute === '/') {
    normalizedRoute = localStorage.getItem('user') ? '/dashboard' : '/login';
  }

  // Strip trailing slash for easier routing comparison
  if (normalizedRoute !== '/' && normalizedRoute.endsWith('/')) {
    normalizedRoute = normalizedRoute.slice(0, -1);
  }

  // Handle dynamic routing for product editing
  const productEditMatch = normalizedRoute.match(/^\/stock\/produits\/([^/]+)\/edit$/);
  const editProductId = productEditMatch ? productEditMatch[1] : null;

  // Handle dynamic routing for parcel editing
  const colisEditMatch = normalizedRoute.match(/^\/colis\/([^/]+)\/edit$/);
  const editColisId = colisEditMatch ? colisEditMatch[1] : null;

  // Handle dynamic routing for stickers
  const variantStickerMatch = normalizedRoute.match(/^\/stock\/produits\/variant\/([^/]+)\/sticker$/);
  const stickerVariantId = variantStickerMatch ? variantStickerMatch[1] : null;

  const productStickerMatch = normalizedRoute.match(/^\/stock\/produits\/([^/]+)\/sticker$/);
  const stickerProductId = productStickerMatch && !variantStickerMatch ? productStickerMatch[1] : null;

  // Handle dynamic routing for bon de livraison editing
  const bonLivraisonEditMatch = normalizedRoute.match(/^\/bon-livraison\/([^/]+)\/edit$/);
  const editBonId = bonLivraisonEditMatch ? bonLivraisonEditMatch[1] : null;

  // Handle dynamic routing for livreur detail page
  const livreurFicheMatch = normalizedRoute.match(/^\/livreurs\/(\d+)$/);
  const livreurFicheId = livreurFicheMatch ? livreurFicheMatch[1] : null;

  const livreurEditMatch = normalizedRoute.match(/^\/livreurs\/(\d+)\/edit$/);
  const livreurEditId = livreurEditMatch ? livreurEditMatch[1] : null;

  const livreurTourneeMatch = normalizedRoute.match(/^\/livreurs\/(\d+)\/tournee$/);
  const livreurTourneeId = livreurTourneeMatch ? livreurTourneeMatch[1] : null;

  const renderContent = () => {
    if (editProductId) {
      return <StockProductEditPage productId={editProductId} navigate={navigate} showNotification={showNotification} />;
    }

    if (editColisId) {
      return <ColisEditPage colisId={editColisId} navigate={navigate} colisList={colisList} showNotification={showNotification} />;
    }

    if (editBonId) {
      return <BonLivraisonNewPage bonId={editBonId} navigate={navigate} showNotification={showNotification} />;
    }

    if (stickerVariantId) {
      return <StockStickerPage navigate={navigate} id={stickerVariantId} isVariant={true} showNotification={showNotification} />;
    }

    if (stickerProductId) {
      return <StockStickerPage navigate={navigate} id={stickerProductId} isVariant={false} showNotification={showNotification} />;
    }

    if (livreurFicheId && !livreurEditId && !livreurTourneeId) {
      return <LivreurFichePage livreurId={livreurFicheId} navigate={navigate} showNotification={showNotification} />;
    }

    if (livreurTourneeId) {
      return <LivreurFichePage livreurId={livreurTourneeId} navigate={navigate} showNotification={showNotification} />;
    }

    switch (normalizedRoute) {
      case '/dashboard':
        return (
          <DashboardPage 
            navigate={navigate} 
            dashboardData={dashboardData} 
            loading={loading && !dashboardData} 
            refetchData={() => fetchAllData(true)} 
          />
        );
      case '/colis':
        return (
          <ColisListPage 
            navigate={navigate} 
            colisList={colisList} 
            loading={loading && colisList.length === 0} 
            refetchData={() => fetchAllData(true)} 
            showNotification={showNotification}
          />
        );
      case '/colis/new':
        return <ColisNewPage navigate={navigate} colisList={colisList} showNotification={showNotification} />;
      case '/colis/pickup':
        return <ColisPickupPage navigate={navigate} showNotification={showNotification} />;
      case '/colis/import':
        return <ColisImportPage navigate={navigate} showNotification={showNotification} />;
      case '/colis/settings':
        return <ColisSettingsPage navigate={navigate} showNotification={showNotification} />;
      case '/stock/produits':
        return <StockProductsPage navigate={navigate} showNotification={showNotification} />;
      case '/stock/produits/new':
        return <StockProductNewPage navigate={navigate} showNotification={showNotification} />;
      case '/stock/entree':
        return <StockEntryPage navigate={navigate} showNotification={showNotification} />;
      case '/stock/colis':
        return <StockColisPage navigate={navigate} showNotification={showNotification} />;
      case '/ramassage':
        return <RamassageListPage navigate={navigate} showNotification={showNotification} />;
      case '/ramassage/new':
        return <RamassageNewPage navigate={navigate} showNotification={showNotification} />;
      case '/ramassage/planning':
        return <RamassagePlanningPage navigate={navigate} showNotification={showNotification} />;
      case '/bon-livraison':
        return <BonLivraisonListPage navigate={navigate} showNotification={showNotification} />;
      case '/bon-livraison/new':
        return <BonLivraisonNewPage navigate={navigate} showNotification={showNotification} />;
      case '/suivi/changement-destinataire':
        return <TrackingChangeRecipientPage navigate={navigate} showNotification={showNotification} />;
      case '/suivi/modele-whatsapp':
        return <TrackingWhatsappTemplatePage navigate={navigate} showNotification={showNotification} />;
      case '/retour/demandes':
      case '/retour/demande':
        return <RetourDemandeListPage navigate={navigate} showNotification={showNotification} />;
      case '/retour/demandes/new':
        return <RetourDemandeNewPage navigate={navigate} showNotification={showNotification} />;
      case '/retour/bons':
        return <RetourBonsListPage navigate={navigate} showNotification={showNotification} />;
      case '/facturation/crbt':
      case '/facturation':
        return <FacturationCrbtPage navigate={navigate} showNotification={showNotification} />;
      case '/affiliate':
        return <AffiliatePage navigate={navigate} showNotification={showNotification} />;
      case '/api-docs':
        return <ApiDocsPage navigate={navigate} showNotification={showNotification} />;
      case '/dispatch-map':
      case '/suivi/carte':
        return <DispatchMapPage navigate={navigate} showNotification={showNotification} />;
      case '/livreurs':
        return <LivreurListPage navigate={navigate} showNotification={showNotification} />;
      case '/livreurs/new':
        return <LivreurNewPage navigate={navigate} showNotification={showNotification} />;
      case '/livreurs/auto-assign':
        return <LivreurAutoAssignPage navigate={navigate} showNotification={showNotification} />;
      case '/profile':
        return <ProfilePage navigate={navigate} showNotification={showNotification} />;
      case '/register':
        return <RegisterPage navigate={navigate} />;
      case '/forgot-password':
        return <ForgotPasswordPage navigate={navigate} />;
      case '/login-staff':
        return <LoginStaffPage navigate={navigate} />;
      case '/reset-password/check-email':
        return <CheckEmailPage navigate={navigate} />;
      case '/reset-password/change':
        return <ChangePasswordPage navigate={navigate} />;
      case '/reset-password/changed':
        return <PasswordChangedPage navigate={navigate} />;
      case '/login':
      default:
        return <LoginPage navigate={navigate} />;
    }
  };

  return (
    <>
      <OfflineBanner />
      <style>{`
        .custom-toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 380px;
          width: 100%;
          pointer-events: auto;
        }

        .custom-toast {
          background-color: #ffffff;
          border-left: 4px solid;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: start;
          gap: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e4e6ef;
          transition: all 0.3s ease-out;
          animation: toastSlideIn 0.3s ease-out forwards;
        }

        .custom-toast.success {
          border-left-color: #27d37f;
        }

        .custom-toast.error {
          border-left-color: #f1416c;
        }

        .custom-toast-icon-container {
          border-radius: 9999px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .custom-toast-icon-container.success {
          background-color: rgba(39, 211, 127, 0.1);
          color: #27d37f;
        }

        .custom-toast-icon-container.error {
          background-color: rgba(241, 65, 108, 0.1);
          color: #f1416c;
        }

        .custom-toast-content {
          flex: 1;
          min-width: 0;
        }

        .custom-toast-title {
          font-size: 14px;
          font-weight: 600;
          color: #181c32;
          margin: 0;
        }

        .custom-toast-message {
          font-size: 12px;
          color: #7e8299;
          margin-top: 2px;
          word-break: break-all;
        }

        .custom-toast-close {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #a1a5b7;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .custom-toast-close:hover {
          background-color: #f5f8fa;
          color: #181c32;
        }

        @keyframes toastSlideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      {renderContent()}
      {notification && (
        <div className="custom-toast-container">
          <div className={`custom-toast ${notification.type}`}>
            <div className={`custom-toast-icon-container ${notification.type}`}>
              <i className={`ki-filled ${
                notification.type === 'success' ? 'ki-check' : 'ki-information'
              } text-base`}></i>
            </div>
            <div className="custom-toast-content">
              <h4 className="custom-toast-title">
                {notification.type === 'success' ? 'Succès' : 'Erreur'}
              </h4>
              <p className="custom-toast-message">
                {notification.message}
              </p>
            </div>
            <button 
              onClick={() => setNotification(null)} 
              className="custom-toast-close"
            >
              <i className="ki-filled ki-cross text-sm"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
