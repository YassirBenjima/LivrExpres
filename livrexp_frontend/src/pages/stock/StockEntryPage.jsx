import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { getUserRoles } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';

const STATUS_BADGE = { 
  done: 'kt-badge-success', 
  in_progress: 'kt-badge-primary', 
  pending: 'kt-badge-info', 
  cancelled: 'kt-badge-destructive', 
  draft: 'kt-badge-warning' 
};

export default function StockEntryPage({ showNotification }) {
  const { t } = useLanguage();
  const userRoles = getUserRoles();
  const isSuperAdmin = userRoles.includes('ROLE_SUPER_ADMIN') || userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SUPERVISEUR');

  const getStatusLabel = (statusKey) => {
    const map = {
      draft: t('status.draft', 'Brouillon'),
      pending: t('status.pending', 'En attente'),
      in_progress: t('status.in_progress', 'En cours'),
      done: t('status.done', 'Terminé'),
      cancelled: t('status.cancelled', 'Annulé')
    };
    return map[statusKey] || statusKey;
  };

  const [movements, setMovements]       = useState([]);
  const [products, setProducts]         = useState([]);
  const [cities, setCities]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Selection and Quantities
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [quantities, setQuantities]                 = useState({});
  const [productSearch, setProductSearch]           = useState('');
  const [dropdownOpen, setDropdownOpen]             = useState(false);
  const dropdownRef                                 = useRef(null);

  // Selected movements for bulk pickup
  const [selectedMovementIds, setSelectedMovementIds] = useState([]);
  const [pickupModalOpen, setPickupModalOpen]         = useState(false);
  const [modalData, setModalData]                     = useState({ summary: '', count: 0, loading: false });
  const [pickupForm, setPickupForm]                   = useState({
    city: '',
    neighborhood: '',
    address: '',
    phone: '',
    note: ''
  });
  const [pickupLoading, setPickupLoading]             = useState(false);

  const [saving, setSaving]                   = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Details & Edit Modals State
  const [detailsModalOpen, setDetailsModalOpen]                 = useState(false);
  const [editModalOpen, setEditModalOpen]                       = useState(false);
  const [selectedMovementForModal, setSelectedMovementForModal] = useState(null);
  const [modalLoading, setModalLoading]                         = useState(false);
  const [editItems, setEditItems]                               = useState({});
  const [editStatus, setEditStatus]                             = useState('');
  const [updating, setUpdating]                                 = useState(false);

  const headers = { 'Accept': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const handleOpenDetails = async (movement) => {
    setSelectedMovementForModal(movement);
    setDetailsModalOpen(true);
    setModalLoading(true);
    try {
      const res = await fetch(`/api/stock/entry/${movement.id}`, { headers });
      if (res.ok) {
        const j = await res.json();
        if (j.movement) {
          setSelectedMovementForModal(j.movement);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEdit = async (movement) => {
    setSelectedMovementForModal(movement);
    setEditStatus(movement.status || 'pending');
    setEditModalOpen(true);
    setModalLoading(true);
    try {
      const res = await fetch(`/api/stock/entry/${movement.id}`, { headers });
      if (res.ok) {
        const j = await res.json();
        if (j.movement) {
          setSelectedMovementForModal(j.movement);
          const initialQtys = {};
          (j.movement.items || []).forEach(item => {
            if (item.variant_id) {
              initialQtys[item.variant_id] = item.quantity;
            }
          });
          setEditItems(initialQtys);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedMovementForModal) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/stock/entry/${selectedMovementForModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          status: editStatus,
          items: editItems
        })
      });

      if (res.ok) {
        if (showNotification) showNotification('success', t('stockPage.notifMovementUpdated', 'Mouvement mis à jour avec succès.'));
        setEditModalOpen(false);
        fetchData();
      } else {
        const j = await res.json().catch(() => ({}));
        if (showNotification) showNotification('error', j.message || t('stockPage.notifUpdateError', 'Erreur lors de la mise à jour.'));
      }
    } catch (e) {
      console.error(e);
      if (showNotification) showNotification('error', t('stockPage.notifServerError', 'Erreur serveur.'));
    } finally {
      setUpdating(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes, cRes] = await Promise.all([
        fetch('/api/stock/entry', { headers }),
        fetch('/api/stock/products', { headers }),
        fetch('/api/cities')
      ]);
      if (mRes.ok) { 
        const j = await mRes.json(); 
        setMovements(j.movements || []); 
      }
      if (pRes.ok) { 
        const j = await pRes.json(); 
        setProducts(j.products || []); 
      }
      if (cRes.ok) {
        const j = await cRes.json();
        if (Array.isArray(j)) {
          setCities(j);
        } else if (j && Array.isArray(j.cities)) {
          setCities(j.cities);
        }
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (activeDropdownId !== null && !e.target.closest('.kt-menu-toggle')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdownId]);

  const handleSave = async (e) => {
    e.preventDefault();
    const hasQty = Object.values(quantities).some(q => Number(q) > 0);
    if (!hasQty) {
      if (showNotification) showNotification('error', t('stockPage.notifEnterQty', 'Veuillez saisir au moins une quantité à récupérer.'));
      return;
    }

    setSaving(true);
    try {
      const payload = { variants: {} };
      Object.entries(quantities).forEach(([key, qty]) => {
        if (Number(qty) > 0) {
          payload.variants[key] = Number(qty);
        }
      });

      const res = await fetch('/api/stock/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (showNotification) showNotification('success', t('stockPage.notifEntryCreated', 'Mouvement de stock (entrée) enregistré avec succès.'));
        setSelectedProductIds([]);
        setQuantities({});
        fetchData();
      } else {
        let msg = t('stockPage.notifSaveError', 'Erreur lors de l\'enregistrement.');
        try {
          const err = await res.json();
          if (err.message) msg = err.message;
        } catch(e) {}
        if (showNotification) showNotification('error', msg);
      }
    } catch (err) { 
      console.error(err);
      if (showNotification) showNotification('error', t('stockPage.notifNetworkError', 'Erreur réseau.')); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleOpenPickupModal = async () => {
    if (selectedMovementIds.length === 0) return;
    setModalData({ summary: '', count: 0, loading: true });
    setPickupModalOpen(true);
    try {
      const res = await fetch(`/api/stock/entry/pickup-request/modal-data?ids=${selectedMovementIds.join(',')}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setModalData({ summary: data.summary, count: data.count, loading: false });
      } else {
        setModalData(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error(err);
      setModalData(prev => ({ ...prev, loading: false }));
    }
  };

  const handlePickupModalSubmit = async (e) => {
    e.preventDefault();
    if (!pickupForm.city) {
      if (showNotification) showNotification('error', t('stockPage.notifCityRequired', 'La ville est obligatoire.'));
      return;
    }
    if (!pickupForm.neighborhood) {
      if (showNotification) showNotification('error', t('stockPage.notifNeighborhoodRequired', 'Le quartier est obligatoire.'));
      return;
    }
    if (!pickupForm.address) {
      if (showNotification) showNotification('error', t('stockPage.notifAddressRequired', 'L\'adresse est obligatoire.'));
      return;
    }
    if (!pickupForm.phone) {
      if (showNotification) showNotification('error', t('stockPage.notifPhoneRequired', 'Le téléphone est obligatoire.'));
      return;
    }

    setPickupLoading(true);
    try {
      const payload = {
        movementIds: selectedMovementIds,
        city: pickupForm.city,
        neighborhood: pickupForm.neighborhood,
        address: pickupForm.address,
        phone: pickupForm.phone,
        note: pickupForm.note
      };

      const res = await fetch('/api/stock/entry/pickup-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        if (showNotification) showNotification('success', t('stockPage.notifPickupCreated', 'Demande de ramassage enregistrée avec succès.'));
        setPickupModalOpen(false);
        setSelectedMovementIds([]);
        fetchData();
      } else {
        let msg = t('stockPage.notifPickupError', 'Erreur lors de la création de la demande.');
        try {
          const err = await res.json();
          if (err.message) msg = err.message;
        } catch(e) {}
        if (showNotification) showNotification('error', msg);
      }
    } catch (err) {
      console.error(err);
      if (showNotification) showNotification('error', t('stockPage.notifNetworkError', 'Erreur réseau.'));
    } finally {
      setPickupLoading(false);
    }
  };

  const handleSelectAllMovements = (e) => {
    if (e.target.checked) {
      setSelectedMovementIds(paginated.map(m => m.id));
    } else {
      setSelectedMovementIds([]);
    }
  };

  const handleSelectMovementRow = (id) => {
    if (selectedMovementIds.includes(id)) {
      setSelectedMovementIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedMovementIds(prev => [...prev, id]);
    }
  };

  // Build the variants structure similar to buildProductsForStockEntry
  const productsForEntry = products.map(p => {
    const variants = p.variants && p.variants.length > 0
      ? p.variants.map(v => ({
          id: String(v.id),
          name: v.name,
          ref: v.barcode || '-',
          qty: v.quantity || 0
        }))
      : [{
          id: `p_${p.id}`,
          name: p.name,
          ref: p.barcode || '-',
          qty: p.quantity || 0
        }];
    
    return {
      id: p.id,
      name: p.name,
      photo_url: p.photo_url,
      variants
    };
  });

  const selectedProducts = productsForEntry.filter(p => selectedProductIds.includes(p.id));
  const showPhoto = selectedProducts.length === 1 && selectedProducts[0].photo_url;

  // Filter products for the custom dropdown
  const filteredDropdownProducts = products.filter(p => 
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Movements filter & pagination
  const filtered = movements.filter(m => {
    const matchesSearch = !searchQuery || 
      m.reference?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.products_summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasQty = Object.values(quantities).some(q => Number(q) > 0);

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="py-4">
          <div className="h-4 bg-muted rounded w-3/4 my-1"></div>
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="stock_entry">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">{t('stockPage.stockInboundTitle', 'Stock Entrée')}</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">{t('stockPage.totalMovements', 'Total mouvements')}:</span>
                <span className="text-base text-foreground font-medium">{movements.length}</span>
              </div>
            </div>
            <button 
              className="kt-btn kt-btn-primary" 
              onClick={handleSave} 
              disabled={saving || !hasQty}
            >
              {saving ? t('stockPage.saving', 'Enregistrement...') : t('stockPage.save', 'Enregistrer')}
            </button>
          </div>
        </div>

        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            
            {/* Form layout: Card 1 - Liste des produits */}
            <form onSubmit={handleSave} id="stock_entry_form">
              <div className="kt-card kt-card-grid min-w-full">
                <div className="kt-card-header flex-wrap gap-2">
                  <h3 className="kt-card-title text-sm">{t('stockPage.productListLabel', 'Liste des produits')}</h3>
                  <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
                    
                    {/* Custom Multiple Select Dropdown */}
                    <div className="relative w-[320px]" ref={dropdownRef} style={{ zIndex: dropdownOpen ? 9999 : undefined }}>
                      {/* Trigger — styled to match kt-input/kt-select look, NO kt-select class to avoid CSS conflicts */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDropdownOpen(!dropdownOpen); }}
                        className="bg-card text-card-foreground border border-border"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          height: '34px',
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          userSelect: 'none',
                        }}
                      >
                        <span style={{ color: selectedProductIds.length === 0 ? 'var(--muted-foreground, #a1a1aa)' : 'inherit' }}>
                          {selectedProductIds.length === 0 
                            ? t('stockPage.selectProducts', 'Sélectionner des produits') 
                            : selectedProductIds.length === 1 
                              ? products.find(p => p.id === selectedProductIds[0])?.name 
                              : `${selectedProductIds.length} ${t('stockPage.productsLabel', 'produit(s)')}`
                          }
                        </span>
                        {/* Chevron icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginLeft: '8px', color: '#9f9fa9' }}>
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m2 5 6 6 6-6"/>
                        </svg>
                      </div>

                      {dropdownOpen && (
                        <div 
                          className="absolute z-50 w-full rounded-xl shadow-lg overflow-hidden bg-card text-card-foreground border border-border"
                          style={{
                            top: 'calc(100% + 4px)',
                            left: 0,
                            minWidth: '100%',
                            backgroundColor: 'var(--card, #ffffff)',
                            color: 'var(--card-foreground, #09090b)',
                            border: '1px solid var(--border, #e4e4e7)',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)'
                          }}
                        >
                          {/* Search container */}
                          <div 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '6px 12px',
                              backgroundColor: '#ffffff',
                              borderBottom: '1px solid #e4e4e7'
                            }}
                          >
                            <input
                              type="text"
                              style={{
                                border: 'none',
                                outline: 'none',
                                boxShadow: 'none',
                                background: 'transparent',
                                width: '100%',
                                padding: '2px 0',
                                fontSize: '13px',
                                color: '#09090b',
                              }}
                              placeholder={t('stockPage.searchProduct', 'Rechercher un produit...')}
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>

                          {/* Options Container */}
                          <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
                            {filteredDropdownProducts.map(p => {
                              const isSelected = selectedProductIds.includes(p.id);
                              return (
                                <div
                                  key={p.id}
                                  role="option"
                                  className={`kt-select-option flex items-center gap-3 cursor-pointer p-2 px-3 hover:bg-zinc-100 ${isSelected ? 'bg-zinc-100 font-medium' : ''}`}
                                  style={{ backgroundColor: isSelected ? '#f4f4f5' : '#ffffff', color: '#09090b' }}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                                      // Clean up quantities of removed product variants
                                      const pEntry = productsForEntry.find(pe => pe.id === p.id);
                                      if (pEntry) {
                                        setQuantities(prev => {
                                          const updated = { ...prev };
                                          pEntry.variants.forEach(v => delete updated[v.id]);
                                          return updated;
                                        });
                                      }
                                    } else {
                                      setSelectedProductIds(prev => [...prev, p.id]);
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    className="kt-checkbox kt-checkbox-sm pointer-events-none"
                                    checked={isSelected}
                                    readOnly
                                  />
                                  <span className="kt-select-option-text" style={{ color: '#09090b' }}>{p.name}</span>
                                </div>
                              );
                            })}
                            {filteredDropdownProducts.length === 0 && (
                              <div style={{ padding: '12px 16px', fontSize: '13px', color: '#a1a1aa', textAlign: 'center', backgroundColor: '#ffffff' }}>{t('stockPage.noProductFound', 'Aucun produit trouvé')}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>


                  </div>
                </div>

                {/* Sub card when products are selected */}
                {selectedProductIds.length > 0 && (
                  <div className="kt-card-content">
                    <div className="flex flex-col gap-4">
                      <div className="border border-border rounded-xl p-4" id="stock_entry_selected_product">
                        
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {showPhoto && (
                              <div className="size-12 rounded-md bg-muted/30 overflow-hidden shrink-0">
                                <img src={selectedProducts[0].photo_url} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <span className="kt-badge kt-badge-primary kt-badge-outline rounded-[30px]" id="stock_entry_selected_name">
                              {selectedProductIds.length === 1 
                                ? selectedProducts[0].name 
                                : `${selectedProductIds.length} ${t('stockPage.productsLabel', 'produits')}`
                              }
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="kt-scrollable-x-auto">
                            <table className="kt-table table-auto kt-table-border">
                              <thead>
                                <tr>
                                  <th className="min-w-[160px]">{t('stockPage.colRef', '# RÉF')}</th>
                                  <th className="min-w-[240px]">{t('stockPage.colVariantName', 'NOM DE LA VARIANTE')}</th>
                                  <th className="min-w-[220px]">{t('stockPage.colQtyToRecover', 'QUANTITÉ À RÉCUPÉRER')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProducts.map(p => (
                                  <React.Fragment key={p.id}>
                                    <tr className="bg-muted/10">
                                      <td colSpan={3} className="text-foreground font-semibold py-2 px-3">
                                        {p.name}
                                      </td>
                                    </tr>
                                    {p.variants.map(v => (
                                      <tr key={v.id}>
                                        <td className="text-foreground font-medium">{v.ref || '-'}</td>
                                        <td className="text-foreground font-normal">{v.name || '-'}</td>
                                        <td>
                                          <input 
                                            className="kt-input w-full h-9 px-3" 
                                            type="number" 
                                            min="0" 
                                            placeholder="0"
                                            value={quantities[v.id] || ''} 
                                            onChange={(e) => {
                                              const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                                              setQuantities(prev => ({ ...prev, [v.id]: val }));
                                            }}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* Card 2 - Table of Movements */}
            <div className="kt-card kt-card-grid min-w-full">
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">{t('stockPage.showingMovements', 'Affichage de')} {filtered.length} {t('stockPage.movementsCount', 'mouvement(s)')}</h3>
                
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input 
                        value={searchQuery} 
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                        placeholder={t('stockPage.searchMovements', 'Rechercher')} 
                        type="text" 
                      />
                    </label>
                  </div>

                  <div className="flex">
                    <KtSelect
                      value={statusFilter}
                      onChange={val => { setStatusFilter(val); setCurrentPage(1); }}
                      placeholder={t('stockPage.allStatuses2', 'Tous les statuts')}
                      options={[
                        { value: '', label: t('stockPage.allStatuses2', 'Tous les statuts') },
                        ...Object.keys(STATUS_BADGE).map((key) => ({
                          value: key,
                          label: getStatusLabel(key)
                        }))
                      ]}
                      className="w-48"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      className="kt-btn kt-btn-outline kt-btn-primary"
                      type="button"
                      disabled={selectedMovementIds.length === 0}
                      onClick={handleOpenPickupModal}
                    >
                      {t('stockPage.pickupRequest', 'Demande de ramassage')}
                    </button>
                    <button 
                      className="kt-btn kt-btn-outline" 
                      onClick={() => { 
                        setSearchQuery(''); 
                        setStatusFilter(''); 
                        setCurrentPage(1); 
                      }}
                    >
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
                          <th className="w-[50px]">
                            <input 
                              className="kt-checkbox kt-checkbox-sm" 
                              type="checkbox"
                              onChange={handleSelectAllMovements}
                              checked={paginated.length > 0 && selectedMovementIds.length === paginated.length}
                            />
                          </th>
                          <th className="min-w-[180px]">{t('stockPage.colRefTable', 'Réf')}</th>
                          <th className="min-w-[260px]">{t('stockPage.colProductList', 'Liste des produits')}</th>
                          <th className="min-w-[180px]">{t('stockPage.colCreatedDate', 'Date de création')}</th>
                          <th className="min-w-[180px]">{t('stockPage.colLastUpdate', 'Dernière mise à jour')}</th>
                          <th className="min-w-[140px]">{t('stockPage.colStatus', 'Statut')}</th>
                          <th className="w-[90px] text-center">{t('stockPage.colActions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                        ) : paginated.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-secondary-foreground text-center py-8">
                              {t('stockPage.noMovementFound', 'Aucun mouvement trouvé.')}
                            </td>
                          </tr>
                        ) : (
                          paginated.map(m => (
                            <tr key={m.id}>
                              <td>
                                <input
                                  className="kt-checkbox kt-checkbox-sm"
                                  type="checkbox"
                                  checked={selectedMovementIds.includes(m.id)}
                                  onChange={() => handleSelectMovementRow(m.id)}
                                />
                              </td>
                              <td className="text-foreground font-medium">{m.reference || '-'}</td>
                              <td>
                                <div className="flex flex-col gap-1">
                                  <div className="text-foreground font-normal">{m.products_summary || '-'}</div>
                                  <div className="text-xs text-secondary-foreground">{m.products_count || 0} {t('stockPage.productsLabel', 'produit(s)')}</div>
                                </div>
                              </td>
                              <td className="text-foreground font-normal">{m.created_at || '-'}</td>
                              <td className="text-foreground font-normal">{m.updated_at || '-'}</td>
                              <td>
                                <span className={`kt-badge ${STATUS_BADGE[m.status] || 'kt-badge-warning'} kt-badge-outline rounded-[30px] px-2 py-0.5`}>
                                  <span className="kt-badge-dot size-1.5"></span>
                                  {getStatusLabel(m.status)}
                                </span>
                              </td>
                              <td className="text-center relative" style={activeDropdownId === m.id ? { zIndex: 9999 } : {}}>
                                <div className="relative inline-block text-left">
                                  <button 
                                    onClick={() => setActiveDropdownId(activeDropdownId === m.id ? null : m.id)}
                                    className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                    type="button"
                                  >
                                    <i className="ki-filled ki-dots-vertical text-lg"></i>
                                  </button>
                                  {activeDropdownId === m.id && (
                                    <div className="kt-menu-dropdown kt-menu-default absolute right-0 mt-2 w-[175px]" style={{ zIndex: 9999, display: 'block' }}>
                                      <div className="kt-menu-item">
                                        <button
                                          type="button"
                                          className="kt-menu-link text-start w-full cursor-pointer hover:bg-accent/50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveDropdownId(null);
                                            handleOpenDetails(m);
                                          }}
                                        >
                                          <span className="kt-menu-icon">
                                            <i className="ki-filled ki-eye text-primary"></i>
                                          </span>
                                          <span className="kt-menu-title font-medium">{t('stockPage.detailsTab', 'Détails')}</span>
                                        </button>
                                      </div>
                                      <div className="kt-menu-item">
                                        <button
                                          type="button"
                                          className="kt-menu-link text-start w-full cursor-pointer hover:bg-accent/50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveDropdownId(null);
                                            handleOpenEdit(m);
                                          }}
                                        >
                                          <span className="kt-menu-icon">
                                            <i className="ki-filled ki-pencil text-info"></i>
                                          </span>
                                          <span className="kt-menu-title font-medium">{t('stockPage.actionEdit', 'Modifier')}</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium py-4">
                    <div className="flex items-center gap-2 order-2 md:order-1">
                      {t('stockPage.show', 'Afficher')}
                      <KtSelect 
                        value={String(itemsPerPage)} 
                        onChange={v => { setItemsPerPage(Number(v)); setCurrentPage(1); }}
                        className="w-16" 
                        options={[
                          { value: '10', label: '10' },
                          ...(filtered.length > 10 ? [{ value: '25', label: '25' }] : []),
                          ...(filtered.length > 25 ? [{ value: '50', label: '50' }] : []),
                        ]} 
                      />
                      {t('stockPage.perPage', 'par page')}
                    </div>
                    
                    <div className="flex items-center gap-4 order-1 md:order-2">
                      <span>{filtered.length === 0 ? '0' : `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filtered.length)} ${t('colisPage.of', 'sur')} ${filtered.length}`}</span>
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

      {/* Bulk Pickup Request Modal */}
      {pickupModalOpen && createPortal(
        <div 
          className="fixed flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          onClick={() => setPickupModalOpen(false)}
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
          <div 
            className="kt-modal-content w-full max-w-2xl cursor-default" 
            id="stock_entry_pickup_request_modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kt-modal-header">
              <h3 className="kt-modal-title">{t('stockPage.pickupModalTitle', 'Nouvelle demande de ramassage')}</h3>
              <button 
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost shrink-0" 
                onClick={() => setPickupModalOpen(false)} 
                type="button"
              >
                <i className="ki-filled ki-cross"></i>
              </button>
            </div>

            <div className="kt-modal-body px-5 py-5">
              <form onSubmit={handlePickupModalSubmit} id="stock-entry-pickup-request-form">
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 gap-1.5">
                    <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupProductLabel', 'Produit(s)')}</label>
                    <label className="kt-input">
                      <input
                        className="w-full bg-transparent outline-none border-0"
                        type="text"
                        placeholder={modalData.loading ? t('common.loading', 'Chargement...') : t('stockPage.productsLabel', 'Produits')}
                        value={modalData.summary}
                        readOnly
                        disabled
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
                          name="neighborhood" 
                          type="text" 
                          placeholder={t('stockPage.pickupNeighborhoodPlaceholder', 'Quartier')} 
                          value={pickupForm.neighborhood}
                          onChange={e => setPickupForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                          className="w-full bg-transparent outline-none border-0"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupAddressLabel', 'Adresse')}</label>
                    <label className="kt-input">
                      <input 
                        name="address" 
                        type="text" 
                        placeholder={t('stockPage.pickupAddressPlaceholder', 'Adresse')} 
                        value={pickupForm.address}
                        onChange={e => setPickupForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full bg-transparent outline-none border-0"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupPhoneLabel', 'Téléphone')}</label>
                    <label className="kt-input">
                      <input 
                        name="phone" 
                        type="text" 
                        placeholder={t('stockPage.pickupPhonePlaceholder', 'Téléphone')} 
                        value={pickupForm.phone}
                        onChange={e => setPickupForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-transparent outline-none border-0"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    <label className="text-sm font-medium text-mono text-foreground">{t('stockPage.pickupNoteLabel', 'Note & Remarque')}</label>
                    <label className="kt-input">
                      <input 
                        name="note" 
                        type="text" 
                        placeholder={t('stockPage.pickupNotePlaceholder', 'Note & Remarque')} 
                        value={pickupForm.note}
                        onChange={e => setPickupForm(prev => ({ ...prev, note: e.target.value }))}
                        className="w-full bg-transparent outline-none border-0"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button 
                      className="kt-btn kt-btn-outline" 
                      onClick={() => setPickupModalOpen(false)} 
                      type="button"
                      disabled={pickupLoading}
                    >
                      {t('stockPage.cancel', 'Annuler')}
                    </button>
                    <button 
                      className="kt-btn kt-btn-primary" 
                      type="submit"
                      disabled={pickupLoading || modalData.loading}
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

      {/* View Details Modal */}
      {detailsModalOpen && selectedMovementForModal && createPortal(
        <div 
          className="fixed flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          onClick={() => setDetailsModalOpen(false)}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            className="kt-card max-w-2xl w-full bg-background border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="kt-card-header flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <i className="ki-filled ki-eye text-xl"></i>
                </div>
                <div>
                  <h3 className="kt-card-title text-base font-bold text-mono">
                    {t('stockPage.movementLabel', 'Mouvement')} {selectedMovementForModal.reference}
                  </h3>
                  <p className="text-xs text-secondary-foreground">
                    {t('stockPage.createdOn', 'Créé le')} {selectedMovementForModal.created_at || '-'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost cursor-pointer"
                onClick={() => setDetailsModalOpen(false)}
              >
                <i className="ki-filled ki-cross text-lg"></i>
              </button>
            </div>

            {/* Body */}
            <div className="kt-card-content p-6 overflow-y-auto flex flex-col gap-5">
              {/* Status Badge */}
              {isSuperAdmin && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border">
                  <span className="text-xs font-semibold text-mono uppercase text-secondary-foreground">{t('stockPage.movementStatus', 'Statut du mouvement')}</span>
                  <span className={`kt-badge ${STATUS_BADGE[selectedMovementForModal.status] || 'kt-badge-warning'} kt-badge-outline rounded-[30px] px-3 py-1 text-xs font-bold`}>
                    <span className="kt-badge-dot size-2 me-1.5"></span>
                    {getStatusLabel(selectedMovementForModal.status)}
                  </span>
                </div>
              )}

              {/* Items Table */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-mono uppercase text-secondary-foreground">{t('stockPage.variantsAndQty', 'Variantes & Quantités')}</h4>
                {modalLoading ? (
                  <div className="py-8 text-center text-sm text-secondary-foreground flex items-center justify-center gap-2">
                    <i className="ki-filled ki-loading animate-spin text-primary text-base" />
                    {t('stockPage.loadingDetails', 'Chargement des détails...')}
                  </div>
                ) : (selectedMovementForModal.items || []).length === 0 ? (
                  <div className="py-8 text-center text-sm text-secondary-foreground">{t('stockPage.noItemsInMovement', 'Aucun article dans ce mouvement.')}</div>
                ) : (
                  <div className="kt-scrollable-x-auto border border-border rounded-xl">
                    <table className="kt-table table-auto kt-table-border w-full text-sm">
                      <thead>
                        <tr className="bg-muted/20">
                          <th className="py-2.5 px-3">{t('stockPage.colProductHeader', 'PRODUIT')}</th>
                          <th className="py-2.5 px-3">{t('stockPage.colVariantHeader', 'VARIANTE')}</th>
                          <th className="py-2.5 px-3">{t('stockPage.colRefBarcodeHeader', 'RÉF / CODE-BARRES')}</th>
                          <th className="py-2.5 px-3 text-right">{t('stockPage.colQtyHeader', 'QUANTITÉ')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMovementForModal.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="font-semibold text-foreground py-2.5 px-3">{item.product_name}</td>
                            <td className="text-foreground py-2.5 px-3">{item.variant_name}</td>
                            <td className="text-mono text-xs text-secondary-foreground py-2.5 px-3">{item.ref || item.barcode || '-'}</td>
                            <td className="text-right font-bold text-mono text-primary py-2.5 px-3">{item.quantity} unit.</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="kt-card-footer border-t border-border p-4 flex justify-end">
              <button 
                type="button"
                className="kt-btn kt-btn-outline cursor-pointer"
                onClick={() => setDetailsModalOpen(false)}
              >
                {t('common.close', 'Fermer')}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Edit Movement Modal */}
      {editModalOpen && selectedMovementForModal && createPortal(
        <div 
          className="fixed flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
          onClick={() => setEditModalOpen(false)}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            className="kt-card max-w-2xl w-full bg-background border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="kt-card-header flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
                  <i className="ki-filled ki-pencil text-xl"></i>
                </div>
                <div>
                  <h3 className="kt-card-title text-base font-bold text-mono">
                    {t('stockPage.editMovementTitle', 'Modifier le mouvement')} {selectedMovementForModal.reference}
                  </h3>
                  <p className="text-xs text-secondary-foreground">
                    {t('stockPage.editMovementSubtitle', 'Mettez à jour le statut et les quantités associées')}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost cursor-pointer"
                onClick={() => setEditModalOpen(false)}
              >
                <i className="ki-filled ki-cross text-lg"></i>
              </button>
            </div>

            {/* Body */}
            <div className="kt-card-content p-6 overflow-y-auto flex flex-col gap-5">
              {/* Status Selection (Super Admin only) */}
              {isSuperAdmin && (
                <div className="flex flex-col gap-1.5">
                  <label className="kt-form-label text-mono text-xs font-semibold">{t('stockPage.movementStatus', 'Statut du mouvement')}</label>
                  <KtSelect
                    value={editStatus}
                    onChange={(val) => setEditStatus(val)}
                    options={Object.keys(STATUS_BADGE).map((key) => ({
                      value: key,
                      label: getStatusLabel(key)
                    }))}
                    enableSearch={false}
                  />
                </div>
              )}

              {/* Editable Items Table */}
              <div className="flex flex-col gap-2">
                <label className="kt-form-label text-mono text-xs font-semibold">{t('stockPage.qtyPerVariant', 'Quantités par variante')}</label>
                {modalLoading ? (
                  <div className="py-8 text-center text-sm text-secondary-foreground flex items-center justify-center gap-2">
                    <i className="ki-filled ki-loading animate-spin text-primary text-base" />
                    {t('stockPage.loadingData', 'Chargement des données...')}
                  </div>
                ) : (selectedMovementForModal.items || []).length === 0 ? (
                  <div className="py-8 text-center text-sm text-secondary-foreground">{t('stockPage.noItemsToEdit', 'Aucun article à modifier.')}</div>
                ) : (
                  <div className="kt-scrollable-x-auto border border-border rounded-xl">
                    <table className="kt-table table-auto kt-table-border w-full text-sm">
                      <thead>
                        <tr className="bg-muted/20">
                          <th className="py-2.5 px-3">{t('stockPage.colProductVariantHeader', 'PRODUIT / VARIANTE')}</th>
                          <th className="py-2.5 px-3">{t('stockPage.colRefTable', 'RÉF')}</th>
                          <th className="py-2.5 px-3 w-[140px] text-right">{t('stockPage.colQtyHeader', 'QUANTITÉ')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMovementForModal.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{item.product_name}</span>
                                <span className="text-xs text-secondary-foreground">{item.variant_name}</span>
                              </div>
                            </td>
                            <td className="text-mono text-xs text-secondary-foreground py-2.5 px-3">{item.ref || item.barcode || '-'}</td>
                            <td className="py-2.5 px-3">
                              <input 
                                type="number"
                                min="1"
                                className="kt-input w-full h-9 px-3 text-right font-bold"
                                value={editItems[item.variant_id] !== undefined ? editItems[item.variant_id] : item.quantity}
                                onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  setEditItems(prev => ({ ...prev, [item.variant_id]: val }));
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="kt-card-footer border-t border-border p-4 flex justify-end gap-3">
              <button 
                type="button"
                className="kt-btn kt-btn-outline cursor-pointer"
                onClick={() => setEditModalOpen(false)}
                disabled={updating}
              >
                {t('stockPage.cancel', 'Annuler')}
              </button>
              <button 
                type="button"
                className="kt-btn kt-btn-primary flex items-center gap-2 cursor-pointer"
                onClick={handleSaveEdit}
                disabled={updating || modalLoading}
              >
                {updating && <i className="ki-filled ki-loading animate-spin text-sm" />}
                {t('stockPage.saveChanges', 'Enregistrer les modifications')}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </DashboardLayout>
  );
}
