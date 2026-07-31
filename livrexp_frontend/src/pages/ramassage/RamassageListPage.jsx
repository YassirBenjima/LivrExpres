import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

const STATUS_MAP = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  picked_up: 'Ramassé',
  cancelled: 'Annulé'
};

const STATUS_BADGE = {
  pending: 'kt-badge-warning',
  confirmed: 'kt-badge-info',
  picked_up: 'kt-badge-success',
  cancelled: 'kt-badge-destructive'
};

export default function RamassageListPage({ navigate, showNotification }) {
  const [pickups, setPickups]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const headers = { 'Accept': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fetchPickups = async () => {
    setLoading(true);
    try {
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
  };

  useEffect(() => {
    fetchPickups();
  }, [statusFilter]);

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
    fetchPickups();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/ramassage/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        if (showNotification) showNotification('success', data.message || 'Statut mis à jour.');
        fetchPickups();
      } else {
        if (showNotification) showNotification('error', 'Erreur lors de la mise à jour du statut.');
      }
    } catch (err) {
      console.error(err);
      if (showNotification) showNotification('error', 'Erreur réseau.');
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
              <h1 className="text-xl font-medium leading-none text-mono">Liste des ramassages</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total ramassages:</span>
                <span className="text-base text-foreground font-medium">{pickups.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                className="kt-btn kt-btn-outline" 
                onClick={() => navigate('/ramassage/planning')}
              >
                Planification
              </button>
              <button 
                className="kt-btn kt-btn-primary" 
                onClick={() => navigate('/ramassage/new')}
              >
                Demander un ramassage
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
                  Affichage de {filtered.length} ramassages
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input 
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher un ramassage" 
                        type="text" 
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={statusFilter}
                      onChange={val => { setStatusFilter(val); setCurrentPage(1); }}
                      placeholder="Statut"
                      className="w-36"
                      options={[
                        { value: '', label: 'Tous les statuts' },
                        ...Object.entries(STATUS_MAP).map(([key, label]) => ({
                          value: key,
                          label
                        }))
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
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="kt-card-content">
                <div className="kt-scrollable-x-auto" style={activeDropdownId !== null ? { overflow: 'visible' } : {}}>
                  <table className="kt-table table-auto kt-table-border">
                    <thead>
                      <tr>
                        <th className="min-w-[140px]">Téléphone</th>
                        <th className="min-w-[120px]">Type</th>
                        <th className="min-w-[180px]">Détails</th>
                        <th className="min-w-[140px]">Ville</th>
                        <th className="min-w-[180px]">Adresse</th>
                        <th className="min-w-[150px]">Note</th>
                        <th className="min-w-[150px]">Date</th>
                        <th className="min-w-[130px]">Statut</th>
                        <th className="min-w-[120px]">Suivi</th>
                        <th className="min-w-[140px]">Livreur</th>
                        <th className="w-[80px] text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginated.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-secondary-foreground text-center py-8">
                            Aucun ramassage trouvé.
                          </td>
                        </tr>
                      ) : (
                        paginated.map(pickup => (
                          <tr key={pickup.id}>
                            <td className="text-foreground font-medium">{pickup.phone || '-'}</td>
                            <td>
                              <span className={`kt-badge ${pickup.type === 'stock' ? 'kt-badge-primary' : 'kt-badge-info'} kt-badge-outline rounded-[30px]`}>
                                <span className="kt-badge-dot size-1.5"></span>
                                {pickup.type === 'stock' ? 'Stock' : 'Simple'}
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
                                {pickup.statusLabel || STATUS_MAP[pickup.status] || pickup.status}
                              </span>
                            </td>
                            <td className="text-foreground font-normal">
                              {pickup.hasLabels ? (
                                <span className="text-success text-xs font-medium">Avec étiquettes</span>
                              ) : (
                                <span className="text-warning text-xs font-medium">Sans étiquettes</span>
                              )}
                            </td>
                            <td className="text-foreground font-normal">{pickup.assignedDriver || '-'}</td>
                            <td className="text-center relative" style={activeDropdownId === pickup.id ? { zIndex: 9999 } : {}}>
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={() => setActiveDropdownId(activeDropdownId === pickup.id ? null : pickup.id)}
                                  className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                  type="button"
                                >
                                  <i className="ki-filled ki-dots-vertical text-lg"></i>
                                </button>
                                {activeDropdownId === pickup.id && (
                                  <div className="kt-menu-dropdown kt-menu-default absolute right-0 mt-2 w-[175px]" style={{ zIndex: 9999, display: 'block' }}>
                                    {pickup.status === 'pending' && (
                                      <>
                                        <div className="kt-menu-item">
                                          <button
                                            type="button"
                                            className="kt-menu-link text-start w-full"
                                            onClick={() => { setActiveDropdownId(null); handleUpdateStatus(pickup.id, 'confirmed'); }}
                                          >
                                            <span className="kt-menu-icon">
                                              <i className="ki-filled ki-check-circle text-primary"></i>
                                            </span>
                                            <span className="kt-menu-title">Confirmer</span>
                                          </button>
                                        </div>
                                        <div className="kt-menu-item">
                                          <button
                                            type="button"
                                            className="kt-menu-link text-start w-full text-destructive hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-600 dark:hover:!text-red-400"
                                            onClick={() => { setActiveDropdownId(null); handleUpdateStatus(pickup.id, 'cancelled'); }}
                                          >
                                            <span className="kt-menu-icon text-destructive">
                                              <i className="ki-filled ki-cross-circle text-destructive"></i>
                                            </span>
                                            <span className="kt-menu-title text-destructive">Annuler</span>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                    {pickup.status === 'confirmed' && (
                                      <div className="kt-menu-item">
                                        <button
                                          type="button"
                                          className="kt-menu-link text-start w-full"
                                          onClick={() => { setActiveDropdownId(null); handleUpdateStatus(pickup.id, 'picked_up'); }}
                                        >
                                          <span className="kt-menu-icon">
                                            <i className="ki-filled ki-delivery text-success"></i>
                                          </span>
                                          <span className="kt-menu-title">Marquer ramassé</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium py-4">
                  <div className="flex items-center gap-2 order-2 md:order-1">
                    Afficher
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
                    par page
                  </div>
                  
                  <div className="flex items-center gap-4 order-1 md:order-2">
                    <span>{filtered.length === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filtered.length)} sur ${filtered.length}`}</span>
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
