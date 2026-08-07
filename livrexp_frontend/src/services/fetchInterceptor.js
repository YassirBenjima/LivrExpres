/**
 * Global Fetch Interceptor
 * Automatically intercepts all HTTP response status codes.
 * Redirects expired or unauthenticated user sessions (HTTP 401) to /login.
 * Deduplicates concurrent duplicate GET requests sent within 300ms (e.g., from React StrictMode or parallel components).
 */

const originalFetch = window.fetch;
const pendingGetRequests = new Map();

window.fetch = async function (...args) {
  const input = args[0];
  const init = args[1] || {};
  const method = (init.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase();
  const url = typeof input === 'string' ? input : input?.url || '';

  // Deduplicate concurrent GET requests to the exact same URL
  if (method === 'GET' && pendingGetRequests.has(url)) {
    try {
      const response = await pendingGetRequests.get(url);
      return response.clone();
    } catch {
      // Fall through to original fetch if previous attempt failed
    }
  }

  const fetchPromise = (async () => {
    try {
      const response = await originalFetch.apply(this, args);

      if (response.status === 401) {
        const currentPath = window.location.pathname;

        // Exclude authentication endpoints & auth routes from auto-redirect
        const isAuthEndpoint = url.includes('/api/login') || url.includes('/api/me');
        const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/forgot-password') || currentPath.startsWith('/register');

        if (!isAuthEndpoint && !isAuthPage) {
          console.warn('[AuthInterceptor] Session expirée ou non autorisée (401). Redirection vers /login...');
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('user_profile');
          window.location.href = '/login';
        }
      } else if ([502, 503, 504].includes(response.status)) {
        window.dispatchEvent(new CustomEvent('app:connection_status', {
          detail: { isOffline: true, message: 'Le serveur backend est indisponible ou en maintenance (Erreur 503).' }
        }));
      } else if (response.ok) {
        window.dispatchEvent(new CustomEvent('app:connection_status', {
          detail: { isOffline: false }
        }));
      }

      return response;
    } catch (error) {
      // Network failure (backend down, DNS error, offline)
      console.error('[NetworkError] Impossible de contacter le serveur backend:', error);
      window.dispatchEvent(new CustomEvent('app:connection_status', {
        detail: { isOffline: true, message: 'Connexion interrompue : Le serveur backend est inaccessible ou la connexion réseau est coupée.' }
      }));
      throw error;
    } finally {
      // Keep in cache for 300ms window to absorb React StrictMode & duplicate component mounts
      setTimeout(() => {
        if (pendingGetRequests.get(url) === fetchPromise) {
          pendingGetRequests.delete(url);
        }
      }, 300);
    }
  })();

  if (method === 'GET') {
    pendingGetRequests.set(url, fetchPromise);
  }

  return fetchPromise;
};
