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

    // Trigger initial fetch when entering a protected route if we don't have data yet
    if (authed && isProtectedRoute && colisList.length === 0 && !loading) {
      fetchAllData(true);
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

  let normalizedRoute = currentRoute;
  if (normalizedRoute === '/') {
    normalizedRoute = (localStorage.getItem('auth_token') || localStorage.getItem('user')) ? '/dashboard' : '/login';
  }

  // Strip trailing slash for easier routing comparison
  if (normalizedRoute !== '/' && normalizedRoute.endsWith('/')) {
    normalizedRoute = normalizedRoute.slice(0, -1);
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
        />
      );
    case '/colis/new':
      return <ColisNewPage navigate={navigate} colisList={colisList} />;
    case '/colis/pickup':
      return <ColisPickupPage navigate={navigate} />;
    case '/colis/import':
      return <ColisImportPage navigate={navigate} />;
    case '/colis/settings':
      return <ColisSettingsPage navigate={navigate} />;
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
}

export default App;
