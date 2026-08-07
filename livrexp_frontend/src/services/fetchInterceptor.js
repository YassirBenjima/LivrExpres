/**
 * Global Fetch Interceptor
 * Automatically intercepts all HTTP response status codes.
 * Redirects expired or unauthenticated user sessions (HTTP 401) to /login.
 * Implements Stale-While-Revalidate (SWR) client caching for instantaneous (0ms) page renders.
 */

const originalFetch = window.fetch;
const pendingGetRequests = new Map();

// Helper to construct a synthetic Response from cached JSON text
function createCachedResponse(jsonText) {
  return new Response(jsonText, {
    status: 200,
    statusText: 'OK (Cached SWR)',
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT-SWR' }
  });
}

window.fetch = async function (...args) {
  const input = args[0];
  const init = args[1] || {};
  const method = (init.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase();
  const url = typeof input === 'string' ? input : input?.url || '';

  // Non-GET requests (POST, PUT, DELETE) pass through directly and purge related GET caches
  if (method !== 'GET') {
    try {
      sessionStorage.clear();
    } catch {}

    return originalFetch.apply(this, args);
  }

  // Deduplicate concurrent in-flight GET requests
  if (pendingGetRequests.has(url)) {
    try {
      const response = await pendingGetRequests.get(url);
      return response.clone();
    } catch {
      // Fall through if previous request failed
    }
  }

  // SWR: Check instant cache hit
  const cacheKey = `swr_cache:${url}`;
  let cachedData = null;
  try {
    cachedData = sessionStorage.getItem(cacheKey);
  } catch {
    cachedData = null;
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

        // Clone and update SWR cache asynchronously
        try {
          const clone = response.clone();
          const text = await clone.text();
          sessionStorage.setItem(cacheKey, text);
        } catch {
          // Ignore storage quota errors
        }
      }

      return response;
    } catch (error) {
      console.error('[NetworkError] Impossible de contacter le serveur backend:', error);
      window.dispatchEvent(new CustomEvent('app:connection_status', {
        detail: { isOffline: true, message: 'Connexion interrompue : Le serveur backend est inaccessible ou la connexion réseau est coupée.' }
      }));
      throw error;
    } finally {
      setTimeout(() => {
        if (pendingGetRequests.get(url) === fetchPromise) {
          pendingGetRequests.delete(url);
        }
      }, 300);
    }
  })();

  pendingGetRequests.set(url, fetchPromise);

  // If cached data is available, return cached response immediately for instant 0ms render,
  // while fetchPromise updates the cache in the background.
  if (cachedData) {
    return createCachedResponse(cachedData);
  }

  return fetchPromise;
};
