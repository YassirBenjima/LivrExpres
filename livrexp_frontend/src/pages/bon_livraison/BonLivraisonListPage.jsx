import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function BonLivraisonListPage({ navigate, showNotification }) {
  const { t, language } = useLanguage();
  const [bons, setBons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bonToDelete, setBonToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // OTP Validation Modal state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpTrackingCode, setOtpTrackingCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const formatStatusLabel = (label) => {
    if (!label) return label;
    const cleanLabel = String(label).trim();
    const map = {
      'Enregistré': t('deliverySlip.statusRegistered', 'Enregistré'),
      'enregistre': t('deliverySlip.statusRegistered', 'Enregistré'),
      'Registered': t('deliverySlip.statusRegistered', 'Enregistré'),
      'Annulé': t('status.cancelled', 'Annulé'),
      'annule': t('status.cancelled', 'Annulé'),
      'Cancelled': t('status.cancelled', 'Annulé'),
      'En cours': t('status.in_progress', 'En cours'),
      'Livré': t('status.delivered', 'Livré'),
      'Terminé': t('status.done', 'Terminé')
    };
    return map[cleanLabel] || cleanLabel;
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (!otpTrackingCode || !otpInput) {
      setOtpError(t('colisPage.otpInputRequired', 'Veuillez saisir le code de suivi et le code OTP à 4 chiffres.'));
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
          showNotification('success', t('deliverySlip.otpSuccess', 'Code OTP validé ! Le colis a été marqué comme Livré.'));
        }
        setOtpModalOpen(false);
        setOtpTrackingCode('');
        setOtpInput('');
        fetchBons();
      } else {
        setOtpError(data.message || t('deliverySlip.otpInvalid', 'Code OTP invalide. Veuillez vérifier auprès du client.'));
      }
    } catch (err) {
      console.error(err);
      setOtpError(t('deliverySlip.serverError', 'Erreur de communication avec le serveur.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const fetchBons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('q', searchQuery);
      if (statusFilter) queryParams.append('statut', statusFilter);

      const res = await fetch(`/api/bon-livraison?${queryParams.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBons(data.bons || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Erreur chargement des bons de livraison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBons();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBons();
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('');
    setTimeout(() => {
      fetchBons();
    }, 0);
  };

  const toggleDropdown = (id) => {
    setOpenDropdownId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    const handleDocumentClick = () => {
      if (openDropdownId !== null) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [openDropdownId]);

  const handleDeleteSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!bonToDelete) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/bon-livraison/${bonToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showNotification?.('success', t('deliverySlip.deleteSuccess', 'Bon de livraison supprimé avec succès.'));
        setBonToDelete(null);
        fetchBons();
      } else {
        const errData = await res.json();
        showNotification?.('error', errData.message || t('deliverySlip.deleteError', 'Erreur lors de la suppression.'));
      }
    } catch (err) {
      showNotification?.('error', t('deliverySlip.serverError', 'Erreur serveur.'));
    } finally {
      setDeleting(false);
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(bons.length / itemsPerPage);
  const paginatedBons = bons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const perPageOptions = [
    { value: '10', label: '10' },
    ...(bons.length > 10 ? [{ value: '25', label: '25' }] : []),
    ...(bons.length > 25 ? [{ value: '50', label: '50' }] : []),
  ];

  const SkeletonRow = () => (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i}>
          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: i === 0 ? '120px' : i === 3 ? '70px' : i === 5 ? '40px' : '85%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="bon_livraison_list">
      <main className="grow pt-5" id="content" role="content">
        
        {/* Header Title & Counter */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                {t('deliverySlip.listTitle', 'Liste bons de livraison')}
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">
                  {t('deliverySlip.totalBons', 'Total bons')} :
                </span>
                <span className="text-base text-foreground font-medium">{bons.length}</span>
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
              <button 
                onClick={() => navigate('/bon-livraison/new')}
                className="kt-btn kt-btn-primary"
              >
                {t('deliverySlip.addBtn', 'Ajouter Bon de Livraison')}
              </button>
            </div>
          </div>
        </div>

        {/* Main Card with Filter Form & Table */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Card Header (Search & Filters) */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">
                  {t('deliverySlip.showingCount', 'Affichage de')} {bons.length} {t('deliverySlip.bonsCount', 'bon(s) de livraison')}
                </h3>
                <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input 
                        placeholder={t('deliverySlip.searchPlaceholder', 'Référence, code de suivi...')} 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={statusFilter}
                      onChange={(val) => setStatusFilter(val)}
                      placeholder={t('colisPage.statut', 'Statut')}
                      className="w-36"
                      options={[
                        { value: '', label: t('colisPage.allStatuts', 'Tous les statuts') },
                        { value: 'enregistre', label: t('deliverySlip.statusRegistered', 'Enregistré') },
                        { value: 'annule', label: t('status.cancelled', 'Annulé') }
                      ]}
                    />
                    <button className="kt-btn kt-btn-outline kt-btn-primary" type="submit">
                      <i className="ki-filled ki-setting-4"></i>
                      {t('deliverySlip.filterBtn', 'Filtrer')}
                    </button>
                    <button 
                      className="kt-btn kt-btn-outline" 
                      type="button"
                      onClick={handleReset}
                    >
                      {t('stockPage.reset', 'Réinitialiser')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Card Content / Data Table */}
              <div className="kt-card-content">
                <div id="bon_livraison_table">
                  <div className="kt-scrollable-x-auto" style={openDropdownId !== null ? { overflow: 'visible' } : {}}>
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                        <tr>
                          <th className="min-w-[180px]">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">{t('deliverySlip.colRef', 'Réf')}</span>
                            </span>
                          </th>
                          <th className="min-w-[160px]">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">{t('colisPage.creationDate', 'Date de création')}</span>
                            </span>
                          </th>
                          <th className="min-w-[170px]">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">{t('deliverySlip.colRegisteredDate', 'Date d\'enregistrement')}</span>
                            </span>
                          </th>
                          <th className="min-w-[130px]">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">{t('colisPage.statut', 'Statut')}</span>
                            </span>
                          </th>
                          <th className="min-w-[220px]">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">{t('colisPage.parcels', 'Colis')}</span>
                            </span>
                          </th>
                          <th className="min-w-[160px] text-center">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">{t('common.actions', 'Action')}</span>
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                        ) : paginatedBons.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-secondary-foreground text-center py-8">
                              {t('deliverySlip.noBonFound', 'Aucun bon de livraison trouvé.')}
                            </td>
                          </tr>
                        ) : (
                          paginatedBons.map((bon) => (
                            <tr key={bon.id}>
                              <td className="text-foreground font-medium">
                                {bon.reference}
                              </td>
                              <td className="text-foreground font-normal">
                                {bon.createdAt}
                              </td>
                              <td className="text-foreground font-normal">
                                {bon.registeredAt}
                              </td>
                              <td>
                                <span className={`kt-badge ${bon.statusBadgeClass} kt-badge-outline rounded-[30px]`}>
                                  <span className="kt-badge-dot size-1.5"></span>
                                  {formatStatusLabel(bon.statusLabel)}
                                </span>
                              </td>
                              <td className="text-foreground font-normal">
                                <div className="flex flex-col gap-1">
                                  {bon.colis && bon.colis.length > 0 ? (
                                    bon.colis.map((c) => (
                                      <div key={c.id} className="flex flex-wrap items-center gap-2">
                                        <span className="kt-badge kt-badge-primary kt-badge-outline rounded-[30px]">
                                          {c.trackingCode}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-secondary-foreground">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center relative" style={openDropdownId === bon.id ? { zIndex: 9999 } : {}}>
                                <div className="relative inline-block text-left">
                                  <button 
                                    type="button"
                                    className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDropdown(bon.id);
                                    }}
                                  >
                                    <i className="ki-filled ki-dots-vertical text-lg"></i>
                                  </button>
                                  
                                  {openDropdownId === bon.id && (
                                    <div className="kt-menu-dropdown kt-menu-default absolute right-0 mt-2 w-[175px]" style={{ zIndex: 99999, display: 'block' }}>
                                      <div className="kt-menu-item">
                                        <a 
                                          className="kt-menu-link text-start w-full cursor-pointer"
                                          href={`/api/bon-livraison/${bon.id}/download?lang=${language}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={() => setOpenDropdownId(null)}
                                        >
                                          <span className="kt-menu-icon"><i className="ki-filled ki-file-down"></i></span>
                                          <span className="kt-menu-title">{t('deliverySlip.download', 'Télécharger')}</span>
                                        </a>
                                      </div>
                                      <div className="kt-menu-item">
                                        <button 
                                          type="button"
                                          className="kt-menu-link text-start w-full cursor-pointer"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setOpenDropdownId(null);
                                            navigate(`/bon-livraison/${bon.id}/edit`);
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setOpenDropdownId(null);
                                            navigate(`/bon-livraison/${bon.id}/edit`);
                                          }}
                                        >
                                          <span className="kt-menu-icon"><i className="ki-filled ki-pencil"></i></span>
                                          <span className="kt-menu-title">{t('stockPage.actionEdit', 'Modifier')}</span>
                                        </button>
                                      </div>
                                      <div className="kt-menu-item">
                                        <button 
                                          type="button"
                                          className="kt-menu-link text-start w-full text-destructive hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-600 dark:hover:!text-red-400 cursor-pointer"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            setBonToDelete(bon);
                                          }}
                                        >
                                          <span className="kt-menu-icon text-destructive"><i className="ki-filled ki-trash"></i></span>
                                          <span className="kt-menu-title text-destructive">{t('stockPage.actionDelete', 'Supprimer')}</span>
                                        </button>
                                      </div>
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
                        {bons.length === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, bons.length)} ${t('colisPage.of', 'sur')} ${bons.length}`}
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

      {/* Delete Confirmation Modal (Portal) */}
      {bonToDelete && createPortal(
        <div 
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
            zIndex: 99999,
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out'
          }}
          onClick={() => !deleting && setBonToDelete(null)}
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
              <h3 className="text-base font-semibold text-foreground">{t('deliverySlip.deleteModalTitle', 'Supprimer le bon de livraison')}</h3>
              <button 
                type="button"
                onClick={() => setBonToDelete(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={deleting}
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
                  {t('deliverySlip.deleteModalConfirm', 'Vous êtes sur le point de supprimer le bon')} <strong className="font-semibold text-foreground">{bonToDelete.reference}</strong>. {t('colisPage.irreversibleText', 'Cette action est irréversible et supprimera définitivement le bon de livraison de la base de données.')}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setBonToDelete(null)} 
                  className="kt-btn kt-btn-outline"
                  disabled={deleting}
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button 
                  type="submit" 
                  className="kt-btn kt-btn-destructive"
                  disabled={deleting}
                >
                  {deleting ? t('deliverySlip.deleting', 'Suppression...') : t('common.delete', 'Supprimer')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* OTP Validation Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-background rounded-xl border border-border shadow-2xl max-w-md w-full p-6 m-4">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <i className="ki-filled ki-shield-check text-green-600 text-xl"></i>
                {t('colisPage.otpModalTitle', 'Validation OTP Livraison WhatsApp')}
              </h3>
              <button 
                onClick={() => setOtpModalOpen(false)}
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                disabled={otpLoading}
              >
                <i className="ki-filled ki-cross text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="py-4 flex flex-col gap-4">
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
                  placeholder={t('colisPage.otpTrackingPlaceholder', 'N° de commande ou code de suivi')}
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
                  placeholder={t('colisPage.otpCodePlaceholder', 'Code OTP (4 chiffres)')}
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('colisPage.otpHint', 'Ce code à 4 chiffres a été envoyé automatiquement au destinataire par WhatsApp.')}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
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
        </div>
      )}
    </DashboardLayout>
  );
}
