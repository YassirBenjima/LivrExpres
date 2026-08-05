import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function StockProductsPage({ navigate, showNotification }) {
  const { t } = useLanguage();
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
        showNotification('success', t('stockPage.deleteSuccess', 'Produit supprimé avec succès.'));
        setDeleteProduct(null);
        fetchProducts();
      } else {
        let errMsg = t('stockPage.deleteError', 'Erreur lors de la suppression.');
        try {
          const err = await res.json();
          errMsg = err.message || errMsg;
        } catch (e) {
          // Fallback if not JSON (e.g. HTML debug page)
        }
        showNotification('error', errMsg);
      }
    } catch (err) {
      showNotification('error', t('stockPage.connectionError', 'Erreur de connexion avec le serveur.'));
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
        showNotification('success', t('stockPage.pickupSuccess', 'Demande de ramassage enregistrée avec succès.'));
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
        showNotification('error', err.message || t('stockPage.pickupError', 'Erreur lors de la demande de ramassage.'));
      }
    } catch (err) {
      showNotification('error', t('stockPage.connectionError', 'Erreur de connexion avec le serveur.'));
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
              <h1 className="text-xl font-medium leading-none text-mono">{t('stockPage.productListTitle', 'Liste des produits')}</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">{t('stockPage.totalProducts', 'Total produits')}:</span>
                <span className="text-base text-foreground font-medium me-2">{totalProducts}</span>
                <span className="text-base text-secondary-foreground">{t('stockPage.totalQty', 'Quantité totale')}:</span>
                <span className="text-base text-foreground font-medium">{totalQty}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="kt-btn kt-btn-primary" onClick={() => navigate('/stock/produits/new')}>
                {t('stockPage.addProduct', 'Ajouter un produit')}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">{t('stockPage.showingProducts', 'Affichage de')} {filtered.length} {t('stockPage.productsCount', 'produit(s)')}</h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder={t('stockPage.searchProduct', 'Rechercher un produit')}
                        type="text"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button className="kt-btn kt-btn-outline" onClick={() => { setSearchQuery(''); setCurrentPage(1); }}>
                      {t('stockPage.reset', 'Réinitialiser')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="kt-card-content">
                <div className="grid">
                  <div className="kt-scrollable-x-auto" style={activeDropdownId !== null ? { overflow: 'visible' } : {}}>
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                        <tr>
                          <th className="min-w-[90px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('stockPage.colPhoto', 'Photo')}</span></span></th>
                          <th className="min-w-[220px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('stockPage.colName', 'Nom')}</span></span></th>
                          <th className="min-w-[160px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('stockPage.colBarcode', 'Code-barres')}</span></span></th>
                          <th className="min-w-[120px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('stockPage.colQty', 'Quantité')}</span></span></th>
                          <th className="min-w-[160px]"><span className="kt-table-col"><span className="kt-table-col-label">{t('stockPage.colLastUpdate', 'Dernière mise à jour')}</span></span></th>
                          <th className="w-[90px] text-center"><span className="kt-table-col"><span className="kt-table-col-label">{t('stockPage.colActions', 'Actions')}</span></span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading
                          ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                          : paginated.length === 0
                            ? <tr><td colSpan={6} className="text-secondary-foreground text-center py-8">{t('stockPage.noProductFound', 'Aucun produit trouvé.')}</td></tr>
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
                                      <div className="kt-menu-dropdown kt-menu-default absolute right-0 mt-2 w-[175px]" style={{ zIndex: 9999, display: 'block' }}>
                                        <div className="kt-menu-item">
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setActiveDropdownId(null);
                                              navigate(`/stock/produits/${p.id}/edit`);
                                            }}
                                            className="kt-menu-link text-start w-full"
                                          >
                                            <span className="kt-menu-icon">
                                              <i className="ki-filled ki-pencil"></i>
                                            </span>
                                            <span className="kt-menu-title">{t('stockPage.actionEdit', 'Modifier')}</span>
                                          </button>
                                        </div>
                                        <div className="kt-menu-item">
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setActiveDropdownId(null);
                                              setDeleteProduct({ id: p.id, name: p.name });
                                            }}
                                            className="kt-menu-link text-start w-full text-destructive hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-600 dark:hover:!text-red-400"
                                          >
                                            <span className="kt-menu-icon text-destructive">
                                              <i className="ki-filled ki-trash"></i>
                                            </span>
                                            <span className="kt-menu-title text-destructive">{t('stockPage.actionDelete', 'Supprimer')}</span>
                                          </button>
                                        </div>
                                        
                                        <div className="kt-menu-item">
                                          {p.pickup_requested ? (
                                            <button
                                              type="button"
                                              disabled
                                              className="kt-menu-link text-start w-full opacity-60 cursor-not-allowed"
                                            >
                                              <span className="kt-menu-icon">
                                                <i className="ki-filled ki-delivery-3"></i>
                                              </span>
                                              <span className="kt-menu-title">{t('stockPage.actionPickupRequested', 'Ramassage demandé')}</span>
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveDropdownId(null);
                                                setPickupProduct({ id: p.id, name: p.name });
                                              }}
                                              className="kt-menu-link text-start w-full hover:!bg-green-50 dark:hover:!bg-green-950/30 hover:!text-green-600 dark:hover:!text-green-400"
                                            >
                                              <span className="kt-menu-icon">
                                                <i className="ki-filled ki-delivery-3"></i>
                                              </span>
                                              <span className="kt-menu-title">{t('stockPage.actionPickup', 'Ramassage')}</span>
                                            </button>
                                          )}
                                        </div>
                                        
                                        <div className="kt-menu-separator"></div>
                                        
                                        <div className="kt-menu-item flex flex-col items-stretch">
                                          {p.variants && p.variants.length > 0 ? (
                                            <>
                                              <div className="px-2 py-1 text-xs text-secondary-foreground text-left font-medium">{t('stockPage.actionPrintSticker', 'Imprimer sticker')}</div>
                                              {p.variants.map(v => (
                                                <button 
                                                  key={v.id}
                                                  type="button"
                                                  className="kt-menu-link w-full text-start"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdownId(null);
                                                    navigate(`/stock/produits/variant/${v.id}/sticker`);
                                                  }}
                                                >
                                                  <span className="kt-menu-icon">
                                                    <i className="ki-filled ki-printer"></i>
                                                  </span>
                                                  <span className="kt-menu-title">
                                                    {v.barcode || v.name || t('stockPage.variant', 'Variante')}
                                                  </span>
                                                </button>
                                              ))}
                                            </>
                                          ) : (
                                            <button 
                                              type="button"
                                              className="kt-menu-link w-full text-start"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdownId(null);
                                                navigate(`/stock/produits/${p.id}/sticker`);
                                              }}
                                            >
                                              <span className="kt-menu-icon">
                                                <i className="ki-filled ki-printer"></i>
                                              </span>
                                              <span className="kt-menu-title">
                                                {t('stockPage.actionPrintSticker', 'Imprimer sticker')}
                                              </span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
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
                      {t('stockPage.show', 'Afficher')}
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
                      {t('stockPage.perPage', 'par page')}
                    </div>
                    <div className="flex items-center gap-4 order-1 md:order-2">
                      <span>{filtered.length === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filtered.length)} ${t('colisPage.of', 'sur')} ${filtered.length}`}</span>
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
      {deleteProduct && createPortal(
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
          onClick={() => !deleteLoading && setDeleteProduct(null)}
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
              <h3 className="text-base font-semibold text-foreground">{t('stockPage.deleteProductTitle', 'Supprimer le produit')}</h3>
              <button 
                type="button"
                onClick={() => setDeleteProduct(null)}
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
                  {t('stockPage.deleteProductConfirm', 'Vous êtes sur le point de supprimer le produit')} <strong className="font-semibold text-foreground">{deleteProduct.name}</strong>{t('stockPage.deleteProductIrreversible', '. Cette action est irréversible et supprimera toutes ses variantes de stock.')}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setDeleteProduct(null)} 
                  className="kt-btn kt-btn-outline"
                  disabled={deleteLoading}
                >
                  {t('stockPage.cancel', 'Annuler')}
                </button>
                <button 
                  type="submit" 
                  className="kt-btn kt-btn-destructive"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? t('stockPage.deleting', 'Suppression...') : t('stockPage.actionDelete', 'Supprimer')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Pickup Request Modal */}
      {pickupProduct && createPortal(
        <div 
          className="fixed flex items-center justify-center p-4 overflow-y-auto"
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
        >
          <div className="kt-modal-content w-full max-w-2xl" id="pickup_request_modal">
            <div className="kt-modal-header">
              <h3 className="kt-modal-title">
                {t('stockPage.pickupModalTitle', 'Nouvelle demande de ramassage')}
              </h3>
              <button 
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost shrink-0" 
                onClick={() => setPickupProduct(null)} 
                type="button"
              >
                <i className="ki-filled ki-cross"></i>
              </button>
            </div>

            <div className="kt-modal-body px-5 py-5">
              <form onSubmit={handlePickupSubmit}>
                <div className="grid grid-cols-1 gap-4">
                  
                  <div className="grid grid-cols-1 gap-1.5">
                    <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupProductLabel', 'Produit')}</label>
                    <label className="kt-input">
                      <input 
                        type="text" 
                        readOnly 
                        disabled 
                        value={pickupProduct.name} 
                        className="bg-transparent border-0 outline-none w-full"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupCityLabel', 'Ville')}</label>
                      <KtSelect
                        value={pickupForm.city}
                        onChange={val => setPickupForm(prev => ({ ...prev, city: val }))}
                        options={[
                          { value: '', label: t('stockPage.pickupCityPlaceholder', 'Choisir une ville') },
                          ...cities.map(c => {
                            const val = (typeof c === 'object' && c !== null) ? (c.name || c.label || c.value || '') : c;
                            return { value: val, label: val };
                          })
                        ]}
                        className="w-full"
                        enableSearch={true}
                        searchPlaceholder={t('stockPage.pickupCitySearch', 'Rechercher une ville...')}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupNeighborhoodLabel', 'Quartier')}</label>
                      <label className="kt-input">
                        <input 
                          type="text" 
                          required 
                          placeholder={t('stockPage.pickupNeighborhoodPlaceholder', 'Quartier')}
                          value={pickupForm.neighborhood}
                          onChange={e => setPickupForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                          className="bg-transparent border-0 outline-none w-full"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupAddressLabel', 'Adresse')}</label>
                    <label className="kt-input">
                      <input 
                        type="text" 
                        required 
                        placeholder={t('stockPage.pickupAddressPlaceholder', 'Adresse')}
                        value={pickupForm.address}
                        onChange={e => setPickupForm(prev => ({ ...prev, address: e.target.value }))}
                        className="bg-transparent border-0 outline-none w-full"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupPhoneLabel', 'Téléphone')}</label>
                      <label className="kt-input">
                        <input 
                          type="text" 
                          required 
                          placeholder={t('stockPage.pickupPhonePlaceholder', 'Téléphone')}
                          value={pickupForm.phone}
                          onChange={e => setPickupForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="bg-transparent border-0 outline-none w-full"
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupSupplierPhoneLabel', 'Téléphone (Fournisseur)')}</label>
                      <label className="kt-input">
                        <input 
                          type="text" 
                          placeholder={t('stockPage.pickupSupplierPhonePlaceholder', 'Téléphone (Fournisseur)')}
                          value={pickupForm.supplierPhone}
                          onChange={e => setPickupForm(prev => ({ ...prev, supplierPhone: e.target.value }))}
                          className="bg-transparent border-0 outline-none w-full"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupNoteLabel', 'Note & Remarque')}</label>
                    <label className="kt-input">
                      <input 
                        type="text" 
                        placeholder={t('stockPage.pickupNotePlaceholder', 'Note & Remarque')}
                        value={pickupForm.note}
                        onChange={e => setPickupForm(prev => ({ ...prev, note: e.target.value }))}
                        className="bg-transparent border-0 outline-none w-full"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupHasLabelsLabel', 'Vous avez les étiquettes')}</label>
                    <KtSelect
                      value={pickupForm.hasLabels ? 'yes' : 'no'}
                      onChange={val => setPickupForm(prev => ({ ...prev, hasLabels: val === 'yes' }))}
                      options={[
                        { value: 'yes', label: t('stockPage.pickupYes', 'Oui') },
                        { value: 'no', label: t('stockPage.pickupNo', 'Non') }
                      ]}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button 
                      className="kt-btn kt-btn-outline" 
                      onClick={() => setPickupProduct(null)} 
                      type="button"
                      disabled={pickupLoading}
                    >
                      {t('stockPage.cancel', 'Annuler')}
                    </button>
                    <button 
                      className="kt-btn kt-btn-primary" 
                      type="submit"
                      disabled={pickupLoading}
                    >
                      {pickupLoading ? t('stockPage.pickupSaving', 'Enregistrement...') : t('stockPage.pickupSave', 'Enregistrer')}
                    </button>
                  </div>

                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
}
