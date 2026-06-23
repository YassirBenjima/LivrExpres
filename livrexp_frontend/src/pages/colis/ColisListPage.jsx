import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';


export default function ColisListPage() {
  const [colisList, setColisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEtat, setSelectedEtat] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  useEffect(() => {
    const fetchColis = async () => {
      try {
        const response = await fetch('/api/colis', {
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          const json = await response.json();
          setColisList(Array.isArray(json) ? json : (json.colis_list || []));
        }
      } catch (err) {
        console.error('Erreur lors du chargement des colis:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchColis();
  }, []);

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
                    <select 
                      className="kt-select w-36" 
                      value={selectedEtat}
                      onChange={(e) => {
                        setSelectedEtat(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tous les états</option>
                      {etatsPossibles.map(etat => (
                        <option key={etat} value={etat}>{etat}</option>
                      ))}
                    </select>

                    <select 
                      className="kt-select w-36"
                      value={selectedStatut}
                      onChange={(e) => {
                        setSelectedStatut(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tous les statuts</option>
                      {statutsPossibles.map(statut => (
                        <option key={statut} value={statut}>{statut}</option>
                      ))}
                    </select>

                    <button 
                      className="kt-btn kt-btn-outline kt-btn-primary"
                      onClick={handleResetFilters}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Content & Table */}
              <div className="kt-card-content">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-sm text-secondary-foreground font-medium">Chargement des colis...</span>
                  </div>
                ) : (
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
                          {paginatedColis.length > 0 ? (
                            paginatedColis.map((colis) => (
                              <tr key={colis.id}>
                                <td className="text-foreground font-medium">{colis.trackingCode}</td>
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
                                <td className="text-center relative">
                                  <button 
                                    className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                    onClick={() => toggleDropdown(colis.id)}
                                  >
                                    <i className="ki-filled ki-dots-vertical text-lg"></i>
                                  </button>
                                  
                                  {activeDropdownId === colis.id && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)}></div>
                                      <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-lg shadow-lg z-40 py-1 text-left">
                                        <a href={`/colis/${colis.id}/edit`} className="flex items-center gap-2 px-3.5 py-2 text-xs text-foreground hover:bg-accent">
                                          <i className="ki-filled ki-pencil text-sm"></i> Modifier
                                        </a>
                                        <button 
                                          onClick={() => alert(`Supprimer colis ${colis.trackingCode}`)}
                                          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-destructive hover:bg-accent text-left"
                                        >
                                          <i className="ki-filled ki-trash text-sm"></i> Supprimer
                                        </button>
                                      </div>
                                    </>
                                  )}
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
                        <select 
                          className="kt-select w-16" 
                          value={perPage}
                          onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="20">20</option>
                          <option value="50">50</option>
                        </select>
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
                )}
              </div>

            </div>
          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
