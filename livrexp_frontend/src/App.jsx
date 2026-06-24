import React, { useState, useEffect } from 'react';
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
import ColisPickupPage from './pages/colis/ColisPickupPage';
import ColisImportPage from './pages/colis/ColisImportPage';
import ColisSettingsPage from './pages/colis/ColisSettingsPage';

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const [colisList, setColisList] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!(localStorage.getItem('auth_token') || localStorage.getItem('user'))
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

  // Check auth status
  const checkAuth = () => {
    const authed = !!(localStorage.getItem('auth_token') || localStorage.getItem('user'));
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
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Fetch both endpoints concurrently
      const [colisRes, dashRes] = await Promise.all([
        fetch('/api/colis', { headers }),
        fetch('/api/dashboard', { headers })
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

  // Check auth and load initially when route changes
  useEffect(() => {
    const authed = checkAuth();
    const isAuthRoute = [
      '/login',
      '/login-staff',
      '/register',
      '/forgot-password',
      '/reset-password/check-email',
      '/reset-password/change',
      '/reset-password/changed',
      '/'
    ].includes(currentRoute);

    const isProtectedRoute = currentRoute === '/dashboard' || currentRoute.startsWith('/colis');

    if (authed && isAuthRoute) {
      navigate('/dashboard');
    } else if (!authed && isProtectedRoute) {
      navigate('/login');
    }

    // Trigger fetch when entering a protected route to keep data up-to-date
    if (authed && isProtectedRoute && !loading) {
      const needsSpinner = colisList.length === 0;
      fetchAllData(needsSpinner);
    }
  }, [currentRoute, isAuthenticated]);

  // Background polling for real-time updates (every 8 seconds)
  useEffect(() => {
    let intervalId;
    if (isAuthenticated) {
      // Fetch once in case we don't have data
      fetchAllData(colisList.length === 0);

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
    normalizedRoute = (localStorage.getItem('auth_token') || localStorage.getItem('user')) ? '/dashboard' : '/login';
  }

  // Strip trailing slash for easier routing comparison
  if (normalizedRoute !== '/' && normalizedRoute.endsWith('/')) {
    normalizedRoute = normalizedRoute.slice(0, -1);
  }

  const renderContent = () => {
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
