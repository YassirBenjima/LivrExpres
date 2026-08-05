import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function TrackingChangeRecipientPage({ navigate, showNotification }) {
  const { t } = useLanguage();
  const [colisList, setColisList] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('same'); // 'same' | 'newcity'
  const [selectedIds, setSelectedIds] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');

  // Bulk update form state
  const [bulkRecipient, setBulkRecipient] = useState('');
  const [bulkPhoneNumber, setBulkPhoneNumber] = useState('');
  const [bulkCity, setBulkCity] = useState('');
  const [bulkAddress, setBulkAddress] = useState('');
  const [bulkNeighborhood, setBulkNeighborhood] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatStatutLabel = (statut) => {
    if (!statut) return t('status.pending', 'En attente');
    const clean = String(statut).trim().toLowerCase();
    const map = {
      'en attente': t('status.pending', 'En attente'),
      'en cours': t('status.in_progress', 'En cours'),
      'terminé': t('status.done', 'Terminé'),
      'termine': t('status.done', 'Terminé'),
      'reporté': t('status.postponed', 'Reporté'),
      'reporte': t('status.postponed', 'Reporté'),
      'échec': t('status.failed', 'Échec'),
      'echec': t('status.failed', 'Échec'),
      'livré': t('status.delivered', 'Livré'),
      'livre': t('status.delivered', 'Livré'),
      'annulé': t('status.cancelled', 'Annulé'),
      'annule': t('status.cancelled', 'Annulé'),
      'enregistré': t('status.registered', 'Enregistré'),
      'enregistre': t('status.registered', 'Enregistré')
    };
    return map[clean] || statut;
  };

  const fetchCities = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/cities', {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCities(data.map(c => typeof c === 'string' ? c : (c.name || c.label)));
      }
    } catch (err) {
      console.error('Erreur chargement des villes:', err);
    }
  };

  const fetchColis = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      params.append('tab', activeTab);
      if (searchQuery) params.append('q', searchQuery);
      if (filterCity) params.append('city', filterCity);

      const res = await fetch(`/api/suivi/changement-destinataire?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setColisList(data.colis_list || data || []);
        if (data.cities && Array.isArray(data.cities) && data.cities.length > 0) {
          setCities(data.cities);
        }
      } else {
        // Fallback to general colis if backend route not ready
        const fallbackRes = await fetch('/api/colis', {
          headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setColisList(Array.isArray(fallbackData) ? fallbackData : (fallbackData.colis_list || []));
        }
      }
    } catch (err) {
      console.error('Erreur chargement colis suivi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchColis();
    setSelectedIds([]);
  }, [activeTab, searchQuery, filterCity]);

  // Helper to sync form prefill based on selected IDs
  const syncFormPrefill = (nextIds, list = colisList) => {
    if (nextIds.length === 1) {
      const selected = list.find(c => c.id === nextIds[0]);
      if (selected) {
        setBulkRecipient(selected.recipient || '');
        setBulkPhoneNumber(selected.phoneNumber || '');
        setBulkCity(selected.city || '');
        setBulkAddress(selected.address || '');
        setBulkNeighborhood(selected.neighborhood || '');
        return;
      }
    }
    setBulkRecipient('');
    setBulkPhoneNumber('');
    setBulkCity('');
    setBulkAddress('');
    setBulkNeighborhood('');
  };

  // Handle single row checkbox toggle
  const handleSelectRow = (colis) => {
    let nextIds;
    if (selectedIds.includes(colis.id)) {
      nextIds = selectedIds.filter(id => id !== colis.id);
    } else {
      nextIds = [...selectedIds, colis.id];
    }
    setSelectedIds(nextIds);
    syncFormPrefill(nextIds);
  };

  // Select all visible row toggle
  const handleSelectAll = (e) => {
    let nextIds;
    if (e.target.checked) {
      const pageIds = paginatedColis.map(c => c.id);
      nextIds = Array.from(new Set([...selectedIds, ...pageIds]));
    } else {
      const pageIdsSet = new Set(paginatedColis.map(c => c.id));
      nextIds = selectedIds.filter(id => !pageIdsSet.has(id));
    }
    setSelectedIds(nextIds);
    syncFormPrefill(nextIds);
  };

  // Bulk recipient update submit
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    setBulkSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        colis_ids: selectedIds,
        tab: activeTab,
        recipient: bulkRecipient,
        phoneNumber: bulkPhoneNumber,
        city: bulkCity,
        address: bulkAddress,
        neighborhood: bulkNeighborhood
      };

      const res = await fetch('/api/suivi/changement-destinataire/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showNotification?.('success', `${selectedIds.length} ${t('changeRecipient.updateSuccess', 'colis mis à jour.')}`);
        setBulkRecipient('');
        setBulkPhoneNumber('');
        setBulkCity('');
        setBulkAddress('');
        setBulkNeighborhood('');
        setSelectedIds([]);
        fetchColis();
      } else {
        showNotification?.('error', data.message || t('changeRecipient.updateError', 'Erreur lors de la mise à jour groupée.'));
      }
    } catch (err) {
      showNotification?.('error', t('changeRecipient.serverError', 'Erreur de communication avec le serveur.'));
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Filtered List Client-Side logic
  const filteredColis = colisList.filter(colis => {
    const matchesSearch = !searchQuery ? true : [
      colis.trackingCode,
      colis.productNature,
      colis.recipient,
      colis.phoneNumber,
      colis.city,
      colis.address
    ].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCity = !filterCity ? true : colis.city?.toLowerCase() === filterCity.toLowerCase();

    return matchesSearch && matchesCity;
  });

  const totalColis = filteredColis.length;

  // Pagination
  const totalPages = Math.ceil(totalColis / itemsPerPage);
  const paginatedColis = filteredColis.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const allVisibleSelected = paginatedColis.length > 0 && paginatedColis.every(c => selectedIds.includes(c.id));

  const perPageOptions = [
    { value: '5', label: '5' },
    { value: '10', label: '10' },
  ];
  if (totalColis > 10) perPageOptions.push({ value: '20', label: '20' });
  if (totalColis >= 50) perPageOptions.push({ value: '50', label: '50' });

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="py-4">
          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: i === 0 ? '20px' : i === 1 ? '110px' : i === 5 ? '70px' : '85%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="suivi_changement_destinataire">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Title & Stats */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">{t('changeRecipient.pageTitle', 'Changement destinataire')}</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">{t('changeRecipient.totalParcels', 'Total colis :')}</span>
                <span className="text-base text-foreground font-medium">{totalColis}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Même ville / Autre ville */}
        <div className="kt-container-fixed mb-5">
          <div className="flex border-b border-border gap-6">
            <button
              onClick={() => { setActiveTab('same'); setCurrentPage(1); }}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'same'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-secondary-foreground hover:text-foreground'
              }`}
            >
              {t('changeRecipient.sameCity', 'Même ville')}
            </button>
            <button
              onClick={() => { setActiveTab('newcity'); setCurrentPage(1); }}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'newcity'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-secondary-foreground hover:text-foreground'
              }`}
            >
              {t('changeRecipient.otherCity', 'Autre ville')}
            </button>
          </div>
        </div>

        {/* Bulk Recipient Form Card */}
        <div className="kt-container-fixed">
          <div className="kt-card border border-border/60 mb-5">
            <div className="kt-card-content p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-foreground">{t('changeRecipient.bulkUpdateTitle', 'Mise à jour groupée destinataire')}</div>
                    <span className="kt-badge kt-badge-info kt-badge-outline rounded-[30px]">
                      <span className="kt-badge-dot size-1.5"></span>
                      <span>{selectedIds.length}</span>&nbsp;{t('changeRecipient.selected', 'sélectionné(s)')}
                    </span>
                  </div>
                  <div className="text-2sm text-secondary-foreground">
                    {t('changeRecipient.bulkInstruction', 'Sélectionnez des colis puis mettez à jour les informations du destinataire.')}
                  </div>
                </div>

                <form className="flex flex-wrap items-end gap-3" onSubmit={handleBulkSubmit}>
                  <div className="flex flex-col gap-1">
                    <label className="text-2sm text-secondary-foreground font-medium">{t('changeRecipient.recipient', 'Destinataire')}</label>
                    <input 
                      className="kt-input w-56" 
                      placeholder={t('changeRecipient.recipientPlaceholder', 'Nom du destinataire')} 
                      type="text"
                      value={bulkRecipient}
                      onChange={(e) => setBulkRecipient(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-2sm text-secondary-foreground font-medium">{t('changeRecipient.phone', 'Téléphone')}</label>
                    <input 
                      className="kt-input w-44" 
                      placeholder={t('changeRecipient.phonePlaceholder', 'Numéro de téléphone')} 
                      type="text"
                      value={bulkPhoneNumber}
                      onChange={(e) => setBulkPhoneNumber(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-2sm text-secondary-foreground font-medium">{t('changeRecipient.city', 'Ville')}</label>
                    <KtSelect
                      value={bulkCity}
                      onChange={(val) => setBulkCity(val)}
                      placeholder={t('changeRecipient.selectCity', 'Choisir une ville')}
                      enableSearch
                      searchPlaceholder={t('changeRecipient.searchCity', 'Chercher une ville...')}
                      className="w-56"
                      options={[
                        { value: '', label: t('changeRecipient.selectCity', 'Choisir une ville') },
                        ...cities.map(c => ({ value: c, label: c }))
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-2sm text-secondary-foreground font-medium">{t('changeRecipient.address', 'Adresse')}</label>
                    <input 
                      className="kt-input w-72" 
                      placeholder={t('changeRecipient.addressPlaceholder', 'Adresse')} 
                      type="text"
                      value={bulkAddress}
                      onChange={(e) => setBulkAddress(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-2sm text-secondary-foreground font-medium">{t('changeRecipient.neighborhood', 'Quartier')}</label>
                    <input 
                      className="kt-input w-44" 
                      placeholder={t('changeRecipient.neighborhoodPlaceholder', 'Quartier')} 
                      type="text"
                      value={bulkNeighborhood}
                      onChange={(e) => setBulkNeighborhood(e.target.value)}
                    />
                  </div>

                  <button 
                    className="kt-btn kt-btn-primary" 
                    type="submit" 
                    disabled={selectedIds.length === 0 || bulkSubmitting}
                  >
                    <i className="ki-filled ki-user-edit"></i>
                    {bulkSubmitting ? t('changeRecipient.updatingBtn', 'Mise à jour...') : t('changeRecipient.updateBtn', 'Mettre à jour')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Table Header Filter */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">{t('changeRecipient.showingCount', 'Affichage de')} {filteredColis.length} {t('changeRecipient.parcelsCount', 'colis')}</h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder={t('changeRecipient.searchPlaceholder', 'Code de suivi, destinataire, ville...')}
                        type="text"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={filterCity}
                      onChange={(val) => { setFilterCity(val); setCurrentPage(1); }}
                      placeholder={t('changeRecipient.selectCity', 'Choisir une ville')}
                      enableSearch
                      searchPlaceholder={t('changeRecipient.searchCity', 'Chercher une ville...')}
                      className="w-56"
                      options={[
                        { value: '', label: t('changeRecipient.selectCity', 'Choisir une ville') },
                        ...cities.map(c => ({ value: c, label: c }))
                      ]}
                    />

                    <button
                      className="kt-btn kt-btn-outline"
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterCity('');
                        setCurrentPage(1);
                      }}
                    >
                      {t('changeRecipient.resetBtn', 'Réinitialiser')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="kt-card-content">
                <div className="kt-scrollable-x-auto">
                  <table className="kt-table table-auto kt-table-border">
                    <thead>
                      <tr>
                        <th className="w-[50px]">
                          <input 
                            className="kt-checkbox kt-checkbox-sm" 
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="min-w-[150px]">{t('changeRecipient.colTrackingCode', 'Code de suivi')}</th>
                        <th className="min-w-[180px]">{t('changeRecipient.colProductName', 'Nom du produit')}</th>
                        <th className="min-w-[160px]">{t('changeRecipient.colPickupDate', 'Date de ramassage')}</th>
                        <th className="min-w-[180px]">{t('changeRecipient.colRecipient', 'Destinataire')}</th>
                        <th className="min-w-[120px]">{t('changeRecipient.colStatus', 'Statut')}</th>
                        <th className="min-w-[140px]">{t('changeRecipient.colCity', 'Ville')}</th>
                        <th className="min-w-[120px]">{t('changeRecipient.colPrice', 'Prix')}</th>
                        <th className="min-w-[220px]">{t('changeRecipient.colComment', 'Commentaire')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginatedColis.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center text-secondary-foreground py-8">
                            {t('changeRecipient.noRecordFound', 'Aucun enregistrement correspondant')}
                          </td>
                        </tr>
                      ) : (
                        paginatedColis.map((colis) => {
                          const isChecked = selectedIds.includes(colis.id);
                          const rawStatut = colis.statutLabel || colis.statut || 'En attente';
                          const displayStatut = formatStatutLabel(rawStatut);
                          const statutBadgeClass = rawStatut === 'Terminé' || rawStatut === 'Livré' ? 'kt-badge-success'
                            : rawStatut === 'En cours' ? 'kt-badge-primary'
                            : rawStatut === 'Reporté' ? 'kt-badge-info'
                            : rawStatut === 'Échec' ? 'kt-badge-destructive'
                            : 'kt-badge-warning';

                          return (
                            <tr key={colis.id} className={isChecked ? 'bg-accent/30' : ''}>
                              <td>
                                <input
                                  className="kt-checkbox kt-checkbox-sm"
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleSelectRow(colis)}
                                />
                              </td>
                              <td className="text-foreground font-medium text-mono">{colis.trackingCode}</td>
                              <td className="text-foreground font-normal">{colis.productNature}</td>
                              <td className="text-foreground font-normal">{colis.createdAt || '-'}</td>
                              <td className="text-foreground font-normal">{colis.recipient || '-'}</td>
                              <td>
                                <span className={`kt-badge ${statutBadgeClass} kt-badge-outline rounded-[30px]`}>
                                  <span className="kt-badge-dot size-1.5"></span>
                                  {displayStatut}
                                </span>
                              </td>
                              <td className="text-foreground font-normal">{colis.city}</td>
                              <td className="text-foreground font-medium">
                                {(colis.price || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                              </td>
                              <td className="text-foreground font-normal">{colis.comment || '-'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer / Pagination */}
                <div className="kt-card-footer justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {t('changeRecipient.show', 'Afficher')}
                    <KtSelect
                      value={String(itemsPerPage)}
                      onChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                      className="w-16"
                      options={perPageOptions}
                    />
                    {t('changeRecipient.perPage', 'par page')}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span>
                      {t('changeRecipient.showing', 'Affichage de')} {totalColis === 0 ? 0 : Math.min(totalColis, (currentPage - 1) * itemsPerPage + 1)} {t('changeRecipient.to', 'à')} {Math.min(totalColis, currentPage * itemsPerPage)} {t('changeRecipient.of', 'sur')} {totalColis} {t('changeRecipient.parcelsCount', 'colis')}
                    </span>
                    {totalPages > 1 && (
                      <div className="flex gap-1">
                        <button 
                          className="kt-btn kt-btn-sm kt-btn-outline px-2"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                          {t('changeRecipient.previous', 'Précédent')}
                        </button>
                        <span className="px-3 py-1 bg-accent/40 rounded text-foreground font-semibold">{currentPage} / {totalPages}</span>
                        <button 
                          className="kt-btn kt-btn-sm kt-btn-outline px-2"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                          {t('changeRecipient.next', 'Suivant')}
                        </button>
                      </div>
                    )}
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
