/**
 * Global Fetch Interceptor
 * Automatically intercepts all HTTP response status codes.
 * Redirects expired or unauthenticated user sessions (HTTP 401) to /login.
 */

const originalFetch = window.fetch;

window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);

  if (response.status === 401) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const currentPath = window.location.pathname;

    // Exclude authentication endpoints & auth routes from auto-redirect
    const isAuthEndpoint = url.includes('/api/login') || url.includes('/api/me');
    const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/forgot-password') || currentPath.startsWith('/register');

    if (!isAuthEndpoint && !isAuthPage) {
      console.warn('[AuthInterceptor] Session expirée ou non autorisée (401). Redirection vers /login...');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_profile');
      window.location.href = '/login';
    }
  }

  return response;
};
