import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';

export default function LivreurFichePage({ navigate, showNotification, livreurId }) {
  const { t } = useLanguage();
  const [livreur, setLivreur]     = useState(null);
  const [colis, setColis]         = useState([]);
  const [tournees, setTournees]   = useState({});
  const [commission, setComm]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('colis');
  const [toggling, setToggling]   = useState(false);

  const id = livreurId || window.location.pathname.split('/livreurs/')[1]?.split('/')[0];

  const headers = () => {
    const token = localStorage.getItem('auth_token');
    return { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
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
        method: 'PATCH', headers: headers(), credentials: 'include',
        body: JSON.stringify({ disponible: !livreur.disponible }),
      });
      const d = await r.json();
      if (d.success) { setLivreur(p => ({ ...p, disponible: !p.disponible })); showNotification?.('success', d.message || t('drivers.dispoUpdated', 'Disponibilité mise à jour.')); }
    } catch { showNotification?.('error', t('drivers.connError', 'Erreur de connexion.')); }
    finally { setToggling(false); }
  };

  const etatBadge = (e) => ({ 'Livré': 'kt-badge-success', 'Retourné': 'kt-badge-destructive', 'Expédié': 'kt-badge-info', 'En préparation': 'kt-badge-warning', 'Créé': 'kt-badge-primary' }[e] || 'kt-badge-secondary');
  const statutBadge = (s) => ({ 'Terminé': 'kt-badge-success', 'En cours': 'kt-badge-primary', 'Reporté': 'kt-badge-info', 'Échec': 'kt-badge-destructive' }[s] || 'kt-badge-warning');

  if (loading) return (
    <DashboardLayout activeMenu="livreurs_fiche">
      <main className="grow pt-5 dashboard-content-shift">
        <div className="kt-container-fixed">
          {/* Skeleton Header */}
          <div className="flex flex-wrap items-center justify-between gap-5 pb-7.5">
            <div className="flex flex-col gap-2">
              <div style={{ height: '20px', width: '200px', borderRadius: '6px', background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              <div style={{ height: '14px', width: '150px', borderRadius: '6px', background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="kt-card p-5">
                <div style={{ height: '32px', width: '32px', borderRadius: '8px', background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                <div className="mt-4" style={{ height: '20px', width: '60px', borderRadius: '6px', background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );

  if (!livreur) return (
    <DashboardLayout activeMenu="livreurs_fiche">
      <main className="grow pt-5 dashboard-content-shift">
        <div className="kt-container-fixed py-20 text-center text-secondary-foreground">
          <i className="ki-filled ki-user text-5xl block mb-3 text-muted-foreground" />
          <p className="font-medium text-lg">{t('drivers.notFoundTitle', 'Livreur introuvable')}</p>
          <button className="kt-btn kt-btn-primary mt-4" onClick={() => navigate('/livreurs')}>{t('drivers.backToList', 'Retour à la liste')}</button>
        </div>
      </main>
    </DashboardLayout>
  );

  const stats = livreur.stats || {};
  const taux = stats.tauxLivraison ?? 0;
  const tauxColor = taux >= 75 ? 'text-success' : taux >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <DashboardLayout activeMenu="livreurs_fiche">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                {t('drivers.ficheTitle', 'Fiche Livreur')} — {livreur.fullName}
              </h1>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-base text-secondary-foreground">{livreur.city}</span>
                <span className={`kt-badge ${livreur.disponible ? 'kt-badge-success' : 'kt-badge-secondary'} kt-badge-outline rounded-[30px]`}>
                  <span className="kt-badge-dot size-1.5" />{livreur.disponible ? t('drivers.available', 'Disponible') : t('drivers.unavailable', 'Indisponible')}
                </span>
                {livreur.isLive && (
                  <span className="kt-badge kt-badge-success kt-badge-outline rounded-[30px]">
                    <span className="kt-badge-dot size-1.5" />GPS Live
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button type="button" className="kt-btn kt-btn-outline" onClick={() => navigate('/livreurs')}>
                {t('drivers.backToList', 'Retour à la liste')}
              </button>
              <button
                type="button"
                className="kt-btn kt-btn-outline"
                onClick={toggleDispo}
                disabled={toggling}
              >
                {livreur.disponible ? t('drivers.markUnavailable', 'Marquer Indisponible') : t('drivers.markAvailable', 'Marquer Disponible')}
              </button>
            </div>
          </div>
        </div>

        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: t('drivers.totalParcelsCard', 'Colis Total'), value: stats.total ?? 0, icon: 'ki-package', color: 'text-primary', sub: t('drivers.inTheirCity', 'dans sa ville') },
                { label: t('drivers.deliveredParcelsCard', 'Colis Livrés'), value: stats.livres ?? 0, icon: 'ki-verify', color: 'text-success', sub: `${t('drivers.rateSub', 'Taux:')} ${taux}%` },
                { label: t('drivers.inProgressCard', 'En Cours'), value: stats.enCours ?? 0, icon: 'ki-delivery-3', color: 'text-info', sub: t('drivers.currentlySub', 'Actuellement') },
                { label: t('drivers.commissionCard', 'Commission'), value: `${(stats.commission ?? 0).toLocaleString('fr-FR')} MAD`, icon: 'ki-dollar', color: 'text-warning', sub: t('drivers.perDeliveredSub', '15 MAD/livré') },
              ].map((s, i) => (
                <div key={i} className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-[right_top_-1.7rem] bg-stats-gradient">
                  <div className={`mt-4 ms-5 ${s.color}`}>
                    <i className={`ki-filled ${s.icon} text-3xl`} />
                  </div>
                  <div className="flex flex-col gap-1 pb-4 px-5">
                    <span className="text-2xl font-semibold text-mono">{s.value}</span>
                    <span className="text-sm font-normal text-secondary-foreground">{s.label}</span>
                    <span className="text-xs text-muted-foreground">{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Info + Performance */}
            <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5">

              {/* Info Card */}
              <div className="kt-card">
                <div className="kt-card-header">
                  <h3 className="kt-card-title">{t('drivers.infoSection', 'Informations')}</h3>
                </div>
                <div className="kt-card-table pb-3">
                  <table className="kt-table align-middle text-sm text-muted-foreground">
                    <tbody>
                      {[
                        { label: t('drivers.emailLabel', 'Email'), value: livreur.email, icon: 'ki-sms' },
                        { label: t('drivers.phoneLabel', 'Téléphone'), value: livreur.phone, icon: 'ki-phone' },
                        { label: t('drivers.cityLabel', 'Ville'), value: livreur.city, icon: 'ki-geolocation' },
                        { label: t('drivers.addressLabel', 'Adresse'), value: livreur.address || '-', icon: 'ki-home' },
                        { label: t('drivers.lastActivityLabel', 'Dernière activité'), value: livreur.lastSeen === "À l'instant" ? t('drivers.justNow', "À l'instant") : livreur.lastSeen, icon: 'ki-time' },
                      ].map(({ label, value, icon }) => (
                        <tr key={label}>
                          <td className="py-2 text-secondary-foreground font-normal min-w-32">
                            <div className="flex items-center gap-1.5">
                              <i className={`ki-filled ${icon} text-sm text-muted-foreground`} />
                              {label}
                            </div>
                          </td>
                          <td className="py-2 text-foreground font-normal text-sm">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Performance Card */}
              <div className="lg:col-span-2 kt-card">
                <div className="kt-card-header">
                  <h3 className="kt-card-title">{t('drivers.perfSection', 'Performance')}</h3>
                  <span className="text-sm text-secondary-foreground">{t('drivers.globalStats', 'Statistiques globales')}</span>
                </div>
                <div className="kt-card-content p-5 lg:p-7.5 lg:pt-4">
                  <div className="flex flex-col gap-0.5 mb-4">
                    <span className="text-sm font-normal text-secondary-foreground">{t('drivers.deliveryRateLabel', 'Taux de livraison')}</span>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-2xl font-bold text-mono ${tauxColor}`}>{taux}%</span>
                      <span className={`kt-badge kt-badge-outline kt-badge-sm ${taux >= 75 ? 'kt-badge-success' : taux >= 50 ? 'kt-badge-warning' : 'kt-badge-destructive'}`}>
                        {taux >= 75 ? t('drivers.rateExcellent', 'Excellent') : taux >= 50 ? t('drivers.rateAverage', 'Moyen') : t('drivers.rateInsufficient', 'Insuffisant')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-1 mb-1.5">
                    <div className="bg-green-500 h-2 rounded-xs" style={{ width: `${stats.livres ?? 0}%` }} />
                    <div className="bg-destructive h-2 rounded-xs" style={{ width: `${stats.retours ?? 0}%` }} />
                    <div className="bg-violet-500 h-2 rounded-xs" style={{ width: `${stats.enCours ?? 0}%` }} />
                  </div>

                  <div className="flex items-center flex-wrap gap-4 mb-4">
                    {[
                      { label: t('drivers.legendDelivered', 'Livré ({count})').replace('{count}', stats.livres ?? 0), color: 'bg-green-500' },
                      { label: t('drivers.legendReturned', 'Retourné ({count})').replace('{count}', stats.retours ?? 0), color: 'bg-destructive' },
                      { label: t('drivers.legendInProgress', 'En cours ({count})').replace('{count}', stats.enCours ?? 0), color: 'bg-violet-500' },
                    ].map(({ label, color }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className={`rounded-full size-2 ${color}`} />
                        <span className="text-sm font-normal text-foreground">{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-b border-input mb-4" />

                  <div className="grid gap-3">
                    {[
                      { icon: 'ki-package', label: t('drivers.totalCityParcels', 'Total colis (ville)'), value: `${stats.total ?? 0}`, pct: '100%' },
                      { icon: 'ki-verify', label: t('drivers.deliveredParcels', 'Colis livrés'), value: `${stats.livres ?? 0}`, pct: `${taux}%`, color: 'text-success' },
                      { icon: 'ki-delivery-time', label: t('drivers.returnedParcels', 'Colis retournés'), value: `${stats.retours ?? 0}`, pct: `${stats.tauxRetour ?? 0}%`, color: 'text-destructive' },
                    ].map(({ icon, label, value, pct, color }) => (
                      <div key={label} className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <i className={`ki-filled ${icon} text-base text-muted-foreground`} />
                          <span className="text-sm font-normal text-mono">{label}</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-foreground gap-6">
                          <span>{value}</span>
                          <span className={color || ''}>{pct}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="kt-card kt-card-grid min-w-full">
              {/* Tab Header */}
              <div className="kt-card-header border-b-0 pb-0">
                <div className="flex gap-0">
                  {[
                    { key: 'colis', label: t('drivers.assignedTab', 'Colis assignés') },
                    { key: 'tournee', label: t('drivers.todayRouteTab', 'Tournée du jour') },
                    { key: 'commission', label: t('drivers.commissionTab', 'Commission') },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-secondary-foreground hover:text-foreground'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab: Colis */}
              {activeTab === 'colis' && (
                <div className="kt-card-content">
                  <div className="grid">
                    <div className="kt-scrollable-x-auto">
                      <table className="kt-table table-auto kt-table-border">
                        <thead>
                          <tr>
                            <th className="min-w-[150px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('drivers.colTrackingCode', 'Code de suivi')}</span></span></th>
                            <th className="min-w-[140px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('drivers.colRecipient', 'Destinataire')}</span></span></th>
                            <th className="min-w-[140px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('drivers.colAddress', 'Adresse')}</span></span></th>
                            <th className="min-w-[100px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('drivers.colPrice', 'Prix')}</span></span></th>
                            <th className="min-w-[110px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('drivers.colState', 'État')}</span></span></th>
                            <th className="min-w-[110px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('drivers.colStatus', 'Statut')}</span></span></th>
                            <th className="min-w-[130px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('drivers.colDate', 'Date')}</span></span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {colis.length === 0 ? (
                            <tr><td colSpan={7} className="py-8 text-center text-secondary-foreground">{t('drivers.noAssignedParcels', 'Aucun colis assigné pour cette ville')}</td></tr>
                          ) : colis.map(c => (
                            <tr key={c.id}>
                              <td className="font-medium text-foreground">{c.trackingCode}</td>
                              <td className="text-foreground font-normal">
                                {c.recipient}
                                <div className="text-xs text-secondary-foreground">{c.phone}</div>
                              </td>
                              <td className="text-foreground font-normal">{c.address}</td>
                              <td className="text-foreground font-medium">{c.price} MAD</td>
                              <td>
                                <span className={`kt-badge ${etatBadge(c.etat)} kt-badge-outline rounded-[30px]`}>
                                  <span className="kt-badge-dot size-1.5" />{c.etat}
                                </span>
                              </td>
                              <td>
                                <span className={`kt-badge ${statutBadge(c.statut)} kt-badge-outline rounded-[30px]`}>
                                  <span className="kt-badge-dot size-1.5" />{c.statut}
                                </span>
                              </td>
                              <td className="text-foreground font-normal text-sm">{c.createdAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Tournée */}
              {activeTab === 'tournee' && (
                <div className="kt-card-content p-5 lg:p-7.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Object.entries(tournees).map(([statut, items]) => (
                      <div key={statut} className="kt-card border border-border/50 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-foreground">{statut}</h4>
                          <span className={`kt-badge kt-badge-outline rounded-[30px] ${statutBadge(statut)}`}>
                            <span className="kt-badge-dot size-1.5" />{items.length} {t('changeRecipient.parcelsCount', 'colis')}
                          </span>
                        </div>
                        {items.length === 0 ? (
                          <p className="text-sm text-secondary-foreground text-center py-4">{t('drivers.noParcelsInTournee', 'Aucun colis')}</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {items.slice(0, 5).map(c => (
                              <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/50 border border-border/40">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{c.recipient}</p>
                                  <p className="text-xs text-secondary-foreground">{c.address}</p>
                                </div>
                                <span className="text-sm font-semibold text-primary">{c.price} MAD</span>
                              </div>
                            ))}
                            {items.length > 5 && <p className="text-xs text-center text-secondary-foreground">{t('drivers.moreParcels', '+{count} autres colis').replace('{count}', items.length - 5)}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Commission */}
              {activeTab === 'commission' && commission && (
                <div className="kt-card-content p-5 lg:p-7.5">
                  <div className="max-w-md">
                    <div className="grid gap-3">
                      {[
                        { icon: 'ki-verify', label: t('drivers.deliveredSuccessLabel', 'Colis livrés avec succès'), value: commission.livres },
                        { icon: 'ki-dollar', label: t('drivers.ratePerParcelLabel', 'Taux par colis livré'), value: `${commission.tauxParColis} ${commission.devise}` },
                        { icon: 'ki-geolocation', label: t('drivers.coveredCityLabel', 'Ville couverte'), value: livreur.city },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="flex items-center justify-between flex-wrap gap-2 border-b border-border pb-3">
                          <div className="flex items-center gap-1.5">
                            <i className={`ki-filled ${icon} text-base text-muted-foreground`} />
                            <span className="text-sm font-normal text-mono">{label}</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between bg-accent/50 rounded-xl p-5 mt-4">
                      <span className="font-semibold text-foreground">{t('drivers.totalCommissionLabel', 'Commission totale')}</span>
                      <span className="text-2xl font-bold text-success">{commission.totalCommission.toLocaleString('fr-FR')} {commission.devise}</span>
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
