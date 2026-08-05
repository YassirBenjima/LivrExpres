import { useState, useEffect, useCallback } from 'react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [message, setMessage] = useState('Connexion réseau interrompue. Le serveur est inaccessible.');
  const [isRetrying, setIsRetrying] = useState(false);
  const [reconnectedToast, setReconnectedToast] = useState(false);

  const triggerReconnectedToast = useCallback(() => {
    setReconnectedToast(true);
    setTimeout(() => {
      setReconnectedToast(false);
    }, 4000);
  }, []);

  const checkServerHealth = useCallback(async () => {
    setIsRetrying(true);
    try {
      const res = await fetch('/api/cities', { method: 'GET' });
      if (res.ok) {
        setIsOffline(false);
        triggerReconnectedToast();
      } else {
        setIsOffline(true);
      }
    } catch {
      setIsOffline(true);
      setMessage('Le serveur backend est toujours inaccessible.');
    } finally {
      setIsRetrying(false);
    }
  }, [triggerReconnectedToast]);

  useEffect(() => {
    const handleOnline = () => {
      checkServerHealth();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setMessage('Votre connexion Internet est coupée.');
    };

    const handleConnectionStatus = (e) => {
      if (e.detail?.isOffline) {
        setIsOffline(true);
        if (e.detail?.message) setMessage(e.detail.message);
      } else {
        if (isOffline) {
          setIsOffline(false);
          triggerReconnectedToast();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('app:connection_status', handleConnectionStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('app:connection_status', handleConnectionStatus);
    };
  }, [checkServerHealth, isOffline, triggerReconnectedToast]);

  if (!isOffline && !reconnectedToast) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[9999] transition-all duration-300">
      {isOffline ? (
        <div className="bg-red-600 text-white px-4 py-2.5 shadow-xl flex items-center justify-between gap-3 animate-pulse-short border-b border-red-700">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <i className="ki-filled ki-wifi-home text-lg shrink-0"></i>
            <span>{message}</span>
          </div>
          <button
            onClick={checkServerHealth}
            disabled={isRetrying}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <i className={`ki-filled ki-arrows-loop text-xs ${isRetrying ? 'animate-spin' : ''}`}></i>
            {isRetrying ? 'Vérification...' : 'Réessayer'}
          </button>
        </div>
      ) : reconnectedToast ? (
        <div className="bg-emerald-600 text-white px-4 py-2 shadow-xl flex items-center justify-between gap-3 border-b border-emerald-700">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <i className="ki-solid ki-check-circle text-lg"></i>
            <span>Connexion au serveur LivrExpress rétablie !</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
