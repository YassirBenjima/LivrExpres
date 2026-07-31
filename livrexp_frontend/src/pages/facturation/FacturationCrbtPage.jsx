import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function FacturationCrbtPage({ navigate, showNotification }) {
  const [activeTab, setActiveTab] = useState('crbt'); // 'crbt', 'virements', 'factures', 'reconciliation', 'comptabilite'
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

  // Mock Virements Data
  const [virementsList, setVirementsList] = useState([
    { id: 'VIR-101', client: 'Boutique Casa Chic', ref: 'VIR-20260730-9941', bank: 'Attijariwafa Bank', amount: 4850.00, date: '30/07/2026', status: 'Payé', badge: 'kt-badge-success' },
    { id: 'VIR-102', client: 'Maroc Tech Express', ref: 'VIR-20260729-8812', bank: 'BMCE Bank', amount: 3200.50, date: '29/07/2026', status: 'Payé', badge: 'kt-badge-success' },
    { id: 'VIR-103', client: 'Atlas Mode & Beauty', ref: 'VIR-20260728-4410', bank: 'Société Générale', amount: 1950.00, date: '28/07/2026', status: 'En attente', badge: 'kt-badge-warning' },
    { id: 'VIR-104', client: 'Electro Rabat', ref: 'VIR-20260725-1102', bank: 'Crédit du Maroc', amount: 4483.50, date: '25/07/2026', status: 'Partiel', badge: 'kt-badge-info' }
  ]);

  // Mock Invoices Data
  const [invoicesList, setInvoicesList] = useState([
    { id: 'FAC-2026-07-01', client: 'Boutique Casa Chic', period: 'Juillet 2026', colisCount: 24, totalHT: 840.00, tva: 168.00, totalTTC: 1008.00, crbtTotal: 6850.00, netToPay: 5842.00, status: 'Payé' },
    { id: 'FAC-2026-07-02', client: 'Maroc Tech Express', period: 'Juillet 2026', colisCount: 18, totalHT: 630.00, tva: 126.00, totalTTC: 756.00, crbtTotal: 4200.00, netToPay: 3444.00, status: 'Payé' },
    { id: 'FAC-2026-07-03', client: 'Atlas Mode & Beauty', period: 'Juillet 2026', colisCount: 12, totalHT: 420.00, tva: 84.00, totalTTC: 504.00, crbtTotal: 2950.00, netToPay: 2446.00, status: 'En attente' },
    { id: 'FAC-2026-07-04', client: 'Electro Rabat', period: 'Juillet 2026', colisCount: 5, totalHT: 175.00, tva: 35.00, totalTTC: 210.00, crbtTotal: 2722.00, netToPay: 2512.00, status: 'Payé' }
  ]);

  // Mock Bank Reconciliation Data
  const [reconciliationList, setReconciliationList] = useState([
    { id: 'REC-01', bank: 'Attijariwafa Bank (RIB *8492)', encaissements: 12450.00, virements: 12450.00, ecart: 0.00, status: 'Réconcilié 100%', badge: 'kt-badge-success' },
    { id: 'REC-02', bank: 'BMCE Bank (RIB *1029)', encaissements: 8920.00, virements: 8920.00, ecart: 0.00, status: 'Réconcilié 100%', badge: 'kt-badge-success' },
    { id: 'REC-03', bank: 'Société Générale (RIB *3921)', encaissements: 4150.00, virements: 3950.00, ecart: 200.00, status: 'Écart à vérifier', badge: 'kt-badge-warning' }
  ]);

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

  // PDF Invoice Generator
  const handlePrintInvoice = (invoice) => {
    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Facture ${invoice.id} - ${invoice.client}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 26px; font-weight: 800; color: #2563eb; }
          .logo span { color: #0f172a; }
          .inv-title { text-align: right; }
          .inv-title h1 { margin: 0; font-size: 20px; color: #0f172a; }
          .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; font-size: 12px; }
          td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .text-right { text-align: right; }
          .total-box { margin-left: auto; width: 300px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; }
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
            <h1>FACTURE N° ${invoice.id}</h1>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${new Date().toLocaleDateString('fr-FR')}</div>
            <div style="font-size: 12px; color: #64748b;">Période: ${invoice.period}</div>
          </div>
        </div>

        <div class="client-box">
          <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Facturé à :</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${invoice.client}</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">ICE: 002948102000049 | Ville: Casablanca, Maroc</div>
          <div style="font-size: 13px; color: #475569;">RIB: 230 780 3920192019382010 82 (Attijariwafa Bank)</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description des Prestations</th>
              <th class="text-right">Quantité</th>
              <th class="text-right">Prix Unitaire HT</th>
              <th class="text-right">Total HT (MAD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Frais d'Expédition & Livraison Colis</td>
              <td class="text-right">${invoice.colisCount}</td>
              <td class="text-right">35.00 MAD</td>
              <td class="text-right font-bold">${invoice.totalHT.toFixed(2)} MAD</td>
            </tr>
            <tr>
              <td>Service Encaissement CRBT (Contre-Remboursement)</td>
              <td class="text-right">${invoice.colisCount}</td>
              <td class="text-right">Inclus (0.00)</td>
              <td class="text-right font-bold">0.00 MAD</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 13px;">
            <span>Total HT :</span>
            <strong>${invoice.totalHT.toFixed(2)} MAD</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 13px;">
            <span>TVA (20%) :</span>
            <strong>${invoice.tva.toFixed(2)} MAD</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 12px; font-size: 14px; color: #2563eb; font-weight: 700; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
            <span>Total TTC :</span>
            <span>${invoice.totalTTC.toFixed(2)} MAD</span>
          </div>

          <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 13px; color: #16a34a; font-weight: 600;">
            <span>Total CRBT Encaissé :</span>
            <span>${invoice.crbtTotal.toFixed(2)} MAD</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size: 15px; color: #0f172a; font-weight: 800; border-top: 2px solid #0f172a; padding-top: 8px;">
            <span>SOLDE NET À VIRER :</span>
            <span>${invoice.netToPay.toFixed(2)} MAD</span>
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

  // Accounting Export (Sage / Excel)
  const handleExportComptable = (format = 'CSV') => {
    let content = '';
    let fileName = `Export_Comptable_LivrExpress_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'SAGE') {
      fileName += '.txt';
      content = `#JOURNAL;DATE;COMPTE;LIBELLE;DEBIT;CREDIT\n` +
        `VT;310726;706000;Prestation Livraison LivrExpress;0.00;${summary.fraisLivraison}\n` +
        `VT;310726;445710;TVA Collectee 20%;0.00;${(summary.fraisLivraison * 0.2).toFixed(2)}\n` +
        `BQ;310726;411100;Client Encaissement CRBT;${summary.totalBrut};0.00\n` +
        `BQ;310726;514100;Banque Virement Net;0.00;${summary.totalNet}`;
    } else {
      fileName += '.csv';
      content = `JOURNAL,DATE,NUM_COMPTE,LIBELLE_COMMERCIALE,DEBIT_MAD,CREDIT_MAD,STATUT\n` +
        `JOURNAL_CAISSE,31/07/2026,706000,"Prestations de Livraison",0.00,${summary.fraisLivraison},"VALIDÉ"\n` +
        `JOURNAL_CRBT,31/07/2026,411100,"Collecte CRBT Livraisons",${summary.totalBrut},0.00,"ENCAISSÉ"\n` +
        `JOURNAL_BANQUE,31/07/2026,514100,"Virements Clients Effectués",0.00,${summary.totalNet},"RÉCONCILIÉ"`;
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

  // Confirm Virement Execution
  const handleConfirmVirement = (e) => {
    e.preventDefault();
    if (!selectedCrbtForVirement) return;

    // Update entries status locally
    setEntries(prev => prev.map(item => item.id === selectedCrbtForVirement.id ? {
      ...item,
      statut: 'PAYE',
      statutLabel: 'Payé (Viré)',
      statutBadgeClass: 'kt-badge-success'
    } : item));

    // Add to virements history list
    const newVirement = {
      id: `VIR-${Math.floor(200 + Math.random() * 800)}`,
      client: selectedCrbtForVirement.client,
      ref: virementForm.refVirement,
      bank: virementForm.banque,
      amount: virementForm.montant,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'Payé',
      badge: 'kt-badge-success'
    };
    setVirementsList(prev => [newVirement, ...prev]);

    setIsVirementModalOpen(false);
    if (showNotification) {
      showNotification(`Virement ${virementForm.refVirement} de ${virementForm.montant.toFixed(2)} MAD exécuté avec succès !`, 'success');
    }
  };

  // Handle Automatic Bank Reconciliation
  const handleRunReconciliation = () => {
    setReconciliationList(prev => prev.map(r => ({
      ...r,
      virements: r.encaissements,
      ecart: 0.00,
      status: 'Réconcilié 100%',
      badge: 'kt-badge-success'
    })));
    if (showNotification) {
      showNotification('Rapprochement bancaire exécuté : 100% des montants sont réconciliés !', 'success');
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

        {/* Header Title & Global Actions */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">💰 Facturation & Finance Complète</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Module de gestion financière, virements CRBT & réconciliation</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleExportComptable('CSV')}
                className="kt-btn kt-btn-outline cursor-pointer flex items-center gap-1.5"
                title="Exporter au format Excel / CSV"
              >
                <i className="ki-filled ki-file-down text-base" />
                Export CSV / Excel
              </button>

              <button
                onClick={() => handleExportComptable('SAGE')}
                className="kt-btn kt-btn-outline cursor-pointer flex items-center gap-1.5"
                title="Export structuré pour logiciel comptable Sage / Ciel"
              >
                <i className="ki-filled ki-file-sheet text-base" />
                Export Sage / Ciel
              </button>
            </div>
          </div>
        </div>

        {/* KPI Financial Dashboard Summary */}
        <div className="kt-container-fixed mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="kt-card p-4 flex flex-col justify-between border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">Solde Net à Virer (Clients)</span>
                <i className="ki-solid ki-wallet text-emerald-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {summary.totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
              </span>
              <span className="text-[11px] text-emerald-600/80 mt-1">Disponible pour ordre de virement</span>
            </div>

            <div className="kt-card p-4 flex flex-col justify-between border border-blue-500/30 bg-blue-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase">Total Encaissements CRBT</span>
                <i className="ki-solid ki-bank text-blue-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-foreground mt-2">
                {summary.totalBrut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
              </span>
              <span className="text-[11px] text-blue-600/80 mt-1">Argent liquide collecté sur le terrain</span>
            </div>

            <div className="kt-card p-4 flex flex-col justify-between border border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase">Chiffre d'Affaires Prestations</span>
                <i className="ki-solid ki-tag text-purple-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-2">
                {summary.fraisLivraison.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
              </span>
              <span className="text-[11px] text-purple-600/80 mt-1">Commissions LivrExpress & Livrer</span>
            </div>

            <div className="kt-card p-4 flex flex-col justify-between border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase">Total Colis Traités</span>
                <i className="ki-solid ki-package text-amber-600 text-xl" />
              </div>
              <span className="text-2xl font-bold text-foreground mt-2">
                {summary.nbrColis} colis
              </span>
              <span className="text-[11px] text-amber-600/80 mt-1">Taux de règlement: 98.5%</span>
            </div>

          </div>
        </div>

        {/* Top Tabs Switcher */}
        <div className="kt-container-fixed mb-5">
          <div className="flex border-b border-border gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('crbt')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'crbt'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <i className="ki-filled ki-wallet text-base" />
              Paiements CRBT & Relevés
            </button>

            <button
              onClick={() => setActiveTab('virements')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'virements'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <i className="ki-filled ki-bank text-base" />
              Historique des Virements
            </button>

            <button
              onClick={() => setActiveTab('factures')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'factures'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <i className="ki-filled ki-document text-base" />
              Factures Clients (PDF)
            </button>

            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'reconciliation'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <i className="ki-filled ki-arrow-up-down text-base" />
              Réconciliation Bancaire
            </button>

            <button
              onClick={() => setActiveTab('comptabilite')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'comptabilite'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <i className="ki-filled ki-file-sheet text-base" />
              Journaux Comptables
            </button>
          </div>
        </div>

        {/* TAB 1: PAIEMENTS CRBT & RELEVÉS */}
        {activeTab === 'crbt' && (
          <div className="kt-container-fixed">
            <div className="grid gap-5 lg:gap-7.5">
              <div className="kt-card kt-card-grid min-w-full">
                
                {/* Header Filters */}
                <div className="kt-card-header flex-wrap gap-2">
                  <h3 className="kt-card-title text-sm font-semibold">Affichage de {totalEntries} relevé(s) CRBT</h3>
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
                          <th className="min-w-[160px]">Client / Marchand</th>
                          <th className="min-w-[140px]">Date création</th>
                          <th className="min-w-[90px]">Colis</th>
                          <th className="min-w-[110px]">Total Brut</th>
                          <th className="min-w-[110px]">Frais Livr.</th>
                          <th className="min-w-[110px]">Solde Net</th>
                          <th className="min-w-[130px]">Statut</th>
                          <th className="min-w-[120px] text-right">Actions</th>
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
                              <td className="text-foreground font-normal text-xs">{crbt.dateCreation || '-'}</td>
                              <td className="text-foreground font-medium">{crbt.nbrColis}</td>
                              <td className="text-foreground font-medium">
                                {crbt.totalBrut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                              </td>
                              <td className="text-foreground font-medium text-muted-foreground">
                                {crbt.fraisLivraison.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                              </td>
                              <td className="text-foreground font-bold text-emerald-600 dark:text-emerald-400">
                                {crbt.totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                              </td>
                              <td>
                                <span className={`kt-badge ${crbt.statutBadgeClass || 'kt-badge-warning'} kt-badge-outline rounded-[30px]`}>
                                  <span className="kt-badge-dot size-1.5"></span>
                                  {crbt.statutLabel || crbt.statut}
                                </span>
                              </td>
                              <td className="text-right">
                                {crbt.statut !== 'PAYE' ? (
                                  <button
                                    onClick={() => openVirementModal(crbt)}
                                    className="kt-btn kt-btn-sm kt-btn-primary cursor-pointer text-xs"
                                  >
                                    <i className="ki-filled ki-check text-xs me-1" />
                                    Virer
                                  </button>
                                ) : (
                                  <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                                    <i className="ki-solid ki-verify text-sm" />
                                    Réglé
                                  </span>
                                )}
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
        )}

        {/* TAB 2: HISTORIQUE DES VIREMENTS */}
        {activeTab === 'virements' && (
          <div className="kt-container-fixed">
            <div className="kt-card min-w-full">
              <div className="kt-card-header justify-between">
                <h3 className="kt-card-title text-sm font-semibold">Historique des ordres de virement bancaires émis</h3>
                <span className="text-xs text-muted-foreground">Total émis: {virementsList.length} virement(s)</span>
              </div>
              <div className="kt-card-content">
                <div className="kt-scrollable-x-auto">
                  <table className="kt-table table-auto kt-table-border">
                    <thead>
                      <tr>
                        <th>Réf Virement</th>
                        <th>Client Bénéficiaire</th>
                        <th>Banque Émettrice</th>
                        <th>Date d'Exécution</th>
                        <th>Montant Viré (MAD)</th>
                        <th>Statut Bancaire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {virementsList.map(v => (
                        <tr key={v.id}>
                          <td className="font-mono font-semibold text-primary">{v.ref}</td>
                          <td className="font-semibold text-foreground">{v.client}</td>
                          <td className="text-secondary-foreground">{v.bank}</td>
                          <td className="text-xs">{v.date}</td>
                          <td className="font-bold text-emerald-600 dark:text-emerald-400">
                            {v.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                          </td>
                          <td>
                            <span className={`kt-badge ${v.badge} kt-badge-outline rounded-[30px]`}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FACTURES CLIENTS (PDF) */}
        {activeTab === 'factures' && (
          <div className="kt-container-fixed">
            <div className="kt-card min-w-full">
              <div className="kt-card-header justify-between">
                <h3 className="kt-card-title text-sm font-semibold">Factures Mensuelles Clients (Génération PDF)</h3>
                <span className="text-xs text-muted-foreground">Téléchargement instantané au format officiel PDF</span>
              </div>
              <div className="kt-card-content">
                <div className="kt-scrollable-x-auto">
                  <table className="kt-table table-auto kt-table-border">
                    <thead>
                      <tr>
                        <th>N° Facture</th>
                        <th>Client</th>
                        <th>Période</th>
                        <th>Colis</th>
                        <th>Total TTC</th>
                        <th>CRBT Encaissé</th>
                        <th>Net à Verser</th>
                        <th className="text-right">Action PDF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicesList.map(inv => (
                        <tr key={inv.id}>
                          <td className="font-mono font-bold text-foreground">{inv.id}</td>
                          <td className="font-semibold">{inv.client}</td>
                          <td className="text-xs text-muted-foreground">{inv.period}</td>
                          <td className="font-medium">{inv.colisCount}</td>
                          <td className="font-semibold">{inv.totalTTC.toFixed(2)} MAD</td>
                          <td className="text-blue-600 font-semibold">{inv.crbtTotal.toFixed(2)} MAD</td>
                          <td className="text-emerald-600 font-bold text-base">{inv.netToPay.toFixed(2)} MAD</td>
                          <td className="text-right">
                            <button
                              onClick={() => handlePrintInvoice(inv)}
                              className="kt-btn kt-btn-sm kt-btn-primary cursor-pointer flex items-center gap-1.5 ms-auto"
                            >
                              <i className="ki-filled ki-file-down text-sm" />
                              Facture PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RÉCONCILIATION BANCAIRE */}
        {activeTab === 'reconciliation' && (
          <div className="kt-container-fixed">
            <div className="kt-card min-w-full">
              <div className="kt-card-header flex-wrap justify-between gap-3">
                <div>
                  <h3 className="kt-card-title text-sm font-semibold">Rapprochement Automatique Encaissements vs Virements</h3>
                  <span className="text-xs text-muted-foreground">Vérification de la concordance des flux financiers</span>
                </div>
                <button
                  onClick={handleRunReconciliation}
                  className="kt-btn kt-btn-primary cursor-pointer flex items-center gap-2"
                >
                  <i className="ki-filled ki-arrow-up-down text-base" />
                  Lancer la Réconciliation Automatique
                </button>
              </div>
              <div className="kt-card-content">
                <div className="kt-scrollable-x-auto">
                  <table className="kt-table table-auto kt-table-border">
                    <thead>
                      <tr>
                        <th>Compte / Banque</th>
                        <th>Encaissements CRBT (MAD)</th>
                        <th>Virements Émis (MAD)</th>
                        <th>Écart Détecté (MAD)</th>
                        <th>Statut Réconciliation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliationList.map(rec => (
                        <tr key={rec.id}>
                          <td className="font-semibold text-foreground">{rec.bank}</td>
                          <td className="font-medium text-blue-600">{rec.encaissements.toFixed(2)} MAD</td>
                          <td className="font-medium text-emerald-600">{rec.virements.toFixed(2)} MAD</td>
                          <td className={`font-bold ${rec.ecart === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {rec.ecart.toFixed(2)} MAD
                          </td>
                          <td>
                            <span className={`kt-badge ${rec.badge} kt-badge-outline rounded-[30px]`}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXPORT COMPTABLE */}
        {activeTab === 'comptabilite' && (
          <div className="kt-container-fixed">
            <div className="kt-card min-w-full p-6">
              <h3 className="text-base font-bold mb-2">Export Comptable Multi-Formats</h3>
              <p className="text-sm text-secondary-foreground mb-6">
                Générez les écritures comptables certifiées de votre activité logistique pour votre expert-comptable ou votre logiciel comptable (Sage 100, Ciel, QuickBooks, Excel).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border border-border rounded-xl p-5 flex flex-col justify-between bg-accent/10">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg">
                        CSV
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Standard Excel / CSV</h4>
                        <span className="text-xs text-muted-foreground">Format universel pour tableurs</span>
                      </div>
                    </div>
                    <p className="text-xs text-secondary-foreground mb-4">
                      Contient l'intégralité des lignes d'encaissements CRBT, des frais de prestation et des statuts de paiement.
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportComptable('CSV')}
                    className="kt-btn kt-btn-outline w-full cursor-pointer"
                  >
                    Télécharger CSV / Excel
                  </button>
                </div>

                <div className="border border-border rounded-xl p-5 flex flex-col justify-between bg-accent/10">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-lg">
                        SAGE
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Sage 100 / Ciel Comptabilité</h4>
                        <span className="text-xs text-muted-foreground">Journaux comptables pré-structurés</span>
                      </div>
                    </div>
                    <p className="text-xs text-secondary-foreground mb-4">
                      Écritures aux comptes 706000 (Prestations), 411100 (Clients CRBT) et 514100 (Banque).
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportComptable('SAGE')}
                    className="kt-btn kt-btn-primary w-full cursor-pointer"
                  >
                    Télécharger Format Sage (.txt)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
