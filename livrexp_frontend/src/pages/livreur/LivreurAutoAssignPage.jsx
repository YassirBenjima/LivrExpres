import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function LivreurAutoAssignPage({ navigate, showNotification }) {
  const [livreurs, setLivreurs]   = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [done, setDone]           = useState(false);
  const [selectedColis, setSelectedColis] = useState([]);
  const [colisDisp, setColisDisp] = useState([]);

  const headers = () => {
    const t = localStorage.getItem('auth_token');
    return { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  };

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const [r1, r2] = await Promise.all([
          fetch('/api/livreurs', { headers: headers(), credentials: 'include' }),
          fetch('/api/colis?etat=En+pr%C3%A9paration', { headers: headers(), credentials: 'include' }),
        ]);
        if (r1.ok) { const d = await r1.json(); if (d.success) setLivreurs(d.livreurs); }
        if (r2.ok) { const d = await r2.json(); if (d.colis) setColisDisp(d.colis.slice(0, 20)); }
      } catch {
        setLivreurs([
          { id: 1, fullName: 'Karim Alami', city: 'Casablanca', disponible: true, stats: { total: 24, livres: 18 } },
          { id: 2, fullName: 'Youssef Benali', city: 'Rabat', disponible: true, stats: { total: 15, livres: 12 } },
        ]);
        setColisDisp([
          { id: 1, orderNumber: 'CMD-001', recipient: 'Sara Idrissi', city: 'Casablanca', etat: 'En préparation' },
          { id: 2, orderNumber: 'CMD-002', recipient: 'Amine Rachidi', city: 'Rabat', etat: 'En préparation' },
        ]);
      } finally { setFetching(false); }
    };
    load();
  }, []);

  const handleAutoAssign = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/livreurs/auto-assign', { method: 'POST', headers: headers(), credentials: 'include' });
      const d = await r.json();
      if (d.success) {
        setAssignments(d.assignments || []);
        setDone(true);
        showNotification?.('success', d.message);
      } else {
        showNotification?.('error', d.message || 'Erreur lors de l\'attribution automatique.');
      }
    } catch { showNotification?.('error', 'Erreur de connexion.'); }
    finally { setLoading(false); }
  };

  const handleManualAssign = async (livreurId) => {
    if (selectedColis.length === 0) { showNotification?.('error', 'Sélectionnez au moins un colis.'); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/livreurs/${livreurId}/assign`, {
        method: 'POST', headers: headers(), credentials: 'include',
        body: JSON.stringify({ colisIds: selectedColis }),
      });
      const d = await r.json();
      if (d.success) { showNotification?.('success', d.message); setSelectedColis([]); }
      else showNotification?.('error', d.message);
    } catch { showNotification?.('error', 'Erreur de connexion.'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout activeMenu="livreurs_list">
      <main className="grow pt-5 dashboard-content-shift" role="content">
        <div className="kt-container-fixed">

          {/* Header */}
          <div className="flex items-center justify-between gap-5 pb-7.5">
            <div className="flex items-center gap-3">
              <button className="kt-btn kt-btn-sm kt-btn-outline kt-btn-icon" onClick={() => navigate('/livreurs')}>
                <i className="ki-filled ki-left" />
              </button>
              <div>
                <h1 className="text-xl font-medium text-mono">Attribution des Colis</h1>
                <p className="text-sm text-secondary-foreground mt-1">Attribution automatique ou manuelle des colis aux livreurs</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">

            {/* Auto Attribution */}
            <div className="kt-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <i className="ki-filled ki-technology-2 text-primary text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Attribution Automatique</h3>
                  <p className="text-xs text-secondary-foreground">Assigne automatiquement les colis selon la ville du livreur</p>
                </div>
              </div>

              <div className="rounded-xl bg-accent/50 p-4 mb-5 text-sm text-secondary-foreground">
                <p className="font-medium text-foreground mb-2">Comment ça fonctionne :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Cibles les colis en état <strong>En préparation</strong></li>
                  <li>Les associe aux livreurs dont la <strong>ville correspond</strong></li>
                  <li>Passe le statut du colis à <strong>Expédié / En cours</strong></li>
                </ul>
              </div>

              {done ? (
                <div>
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-success/10 text-success text-sm font-medium">
                    <i className="ki-filled ki-check-circle text-lg" />
                    {assignments.length} colis assignés avec succès !
                  </div>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {assignments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-accent">
                        <span className="font-medium">{a.colis}</span>
                        <span className="text-secondary-foreground">→ {a.livreur} ({a.city})</span>
                      </div>
                    ))}
                  </div>
                  <button className="kt-btn kt-btn-outline w-full mt-4" onClick={() => { setDone(false); setAssignments([]); }}>
                    Nouvelle attribution
                  </button>
                </div>
              ) : (
                <button className="kt-btn kt-btn-primary w-full" onClick={handleAutoAssign} disabled={loading}>
                  {loading ? (<><i className="ki-filled ki-spinner animate-spin me-2" />Attribution en cours...</>) : (<><i className="ki-filled ki-technology-2 me-2" />Lancer l'attribution automatique</>)}
                </button>
              )}
            </div>

            {/* Manual Attribution */}
            <div className="kt-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <i className="ki-filled ki-pencil text-warning text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Attribution Manuelle</h3>
                  <p className="text-xs text-secondary-foreground">Sélectionnez des colis et choisissez un livreur</p>
                </div>
              </div>

              {fetching ? (
                <div className="flex items-center justify-center py-8 gap-2 text-secondary-foreground">
                  <i className="ki-filled ki-spinner animate-spin text-primary" /> Chargement...
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">Colis disponibles (En préparation) :</p>
                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                      {colisDisp.length === 0 ? (
                        <p className="text-sm text-secondary-foreground text-center py-4">Aucun colis en attente d'attribution</p>
                      ) : colisDisp.map(c => (
                        <label key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent cursor-pointer">
                          <input
                            type="checkbox"
                            className="kt-checkbox"
                            checked={selectedColis.includes(c.id)}
                            onChange={e => setSelectedColis(prev => e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id))}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{c.orderNumber}</span>
                            <span className="text-xs text-secondary-foreground ms-2">{c.recipient} — {c.city}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {selectedColis.length > 0 && (
                      <p className="text-xs text-primary mt-2 font-medium">{selectedColis.length} colis sélectionné(s)</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Assigner au livreur :</p>
                    <div className="flex flex-col gap-2">
                      {livreurs.filter(l => l.disponible).map(l => (
                        <div key={l.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: `hsl(${(l.id * 47) % 360}, 65%, 50%)` }}>
                              {l.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{l.fullName}</p>
                              <p className="text-xs text-secondary-foreground">{l.city} • {l.stats?.total ?? 0} colis</p>
                            </div>
                          </div>
                          <button
                            className="kt-btn kt-btn-sm kt-btn-primary"
                            onClick={() => handleManualAssign(l.id)}
                            disabled={loading || selectedColis.length === 0}
                          >
                            Assigner
                          </button>
                        </div>
                      ))}
                      {livreurs.filter(l => l.disponible).length === 0 && (
                        <p className="text-sm text-secondary-foreground text-center py-4">Aucun livreur disponible</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </main>
    </DashboardLayout>
  );
}
