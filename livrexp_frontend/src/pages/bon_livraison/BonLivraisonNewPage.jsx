import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function BonLivraisonNewPage({ navigate, bonId = null, showNotification }) {
  const { t } = useLanguage();
  const isEditMode = !!bonId;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bonReference, setBonReference] = useState('');
  const [availableColis, setAvailableColis] = useState([]);
  const [selectedColisIds, setSelectedColisIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatStatusLabel = (label) => {
    if (!label) return label;
    const cleanLabel = String(label).trim();
    const map = {
      'Terminé': t('status.done', 'Terminé'),
      'En cours': t('status.in_progress', 'En cours'),
      'Reporté': t('status.reporte', 'Reporté'),
      'Échec': t('status.refuse', 'Échec'),
      'En attente': t('status.pending', 'En attente'),
      'Annulé': t('status.cancelled', 'Annulé')
    };
    return map[cleanLabel] || cleanLabel;
  };

  const fetchAvailableColis = async (query = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (bonId) params.append('bon_id', bonId);

      const res = await fetch(`/api/bon-livraison/available-colis?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableColis(data.availableColis || []);
        setCurrentPage(1);
        if (!isEditMode) {
          // Keep whatever was checked or preset
        } else {
          // If editing, preset selectedColisIds from backend
          if (data.selectedColisIds) {
            setSelectedColisIds(data.selectedColisIds);
          }
        }
      }
    } catch (err) {
      console.error('Erreur chargement des colis disponibles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBonDetails = async () => {
    if (!bonId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/bon-livraison/${bonId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBonReference(data.reference || '');
        if (data.selectedColisIds) {
          setSelectedColisIds(data.selectedColisIds);
        }
      }
    } catch (err) {
      console.error('Erreur chargement détails du bon:', err);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchBonDetails();
    }
    fetchAvailableColis();
  }, [bonId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAvailableColis(searchQuery);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    fetchAvailableColis('');
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = availableColis.map(c => c.id);
      setSelectedColisIds(Array.from(new Set([...selectedColisIds, ...allIds])));
    } else {
      const availableSet = new Set(availableColis.map(c => c.id));
      setSelectedColisIds(selectedColisIds.filter(id => !availableSet.has(id)));
    }
  };

  const toggleColisSelect = (id) => {
    if (selectedColisIds.includes(id)) {
      setSelectedColisIds(selectedColisIds.filter(i => i !== id));
    } else {
      setSelectedColisIds([...selectedColisIds, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedColisIds.length === 0) {
      showNotification?.('error', t('deliverySlip.selectAtLeastOne', 'Veuillez sélectionner au moins un colis.'));
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = isEditMode ? `/api/bon-livraison/${bonId}/edit` : '/api/bon-livraison/new';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          colis_ids: selectedColisIds
        })
      });

      const data = await res.json();

      if (res.ok) {
        showNotification?.('success', isEditMode ? t('deliverySlip.updateSuccess', 'Bon de livraison mis à jour avec succès.') : t('deliverySlip.createSuccess', 'Bon de livraison créé avec succès.'));
        navigate('/bon-livraison');
      } else {
        showNotification?.('error', t('deliverySlip.saveError', 'Erreur lors de l\'enregistrement.'));
      }
    } catch (err) {
      showNotification?.('error', t('deliverySlip.serverError', 'Erreur de connexion serveur.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(availableColis.length / itemsPerPage);
  const paginatedColis = availableColis.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const perPageOptions = [
    { value: '10', label: '10' },
    ...(availableColis.length > 10 ? [{ value: '25', label: '25' }] : []),
    ...(availableColis.length > 25 ? [{ value: '50', label: '50' }] : []),
  ];

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="py-4">
          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: i === 0 ? '20px' : i === 1 ? '110px' : i === 6 ? '70px' : '90%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  const allVisibleSelected = availableColis.length > 0 && availableColis.every(c => selectedColisIds.includes(c.id));

  return (
    <DashboardLayout activeMenu="bon_livraison_new">
      <main className="grow pt-5" id="content" role="content">
        
        {/* Header Title & Actions */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                {isEditMode ? t('deliverySlip.editTitle', 'Modifier Bon de Livraison') : t('deliverySlip.addTitle', 'Ajouter Bon de Livraison')}
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                {isEditMode && bonReference ? (
                  <>{t('deliverySlip.reference', 'Référence')} : <span className="font-medium text-foreground">{bonReference}</span></>
                ) : (
                  t('deliverySlip.selectColisToInclude', 'Sélectionnez les colis à inclure dans le bon de livraison')
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2.5">
              <div className="flex items-center gap-2.5">
                <button 
                  type="button"
                  onClick={() => navigate('/bon-livraison')}
                  className="kt-btn kt-btn-outline"
                >
                  {t('stockPage.backToList', 'Retour à la liste')}
                </button>
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={selectedColisIds.length === 0 || submitting}
                  className="kt-btn kt-btn-primary"
                >
                  {submitting ? t('stockPage.saving', 'Enregistrement...') : (isEditMode ? t('stockPage.editSaveChanges', 'Enregistrer les modifications') : t('deliverySlip.createBtn', 'Créer le bon de livraison'))}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Count Alert Banner */}
        <div className="kt-container-fixed">
          <div className="kt-card border border-border/60 mb-5">
            <div className="kt-card-content p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-foreground">
                      {t('deliverySlip.selectedColis', 'Colis sélectionnés')}
                    </div>
                    <span className="kt-badge kt-badge-info kt-badge-outline rounded-[30px]">
                      <span className="kt-badge-dot size-1.5"></span>
                      <span>{selectedColisIds.length}</span>&nbsp;{t('deliverySlip.selectedCount', 'sélectionné(s)')}
                    </span>
                  </div>
                  <div className="text-2sm text-secondary-foreground">
                    {t('deliverySlip.checkColisInstruction', 'Cochez un ou plusieurs colis pour les associer à ce bon de livraison.')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Colis Table & Search */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Card Header Filter */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">
                  {t('deliverySlip.showingAvailableColis', 'Affichage de')} {availableColis.length} {t('deliverySlip.availableColisCount', 'colis disponible(s)')}
                </h3>
                <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input 
                        placeholder={t('deliverySlip.searchColisPlaceholder', 'Code de suivi, destinataire, ville...')} 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  <button className="kt-btn kt-btn-outline kt-btn-primary" type="submit">
                    <i className="ki-filled ki-setting-4"></i>
                    {t('deliverySlip.filterBtn', 'Filtrer')}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleResetSearch}
                    className="kt-btn kt-btn-outline"
                  >
                    {t('stockPage.reset', 'Réinitialiser')}
                  </button>
                </form>
              </div>

              {/* Card Content / Table */}
              <div className="kt-card-content">
                <div id="bon_livraison_colis_table">
                  <div className="kt-scrollable-x-auto">
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                        <tr>
                          <th className="w-[50px]">
                            <input 
                              type="checkbox"
                              className="kt-checkbox kt-checkbox-sm"
                              checked={allVisibleSelected}
                              onChange={toggleSelectAll}
                            />
                          </th>
                          <th className="min-w-[150px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('colisPage.trackingCode', 'Code de suivi')}</span></span>
                          </th>
                          <th className="min-w-[180px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('colisPage.productNature', 'Nature du produit')}</span></span>
                          </th>
                          <th className="min-w-[140px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('colisPage.recipient', 'Destinataire')}</span></span>
                          </th>
                          <th className="min-w-[120px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('colisPage.city', 'Ville')}</span></span>
                          </th>
                          <th className="min-w-[150px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('colisPage.creationDate', 'Date de création')}</span></span>
                          </th>
                          <th className="min-w-[120px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('colisPage.statut', 'Statut')}</span></span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                        ) : paginatedColis.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-secondary-foreground text-center py-8">
                              {t('deliverySlip.noColisAvailable', 'Aucun colis disponible.')}
                            </td>
                          </tr>
                        ) : (
                          paginatedColis.map((colis) => {
                            const isChecked = selectedColisIds.includes(colis.id);
                            const statutBadgeClass = colis.statut === 'Terminé' ? 'kt-badge-success' 
                              : colis.statut === 'En cours' ? 'kt-badge-primary'
                              : colis.statut === 'Reporté' ? 'kt-badge-info'
                              : colis.statut === 'Échec' ? 'kt-badge-destructive'
                              : 'kt-badge-warning';

                            return (
                              <tr key={colis.id} className={isChecked ? 'bg-accent/30' : ''}>
                                <td>
                                  <input 
                                    type="checkbox"
                                    className="kt-checkbox kt-checkbox-sm"
                                    checked={isChecked}
                                    onChange={() => toggleColisSelect(colis.id)}
                                  />
                                </td>
                                <td className="text-foreground font-normal">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="kt-badge kt-badge-primary kt-badge-outline rounded-[30px]">
                                        {colis.trackingCode}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-foreground font-normal">{colis.productNature}</td>
                                <td className="text-foreground font-normal">{colis.recipient}</td>
                                <td className="text-foreground font-normal">{colis.city}</td>
                                <td className="text-foreground font-normal">{colis.createdAt}</td>
                                <td>
                                  <span className={`kt-badge ${statutBadgeClass} kt-badge-outline rounded-[30px]`}>
                                    <span className="kt-badge-dot size-1.5"></span>
                                    {formatStatusLabel(colis.statut)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer with Pagination */}
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
                        {availableColis.length === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, availableColis.length)} ${t('colisPage.of', 'sur')} ${availableColis.length}`}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          type="button"
                          className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline" 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                          disabled={currentPage === 1}
                        >
                          <i className="ki-filled ki-left text-xs"></i>
                        </button>
                        <button 
                          type="button"
                          className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline" 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                          disabled={currentPage === totalPages || totalPages === 0}
                        >
                          <i className="ki-filled ki-right text-xs"></i>
                        </button>
                      </div>
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
