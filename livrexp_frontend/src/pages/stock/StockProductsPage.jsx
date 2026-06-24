import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function StockProductsPage({ navigate, showNotification }) {
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/stock/products', {
        headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const json = await res.json();
        setProducts(json.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter(p =>
    !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalProducts = filtered.length;
  const totalQty      = filtered.reduce((s, p) => s + (p.quantity || 0), 0);

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <td key={i}><div className="h-4 bg-muted rounded w-3/4 my-1"></div></td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="stock_products">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Liste des produits</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total produits:</span>
                <span className="text-base text-foreground font-medium me-2">{totalProducts}</span>
                <span className="text-base text-secondary-foreground">Quantité totale:</span>
                <span className="text-base text-foreground font-medium">{totalQty}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="kt-btn kt-btn-primary" onClick={() => navigate('/stock/produits/new')}>
                Ajouter un produit
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">Affichage de {filtered.length} produit(s)</h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher un produit"
                        type="text"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button className="kt-btn kt-btn-outline" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              <div className="kt-card-content">
                <div className="grid">
                  <div className="kt-scrollable-x-auto">
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                        <tr>
                          <th className="min-w-[90px]"><span className="kt-table-col"><span className="kt-table-col-label">Photo</span></span></th>
                          <th className="min-w-[220px]"><span className="kt-table-col"><span className="kt-table-col-label">Nom</span></span></th>
                          <th className="min-w-[160px]"><span className="kt-table-col"><span className="kt-table-col-label">Code-barres</span></span></th>
                          <th className="min-w-[120px]"><span className="kt-table-col"><span className="kt-table-col-label">Quantité</span></span></th>
                          <th className="min-w-[160px]"><span className="kt-table-col"><span className="kt-table-col-label">Dernière mise à jour</span></span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading
                          ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                          : paginated.length === 0
                            ? <tr><td colSpan={5} className="text-secondary-foreground text-center py-8">Aucun produit trouvé.</td></tr>
                            : paginated.map(p => (
                              <tr key={p.id}>
                                <td>
                                  {p.photo_url
                                    ? <img src={p.photo_url} alt={p.name} className="size-10 rounded-md object-cover" />
                                    : <div className="size-10 rounded-md bg-muted/40 flex items-center justify-center"><i className="ki-filled ki-picture text-muted-foreground"></i></div>
                                  }
                                </td>
                                <td>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-foreground font-medium">{p.name}</span>
                                    {p.note && <span className="text-xs text-secondary-foreground">{p.note}</span>}
                                  </div>
                                </td>
                                <td>
                                  {p.barcode ? (
                                    <span className="kt-badge kt-badge-outline kt-badge-primary rounded-[30px]">
                                      <span className="kt-badge-dot size-1.5"></span>
                                      {p.barcode}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td>
                                  <span className={`kt-badge kt-badge-outline rounded-[30px] ${p.quantity > 0 ? 'kt-badge-success' : 'kt-badge-warning'}`}>
                                    <span className="kt-badge-dot size-1.5"></span>
                                    {p.quantity}
                                  </span>
                                </td>
                                <td className="text-foreground font-normal">{p.updated_at || '-'}</td>
                              </tr>
                            ))
                        }
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium">
                    <div className="flex items-center gap-2 order-2 md:order-1">
                      Afficher
                      <KtSelect
                        value={String(itemsPerPage)}
                        onChange={v => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
                        options={[
                          { value: '10', label: '10' },
                          ...(filtered.length > 10 ? [{ value: '25', label: '25' }] : []),
                          ...(filtered.length > 25 ? [{ value: '50', label: '50' }] : []),
                        ]}
                        className="w-16"
                      />
                      par page
                    </div>
                    <div className="flex items-center gap-4 order-1 md:order-2">
                      <span>{filtered.length === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filtered.length)} sur ${filtered.length}`}</span>
                      <div className="flex gap-1">
                        <button className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                          <i className="ki-filled ki-left text-xs"></i>
                        </button>
                        <button className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                          <i className="ki-filled ki-right text-xs"></i>
                        </button>
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
