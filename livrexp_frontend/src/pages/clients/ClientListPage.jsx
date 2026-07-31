import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import SafeAvatar from '../../components/ui/SafeAvatar';

export default function ClientListPage({ navigate, showNotification }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isTarifModalOpen, setIsTarifModalOpen] = useState(false);
  const [selectedClientForTarif, setSelectedClientForTarif] = useState(null);

  // New Client Form
  const [newClientForm, setNewClientForm] = useState({
    businessName: '',
    fullName: '',
    email: '',
    phone: '',
    city: 'Casablanca',
    ice: '',
    creditLimit: 5000,
    tarifSameCity: 35,
    tarifOtherCity: 45,
    tarifReturn: 15
  });

  const DEFAULT_CLIENTS = [
    {
      id: 1,
      businessName: 'Boutique Casa Chic',
      fullName: 'Yassine El Amrani',
      email: 'contact@casachic.ma',
      phone: '0661928301',
      city: 'Casablanca',
      ice: '00281902000039',
      rc: 'RC-49102',
      colisCount: 142,
      tarifSameCity: 30.00,
      tarifOtherCity: 40.00,
      tarifReturn: 15.00,
      creditLimit: 10000.00,
      currentBalance: 3200.00,
      isCreditExceeded: false,
      contractRef: 'CTR-2026-0001',
      contractStatus: 'ACTIF',
      contractDate: '10/01/2026',
      status: 'ACTIF'
    },
    {
      id: 2,
      businessName: 'Maroc Tech Express',
      fullName: 'Sarah Benjeloun',
      email: 'sarah@maroctech.ma',
      phone: '0650982103',
      city: 'Rabat',
      ice: '00192837100045',
      rc: 'RC-38102',
      colisCount: 89,
      tarifSameCity: 35.00,
      tarifOtherCity: 45.00,
      tarifReturn: 15.00,
      creditLimit: 5000.00,
      currentBalance: 5800.00,
      isCreditExceeded: true, // EXCEEDED
      contractRef: 'CTR-2026-0002',
      contractStatus: 'ACTIF',
      contractDate: '15/01/2026',
      status: 'ACTIF'
    },
    {
      id: 3,
      businessName: 'Atlas Mode & Beauty',
      fullName: 'Karim Tazi',
      email: 'k.tazi@atlasmode.ma',
      phone: '0677112233',
      city: 'Marrakech',
      ice: '00381920100088',
      rc: 'RC-99102',
      colisCount: 54,
      tarifSameCity: 35.00,
      tarifOtherCity: 50.00,
      tarifReturn: 20.00,
      creditLimit: 3000.00,
      currentBalance: 950.00,
      isCreditExceeded: false,
      contractRef: 'CTR-2026-0003',
      contractStatus: 'NEGOCIATION',
      contractDate: '01/02/2026',
      status: 'EN_ATTENTE'
    },
    {
      id: 4,
      businessName: 'Electro Rabat',
      fullName: 'Omar Bennani',
      email: 'omar@electrorabat.ma',
      phone: '0612345678',
      city: 'Rabat',
      ice: '00448102900012',
      rc: 'RC-12903',
      colisCount: 210,
      tarifSameCity: 28.00,
      tarifOtherCity: 38.00,
      tarifReturn: 10.00,
      creditLimit: 15000.00,
      currentBalance: 4120.00,
      isCreditExceeded: false,
      contractRef: 'CTR-2026-0004',
      contractStatus: 'ACTIF',
      contractDate: '05/01/2026',
      status: 'ACTIF'
    }
  ];

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/clients', {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.clients && data.clients.length > 0) {
          setClients(data.clients);
        } else {
          setClients(DEFAULT_CLIENTS);
        }
      } else {
        setClients(DEFAULT_CLIENTS);
      }
    } catch (err) {
      console.error('Erreur chargement clients:', err);
      setClients(DEFAULT_CLIENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filter logic
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (client.businessName && client.businessName.toLowerCase().includes(query)) ||
      (client.fullName && client.fullName.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.ice && client.ice.toLowerCase().includes(query));

    const matchesStatut = selectedStatut ? client.status === selectedStatut : true;
    const matchesCity = selectedCity ? client.city === selectedCity : true;

    return matchesSearch && matchesStatut && matchesCity;
  });

  const totalEntries = filteredClients.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Action: Toggle Client Active/Disabled Status
  const handleToggleStatus = async (client) => {
    const newStatus = client.status === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: newStatus } : c));

    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/clients/${client.id}/toggle-status`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch (err) {
      console.error('Erreur toggle status client:', err);
    }

    if (showNotification) {
      showNotification('success', `Compte client ${client.businessName} ${newStatus === 'ACTIF' ? 'activé' : 'suspendu'} avec succès !`);
    }
  };

  // Action: Create New Client
  const handleCreateClient = async (e) => {
    e.preventDefault();
    const newClientObj = {
      id: Date.now(),
      businessName: newClientForm.businessName || 'Nouvelle Boutique',
      fullName: newClientForm.fullName || 'Client Express',
      email: newClientForm.email,
      phone: newClientForm.phone || '0600000000',
      city: newClientForm.city || 'Casablanca',
      ice: newClientForm.ice || '-',
      rc: 'RC-' + Math.floor(10000 + Math.random() * 90000),
      colisCount: 0,
      tarifSameCity: parseFloat(newClientForm.tarifSameCity) || 35.00,
      tarifOtherCity: parseFloat(newClientForm.tarifOtherCity) || 45.00,
      tarifReturn: parseFloat(newClientForm.tarifReturn) || 15.00,
      creditLimit: parseFloat(newClientForm.creditLimit) || 5000.00,
      currentBalance: 0.00,
      isCreditExceeded: false,
      contractRef: `CTR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      contractStatus: 'ACTIF',
      contractDate: new Date().toLocaleDateString('fr-FR'),
      status: 'ACTIF'
    };

    setClients(prev => [newClientObj, ...prev]);
    setIsNewClientModalOpen(false);

    if (showNotification) {
      showNotification('success', `Compte client ${newClientObj.businessName} créé avec succès !`);
    }
  };

  // Action: PDF Service Agreement Generator
  const handlePrintContract = (client) => {
    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Contrat de Service - ${client.businessName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 26px; font-weight: 800; color: #2563eb; }
          .logo span { color: #0f172a; }
          .contract-title { text-align: right; }
          .contract-title h1 { margin: 0; font-size: 18px; color: #0f172a; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; font-size: 12px; }
          td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .footer { margin-top: 50px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Livr<span>Express</span></div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Plateforme Logistique Multi-Client</div>
          </div>
          <div class="contract-title">
            <h1>CONTRAT DE SERVICE LOGISTIQUE</h1>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Réf: ${client.contractRef}</div>
            <div style="font-size: 12px; color: #64748b;">Date d'effet: ${client.contractDate}</div>
          </div>
        </div>

        <div class="box">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">ENTRE LES SOUSSIGNÉS :</div>
          <div style="font-size: 13px; color: #475569;">1. <strong>LivrExpress S.A.R.L</strong>, Société de Transport et Logistique - Casablanca.</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">2. <strong>${client.businessName}</strong> (Représenté par ${client.fullName}), ICE: ${client.ice}, Ville: ${client.city}.</div>
        </div>

        <div style="font-weight: 700; font-size: 14px; margin-bottom: 10px; color: #0f172a;">ARTICLE 1 — GRILLE TARIFAIRE ACCORDÉE</div>
        <table>
          <thead>
            <tr>
              <th>Zone / Prestation</th>
              <th>Tarif Négocié HT (MAD)</th>
              <th>Délai de Livraison</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Livraison Même Ville (${client.city})</td>
              <td style="font-weight: 700; color: #2563eb;">${client.tarifSameCity.toFixed(2)} MAD</td>
              <td>Moins de 24 Heures</td>
            </tr>
            <tr>
              <td>Livraison Inter-Villes (National)</td>
              <td style="font-weight: 700; color: #2563eb;">${client.tarifOtherCity.toFixed(2)} MAD</td>
              <td>24H à 48H</td>
            </tr>
            <tr>
              <td>Traitement Colis Retour Refus</td>
              <td style="font-weight: 700;">${client.tarifReturn.toFixed(2)} MAD</td>
              <td>Retour Hebdomadaire</td>
            </tr>
          </tbody>
        </table>

        <div class="box">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">ARTICLE 2 — PLAFOND DE CRÉDIT ET CONDITIONS DE VIREMENT</div>
          <div style="font-size: 13px; color: #475569;">- Plafond de crédit accordé : <strong>${client.creditLimit.toFixed(2)} MAD</strong>.</div>
          <div style="font-size: 13px; color: #475569;">- Reversement CRBT : Effectué 2 fois par semaine vers le compte RIB enregistré.</div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 60px;">
          <div>
            <div style="font-size: 12px; font-weight: 700;">Pour LivrExpress S.A.R.L</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 40px;">(Signature & Cachet)</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 700;">Pour ${client.businessName}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 40px;">(Signature du Client)</div>
          </div>
        </div>

        <div class="footer">
          Document contractuel généré par la plateforme LivrExpress - Version 2026 Multi-Tenant
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

  // Export CSV Clients
  const handleExportClientsCsv = () => {
    let content = `BOUTIQUE,REPRÉSENTANT,EMAIL,TÉLÉPHONE,VILLE,ICE,COLIS_EXPÉDIÉS,TARIF_MÊME_VILLE,TARIF_HORS_VILLE,PLAFOND_CRÉDIT,SOLDE_ACTUEL,STATUT\n` +
      filteredClients.map(c => `"${c.businessName}","${c.fullName}","${c.email}","${c.phone}","${c.city}","${c.ice}",${c.colisCount},${c.tarifSameCity},${c.tarifOtherCity},${c.creditLimit},${c.currentBalance},"${c.status}"`).join("\n");

    const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Export_Clients_LivrExpress_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showNotification) {
      showNotification('success', 'Export de la liste des clients CSV téléchargé avec succès !');
    }
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="py-4">
          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: '85%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="clients">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header Title & Actions */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">📋 Gestion des Clients & Multi-Tenant</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total clients enregistrés :</span>
                <span className="text-base text-foreground font-medium me-3">{clients.length}</span>
                <span className="text-base text-secondary-foreground">Clients Actifs :</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 me-3">
                  {clients.filter(c => c.status === 'ACTIF').length}
                </span>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportClientsCsv}
                className="kt-btn kt-btn-outline cursor-pointer"
              >
                <i className="ki-filled ki-file-down text-base me-1"></i>
                Export Excel / CSV
              </button>
              <button
                type="button"
                onClick={() => setIsNewClientModalOpen(true)}
                className="kt-btn kt-btn-primary cursor-pointer"
              >
                <i className="ki-filled ki-plus text-base me-1"></i>
                Nouveau Client
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Tenant KPI Summary Cards */}
        <div className="kt-container-fixed mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Comptes Clients Actifs</span>
              <span className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                {clients.filter(c => c.status === 'ACTIF').length} / {clients.length}
              </span>
            </div>

            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Total Colis Multi-Clients</span>
              <span className="text-xl font-semibold text-foreground">
                {clients.reduce((sum, c) => sum + (c.colisCount || 0), 0)} colis
              </span>
            </div>

            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Portefeuille Clients (CRBT)</span>
              <span className="text-xl font-semibold text-foreground">
                {clients.reduce((sum, c) => sum + (c.currentBalance || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
              </span>
            </div>

            <div className="kt-card p-4 flex flex-col gap-1 border border-border/60">
              <span className="text-2sm text-secondary-foreground font-medium">Dépassement Crédit</span>
              <span className="text-xl font-semibold text-rose-600 dark:text-rose-400">
                {clients.filter(c => c.isCreditExceeded || c.currentBalance > c.creditLimit).length} client(s)
              </span>
            </div>

          </div>
        </div>

        {/* Main Table Container */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">

              {/* Table Header Filters */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm font-semibold">Affichage de {totalEntries} client(s)</h3>
                <div className="flex flex-wrap gap-2 lg:gap-4 items-center">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier"></i>
                      <input
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher boutique, ICE, email..."
                        type="text"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={selectedStatut}
                      onChange={(val) => { setSelectedStatut(val); setCurrentPage(1); }}
                      placeholder="Statut"
                      className="w-36"
                      options={[
                        { value: '', label: 'Tous les statuts' },
                        { value: 'ACTIF', label: 'Compte Actif' },
                        { value: 'SUSPENDU', label: 'Compte Suspendu' },
                        { value: 'EN_ATTENTE', label: 'En attente' },
                      ]}
                    />

                    <KtSelect
                      value={selectedCity}
                      onChange={(val) => { setSelectedCity(val); setCurrentPage(1); }}
                      placeholder="Ville"
                      className="w-36"
                      options={[
                        { value: '', label: 'Toutes les villes' },
                        { value: 'Casablanca', label: 'Casablanca' },
                        { value: 'Rabat', label: 'Rabat' },
                        { value: 'Marrakech', label: 'Marrakech' },
                        { value: 'Tanger', label: 'Tanger' },
                      ]}
                    />

                    <button
                      className="kt-btn kt-btn-outline"
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStatut('');
                        setSelectedCity('');
                        setCurrentPage(1);
                      }}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="kt-card-content">
                <div className="kt-scrollable-x-auto">
                  <table className="kt-table table-auto kt-table-border">
                    <thead>
                      <tr>
                        <th className="min-w-[180px]">Boutique / Client</th>
                        <th className="min-w-[160px]">Contact & Ville</th>
                        <th className="min-w-[140px]">Tarif Livraison</th>
                        <th className="min-w-[150px]">Solde & Crédit</th>
                        <th className="min-w-[140px]">Contrat</th>
                        <th className="min-w-[110px]">Statut Compte</th>
                        <th className="min-w-[160px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                      ) : paginatedClients.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-secondary-foreground text-center py-8">
                            Aucun client trouvé.
                          </td>
                        </tr>
                      ) : (
                        paginatedClients.map((client) => {
                          const isExceeded = client.isCreditExceeded || client.currentBalance > client.creditLimit;
                          return (
                            <tr key={client.id}>
                              <td>
                                <div className="flex items-center gap-3">
                                  <SafeAvatar
                                    src={client.avatar}
                                    name={client.businessName || client.fullName}
                                    size={36}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-foreground text-sm">{client.businessName}</span>
                                    <span className="text-xs text-muted-foreground">{client.fullName} • ICE: {client.ice}</span>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <div className="flex flex-col text-xs">
                                  <span className="font-medium text-foreground">{client.email}</span>
                                  <span className="text-muted-foreground">{client.phone} • <strong className="text-foreground">{client.city}</strong></span>
                                </div>
                              </td>

                              <td>
                                <div className="flex flex-col text-xs">
                                  <span className="font-semibold text-primary">Même ville: {client.tarifSameCity.toFixed(2)} MAD</span>
                                  <span className="text-secondary-foreground">National: {client.tarifOtherCity.toFixed(2)} MAD</span>
                                </div>
                              </td>

                              <td>
                                <div className="flex flex-col text-xs">
                                  <span className="font-bold text-foreground">Solde: {client.currentBalance.toFixed(2)} MAD</span>
                                  <span className="text-muted-foreground">Plafond: {client.creditLimit.toFixed(2)} MAD</span>
                                  {isExceeded && (
                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1">
                                      <i className="ki-solid ki-shield-cross text-xs" />
                                      Crédit Dépassé (Blocage)
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td>
                                <div className="flex flex-col text-xs">
                                  <span className="font-mono font-medium text-foreground">{client.contractRef}</span>
                                  <span className={`font-semibold ${client.contractStatus === 'ACTIF' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {client.contractStatus} ({client.contractDate})
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span className={`kt-badge ${client.status === 'ACTIF' ? 'kt-badge-success' : 'kt-badge-destructive'} kt-badge-outline rounded-[30px]`}>
                                  <span className="kt-badge-dot size-1.5"></span>
                                  {client.status === 'ACTIF' ? 'Actif' : 'Suspendu'}
                                </span>
                              </td>

                              <td className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handlePrintContract(client)}
                                    className="kt-btn kt-btn-xs kt-btn-outline cursor-pointer"
                                    title="Télécharger le contrat de service PDF"
                                  >
                                    <i className="ki-filled ki-document text-xs me-1"></i>
                                    Contrat PDF
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(client)}
                                    className={`kt-btn kt-btn-xs ${client.status === 'ACTIF' ? 'kt-btn-outline text-rose-600 border-rose-500/30' : 'kt-btn-primary'} cursor-pointer`}
                                  >
                                    {client.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                                  </button>
                                </div>
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
                      Affichage de {Math.min(totalEntries, (currentPage - 1) * itemsPerPage + 1)} à {Math.min(totalEntries, currentPage * itemsPerPage)} sur {totalEntries} clients
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

        {/* MODAL: CREATE NEW CLIENT */}
        {isNewClientModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <h3 className="font-bold text-base">Nouveau Compte Client Multi-Tenant</h3>
                <button
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground font-bold text-lg border-0 bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="flex flex-col gap-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Nom de la Boutique / Raison Sociale</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Casa Chic SARL"
                      className="kt-input"
                      value={newClientForm.businessName}
                      onChange={(e) => setNewClientForm({ ...newClientForm, businessName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Nom Complet Représentant</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Yassine El Amrani"
                      className="kt-input"
                      value={newClientForm.fullName}
                      onChange={(e) => setNewClientForm({ ...newClientForm, fullName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Email Professionnel</label>
                    <input
                      type="email"
                      required
                      placeholder="contact@boutique.ma"
                      className="kt-input"
                      value={newClientForm.email}
                      onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Téléphone</label>
                    <input
                      type="text"
                      required
                      placeholder="0600000000"
                      className="kt-input"
                      value={newClientForm.phone}
                      onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Ville de Résidence</label>
                    <select
                      className="kt-input"
                      value={newClientForm.city}
                      onChange={(e) => setNewClientForm({ ...newClientForm, city: e.target.value })}
                    >
                      <option value="Casablanca">Casablanca</option>
                      <option value="Rabat">Rabat</option>
                      <option value="Marrakech">Marrakech</option>
                      <option value="Tanger">Tanger</option>
                      <option value="Agadir">Agadir</option>
                      <option value="Fès">Fès</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Numéro ICE</label>
                    <input
                      type="text"
                      placeholder="00298102000099"
                      className="kt-input font-mono text-xs"
                      value={newClientForm.ice}
                      onChange={(e) => setNewClientForm({ ...newClientForm, ice: e.target.value })}
                    />
                  </div>
                </div>

                <hr className="border-border my-1" />
                <h4 className="text-xs font-bold uppercase text-primary">Tarification Négociée & Plafond Crédit</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-secondary-foreground block mb-1">Tarif Même Ville</label>
                    <input
                      type="number"
                      step="0.5"
                      className="kt-input text-xs"
                      value={newClientForm.tarifSameCity}
                      onChange={(e) => setNewClientForm({ ...newClientForm, tarifSameCity: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-secondary-foreground block mb-1">Tarif Inter-Villes</label>
                    <input
                      type="number"
                      step="0.5"
                      className="kt-input text-xs"
                      value={newClientForm.tarifOtherCity}
                      onChange={(e) => setNewClientForm({ ...newClientForm, tarifOtherCity: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-secondary-foreground block mb-1">Plafond Crédit (MAD)</label>
                    <input
                      type="number"
                      step="500"
                      className="kt-input text-xs font-bold text-emerald-600"
                      value={newClientForm.creditLimit}
                      onChange={(e) => setNewClientForm({ ...newClientForm, creditLimit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border mt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewClientModalOpen(false)}
                    className="kt-btn kt-btn-outline cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="kt-btn kt-btn-primary cursor-pointer"
                  >
                    Créer le Compte Client
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
