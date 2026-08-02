import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function LivreurAutoAssignPage({ navigate, showNotification }) {
  const [activeTab, setActiveTab]       = useState('manual'); // 'manual' or 'auto'
  const [livreurs, setLivreurs]         = useState([]);
  const [colisDisp, setColisDisp]       = useState([]);
  const [selectedColis, setSelectedColis] = useState([]);
  const [selectedLivreurId, setSelectedLivreurId] = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [cityFilter, setCityFilter]     = useState('');
  const [assignments, setAssignments]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(true);
  const [doneAuto, setDoneAuto]         = useState(false);

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
        // Filter unassigned colis pending assignment/pickup
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

  // Unique list of cities from available colis for filter
  const availableCities = Array.from(new Set(colisDisp.map(c => c.city).filter(Boolean)));
  const disponibles = livreurs.filter(l => l.disponible);

  // Filtered colis list based on search and city
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

        {/* Page Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                Attribution & Dispatch des Colis
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Affectez vos colis en attente aux livreurs de manière manuelle ou automatisée par zone.
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                type="button" 
                className="kt-btn kt-btn-outline" 
                onClick={() => navigate('/livreurs')}
              >
                <i className="ki-filled ki-arrow-left text-base me-1"></i>
                Retour à la liste des livreurs
              </button>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="kt-container-fixed mb-6">
          <div className="flex border-b border-border/70 gap-8">
            <button
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'manual'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('manual')}
            >
              <i className="ki-filled ki-hand-cart text-lg"></i>
              Attribution Manuelle
              <span className="kt-badge kt-badge-primary rounded-full px-2 py-0.5 text-xs ms-1">
                {colisDisp.length} colis
              </span>
            </button>

            <button
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'auto'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-secondary-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('auto')}
            >
              <i className="ki-filled ki-technology-2 text-lg"></i>
              Attribution Automatique (IA / Zone)
            </button>
          </div>
        </div>

        {/* Tab 1: Attribution Manuelle */}
        {activeTab === 'manual' && (
          <div className="kt-container-fixed">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Main Table Area (2/3 width on large screens) */}
              <div className="xl:col-span-2 flex flex-col gap-5">
                <div className="kt-card kt-card-grid">
                  
                  {/* Card Header & Controls */}
                  <div className="kt-card-header flex-wrap gap-4 py-4 px-6">
                    <div className="flex items-center gap-2">
                      <h3 className="kt-card-title text-base font-semibold">
                        Sélection des colis à attribuer
                      </h3>
                      <span className="text-xs text-muted-foreground me-2">
                        ({filteredColis.length} sur {colisDisp.length})
                      </span>
                    </div>

                    {/* Action Bar when parcels are selected */}
                    {selectedColis.length > 0 && (
                      <div className="flex items-center gap-2 bg-accent/60 px-3 py-1.5 rounded-lg border border-primary/20 animate-fade-in">
                        <span className="text-xs font-semibold text-primary">
                          {selectedColis.length} colis sélectionné{selectedColis.length > 1 ? 's' : ''}
                        </span>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground underline ms-2"
                          onClick={() => setSelectedColis([])}
                        >
                          Désélectionner tout
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filters Bar */}
                  <div className="px-6 py-3 bg-accent/20 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 grow max-w-md">
                      <label className="kt-input w-full">
                        <i className="ki-filled ki-magnifier text-muted-foreground"></i>
                        <input
                          type="text"
                          placeholder="Rechercher par n° commande, code suivi, destinataire, ville..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <KtSelect
                        value={cityFilter}
                        onChange={(val) => setCityFilter(val)}
                        placeholder="Filtrer par ville"
                        className="w-44"
                        options={[
                          { value: '', label: 'Toutes les villes' },
                          ...availableCities.map(c => ({ value: c, label: c }))
                        ]}
                      />
                      {cityFilter && (
                        <button
                          className="kt-btn kt-btn-sm kt-btn-ghost text-xs"
                          onClick={() => setCityFilter('')}
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="kt-card-content p-0">
                    {fetching ? (
                      <div className="p-8 text-center text-secondary-foreground">
                        <div className="animate-pulse space-y-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-10 bg-accent/50 rounded-lg w-full"></div>
                          ))}
                        </div>
                      </div>
                    ) : filteredColis.length === 0 ? (
                      <div className="p-12 text-center text-secondary-foreground flex flex-col items-center gap-3">
                        <i className="ki-filled ki-information-2 text-4xl text-muted-foreground/40"></i>
                        <p className="font-medium">Aucun colis non assigné disponible.</p>
                        <p className="text-xs text-muted-foreground">
                          Tous les colis en préparation ont déjà été attribués aux livreurs !
                        </p>
                      </div>
                    ) : (
                      <div className="kt-scrollable-x-auto">
                        <table className="kt-table table-auto kt-table-border w-full text-sm">
                          <thead>
                            <tr className="bg-accent/30 text-xs text-secondary-foreground">
                              <th className="w-12 text-center py-3">
                                <input
                                  type="checkbox"
                                  className="kt-checkbox kt-checkbox-sm"
                                  checked={filteredColis.length > 0 && selectedColis.length === filteredColis.length}
                                  onChange={toggleSelectAll}
                                />
                              </th>
                              <th className="min-w-[140px] text-start">N° Commande / Suivi</th>
                              <th className="min-w-[160px] text-start">Destinataire</th>
                              <th className="min-w-[120px] text-start">Ville</th>
                              <th className="min-w-[180px] text-start">Adresse</th>
                              <th className="min-w-[140px] text-start">Marchandise</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredColis.map((colis) => {
                              const isChecked = selectedColis.includes(colis.id);
                              return (
                                <tr
                                  key={colis.id}
                                  className={`hover:bg-accent/40 cursor-pointer transition-colors ${
                                    isChecked ? 'bg-primary/5 dark:bg-primary/10' : ''
                                  }`}
                                  onClick={() => toggleColis(colis.id)}
                                >
                                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      className="kt-checkbox kt-checkbox-sm"
                                      checked={isChecked}
                                      onChange={() => toggleColis(colis.id)}
                                    />
                                  </td>
                                  <td className="font-medium text-mono text-foreground">
                                    <div>{colis.orderNumber}</div>
                                    <div className="text-[11px] text-muted-foreground">{colis.trackingCode}</div>
                                  </td>
                                  <td className="text-foreground">
                                    <div className="font-medium me-2 me-sm-0">{colis.recipient || '-'}</div>
                                  </td>
                                  <td>
                                    <span className="kt-badge kt-badge-outline kt-badge-primary rounded-full px-2 py-0.5 text-xs font-normal me-2 me-sm-0">
                                      {colis.city}
                                    </span>
                                  </td>
                                  <td className="text-secondary-foreground text-xs max-w-[200px] truncate">
                                    {colis.address || '-'}
                                  </td>
                                  <td className="text-foreground text-xs">
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

              {/* Sidebar Livreur Selection Panel (1/3 width) */}
              <div className="flex flex-col gap-5">
                <div className="kt-card">
                  <div className="kt-card-header py-4 px-6">
                    <h3 className="kt-card-title text-base font-semibold">
                      Assigner à un livreur
                    </h3>
                  </div>

                  <div className="kt-card-content p-6 flex flex-col gap-5">

                    {/* Quick Dropdown Assignment */}
                    <div className="flex flex-col gap-2 p-4 bg-accent/30 rounded-xl border border-border/60">
                      <label className="text-xs font-semibold text-secondary-foreground">
                        Choix rapide du livreur
                      </label>
                      <KtSelect
                        value={selectedLivreurId}
                        onChange={(val) => setSelectedLivreurId(val)}
                        placeholder="Sélectionner un livreur..."
                        className="w-full"
                        options={[
                          { value: '', label: 'Choisir un livreur...' },
                          ...disponibles.map(l => ({
                            value: String(l.id),
                            label: `${l.fullName} (${l.city})`
                          }))
                        ]}
                      />

                      <button
                        type="button"
                        className="kt-btn kt-btn-primary w-full mt-2"
                        disabled={loading || selectedColis.length === 0 || !selectedLivreurId}
                        onClick={() => handleManualAssign()}
                      >
                        {loading ? (
                          'Attribution en cours...'
                        ) : (
                          <>
                            <i className="ki-filled ki-user-check text-base me-1"></i>
                            Assigner {selectedColis.length} colis {selectedLivreurObj ? `à ${selectedLivreurObj.fullName}` : ''}
                          </>
                        )}
                      </button>
                    </div>

                    {/* List of Active Livreurs Cards */}
                    <div>
                      <p className="text-xs font-semibold text-secondary-foreground mb-3 uppercase tracking-wider">
                        Livreurs disponibles par zone ({disponibles.length})
                      </p>

                      <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pe-1">
                        {disponibles.length === 0 ? (
                          <div className="p-4 text-xs text-center text-muted-foreground border border-dashed rounded-lg">
                            Aucun livreur disponible actuellement.
                          </div>
                        ) : (
                          disponibles.map((l) => (
                            <div
                              key={l.id}
                              className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 transition-all hover:shadow-sm ${
                                String(selectedLivreurId) === String(l.id)
                                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                  : 'border-border/60 hover:border-primary/40'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 me-2 me-sm-0">
                                <div
                                  className="size-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm"
                                  style={{ background: `hsl(${(l.id * 53) % 360}, 65%, 48%)` }}
                                >
                                  {l.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-semibold text-foreground truncate me-2 me-sm-0">
                                    {l.fullName}
                                  </span>
                                  <div className="flex items-center gap-2 text-xs text-secondary-foreground me-2 me-sm-0">
                                    <span className="font-medium text-foreground me-2 me-sm-0">{l.city}</span>
                                    <span>•</span>
                                    <span>{l.stats?.total ?? 0} colis en cours</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="kt-btn kt-btn-xs kt-btn-outline kt-btn-primary shrink-0"
                                disabled={loading || selectedColis.length === 0}
                                onClick={() => handleManualAssign(l.id)}
                              >
                                Assigner
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Attribution Automatique */}
        {activeTab === 'auto' && (
          <div className="kt-container-fixed">
            <div className="kt-card max-w-4xl mx-auto">
              <div className="kt-card-header py-5 px-8">
                <h3 className="kt-card-title text-base font-semibold flex items-center gap-2">
                  <i className="ki-filled ki-technology-2 text-primary text-xl"></i>
                  Attribution Automatique par Zone & Ville
                </h3>
              </div>

              <div className="kt-card-content p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-accent/40 border border-border/60 flex flex-col gap-1">
                    <span className="text-xs text-secondary-foreground font-medium">Colis à assigner</span>
                    <span className="text-2xl font-bold text-foreground">{colisDisp.length}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/40 border border-border/60 flex flex-col gap-1">
                    <span className="text-xs text-secondary-foreground font-medium">Livreurs actifs</span>
                    <span className="text-2xl font-bold text-foreground">{disponibles.length}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/40 border border-border/60 flex flex-col gap-1">
                    <span className="text-xs text-secondary-foreground font-medium">Villes couvertes</span>
                    <span className="text-2xl font-bold text-foreground">{availableCities.length}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl mb-8">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 me-2 me-sm-0">
                    <i className="ki-filled ki-check-circle text-primary"></i>
                    Comment fonctionne l'attribution automatique ?
                  </h4>
                  <ul className="text-xs text-secondary-foreground space-y-2 ps-6 list-disc me-2 me-sm-0">
                    <li>Regroupe les colis non assignés en préparation par leur ville de destination.</li>
                    <li>Identifie les livreurs disponibles opérant dans chaque ville correspondante.</li>
                    <li>Répartit équitablement les colis et passe leur état à <strong>Expédié</strong> et statut à <strong>En cours</strong>.</li>
                    <li>Met à jour automatiquement la fiche dans la <strong>Liste des ramassages</strong>.</li>
                  </ul>
                </div>

                {doneAuto ? (
                  <div className="space-y-6">
                    <div className="flex gap-3 border rounded-xl p-5 bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 me-2 me-sm-0">
                      <i className="ki-filled ki-check-circle text-2xl shrink-0 mt-0.5"></i>
                      <div>
                        <h4 className="font-semibold text-sm me-2 me-sm-0">Attribution automatique effectuée avec succès !</h4>
                        <p className="text-xs mt-1 me-2 me-sm-0">
                          {assignments.length} colis ont été distribués aux livreurs correspondants.
                        </p>
                      </div>
                    </div>

                    {assignments.length > 0 && (
                      <div className="grid gap-2 max-h-60 overflow-y-auto border border-border/60 rounded-xl p-3 bg-accent/20">
                        {assignments.map((a, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/40 text-sm">
                            <span className="font-mono font-medium text-foreground">{a.colis}</span>
                            <span className="text-xs text-secondary-foreground me-2 me-sm-0">
                              ➔ <strong className="text-foreground">{a.livreur}</strong> ({a.city})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      className="kt-btn kt-btn-outline w-full py-3 me-2 me-sm-0"
                      onClick={() => { setDoneAuto(false); setAssignments([]); }}
                    >
                      Refaire une attribution automatique
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="kt-btn kt-btn-primary w-full py-3 text-sm font-semibold me-2 me-sm-0"
                    onClick={handleAutoAssign}
                    disabled={loading || colisDisp.length === 0}
                  >
                    {loading ? (
                      'Attribution en cours...'
                    ) : (
                      <>
                        <i className="ki-filled ki-technology-2 me-2 text-base me-2 me-sm-0"></i>
                        Lancer l'attribution automatique par zone ({colisDisp.length} colis)
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
