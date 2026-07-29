import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function RetourBonsListPage({ navigate, showNotification }) {
  const [bons, setBons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [statutOptions, setStatutOptions] = useState([]);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchBons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedStatut) params.append('statut', selectedStatut);

      const res = await fetch(`/api/retour/bons?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setBons(data.bons || []);
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
      console.error('Erreur chargement bons de retour:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBons();
  }, [searchQuery, selectedStatut]);

  useEffect(() => {
    const handleDocumentClick = () => setActiveDropdownId(null);
    window.addEventListener('click', handleDocumentClick);
    return () => window.removeEventListener('click', handleDocumentClick);
  }, []);

  const totalBons = bons.length;
  const totalPages = Math.ceil(totalBons / itemsPerPage);
  const paginatedBons = bons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="py-4">
          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: i === 0 ? '110px' : i === 5 ? '40px' : '85%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="retour_bons">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Liste des bons de retour</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total bons :</span>
                <span className="text-base text-foreground font-medium">{totalBons}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Header Filters */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">Affichage de {totalBons} bon(s) de retour</h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Référence, code de suivi..."
                        type="text"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={selectedStatut}
                      onChange={(val) => { setSelectedStatut(val); setCurrentPage(1); }}
                      placeholder="Statut"
                      className="w-36"
                      options={statutOptions.length > 0 ? statutOptions : [{ value: '', label: 'Tous les statuts' }]}
                    />

                    <button
                      className="kt-btn kt-btn-outline"
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStatut('');
                        setCurrentPage(1);
                      }}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="kt-card-content">
                <div className="kt-scrollable-x-auto">
                  <table className="kt-table table-auto kt-table-border">
                    <thead>
                      <tr>
                        <th className="min-w-[180px]">Réf</th>
                        <th className="min-w-[160px]">Date de création</th>
                        <th className="min-w-[170px]">Date de réception</th>
                        <th className="min-w-[130px]">Statut</th>
                        <th className="min-w-[220px]">Colis</th>
                        <th className="w-[90px] text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginatedBons.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-secondary-foreground text-center py-8">
                            Aucun bon de retour trouvé.
                          </td>
                        </tr>
                      ) : (
                        paginatedBons.map((bon) => (
                          <tr key={bon.id}>
                            <td className="text-foreground font-medium text-mono">{bon.bonReference}</td>
                            <td className="text-foreground font-normal">{bon.createdAt || '-'}</td>
                            <td className="text-foreground font-normal">{bon.receivedAt || '-'}</td>
                            <td>
                              <span className={`kt-badge ${bon.statusBadgeClass || 'kt-badge-warning'} kt-badge-outline rounded-[30px]`}>
                                <span className="kt-badge-dot size-1.5"></span>
                                {bon.statusLabel}
                              </span>
                            </td>
                            <td>
                              <div className="flex flex-wrap gap-1.5">
                                {bon.colis && bon.colis.length > 0 ? (
                                  bon.colis.map(c => (
                                    <span key={c.id} className="kt-badge kt-badge-primary kt-badge-outline rounded-[30px]">
                                      {c.trackingCode}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-secondary-foreground">-</span>
                                )}
                              </div>
                            </td>
                            <td className="text-center relative">
                              <div className="inline-block text-left">
                                <button
                                  type="button"
                                  className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.right + window.scrollX - 175 });
                                    setActiveDropdownId(activeDropdownId === bon.id ? null : bon.id);
                                  }}
                                >
                                  <i className="ki-filled ki-dots-vertical text-lg"></i>
                                </button>

                                {activeDropdownId === bon.id && dropdownPos && createPortal(
                                  <div
                                    className="kt-menu-dropdown kt-menu-default fixed w-[175px]"
                                    style={{
                                      position: 'fixed',
                                      top: `${dropdownPos.top - window.scrollY}px`,
                                      left: `${dropdownPos.left - window.scrollX}px`,
                                      zIndex: 99999,
                                      display: 'block'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="kt-menu-item">
                                      {bon.hasPdf ? (
                                        <a
                                          href={`/api/retour/bons/${bon.id}/download`}
                                          className="kt-menu-link text-start w-full flex items-center gap-2"
                                          onClick={() => setActiveDropdownId(null)}
                                        >
                                          <span className="kt-menu-icon"><i className="ki-filled ki-file-down"></i></span>
                                          <span className="kt-menu-title">Télécharger</span>
                                        </a>
                                      ) : (
                                        <button className="kt-menu-link text-start w-full opacity-60 cursor-not-allowed" type="button" disabled>
                                          <span className="kt-menu-icon"><i className="ki-filled ki-lock-2"></i></span>
                                          <span className="kt-menu-title text-xs">Non disponible</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>,
                                  document.body
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
                <div className="kt-card-footer justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium">
                  <div className="flex items-center gap-2">
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

                  <div className="flex items-center gap-4">
                    <span>
                      Affichage de {Math.min(totalBons, (currentPage - 1) * itemsPerPage + 1)} à {Math.min(totalBons, currentPage * itemsPerPage)} sur {totalBons} bons
                    </span>
                    {totalPages > 1 && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="kt-btn kt-btn-sm kt-btn-outline px-2"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                          Précédent
                        </button>
                        <span className="px-3 py-1 bg-accent/40 rounded text-foreground font-semibold">{currentPage} / {totalPages}</span>
                        <button
                          type="button"
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
      </main>
    </DashboardLayout>
  );
}
