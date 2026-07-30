import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function BonLivraisonListPage({ navigate, showNotification }) {
  const [bons, setBons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
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
          showNotification('success', data.message || 'Code OTP validé ! Le colis a été marqué comme Livré.');
        }
        setOtpModalOpen(false);
        setOtpTrackingCode('');
        setOtpInput('');
        fetchBons();
      } else {
        setOtpError(data.message || 'Code OTP invalide. Veuillez vérifier auprès du client.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('Erreur de communication avec le serveur.');
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
    const handleDocumentClick = (e) => {
      if (openDropdownId !== null && !e.target.closest('.kt-menu-toggle')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [openDropdownId]);

  const confirmDelete = (bon) => {
    setBonToDelete(bon);
    setDeleteModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleDelete = async () => {
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
        showNotification?.('success', 'Bon de livraison supprimé avec succès.');
        setDeleteModalOpen(false);
        setBonToDelete(null);
        fetchBons();
      } else {
        const errData = await res.json();
        showNotification?.('error', errData.message || 'Erreur lors de la suppression.');
      }
    } catch (err) {
      showNotification?.('error', 'Erreur serveur.');
    } finally {
      setDeleting(false);
    }
  };

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
                Liste bons de livraison
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total bons :</span>
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
                Valider OTP WhatsApp
              </button>
              <button 
                onClick={() => navigate('/bon-livraison/new')}
                className="kt-btn kt-btn-primary"
              >
                Ajouter Bon de Livraison
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
                  Affichage de {bons.length} bon(s) de livraison
                </h3>
                <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input 
                        placeholder="Référence, code de suivi..." 
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
                      placeholder="Statut"
                      className="w-36"
                      options={[
                        { value: '', label: 'Tous les statuts' },
                        { value: 'enregistre', label: 'Enregistré' },
                        { value: 'annule', label: 'Annulé' }
                      ]}
                    />
                    <button className="kt-btn kt-btn-outline kt-btn-primary" type="submit">
                      <i className="ki-filled ki-setting-4"></i>
                      Filtrer
                    </button>
                    <button 
                      className="kt-btn kt-btn-outline" 
                      type="button"
                      onClick={handleReset}
                    >
                      Réinitialiser
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
                              <span className="kt-table-col-label">Réf</span>
                            </span>
                          </th>
                          <th className="min-w-[160px]">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">Date de création</span>
                            </span>
                          </th>
                          <th className="min-w-[170px]">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">Date d'enregistrement</span>
                            </span>
                          </th>
                          <th className="min-w-[130px]">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">Statut</span>
                            </span>
                          </th>
                          <th className="min-w-[220px]">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">Colis</span>
                            </span>
                          </th>
                          <th className="min-w-[160px] text-center">
                            <span className="kt-table-col">
                              <span className="kt-table-col-label">Action</span>
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                        ) : bons.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-secondary-foreground text-center py-8">
                              Aucun bon de livraison trouvé.
                            </td>
                          </tr>
                        ) : (
                          bons.map((bon) => (
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
                                  {bon.statusLabel}
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
                                    className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                    onClick={() => toggleDropdown(bon.id)}
                                  >
                                    <i className="ki-filled ki-dots-vertical text-lg"></i>
                                  </button>
                                  
                                  {openDropdownId === bon.id && (
                                    <div className="kt-menu-dropdown kt-menu-default absolute right-0 mt-2 w-[175px]" style={{ zIndex: 9999, display: 'block' }}>
                                      <div className="kt-menu-item">
                                        <a 
                                          className="kt-menu-link text-start w-full"
                                          href={`/api/bon-livraison/${bon.id}/download`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <span className="kt-menu-icon"><i className="ki-filled ki-file-down"></i></span>
                                          <span className="kt-menu-title">Télécharger</span>
                                        </a>
                                      </div>
                                      <div className="kt-menu-item">
                                        <button 
                                          type="button"
                                          className="kt-menu-link text-start w-full"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            navigate(`/bon-livraison/${bon.id}/edit`);
                                          }}
                                        >
                                          <span className="kt-menu-icon"><i className="ki-filled ki-pencil"></i></span>
                                          <span className="kt-menu-title">Modifier</span>
                                        </button>
                                      </div>
                                      <div className="kt-menu-item">
                                        <button 
                                          type="button"
                                          className="kt-menu-link text-start w-full text-destructive hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-600 dark:hover:!text-red-400"
                                          onClick={() => confirmDelete(bon)}
                                        >
                                          <span className="kt-menu-icon text-destructive"><i className="ki-filled ki-trash"></i></span>
                                          <span className="kt-menu-title text-destructive">Supprimer</span>
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

                  <div className="kt-card-footer justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium">
                    <div className="flex items-center gap-2">
                      Affichage de {bons.length} élément(s)
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border border-border shadow-2xl max-w-md w-full p-6 m-4">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Supprimer le bon de livraison</h3>
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
              >
                <i className="ki-filled ki-cross text-lg"></i>
              </button>
            </div>
            <div className="py-4">
              <p className="text-sm text-secondary-foreground">
                Vous êtes sur le point de supprimer le bon <span className="font-semibold text-foreground">{bonToDelete?.reference}</span>.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button 
                className="kt-btn kt-btn-outline" 
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button 
                className="kt-btn kt-btn-destructive" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Validation Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl overflow-hidden w-full max-w-md animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-border bg-emerald-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
                  <i className="ki-filled ki-shield-check"></i>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Validation OTP Livraison
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sécurisez la remise du colis au destinataire
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setOtpModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                disabled={otpLoading}
              >
                <i className="ki-filled ki-cross text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="p-5 space-y-4">
              {otpError && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2">
                  <i className="ki-filled ki-information-2 text-base shrink-0"></i>
                  <span>{otpError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Numéro de suivi / N° de commande
                </label>
                <input
                  type="text"
                  className="kt-input h-10 text-sm font-medium w-full"
                  placeholder="Ex: CMD-2026-965196"
                  required
                  value={otpTrackingCode}
                  onChange={(e) => setOtpTrackingCode(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Code de sécurité (4 chiffres)
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <i className="ki-filled ki-message-text text-xs"></i> Envoyé via WhatsApp
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  className="kt-input h-12 text-2xl font-mono font-bold text-center tracking-[0.5em] w-full border-2 border-emerald-500/30 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-lg placeholder:tracking-[0.5em] placeholder:text-muted-foreground/40"
                  placeholder="••••"
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed bg-muted/50 p-2.5 rounded-lg border border-border/50">
                  💡 Demandez au client le code à 4 chiffres qu'il a reçu sur son téléphone par notification WhatsApp.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setOtpModalOpen(false)} 
                  className="kt-btn kt-btn-outline h-9 px-4 text-xs"
                  disabled={otpLoading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="kt-btn h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all flex items-center gap-1.5"
                  disabled={otpLoading}
                >
                  <i className="ki-filled ki-check-circle text-sm"></i>
                  {otpLoading ? 'Vérification en cours...' : 'Valider la livraison'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
