import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function LivreurAutoAssignPage({ navigate, showNotification }) {
  const [livreurs, setLivreurs]       = useState([]);
  const [colisDisp, setColisDisp]     = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedColis, setSelectedColis] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [fetching, setFetching]       = useState(true);
  const [done, setDone]               = useState(false);

  const headers = () => {
    const t = localStorage.getItem('auth_token');
    return { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  };

  const load = async () => {
    setFetching(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/livreurs', { headers: headers(), credentials: 'include' }),
        fetch('/api/colis', { headers: headers(), credentials: 'include' }),
      ]);
      if (r1.ok) { const d = await r1.json(); if (d.success) setLivreurs(d.livreurs); }
      if (r2.ok) {
        const d = await r2.json();
        const raw = Array.isArray(d) ? d : (d.colis || []);
        const unassigned = raw.filter(c => (!c.assignedDriver || c.assignedDriver === '-') && (c.etatLabel === 'En préparation' || c.statutLabel === 'En cours' || c.statutLabel === 'En attente'));
        setColisDisp(unassigned.slice(0, 30));
      }
    } catch {
      setLivreurs([
        { id: 1, fullName: 'Karim Alami', city: 'Casablanca', disponible: true, stats: { total: 24, livres: 18 } },
        { id: 2, fullName: 'Youssef Benali', city: 'Rabat', disponible: true, stats: { total: 15, livres: 12 } },
        { id: 3, fullName: 'Omar Tazi', city: 'Marrakech', disponible: false, stats: { total: 8, livres: 5 } },
      ]);
      setColisDisp([
        { id: 1, orderNumber: 'CMD-001', trackingCode: 'F-20260731-001', recipient: 'Sara Idrissi', city: 'Casablanca', etat: 'En préparation' },
        { id: 2, orderNumber: 'CMD-002', trackingCode: 'F-20260731-002', recipient: 'Amine Rachidi', city: 'Rabat', etat: 'En préparation' },
        { id: 3, orderNumber: 'CMD-003', trackingCode: 'F-20260731-003', recipient: 'Leila Fassi', city: 'Casablanca', etat: 'En préparation' },
      ]);
    } finally { setFetching(false); }
  };

  useEffect(() => {
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
        load();
      } else {
        showNotification?.('error', d.message || "Erreur lors de l'attribution.");
      }
    } catch { showNotification?.('error', 'Erreur de connexion.'); }
    finally { setLoading(false); }
  };

  const handleManualAssign = async (livreurId, livreurName) => {
    if (selectedColis.length === 0) { showNotification?.('error', 'Sélectionnez au moins un colis.'); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/livreurs/${livreurId}/assign`, {
        method: 'POST', headers: headers(), credentials: 'include',
        body: JSON.stringify({ colisIds: selectedColis }),
      });
      const d = await r.json();
      if (d.success) {
        showNotification?.('success', d.message);
        setSelectedColis([]);
        load();
      }
      else showNotification?.('error', d.message);
    } catch { showNotification?.('error', 'Erreur de connexion.'); }
    finally { setLoading(false); }
  };

  const toggleColis = (id) => {
    setSelectedColis(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const disponibles = livreurs.filter(l => l.disponible);

  return (
    <DashboardLayout activeMenu="livreurs_list">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Attribution des Colis</h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Attribution automatique ou manuelle des colis aux livreurs selon leur zone
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button type="button" className="kt-btn kt-btn-outline" onClick={() => navigate('/livreurs')}>
                Retour à la liste
              </button>
            </div>
          </div>
        </div>

        <div className="kt-container-fixed">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">

            {/* Auto Attribution Card */}
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title">Attribution Automatique</h3>
              </div>
              <div className="kt-card-content px-10 py-7.5 lg:pe-12.5">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-2.5 mb-6">
                  <div className="flex flex-col items-start gap-3 w-full lg:max-w-[65%]">
                    <h2 className="text-xl font-semibold text-mono">Attribution par ville</h2>
                    <div className="grid grid-cols-1 gap-2 w-full">
                      <div className="flex items-start gap-1.5 lg:pe-7.5">
                        <i className="ki-filled ki-check-circle text-base text-green-500" />
                        <span className="text-sm text-mono">Cible les colis en état <strong>En préparation</strong></span>
                      </div>
                      <div className="flex items-start gap-1.5 lg:pe-7.5">
                        <i className="ki-filled ki-check-circle text-base text-green-500" />
                        <span className="text-sm text-mono">Associe automatiquement les colis aux livreurs par <strong>ville correspondante</strong></span>
                      </div>
                      <div className="flex items-start gap-1.5 lg:pe-7.5">
                        <i className="ki-filled ki-check-circle text-base text-green-500" />
                        <span className="text-sm text-mono">Passe le statut du colis à <strong>Expédié / En cours</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 self-center flex items-center justify-center">
                    <i className="ki-filled ki-technology-2 dark:hidden text-primary" style={{ fontSize: '80px', lineHeight: '1' }} />
                  </div>
                </div>

                {done ? (
                  <div>
                    <div className="flex gap-3 border rounded-lg p-4 mb-5" style={{ backgroundColor: 'rgba(39,211,127,0.08)', borderColor: 'rgba(39,211,127,0.2)' }}>
                      <i className="ki-filled ki-check-circle text-green-600 text-xl shrink-0 mt-0.5" />
                      <div className="text-sm text-foreground">
                        <strong>{assignments.length} colis</strong> assignés automatiquement avec succès.
                      </div>
                    </div>
                    {assignments.length > 0 && (
                      <div className="grid gap-2 mb-5 max-h-48 overflow-y-auto">
                        {assignments.map((a, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/50 border border-border/40">
                            <span className="text-sm font-medium text-foreground">{a.colis}</span>
                            <span className="text-xs text-secondary-foreground">→ {a.livreur} ({a.city})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className="kt-btn kt-btn-outline w-full"
                      onClick={() => { setDone(false); setAssignments([]); }}
                    >
                      Nouvelle attribution
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="kt-btn kt-btn-primary w-full"
                    onClick={handleAutoAssign}
                    disabled={loading}
                  >
                    {loading ? 'Attribution en cours...' : 'Lancer l\'attribution automatique'}
                  </button>
                )}
              </div>
            </div>

            {/* Manual Attribution Card */}
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title">Attribution Manuelle</h3>
                {selectedColis.length > 0 && (
                  <span className="kt-badge kt-badge-primary kt-badge-outline rounded-[30px]">
                    <span className="kt-badge-dot size-1.5" />{selectedColis.length} sélectionné{selectedColis.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {fetching ? (
                <div className="kt-card-content p-10 flex items-center justify-center gap-3 text-secondary-foreground">
                  <div style={{ height: '14px', width: '80%', borderRadius: '6px', background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                </div>
              ) : (
                <div className="kt-card-table pb-3">
                  {/* Colis selection */}
                  <div className="px-5 lg:px-7.5 pt-4 pb-2">
                    <p className="text-sm font-medium text-secondary-foreground mb-2">
                      Colis disponibles (En préparation) — {colisDisp.length} colis
                    </p>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto border border-border rounded-lg">
                      {colisDisp.length === 0 ? (
                        <div className="p-4 text-sm text-secondary-foreground text-center">
                          Aucun colis en attente d'attribution
                        </div>
                      ) : colisDisp.map(c => (
                        <label key={c.id} className="flex items-center gap-3 px-3.5 py-2 hover:bg-accent cursor-pointer border-b border-border/40 last:border-b-0">
                          <input
                            type="checkbox"
                            className="kt-checkbox kt-checkbox-sm"
                            checked={selectedColis.includes(c.id)}
                            onChange={() => toggleColis(c.id)}
                          />
                          <div className="flex-1 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-sm font-medium text-foreground">{c.orderNumber}</span>
                              <span className="text-xs text-secondary-foreground ms-2">{c.recipient}</span>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{c.city}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-border mx-5 my-3" />

                  {/* Livreurs list */}
                  <div className="px-5 lg:px-7.5 pb-4">
                    <p className="text-sm font-medium text-secondary-foreground mb-2">
                      Assigner au livreur disponible :
                    </p>
                    <div className="flex flex-col gap-2">
                      {disponibles.length === 0 ? (
                        <div className="p-4 text-sm text-secondary-foreground text-center border border-border rounded-lg">
                          Aucun livreur disponible
                        </div>
                      ) : disponibles.map(l => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5 border border-border rounded-xl hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="size-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
                              style={{ background: `hsl(${(l.id * 47) % 360}, 60%, 50%)` }}
                            >
                              {l.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-foreground">{l.fullName}</span>
                              <span className="text-xs text-secondary-foreground">{l.city} • {l.stats?.total ?? 0} colis assignés</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="kt-btn kt-btn-sm kt-btn-primary shrink-0"
                            onClick={() => handleManualAssign(l.id, l.fullName)}
                            disabled={loading || selectedColis.length === 0}
                          >
                            Assigner
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
