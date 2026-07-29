import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function RetourDemandeListPage({ navigate, showNotification }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [statutOptions, setStatutOptions] = useState([]);

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

  useEffect(() => {
    fetchDemandes();
  }, [searchQuery, selectedStatut]);

  const totalDemandes = demandes.length;
  const totalPages = Math.ceil(totalDemandes / itemsPerPage);
  const paginatedDemandes = demandes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
              width: i === 0 ? '100px' : i === 3 ? '140px' : '80%',
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
                <span className="text-base text-secondary-foreground">Total demandes :</span>
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

        {/* Content Card */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Header Filters */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">Affichage de {totalDemandes} demande(s)</h3>
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
                        <th className="min-w-[150px]">Réception colis</th>
                        <th className="min-w-[150px]">Date</th>
                        <th className="min-w-[160px]">Bon de retour</th>
                        <th className="min-w-[220px]">Colis</th>
                        <th className="min-w-[200px]">Note &amp; Remarque</th>
                        <th className="min-w-[130px]">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginatedDemandes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-secondary-foreground text-center py-8">
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
                                    <span key={c.id} className="kt-badge kt-badge-primary kt-badge-outline rounded-[30px]">
                                      {c.trackingCode}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-secondary-foreground">-</span>
                                )}
                              </div>
                            </td>
                            <td className="text-foreground font-normal">{demande.note}</td>
                            <td>
                              <span className={`kt-badge ${demande.statusBadgeClass || 'kt-badge-warning'} kt-badge-outline rounded-[30px]`}>
                                <span className="kt-badge-dot size-1.5"></span>
                                {demande.statusLabel}
                              </span>
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
                      Affichage de {Math.min(totalDemandes, (currentPage - 1) * itemsPerPage + 1)} à {Math.min(totalDemandes, currentPage * itemsPerPage)} sur {totalDemandes} demandes
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
      </main>
    </DashboardLayout>
  );
}
