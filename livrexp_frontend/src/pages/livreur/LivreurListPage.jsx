import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function LivreurListPage({ navigate, showNotification }) {
  const [livreurs, setLivreurs]       = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterCity, setFilterCity]   = useState('');
  const [filterDispo, setFilterDispo] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [perPage, setPerPage]         = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const headers = () => {
    const t = localStorage.getItem('auth_token');
    return { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/livreurs', { headers: headers(), credentials: 'include' }),
        fetch('/api/livreurs/stats/global', { headers: headers(), credentials: 'include' }),
      ]);
      if (r1.ok) { const d = await r1.json(); if (d.success) setLivreurs(d.livreurs); }
      if (r2.ok) { const d = await r2.json(); if (d.success) setStats(d); }
    } catch {
      setLivreurs([
        { id: 1, fullName: 'Karim Alami', email: 'karim@livrexpress.ma', phone: '0661234567', city: 'Casablanca', disponible: true, isLive: true, lastSeen: "À l'instant", stats: { total: 24, livres: 18, retours: 3, enCours: 3, tauxLivraison: 75, commission: 270 } },
        { id: 2, fullName: 'Youssef Benali', email: 'youssef@livrexpress.ma', phone: '0662345678', city: 'Rabat', disponible: true, isLive: false, lastSeen: 'Il y a 10 min', stats: { total: 15, livres: 12, retours: 2, enCours: 1, tauxLivraison: 80, commission: 180 } },
        { id: 3, fullName: 'Omar Tazi', email: 'omar@livrexpress.ma', phone: '0663456789', city: 'Marrakech', disponible: false, isLive: false, lastSeen: 'Hier', stats: { total: 8, livres: 5, retours: 1, enCours: 2, tauxLivraison: 62.5, commission: 75 } },
      ]);
      setStats({ totalLivreurs: 3, disponibles: 2, colisLivres: 35, colisExpedies: 6, tauxLivraison: 72.4, tauxRetour: 8.3 });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (activeDropdownId !== null && !e.target.closest('.kt-menu-toggle')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, [activeDropdownId]);

  const toggleDropdown = (id, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.right + window.scrollX - 175 });
    setActiveDropdownId(prev => prev === id ? null : id);
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const r = await fetch(`/api/livreurs/${deleteTarget.id}`, { method: 'DELETE', headers: headers(), credentials: 'include' });
      const d = await r.json();
      if (d.success) {
        showNotification?.('success', d.message);
        setDeleteTarget(null);
        loadData();
      } else {
        showNotification?.('error', d.message || 'Erreur lors de la suppression.');
      }
    } catch { showNotification?.('error', 'Erreur de connexion.'); }
    finally { setDeleteLoading(false); }
  };

  const cities = [...new Set(livreurs.map(l => l.city).filter(Boolean))].sort();
  const cityOptions = [{ value: '', label: 'Toutes les villes' }, ...cities.map(c => ({ value: c, label: c }))];
  const dispoOptions = [{ value: '', label: 'Disponibilité' }, { value: '1', label: 'Disponible' }, { value: '0', label: 'Indisponible' }];

  const filtered = livreurs.filter(l => {
    const q = search.toLowerCase();
    return (!search || [l.fullName, l.email, l.phone, l.city].some(v => v?.toLowerCase().includes(q)))
        && (!filterCity  || l.city === filterCity)
        && (!filterDispo || (filterDispo === '1' ? l.disponible : !l.disponible));
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleReset = () => { setSearch(''); setFilterCity(''); setFilterDispo(''); setCurrentPage(1); };

  return (
    <DashboardLayout activeMenu="livreurs_list">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Gestion des Livreurs</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total:</span>
                <span className="text-base text-foreground font-medium me-2">{filtered.length} livreur{filtered.length !== 1 ? 's' : ''}</span>
                {stats && (
                  <>
                    <span className="text-base text-secondary-foreground">Disponibles:</span>
                    <span className="text-base text-foreground font-medium">{stats.disponibles}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="kt-btn kt-btn-outline"
                onClick={() => navigate('/livreurs/auto-assign')}
              >
                <i className="ki-filled ki-technology-2 text-base" /> Attribution Auto
              </button>
              <button
                type="button"
                className="kt-btn kt-btn-primary"
                onClick={() => navigate('/livreurs/new')}
              >
                Ajouter un livreur
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">

              {/* Card Header & Filters */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">
                  Affichage de {filtered.length} livreur{filtered.length !== 1 ? 's' : ''}
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier" />
                      <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher un livreur"
                        type="text"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={filterCity}
                      onChange={(val) => { setFilterCity(val); setCurrentPage(1); }}
                      placeholder="Ville"
                      className="w-40"
                      options={cityOptions}
                    />
                    <KtSelect
                      value={filterDispo}
                      onChange={(val) => { setFilterDispo(val); setCurrentPage(1); }}
                      placeholder="Disponibilité"
                      className="w-40"
                      options={dispoOptions}
                    />
                    <button className="kt-btn kt-btn-outline" onClick={handleReset}>
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="kt-card-content">
                <div className="grid">
                  <div className="kt-scrollable-x-auto">
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                        <tr>
                          <th className="min-w-[200px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Livreur</span></span>
                          </th>
                          <th className="min-w-[120px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Ville</span></span>
                          </th>
                          <th className="min-w-[110px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Disponibilité</span></span>
                          </th>
                          <th className="min-w-[90px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Colis</span></span>
                          </th>
                          <th className="min-w-[110px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Taux Livr.</span></span>
                          </th>
                          <th className="min-w-[120px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Commission</span></span>
                          </th>
                          <th className="min-w-[90px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">GPS</span></span>
                          </th>
                          <th className="w-[90px] text-center">
                            <span className="kt-table-col"><span className="kt-table-col-label">Actions</span></span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={`skel-${i}`}>
                              {Array.from({ length: 8 }).map((_, j) => (
                                <td key={j}>
                                  <div style={{ height: '14px', borderRadius: '6px', background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: j === 7 ? '40px' : '100%', margin: j === 7 ? 'auto' : undefined }} />
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : paginated.length > 0 ? (
                          paginated.map((l) => {
                            const taux = l.stats?.tauxLivraison ?? 0;
                            const tauxColor = taux >= 75 ? 'text-success' : taux >= 50 ? 'text-warning' : 'text-destructive';
                            const barColor  = taux >= 75 ? 'bg-success'  : taux >= 50 ? 'bg-warning'  : 'bg-destructive';
                            return (
                              <tr key={l.id}>
                                {/* Livreur */}
                                <td>
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className="size-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
                                      style={{ background: `hsl(${(l.id * 47) % 360}, 60%, 50%)` }}
                                    >
                                      {l.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <button
                                        className="text-foreground hover:underline text-start bg-transparent border-0 p-0 font-medium cursor-pointer text-sm"
                                        onClick={() => navigate(`/livreurs/${l.id}`)}
                                      >
                                        {l.fullName}
                                      </button>
                                      <span className="text-xs text-secondary-foreground">{l.phone}</span>
                                    </div>
                                  </div>
                                </td>
                                {/* Ville */}
                                <td className="text-foreground font-normal">{l.city}</td>
                                {/* Disponibilité */}
                                <td>
                                  <span className={`kt-badge ${l.disponible ? 'kt-badge-success' : 'kt-badge-secondary'} kt-badge-outline rounded-[30px]`}>
                                    <span className="kt-badge-dot size-1.5" />
                                    {l.disponible ? 'Disponible' : 'Indisponible'}
                                  </span>
                                </td>
                                {/* Colis */}
                                <td>
                                  <span className="text-foreground font-medium">{l.stats?.total ?? 0}</span>
                                  <div className="text-xs text-secondary-foreground">{l.stats?.enCours ?? 0} en cours</div>
                                </td>
                                {/* Taux */}
                                <td>
                                  <span className={`font-medium text-sm ${tauxColor}`}>{taux}%</span>
                                  <div className="h-1 w-16 bg-muted rounded-full mt-1">
                                    <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${taux}%` }} />
                                  </div>
                                </td>
                                {/* Commission */}
                                <td className="text-foreground font-medium">
                                  {(l.stats?.commission ?? 0).toLocaleString('fr-FR')} MAD
                                </td>
                                {/* GPS */}
                                <td>
                                  {l.isLive ? (
                                    <span className="kt-badge kt-badge-success kt-badge-outline rounded-[30px]">
                                      <span className="kt-badge-dot size-1.5" />Live
                                    </span>
                                  ) : (
                                    <span className="text-xs text-secondary-foreground">{l.lastSeen}</span>
                                  )}
                                </td>
                                {/* Actions */}
                                <td className="text-center relative">
                                  <div className="inline-block text-left">
                                    <button
                                      id={`livreur-action-btn-${l.id}`}
                                      className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                      onClick={(e) => toggleDropdown(l.id, e)}
                                    >
                                      <i className="ki-filled ki-dots-vertical text-lg" />
                                    </button>
                                    {activeDropdownId === l.id && dropdownPos && createPortal(
                                      <div
                                        className="kt-menu-dropdown kt-menu-default fixed w-[175px]"
                                        style={{ position: 'fixed', top: `${dropdownPos.top - window.scrollY}px`, left: `${dropdownPos.left - window.scrollX}px`, zIndex: 99999, display: 'block' }}
                                      >
                                        <div className="kt-menu-item">
                                          <button type="button" className="kt-menu-link text-start w-full" onClick={() => { setActiveDropdownId(null); navigate(`/livreurs/${l.id}`); }}>
                                            <span className="kt-menu-icon"><i className="ki-filled ki-eye" /></span>
                                            <span className="kt-menu-title">Voir la fiche</span>
                                          </button>
                                        </div>
                                        <div className="kt-menu-item">
                                          <button type="button" className="kt-menu-link text-start w-full" onClick={() => { setActiveDropdownId(null); navigate(`/livreurs/${l.id}/tournee`); }}>
                                            <span className="kt-menu-icon"><i className="ki-filled ki-route" /></span>
                                            <span className="kt-menu-title">Tournée du jour</span>
                                          </button>
                                        </div>
                                        <div className="kt-menu-separator" />
                                        <div className="kt-menu-item">
                                          <button
                                            type="button"
                                            className="kt-menu-link text-start w-full text-destructive hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-600"
                                            onClick={() => { setActiveDropdownId(null); setDeleteTarget({ id: l.id, name: l.fullName }); }}
                                          >
                                            <span className="kt-menu-icon text-destructive"><i className="ki-filled ki-trash" /></span>
                                            <span className="kt-menu-title text-destructive">Supprimer</span>
                                          </button>
                                        </div>
                                      </div>,
                                      document.body
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-secondary-foreground">
                              Aucun livreur correspondant
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium py-4">
                    <div className="flex items-center gap-2 order-2 md:order-1">
                      Afficher
                      <KtSelect
                        value={String(perPage)}
                        onChange={(val) => { setPerPage(Number(val)); setCurrentPage(1); }}
                        className="w-16"
                        options={[{ value: '5', label: '5' }, { value: '10', label: '10' }, { value: '20', label: '20' }]}
                      />
                      par page
                    </div>
                    <div className="flex items-center gap-4 order-1 md:order-2">
                      <span>
                        Affichage de {Math.min(filtered.length, (currentPage - 1) * perPage + 1)} à {Math.min(filtered.length, currentPage * perPage)} sur {filtered.length} livreurs
                      </span>
                      {totalPages > 1 && (
                        <div className="flex gap-1">
                          <button className="kt-btn kt-btn-sm kt-btn-outline px-2" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>Précédent</button>
                          <span className="px-3 py-1 bg-accent/40 rounded text-foreground font-semibold">{currentPage} / {totalPages}</span>
                          <button className="kt-btn kt-btn-sm kt-btn-outline px-2" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>Suivant</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && createPortal(
        <div
          className="fixed flex items-center justify-center p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 99999 }}
          onClick={() => !deleteLoading && setDeleteTarget(null)}
        >
          <div
            className="bg-white dark:bg-zinc-950 border rounded-lg shadow-xl overflow-hidden"
            style={{ width: '100%', maxWidth: '440px', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-base font-semibold text-foreground">Supprimer le livreur</h3>
              <button type="button" onClick={() => setDeleteTarget(null)} className="text-muted-foreground hover:text-foreground" disabled={deleteLoading}>
                <i className="ki-filled ki-cross text-lg" />
              </button>
            </div>
            <form onSubmit={handleDeleteSubmit} className="p-5">
              <div className="flex gap-3 border rounded-lg p-4 mb-5" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <i className="ki-filled ki-information-2 text-red-600 text-xl shrink-0 mt-0.5" />
                <div className="text-sm text-foreground leading-relaxed">
                  Vous êtes sur le point de supprimer le livreur <strong className="font-semibold">{deleteTarget.name}</strong>. Cette action est irréversible.
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setDeleteTarget(null)} className="kt-btn kt-btn-outline" disabled={deleteLoading}>Annuler</button>
                <button type="submit" className="kt-btn kt-btn-destructive" disabled={deleteLoading}>
                  {deleteLoading ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
}
