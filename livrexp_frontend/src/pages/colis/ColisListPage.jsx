import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function ColisListPage({ colisList = [], loading = false, refetchData, navigate, showNotification }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEtat, setSelectedEtat] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState(null);
  const [deleteColis, setDeleteColis] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // OTP Validation Modal state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpTrackingCode, setOtpTrackingCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (!otpTrackingCode || !otpInput) {
      setOtpError('Veuillez saisir le code de suivi et le code OTP à 4 chiffres.');
      return;
    }
    setOtpLoading(true);

    try {
      const res = await fetch('/api/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ trackingCode: otpTrackingCode, otpCode: otpInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (showNotification) {
          showNotification('success', data.message || t('notifications.otpValidated', 'Code OTP validé ! Le colis a été marqué comme Livré.'));
        }
        setOtpModalOpen(false);
        setOtpTrackingCode('');
        setOtpInput('');
        if (refetchData) await refetchData();
      } else {
        setOtpError(data.message || t('notifications.otpError', 'Code OTP invalide. Veuillez vérifier auprès du client.'));
      }
    } catch (err) {
      console.error(err);
      setOtpError(t('notifications.serverError', 'Erreur de communication avec le serveur.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!deleteColis) return;
    setDeleteLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/colis/${deleteColis.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        if (refetchData) {
          await refetchData();
        }
        if (showNotification) {
          showNotification('success', t('notifications.colisDeleted', 'Colis supprimé avec succès.'));
        }
        setDeleteColis(null);
      } else {
        const data = await response.json();
        const msg = data.message || t('notifications.deleteError', 'Une erreur est survenue lors de la suppression.');
        if (showNotification) {
          showNotification('error', msg);
        } else {
          alert(msg);
        }
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification('error', 'Une erreur est survenue lors de la suppression.');
      } else {
        alert('Une erreur est survenue lors de la suppression.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter calculations
  const filteredColis = colisList.filter(colis => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || (
      (colis.trackingCode && colis.trackingCode.toLowerCase().includes(q)) ||
      (colis.productNature && colis.productNature.toLowerCase().includes(q)) ||
      (colis.address && colis.address.toLowerCase().includes(q)) ||
      (colis.city && colis.city.toLowerCase().includes(q))
    );
    const matchEtat = !selectedEtat || colis.etatLabel === selectedEtat;
    const matchStatut = !selectedStatut || colis.statutLabel === selectedStatut;
    return matchSearch && matchEtat && matchStatut;
  });

  const totalColis = filteredColis.length;
  const totalMontant = filteredColis.reduce((sum, item) => sum + item.price, 0);

  // Filter options: always keep 5 and 10, enable 20 if >10, enable 50 if >=50
  const perPageOptions = [
    { value: '5', label: '5' },
    { value: '10', label: '10' },
  ];
  if (totalColis > 10) {
    perPageOptions.push({ value: '20', label: '20' });
  }
  if (totalColis >= 50) {
    perPageOptions.push({ value: '50', label: '50' });
  }

  useEffect(() => {
    // If current perPage is no longer in the allowed options list, fallback to 10
    const exists = perPageOptions.some(opt => Number(opt.value) === perPage);
    if (!exists) {
      setPerPage(10);
      setCurrentPage(1);
    }
  }, [totalColis, perPage, perPageOptions]);

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

  // Pagination logic
  const totalPages = Math.ceil(totalColis / perPage) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedColis = filteredColis.slice((validPage - 1) * perPage, validPage * perPage);

  // Unique lists for filters
  const etatsPossibles = Array.from(new Set(colisList.map(c => c.etatLabel).filter(Boolean)));
  const statutsPossibles = Array.from(new Set(colisList.map(c => c.statutLabel).filter(Boolean)));

  const formatStatusLabel = (label) => {
    if (!label) return label;
    const map = {
      'Créé': t('status.cree', 'Créé'),
      'En attente': t('status.enAttente', 'En attente'),
      'Expédié': t('status.expedie', 'Expédié'),
      'Livré': t('status.livre', 'Livré'),
      'Retourné': t('status.retourne', 'Retourné'),
      'Annulé': t('status.annule', 'Annulé'),
      'En préparation': t('status.enPreparation', 'En préparation'),
      'Nouveau': t('status.nouveau', 'Nouveau'),
      'En cours': t('status.enCours', 'En cours'),
      'Terminé': t('status.termine', 'Terminé'),
      'Reporté': t('status.reporte', 'Reporté'),
      'Litige': t('status.litige', 'Litige'),
      'Refusé': t('status.refuse', 'Refusé'),
    };
    return map[label] || label;
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedEtat('');
    setSelectedStatut('');
    setCurrentPage(1);
  };

  const toggleDropdown = (id) => {
    setActiveDropdownId(prev => prev === id ? null : id);
  };

  return (
    <DashboardLayout activeMenu="colis_list">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Container Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                {t('colisPage.colisListTitle', 'Liste des colis')}
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">
                  {t('colisPage.totalParcels', 'Total colis')}:
                </span>
                <span className="text-base text-foreground font-medium me-2">
                  {totalColis}
                </span>
                <span className="text-base text-secondary-foreground">
                  {t('colisPage.totalAmount', 'Montant total')}:
                </span>
                <span className="text-base text-foreground font-medium">
                  {totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="kt-btn kt-btn-outline text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={() => { setOtpTrackingCode(''); setOtpInput(''); setOtpError(''); setOtpModalOpen(true); }}
              >
                <i className="ki-filled ki-shield-check text-base"></i>
                {t('colisPage.validateOtp', 'Valider OTP WhatsApp')}
              </button>
              <a className="kt-btn kt-btn-outline" href="/colis/import">
                {t('colisPage.importExcel', 'Importer un fichier Excel')}
              </a>
              <a className="kt-btn kt-btn-primary" href="/colis/new">
                {t('colisPage.addParcel', 'Ajouter un colis')}
              </a>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Card Header & Filter Form */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">
                  {t('dashboard.showing', 'Affichage de')} {filteredColis.length} {t('nav.parcels', 'colis')}
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
                        placeholder={t('colisPage.searchPlaceholder', 'Rechercher un colis')} 
                        type="text" 
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={selectedEtat}
                      onChange={(val) => { setSelectedEtat(val); setCurrentPage(1); }}
                      placeholder={t('colisPage.etat', 'État')}
                      className="w-36"
                      options={[
                        { value: '', label: t('colisPage.allEtats', 'Tous les états') },
                        ...etatsPossibles.map(e => ({ value: e, label: formatStatusLabel(e) }))
                      ]}
                    />

                    <KtSelect
                      value={selectedStatut}
                      onChange={(val) => { setSelectedStatut(val); setCurrentPage(1); }}
                      placeholder={t('colisPage.statut', 'Statut')}
                      className="w-36"
                      options={[
                        { value: '', label: t('colisPage.allStatuts', 'Tous les statuts') },
                        ...statutsPossibles.map(s => ({ value: s, label: formatStatusLabel(s) }))
                      ]}
                    />

                    <button
                      className="kt-btn kt-btn-outline"
                      onClick={handleResetFilters}

                    >
                      {t('common.reset', 'Réinitialiser')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Content & Table */}
              <div className="kt-card-content">
                <div className="grid">
                  <div className="kt-scrollable-x-auto">
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                          <tr>
                            <th className="min-w-[150px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.trackingCode', 'Code de suivi')}</span>
                              </span>
                            </th>
                            <th className="min-w-[180px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.productName', 'Nom du produit')}</span>
                              </span>
                            </th>
                            <th className="min-w-[150px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.creationDate', 'Date de création')}</span>
                              </span>
                            </th>
                            <th className="min-w-[180px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.deliveryAddress', 'Adresse de livraison')}</span>
                              </span>
                            </th>
                            <th className="min-w-[120px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.etat', 'État')}</span>
                              </span>
                            </th>
                            <th className="min-w-[120px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.statut', 'Statut')}</span>
                              </span>
                            </th>
                            <th className="min-w-[120px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.driver', 'Livreur')}</span>
                              </span>
                            </th>
                            <th className="min-w-[160px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.deliveryDate', 'Date de livraison')}</span>
                              </span>
                            </th>
                            <th className="min-w-[140px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.city', 'Ville')}</span>
                              </span>
                            </th>
                            <th className="min-w-[120px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.price', 'Prix')}</span>
                              </span>
                            </th>
                            <th className="min-w-[140px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.claim', 'Réclamation')}</span>
                              </span>
                            </th>
                            <th className="min-w-[180px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('colisPage.comments', 'Commentaires')}</span>
                              </span>
                            </th>
                            <th className="w-[90px] text-center">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">{t('common.actions', 'Actions')}</span>
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            // Skeleton shimmer rows
                            Array.from({ length: 8 }).map((_, i) => (
                              <tr key={`skel-${i}`}>
                                {Array.from({ length: 12 }).map((_, j) => (
                                  <td key={j}>
                                    <div
                                      style={{
                                        height: '14px',
                                        borderRadius: '6px',
                                        background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.4s infinite',
                                        width: j === 11 ? '40px' : j === 0 ? '90px' : j === 4 || j === 5 ? '70px' : '100%',
                                        margin: j === 11 ? 'auto' : undefined,
                                      }}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : paginatedColis.length > 0 ? (
                            paginatedColis.map((colis) => (
                              <tr key={colis.id}>
                                <td className="font-medium">
                                  <button
                                    onClick={() => navigate(`/colis/${colis.id}/edit`)}
                                    className="text-foreground hover:underline text-start bg-transparent border-0 p-0 font-medium cursor-pointer"
                                  >
                                    {colis.trackingCode}
                                  </button>
                                </td>
                                <td className="text-foreground font-normal">{colis.productNature}</td>
                                <td className="text-foreground font-normal">{colis.createdAt}</td>
                                <td className="text-foreground font-normal">{colis.address}</td>
                                <td>
                                  <span className={`kt-badge ${colis.etatBadgeClass} kt-badge-outline rounded-[30px]`}>
                                    <span className="kt-badge-dot size-1.5"></span>
                                    {formatStatusLabel(colis.etatLabel)}
                                  </span>
                                </td>
                                <td>
                                  <span className={`kt-badge ${colis.statutBadgeClass} kt-badge-outline rounded-[30px]`}>
                                    <span className="kt-badge-dot size-1.5"></span>
                                    {formatStatusLabel(colis.statutLabel)}
                                  </span>
                                </td>
                                 <td className="text-foreground font-normal me-2 me-sm-0">{colis.assignedDriver || '-'}</td>
                                 <td className="text-foreground font-normal">-</td>
                                <td className="text-foreground font-normal">{colis.city}</td>
                                <td className="text-foreground font-medium">
                                  {colis.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                                </td>
                                <td className="text-foreground font-normal">{colis.hasClaim ? t('common.yes', 'Oui') : t('common.no', 'Non')}</td>
                                <td className="text-foreground font-normal">{colis.comment || '-'}</td>

                                  <td className="text-center relative">
                                    <div className="inline-block text-left">
                                      <button 
                                        id={`colis-action-btn-${colis.id}`}
                                        className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                        onClick={(e) => {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.right + window.scrollX - 175 });
                                          toggleDropdown(colis.id);
                                        }}
                                      >
                                        <i className="ki-filled ki-dots-vertical text-lg"></i>
                                      </button>
                                      
                                      {activeDropdownId === colis.id && dropdownPos && createPortal(
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
                                          <div className="kt-menu-item">
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                setActiveDropdownId(null);
                                                navigate(`/colis/${colis.id}/edit`);
                                              }}
                                              className="kt-menu-link text-start w-full"
                                            >
                                              <span className="kt-menu-icon">
                                                <i className="ki-filled ki-pencil"></i>
                                              </span>
                                              <span className="kt-menu-title">{t('common.edit', 'Modifier')}</span>
                                            </button>
                                          </div>
                                          <div className="kt-menu-item">
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                setActiveDropdownId(null);
                                                setDeleteColis({ id: colis.id, trackingCode: colis.trackingCode });
                                              }}
                                              className="kt-menu-link text-start w-full text-destructive hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-600 dark:hover:!text-red-400"
                                            >
                                              <span className="kt-menu-icon text-destructive">
                                                <i className="ki-filled ki-trash"></i>
                                              </span>
                                              <span className="kt-menu-title text-destructive">{t('common.delete', 'Supprimer')}</span>
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
                              <td colSpan={13} className="py-8 text-center text-secondary-foreground">
                                {t('colisPage.noColisFound', 'Aucun colis correspondant')}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium py-4">
                      <div className="flex items-center gap-2 order-2 md:order-1">
                        {t('dashboard.display', 'Afficher')}
                        <KtSelect
                          value={String(perPage)}
                          onChange={(val) => { setPerPage(Number(val)); setCurrentPage(1); }}
                          className="w-16"
                          options={perPageOptions}
                        />
                        {t('dashboard.perPage', 'par page')}
                      </div>
                      
                      <div className="flex items-center gap-4 order-1 md:order-2">
                        <span>
                          {totalColis > 0
                            ? `${t('dashboard.showing', 'Affichage de')} ${Math.min(totalColis, (currentPage - 1) * perPage + 1)} ${t('dashboard.to', 'à')} ${Math.min(totalColis, currentPage * perPage)} ${t('dashboard.of', 'sur')} ${totalColis} ${t('nav.parcels', 'colis')}`
                            : t('dashboard.showingZero', 'Affichage de 0 sur 0 entrées')}
                        </span>
                        {totalPages > 1 && (
                          <div className="flex gap-1">
                            <button 
                              className="kt-btn kt-btn-sm kt-btn-outline px-2"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                              {t('dashboard.prev', 'Précédent')}
                            </button>
                            <span className="px-3 py-1 bg-accent/40 rounded text-foreground font-semibold">{currentPage} / {totalPages}</span>
                            <button 
                              className="kt-btn kt-btn-sm kt-btn-outline px-2"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                              {t('dashboard.next', 'Suivant')}
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
          className="fixed flex items-center justify-center p-4"
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
          onClick={() => !deleteLoading && setDeleteColis(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-950 border rounded-lg shadow-xl overflow-hidden" 
            style={{ width: '100%', maxWidth: '440px', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <h3 className="text-base font-semibold text-foreground">{t('colisPage.deleteParcelTitle', 'Supprimer le colis')}</h3>
              <button 
                type="button"
                onClick={() => setDeleteColis(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={deleteLoading}
              >
                <i className="ki-filled ki-cross text-lg"></i>
              </button>
            </div>

            {/* Content & Actions */}
            <form onSubmit={handleDeleteSubmit} className="p-5">
              <div 
                className="flex gap-3 border rounded-lg p-4 mb-5"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderColor: 'rgba(239, 68, 68, 0.2)'
                }}
              >
                <i className="ki-filled ki-information-2 text-red-600 text-xl shrink-0 mt-0.5"></i>
                <div className="text-sm text-foreground leading-relaxed">
                  {t('colisPage.deleteParcelConfirm', 'Vous êtes sur le point de supprimer le colis')} <strong className="font-semibold text-foreground">{deleteColis.trackingCode}</strong>. {t('colisPage.irreversibleText', 'Cette action est irréversible et supprimera définitivement le colis de la base de données.')}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setDeleteColis(null)} 
                  className="kt-btn kt-btn-outline"
                  disabled={deleteLoading}
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button 
                  type="submit" 
                  className="kt-btn kt-btn-destructive"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? t('colisPage.deleting', 'Suppression...') : t('common.delete', 'Supprimer')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* OTP Validation Modal */}
      {otpModalOpen && createPortal(
        <div 
          className="fixed flex items-center justify-center p-4"
          style={{ 
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyCenter: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 99999 
          }}
          onClick={() => !otpLoading && setOtpModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-950 border rounded-lg shadow-xl overflow-hidden" 
            style={{ width: '100%', maxWidth: '440px', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <i className="ki-filled ki-shield-check text-green-600 text-lg"></i>
                {t('colisPage.otpModalTitle', 'Validation OTP Livraison WhatsApp')}
              </h3>
              <button 
                type="button"
                onClick={() => setOtpModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={otpLoading}
              >
                <i className="ki-filled ki-cross text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="p-5 flex flex-col gap-4">
              {otpError && (
                <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-600 rounded flex items-center gap-2">
                  <i className="ki-filled ki-information-2 text-base"></i>
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-secondary-foreground mb-1 block">
                  {t('colisPage.otpTrackingLabel', 'Code de suivi / N° de commande *')}
                </label>
                <input
                  type="text"
                  className="kt-input text-sm w-full"
                  placeholder="N° de commande ou code de suivi"
                  required
                  value={otpTrackingCode}
                  onChange={(e) => setOtpTrackingCode(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary-foreground mb-1 block">
                  {t('colisPage.otpCodeLabel', 'Code OTP WhatsApp (4 chiffres) *')}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  className="kt-input text-lg font-mono text-center tracking-widest w-full"
                  placeholder="Code OTP (4 chiffres)"
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('colisPage.otpHint', 'Ce code à 4 chiffres a été envoyé automatiquement au destinataire par WhatsApp.')}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setOtpModalOpen(false)} 
                  className="kt-btn kt-btn-outline"
                  disabled={otpLoading}
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button 
                  type="submit" 
                  className="kt-btn kt-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={otpLoading}
                >
                  {otpLoading ? t('colisPage.verifying', 'Vérification...') : t('colisPage.validateAndMarkDelivered', 'Valider & Marquer Livré')}
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
