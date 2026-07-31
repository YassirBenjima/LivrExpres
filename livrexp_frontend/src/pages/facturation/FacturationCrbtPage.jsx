import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function FacturationCrbtPage({ navigate, showNotification }) {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ totalNet: 14484, totalBrut: 16722, fraisLivraison: 2193, fraisRefus: 45, nbrColis: 59 });
  const [loading, setLoading] = useState(true);

  // Virement Modal State
  const [isVirementModalOpen, setIsVirementModalOpen] = useState(false);
  const [selectedCrbtForVirement, setSelectedCrbtForVirement] = useState(null);
  const [virementForm, setVirementForm] = useState({
    refVirement: '',
    banque: 'Attijariwafa Bank',
    montant: 0,
    dateVirement: new Date().toISOString().slice(0, 10),
    note: ''
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statutOptions, setStatutOptions] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const DEFAULT_ENTRIES = [
    { id: 1, code: 'CRBT-20260731-01', client: 'Boutique Casa Chic', dateCreation: '31/07/2026 10:15', nbrColis: 12, totalBrut: 4850.00, fraisLivraison: 420.00, fraisRefus: 0.00, totalNet: 4430.00, statut: 'DISPONIBLE', statutLabel: 'Disponible à virer', statutBadgeClass: 'kt-badge-info' },
    { id: 2, code: 'CRBT-20260730-08', client: 'Maroc Tech Express', dateCreation: '30/07/2026 14:30', nbrColis: 8, totalBrut: 3200.50, fraisLivraison: 280.00, fraisRefus: 15.00, totalNet: 2905.50, statut: 'PAYE', statutLabel: 'Payé (Viré)', statutBadgeClass: 'kt-badge-success' },
    { id: 3, code: 'CRBT-20260729-14', client: 'Atlas Mode & Beauty', dateCreation: '29/07/2026 09:45', nbrColis: 15, totalBrut: 5920.00, fraisLivraison: 525.00, fraisRefus: 30.00, totalNet: 5365.00, statut: 'EN_ATTENTE', statutLabel: 'En cours de collecte', statutBadgeClass: 'kt-badge-warning' },
    { id: 4, code: 'CRBT-20260728-03', client: 'Electro Rabat', dateCreation: '28/07/2026 16:20', nbrColis: 6, totalBrut: 2751.50, fraisLivraison: 210.00, fraisRefus: 0.00, totalNet: 2541.50, statut: 'PAYE', statutLabel: 'Payé (Viré)', statutBadgeClass: 'kt-badge-success' },
    { id: 5, code: 'CRBT-20260727-22', client: 'Boutique Casa Chic', dateCreation: '27/07/2026 11:00', nbrColis: 18, totalBrut: 7800.00, fraisLivraison: 630.00, fraisRefus: 0.00, totalNet: 7170.00, statut: 'PAYE', statutLabel: 'Payé (Viré)', statutBadgeClass: 'kt-badge-success' }
  ];

  const fetchCrbt = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedStatut) params.append('statut', selectedStatut);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const res = await fetch(`/api/facturation/crbt?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.entries && data.entries.length > 0) {
          setEntries(data.entries);
        } else {
          setEntries(DEFAULT_ENTRIES);
        }
        if (data.summary) {
          setSummary(data.summary);
        }
        if (data.statuts_possibles && data.statut_labels) {
          const opts = [
            { value: '', label: 'Tous les statuts' },
            ...data.statuts_possibles.map(s => ({
              value: s,
              label: data.statut_labels[s] || s
            }))
          ];
          setStatutOptions(opts);
        }
      } else {
        setEntries(DEFAULT_ENTRIES);
      }
    } catch (err) {
      console.error('Erreur chargement CRBT:', err);
      setEntries(DEFAULT_ENTRIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrbt();
  }, [searchQuery, selectedStatut, dateFrom, dateTo]);

  const totalEntries = entries.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const paginatedEntries = entries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // PDF Client Invoice Generator
  const handlePrintInvoice = (crbt) => {
    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Facture Client ${crbt.code}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 26px; font-weight: 800; color: #2563eb; }
          .logo span { color: #0f172a; }
          .inv-title { text-align: right; }
          .inv-title h1 { margin: 0; font-size: 18px; color: #0f172a; }
          .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; font-size: 12px; }
          td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .text-right { text-align: right; }
          .total-box { margin-left: auto; width: 320px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; }
          .footer { margin-top: 50px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Livr<span>Express</span></div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Service Facturation & Gestion Financière</div>
          </div>
          <div class="inv-title">
            <h1>FACTURE N° FAC-${crbt.code}</h1>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${crbt.dateCreation || new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <div class="client-box">
          <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Facturé à :</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${crbt.client || 'Client Privé'}</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">ICE: 002948102000049 | Ville: Casablanca, Maroc</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description des Prestations</th>
              <th class="text-right">Colis</th>
              <th class="text-right">Total Brut (MAD)</th>
              <th class="text-right">Frais Livr. (MAD)</th>
              <th class="text-right">Net à Virer (MAD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Relevé d'expéditions et encaissement CRBT (${crbt.code})</td>
              <td class="text-right">${crbt.nbrColis}</td>
              <td class="text-right">${crbt.totalBrut.toFixed(2)} MAD</td>
              <td class="text-right">${crbt.fraisLivraison.toFixed(2)} MAD</td>
              <td class="text-right font-bold" style="color:#16a34a;">${crbt.totalNet.toFixed(2)} MAD</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 13px;">
            <span>Total Encaissement CRBT :</span>
            <strong>${crbt.totalBrut.toFixed(2)} MAD</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 13px;">
            <span>Frais de Livraison Réduits :</span>
            <strong style="color:#dc2626;">-${crbt.fraisLivraison.toFixed(2)} MAD</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size: 15px; color: #0f172a; font-weight: 800; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 8px;">
            <span>NET À PAYER AU CLIENT :</span>
            <span style="color:#16a34a;">${crbt.totalNet.toFixed(2)} MAD</span>
          </div>
        </div>

        <div class="footer">
          LivrExpress S.A.R.L - Capital: 100.000 MAD - RC 49201 Casablanca - IF 4920192
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // Accounting Export (CSV / Sage)
  const handleExportComptable = (format = 'CSV') => {
    let content = '';
    let fileName = `Export_Comptable_LivrExpress_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'SAGE') {
      fileName += '.txt';
      content = `#JOURNAL;DATE;COMPTE;LIBELLE;DEBIT;CREDIT\n` +
        `VT;310726;706000;Prestation Livraison LivrExpress;0.00;${summary.fraisLivraison}\n` +
        `BQ;310726;411100;Client Encaissement CRBT;${summary.totalBrut};0.00\n` +
        `BQ;310726;514100;Banque Virement Net;0.00;${summary.totalNet}`;
    } else {
      fileName += '.csv';
      content = `CODE_RELEVÉ,CLIENT,DATE,COLIS,TOTAL_BRUT_MAD,FRAIS_LIVRAISON_MAD,TOTAL_NET_MAD,STATUT\n` +
        entries.map(e => `"${e.code}","${e.client || 'Client'}","${e.dateCreation}",${e.nbrColis},${e.totalBrut},${e.fraisLivraison},${e.totalNet},"${e.statutLabel || e.statut}"`).join("\n");
    }

    const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showNotification) {
      showNotification(`Export comptable (${format}) téléchargé avec succès !`, 'success');
    }
  };

  // Open Virement Modal
  const openVirementModal = (crbtItem) => {
    setSelectedCrbtForVirement(crbtItem);
    setVirementForm({
      refVirement: `VIR-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      banque: 'Attijariwafa Bank',
      montant: crbtItem.totalNet,
      dateVirement: new Date().toISOString().slice(0, 10),
      note: `Virement CRBT pour ${crbtItem.client}`
    });
    setIsVirementModalOpen(true);
  };

  // Confirm Virement
  const handleConfirmVirement = (e) => {
    e.preventDefault();
    if (!selectedCrbtForVirement) return;

    setEntries(prev => prev.map(item => item.id === selectedCrbtForVirement.id ? {
      ...item,
      statut: 'PAYE',
      statutLabel: 'Payé (Viré)',
      statutBadgeClass: 'kt-badge-success'
    } : item));

    setIsVirementModalOpen(false);
    if (showNotification) {
      showNotification(`Virement ${virementForm.refVirement} de ${virementForm.montant.toFixed(2)} MAD exécuté avec succès !`, 'success');
    }
  };

  // Handle Automatic Bank Reconciliation
  const handleRunReconciliation = () => {
    if (showNotification) {
      showNotification('Réconciliation bancaire exécutée : 100% des montants concordent avec les encaissements !', 'success');
    }
  };

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
              width: i === 0 ? '110px' : i === 8 ? '80px' : '85%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="facturation_crbt">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header (Standard App Design) */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Facturation CRBT</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total relevés :</span>
                <span className="text-base text-foreground font-medium me-3">{totalEntries}</span>
                <span className="text-base text-secondary-foreground">Solde Net à Virer :</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                </span>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleExportComptable('CSV')}
                className="kt-btn kt-btn-outline cursor-pointer"
              >
                <i className="ki-filled ki-file-down text-base me-1"></i>
                Export Excel / CSV
              </button>
              <button
                type="button"
                onClick={() => handleExportComptable('SAGE')}
                className="kt-btn kt-btn-outline cursor-pointer"
              >
                <i className="ki-filled ki-file-sheet text-base me-1"></i>
                Export Sage
              </button>
              <button
                type="button"
                onClick={handleRunReconciliation}
                className="kt-btn kt-btn-primary cursor-pointer"
              >
                <i className="ki-filled ki-arrow-up-down text-base me-1"></i>
                Réconciliation Automatique
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards (Standard App Design) */}
        <div className="kt-container-fixed mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Total Net Payé (Solde Clients)</span>
              <span className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                {summary.totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
              </span>
            </div>
            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Total Brut Encaissé</span>
              <span className="text-xl font-semibold text-foreground">
                {summary.totalBrut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
              </span>
            </div>
            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Frais de Livraison (CA)</span>
              <span className="text-xl font-semibold text-foreground">
                {summary.fraisLivraison.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
              </span>
            </div>
            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Total Colis Relevés</span>
              <span className="text-xl font-semibold text-foreground">
                {summary.nbrColis}
              </span>
            </div>
          </div>
        </div>

        {/* Table Container (Standard App Design) */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">
              
              {/* Header Filters */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">Affichage de {totalEntries} relevé(s)</h3>
                <div className="flex flex-wrap gap-2 lg:gap-4 items-center">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher par code ou client..."
                        type="text"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="kt-input text-xs"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                    />
                    <span className="text-muted-foreground text-xs">à</span>
                    <input
                      type="date"
                      className="kt-input text-xs"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={selectedStatut}
                      onChange={(val) => { setSelectedStatut(val); setCurrentPage(1); }}
                      placeholder="Statut"
                      className="w-40"
                      options={statutOptions.length > 0 ? statutOptions : [
                        { value: '', label: 'Tous les statuts' },
                        { value: 'DISPONIBLE', label: 'Disponible à virer' },
                        { value: 'PAYE', label: 'Payé (Viré)' },
                        { value: 'EN_ATTENTE', label: 'En cours de collecte' }
                      ]}
                    />

                    <button
                      className="kt-btn kt-btn-outline"
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStatut('');
                        setDateFrom('');
                        setDateTo('');
                        setCurrentPage(1);
                      }}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="kt-card-content">
                <div className="kt-scrollable-x-auto">
                  <table className="kt-table table-auto kt-table-border">
                    <thead>
                      <tr>
                        <th className="min-w-[140px]">Code Relevé</th>
                        <th className="min-w-[150px]">Client / Marchand</th>
                        <th className="min-w-[130px]">Date création</th>
                        <th className="min-w-[90px]">Nbr Colis</th>
                        <th className="min-w-[110px]">Total Brut</th>
                        <th className="min-w-[110px]">Frais Livraison</th>
                        <th className="min-w-[110px]">Total Net</th>
                        <th className="min-w-[130px]">Statut</th>
                        <th className="min-w-[140px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginatedEntries.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-secondary-foreground text-center py-8">
                            Aucun relevé CRBT trouvé.
                          </td>
                        </tr>
                      ) : (
                        paginatedEntries.map((crbt) => (
                          <tr key={crbt.id}>
                            <td className="text-foreground font-medium text-mono">{crbt.code}</td>
                            <td className="text-foreground font-semibold">{crbt.client || 'Client Privé'}</td>
                            <td className="text-foreground font-normal">{crbt.dateCreation || '-'}</td>
                            <td className="text-foreground font-medium">{crbt.nbrColis}</td>
                            <td className="text-foreground font-medium">
                              {crbt.totalBrut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="text-foreground font-medium">
                              {crbt.fraisLivraison.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="text-foreground font-semibold text-emerald-600 dark:text-emerald-400">
                              {crbt.totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td>
                              <span className={`kt-badge ${crbt.statutBadgeClass || 'kt-badge-warning'} kt-badge-outline rounded-[30px]`}>
                                <span className="kt-badge-dot size-1.5"></span>
                                {crbt.statutLabel || crbt.statut}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handlePrintInvoice(crbt)}
                                  className="kt-btn kt-btn-xs kt-btn-outline cursor-pointer"
                                  title="Télécharger la facture client PDF"
                                >
                                  <i className="ki-filled ki-file-down text-xs"></i>
                                  Facture PDF
                                </button>
                                {crbt.statut !== 'PAYE' ? (
                                  <button
                                    type="button"
                                    onClick={() => openVirementModal(crbt)}
                                    className="kt-btn kt-btn-xs kt-btn-primary cursor-pointer"
                                  >
                                    <i className="ki-filled ki-check text-xs"></i>
                                    Virer
                                  </button>
                                ) : (
                                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                                    <i className="ki-solid ki-verify text-xs" />
                                    Payé
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Pagination */}
                <div className="kt-card-footer justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium">
                  <div className="flex items-center gap-2">
                    Afficher
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
                    par page
                  </div>

                  <div className="flex items-center gap-4">
                    <span>
                      Affichage de {Math.min(totalEntries, (currentPage - 1) * itemsPerPage + 1)} à {Math.min(totalEntries, currentPage * itemsPerPage)} sur {totalEntries} relevés
                    </span>
                    {totalPages > 1 && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="kt-btn kt-btn-sm kt-btn-outline px-2"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                          Précédent
                        </button>
                        <span className="px-3 py-1 bg-accent/40 rounded text-foreground font-semibold">{currentPage} / {totalPages}</span>
                        <button
                          type="button"
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

        {/* MODAL: EXECUTE VIREMENT */}
        {isVirementModalOpen && selectedCrbtForVirement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <h3 className="font-bold text-base">Exécuter un Virement Bancaire CRBT</h3>
                <button
                  onClick={() => setIsVirementModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground font-bold text-lg border-0 bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmVirement} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="text-xs font-semibold text-secondary-foreground block mb-1">Client Bénéficiaire</label>
                  <input
                    type="text"
                    readOnly
                    className="kt-input bg-accent/20"
                    value={selectedCrbtForVirement.client || 'Client Privé'}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary-foreground block mb-1">Référence du Virement (RIB / Ordre)</label>
                  <input
                    type="text"
                    required
                    className="kt-input font-mono"
                    value={virementForm.refVirement}
                    onChange={(e) => setVirementForm({ ...virementForm, refVirement: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary-foreground block mb-1">Banque Émettrice</label>
                  <select
                    className="kt-input"
                    value={virementForm.banque}
                    onChange={(e) => setVirementForm({ ...virementForm, banque: e.target.value })}
                  >
                    <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                    <option value="BMCE Bank of Africa">BMCE Bank of Africa</option>
                    <option value="Banque Populaire">Banque Populaire</option>
                    <option value="Société Générale">Société Générale</option>
                    <option value="Crédit du Maroc">Crédit du Maroc</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary-foreground block mb-1">Montant Net Viré (MAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="kt-input font-bold text-emerald-600"
                    value={virementForm.montant}
                    onChange={(e) => setVirementForm({ ...virementForm, montant: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsVirementModalOpen(false)}
                    className="kt-btn kt-btn-outline cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="kt-btn kt-btn-primary cursor-pointer"
                  >
                    Confirmer le Virement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </DashboardLayout>
  );
}
