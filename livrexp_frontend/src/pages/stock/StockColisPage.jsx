import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function StockColisPage({ showNotification }) {
  const [colisList, setColisList]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedEtat, setSelectedEtat] = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const headers = { 'Accept': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  useEffect(() => {
    setLoading(true);
    fetch('/api/stock/colis', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setColisList(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const etatsPossibles = [...new Set(colisList.map(c => c.etatLabel).filter(Boolean))];

  const filtered = colisList.filter(c => {
    if (selectedEtat && c.etatLabel !== selectedEtat) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return [c.orderNumber, c.trackingCode, c.productNature, c.city, c.address].some(v => v?.toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(7)].map((_, i) => <td key={i}><div className="h-4 bg-muted rounded w-3/4 my-1"></div></td>)}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="stock_colis">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Colis du stock pour ramassage</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total colis:</span>
                <span className="text-base text-foreground font-medium">{colisList.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">Affichage de {filtered.length} colis</h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Rechercher un colis" type="text" />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect value={selectedEtat} onChange={v => { setSelectedEtat(v); setCurrentPage(1); }} placeholder="État"
                      className="w-36"
                      options={[{ value: '', label: 'Tous les états' }, ...etatsPossibles.map(e => ({ value: e, label: e }))]}
                    />
                    <button className="kt-btn kt-btn-outline" onClick={() => { setSearchQuery(''); setSelectedEtat(''); setCurrentPage(1); }}>Réinitialiser</button>
                  </div>
                </div>
              </div>
              <div className="kt-card-content">
                <div className="grid">
                  <div className="kt-scrollable-x-auto">
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                        <tr>
                          <th className="min-w-[150px]"><span className="kt-table-col"><span className="kt-table-col-label">Code de suivi</span></span></th>
                          <th className="min-w-[180px]"><span className="kt-table-col"><span className="kt-table-col-label">Nom du produit</span></span></th>
                          <th className="min-w-[150px]"><span className="kt-table-col"><span className="kt-table-col-label">Date de création</span></span></th>
                          <th className="min-w-[180px]"><span className="kt-table-col"><span className="kt-table-col-label">Adresse</span></span></th>
                          <th className="min-w-[120px]"><span className="kt-table-col"><span className="kt-table-col-label">État</span></span></th>
                          <th className="min-w-[120px]"><span className="kt-table-col"><span className="kt-table-col-label">Ville</span></span></th>
                          <th className="min-w-[120px]"><span className="kt-table-col"><span className="kt-table-col-label">Prix</span></span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading
                          ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                          : paginated.length === 0
                            ? <tr><td colSpan={7} className="text-secondary-foreground text-center py-8">Aucun colis trouvé.</td></tr>
                            : paginated.map(c => (
                              <tr key={c.id}>
                                <td><span className="text-foreground font-medium">{c.trackingCode || '-'}</span></td>
                                <td className="text-foreground font-normal">{c.productNature}</td>
                                <td className="text-foreground font-normal">{c.createdAt}</td>
                                <td className="text-foreground font-normal">{c.address}</td>
                                <td><span className={`kt-badge ${c.etatBadgeClass} kt-badge-outline rounded-[30px]`}><span className="kt-badge-dot size-1.5"></span>{c.etatLabel}</span></td>
                                <td className="text-foreground font-normal">{c.city}</td>
                                <td className="text-foreground font-normal">{c.price?.toFixed(2)} MAD</td>
                              </tr>
                            ))
                        }
                      </tbody>
                    </table>
                  </div>
                  <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium">
                    <div className="flex items-center gap-2 order-2 md:order-1">
                      Afficher
                      <KtSelect value={String(itemsPerPage)} onChange={v => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
                        options={[
                          { value: '10', label: '10' },
                          ...(filtered.length > 10 ? [{ value: '25', label: '25' }] : []),
                          ...(filtered.length > 25 ? [{ value: '50', label: '50' }] : []),
                        ]} className="w-16" />
                      par page
                    </div>
                    <div className="flex items-center gap-4 order-1 md:order-2">
                      <span>{filtered.length === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filtered.length)} sur ${filtered.length}`}</span>
                      <div className="flex gap-1">
                        <button className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><i className="ki-filled ki-left text-xs"></i></button>
                        <button className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><i className="ki-filled ki-right text-xs"></i></button>
                      </div>
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
