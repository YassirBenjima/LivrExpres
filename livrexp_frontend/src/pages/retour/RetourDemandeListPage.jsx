import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function RetourDemandeListPage({ navigate, showNotification }) {
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
            { value: '', label: 'Tous les statuts' },
            ...data.statuts_possibles.map(s => ({
              value: s,
              label: data.statut_labels[s] || s
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
        if (showNotification) showNotification('success', data.message || 'Statut du retour mis à jour.');
        setIsQualityModalOpen(false);
        fetchDemandes();
        fetchStats();
      } else {
        if (showNotification) showNotification('error', 'Erreur lors de la mise à jour du retour.');
      }
    } catch (err) {
      console.error(err);
      if (showNotification) showNotification('error', 'Erreur réseau.');
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
        if (showNotification) showNotification('success', data.message || 'Nouvelle tentative de livraison planifiée !');
        fetchDemandes();
        fetchStats();
      } else {
        if (showNotification) showNotification('error', 'Impossible de relancer ce colis.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const reasonOptions = [
    { value: '', label: 'Toutes les raisons' },
    { value: 'ABSENT', label: 'Destinataire Absent' },
    { value: 'REFUS', label: 'Refus à la livraison' },
    { value: 'ADRESSE_INCORRECTE', label: 'Adresse Incorrecte / Injoignable' },
    { value: 'PRODUIT_DEFECTUEUX', label: 'Produit Défectueux' },
    { value: 'ANNULATION_CLIENT', label: 'Commande Annulée' },
    { value: 'AUTRE', label: 'Autre motif' },
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
              <h1 className="text-xl font-medium leading-none text-mono">Demande de retour</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total demandes:</span>
                <span className="text-base text-foreground font-medium">{totalDemandes}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                className="kt-btn kt-btn-primary"
                onClick={() => navigate('/retour/demandes/new')}
              >
                Nouvelle demande
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
                  Affichage de {totalDemandes} demande(s)
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher une demande..."
                        type="text"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={selectedStatut}
                      onChange={(val) => { setSelectedStatut(val); setCurrentPage(1); }}
                      placeholder="Statut"
                      className="w-40"
                      options={statutOptions.length > 0 ? statutOptions : [{ value: '', label: 'Tous les statuts' }]}
                    />

                    <KtSelect
                      value={selectedReason}
                      onChange={(val) => setSelectedReason(val)}
                      placeholder="Raison"
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
                        <th className="min-w-[150px]">Réception colis</th>
                        <th className="min-w-[150px]">Date</th>
                        <th className="min-w-[160px]">Bon de retour</th>
                        <th className="min-w-[220px]">Colis</th>
                        <th className="min-w-[200px]">Note &amp; Remarque</th>
                        <th className="min-w-[130px]">Statut</th>
                        <th className="w-[80px] text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginatedDemandes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-secondary-foreground text-center py-8">
                            Aucune demande de retour trouvée.
                          </td>
                        </tr>
                      ) : (
                        paginatedDemandes.map((demande) => (
                          <tr key={demande.id}>
                            <td className="text-foreground font-medium">{demande.receptionType}</td>
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
                                        title="Relancer livraison"
                                      >
                                        [Relancer]
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
                                {demande.statusLabel}
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
                                        <span className="kt-menu-title">Contrôle Qualité</span>
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
                                        <span className="kt-menu-title">Relancer livraison</span>
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
                    Afficher
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
                    par page
                  </div>
                  
                  <div className="flex items-center gap-4 order-1 md:order-2">
                    <span>
                      Affichage de {Math.min(totalDemandes, (currentPage - 1) * itemsPerPage + 1)} à {Math.min(totalDemandes, currentPage * itemsPerPage)} sur {totalDemandes} demandes
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
                  {qualityForm.action === 'relance' ? 'Relancer la livraison' : 'Contrôle Qualité & Traitement'}
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
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Raison de retour</label>
                    <KtSelect
                      value={qualityForm.reason}
                      onChange={(val) => setQualityForm({ ...qualityForm, reason: val })}
                      className="w-full"
                      options={[
                        { value: 'ABSENT', label: 'Destinataire Absent lors des passages' },
                        { value: 'REFUS', label: 'Refus du destinataire à la livraison' },
                        { value: 'ADRESSE_INCORRECTE', label: 'Adresse incorrecte / Numéro injoignable' },
                        { value: 'PRODUIT_DEFECTUEUX', label: 'Produit défectueux / Non conforme' },
                        { value: 'ANNULATION_CLIENT', label: 'Commande annulée par le client' },
                        { value: 'AUTRE', label: 'Autre motif' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Résultat Contrôle Qualité</label>
                    <KtSelect
                      value={qualityForm.quality_status}
                      onChange={(val) => setQualityForm({ ...qualityForm, quality_status: val })}
                      className="w-full"
                      options={[
                        { value: 'CONFORME', label: 'Conforme (Remise en stock / Relance)' },
                        { value: 'DEFECTUEUX', label: 'Défectueux / Emballage abîmé (Retour expéditeur)' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Action du workflow</label>
                    <KtSelect
                      value={qualityForm.action}
                      onChange={(val) => setQualityForm({ ...qualityForm, action: val })}
                      className="w-full"
                      options={[
                        { value: 'quality_check', label: "Enregistrer l'inspection Qualité" },
                        { value: 'relance', label: 'Re-tenter la livraison (Relance immédiate)' },
                        { value: 'resolve', label: 'Marquer le retour comme réceptionné & clôturé' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Note & Remarques</label>
                    <textarea
                      rows={3}
                      className="kt-input py-2"
                      placeholder="Remarques sur le colis..."
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
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="kt-btn kt-btn-primary cursor-pointer"
                    >
                      Valider
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
