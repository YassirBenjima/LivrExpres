import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

const mockPickupColis = [
  { id: 10, trackingCode: 'F-20260623-0010', productNature: 'Montre Homme', createdAt: '23/06/2026 11:45', address: 'Bvd Zero, N 5', etatLabel: 'En attente', etatBadgeClass: 'kt-badge-warning', statutLabel: 'Nouveau', statutBadgeClass: 'kt-badge-primary', city: 'Casablanca', price: 890.00, comment: '-' },
  { id: 11, trackingCode: 'F-20260623-0011', productNature: 'Sac à dos sport', createdAt: '23/06/2026 11:50', address: 'Gare Rabat Ville', etatLabel: 'En attente', etatBadgeClass: 'kt-badge-warning', statutLabel: 'Nouveau', statutBadgeClass: 'kt-badge-primary', city: 'Rabat', price: 320.00, comment: 'Livrer après 17h' }
];

export default function ColisPickupPage() {
  const [colisList, setColisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      setSelectedIds(filteredColis.map(c => c.id));
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
        setSuccessMsg('Demande de ramassage envoyée avec succès pour les colis sélectionnés !');
        // Remove from list
        setColisList(prev => prev.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
      } else {
        setSuccessMsg('Demande de ramassage (Simulée) envoyée avec succès !');
        setColisList(prev => prev.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
      }
    } catch (err) {
      setSuccessMsg('Demande de ramassage (Simulée) envoyée avec succès !');
      setColisList(prev => prev.filter(c => !selectedIds.includes(c.id)));
      setSelectedIds([]);
    }
  };

  const filteredColis = colisList.filter(colis => 
    colis.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    colis.productNature.toLowerCase().includes(searchQuery.toLowerCase()) ||
    colis.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalColis = filteredColis.length;
  const totalMontant = filteredColis.reduce((sum, item) => sum + item.price, 0);

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
          {successMsg && (
            <div className="bg-success/15 border border-success/30 text-success text-sm rounded-xl p-4 mb-5 flex items-center gap-3">
              <i className="ki-filled ki-check-circle text-lg"></i>
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Header with Search */}
              <div className="kt-card-header flex-wrap gap-4 py-5">
                <h3 className="kt-card-title text-sm">
                  Affichage de {filteredColis.length} colis
                </h3>
                <div className="kt-input max-w-64">
                  <i className="ki-filled ki-magnifier"></i>
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un colis..." 
                    type="text" 
                  />
                </div>
              </div>

              {/* Table */}
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
                            <th className="w-[50px]">
                              <input 
                                className="kt-checkbox kt-checkbox-sm" 
                                type="checkbox" 
                                onChange={handleSelectAll}
                                checked={filteredColis.length > 0 && selectedIds.length === filteredColis.length}
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
                          {filteredColis.length > 0 ? (
                            filteredColis.map((colis) => (
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
