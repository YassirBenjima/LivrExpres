import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function RetourDemandeNewPage({ navigate, showNotification }) {
  const { t } = useLanguage();
  const [availableColis, setAvailableColis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [receptionType, setReceptionType] = useState('En Agence');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/retour/demandes/new-data?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAvailableColis(data.available_colis || []);
        if (data.reception_type) {
          setReceptionType(data.reception_type);
        }
      }
    } catch (err) {
      console.error('Erreur chargement données nouvelle demande:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        await fetchData();
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = paginatedColis.map(c => c.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIdsSet = new Set(paginatedColis.map(c => c.id));
      setSelectedIds(selectedIds.filter(id => !pageIdsSet.has(id)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      showNotification?.('error', t('returns.selectAtLeastOne', 'Veuillez sélectionner au moins un colis.'));
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        colis_ids: selectedIds,
        reception_type: receptionType,
        note: note
      };

      const res = await fetch('/api/retour/demandes/create', {
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
        showNotification?.('success', data.message || t('returns.createSuccess', 'Demande créée avec succès.'));
        navigate('/retour/demandes');
      } else {
        showNotification?.('error', data.message || t('returns.createError', 'Erreur lors de la création.'));
      }
    } catch (err) {
      console.error('Erreur lors de la création de la demande de retour:', err);
      showNotification?.('error', t('returns.serverError', 'Erreur de communication avec le serveur.'));
    } finally {
      setSubmitting(false);
    }
  };

  const totalColis = availableColis.length;
  const totalPages = Math.ceil(totalColis / itemsPerPage);
  const paginatedColis = availableColis.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const allVisibleSelected = paginatedColis.length > 0 && paginatedColis.every(c => selectedIds.includes(c.id));

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
              width: i === 0 ? '20px' : i === 1 ? '110px' : '85%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="retour_demandes">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">{t('returns.newRequestTitle', 'Demander le retour de colis')}</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">{t('returns.totalEligibleParcels', 'Total colis éligibles :')}</span>
                <span className="text-base text-foreground font-medium">{totalColis}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                className="kt-btn kt-btn-outline"
                onClick={() => navigate('/retour/demandes')}
              >
                {t('returns.backToRequests', 'Retour aux demandes')}
              </button>
            </div>
          </div>
        </div>

        {/* Form & Table */}
        <div className="kt-container-fixed">
          <form onSubmit={handleSubmit}>
            <div className="kt-card border border-border/60 mb-5">
              <div className="kt-card-content p-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex flex-wrap items-end gap-4 grow">
                    <div className="flex flex-col gap-1.5 min-w-[200px]">
                      <label className="text-sm font-medium text-foreground">{t('returns.receptionTypeLabel', 'Type de réception')}</label>
                      <KtSelect
                        value={receptionType}
                        onChange={(val) => setReceptionType(val)}
                        placeholder={t('returns.selectType', 'Choisir le type')}
                        className="w-full"
                        options={[
                          { value: 'En Agence', label: t('returns.atBranch', 'En Agence') },
                          { value: 'À Domicile', label: t('returns.atHome', 'À Domicile') },
                        ]}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 grow min-w-[250px]">
                      <label className="text-sm font-medium text-foreground">{t('returns.noteOptional', 'Note / Remarque (Optionnel)')}</label>
                      <input
                        className="kt-input w-full"
                        placeholder={t('returns.addNotePlaceholder', 'Ajouter une remarque...')}
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="kt-badge kt-badge-info kt-badge-outline rounded-[30px]">
                      <span className="kt-badge-dot size-1.5"></span>
                      {selectedIds.length}&nbsp;{t('returns.selectedCount', 'sélectionné(s)')}
                    </span>
                    <button
                      className="kt-btn kt-btn-primary"
                      type="submit"
                      disabled={selectedIds.length === 0 || submitting}
                    >
                      <i className="ki-filled ki-check"></i>
                      {submitting ? t('returns.submitting', 'Validation...') : t('returns.submitRequest', 'Valider la demande')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="kt-card kt-card-grid min-w-full">
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">{t('returns.selectParcelsTitle', 'Sélectionner les colis à retourner')}</h3>
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
              </div>

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
                        <th className="min-w-[150px]">{t('returns.colTrackingCodeShort', 'Code suivi')}</th>
                        <th className="min-w-[160px]">{t('returns.colProductName', 'Nom du produit')}</th>
                        <th className="min-w-[150px]">{t('returns.colCreationDateShort', 'Date création')}</th>
                        <th className="min-w-[160px]">{t('returns.colRecipient', 'Destinataire')}</th>
                        <th className="min-w-[130px]">{t('returns.colPhone', 'Téléphone')}</th>
                        <th className="min-w-[140px]">{t('returns.colCity', 'Ville')}</th>
                        <th className="min-w-[180px]">{t('returns.colAddress', 'Adresse')}</th>
                        <th className="min-w-[120px]">{t('returns.colPrice', 'Prix')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginatedColis.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-secondary-foreground text-center py-8">
                            {t('returns.noEligibleParcel', 'Aucun colis éligible au retour.')}
                          </td>
                        </tr>
                      ) : (
                        paginatedColis.map((colis) => {
                          const isChecked = selectedIds.includes(colis.id);
                          return (
                            <tr key={colis.id} className={isChecked ? 'bg-accent/30' : ''}>
                              <td>
                                <input
                                  className="kt-checkbox kt-checkbox-sm"
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleSelectRow(colis.id)}
                                />
                              </td>
                              <td className="text-foreground font-medium text-mono">{colis.trackingCode}</td>
                              <td className="text-foreground font-normal">{colis.productNature}</td>
                              <td className="text-foreground font-normal">{colis.createdAt || '-'}</td>
                              <td className="text-foreground font-normal">{colis.recipient}</td>
                              <td className="text-foreground font-normal">{colis.phoneNumber}</td>
                              <td className="text-foreground font-normal">{colis.city}</td>
                              <td className="text-foreground font-normal">{colis.address}</td>
                              <td className="text-foreground font-medium">
                                {(colis.price || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Pagination */}
                <div className="kt-card-footer justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {t('returns.show', 'Afficher')}
                    <KtSelect
                      value={String(itemsPerPage)}
                      onChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                      className="w-16"
                      options={[
                        { value: '5', label: '5' },
                        { value: '10', label: '10' },
                        { value: '20', label: '20' },
                      ]}
                    />
                    {t('returns.perPage', 'par page')}
                  </div>

                  <div className="flex items-center gap-4">
                    <span>
                      {t('returns.showing', 'Affichage de')} {totalColis === 0 ? 0 : Math.min(totalColis, (currentPage - 1) * itemsPerPage + 1)} {t('returns.to', 'à')} {Math.min(totalColis, currentPage * itemsPerPage)} {t('returns.of', 'sur')} {totalColis} {t('changeRecipient.parcelsCount', 'colis')}
                    </span>
                    {totalPages > 1 && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="kt-btn kt-btn-sm kt-btn-outline px-2"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                          {t('returnSlips.previous', 'Précédent')}
                        </button>
                        <span className="px-3 py-1 bg-accent/40 rounded text-foreground font-semibold">{currentPage} / {totalPages}</span>
                        <button
                          type="button"
                          className="kt-btn kt-btn-sm kt-btn-outline px-2"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                          {t('returnSlips.next', 'Suivant')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </form>
        </div>
      </main>
    </DashboardLayout>
  );
}
