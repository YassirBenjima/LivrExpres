import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function LivreurAutoAssignPage({ navigate, showNotification }) {
  const [activeTab, setActiveTab]         = useState('manual'); // 'manual' or 'auto'
  const [livreurs, setLivreurs]           = useState([]);
  const [colisDisp, setColisDisp]         = useState([]);
  const [selectedColis, setSelectedColis] = useState([]);
  const [selectedLivreurId, setSelectedLivreurId] = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [cityFilter, setCityFilter]       = useState('');
  const [assignments, setAssignments]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [fetching, setFetching]           = useState(true);
  const [doneAuto, setDoneAuto]           = useState(false);

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
        const unassigned = raw.filter(c => 
          (!c.assignedDriver || c.assignedDriver === '-') && 
          (c.etatLabel === 'En préparation' || c.statutLabel === 'En cours' || c.statutLabel === 'En attente')
        );
        setColisDisp(unassigned);
      }
    } catch {
      setLivreurs([
        { id: 1, fullName: 'Karim Alami', city: 'Casablanca', disponible: true, phone: '0661234567', stats: { total: 24, livres: 18 } },
        { id: 2, fullName: 'Youssef Benali', city: 'Rabat', disponible: true, phone: '0662345678', stats: { total: 15, livres: 12 } },
        { id: 3, fullName: 'Omar Tazi', city: 'Marrakech', disponible: false, phone: '0663456789', stats: { total: 8, livres: 5 } },
      ]);
      setColisDisp([
        { id: 1, orderNumber: 'CMD-001', trackingCode: 'F-20260731-001', recipient: 'Sara Idrissi', city: 'Casablanca', address: 'Anfa Rue 12', productNature: 'Vêtements', etatLabel: 'En préparation' },
        { id: 2, orderNumber: 'CMD-002', trackingCode: 'F-20260731-002', recipient: 'Amine Rachidi', city: 'Rabat', address: 'Agdal Av Hassan II', productNature: 'Électronique', etatLabel: 'En préparation' },
        { id: 3, orderNumber: 'CMD-003', trackingCode: 'F-20260731-003', recipient: 'Leila Fassi', city: 'Casablanca', address: 'Maarif Bd Zerktouni', productNature: 'Cosmétique', etatLabel: 'En préparation' },
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
        setDoneAuto(true);
        showNotification?.('success', d.message);
        load();
      } else {
        showNotification?.('error', d.message || "Erreur lors de l'attribution.");
      }
    } catch { 
      showNotification?.('error', 'Erreur de connexion.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleManualAssign = async (targetLivreurId = null) => {
    const livreurId = targetLivreurId || selectedLivreurId;
    if (!livreurId) {
      showNotification?.('error', 'Veuillez sélectionner un livreur.');
      return;
    }
    if (selectedColis.length === 0) { 
      showNotification?.('error', 'Veuillez sélectionner au moins un colis.'); 
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
        showNotification?.('success', d.message);
        setSelectedColis([]);
        setSelectedLivreurId('');
        load();
      } else {
        showNotification?.('error', d.message);
      }
    } catch { 
      showNotification?.('error', 'Erreur de connexion.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedColis(filteredColis.map(c => c.id));
    } else {
      setSelectedColis([]);
    }
  };

  const toggleColis = (id) => {
    setSelectedColis(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const availableCities = Array.from(new Set(colisDisp.map(c => c.city).filter(Boolean)));
  const disponibles = livreurs.filter(l => l.disponible);

  const filteredColis = colisDisp.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || [
      c.orderNumber,
      c.trackingCode,
      c.recipient,
      c.city,
      c.address,
      c.productNature
    ].some(v => v?.toLowerCase().includes(q));

    const matchesCity = !cityFilter || c.city === cityFilter;

    return matchesSearch && matchesCity;
  });

  const selectedLivreurObj = livreurs.find(l => String(l.id) === String(selectedLivreurId));

  return (
    <DashboardLayout activeMenu="livreurs_list">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Hero Header Section */}
        <div className="kt-container-fixed mb-6">
          <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 border border-primary/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-emerald-500/10 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-emerald-950/40 backdrop-blur-md shadow-sm">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-col gap-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                    Logistique & Dispatch
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Module Actif
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                  Attribution des Colis aux Livreurs
                </h1>
                <p className="text-sm text-secondary-foreground leading-relaxed">
                  Gérez l'affectation manuelle ou automatisée de vos colis non assignés pour optimiser la tournée de livraison de vos équipes.
                </p>
              </div>

              {/* Quick Action Badges / Stat Pills */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background/80 dark:bg-zinc-900/80 border border-border/60 backdrop-blur-sm shadow-sm">
                  <div className="size-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                    <i className="ki-filled ki-box"></i>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Non assignés</div>
                    <div className="text-base font-bold text-foreground">{colisDisp.length} colis</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background/80 dark:bg-zinc-900/80 border border-border/60 backdrop-blur-sm shadow-sm">
                  <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                    <i className="ki-filled ki-user-check"></i>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Livreurs actifs</div>
                    <div className="text-base font-bold text-foreground">{disponibles.length} livreurs</div>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="kt-btn kt-btn-outline hover:bg-background border-border/80 shadow-sm" 
                  onClick={() => navigate('/livreurs')}
                >
                  <i className="ki-filled ki-arrow-left text-base me-1"></i>
                  Retour Liste
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Styled Segmented Tab Switcher */}
        <div className="kt-container-fixed mb-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-accent/40 dark:bg-zinc-900/60 border border-border/60 backdrop-blur-md shadow-sm">
            <button
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all duration-200 ${
                activeTab === 'manual'
                  ? 'bg-background text-primary shadow-md shadow-black/5 dark:shadow-black/20 font-bold'
                  : 'text-secondary-foreground hover:text-foreground hover:bg-background/40'
              }`}
              onClick={() => setActiveTab('manual')}
            >
              <i className={`ki-filled ki-hand-cart text-lg ${activeTab === 'manual' ? 'text-primary' : ''}`}></i>
              Attribution Manuelle
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'manual' ? 'bg-primary/10 text-primary' : 'bg-accent text-secondary-foreground'
              }`}>
                {colisDisp.length}
              </span>
            </button>

            <button
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all duration-200 ${
                activeTab === 'auto'
                  ? 'bg-background text-primary shadow-md shadow-black/5 dark:shadow-black/20 font-bold'
                  : 'text-secondary-foreground hover:text-foreground hover:bg-background/40'
              }`}
              onClick={() => setActiveTab('auto')}
            >
              <i className={`ki-filled ki-technology-2 text-lg ${activeTab === 'auto' ? 'text-primary' : ''}`}></i>
              Attribution Automatique (IA)
            </button>
          </div>
        </div>

        {/* Tab 1: Attribution Manuelle */}
        {activeTab === 'manual' && (
          <div className="kt-container-fixed">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Left Column: Interactive Table (2/3 width) */}
              <div className="xl:col-span-2 flex flex-col gap-5">
                <div className="kt-card border border-border/60 shadow-sm overflow-hidden rounded-2xl">
                  
                  {/* Card Header */}
                  <div className="p-5 border-b border-border/60 flex flex-wrap items-center justify-between gap-4 bg-background">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base font-bold">
                        <i className="ki-filled ki-element-plus"></i>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          Colis en attente d'attribution
                        </h3>
                        <p className="text-xs text-muted-foreground me-2">
                          Sélectionnez les colis à affecter à un livreur
                        </p>
                      </div>
                    </div>

                    {/* Floating Badge for Selected Items */}
                    {selectedColis.length > 0 && (
                      <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse">
                        <i className="ki-filled ki-check-circle text-sm me-2 me-sm-0"></i>
                        <span>{selectedColis.length} colis sélectionné{selectedColis.length > 1 ? 's' : ''}</span>
                        <button
                          className="ms-2 underline hover:text-primary-focus font-normal"
                          onClick={() => setSelectedColis([])}
                        >
                          Effacer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filter Toolbar */}
                  <div className="p-4 bg-accent/30 dark:bg-zinc-900/40 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="grow max-w-md">
                      <label className="kt-input w-full bg-background">
                        <i className="ki-filled ki-magnifier text-muted-foreground me-2 me-sm-0"></i>
                        <input
                          type="text"
                          placeholder="Rechercher par N° commande, code suivi, destinataire, ville..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="text-sm"
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <KtSelect
                        value={cityFilter}
                        onChange={(val) => setCityFilter(val)}
                        placeholder="Ville"
                        className="w-40"
                        options={[
                          { value: '', label: 'Toutes les villes' },
                          ...availableCities.map(c => ({ value: c, label: c }))
                        ]}
                      />
                      {cityFilter && (
                        <button
                          className="kt-btn kt-btn-xs kt-btn-outline text-xs me-2 me-sm-0"
                          onClick={() => setCityFilter('')}
                        >
                          Tout
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Table View */}
                  <div className="kt-card-content p-0">
                    {fetching ? (
                      <div className="p-8 text-center text-secondary-foreground space-y-3">
                        <div className="h-10 bg-accent/50 rounded-xl animate-pulse"></div>
                        <div className="h-10 bg-accent/50 rounded-xl animate-pulse"></div>
                        <div className="h-10 bg-accent/50 rounded-xl animate-pulse"></div>
                      </div>
                    ) : filteredColis.length === 0 ? (
                      <div className="p-12 text-center text-secondary-foreground flex flex-col items-center gap-3">
                        <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl">
                          <i className="ki-filled ki-shield-check"></i>
                        </div>
                        <h4 className="text-base font-bold text-foreground me-2 me-sm-0">Aucun colis à assigner</h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Tous vos colis en préparation ont été attribués à des livreurs ou aucune commande ne correspond aux filtres.
                        </p>
                      </div>
                    ) : (
                      <div className="kt-scrollable-x-auto">
                        <table className="kt-table table-auto w-full text-sm">
                          <thead>
                            <tr className="bg-accent/40 dark:bg-zinc-900/60 text-xs font-semibold text-secondary-foreground uppercase tracking-wider border-b border-border/60">
                              <th className="w-12 text-center py-3.5 px-4">
                                <input
                                  type="checkbox"
                                  className="kt-checkbox kt-checkbox-sm"
                                  checked={filteredColis.length > 0 && selectedColis.length === filteredColis.length}
                                  onChange={toggleSelectAll}
                                />
                              </th>
                              <th className="py-3.5 px-4 text-start">N° Commande / Suivi</th>
                              <th className="py-3.5 px-4 text-start">Destinataire</th>
                              <th className="py-3.5 px-4 text-start">Ville</th>
                              <th className="py-3.5 px-4 text-start">Adresse</th>
                              <th className="py-3.5 px-4 text-start">Marchandise</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {filteredColis.map((colis) => {
                              const isChecked = selectedColis.includes(colis.id);
                              return (
                                <tr
                                  key={colis.id}
                                  className={`transition-all duration-150 cursor-pointer ${
                                    isChecked 
                                      ? 'bg-primary/5 dark:bg-primary/10 border-s-4 border-primary' 
                                      : 'hover:bg-accent/30'
                                  }`}
                                  onClick={() => toggleColis(colis.id)}
                                >
                                  <td className="text-center py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      className="kt-checkbox kt-checkbox-sm"
                                      checked={isChecked}
                                      onChange={() => toggleColis(colis.id)}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-mono font-bold text-foreground text-sm me-2 me-sm-0">
                                      {colis.orderNumber}
                                    </div>
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono bg-accent/60 text-secondary-foreground me-2 me-sm-0">
                                      {colis.trackingCode}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="size-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                        {(colis.recipient || 'C')[0].toUpperCase()}
                                      </div>
                                      <span className="font-medium text-foreground text-sm truncate max-w-[140px] me-2 me-sm-0">
                                        {colis.recipient || 'Client'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="kt-badge kt-badge-outline kt-badge-primary rounded-full px-2.5 py-0.5 text-xs font-medium me-2 me-sm-0">
                                      {colis.city}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-xs text-secondary-foreground max-w-[180px] truncate me-2 me-sm-0">
                                    <i className="ki-filled ki-geolocation text-muted-foreground me-1 me-2 me-sm-0"></i>
                                    {colis.address || '-'}
                                  </td>
                                  <td className="py-3 px-4 text-xs font-medium text-foreground me-2 me-sm-0">
                                    {colis.productNature || 'Marchandise'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Right Column: Livreur Selection Control (1/3 width) */}
              <div className="flex flex-col gap-5">

                {/* Primary Assignment Hero Card */}
                <div className="kt-card border border-primary/30 shadow-lg shadow-primary/5 rounded-2xl overflow-hidden bg-gradient-to-b from-background to-primary/5 dark:to-primary/10">
                  <div className="p-5 border-b border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="ki-filled ki-user-tick text-primary text-xl"></i>
                      <h3 className="text-base font-bold text-foreground me-2 me-sm-0">Affectation rapide</h3>
                    </div>
                    {selectedColis.length > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-sm me-2 me-sm-0">
                        {selectedColis.length} sélectionné{selectedColis.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-secondary-foreground mb-1.5 block uppercase tracking-wider me-2 me-sm-0">
                        1. Choisissez le livreur
                      </label>
                      <KtSelect
                        value={selectedLivreurId}
                        onChange={(val) => setSelectedLivreurId(val)}
                        placeholder="Sélectionner un livreur disponible..."
                        className="w-full"
                        options={[
                          { value: '', label: 'Sélectionner un livreur...' },
                          ...disponibles.map(l => ({
                            value: String(l.id),
                            label: `${l.fullName} — ${l.city} (${l.stats?.total ?? 0} colis)`
                          }))
                        ]}
                      />
                    </div>

                    <button
                      type="button"
                      className="kt-btn kt-btn-primary w-full py-3 text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 me-2 me-sm-0"
                      disabled={loading || selectedColis.length === 0 || !selectedLivreurId}
                      onClick={() => handleManualAssign()}
                    >
                      {loading ? (
                        'Attribution en cours...'
                      ) : (
                        <>
                          <i className="ki-filled ki-check-circle me-1.5 text-base me-2 me-sm-0"></i>
                          Assigner {selectedColis.length > 0 ? selectedColis.length : ''} colis {selectedLivreurObj ? `à ${selectedLivreurObj.fullName}` : ''}
                        </>
                      )}
                    </button>

                    {selectedColis.length === 0 && (
                      <p className="text-[11px] text-muted-foreground text-center me-2 me-sm-0">
                        💡 Cochez un ou plusieurs colis dans le tableau de gauche pour activer l'attribution.
                      </p>
                    )}
                  </div>
                </div>

                {/* Livreurs Cards Grid */}
                <div className="kt-card border border-border/60 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4 me-2 me-sm-0">
                    <h4 className="text-xs font-bold text-secondary-foreground uppercase tracking-wider me-2 me-sm-0">
                      Livreurs actifs par zone ({disponibles.length})
                    </h4>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[440px] overflow-y-auto pe-1">
                    {disponibles.length === 0 ? (
                      <div className="p-6 text-xs text-center text-muted-foreground border border-dashed rounded-xl me-2 me-sm-0">
                        Aucun livreur disponible.
                      </div>
                    ) : (
                      disponibles.map((l) => {
                        const isSelected = String(selectedLivreurId) === String(l.id);
                        return (
                          <div
                            key={l.id}
                            className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 transition-all duration-200 ${
                              isSelected
                                ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                                : 'border-border/60 hover:border-primary/40 hover:bg-accent/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 me-2 me-sm-0">
                              <div
                                className="size-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ring-2 ring-background me-2 me-sm-0"
                                style={{ background: `hsl(${(l.id * 53) % 360}, 65%, 46%)` }}
                              >
                                {l.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>

                              <div className="flex flex-col min-w-0 me-2 me-sm-0">
                                <div className="flex items-center gap-1.5 me-2 me-sm-0">
                                  <span className="text-sm font-bold text-foreground truncate me-2 me-sm-0">
                                    {l.fullName}
                                  </span>
                                  <span className="size-2 rounded-full bg-emerald-500 shrink-0"></span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-secondary-foreground me-2 me-sm-0">
                                  <span className="font-semibold text-foreground me-2 me-sm-0">{l.city}</span>
                                  <span>•</span>
                                  <span>{l.stats?.total ?? 0} colis en cours</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              className={`kt-btn kt-btn-xs shrink-0 font-medium ${
                                isSelected ? 'kt-btn-primary' : 'kt-btn-outline'
                              }`}
                              disabled={loading || selectedColis.length === 0}
                              onClick={() => {
                                setSelectedLivreurId(String(l.id));
                                handleManualAssign(l.id);
                              }}
                            >
                              Assigner
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
        )}

        {/* Tab 2: Attribution Automatique */}
        {activeTab === 'auto' && (
          <div className="kt-container-fixed">
            <div className="kt-card max-w-4xl mx-auto border border-border/60 shadow-lg rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border/60 bg-gradient-to-r from-primary/10 via-purple-500/5 to-emerald-500/10">
                <div className="flex items-center gap-3 me-2 me-sm-0">
                  <div className="size-10 rounded-xl bg-primary text-white flex items-center justify-center text-xl shadow-md me-2 me-sm-0">
                    <i className="ki-filled ki-technology-2"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground me-2 me-sm-0">
                      Attribution Automatique Logistique (par Zone)
                    </h3>
                    <p className="text-xs text-secondary-foreground me-2 me-sm-0">
                      Distribution intelligente basée sur la ville de destination des colis et la zone d'intervention des livreurs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  <div className="p-5 rounded-2xl bg-accent/30 border border-border/60 flex flex-col gap-1 shadow-sm me-2 me-sm-0">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider me-2 me-sm-0">Colis à attribuer</span>
                    <span className="text-3xl font-extrabold text-foreground me-2 me-sm-0">{colisDisp.length}</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-accent/30 border border-border/60 flex flex-col gap-1 shadow-sm me-2 me-sm-0">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider me-2 me-sm-0">Livreurs actifs</span>
                    <span className="text-3xl font-extrabold text-foreground me-2 me-sm-0">{disponibles.length}</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-accent/30 border border-border/60 flex flex-col gap-1 shadow-sm me-2 me-sm-0">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider me-2 me-sm-0">Villes couvertes</span>
                    <span className="text-3xl font-extrabold text-foreground me-2 me-sm-0">{availableCities.length}</span>
                  </div>
                </div>

                <div className="p-6 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl mb-8 space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2 me-2 me-sm-0">
                    <i className="ki-filled ki-check-circle text-primary text-base me-2 me-sm-0"></i>
                    Workflow d'Attribution Automatique
                  </h4>
                  <ul className="text-xs text-secondary-foreground space-y-2.5 ps-5 list-disc me-2 me-sm-0">
                    <li>Regroupe tous les colis non assignés par ville de destination.</li>
                    <li>Recherche les livreurs actifs travaillant dans la même ville.</li>
                    <li>Effectue l'attribution équitable, met à jour le statut du colis en <strong>Expédié / En cours</strong> et la fiche dans <strong>Liste des ramassages</strong>.</li>
                  </ul>
                </div>

                {doneAuto ? (
                  <div className="space-y-6">
                    <div className="flex gap-4 border rounded-2xl p-6 bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 me-2 me-sm-0">
                      <i className="ki-filled ki-check-circle text-3xl shrink-0 mt-0.5 me-2 me-sm-0"></i>
                      <div>
                        <h4 className="font-bold text-base me-2 me-sm-0">Attribution terminée avec succès !</h4>
                        <p className="text-xs mt-1 me-2 me-sm-0">
                          {assignments.length} colis ont été attribués aux livreurs par ville.
                        </p>
                      </div>
                    </div>

                    {assignments.length > 0 && (
                      <div className="grid gap-2.5 max-h-64 overflow-y-auto border border-border/60 rounded-2xl p-4 bg-accent/20">
                        {assignments.map((a, i) => (
                          <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border/40 text-sm shadow-sm">
                            <div className="font-mono font-bold text-foreground me-2 me-sm-0">{a.colis}</div>
                            <div className="flex items-center gap-2 text-xs me-2 me-sm-0">
                              <span className="kt-badge kt-badge-outline kt-badge-primary rounded-full px-2 py-0.5 me-2 me-sm-0">{a.city}</span>
                              <span className="text-secondary-foreground me-2 me-sm-0">➔</span>
                              <span className="font-bold text-foreground me-2 me-sm-0">{a.livreur}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      className="kt-btn kt-btn-outline w-full py-3.5 font-bold me-2 me-sm-0"
                      onClick={() => { setDoneAuto(false); setAssignments([]); }}
                    >
                      Lancer une nouvelle attribution
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="kt-btn kt-btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-200 me-2 me-sm-0"
                    onClick={handleAutoAssign}
                    disabled={loading || colisDisp.length === 0}
                  >
                    {loading ? (
                      'Attribution en cours...'
                    ) : (
                      <>
                        <i className="ki-filled ki-technology-2 me-2 text-lg me-2 me-sm-0"></i>
                        Lancer l'attribution automatique ({colisDisp.length} colis)
                      </>
                    )}
                  </button>
                )}

              </div>
            </div>
          </div>
        )}

      </main>
    </DashboardLayout>
  );
}
