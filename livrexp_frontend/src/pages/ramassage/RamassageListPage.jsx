import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { getUserRoles } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';

const STATUS_BADGE = {
  pending: 'kt-badge-warning',
  confirmed: 'kt-badge-info',
  picked_up: 'kt-badge-success',
  cancelled: 'kt-badge-destructive'
};

export default function RamassageListPage({ navigate, showNotification }) {
  const { t } = useLanguage();
  const userRoles = getUserRoles();
  const isSuperAdmin = userRoles.includes('ROLE_SUPER_ADMIN') || userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SUPERVISEUR');

  const getStatusLabel = (statusKey) => {
    const map = {
      pending: t('status.pending', 'En attente'),
      confirmed: t('status.confirmed', 'Confirmé'),
      picked_up: t('status.pickedUp', 'Ramassé'),
      cancelled: t('status.cancelled', 'Annulé')
    };
    return map[statusKey] || statusKey;
  };

  const [pickups, setPickups]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos]   = useState(null);

  const toggleDropdown = (e, pickupId) => {
    e.stopPropagation();
    if (activeDropdownId === pickupId) {
      setActiveDropdownId(null);
      setDropdownPos(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 175
      });
      setActiveDropdownId(pickupId);
    }
  };

  const fetchPickups = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const headers = { 'Accept': 'application/json' };
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ramassage', { headers });
      if (res.ok) {
        const json = await res.json();
        setPickups(json.pickups || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchPickups();
      }
    };
    load();

    const handleAiUpdate = () => {
      if (isMounted) fetchPickups();
    };
    window.addEventListener('ai:ramassage-updated', handleAiUpdate);
    window.addEventListener('ai:colis-updated', handleAiUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('ai:ramassage-updated', handleAiUpdate);
      window.removeEventListener('ai:colis-updated', handleAiUpdate);
    };
  }, [fetchPickups, statusFilter]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeDropdownId !== null && !e.target.closest('.kt-menu-toggle')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdownId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPickups(true);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/ramassage/${id}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        if (showNotification) showNotification('success', `${t('colisPage.statusUpdated', 'Statut mis à jour')} : ${getStatusLabel(newStatus)}`);
        fetchPickups();
      } else {
        if (showNotification) showNotification('error', t('colisPage.statusUpdateError', 'Erreur lors de la mise à jour du statut.'));
      }
    } catch (err) {
      console.error(err);
      if (showNotification) showNotification('error', t('stockPage.notifNetworkError', 'Erreur réseau.'));
    }
  };

  // Local search filter as fallback for immediate typing UX
  const filtered = pickups.filter(p => {
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    if (!matchesStatus) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (p.phone && String(p.phone).toLowerCase().includes(q)) ||
      (p.city && String(p.city).toLowerCase().includes(q)) ||
      (p.address && String(p.address).toLowerCase().includes(q)) ||
      (p.productNameSnapshot && String(p.productNameSnapshot).toLowerCase().includes(q)) ||
      (p.note && String(p.note).toLowerCase().includes(q)) ||
      (p.type && String(p.type).toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SkeletonRow = () => (
    <tr>
      {[...Array(11)].map((_, i) => (
        <td key={i}>
          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: i === 0 ? '110px' : i === 1 ? '50px' : i === 7 ? '70px' : i === 10 ? '30px' : '85%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="ramassage_list">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                {t('colisPage.pickupListPageTitle', 'Liste des ramassages')}
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">
                  {t('colisPage.totalPickups', 'Total ramassages')}:
                </span>
                <span className="text-base text-foreground font-medium">{pickups.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                className="kt-btn kt-btn-outline" 
                onClick={() => navigate('/ramassage/planning')}
              >
                {t('colisPage.planningBtn', 'Planification')}
              </button>
              <button 
                className="kt-btn kt-btn-primary" 
                onClick={() => navigate('/ramassage/new')}
              >
                {t('colisPage.newPickupBtn', 'Demander un ramassage')}
              </button>
            </div>
          </div>
        </div>

        {/* Content Table Card */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Card Header & Filter Form */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">
                  {t('colisPage.showingPickups', 'Affichage de')} {filtered.length} {t('colisPage.pickupsCount', 'ramassage(s)')}
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <form onSubmit={handleSearchSubmit} className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input 
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder={t('colisPage.pickupSearchPlaceholder', 'Rechercher un ramassage')} 
                        type="text" 
                      />
                    </label>
                  </form>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={statusFilter}
                      onChange={val => { setStatusFilter(val); setCurrentPage(1); }}
                      placeholder={t('colisPage.statut', 'Statut')}
                      className="w-36"
                      options={[
                        { value: '', label: t('colisPage.allStatuts', 'Tous les statuts') },
                        { value: 'pending', label: t('status.pending', 'En attente') },
                        { value: 'confirmed', label: t('status.confirmed', 'Confirmé') },
                        { value: 'picked_up', label: t('status.pickedUp', 'Ramassé') },
                        { value: 'cancelled', label: t('status.cancelled', 'Annulé') }
                      ]}
                    />

                    <button
                      className="kt-btn kt-btn-outline"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('');
                        setCurrentPage(1);
                      }}
                    >
                      {t('stockPage.reset', 'Réinitialiser')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="kt-card-content">
                <div className="kt-scrollable-x-auto">
                  <table className="kt-table table-auto kt-table-border">
                    <thead>
                      <tr>
                        <th className="min-w-[140px]">{t('colisPage.phone', 'Téléphone')}</th>
                        <th className="min-w-[120px]">{t('colisPage.type', 'Type')}</th>
                        <th className="min-w-[180px]">{t('common.details', 'Détails')}</th>
                        <th className="min-w-[140px]">{t('colisPage.city', 'Ville')}</th>
                        <th className="min-w-[180px]">{t('colisPage.address', 'Adresse')}</th>
                        <th className="min-w-[150px]">{t('stockPage.pickupNoteLabel', 'Note')}</th>
                        <th className="min-w-[150px]">{t('common.date', 'Date')}</th>
                        <th className="min-w-[130px]">{t('colisPage.statut', 'Statut')}</th>
                        <th className="min-w-[120px]">{t('colisPage.trackingCode', 'Suivi')}</th>
                        <th className="min-w-[140px]">{t('colisPage.driver', 'Livreur')}</th>
                        {isSuperAdmin && <th className="w-[80px] text-center">{t('common.actions', 'Actions')}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginated.length === 0 ? (
                        <tr>
                          <td colSpan={isSuperAdmin ? 11 : 10} className="text-secondary-foreground text-center py-8">
                            {t('colisPage.noPickupFound', 'Aucun ramassage trouvé.')}
                          </td>
                        </tr>
                      ) : (
                        paginated.map(pickup => (
                          <tr key={pickup.id}>
                            <td className="text-foreground font-medium">{pickup.phone || '-'}</td>
                            <td>
                              <span className={`kt-badge ${pickup.type === 'stock' ? 'kt-badge-primary' : 'kt-badge-info'} kt-badge-outline rounded-[30px]`}>
                                <span className="kt-badge-dot size-1.5"></span>
                                {pickup.type === 'stock' ? t('colisForm.stockParcel', 'Stock') : t('colisForm.standardParcel', 'Simple')}
                              </span>
                            </td>
                            <td className="text-foreground font-normal">{pickup.productNameSnapshot || '-'}</td>
                            <td className="text-foreground font-normal">{pickup.city || '-'}</td>
                            <td className="text-foreground font-normal">
                              {pickup.address}{pickup.neighborhood ? `, ${pickup.neighborhood}` : ''}
                            </td>
                            <td className="text-foreground font-normal">{pickup.note || '-'}</td>
                            <td className="text-foreground font-normal">{pickup.createdAt || '-'}</td>
                            <td>
                              <span className={`kt-badge ${STATUS_BADGE[pickup.status] || 'kt-badge-warning'} kt-badge-outline rounded-[30px]`}>
                                <span className="kt-badge-dot size-1.5"></span>
                                {getStatusLabel(pickup.status)}
                              </span>
                            </td>
                            <td className="text-foreground font-normal">
                              {pickup.hasLabels ? (
                                <span className="text-success text-xs font-medium">{t('colisPage.withLabels', 'Avec étiquettes')}</span>
                              ) : (
                                <span className="text-warning text-xs font-medium">{t('colisPage.withoutLabels', 'Sans étiquettes')}</span>
                              )}
                            </td>
                            <td className="text-foreground font-normal">{pickup.assignedDriver || '-'}</td>
                            {isSuperAdmin && (
                              <td className="text-center relative">
                                <div className="relative inline-block text-left">
                                  <button
                                    onClick={(e) => toggleDropdown(e, pickup.id)}
                                    className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost cursor-pointer"
                                    type="button"
                                  >
                                    <i className="ki-filled ki-dots-vertical text-lg"></i>
                                  </button>
                                  {activeDropdownId === pickup.id && dropdownPos && createPortal(
                                    <div 
                                      className="kt-menu-dropdown kt-menu-default fixed w-[175px]" 
                                      style={{ 
                                        position: 'fixed',
                                        top: `${dropdownPos.top - window.scrollY}px`, 
                                        left: `${dropdownPos.left - window.scrollX}px`, 
                                        zIndex: 99999, 
                                        display: 'block' 
                                      }}
                                    >
                                      {pickup.status === 'pending' && (
                                        <>
                                          <div className="kt-menu-item">
                                            <button
                                              type="button"
                                              className="kt-menu-link text-start w-full cursor-pointer"
                                              onClick={() => { setActiveDropdownId(null); handleUpdateStatus(pickup.id, 'confirmed'); }}
                                            >
                                              <span className="kt-menu-icon">
                                                <i className="ki-filled ki-check-circle text-primary"></i>
                                              </span>
                                              <span className="kt-menu-title">{t('colisPage.confirm', 'Confirmer')}</span>
                                            </button>
                                          </div>
                                          <div className="kt-menu-item">
                                            <button
                                              type="button"
                                              className="kt-menu-link text-start w-full text-destructive cursor-pointer hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-600 dark:hover:!text-red-400"
                                              onClick={() => { setActiveDropdownId(null); handleUpdateStatus(pickup.id, 'cancelled'); }}
                                            >
                                              <span className="kt-menu-icon text-destructive">
                                                <i className="ki-filled ki-cross-circle text-destructive"></i>
                                              </span>
                                              <span className="kt-menu-title text-destructive">{t('common.cancel', 'Annuler')}</span>
                                            </button>
                                          </div>
                                        </>
                                      )}
                                      {pickup.status === 'confirmed' && (
                                        <div className="kt-menu-item">
                                          <button
                                            type="button"
                                            className="kt-menu-link text-start w-full cursor-pointer"
                                            onClick={() => { setActiveDropdownId(null); handleUpdateStatus(pickup.id, 'picked_up'); }}
                                          >
                                            <span className="kt-menu-icon">
                                              <i className="ki-filled ki-delivery text-success"></i>
                                            </span>
                                            <span className="kt-menu-title">{t('colisPage.markPickedUp', 'Marquer ramassé')}</span>
                                          </button>
                                        </div>
                                      )}
                                      {pickup.status !== 'pending' && pickup.status !== 'confirmed' && (
                                        <div className="p-3 text-xs text-secondary-foreground text-center">{t('colisPage.noActionAvailable', 'Aucune action disponible')}</div>
                                      )}
                                    </div>,
                                    document.body
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium py-4">
                  <div className="flex items-center gap-2 order-2 md:order-1">
                    {t('stockPage.show', 'Afficher')}
                    <KtSelect
                      value={String(itemsPerPage)}
                      onChange={v => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
                      className="w-16"
                      options={[
                        { value: '10', label: '10' },
                        ...(filtered.length > 10 ? [{ value: '25', label: '25' }] : []),
                        ...(filtered.length > 25 ? [{ value: '50', label: '50' }] : []),
                      ]}
                    />
                    {t('stockPage.perPage', 'par page')}
                  </div>
                  
                  <div className="flex items-center gap-4 order-1 md:order-2">
                    <span>{filtered.length === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filtered.length)} ${t('colisPage.of', 'sur')} ${filtered.length}`}</span>
                    <div className="flex gap-1">
                      <button className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><i className="ki-filled ki-left text-xs"></i></button>
                      <button className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><i className="ki-filled ki-right text-xs"></i></button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
