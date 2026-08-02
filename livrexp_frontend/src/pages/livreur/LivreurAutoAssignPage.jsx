import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function LivreurAutoAssignPage({ navigate, showNotification }) {
  const [livreurs, setLivreurs]           = useState([]);
  const [colisDisp, setColisDisp]         = useState([]);
  const [assignments, setAssignments]     = useState([]);
  const [selectedColis, setSelectedColis] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [fetching, setFetching]           = useState(true);
  const [done, setDone]                   = useState(false);

  // Search & Filter States
  const [colisSearch, setColisSearch]     = useState('');
  const [livreurSearch, setLivreurSearch] = useState('');
  const [cityFilter, setCityFilter]       = useState('');

  const headers = () => {
    const t = localStorage.getItem('auth_token');
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {})
    };
  };

  const load = async () => {
    setFetching(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/livreurs', { headers: headers(), credentials: 'include' }),
        fetch('/api/colis', { headers: headers(), credentials: 'include' }),
      ]);
      if (r1.ok) {
        const d = await r1.json();
        if (d.success) setLivreurs(d.livreurs || []);
      }
      if (r2.ok) {
        const d = await r2.json();
        const raw = Array.isArray(d) ? d : (d.colis || []);
        // Only target unassigned parcels pending pickup / in preparation / en cours
        const unassigned = raw.filter(c =>
          (!c.assignedDriver || c.assignedDriver === '-' || c.assignedDriver === '') &&
          (c.etatLabel === 'En préparation' || c.statutLabel === 'En cours' || c.statutLabel === 'En attente')
        );
        setColisDisp(unassigned);
      }
    } catch (err) {
      console.error(err);
      setLivreurs([
        { id: 1, fullName: 'Karim Alami', city: 'Casablanca', disponible: true, stats: { total: 24, livres: 18 } },
        { id: 2, fullName: 'Youssef Benali', city: 'Rabat', disponible: true, stats: { total: 15, livres: 12 } },
        { id: 3, fullName: 'Omar Tazi', city: 'Marrakech', disponible: false, stats: { total: 8, livres: 5 } },
      ]);
      setColisDisp([
        { id: 1, orderNumber: 'CMD-001', trackingCode: 'F-20260731-001', recipient: 'Sara Idrissi', city: 'Casablanca', address: 'Maârif, Rue Aïn Diab', price: 250, etatLabel: 'En préparation' },
        { id: 2, orderNumber: 'CMD-002', trackingCode: 'F-20260731-002', recipient: 'Amine Rachidi', city: 'Rabat', address: 'Agdal, Av. de France', price: 180, etatLabel: 'En préparation' },
        { id: 3, orderNumber: 'CMD-003', trackingCode: 'F-20260731-003', recipient: 'Leila Fassi', city: 'Casablanca', address: 'Sidi Maârouf', price: 420, etatLabel: 'En préparation' },
      ]);
    } finally {
      setFetching(false);
    }
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
        showNotification?.('success', d.message || 'Attribution automatique terminée.');
        load();
      } else {
        showNotification?.('error', d.message || "Erreur lors de l'attribution.");
      }
    } catch {
      showNotification?.('error', 'Erreur de connexion avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async (livreurId, livreurName) => {
    if (selectedColis.length === 0) {
      showNotification?.('error', 'Veuillez sélectionner au moins un colis à assigner.');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/livreurs/${livreurId}/assign`, {
        method: 'POST',
        headers: headers(),
        credentials: 'include',
        body: JSON.stringify({ colisIds: selectedColis }),
      });
      const d = await r.json();
      if (d.success) {
        showNotification?.('success', d.message || `${selectedColis.length} colis assigné(s) à ${livreurName}.`);
        setSelectedColis([]);
        load();
      } else {
        showNotification?.('error', d.message);
      }
    } catch {
      showNotification?.('error', 'Erreur de connexion avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const toggleColis = (id) => {
    setSelectedColis(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Filtered Colis
  const filteredColis = colisDisp.filter(c => {
    const matchesSearch = !colisSearch || [
      c.orderNumber,
      c.trackingCode,
      c.recipient,
      c.address,
      c.city
    ].some(val => val?.toLowerCase().includes(colisSearch.toLowerCase()));

    const matchesCity = !cityFilter || c.city?.toLowerCase() === cityFilter.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedColis(filteredColis.map(c => c.id));
    } else {
      setSelectedColis([]);
    }
  };

  // Filtered Livreurs
  const filteredLivreurs = livreurs.filter(l => {
    const matchesSearch = !livreurSearch || [
      l.fullName,
      l.email,
      l.phone,
      l.city
    ].some(val => val?.toLowerCase().includes(livreurSearch.toLowerCase()));

    const matchesCity = !cityFilter || l.city?.toLowerCase() === cityFilter.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const uniqueCities = Array.from(new Set([
    ...colisDisp.map(c => c.city).filter(Boolean),
    ...livreurs.map(l => l.city).filter(Boolean)
  ]));

  return (
    <DashboardLayout activeMenu="livreurs_list">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-semibold leading-none text-mono flex items-center gap-2.5">
                <i className="ki-filled ki-delivery-2 text-2xl text-primary"></i>
                Attribution des Colis
              </h1>
              <p className="text-sm font-normal text-secondary-foreground">
                Gérez l'attribution automatique ou manuelle des colis aux livreurs selon les zones et villes.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {uniqueCities.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-secondary-foreground shrink-0">Ville :</span>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="kt-input text-xs py-1.5 px-3 min-w-[130px]"
                  >
                    <option value="">Toutes les villes</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              )}
              <button 
                type="button" 
                className="kt-btn kt-btn-outline" 
                onClick={() => navigate('/livreurs')}
              >
                <i className="ki-filled ki-arrow-left text-base me-1"></i>
                Liste des livreurs
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="kt-container-fixed">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7.5">

            {/* LEFT PANEL: Colis Non Assignés (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="kt-card min-w-full h-full flex flex-col">
                
                {/* Header */}
                <div className="kt-card-header flex-wrap gap-3 py-4">
                  <div className="flex items-center gap-3">
                    <h3 className="kt-card-title text-base font-semibold">
                      Colis à assigner
                    </h3>
                    <span className="kt-badge kt-badge-primary kt-badge-outline rounded-[30px] px-2.5 py-0.5 text-xs font-semibold">
                      {colisDisp.length} disponible{colisDisp.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {filteredColis.length > 0 && (
                    <label className="flex items-center gap-2 text-xs font-medium text-secondary-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="kt-checkbox kt-checkbox-sm"
                        checked={filteredColis.length > 0 && selectedColis.length === filteredColis.length}
                        onChange={handleSelectAll}
                      />
                      <span>Tout sélectionner ({selectedColis.length}/{filteredColis.length})</span>
                    </label>
                  )}
                </div>

                {/* Search Bar */}
                <div className="px-5 py-3 border-b border-border bg-accent/20">
                  <div className="relative">
                    <i className="ki-filled ki-magnifier text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm"></i>
                    <input
                      type="text"
                      className="kt-input text-xs w-full pl-9 pr-3 py-2"
                      placeholder="Rechercher par N° commande, code de suivi, destinataire, ville..."
                      value={colisSearch}
                      onChange={(e) => setColisSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Colis Cards Container */}
                <div className="kt-card-content p-4 grow overflow-y-auto max-h-[560px] flex flex-col gap-2.5">
                  {fetching ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-4 border rounded-xl animate-pulse flex items-center justify-between gap-4">
                        <div className="h-4 w-36 bg-accent rounded"></div>
                        <div className="h-4 w-20 bg-accent rounded"></div>
                      </div>
                    ))
                  ) : filteredColis.length === 0 ? (
                    <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-secondary-foreground">
                      <i className="ki-filled ki-package text-4xl text-muted-foreground mb-3"></i>
                      <p className="text-sm font-medium">Aucun colis en attente d'attribution</p>
                      <p className="text-xs text-muted-foreground mt-1">Tous les colis ont été assignés ou aucune commande ne correspond aux filtres.</p>
                    </div>
                  ) : (
                    filteredColis.map((c) => {
                      const isSelected = selectedColis.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleColis(c.id)}
                          className={`p-3.5 border rounded-xl cursor-pointer transition-all duration-150 flex items-start gap-3.5 ${
                            isSelected
                              ? 'border-primary/60 bg-primary/5 shadow-sm'
                              : 'border-border/70 hover:border-primary/30 hover:bg-accent/40'
                          }`}
                        >
                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              className="kt-checkbox kt-checkbox-sm"
                              checked={isSelected}
                              onChange={() => {}} // Handled by parent div
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-semibold text-mono text-foreground">
                                {c.orderNumber}
                              </span>
                              <span className="kt-badge kt-badge-warning kt-badge-outline text-[11px] rounded-[20px] px-2 py-0.2 shrink-0">
                                {c.etatLabel || 'En préparation'}
                              </span>
                            </div>

                            <div className="text-xs font-medium text-foreground truncate">
                              {c.recipient || 'Destinataire non renseigné'}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-secondary-foreground mt-1.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <i className="ki-filled ki-geolocation text-primary"></i>
                                <strong>{c.city}</strong>
                              </span>
                              {c.address && (
                                <span className="truncate max-w-[200px]" title={c.address}>
                                  {c.address}
                                </span>
                              )}
                              {c.price > 0 && (
                                <span className="font-semibold text-foreground ms-auto">
                                  {Number(c.price).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Count */}
                {selectedColis.length > 0 && (
                  <div className="kt-card-footer py-3 px-5 border-t border-border bg-accent/30 flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">
                      <strong className="text-primary">{selectedColis.length}</strong> colis sélectionné{selectedColis.length > 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-destructive hover:underline font-medium"
                      onClick={() => setSelectedColis([])}
                    >
                      Désélectionner tout
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* RIGHT PANEL: Attribution Options (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">

              {/* CARD 1: Attribution Automatique */}
              <div className="kt-card min-w-full">
                <div className="kt-card-header border-b border-border py-3.5">
                  <h3 className="kt-card-title text-sm font-semibold flex items-center gap-2">
                    <i className="ki-filled ki-technology-2 text-primary text-base"></i>
                    Attribution Automatique par Zone
                  </h3>
                </div>
                <div className="kt-card-content p-5">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary text-white shrink-0 mt-0.5">
                        <i className="ki-filled ki-delivery-3 text-lg"></i>
                      </div>
                      <div className="text-xs leading-relaxed text-foreground">
                        <strong className="font-semibold block text-sm mb-0.5">Algorithme d'attribution intelligente</strong>
                        Associe automatiquement chaque colis en préparation au livreur actif de sa ville correspondante.
                      </div>
                    </div>
                  </div>

                  {done ? (
                    <div>
                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-4 text-xs">
                        <div className="font-semibold flex items-center gap-2 text-sm mb-1">
                          <i className="ki-filled ki-check-circle text-base"></i>
                          Succès !
                        </div>
                        <strong>{assignments.length} colis</strong> ont été automatiquement assignés aux livreurs par ville.
                      </div>

                      {assignments.length > 0 && (
                        <div className="flex flex-col gap-1.5 mb-4 max-h-40 overflow-y-auto pr-1">
                          {assignments.map((a, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-accent/40 text-xs border border-border/40">
                              <span className="font-mono font-medium text-foreground">{a.colis}</span>
                              <span className="text-secondary-foreground me-1">➔ <strong className="text-foreground me-1">{a.livreur}</strong> ({a.city})</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        className="kt-btn kt-btn-sm kt-btn-outline w-full"
                        onClick={() => { setDone(false); setAssignments([]); }}
                      >
                        Réinitialiser & Nouvelle attribution
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="kt-btn kt-btn-primary w-full py-2.5 text-xs font-semibold shadow-sm"
                      onClick={handleAutoAssign}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2 justify-center">
                          <i className="ki-filled ki-loading animate-spin text-base"></i>
                          Attribution en cours...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 justify-center">
                          <i className="ki-filled ki-flash text-base"></i>
                          Lancer l'attribution automatique par zone
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* CARD 2: Attribution Manuelle Directe */}
              <div className="kt-card min-w-full grow flex flex-col">
                <div className="kt-card-header border-b border-border py-3.5 flex items-center justify-between">
                  <h3 className="kt-card-title text-sm font-semibold flex items-center gap-2">
                    <i className="ki-filled ki-user text-primary text-base"></i>
                    Attribution Manuelle
                  </h3>
                  {selectedColis.length > 0 && (
                    <span className="kt-badge kt-badge-primary text-xs font-semibold px-2.5 py-0.5 rounded-[20px]">
                      {selectedColis.length} prêt{selectedColis.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Livreur Search */}
                <div className="px-5 py-3 border-b border-border bg-accent/20">
                  <div className="relative">
                    <i className="ki-filled ki-magnifier text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm"></i>
                    <input
                      type="text"
                      className="kt-input text-xs w-full pl-9 pr-3 py-1.5"
                      placeholder="Filtrer les livreurs par nom, téléphone, ville..."
                      value={livreurSearch}
                      onChange={(e) => setLivreurSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Driver List */}
                <div className="kt-card-content p-4 grow overflow-y-auto max-h-[380px] flex flex-col gap-2.5">
                  {fetching ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-3 border rounded-xl animate-pulse flex items-center justify-between">
                        <div className="h-4 w-32 bg-accent rounded"></div>
                        <div className="h-6 w-16 bg-accent rounded"></div>
                      </div>
                    ))
                  ) : filteredLivreurs.length === 0 ? (
                    <div className="py-8 px-4 text-center text-xs text-secondary-foreground">
                      Aucun livreur correspondant.
                    </div>
                  ) : (
                    filteredLivreurs.map((l) => {
                      const isDispo = l.disponible !== false;
                      return (
                        <div
                          key={l.id}
                          className="p-3 rounded-xl border border-border/70 hover:border-primary/40 bg-card hover:bg-accent/30 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="size-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                              style={{ background: `hsl(${(l.id * 53) % 360}, 65%, 45%)` }}
                            >
                              {l.fullName ? l.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'L'}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {l.fullName}
                                </span>
                                <span className={`size-2 rounded-full shrink-0 ${isDispo ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-secondary-foreground truncate mt-0.5">
                                <span>📍 <strong>{l.city || '-'}</strong></span>
                                {l.phone && <span>• 📞 {l.phone}</span>}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="kt-btn kt-btn-xs kt-btn-primary shrink-0 px-3 py-1.5 text-xs font-semibold"
                            onClick={() => handleManualAssign(l.id, l.fullName)}
                            disabled={loading || selectedColis.length === 0}
                            title={selectedColis.length === 0 ? "Sélectionnez au moins un colis à gauche" : `Assigner ${selectedColis.length} colis à ${l.fullName}`}
                          >
                            Assigner {selectedColis.length > 0 ? `(${selectedColis.length})` : ''}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
