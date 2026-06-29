import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function StockProductsPage({ navigate, showNotification }) {
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [cities, setCities]                     = useState([]);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [deleteProduct, setDeleteProduct]       = useState(null);
  const [deleteLoading, setDeleteLoading]       = useState(false);
  const [pickupProduct, setPickupProduct]       = useState(null);
  const [pickupLoading, setPickupLoading]       = useState(false);
  
  const [pickupForm, setPickupForm] = useState({
    city: '',
    neighborhood: '',
    address: '',
    phone: '',
    supplierPhone: '',
    note: '',
    hasLabels: false
  });

  const toggleDropdown = (id) => {
    setActiveDropdownId(prev => prev === id ? null : id);
  };

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

  useEffect(() => {
    fetchProducts();

    fetch('/api/cities')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCities(data);
        } else if (data && Array.isArray(data.cities)) {
          setCities(data.cities);
        }
      })
      .catch(err => console.warn('Could not fetch cities:', err));

    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setPickupForm(prev => ({
          ...prev,
          city: u.city || '',
          address: u.address || '',
          phone: u.phone || ''
        }));
      }
    } catch(e) {}
  }, []);

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!deleteProduct) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/stock/products/${deleteProduct.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        showNotification('success', 'Produit supprimé avec succès.');
        setDeleteProduct(null);
        fetchProducts();
      } else {
        const err = await res.json();
        showNotification('error', err.message || 'Erreur lors de la suppression.');
      }
    } catch (err) {
      showNotification('error', 'Erreur de connexion avec le serveur.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePickupSubmit = async (e) => {
    e.preventDefault();
    if (!pickupProduct) return;
    setPickupLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/stock/products/${pickupProduct.id}/pickup-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          city: pickupForm.city,
          neighborhood: pickupForm.neighborhood,
          address: pickupForm.address,
          phone: pickupForm.phone,
          supplier_phone: pickupForm.supplierPhone,
          note: pickupForm.note,
          has_labels: pickupForm.hasLabels ? '1' : '0'
        })
      });
      if (res.ok) {
        showNotification('success', 'Demande de ramassage enregistrée avec succès.');
        setPickupProduct(null);
        setPickupForm(prev => ({
          ...prev,
          neighborhood: '',
          supplierPhone: '',
          note: '',
          hasLabels: false
        }));
        fetchProducts();
      } else {
        const err = await res.json();
        showNotification('error', err.message || 'Erreur lors de la demande de ramassage.');
      }
    } catch (err) {
      showNotification('error', 'Erreur de connexion avec le serveur.');
    } finally {
      setPickupLoading(false);
    }
  };

  const filtered = products.filter(p =>
    !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalProducts = filtered.length;
  const totalQty      = filtered.reduce((s, p) => s + (p.quantity || 0), 0);

  const SkeletonRow = () => (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i}>
          <div
            style={
              i === 0
                ? {
                    height: '40px',
                    width: '40px',
                    borderRadius: '6px',
                    background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s infinite',
                  }
                : {
                    height: '14px',
                    borderRadius: '6px',
                    background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s infinite',
                    width: i === 3 ? '40px' : i === 2 ? '100px' : i === 5 ? '40px' : '90%',
                  }
            }
          />
        </td>
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
                          <th className="w-[90px] text-center"><span className="kt-table-col"><span className="kt-table-col-label">Actions</span></span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading
                          ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                          : paginated.length === 0
                            ? <tr><td colSpan={6} className="text-secondary-foreground text-center py-8">Aucun produit trouvé.</td></tr>
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
                                  {p.variants && p.variants.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                      {p.variants.map(v => (
                                        <div key={v.id} className="flex items-center gap-1 text-xs">
                                          {v.barcode ? (
                                            <span className="kt-badge kt-badge-outline kt-badge-primary rounded-[30px] py-0.5 px-2">
                                              <span className="kt-badge-dot size-1.5"></span>
                                              {v.barcode}
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : p.barcode ? (
                                    <span className="kt-badge kt-badge-outline kt-badge-primary rounded-[30px]">
                                      <span className="kt-badge-dot size-1.5"></span>
                                      {p.barcode}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td>
                                  {p.variants && p.variants.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                      {p.variants.map(v => (
                                        <div key={v.id} className="flex items-center gap-1 text-xs">
                                          <span className={`kt-badge kt-badge-outline rounded-[30px] py-0.5 px-2 ${v.quantity > 0 ? 'kt-badge-success' : 'kt-badge-warning'}`}>
                                            <span className="kt-badge-dot size-1.5"></span>
                                            {v.quantity}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className={`kt-badge kt-badge-outline rounded-[30px] ${p.quantity > 0 ? 'kt-badge-success' : 'kt-badge-warning'}`}>
                                      <span className="kt-badge-dot size-1.5"></span>
                                      {p.quantity}
                                    </span>
                                  )}
                                </td>
                                <td className="text-foreground font-normal">{p.updated_at || '-'}</td>
                                <td className="text-center relative" style={activeDropdownId === p.id ? { zIndex: 9999 } : {}}>
                                  <div className="relative inline-block text-left">
                                    <button 
                                      className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                      onClick={() => toggleDropdown(p.id)}
                                    >
                                      <i className="ki-filled ki-dots-vertical text-lg"></i>
                                    </button>
                                    
                                    {activeDropdownId === p.id && (
                                      <>
                                        <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)}></div>
                                        <div className="kt-menu-dropdown kt-menu-default absolute right-0 mt-2 w-[175px]" style={{ zIndex: 9999, display: 'block' }}>
                                          <div className="kt-menu-item">
                                            <a href={`/stock/produits/${p.id}/edit`} className="kt-menu-link">
                                              <span className="kt-menu-icon">
                                                <i className="ki-filled ki-pencil"></i>
                                              </span>
                                              <span className="kt-menu-title">Modifier</span>
                                            </a>
                                          </div>
                                          <div className="kt-menu-item">
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                setActiveDropdownId(null);
                                                setDeleteProduct({ id: p.id, name: p.name });
                                              }}
                                              className="kt-menu-link text-start hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-600 dark:hover:!text-red-400"
                                            >
                                              <span className="kt-menu-icon">
                                                <i className="ki-filled ki-trash"></i>
                                              </span>
                                              <span className="kt-menu-title text-destructive">Supprimer</span>
                                            </button>
                                          </div>
                                          
                                          <div className="kt-menu-item">
                                            {p.pickup_requested ? (
                                              <button
                                                type="button"
                                                disabled
                                                className="kt-menu-link text-start opacity-60 cursor-not-allowed"
                                              >
                                                <span className="kt-menu-icon">
                                                  <i className="ki-filled ki-delivery-3"></i>
                                                </span>
                                                <span className="kt-menu-title">Ramassage demandé</span>
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setActiveDropdownId(null);
                                                  setPickupProduct({ id: p.id, name: p.name });
                                                }}
                                                className="kt-menu-link text-start hover:!bg-green-50 dark:hover:!bg-green-950/30 hover:!text-green-600 dark:hover:!text-green-400"
                                              >
                                                <span className="kt-menu-icon">
                                                  <i className="ki-filled ki-delivery-3"></i>
                                                </span>
                                                <span className="kt-menu-title">Ramassage</span>
                                              </button>
                                            )}
                                          </div>
                                          
                                          <div className="kt-menu-separator"></div>
                                          
                                          <div className="kt-menu-item flex flex-col items-stretch">
                                            {p.variants && p.variants.length > 0 ? (
                                              <>
                                                <div className="px-2 py-1 text-xs text-secondary-foreground text-left font-medium">Imprimer sticker</div>
                                                {p.variants.map(v => (
                                                  <a 
                                                    key={v.id}
                                                    href={`/stock/produits/variant/${v.id}/sticker`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="kt-menu-link"
                                                  >
                                                    <span className="kt-menu-icon">
                                                      <i className="ki-filled ki-printer"></i>
                                                    </span>
                                                    <span className="kt-menu-title">
                                                      {v.barcode || v.name || 'Variante'}
                                                    </span>
                                                  </a>
                                                ))}
                                              </>
                                            ) : (
                                              <a 
                                                href={`/stock/produits/${p.id}/sticker`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="kt-menu-link"
                                              >
                                                <span className="kt-menu-icon">
                                                  <i className="ki-filled ki-printer"></i>
                                                </span>
                                                <span className="kt-menu-title">
                                                  Imprimer sticker
                                                </span>
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </td>
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

      {/* Delete Confirmation Modal */}
      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-semibold text-foreground">Supprimer le produit</h3>
              <button 
                onClick={() => setDeleteProduct(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <i className="ki-filled ki-cross text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleDeleteSubmit} className="p-5">
              <p className="text-sm text-secondary-foreground mb-5">
                Vous êtes sur le point de supprimer le produit <span className="font-semibold text-foreground">{deleteProduct.name}</span>. Cette action est irréversible.
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setDeleteProduct(null)} 
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
        </div>
      )}

      {/* Pickup Request Modal */}
      {pickupProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl max-w-lg w-full overflow-hidden my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-semibold text-foreground">Demande de ramassage</h3>
              <button 
                onClick={() => setPickupProduct(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <i className="ki-filled ki-cross text-lg"></i>
              </button>
            </div>
            <form onSubmit={handlePickupSubmit} className="p-5 space-y-4">
              <p className="text-xs text-secondary-foreground">
                Créer une demande de ramassage pour le produit <span className="font-semibold text-foreground">{pickupProduct.name}</span>.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Ville *</label>
                  <KtSelect
                    value={pickupForm.city}
                    onChange={val => setPickupForm(prev => ({ ...prev, city: val }))}
                    options={[
                      { value: '', label: 'Choisir une ville' },
                      ...cities.map(c => ({ value: c, label: c }))
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Quartier *</label>
                  <input
                    type="text"
                    required
                    value={pickupForm.neighborhood}
                    onChange={e => setPickupForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                    placeholder="Nom du quartier"
                    className="kt-input w-full h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Adresse complète *</label>
                <textarea
                  required
                  rows={2}
                  value={pickupForm.address}
                  onChange={e => setPickupForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Adresse exacte de ramassage"
                  className="kt-input w-full p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={pickupForm.phone}
                    onChange={e => setPickupForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Téléphone"
                    className="kt-input w-full h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Téléphone fournisseur (Optionnel)</label>
                  <input
                    type="text"
                    value={pickupForm.supplierPhone}
                    onChange={e => setPickupForm(prev => ({ ...prev, supplierPhone: e.target.value }))}
                    placeholder="Téléphone fournisseur"
                    className="kt-input w-full h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Note (Optionnel)</label>
                <textarea
                  rows={2}
                  value={pickupForm.note}
                  onChange={e => setPickupForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Instructions de ramassage"
                  className="kt-input w-full p-2.5 text-sm"
                />
              </div>

              <div className="flex items-center gap-2.5 py-1">
                <input
                  type="checkbox"
                  id="hasLabels"
                  checked={pickupForm.hasLabels}
                  onChange={e => setPickupForm(prev => ({ ...prev, hasLabels: e.target.checked }))}
                  className="kt-checkbox size-4"
                />
                <label htmlFor="hasLabels" className="text-xs font-medium text-foreground cursor-pointer">
                  J'ai déjà imprimé les étiquettes pour ce colis
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setPickupProduct(null)} 
                  className="kt-btn kt-btn-outline"
                  disabled={pickupLoading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="kt-btn kt-btn-primary"
                  disabled={pickupLoading}
                >
                  {pickupLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
