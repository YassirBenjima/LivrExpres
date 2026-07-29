import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function FacturationCrbtPage({ navigate, showNotification }) {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ totalNet: 0, totalBrut: 0, fraisLivraison: 0, fraisRefus: 0, nbrColis: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statutOptions, setStatutOptions] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchCrbt = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedStatut) params.append('statut', selectedStatut);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const res = await fetch(`/api/facturation/crbt?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        if (data.summary) {
          setSummary(data.summary);
        }
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
      console.error('Erreur chargement CRBT:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrbt();
  }, [searchQuery, selectedStatut, dateFrom, dateTo]);

  const totalEntries = entries.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const paginatedEntries = entries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="py-4">
          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: i === 0 ? '110px' : i === 8 ? '80px' : '85%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="facturation_crbt">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Facturation CRBT</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total relevés :</span>
                <span className="text-base text-foreground font-medium">{totalEntries}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="kt-container-fixed mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Total Net Payé</span>
              <span className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                {summary.totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
              </span>
            </div>
            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Total Brut</span>
              <span className="text-xl font-semibold text-foreground">
                {summary.totalBrut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
              </span>
            </div>
            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Frais de Livraison</span>
              <span className="text-xl font-semibold text-foreground">
                {summary.fraisLivraison.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
              </span>
            </div>
            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Total Colis Relevés</span>
              <span className="text-xl font-semibold text-foreground">
                {summary.nbrColis}
              </span>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Header Filters */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">Affichage de {totalEntries} relevé(s)</h3>
                <div className="flex flex-wrap gap-2 lg:gap-4 items-center">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher par code..."
                        type="text"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="kt-input text-xs"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                    />
                    <span className="text-muted-foreground text-xs">à</span>
                    <input
                      type="date"
                      className="kt-input text-xs"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                    />
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
                        setDateFrom('');
                        setDateTo('');
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
                        <th className="min-w-[140px]">Code Relevé</th>
                        <th className="min-w-[140px]">Date création</th>
                        <th className="min-w-[100px]">Nbr Colis</th>
                        <th className="min-w-[120px]">Total Brut</th>
                        <th className="min-w-[120px]">Frais Livraison</th>
                        <th className="min-w-[100px]">Frais Refus</th>
                        <th className="min-w-[120px]">Total Net</th>
                        <th className="min-w-[130px]">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginatedEntries.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-secondary-foreground text-center py-8">
                            Aucun relevé CRBT trouvé.
                          </td>
                        </tr>
                      ) : (
                        paginatedEntries.map((crbt) => (
                          <tr key={crbt.id}>
                            <td className="text-foreground font-medium text-mono">{crbt.code}</td>
                            <td className="text-foreground font-normal">{crbt.dateCreation || '-'}</td>
                            <td className="text-foreground font-medium">{crbt.nbrColis}</td>
                            <td className="text-foreground font-medium">
                              {crbt.totalBrut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="text-foreground font-medium">
                              {crbt.fraisLivraison.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="text-foreground font-medium">
                              {crbt.fraisRefus.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="text-foreground font-semibold text-emerald-600 dark:text-emerald-400">
                              {crbt.totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td>
                              <span className={`kt-badge ${crbt.statutBadgeClass || 'kt-badge-warning'} kt-badge-outline rounded-[30px]`}>
                                <span className="kt-badge-dot size-1.5"></span>
                                {crbt.statutLabel}
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
                      Affichage de {Math.min(totalEntries, (currentPage - 1) * itemsPerPage + 1)} à {Math.min(totalEntries, currentPage * itemsPerPage)} sur {totalEntries} relevés
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
