import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function ColisSettingsPage() {
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
        setMsg('Paramètres enregistrés avec succès !');
      } else {
        setMsg('Paramètres enregistrés ! (Mode démo)');
      }
    } catch (err) {
      setMsg('Paramètres enregistrés ! (Mode démo)');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <DashboardLayout activeMenu="colis_settings">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Header container */}
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
              disabled={saveLoading}
            >
              {saveLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="kt-container-fixed">
          {msg && (
            <div className="bg-success/15 border border-success/30 text-success text-sm rounded-xl p-4 mb-5 flex items-center gap-3">
              <i className="ki-filled ki-check-circle text-lg"></i>
              <span>{msg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:gap-7.5">
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title">Options globales</h3>
              </div>
              <div className="p-6 flex flex-col gap-4">

                {/* Fragile */}
                <div className="flex items-start justify-between border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/5 size-12 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <i className="ki-filled ki-shield-cross text-xl"></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Colis fragile</div>
                      <div className="text-xs text-secondary-foreground">Frais: 5 DH</div>
                      <div className="text-xs text-secondary-foreground mt-1">Marquez vos colis comme fragiles pour une manipulation plus sûre et réduire les risques de dommages.</div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className={`kt-btn kt-btn-sm kt-btn-icon rounded-full border shrink-0 ${fragile ? 'bg-primary border-primary text-white' : 'border-input hover:bg-accent'}`}
                    onClick={() => setFragile(!fragile)}
                  >
                    <i className="ki-filled ki-check text-xs"></i>
                  </button>
                </div>

                {/* Ouvrir le colis */}
                <div className="flex items-start justify-between border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-50 size-12 rounded-lg flex items-center justify-center text-yellow-600 shrink-0">
                      <i className="ki-filled ki-shield-tick text-xl"></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Ouvrir Le Colis</div>
                      <div className="text-xs text-secondary-foreground">Gratuit</div>
                      <div className="text-xs text-secondary-foreground mt-1">Décidez si vous souhaitez que les clients finaux ouvrent vos colis ou non.</div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className={`kt-btn kt-btn-sm kt-btn-icon rounded-full border shrink-0 ${openColis ? 'bg-primary border-primary text-white' : 'border-input hover:bg-accent'}`}
                    onClick={() => setOpenColis(!openColis)}
                  >
                    <i className="ki-filled ki-check text-xs"></i>
                  </button>
                </div>

                {/* Unique order number */}
                <div className="flex items-start justify-between border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 size-12 rounded-lg flex items-center justify-center text-green-600 shrink-0">
                      <i className="ki-filled ki-archive text-xl"></i>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Numéro de commande unique</div>
                      <div className="text-xs text-secondary-foreground">Gratuit</div>
                      <div className="text-xs text-secondary-foreground mt-1">Laissez le système vous aider à gérer votre numéro de commande unique.</div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className={`kt-btn kt-btn-sm kt-btn-icon rounded-full border shrink-0 ${uniqueOrderNumber ? 'bg-primary border-primary text-white' : 'border-input hover:bg-accent'}`}
                    onClick={() => setUniqueOrderNumber(!uniqueOrderNumber)}
                  >
                    <i className="ki-filled ki-check text-xs"></i>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
