import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function StockColisPage({ navigate, showNotification }) {
  const { t } = useLanguage();
  const [colisList, setColisList]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedEtat, setSelectedEtat] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds]   = useState([]);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState(null);
  const [deleteColis, setDeleteColis]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(false);

  const formatStatusLabel = (label) => {
    if (!label) return label;
    const keyMap = {
      // French values (etatLabel / statutLabel from API)
      'Créé':       'status.cree',
      'Expédié':    'status.expedie',
      'Reçu':       'status.pickedUp',
      'En attente': 'status.enAttente',
      'Annulé':     'status.annule',
      'Livré':      'status.livre',
      'Retourné':   'status.retourne',
      'En cours':   'status.enCours',
      'En préparation': 'status.enPreparation',
      'Reporté':    'status.reporte',
      'Terminé':    'status.termine',
      'Litige':     'status.litige',
      'Refusé':     'status.refuse',
      // English values that may come from API
      'Pending':    'status.enAttente',
      'Created':    'status.cree',
      'Shipped':    'status.expedie',
      'Delivered':  'status.livre',
      'Returned':   'status.retourne',
      'Cancelled':  'status.annule',
      'Picked Up':  'status.pickedUp',
      'In Progress':'status.enCours',
      'In preparation': 'status.enPreparation',
      'Postponed':  'status.reporte',
      'Completed':  'status.termine',
      'Dispute':    'status.litige',
      'Refused':    'status.refuse',
      'Active':     'status.active',
      'Inactive':   'status.inactive',
    };
    const key = keyMap[label];
    return key ? t(key, label) : label;
  };

  const token = localStorage.getItem('auth_token');
  const headers = {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const fetchColis = async (silent = false) => {
    if (!silent && colisList.length === 0) {
      setLoading(true);
    }
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

    const handleAiUpdate = () => fetchColis();
    window.addEventListener('ai:ramassage-updated', handleAiUpdate);
    window.addEventListener('ai:colis-updated', handleAiUpdate);
    return () => {
      window.removeEventListener('ai:ramassage-updated', handleAiUpdate);
      window.removeEventListener('ai:colis-updated', handleAiUpdate);
    };
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
          showNotification('success', `${selectedIds.length} ${t('colisPage.parcelsSentForPickup', 'colis envoyé(s) en demande de ramassage.')}`);
        }
        setSelectedIds([]);
        fetchColis();
      } else {
        const data = await response.json();
        if (showNotification) {
          showNotification('error', data.message || t('colisPage.errorOccurred', 'Une erreur est survenue.'));
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification('error', t('colisPage.networkError', 'Une erreur de réseau est survenue.'));
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
          showNotification('success', t('colisPage.parcelSentForPickup', 'Colis envoyé en demande de ramassage.'));
        }
        fetchColis();
      } else {
        const data = await response.json();
        if (showNotification) {
          showNotification('error', data.message || t('colisPage.errorOccurred', 'Une erreur est survenue.'));
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification('error', t('colisPage.networkError', 'Une erreur de réseau est survenue.'));
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
          showNotification('success', t('colisPage.deleteSuccess', 'Colis supprimé avec succès.'));
        }
        setDeleteColis(null);
        fetchColis();
      } else {
        const data = await response.json();
        if (showNotification) {
          showNotification('error', data.message || t('colisPage.deleteError', 'Une erreur est survenue lors de la suppression.'));
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification('error', t('colisPage.deleteError', 'Une erreur est survenue lors de la suppression.'));
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
                {t('stockPage.stockParcelsTitle', 'Liste colis stock en attente de ramassage')}
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">
                  {t('stockPage.stockTotalColis', 'Total colis')}:
                </span>
                <span className="text-base text-foreground font-medium me-2">
                  {totalColis}
                </span>
                <span className="text-base text-secondary-foreground border-s border-input ps-3">
                  {t('stockPage.stockTotalAmount', 'Montant total')}:
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
                {pickupLoading ? t('stockPage.sending', 'Envoi...') : `${t('stockPage.requestPickupBtn', 'Demander un ramassage')} (${selectedIds.length})`}
              </button>
              <button className="kt-btn kt-btn-primary" onClick={() => navigate('/colis/new')}>
                {t('stockPage.addColisBtn', 'Ajouter un colis')}
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
                  {t('stockPage.showingColis', 'Affichage de')} {filteredColis.length} {t('stockPage.colisCount', 'colis')}
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
                        placeholder={t('stockPage.searchColis', 'Rechercher un colis')} 
                        type="text" 
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={selectedEtat}
                      onChange={(val) => { setSelectedEtat(val); setCurrentPage(1); }}
                      placeholder={t('stockPage.colEtat', 'État')}
                      className="w-36"
                      options={[
                        { value: '', label: t('stockPage.allStates', 'Tous les états') },
                        ...etatsPossibles.map(e => ({ value: e, label: formatStatusLabel(e) }))
                      ]}
                    />

                    <KtSelect
                      value={selectedStatut}
                      onChange={(val) => { setSelectedStatut(val); setCurrentPage(1); }}
                      placeholder={t('stockPage.colStatut', 'Statut')}
                      className="w-36"
                      options={[
                        { value: '', label: t('stockPage.allStatuses', 'Tous les statuts') },
                        ...statutsPossibles.map(s => ({ value: s, label: formatStatusLabel(s) }))
                      ]}
                    />

                    <button
                      className="kt-btn kt-btn-outline"
                      onClick={handleResetFilters}
                    >
                      {t('stockPage.reset', 'Réinitialiser')}
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
                          <th className="min-w-[150px]">{t('stockPage.colTrackingCode', 'Code de suivi')}</th>
                          <th className="min-w-[180px]">{t('stockPage.colProduct', 'Nom du produit')}</th>
                          <th className="min-w-[150px]">{t('stockPage.colCreatedAt', 'Date de création')}</th>
                          <th className="min-w-[180px]">{t('stockPage.colAddress', 'Adresse de livraison')}</th>
                          <th className="min-w-[120px]">{t('stockPage.colEtat', 'État')}</th>
                          <th className="min-w-[120px]">{t('stockPage.colStatut', 'Statut')}</th>
                          <th className="min-w-[120px]">{t('stockPage.colDriver', 'Livreur')}</th>
                          <th className="min-w-[160px]">{t('stockPage.colDeliveryDate', 'Date de livraison')}</th>
                          <th className="min-w-[140px]">{t('stockPage.pickupCityLabel', 'Ville')}</th>
                          <th className="min-w-[120px]">{t('stockPage.colQty', 'Prix')}</th>
                          <th className="min-w-[140px]">{t('colisPage.colClaim', 'Réclamation')}</th>
                          <th className="min-w-[180px]">{t('colisPage.colComments', 'Commentaires')}</th>
                          <th className="w-[90px] text-center">{t('stockPage.colActions', 'Actions')}</th>
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
                                  {formatStatusLabel(colis.etatLabel)}
                                </span>
                              </td>
                              <td>
                                <span className={`kt-badge ${colis.statutBadgeClass} kt-badge-outline rounded-[30px] px-2 py-0.5`}>
                                  <span className="kt-badge-dot size-1.5"></span>
                                  {formatStatusLabel(colis.statutLabel)}
                                </span>
                              </td>
                              <td className="text-foreground font-normal">{colis.assignedDriver || '-'}</td>
                              <td className="text-foreground font-normal">-</td>
                              <td className="text-foreground font-normal">{colis.city}</td>
                              <td className="text-foreground font-medium">
                                {colis.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                              </td>
                              <td className="text-foreground font-normal">{t('stockPage.pickupNo', 'Non')}</td>
                              <td className="text-secondary-foreground font-normal text-sm">{colis.comment}</td>
                              <td className="text-center relative">
                                <div className="inline-block text-left">
                                  <button 
                                    className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                    onClick={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.right + window.scrollX - 190 });
                                      setActiveDropdownId(activeDropdownId === colis.id ? null : colis.id);
                                    }}
                                  >
                                    <i className="ki-filled ki-dots-vertical text-lg"></i>
                                  </button>
                                  {activeDropdownId === colis.id && dropdownPos && createPortal(
                                    <div 
                                      className="kt-menu-dropdown kt-menu-default fixed w-[190px]" 
                                      style={{ 
                                        position: 'fixed',
                                        top: `${dropdownPos.top - window.scrollY}px`, 
                                        left: `${dropdownPos.left - window.scrollX}px`, 
                                        zIndex: 99999, 
                                        display: 'block' 
                                      }}
                                    >
                                      <div className="kt-menu-item">
                                        <button
                                          type="button"
                                          className="kt-menu-link text-start w-full"
                                          onClick={() => { setActiveDropdownId(null); navigate(`/colis/${colis.id}/edit`); }}
                                        >
                                          <span className="kt-menu-icon">
                                            <i className="ki-filled ki-pencil"></i>
                                          </span>
                                          <span className="kt-menu-title">{t('stockPage.actionEdit', 'Modifier')}</span>
                                        </button>
                                      </div>
                                      <div className="kt-menu-item">
                                        <button
                                          type="button"
                                          className="kt-menu-link text-start w-full text-destructive hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-600 dark:hover:!text-red-400"
                                          onClick={() => { setActiveDropdownId(null); setDeleteColis(colis); }}
                                        >
                                          <span className="kt-menu-icon text-destructive">
                                            <i className="ki-filled ki-trash"></i>
                                          </span>
                                          <span className="kt-menu-title text-destructive">{t('stockPage.actionDelete', 'Supprimer')}</span>
                                        </button>
                                      </div>
                                      <div className="kt-menu-separator"></div>
                                      <div className="kt-menu-item">
                                        <button
                                          type="button"
                                          className="kt-menu-link text-start w-full"
                                          onClick={() => { setActiveDropdownId(null); handleSinglePickupRequest(colis.id); }}
                                        >
                                          <span className="kt-menu-icon">
                                            <i className="ki-filled ki-delivery-2"></i>
                                          </span>
                                          <span className="kt-menu-title">{t('stockPage.requestPickupBtn', 'Demander un ramassage')}</span>
                                        </button>
                                      </div>
                                    </div>,
                                    document.body
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={14} className="py-8 text-center text-secondary-foreground">
                              {t('stockPage.noColisFound', 'Aucun colis en attente de ramassage')}
                            </td>
                          </tr>
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
                        onChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                        className="w-16"
                        options={perPageOptions}
                      />
                      {t('stockPage.perPage', 'par page')}
                    </div>
                    
                    <div className="flex items-center gap-4 order-1 md:order-2">
                      <span>
                        {t('stockPage.showingColis', 'Affichage de')} {Math.min(totalColis, (currentPage - 1) * itemsPerPage + 1)} {t('colisPage.to', 'à')} {Math.min(totalColis, currentPage * itemsPerPage)} {t('colisPage.of', 'sur')} {totalColis} {t('stockPage.colisCount', 'colis')}
                      </span>
                      {totalPages > 1 && (
                        <div className="flex gap-1">
                          <button 
                            className="kt-btn kt-btn-sm kt-btn-outline px-2"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          >
                            {t('colisPage.prev', 'Précédent')}
                          </button>
                          <span className="px-3 py-1 bg-accent/40 rounded text-foreground font-semibold">{currentPage} / {totalPages}</span>
                          <button 
                            className="kt-btn kt-btn-sm kt-btn-outline px-2"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          >
                            {t('colisPage.next', 'Suivant')}
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
              <h3 className="kt-modal-title">{t('colisPage.deleteColisTitle', 'Supprimer le colis')}</h3>
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
                {t('colisPage.deleteColisConfirm', 'Vous êtes sur le point de supprimer le colis')} <span className="font-medium text-foreground">{deleteColis.trackingCode}</span>.
              </p>
              <form onSubmit={handleDeleteSubmit}>
                <div className="flex items-center justify-end gap-2">
                  <button 
                    className="kt-btn kt-btn-outline" 
                    onClick={() => setDeleteColis(null)} 
                    type="button"
                    disabled={deleteLoading}
                  >
                    {t('stockPage.cancel', 'Annuler')}
                  </button>
                  <button 
                    className="kt-btn kt-btn-destructive" 
                    type="submit"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? t('stockPage.deleting', 'Suppression...') : t('stockPage.actionDelete', 'Supprimer')}
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
