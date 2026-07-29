import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

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
                    <select 
                      className="kt-select w-36"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Tous les statuts</option>
                      <option value="enregistre">Enregistré</option>
                      <option value="annule">Annulé</option>
                    </select>
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
                  <div className="kt-scrollable-x-auto">
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
                              <td className="text-center relative">
                                <div className="relative inline-block">
                                  <button 
                                    onClick={() => setOpenDropdownId(openDropdownId === bon.id ? null : bon.id)}
                                    className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                  >
                                    <i className="ki-filled ki-dots-vertical text-lg"></i>
                                  </button>
                                  
                                  {openDropdownId === bon.id && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setOpenDropdownId(null)}
                                      ></div>
                                      <div className="absolute end-0 top-full mt-1 w-[175px] bg-background border border-border rounded-lg shadow-xl z-20 py-1 text-start">
                                        <div className="kt-menu-item">
                                          <a 
                                            className="kt-menu-link flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer"
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
                                            className="kt-menu-link w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-start"
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
                                            className="kt-menu-link w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-start text-destructive"
                                            onClick={() => confirmDelete(bon)}
                                          >
                                            <span className="kt-menu-icon"><i className="ki-filled ki-trash"></i></span>
                                            <span className="kt-menu-title">Supprimer</span>
                                          </button>
                                        </div>
                                      </div>
                                    </>
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
    </DashboardLayout>
  );
}
