import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

const STATUS_MAP = { draft: 'Brouillon', pending: 'En attente', in_progress: 'En cours', done: 'Terminé', cancelled: 'Annulé' };
const STATUS_BADGE = { done: 'kt-badge-success', in_progress: 'kt-badge-primary', pending: 'kt-badge-info', cancelled: 'kt-badge-destructive', draft: 'kt-badge-warning' };

export default function StockEntryPage({ showNotification }) {
  const [movements, setMovements]       = useState([]);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty]                         = useState('');
  const [saving, setSaving]                   = useState(false);

  const headers = { 'Accept': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([
        fetch('/api/stock/entry', { headers }),
        fetch('/api/stock/products', { headers }),
      ]);
      if (mRes.ok) { const j = await mRes.json(); setMovements(j.movements || []); }
      if (pRes.ok) { const j = await pRes.json(); setProducts(j.products || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered   = movements.filter(m => !searchQuery || m.reference?.toLowerCase().includes(searchQuery.toLowerCase()) || m.products_summary?.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSave = async () => {
    if (!selectedProduct || !qty || parseInt(qty) <= 0) {
      if (showNotification) showNotification('error', 'Sélectionnez un produit et une quantité valide.');
      return;
    }
    const product = products.find(p => String(p.id) === String(selectedProduct));
    if (!product) { if (showNotification) showNotification('error', 'Produit introuvable.'); return; }

    // Use first variant if available, otherwise product id
    const variantId = product.variants?.[0]?.id ?? `p_${product.id}`;

    setSaving(true);
    try {
      const res = await fetch('/api/stock/entry', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants: { [variantId]: parseInt(qty) } }),
      });
      if (res.ok) {
        if (showNotification) showNotification('success', 'Mouvement de stock enregistré avec succès.');
        setSelectedProduct(''); setQty('');
        fetchData();
      } else {
        const data = await res.json();
        if (showNotification) showNotification('error', data.message || 'Erreur.');
      }
    } catch { if (showNotification) showNotification('error', 'Erreur réseau.'); }
    finally { setSaving(false); }
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(6)].map((_, i) => <td key={i}><div className="h-4 bg-muted rounded w-3/4 my-1"></div></td>)}
    </tr>
  );

  const productOptions = products.map(p => ({ value: String(p.id), label: p.name }));

  return (
    <DashboardLayout activeMenu="stock_entry">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Stock Entrée</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total mouvements:</span>
                <span className="text-base text-foreground font-medium">{movements.length}</span>
              </div>
            </div>
            <button className="kt-btn kt-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            {/* Entry form card */}
            <div className="kt-card kt-card-grid min-w-full">
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">Saisie d'entrée de stock</h3>
                <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
                  <KtSelect
                    value={selectedProduct}
                    onChange={setSelectedProduct}
                    placeholder="Sélectionner un produit"
                    options={productOptions}
                    className="w-64"
                    enableSearch={true}
                    searchPlaceholder="Rechercher un produit..."
                  />
                  <input
                    type="number" min="1"
                    className="kt-input h-9 text-sm w-32"
                    placeholder="Quantité"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                  />
                </div>
              </div>
              {selectedProduct && (
                <div className="kt-card-content">
                  {(() => {
                    const p = products.find(p => String(p.id) === String(selectedProduct));
                    if (!p) return null;
                    return (
                      <div className="flex items-center gap-3 border border-border rounded-xl p-3">
                        {p.photo_url
                          ? <img src={p.photo_url} alt={p.name} className="size-10 rounded-md object-cover shrink-0" />
                          : <div className="size-10 rounded-md bg-muted/40 flex items-center justify-center shrink-0"><i className="ki-filled ki-picture text-muted-foreground"></i></div>
                        }
                        <div>
                          <div className="text-sm font-semibold">{p.name}</div>
                          <div className="text-xs text-secondary-foreground">Stock actuel: {p.quantity}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Movements table */}
            <div className="kt-card kt-card-grid min-w-full">
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">Affichage de {filtered.length} mouvement(s)</h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Rechercher" type="text" />
                    </label>
                  </div>
                  <button className="kt-btn kt-btn-outline" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>Réinitialiser</button>
                </div>
              </div>
              <div className="kt-card-content">
                <div className="grid">
                  <div className="kt-scrollable-x-auto">
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                        <tr>
                          <th className="min-w-[180px]"><span className="kt-table-col"><span className="kt-table-col-label">Réf</span></span></th>
                          <th className="min-w-[260px]"><span className="kt-table-col"><span className="kt-table-col-label">Produits</span></span></th>
                          <th className="min-w-[180px]"><span className="kt-table-col"><span className="kt-table-col-label">Date de création</span></span></th>
                          <th className="min-w-[180px]"><span className="kt-table-col"><span className="kt-table-col-label">Dernière MAJ</span></span></th>
                          <th className="min-w-[140px]"><span className="kt-table-col"><span className="kt-table-col-label">Statut</span></span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading
                          ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                          : paginated.length === 0
                            ? <tr><td colSpan={5} className="text-secondary-foreground text-center py-8">Aucun mouvement trouvé.</td></tr>
                            : paginated.map(m => (
                              <tr key={m.id}>
                                <td className="text-foreground font-medium">{m.reference || '-'}</td>
                                <td>
                                  <div className="flex flex-col gap-1">
                                    <div className="text-foreground font-normal">{m.products_summary || '-'}</div>
                                    <div className="text-xs text-secondary-foreground">{m.products_count || 0} produit(s)</div>
                                  </div>
                                </td>
                                <td className="text-foreground font-normal">{m.created_at || '-'}</td>
                                <td className="text-foreground font-normal">{m.updated_at || '-'}</td>
                                <td>
                                  <span className={`kt-badge ${STATUS_BADGE[m.status] || 'kt-badge-warning'} kt-badge-outline rounded-[30px]`}>
                                    <span className="kt-badge-dot size-1.5"></span>
                                    {STATUS_MAP[m.status] || m.status}
                                  </span>
                                </td>
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
