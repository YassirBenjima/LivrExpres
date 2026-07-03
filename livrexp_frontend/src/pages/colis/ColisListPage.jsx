import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';


export default function ColisListPage({ colisList = [], loading = false, refetchData, navigate, showNotification }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEtat, setSelectedEtat] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [deleteColis, setDeleteColis] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
          showNotification('success', 'Colis supprimé avec succès.');
        }
        setDeleteColis(null);
      } else {
        const data = await response.json();
        const msg = data.message || 'Une erreur est survenue lors de la suppression.';
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

  // Filter logic
  const filteredColis = colisList.filter(colis => {
    const matchesSearch = 
      colis.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      colis.productNature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      colis.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      colis.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEtat = selectedEtat ? colis.etatLabel === selectedEtat : true;
    const matchesStatut = selectedStatut ? colis.statutLabel === selectedStatut : true;

    return matchesSearch && matchesEtat && matchesStatut;
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
  const totalPages = Math.ceil(totalColis / perPage);
  const paginatedColis = filteredColis.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Unique lists for filters
  const etatsPossibles = Array.from(new Set(colisList.map(c => c.etatLabel).filter(Boolean)));
  const statutsPossibles = Array.from(new Set(colisList.map(c => c.statutLabel).filter(Boolean)));

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
                Liste des colis
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">
                  Total colis:
                </span>
                <span className="text-base text-foreground font-medium me-2">
                  {totalColis}
                </span>
                <span className="text-base text-secondary-foreground">
                  Montant total:
                </span>
                <span className="text-base text-foreground font-medium">
                  {totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <a className="kt-btn kt-btn-outline" href="/colis/import">
                Importer un fichier Excel
              </a>
              <a className="kt-btn kt-btn-primary" href="/colis/new">
                Ajouter un colis
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
                  Affichage de {filteredColis.length} colis
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
                        placeholder="Rechercher un colis" 
                        type="text" 
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={selectedEtat}
                      onChange={(val) => { setSelectedEtat(val); setCurrentPage(1); }}
                      placeholder="État"
                      className="w-36"
                      options={[
                        { value: '', label: 'Tous les états' },
                        ...etatsPossibles.map(e => ({ value: e, label: e }))
                      ]}
                    />

                    <KtSelect
                      value={selectedStatut}
                      onChange={(val) => { setSelectedStatut(val); setCurrentPage(1); }}
                      placeholder="Statut"
                      className="w-36"
                      options={[
                        { value: '', label: 'Tous les statuts' },
                        ...statutsPossibles.map(s => ({ value: s, label: s }))
                      ]}
                    />

                    <button
                      className="kt-btn kt-btn-outline"
                      onClick={handleResetFilters}
                    >
                      Réinitialiser
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
                                <span className="kt-table-col-label">Code de suivi</span>
                              </span>
                            </th>
                            <th className="min-w-[180px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Nom du produit</span>
                              </span>
                            </th>
                            <th className="min-w-[150px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Date de création</span>
                              </span>
                            </th>
                            <th className="min-w-[180px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Adresse de livraison</span>
                              </span>
                            </th>
                            <th className="min-w-[120px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">État</span>
                              </span>
                            </th>
                            <th className="min-w-[120px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Statut</span>
                              </span>
                            </th>
                            <th className="min-w-[120px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Livreur</span>
                              </span>
                            </th>
                            <th className="min-w-[160px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Date de livraison</span>
                              </span>
                            </th>
                            <th className="min-w-[140px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Ville</span>
                              </span>
                            </th>
                            <th className="min-w-[120px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Prix</span>
                              </span>
                            </th>
                            <th className="min-w-[140px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Réclamation</span>
                              </span>
                            </th>
                            <th className="min-w-[180px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Commentaires</span>
                              </span>
                            </th>
                            <th className="w-[90px] text-center">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Actions</span>
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
                                    {colis.etatLabel}
                                  </span>
                                </td>
                                <td>
                                  <span className={`kt-badge ${colis.statutBadgeClass} kt-badge-outline rounded-[30px]`}>
                                    <span className="kt-badge-dot size-1.5"></span>
                                    {colis.statutLabel}
                                  </span>
                                </td>
                                <td className="text-foreground font-normal">-</td>
                                <td className="text-foreground font-normal">-</td>
                                <td className="text-foreground font-normal">{colis.city}</td>
                                <td className="text-foreground font-medium">
                                  {colis.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                                </td>
                                <td className="text-foreground font-normal">Non</td>
                                <td className="text-foreground font-normal">{colis.comment || '-'}</td>
                                 <td className="text-center relative" style={activeDropdownId === colis.id ? { zIndex: 9999 } : {}}>
                                   <div className="relative inline-block text-left">
                                     <button 
                                       className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                       onClick={() => toggleDropdown(colis.id)}
                                     >
                                       <i className="ki-filled ki-dots-vertical text-lg"></i>
                                     </button>
                                     
                                     {activeDropdownId === colis.id && (
                                       <div className="kt-menu-dropdown kt-menu-default absolute right-0 mt-2 w-[175px]" style={{ zIndex: 9999, display: 'block' }}>
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
                                             <span className="kt-menu-title">Modifier</span>
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
                                             <span className="kt-menu-title text-destructive">Supprimer</span>
                                           </button>
                                         </div>
                                       </div>
                                     )}
                                   </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={13} className="py-8 text-center text-secondary-foreground">
                                Aucun colis correspondant
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium py-4">
                      <div className="flex items-center gap-2 order-2 md:order-1">
                        Afficher
                        <KtSelect
                          value={String(perPage)}
                          onChange={(val) => { setPerPage(Number(val)); setCurrentPage(1); }}
                          className="w-16"
                          options={perPageOptions}
                        />
                        par page
                      </div>
                      
                      <div className="flex items-center gap-4 order-1 md:order-2">
                        <span>
                          Affichage de {Math.min(totalColis, (currentPage - 1) * perPage + 1)} à {Math.min(totalColis, currentPage * perPage)} sur {totalColis} colis
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
              <h3 className="text-base font-semibold text-foreground">Supprimer le colis</h3>
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
                  Vous êtes sur le point de supprimer le colis <strong className="font-semibold text-foreground">{deleteColis.trackingCode}</strong>. Cette action est irréversible et supprimera définitivement le colis de la base de données.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setDeleteColis(null)} 
                  className="kt-btn kt-btn-outline"
                  disabled={deleteLoading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="kt-btn kt-btn-destructive"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Suppression...' : 'Supprimer'}
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
