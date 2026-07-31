import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function LivreurListPage({ navigate, showNotification }) {
  const [livreurs, setLivreurs] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterCity, setFilterCity]   = useState('');
  const [filterDispo, setFilterDispo] = useState('');
  const [openMenu, setOpenMenu] = useState(null);

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
    const close = (e) => { if (!e.target.closest('.action-menu-wrapper')) setOpenMenu(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer ${name} ?`)) return;
    try {
      const r = await fetch(`/api/livreurs/${id}`, { method: 'DELETE', headers: headers(), credentials: 'include' });
      const d = await r.json();
      if (d.success) { showNotification?.('success', d.message); loadData(); }
      else showNotification?.('error', d.message);
    } catch { showNotification?.('error', 'Erreur de connexion.'); }
    setOpenMenu(null);
  };

  const cities  = [...new Set(livreurs.map(l => l.city).filter(Boolean))].sort();
  const filtered = livreurs.filter(l => {
    const q = search.toLowerCase();
    return (!search || [l.fullName, l.email, l.phone, l.city].some(v => v?.toLowerCase().includes(q)))
        && (!filterCity  || l.city === filterCity)
        && (!filterDispo || (filterDispo === '1' ? l.disponible : !l.disponible));
  });

  return (
    <DashboardLayout activeMenu="livreurs_list">
      <main className="grow pt-5 dashboard-content-shift" role="content">
        <div className="kt-container-fixed">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-5 pb-7.5">
            <div>
              <h1 className="text-xl font-medium leading-none text-mono">Gestion des Livreurs</h1>
              <p className="text-sm text-secondary-foreground mt-1">
                {filtered.length} livreur{filtered.length !== 1 ? 's' : ''} — {stats?.disponibles ?? 0} disponible{(stats?.disponibles ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button className="kt-btn kt-btn-outline" onClick={() => navigate('/livreurs/auto-assign')}>
                <i className="ki-filled ki-technology-2 me-1" /> Attribution Auto
              </button>
              <button className="kt-btn kt-btn-primary" onClick={() => navigate('/livreurs/new')}>
                <i className="ki-filled ki-plus me-1" /> Nouveau Livreur
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-7.5">
              {[
                { label: 'Total Livreurs', value: stats.totalLivreurs, icon: 'ki-users', color: 'text-primary' },
                { label: 'Disponibles', value: stats.disponibles, icon: 'ki-badge', color: 'text-success' },
                { label: 'Colis Livrés', value: stats.colisLivres, icon: 'ki-verify', color: 'text-success' },
                { label: 'Taux Livraison', value: `${stats.tauxLivraison}%`, icon: 'ki-chart-line', color: 'text-info' },
              ].map((s, i) => (
                <div key={i} className="kt-card flex-col justify-between gap-4 p-5 bg-stats-gradient">
                  <div className={s.color}><i className={`ki-filled ${s.icon} text-3xl`} /></div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-mono">{s.value}</span>
                    <span className="text-sm text-secondary-foreground">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="kt-card mb-5">
            <div className="kt-card-content p-4 flex flex-wrap gap-3 items-center">
              <label className="kt-input flex-1 min-w-[200px]">
                <i className="ki-filled ki-magnifier" />
                <input type="text" placeholder="Rechercher un livreur..." value={search} onChange={e => setSearch(e.target.value)} />
              </label>
              <select className="kt-select w-44" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                <option value="">Toutes les villes</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="kt-select w-44" value={filterDispo} onChange={e => setFilterDispo(e.target.value)}>
                <option value="">Disponibilité</option>
                <option value="1">Disponible</option>
                <option value="0">Indisponible</option>
              </select>
              {(search || filterCity || filterDispo) && (
                <button className="kt-btn kt-btn-outline kt-btn-sm" onClick={() => { setSearch(''); setFilterCity(''); setFilterDispo(''); }}>
                  <i className="ki-filled ki-arrows-loop me-1" /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="kt-card">
            {loading ? (
              <div className="p-12 flex items-center justify-center gap-3 text-secondary-foreground">
                <i className="ki-filled ki-spinner animate-spin text-xl text-primary" /> Chargement...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-secondary-foreground">
                <i className="ki-filled ki-users text-4xl mb-3 block text-muted-foreground" />
                <p className="font-medium">Aucun livreur trouvé</p>
                <button className="kt-btn kt-btn-primary mt-4" onClick={() => navigate('/livreurs/new')}>
                  <i className="ki-filled ki-plus me-1" /> Ajouter le premier livreur
                </button>
              </div>
            ) : (
              <div className="kt-scrollable-x-auto">
                <table className="kt-table kt-table-border table-fixed">
                  <thead>
                    <tr>
                      <th className="min-w-[220px]">Livreur</th>
                      <th className="min-w-[120px]">Ville</th>
                      <th className="min-w-[110px]">Statut</th>
                      <th className="min-w-[90px]">Colis</th>
                      <th className="min-w-[100px]">Taux</th>
                      <th className="min-w-[110px]">Commission</th>
                      <th className="min-w-[90px]">GPS</th>
                      <th className="min-w-[80px] text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(l => {
                      const taux = l.stats?.tauxLivraison ?? 0;
                      const tauxColor = taux >= 75 ? 'text-success' : taux >= 50 ? 'text-warning' : 'text-destructive';
                      const barColor  = taux >= 75 ? 'bg-success' : taux >= 50 ? 'bg-warning' : 'bg-destructive';
                      return (
                        <tr key={l.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div
                                className="size-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                style={{ background: `hsl(${(l.id * 47) % 360}, 65%, 50%)` }}
                              >
                                {l.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <button className="font-semibold text-sm text-foreground hover:text-primary text-start" onClick={() => navigate(`/livreurs/${l.id}`)}>
                                  {l.fullName}
                                </button>
                                <span className="text-xs text-secondary-foreground">{l.phone}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5 text-sm">
                              <i className="ki-filled ki-geolocation text-muted-foreground text-xs" />
                              {l.city}
                            </div>
                          </td>
                          <td>
                            <span className={`kt-badge ${l.disponible ? 'kt-badge-success' : 'kt-badge-secondary'} kt-badge-outline`}>
                              <span className={`size-1.5 rounded-full me-1.5 ${l.disponible ? 'bg-success' : 'bg-muted-foreground'}`} />
                              {l.disponible ? 'Disponible' : 'Indisponible'}
                            </span>
                          </td>
                          <td>
                            <span className="font-semibold text-sm">{l.stats?.total ?? 0}</span>
                            <div className="text-xs text-secondary-foreground">{l.stats?.enCours ?? 0} en cours</div>
                          </td>
                          <td>
                            <span className={`font-semibold text-sm ${tauxColor}`}>{taux}%</span>
                            <div className="h-1 w-16 bg-muted rounded-full mt-1">
                              <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${taux}%` }} />
                            </div>
                          </td>
                          <td>
                            <span className="font-semibold text-sm text-primary">
                              {(l.stats?.commission ?? 0).toLocaleString('fr-FR')} MAD
                            </span>
                          </td>
                          <td>
                            {l.isLive ? (
                              <span className="kt-badge kt-badge-success kt-badge-outline kt-badge-sm">
                                <span className="size-1.5 rounded-full bg-success me-1 animate-pulse" /> Live
                              </span>
                            ) : (
                              <span className="text-xs text-secondary-foreground">{l.lastSeen}</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="relative action-menu-wrapper">
                              <button className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost" onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === l.id ? null : l.id); }}>
                                <i className="ki-filled ki-dots-vertical text-base" />
                              </button>
                              {openMenu === l.id && (
                                <div className="absolute end-0 top-full mt-1 w-48 rounded-lg shadow-xl bg-background border border-border z-20 py-1">
                                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent" onClick={() => { navigate(`/livreurs/${l.id}`); setOpenMenu(null); }}>
                                    <i className="ki-filled ki-eye text-sm text-muted-foreground" /> Voir la fiche
                                  </button>
                                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent" onClick={() => { navigate(`/livreurs/${l.id}/edit`); setOpenMenu(null); }}>
                                    <i className="ki-filled ki-pencil text-sm text-muted-foreground" /> Modifier
                                  </button>
                                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent" onClick={() => { navigate(`/livreurs/${l.id}/tournee`); setOpenMenu(null); }}>
                                    <i className="ki-filled ki-route text-sm text-muted-foreground" /> Tournée
                                  </button>
                                  <div className="border-t border-border my-1" />
                                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10" onClick={() => handleDelete(l.id, l.fullName)}>
                                    <i className="ki-filled ki-trash text-sm" /> Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
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
      </main>
    </DashboardLayout>
  );
}
