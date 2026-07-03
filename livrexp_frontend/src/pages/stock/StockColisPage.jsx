import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function StockColisPage({ navigate, showNotification }) {
  const [colisList, setColisList]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedEtat, setSelectedEtat] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds]   = useState([]);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [deleteColis, setDeleteColis]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(false);

  const token = localStorage.getItem('auth_token');
  const headers = {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const fetchColis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stock/colis', { headers });
      if (response.ok) {
        const json = await response.json();
        setColisList(Array.isArray(json) ? json : []);
      } else {
        setColisList([]);
      }
    } catch (err) {
      console.error(err);
      setColisList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColis();
  }, []);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (activeDropdownId !== null && !e.target.closest('.kt-menu-toggle')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [activeDropdownId]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedColis.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleBulkPickupRequest = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setPickupLoading(true);

    try {
      const response = await fetch('/api/colis/request-pickup-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (response.ok) {
        if (showNotification) {
          showNotification('success', `${selectedIds.length} colis envoyé(s) en demande de ramassage.`);
        }
        setSelectedIds([]);
        fetchColis();
      } else {
        const data = await response.json();
        if (showNotification) {
          showNotification('error', data.message || 'Une erreur est survenue.');
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification('error', 'Une erreur de réseau est survenue.');
      }
    } finally {
      setPickupLoading(false);
    }
  };

  const handleSinglePickupRequest = async (colisId) => {
    try {
      const response = await fetch('/api/colis/request-pickup-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ids: [colisId] })
      });
      if (response.ok) {
        if (showNotification) {
          showNotification('success', 'Colis envoyé en demande de ramassage.');
        }
        fetchColis();
      } else {
        const data = await response.json();
        if (showNotification) {
          showNotification('error', data.message || 'Une erreur est survenue.');
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification('error', 'Une erreur de réseau est survenue.');
      }
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!deleteColis) return;
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/colis/${deleteColis.id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        if (showNotification) {
          showNotification('success', 'Colis supprimé avec succès.');
        }
        setDeleteColis(null);
        fetchColis();
      } else {
        const data = await response.json();
        if (showNotification) {
          showNotification('error', data.message || 'Une erreur est survenue lors de la suppression.');
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification('error', 'Une erreur est survenue lors de la suppression.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter logic
  const filteredColis = colisList.filter(colis => {
    const matchesSearch = !searchQuery ? true : [
      colis.trackingCode,
      colis.productNature,
      colis.address,
      colis.city
    ].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesEtat = selectedEtat ? colis.etatLabel === selectedEtat : true;
    const matchesStatut = selectedStatut ? colis.statutLabel === selectedStatut : true;

    return matchesSearch && matchesEtat && matchesStatut;
  });

  const totalColis = filteredColis.length;
  const totalMontant = filteredColis.reduce((sum, item) => sum + (item.price || 0), 0);

  const perPageOptions = [
    { value: '5', label: '5' },
    { value: '10', label: '10' },
  ];
  if (totalColis > 10) perPageOptions.push({ value: '20', label: '20' });
  if (totalColis >= 50) perPageOptions.push({ value: '50', label: '50' });

  useEffect(() => {
    const exists = perPageOptions.some(opt => Number(opt.value) === itemsPerPage);
    if (!exists) {
      setItemsPerPage(10);
      setCurrentPage(1);
    }
  }, [totalColis, itemsPerPage]);

  const totalPages = Math.ceil(totalColis / itemsPerPage);
  const paginatedColis = filteredColis.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const etatsPossibles = Array.from(new Set(colisList.map(c => c.etatLabel).filter(Boolean)));
  const statutsPossibles = Array.from(new Set(colisList.map(c => c.statutLabel).filter(Boolean)));

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedEtat('');
    setSelectedStatut('');
    setCurrentPage(1);
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {Array.from({ length: 14 }).map((_, j) => (
        <td key={j} className="py-4">
          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: j === 0 ? '20px' : j === 1 ? '90px' : j === 5 || j === 6 ? '70px' : '100%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="stock_colis">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Header Container */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                Liste colis stock en attente de ramassage
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">
                  Total colis:
                </span>
                <span className="text-base text-foreground font-medium me-2">
                  {totalColis}
                </span>
                <span className="text-base text-secondary-foreground border-s border-input ps-3">
                  Montant total:
                </span>
                <span className="text-base text-foreground font-medium">
                  {totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                className="kt-btn kt-btn-outline kt-btn-primary" 
                onClick={handleBulkPickupRequest}
                disabled={selectedIds.length === 0 || pickupLoading}
              >
                {pickupLoading ? 'Envoi...' : `Demander un ramassage (${selectedIds.length})`}
              </button>
              <button className="kt-btn kt-btn-primary" onClick={() => navigate('/colis/new')}>
                Ajouter un colis
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
                  Affichage de {filteredColis.length} colis
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input 
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Rechercher un colis" 
                        type="text" 
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={selectedEtat}
                      onChange={(val) => { setSelectedEtat(val); setCurrentPage(1); }}
                      placeholder="État"
                      className="w-36"
                      options={[
                        { value: '', label: 'Tous les états' },
                        ...etatsPossibles.map(e => ({ value: e, label: e }))
                      ]}
                    />

                    <KtSelect
                      value={selectedStatut}
                      onChange={(val) => { setSelectedStatut(val); setCurrentPage(1); }}
                      placeholder="Statut"
                      className="w-36"
                      options={[
                        { value: '', label: 'Tous les statuts' },
                        ...statutsPossibles.map(s => ({ value: s, label: s }))
                      ]}
                    />

                    <button
                      className="kt-btn kt-btn-outline"
                      onClick={handleResetFilters}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="kt-card-content">
                <div className="grid">
                  <div className="kt-scrollable-x-auto">
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                        <tr>
                          <th className="w-[50px]">
                            <input 
                              className="kt-checkbox kt-checkbox-sm" 
                              type="checkbox" 
                              onChange={handleSelectAll}
                              checked={paginatedColis.length > 0 && selectedIds.length === paginatedColis.length}
                            />
                          </th>
                          <th className="min-w-[150px]">Code de suivi</th>
                          <th className="min-w-[180px]">Nom du produit</th>
                          <th className="min-w-[150px]">Date de création</th>
                          <th className="min-w-[180px]">Adresse de livraison</th>
                          <th className="min-w-[120px]">État</th>
                          <th className="min-w-[120px]">Statut</th>
                          <th className="min-w-[120px]">Livreur</th>
                          <th className="min-w-[160px]">Date de livraison</th>
                          <th className="min-w-[140px]">Ville</th>
                          <th className="min-w-[120px]">Prix</th>
                          <th className="min-w-[140px]">Réclamation</th>
                          <th className="min-w-[180px]">Commentaires</th>
                          <th className="w-[90px] text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                        ) : paginatedColis.length > 0 ? (
                          paginatedColis.map((colis) => (
                            <tr key={colis.id}>
                              <td>
                                <input 
                                  className="kt-checkbox kt-checkbox-sm" 
                                  type="checkbox" 
                                  checked={selectedIds.includes(colis.id)}
                                  onChange={() => handleSelectRow(colis.id)}
                                />
                              </td>
                              <td className="text-foreground font-medium text-mono">{colis.trackingCode}</td>
                              <td className="text-foreground font-normal">{colis.productNature}</td>
                              <td className="text-foreground font-normal">{colis.createdAt}</td>
                              <td className="text-foreground font-normal">{colis.address}</td>
                              <td>
                                <span className={`kt-badge ${colis.etatBadgeClass} kt-badge-outline rounded-[30px] px-2 py-0.5`}>
                                  <span className="kt-badge-dot size-1.5"></span>
                                  {colis.etatLabel}
                                </span>
                              </td>
                              <td>
                                <span className={`kt-badge ${colis.statutBadgeClass} kt-badge-outline rounded-[30px] px-2 py-0.5`}>
                                  <span className="kt-badge-dot size-1.5"></span>
                                  {colis.statutLabel}
                                </span>
                              </td>
                              <td className="text-foreground font-normal">-</td>
                              <td className="text-foreground font-normal">-</td>
                              <td className="text-foreground font-normal">{colis.city}</td>
                              <td className="text-foreground font-medium">
                                {colis.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                              </td>
                              <td className="text-foreground font-normal">Non</td>
                              <td className="text-secondary-foreground font-normal text-sm">{colis.comment}</td>
                              <td className="text-center relative">
                                <div className="inline-block text-left">
                                  <button 
                                    onClick={() => setActiveDropdownId(activeDropdownId === colis.id ? null : colis.id)}
                                    className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                  >
                                    <i className="ki-filled ki-dots-vertical text-lg"></i>
                                  </button>
                                  {activeDropdownId === colis.id && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)}></div>
                                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background border border-border z-50 py-1">
                                        <button
                                          onClick={() => { setActiveDropdownId(null); navigate(`/colis/${colis.id}/edit`); }}
                                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent text-left"
                                        >
                                          <i className="ki-filled ki-pencil text-base text-muted-foreground"></i>
                                          Modifier
                                        </button>
                                        <button
                                          onClick={() => { setActiveDropdownId(null); setDeleteColis(colis); }}
                                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-destructive hover:bg-accent text-left"
                                        >
                                          <i className="ki-filled ki-trash text-base text-destructive"></i>
                                          Supprimer
                                        </button>
                                        <div className="border-t border-border my-1"></div>
                                        <button
                                          onClick={() => { setActiveDropdownId(null); handleSinglePickupRequest(colis.id); }}
                                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-accent text-left"
                                        >
                                          <i className="ki-filled ki-delivery-2 text-base text-muted-foreground"></i>
                                          Demander un ramassage
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={14} className="py-8 text-center text-secondary-foreground">
                              Aucun colis en attente de ramassage
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
                        value={String(itemsPerPage)}
                        onChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                        className="w-16"
                        options={perPageOptions}
                      />
                      par page
                    </div>
                    
                    <div className="flex items-center gap-4 order-1 md:order-2">
                      <span>
                        Affichage de {Math.min(totalColis, (currentPage - 1) * itemsPerPage + 1)} à {Math.min(totalColis, currentPage * itemsPerPage)} sur {totalColis} colis
                      </span>
                      {totalPages > 1 && (
                        <div className="flex gap-1">
                          <button 
                            className="kt-btn kt-btn-sm kt-btn-outline px-2"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          >
                            Précédent
                          </button>
                          <span className="px-3 py-1 bg-accent/40 rounded text-foreground font-semibold">{currentPage} / {totalPages}</span>
                          <button 
                            className="kt-btn kt-btn-sm kt-btn-outline px-2"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          >
                            Suivant
                          </button>
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
      {deleteColis && createPortal(
        <div 
          className="fixed flex items-center justify-center p-4 overflow-y-auto"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.4)', 
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 99999 
          }}
        >
          <div className="kt-modal-content w-full max-w-lg" id="colis_delete_modal">
            <div className="kt-modal-header">
              <h3 className="kt-modal-title">Supprimer le colis</h3>
              <button 
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost shrink-0" 
                onClick={() => setDeleteColis(null)} 
                type="button"
              >
                <i className="ki-filled ki-cross"></i>
              </button>
            </div>
            <div className="kt-modal-body px-5 py-5">
              <p className="text-sm text-secondary-foreground mb-4">
                Vous êtes sur le point de supprimer le colis <span className="font-medium text-foreground">{deleteColis.trackingCode}</span>.
              </p>
              <form onSubmit={handleDeleteSubmit}>
                <div className="flex items-center justify-end gap-2">
                  <button 
                    className="kt-btn kt-btn-outline" 
                    onClick={() => setDeleteColis(null)} 
                    type="button"
                    disabled={deleteLoading}
                  >
                    Annuler
                  </button>
                  <button 
                    className="kt-btn kt-btn-destructive" 
                    type="submit"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </DashboardLayout>
  );
}
