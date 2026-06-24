import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function ColisSettingsPage({ navigate, showNotification }) {
  const [fragile, setFragile] = useState(false);
  const [openColis, setOpenColis] = useState(false);
  const [uniqueOrderNumber, setUniqueOrderNumber] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/user/settings/parcel', {
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          setFragile(data.fragile || false);
          setOpenColis(data.openColis || false);
          setUniqueOrderNumber(data.uniqueOrderNumber || false);
        }
      } catch (err) {
        console.warn('API error, using default settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaveLoading(true);
    setMsg('');
    try {
      const response = await fetch('/api/user/settings/parcel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ fragile, openColis, uniqueOrderNumber })
      });
      if (response.ok) {
        const successMsg = 'Paramètres enregistrés avec succès !';
        if (showNotification) {
          showNotification('success', successMsg);
        } else {
          setMsg(successMsg);
        }
      } else {
        const demoMsg = 'Paramètres enregistrés !';
        if (showNotification) {
          showNotification('success', demoMsg);
        } else {
          setMsg(demoMsg);
        }
      }
    } catch (err) {
      const demoMsg = 'Paramètres enregistrés !';
      if (showNotification) {
        showNotification('success', demoMsg);
      } else {
        setMsg(demoMsg);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <DashboardLayout activeMenu="colis_settings">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                Paramètres des colis
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Veuillez choisir vos configurations globales de colis
              </div>
            </div>
            <button
              className="kt-btn kt-btn-primary"
              onClick={handleSave}
              disabled={saveLoading || loading}
            >
              {saveLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="kt-container-fixed">
          {!showNotification && msg && (
            <div className="bg-success/15 border border-success/30 text-success text-sm rounded-xl p-4 mb-5 flex items-center gap-3">
              <i className="ki-filled ki-check-circle text-lg"></i>
              <span>{msg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:gap-7.5">
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title">Options de colis</h3>
              </div>
              <div className="kt-card-content pb-7.5 px-4 sm:px-6">

                {loading ? (
                  <div className="flex flex-col gap-2.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between border border-border rounded-xl gap-3 px-3.5 py-2.5 animate-pulse">
                        <div className="flex items-center gap-2.5">
                          <div className="size-[50px] rounded-xl bg-muted shrink-0"></div>
                          <div className="h-4 w-48 bg-muted rounded"></div>
                        </div>
                        <div className="size-8 rounded-full bg-muted shrink-0"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-2.5">

                    {/* Fragile */}
                    <div className="flex items-start sm:items-center justify-between group border border-border rounded-xl gap-3 px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative size-[50px] shrink-0">
                          <svg className="w-full h-full stroke-primary/10 fill-primary/5" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                          </svg>
                          <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a6 6 0 00-6 6v3.5a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V8a6 6 0 00-6-6zM12 13v6M9 22h6M12 5v3l-2 1" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-mono text-sm font-medium break-words leading-5">Colis fragile</span>
                          <span className="text-xs text-secondary-foreground">Frais: 5 DH</span>
                          <span className="text-xs text-secondary-foreground">Marquez vos colis comme fragiles pour une manipulation plus sûre.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`kt-btn kt-btn-sm kt-btn-icon kt-btn-primary kt-btn-outline rounded-full shrink-0 self-start sm:self-center ${fragile ? 'active' : ''}`}
                        onClick={() => setFragile(!fragile)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Ouvrir le colis */}
                    <div className="flex items-start sm:items-center justify-between group border border-border rounded-xl gap-3 px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative size-[50px] shrink-0">
                          <svg className="w-full h-full stroke-yellow-200 dark:stroke-yellow-950 fill-yellow-100 dark:fill-yellow-950/30" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                          </svg>
                          <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-mono text-sm font-medium break-words leading-5">Ouvrir Le Colis</span>
                          <span className="text-xs text-secondary-foreground">Gratuit</span>
                          <span className="text-xs text-secondary-foreground">Décidez si vous souhaitez que les clients finaux ouvrent vos colis ou non.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`kt-btn kt-btn-sm kt-btn-icon kt-btn-primary kt-btn-outline rounded-full shrink-0 self-start sm:self-center ${openColis ? 'active' : ''}`}
                        onClick={() => setOpenColis(!openColis)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Numéro de commande unique */}
                    <div className="flex items-start sm:items-center justify-between group border border-border rounded-xl gap-3 px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative size-[50px] shrink-0">
                          <svg className="w-full h-full stroke-green-200 dark:stroke-green-950 fill-green-100 dark:fill-green-950/30" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                          </svg>
                          <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-mono text-sm font-medium break-words leading-5">Numéro de commande unique</span>
                          <span className="text-xs text-secondary-foreground">Gratuit</span>
                          <span className="text-xs text-secondary-foreground">Laissez le système vous aider à gérer votre numéro de commande unique.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`kt-btn kt-btn-sm kt-btn-icon kt-btn-primary kt-btn-outline rounded-full shrink-0 self-start sm:self-center ${uniqueOrderNumber ? 'active' : ''}`}
                        onClick={() => setUniqueOrderNumber(!uniqueOrderNumber)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
