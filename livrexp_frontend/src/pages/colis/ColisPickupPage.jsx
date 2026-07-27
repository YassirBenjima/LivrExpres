import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

const mockPickupColis = [
  { id: 10, trackingCode: 'F-20260623-0010', productNature: 'Montre Homme', createdAt: '23/06/2026 11:45', address: 'Bvd Zero, N 5', etatLabel: 'En attente', etatBadgeClass: 'kt-badge-warning', statutLabel: 'Nouveau', statutBadgeClass: 'kt-badge-primary', city: 'Casablanca', price: 890.00, comment: '-' },
  { id: 11, trackingCode: 'F-20260623-0011', productNature: 'Sac à dos sport', createdAt: '23/06/2026 11:50', address: 'Gare Rabat Ville', etatLabel: 'En attente', etatBadgeClass: 'kt-badge-warning', statutLabel: 'Nouveau', statutBadgeClass: 'kt-badge-primary', city: 'Rabat', price: 320.00, comment: 'Livrer après 17h' }
];

export default function ColisPickupPage({ navigate, showNotification }) {
  const [colisList, setColisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEtat, setSelectedEtat] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  
  useEffect(() => {
    const fetchColis = async () => {
      try {
        const response = await fetch('/api/colis/pickup', {
          headers: {
            'Accept': 'application/json'
          }
        });
        if (response.ok) {
          const json = await response.json();
          setColisList(json.colis_list || json);
        } else {
          setColisList(mockPickupColis);
        }
      } catch (err) {
        setColisList(mockPickupColis);
      } finally {
        setLoading(false);
      }
    };
    fetchColis();
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedColis.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleBulkPickupRequest = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    try {
      const response = await fetch('/api/colis/request-pickup-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (response.ok) {
        const msgText = 'Demande de ramassage envoyée avec succès pour les colis sélectionnés !';
        if (showNotification) {
          showNotification('success', msgText);
        } else {
          setSuccessMsg(msgText);
        }
        // Remove from list
        setColisList(prev => prev.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
      } else {
        const demoMsg = 'Demande de ramassage (Simulée) envoyée avec succès !';
        if (showNotification) {
          showNotification('success', demoMsg);
        } else {
          setSuccessMsg(demoMsg);
        }
        setColisList(prev => prev.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
      }
    } catch (err) {
      const demoMsg = 'Demande de ramassage (Simulée) envoyée avec succès !';
      if (showNotification) {
        showNotification('success', demoMsg);
      } else {
        setSuccessMsg(demoMsg);
      }
      setColisList(prev => prev.filter(c => !selectedIds.includes(c.id)));
      setSelectedIds([]);
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
  }, [totalColis, perPage]);

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

  return (
    <DashboardLayout activeMenu="colis_pickup">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Header container */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                Liste colis en attente de ramassage
              </h1>
              <div className="flex items-center flex-wrap gap-3 font-medium text-sm">
                <span className="text-secondary-foreground">
                  Total colis: <span className="text-foreground font-semibold">{totalColis}</span>
                </span>
                <span className="text-secondary-foreground border-s border-input ps-3">
                  Montant total: <span className="text-foreground font-semibold">{totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                className="kt-btn kt-btn-outline kt-btn-primary" 
                onClick={handleBulkPickupRequest}
                disabled={selectedIds.length === 0}
              >
                Demander un ramassage ({selectedIds.length})
              </button>
              <a className="kt-btn kt-btn-primary" href="/colis/new">
                Ajouter un colis
              </a>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="kt-container-fixed">
          {!showNotification && successMsg && (
            <div className="bg-success/15 border border-success/30 text-success text-sm rounded-xl p-4 mb-5 flex items-center gap-3">
              <i className="ki-filled ki-check-circle text-lg"></i>
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Header with Search and Filters */}
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
                      enableSearch={true}
                      searchPlaceholder="Rechercher un état..."
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
                      enableSearch={true}
                      searchPlaceholder="Rechercher un statut..."
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

              {/* Table */}
              <div className="kt-card-content">
                <div className="grid">
                  <div className="kt-scrollable-x-auto">
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                        <tr>
                          <th className="w-[50px]">
                            <input 
                              className="kt-checkbox kt-checkbox-sm" 
                              type="checkbox" 
                              onChange={handleSelectAll}
                              checked={paginatedColis.length > 0 && selectedIds.length === paginatedColis.length}
                            />
                          </th>
                          <th className="w-[150px]">Code de suivi</th>
                          <th className="w-[180px]">Nom du produit</th>
                          <th className="w-[150px]">Date de création</th>
                          <th className="w-[180px]">Adresse de livraison</th>
                          <th className="w-[130px]">État</th>
                          <th className="w-[130px]">Statut</th>
                          <th className="w-[140px]">Ville</th>
                          <th className="w-[120px]">Prix</th>
                          <th className="w-[185px]">Commentaires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          // Skeleton shimmer rows
                          Array.from({ length: 8 }).map((_, i) => (
                            <tr key={`skel-${i}`}>
                              {Array.from({ length: 10 }).map((_, j) => (
                                <td key={j}>
                                  <div
                                    style={{
                                      height: '14px',
                                      borderRadius: '6px',
                                      background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
                                      backgroundSize: '200% 100%',
                                      animation: 'shimmer 1.4s infinite',
                                      width: j === 0 ? '20px' : j === 1 ? '90px' : j === 5 || j === 6 ? '70px' : '100%',
                                    }}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : paginatedColis.length > 0 ? (
                          paginatedColis.map((colis) => (
                            <tr key={colis.id}>
                              <td>
                                <input 
                                  className="kt-checkbox kt-checkbox-sm" 
                                  type="checkbox" 
                                  checked={selectedIds.includes(colis.id)}
                                  onChange={() => handleSelectRow(colis.id)}
                                />
                              </td>
                              <td className="text-foreground font-medium text-mono">{colis.trackingCode}</td>
                              <td className="text-foreground font-normal">{colis.productNature}</td>
                              <td className="text-secondary-foreground font-normal text-sm">{colis.createdAt}</td>
                              <td className="text-foreground font-normal text-sm">{colis.address}</td>
                              <td>
                                <span className={`kt-badge ${colis.etatBadgeClass} kt-badge-outline rounded-[30px] px-2 py-0.5`}>
                                  {colis.etatLabel}
                                </span>
                              </td>
                              <td>
                                <span className={`kt-badge ${colis.statutBadgeClass} kt-badge-outline rounded-[30px] px-2 py-0.5`}>
                                  {colis.statutLabel}
                                </span>
                              </td>
                              <td className="text-foreground font-normal">{colis.city}</td>
                              <td className="text-foreground font-medium">
                                {colis.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                              </td>
                              <td className="text-secondary-foreground font-normal text-sm">{colis.comment}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-secondary-foreground">
                              Aucun colis en attente de ramassage
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
    </DashboardLayout>
  );
}
