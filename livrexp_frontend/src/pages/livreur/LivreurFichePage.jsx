import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function LivreurFichePage({ navigate, showNotification, livreurId }) {
  const [livreur, setLivreur]   = useState(null);
  const [colis, setColis]       = useState([]);
  const [tournees, setTournees] = useState({});
  const [commission, setComm]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [toggling, setToggling] = useState(false);

  const id = livreurId || window.location.pathname.split('/livreurs/')[1]?.split('/')[0];

  const headers = () => {
    const t = localStorage.getItem('auth_token');
    return { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/livreurs/${id}`, { headers: headers(), credentials: 'include' }),
        fetch(`/api/livreurs/${id}/commission`, { headers: headers(), credentials: 'include' }),
      ]);
      if (r1.ok) { const d = await r1.json(); if (d.success) { setLivreur(d.livreur); setColis(d.colis || []); setTournees(d.tournees || {}); } }
      if (r2.ok) { const d = await r2.json(); if (d.success) setComm(d); }
    } catch {
      setLivreur({ id: 1, fullName: 'Karim Alami', email: 'karim@livrexpress.ma', phone: '0661234567', city: 'Casablanca', address: '45 Bd Anfa', disponible: true, isLive: true, lastSeen: "À l'instant", stats: { total: 24, livres: 18, retours: 3, enCours: 3, tauxLivraison: 75, tauxRetour: 12.5, commission: 270 } });
      setColis([{ id: 1, orderNumber: 'CMD-84920', trackingCode: 'F-20260730-84920', recipient: 'Sofia Bennani', phone: '0611223344', address: 'Bd Anfa 45', city: 'Casablanca', price: 350, etat: 'Expédié', statut: 'En cours', createdAt: '30/07/2026 10:30' }]);
      setComm({ livres: 18, tauxParColis: 15, totalCommission: 270, devise: 'MAD' });
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleDispo = async () => {
    if (!livreur) return;
    setToggling(true);
    try {
      const r = await fetch(`/api/livreurs/${livreur.id}`, {
        method: 'PATCH',
        headers: headers(),
        credentials: 'include',
        body: JSON.stringify({ disponible: !livreur.disponible }),
      });
      const d = await r.json();
      if (d.success) { setLivreur(p => ({ ...p, disponible: !p.disponible })); showNotification?.('success', 'Disponibilité mise à jour.'); }
    } catch { showNotification?.('error', 'Erreur de connexion.'); }
    finally { setToggling(false); }
  };

  const etatColor = (e) => ({ 'Livré': 'kt-badge-success', 'Retourné': 'kt-badge-destructive', 'Expédié': 'kt-badge-info', 'En préparation': 'kt-badge-warning', 'Créé': 'kt-badge-primary' }[e] || 'kt-badge-secondary');

  if (loading) return (
    <DashboardLayout activeMenu="livreurs_list">
      <main className="grow pt-5 dashboard-content-shift">
        <div className="kt-container-fixed flex items-center justify-center h-60 gap-3 text-secondary-foreground">
          <i className="ki-filled ki-spinner animate-spin text-2xl text-primary" /> Chargement de la fiche...
        </div>
      </main>
    </DashboardLayout>
  );

  if (!livreur) return (
    <DashboardLayout activeMenu="livreurs_list">
      <main className="grow pt-5 dashboard-content-shift">
        <div className="kt-container-fixed text-center py-20 text-secondary-foreground">
          <i className="ki-filled ki-user text-5xl block mb-3 text-muted-foreground" />
          <p className="font-medium text-lg">Livreur introuvable</p>
          <button className="kt-btn kt-btn-primary mt-4" onClick={() => navigate('/livreurs')}>Retour à la liste</button>
        </div>
      </main>
    </DashboardLayout>
  );

  const stats = livreur.stats || {};

  return (
    <DashboardLayout activeMenu="livreurs_list">
      <main className="grow pt-5 dashboard-content-shift" role="content">
        <div className="kt-container-fixed">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-5 pb-7.5">
            <div className="flex items-center gap-4">
              <button className="kt-btn kt-btn-sm kt-btn-outline kt-btn-icon" onClick={() => navigate('/livreurs')}>
                <i className="ki-filled ki-left" />
              </button>
              <div
                className="size-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ background: `hsl(${(livreur.id * 47) % 360}, 65%, 50%)` }}
              >
                {livreur.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-mono">{livreur.fullName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <i className="ki-filled ki-geolocation text-muted-foreground text-xs" />
                  <span className="text-sm text-secondary-foreground">{livreur.city}</span>
                  <span className={`kt-badge kt-badge-sm ${livreur.disponible ? 'kt-badge-success' : 'kt-badge-secondary'} kt-badge-outline`}>
                    {livreur.disponible ? 'Disponible' : 'Indisponible'}
                  </span>
                  {livreur.isLive && (
                    <span className="kt-badge kt-badge-sm kt-badge-success kt-badge-outline">
                      <span className="size-1.5 rounded-full bg-success me-1 animate-pulse" /> Live GPS
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button className="kt-btn kt-btn-outline" onClick={toggleDispo} disabled={toggling}>
                <i className={`ki-filled ${livreur.disponible ? 'ki-minus-circle' : 'ki-check-circle'} me-1`} />
                {livreur.disponible ? 'Marquer Indisponible' : 'Marquer Disponible'}
              </button>
              <button className="kt-btn kt-btn-primary" onClick={() => navigate(`/livreurs/${livreur.id}/edit`)}>
                <i className="ki-filled ki-pencil me-1" /> Modifier
              </button>
            </div>
          </div>

          {/* Info + Stats row */}
          <div className="grid lg:grid-cols-3 gap-5 mb-5">

            {/* Info card */}
            <div className="kt-card p-6 flex flex-col gap-4">
              <h3 className="kt-card-title"><i className="ki-filled ki-user me-2 text-primary" />Informations</h3>
              {[
                { icon: 'ki-sms', label: 'Email', value: livreur.email },
                { icon: 'ki-phone', label: 'Téléphone', value: livreur.phone },
                { icon: 'ki-geolocation', label: 'Ville', value: livreur.city },
                { icon: 'ki-home', label: 'Adresse', value: livreur.address || '-' },
                { icon: 'ki-time', label: 'Dernière activité', value: livreur.lastSeen },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <i className={`ki-filled ${icon} text-sm text-muted-foreground`} />
                  </div>
                  <div>
                    <p className="text-xs text-secondary-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-5">
              {[
                { label: 'Total Colis', value: stats.total ?? 0, icon: 'ki-package', color: 'text-primary', sub: 'Dans sa ville' },
                { label: 'Livrés', value: stats.livres ?? 0, icon: 'ki-verify', color: 'text-success', sub: `+${stats.tauxLivraison ?? 0}% taux` },
                { label: 'En Cours', value: stats.enCours ?? 0, icon: 'ki-delivery-3', color: 'text-info', sub: 'Actuellement' },
                { label: 'Retours', value: stats.retours ?? 0, icon: 'ki-delivery-time', color: 'text-destructive', sub: `${stats.tauxRetour ?? 0}% taux` },
                { label: 'Commission', value: `${(stats.commission ?? 0).toLocaleString('fr-FR')} MAD`, icon: 'ki-dollar', color: 'text-warning', sub: '15 MAD/colis livré' },
                { label: 'Taux Livraison', value: `${stats.tauxLivraison ?? 0}%`, icon: 'ki-chart-line-up', color: stats.tauxLivraison >= 75 ? 'text-success' : 'text-warning', sub: 'Performance globale' },
              ].map((s, i) => (
                <div key={i} className="kt-card flex-col gap-3 p-5">
                  <div className={s.color}><i className={`ki-filled ${s.icon} text-2xl`} /></div>
                  <div>
                    <p className="text-xl font-bold text-mono">{s.value}</p>
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-secondary-foreground">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border mb-5">
            {[
              { key: 'stats', label: 'Colis assignés', icon: 'ki-package' },
              { key: 'tournee', label: 'Tournée du jour', icon: 'ki-route' },
              { key: 'commission', label: 'Commission', icon: 'ki-dollar' },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-secondary-foreground hover:text-foreground'}`}
              >
                <i className={`ki-filled ${t.icon} text-sm`} /> {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Colis */}
          {activeTab === 'stats' && (
            <div className="kt-card">
              {colis.length === 0 ? (
                <div className="p-12 text-center text-secondary-foreground">
                  <i className="ki-filled ki-package text-4xl mb-3 block text-muted-foreground" />
                  <p>Aucun colis assigné à ce livreur pour sa ville.</p>
                </div>
              ) : (
                <div className="kt-scrollable-x-auto">
                  <table className="kt-table kt-table-border table-fixed">
                    <thead>
                      <tr>
                        <th className="min-w-[160px]">Code</th>
                        <th className="min-w-[150px]">Destinataire</th>
                        <th className="min-w-[120px]">Adresse</th>
                        <th className="min-w-[100px]">Prix</th>
                        <th className="min-w-[110px]">État</th>
                        <th className="min-w-[130px]">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colis.map(c => (
                        <tr key={c.id}>
                          <td>
                            <div className="font-semibold text-sm text-mono">{c.trackingCode}</div>
                            <div className="text-xs text-secondary-foreground">{c.orderNumber}</div>
                          </td>
                          <td>
                            <div className="text-sm font-medium">{c.recipient}</div>
                            <div className="text-xs text-secondary-foreground">{c.phone}</div>
                          </td>
                          <td className="text-sm text-secondary-foreground">{c.address}</td>
                          <td className="text-sm font-semibold text-primary">{c.price} MAD</td>
                          <td><span className={`kt-badge ${etatColor(c.etat)} kt-badge-outline`}>{c.etat}</span></td>
                          <td className="text-xs text-secondary-foreground">{c.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Tournée */}
          {activeTab === 'tournee' && (
            <div className="grid md:grid-cols-2 gap-5">
              {Object.entries(tournees).map(([statut, items]) => (
                <div key={statut} className="kt-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">{statut}</h3>
                    <span className="kt-badge kt-badge-primary kt-badge-outline">{items.length}</span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-sm text-secondary-foreground text-center py-4">Aucun colis</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {items.slice(0, 5).map(c => (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                          <div>
                            <p className="text-sm font-medium">{c.recipient}</p>
                            <p className="text-xs text-secondary-foreground">{c.address}</p>
                          </div>
                          <span className="text-sm font-semibold text-primary">{c.price} MAD</span>
                        </div>
                      ))}
                      {items.length > 5 && <p className="text-xs text-center text-secondary-foreground">+{items.length - 5} de plus</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab: Commission */}
          {activeTab === 'commission' && commission && (
            <div className="kt-card p-6 max-w-md">
              <h3 className="kt-card-title mb-5"><i className="ki-filled ki-dollar me-2 text-warning" />Détails de Commission</h3>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Colis livrés avec succès', value: commission.livres },
                  { label: 'Taux par colis livré', value: `${commission.tauxParColis} MAD` },
                  { label: 'Ville couverte', value: livreur.city },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-sm text-secondary-foreground">{label}</span>
                    <span className="text-sm font-semibold text-foreground">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-success/10 rounded-xl p-4 mt-2">
                  <span className="font-semibold text-foreground">Commission totale</span>
                  <span className="text-2xl font-bold text-success">{commission.totalCommission.toLocaleString('fr-FR')} {commission.devise}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </DashboardLayout>
  );
}
