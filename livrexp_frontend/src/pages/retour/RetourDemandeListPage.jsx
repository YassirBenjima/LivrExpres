import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function RetourDemandeListPage({ navigate, showNotification }) {
  const { t } = useLanguage();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [statutOptions, setStatutOptions] = useState([]);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Advanced Stats
  const [stats, setStats] = useState({
    totalReturns: 0,
    returnRatePercent: 4.5,
    inQualityCheck: 0,
    retriedDeliveries: 0,
    reasonsBreakdown: [],
    topCities: [],
    topClients: []
  });

  // Modal State
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [qualityForm, setQualityForm] = useState({
    action: 'quality_check', // 'reception', 'quality_check', 'relance', 'resolve'
    reason: 'REFUS',
    quality_status: 'CONFORME',
    note: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatReceptionType = (type) => {
    if (!type) return '-';
    const clean = String(type).trim().toLowerCase();
    if (clean.includes('livreur') || clean.includes('driver')) return t('returns.byDriver', 'Par Livreur');
    if (clean.includes('agence') || clean.includes('branch')) return t('returns.atBranch', 'En Agence');
    return type;
  };

  const formatStatusLabel = (statut, rawLabel) => {
    const label = rawLabel || statut;
    if (!label) return t('returns.statusPending', 'En attente');
    const clean = String(label).trim().toLowerCase();
    const map = {
      'en attente': t('returns.statusPending', 'En attente'),
      'en traitement': t('returns.statusInProcessing', 'En traitement'),
      'reçu': t('returns.statusReceived', 'Reçu'),
      'recu': t('returns.statusReceived', 'Reçu'),
      'annulé': t('returns.statusCancelled', 'Annulé'),
      'annule': t('returns.statusCancelled', 'Annulé')
    };
    return map[clean] || label;
  };

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedStatut) params.append('statut', selectedStatut);

      const res = await fetch(`/api/retour/demandes?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setDemandes(data.demandes || []);
        if (data.statuts_possibles && data.statut_labels) {
          const opts = [
            { value: '', label: t('returns.allStatuses', 'Tous les statuts') },
            ...data.statuts_possibles.map(s => ({
              value: s,
              label: formatStatusLabel(s, data.statut_labels[s])
            }))
          ];
          setStatutOptions(opts);
        }
      }
    } catch (err) {
      console.error('Erreur chargement demandes retour:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/retour/advanced-stats', {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Erreur stats retours:', e);
    }
  };

  useEffect(() => {
    fetchDemandes();
    fetchStats();
  }, [searchQuery, selectedStatut]);

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

  const handleOpenWorkflowModal = (demande, actionType = 'quality_check') => {
    setSelectedDemande(demande);
    setQualityForm({
      action: actionType,
      reason: 'REFUS',
      quality_status: 'CONFORME',
      note: ''
    });
    setIsQualityModalOpen(true);
  };

  const handleUpdateWorkflow = async (e) => {
    e.preventDefault();
    if (!selectedDemande) return;

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/retour/demandes/${selectedDemande.id}/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(qualityForm)
      });

      if (res.ok) {
        const data = await res.json();
        if (showNotification) showNotification('success', data.message || t('returns.statusUpdated', 'Statut du retour mis à jour.'));
        setIsQualityModalOpen(false);
        fetchDemandes();
        fetchStats();
      } else {
        if (showNotification) showNotification('error', t('returns.updateError', 'Erreur lors de la mise à jour du retour.'));
      }
    } catch (err) {
      console.error(err);
      if (showNotification) showNotification('error', t('returns.networkError', 'Erreur réseau.'));
    }
  };

  const handleRelancerColis = async (colisId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/retour/colis/${colisId}/relance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (showNotification) showNotification('success', data.message || t('returns.relaunchSuccess', 'Nouvelle tentative de livraison planifiée !'));
        fetchDemandes();
        fetchStats();
      } else {
        if (showNotification) showNotification('error', t('returns.relaunchError', 'Impossible de relancer ce colis.'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const reasonOptions = [
    { value: '', label: t('returns.allReasons', 'Toutes les raisons') },
    { value: 'ABSENT', label: t('returns.reasonAbsent', 'Destinataire Absent') },
    { value: 'REFUS', label: t('returns.reasonRefusal', 'Refus à la livraison') },
    { value: 'ADRESSE_INCORRECTE', label: t('returns.reasonAddress', 'Adresse Incorrecte / Injoignable') },
    { value: 'PRODUIT_DEFECTUEUX', label: t('returns.reasonDefective', 'Produit Défectueux') },
    { value: 'ANNULATION_CLIENT', label: t('returns.reasonCancelled', 'Commande Annulée') },
    { value: 'AUTRE', label: t('returns.reasonOther', 'Autre motif') },
  ];

  const defaultStatutOptions = [
    { value: '', label: t('returns.allStatuses', 'Tous les statuts') },
    { value: 'En attente', label: t('returns.statusPending', 'En attente') },
    { value: 'En traitement', label: t('returns.statusInProcessing', 'En traitement') },
    { value: 'Reçu', label: t('returns.statusReceived', 'Reçu') },
    { value: 'Annulé', label: t('returns.statusCancelled', 'Annulé') }
  ];

  const totalDemandes = demandes.length;
  const totalPages = Math.ceil(totalDemandes / itemsPerPage);
  const paginatedDemandes = demandes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SkeletonRow = () => (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i}>
          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: i === 0 ? '100px' : i === 3 ? '140px' : '85%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="retour_demandes">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">{t('returns.requestTitle', 'Demande de retour')}</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">{t('returns.totalRequests', 'Total demandes :')}</span>
                <span className="text-base text-foreground font-medium">{totalDemandes}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                className="kt-btn kt-btn-primary"
                onClick={() => navigate('/retour/demandes/new')}
              >
                {t('returns.newRequestBtn', 'Nouvelle demande')}
              </button>
            </div>
          </div>
        </div>

        {/* Table Content Card */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Header Filters */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">
                  {t('returns.showingCount', 'Affichage de')} {totalDemandes} {t('returns.requestsCount', 'demande(s)')}
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder={t('returns.searchPlaceholder', 'Rechercher une demande...')}
                        type="text"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={selectedStatut}
                      onChange={(val) => { setSelectedStatut(val); setCurrentPage(1); }}
                      placeholder={t('returns.allStatuses', 'Tous les statuts')}
                      className="w-40"
                      options={statutOptions.length > 0 ? statutOptions : defaultStatutOptions}
                    />

                    <KtSelect
                      value={selectedReason}
                      onChange={(val) => setSelectedReason(val)}
                      placeholder={t('returns.allReasons', 'Toutes les raisons')}
                      className="w-48"
                      options={reasonOptions}
                    />

                    <button
                      className="kt-btn kt-btn-outline"
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStatut('');
                        setSelectedReason('');
                        setCurrentPage(1);
                      }}
                    >
                      {t('returns.resetBtn', 'Réinitialiser')}
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
                        <th className="min-w-[150px]">{t('returns.colParcelReception', 'Réception colis')}</th>
                        <th className="min-w-[150px]">{t('returns.colDate', 'Date')}</th>
                        <th className="min-w-[160px]">{t('returns.colReturnSlip', 'Bon de retour')}</th>
                        <th className="min-w-[220px]">{t('returns.colParcels', 'Colis')}</th>
                        <th className="min-w-[200px]">{t('returns.colNote', 'Note & Remarque')}</th>
                        <th className="min-w-[130px]">{t('returns.colStatus', 'Statut')}</th>
                        <th className="w-[80px] text-center">{t('returns.colActions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginatedDemandes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-secondary-foreground text-center py-8">
                            {t('returns.noRequestFound', 'Aucune demande de retour trouvée.')}
                          </td>
                        </tr>
                      ) : (
                        paginatedDemandes.map((demande) => (
                          <tr key={demande.id}>
                            <td className="text-foreground font-medium">{formatReceptionType(demande.receptionType)}</td>
                            <td className="text-foreground font-normal">{demande.createdAt || '-'}</td>
                            <td className="text-foreground font-medium">{demande.bonReference}</td>
                            <td>
                              <div className="flex flex-wrap gap-1.5">
                                {demande.colis && demande.colis.length > 0 ? (
                                  demande.colis.map(c => (
                                    <div key={c.id} className="flex items-center gap-1">
                                      <span className="kt-badge kt-badge-primary kt-badge-outline rounded-[30px]">
                                        {c.trackingCode}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRelancerColis(c.id)}
                                        className="text-[11px] text-primary hover:underline font-medium"
                                        title={t('returns.relaunchTitle', 'Relancer livraison')}
                                      >
                                        {t('returns.relaunchBtn', '[Relancer]')}
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-secondary-foreground">-</span>
                                )}
                              </div>
                            </td>
                            <td className="text-foreground font-normal">{demande.note || '-'}</td>
                            <td>
                              <span className={`kt-badge ${demande.statusBadgeClass || 'kt-badge-warning'} kt-badge-outline rounded-[30px]`}>
                                <span className="kt-badge-dot size-1.5"></span>
                                {formatStatusLabel(demande.status, demande.statusLabel)}
                              </span>
                            </td>
                            <td className="text-center relative" style={activeDropdownId === demande.id ? { zIndex: 9999 } : {}}>
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={() => setActiveDropdownId(activeDropdownId === demande.id ? null : demande.id)}
                                  className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                  type="button"
                                >
                                  <i className="ki-filled ki-dots-vertical text-lg"></i>
                                </button>
                                {activeDropdownId === demande.id && (
                                  <div className="kt-menu-dropdown kt-menu-default absolute right-0 mt-2 w-[185px]" style={{ zIndex: 9999, display: 'block' }}>
                                    <div className="kt-menu-item">
                                      <button
                                        type="button"
                                        className="kt-menu-link text-start w-full"
                                        onClick={() => { setActiveDropdownId(null); handleOpenWorkflowModal(demande, 'quality_check'); }}
                                      >
                                        <span className="kt-menu-icon">
                                          <i className="ki-filled ki-verify text-primary"></i>
                                        </span>
                                        <span className="kt-menu-title">{t('returns.qualityCheck', 'Contrôle Qualité')}</span>
                                      </button>
                                    </div>
                                    <div className="kt-menu-item">
                                      <button
                                        type="button"
                                        className="kt-menu-link text-start w-full"
                                        onClick={() => { setActiveDropdownId(null); handleOpenWorkflowModal(demande, 'relance'); }}
                                      >
                                        <span className="kt-menu-icon">
                                          <i className="ki-filled ki-arrows-loop text-success"></i>
                                        </span>
                                        <span className="kt-menu-title">{t('returns.relaunchTitle', 'Relancer livraison')}</span>
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

                {/* Footer Pagination */}
                <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium py-4">
                  <div className="flex items-center gap-2 order-2 md:order-1">
                    {t('returns.show', 'Afficher')}
                    <KtSelect
                      value={String(itemsPerPage)}
                      onChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                      className="w-16"
                      options={[
                        { value: '5', label: '5' },
                        { value: '10', label: '10' },
                        { value: '20', label: '20' },
                      ]}
                    />
                    {t('returns.perPage', 'par page')}
                  </div>
                  
                  <div className="flex items-center gap-4 order-1 md:order-2">
                    <span>
                      {t('returns.showing', 'Affichage de')} {totalDemandes === 0 ? 0 : Math.min(totalDemandes, (currentPage - 1) * itemsPerPage + 1)} {t('returns.to', 'à')} {Math.min(totalDemandes, currentPage * itemsPerPage)} {t('returns.of', 'sur')} {totalDemandes} {t('returns.requestsCount', 'demande(s)')}
                    </span>
                    {totalPages > 1 && (
                      <div className="flex gap-1">
                        <button 
                          className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline" 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                          <i className="ki-filled ki-left text-xs"></i>
                        </button>
                        <button 
                          className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline" 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                          <i className="ki-filled ki-right text-xs"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* MODAL: CONTRÔLE QUALITÉ & RELANCE */}
        {isQualityModalOpen && selectedDemande && createPortal(
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
            onClick={() => setIsQualityModalOpen(false)}
          >
            <div
              className="kt-modal-content shadow-2xl rounded-xl border border-border bg-background"
              style={{ width: '50%', maxWidth: '650px', minWidth: '340px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="kt-modal-header">
                <h3 className="kt-modal-title">
                  {qualityForm.action === 'relance' ? t('returns.relaunchDeliveryTitle', 'Relancer la livraison') : t('returns.qualityCheckAndTreatment', 'Contrôle Qualité & Traitement')}
                </h3>
                <button
                  className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost shrink-0"
                  onClick={() => setIsQualityModalOpen(false)}
                  type="button"
                >
                  <i className="ki-filled ki-cross"></i>
                </button>
              </div>

              <div className="kt-modal-body px-5 py-5">
                <form onSubmit={handleUpdateWorkflow} className="flex flex-col gap-4">

                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">{t('returns.returnReasonLabel', 'Raison de retour')}</label>
                    <KtSelect
                      value={qualityForm.reason}
                      onChange={(val) => setQualityForm({ ...qualityForm, reason: val })}
                      className="w-full"
                      options={[
                        { value: 'ABSENT', label: t('returns.reasonAbsentLong', 'Destinataire Absent lors des passages') },
                        { value: 'REFUS', label: t('returns.reasonRefusalLong', 'Refus du destinataire à la livraison') },
                        { value: 'ADRESSE_INCORRECTE', label: t('returns.reasonAddressLong', 'Adresse incorrecte / Numéro injoignable') },
                        { value: 'PRODUIT_DEFECTUEUX', label: t('returns.reasonDefectiveLong', 'Produit défectueux / Non conforme') },
                        { value: 'ANNULATION_CLIENT', label: t('returns.reasonCancelledLong', 'Commande annulée par le client') },
                        { value: 'AUTRE', label: t('returns.reasonOther', 'Autre motif') },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">{t('returns.qualityResultLabel', 'Résultat Contrôle Qualité')}</label>
                    <KtSelect
                      value={qualityForm.quality_status}
                      onChange={(val) => setQualityForm({ ...qualityForm, quality_status: val })}
                      className="w-full"
                      options={[
                        { value: 'CONFORME', label: t('returns.qualityConform', 'Conforme (Remise en stock / Relance)') },
                        { value: 'DEFECTUEUX', label: t('returns.qualityDefective', 'Défectueux / Emballage abîmé (Retour expéditeur)') },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">{t('returns.workflowActionLabel', 'Action du workflow')}</label>
                    <KtSelect
                      value={qualityForm.action}
                      onChange={(val) => setQualityForm({ ...qualityForm, action: val })}
                      className="w-full"
                      options={[
                        { value: 'quality_check', label: t('returns.actionQualityInspection', "Enregistrer l'inspection Qualité") },
                        { value: 'relance', label: t('returns.actionRetryDelivery', 'Re-tenter la livraison (Relance immédiate)') },
                        { value: 'resolve', label: t('returns.actionCloseReturn', 'Marquer le retour comme réceptionné & clôturé') },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">{t('returns.colNote', 'Note & Remarque')}</label>
                    <textarea
                      rows={3}
                      className="kt-input py-2"
                      placeholder={t('returns.notePlaceholder', 'Remarques sur le colis...')}
                      value={qualityForm.note}
                      onChange={(e) => setQualityForm({ ...qualityForm, note: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-2">
                    <button
                      type="button"
                      onClick={() => setIsQualityModalOpen(false)}
                      className="kt-btn kt-btn-outline cursor-pointer"
                    >
                      {t('returns.cancel', 'Annuler')}
                    </button>
                    <button
                      type="submit"
                      className="kt-btn kt-btn-primary cursor-pointer"
                    >
                      {t('returns.validate', 'Valider')}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      </main>
    </DashboardLayout>
  );
}
