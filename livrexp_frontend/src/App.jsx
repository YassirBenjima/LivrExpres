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

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('auth_token') || localStorage.getItem('user');
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

    if (isAuthenticated && isAuthRoute) {
      navigate('/dashboard');
    } else if (!isAuthenticated && isProtectedRoute) {
      navigate('/login');
    }
  }, [currentRoute]);

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
      return <DashboardPage navigate={navigate} />;
    case '/colis':
      return <ColisListPage navigate={navigate} />;
    case '/colis/new':
      return <ColisNewPage navigate={navigate} />;
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
