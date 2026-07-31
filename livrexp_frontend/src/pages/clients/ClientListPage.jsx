import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import SafeAvatar from '../../components/ui/SafeAvatar';

export default function ClientListPage({ navigate, showNotification }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modal State
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
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
      colisCount: 89,
      tarifSameCity: 35.00,
      tarifOtherCity: 45.00,
      tarifReturn: 15.00,
      creditLimit: 5000.00,
      currentBalance: 5800.00,
      isCreditExceeded: true,
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

  const loadData = useCallback(async () => {
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
    } catch {
      setClients(DEFAULT_CLIENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cities filter list
  const cities = [...new Set(clients.map(c => c.city).filter(Boolean))].sort();
  const cityOptions = [{ value: '', label: 'Toutes les villes' }, ...cities.map(c => ({ value: c, label: c }))];
  const statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'ACTIF', label: 'Actif' },
    { value: 'SUSPENDU', label: 'Suspendu' },
    { value: 'EN_ATTENTE', label: 'En attente' }
  ];

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (!search || [c.businessName, c.fullName, c.email, c.phone, c.ice, c.city].some(v => v?.toLowerCase().includes(q)))
      && (!filterCity || c.city === filterCity)
      && (!filterStatut || c.status === filterStatut);
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleReset = () => {
    setSearch('');
    setFilterCity('');
    setFilterStatut('');
    setCurrentPage(1);
  };

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
      console.error('Erreur status client:', err);
    }

    if (showNotification) {
      showNotification('success', `Compte client ${client.businessName} ${newStatus === 'ACTIF' ? 'activé' : 'suspendu'} avec succès !`);
    }
  };

  const handleCreateClient = (e) => {
    e.preventDefault();
    const newClientObj = {
      id: Date.now(),
      businessName: newClientForm.businessName || 'Nouvelle Boutique',
      fullName: newClientForm.fullName || 'Client Express',
      email: newClientForm.email,
      phone: newClientForm.phone || '0600000000',
      city: newClientForm.city || 'Casablanca',
      ice: newClientForm.ice || '-',
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
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Service Facturation & Gestion Clients</div>
          </div>
          <div class="contract-title">
            <h1>CONTRAT DE SERVICE LOGISTIQUE</h1>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Réf: ${client.contractRef}</div>
          </div>
        </div>

        <div class="box">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">ENTRE LES SOUSSIGNÉS :</div>
          <div style="font-size: 13px; color: #475569;">1. <strong>LivrExpress S.A.R.L</strong>, Société de Transport et Logistique.</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">2. <strong>${client.businessName}</strong> (Représenté par ${client.fullName}), ICE: ${client.ice}, Ville: ${client.city}.</div>
        </div>

        <div style="font-weight: 700; font-size: 14px; margin-bottom: 10px; color: #0f172a;">ARTICLE 1 — GRILLE TARIFAIRE ACCORDÉE</div>
        <table>
          <thead>
            <tr>
              <th>Zone / Prestation</th>
              <th>Tarif Négocié HT (MAD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Livraison Même Ville (${client.city})</td>
              <td style="font-weight: 700; color: #2563eb;">${client.tarifSameCity.toFixed(2)} MAD</td>
            </tr>
            <tr>
              <td>Livraison Inter-Villes (National)</td>
              <td style="font-weight: 700; color: #2563eb;">${client.tarifOtherCity.toFixed(2)} MAD</td>
            </tr>
            <tr>
              <td>Traitement Colis Retour Refus</td>
              <td style="font-weight: 700;">${client.tarifReturn.toFixed(2)} MAD</td>
            </tr>
          </tbody>
        </table>

        <div class="box">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">ARTICLE 2 — PLAFOND DE CRÉDIT</div>
          <div style="font-size: 13px; color: #475569;">Plafond de crédit accordé : <strong>${client.creditLimit.toFixed(2)} MAD</strong></div>
        </div>

        <div class="footer">
          Document contractuel généré par la plateforme LivrExpress
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

  const handleExportCsv = () => {
    let content = `BOUTIQUE,REPRÉSENTANT,EMAIL,TÉLÉPHONE,VILLE,ICE,COLIS,TARIF_VILLE,TARIF_NATIONAL,PLAFOND_CRÉDIT,SOLDE,STATUT\n` +
      filtered.map(c => `"${c.businessName}","${c.fullName}","${c.email}","${c.phone}","${c.city}","${c.ice}",${c.colisCount},${c.tarifSameCity},${c.tarifOtherCity},${c.creditLimit},${c.currentBalance},"${c.status}"`).join("\n");

    const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Export_Clients_LivrExpress_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showNotification) {
      showNotification('success', 'Export des clients CSV téléchargé avec succès !');
    }
  };

  return (
    <DashboardLayout activeMenu="clients">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Header (Matching App Design) */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Gestion des Clients</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">Total:</span>
                <span className="text-base text-foreground font-medium me-2">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
                <span className="text-base text-secondary-foreground">Actifs:</span>
                <span className="text-base text-foreground font-medium me-2">{clients.filter(c => c.status === 'ACTIF').length}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="kt-btn kt-btn-outline cursor-pointer"
                onClick={handleExportCsv}
              >
                <i className="ki-filled ki-file-down text-base me-1" /> Export CSV
              </button>
              <button
                type="button"
                className="kt-btn kt-btn-primary cursor-pointer"
                onClick={() => setIsNewClientModalOpen(true)}
              >
                Ajouter un client
              </button>
            </div>
          </div>
        </div>

        {/* Table Container (Matching App Design) */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">

              {/* Card Header & Filters */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">
                  Affichage de {filtered.length} client{filtered.length !== 1 ? 's' : ''}
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier" />
                      <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Rechercher un client ou boutique"
                        type="text"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={filterCity}
                      onChange={(val) => { setFilterCity(val); setCurrentPage(1); }}
                      placeholder="Ville"
                      className="w-40"
                      options={cityOptions}
                    />
                    <KtSelect
                      value={filterStatut}
                      onChange={(val) => { setFilterStatut(val); setCurrentPage(1); }}
                      placeholder="Statut"
                      className="w-40"
                      options={statutOptions}
                    />
                    <button className="kt-btn kt-btn-outline" onClick={handleReset}>
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="kt-card-content">
                <div className="grid">
                  <div className="kt-scrollable-x-auto">
                    <table className="kt-table table-auto kt-table-border">
                      <thead>
                        <tr>
                          <th className="min-w-[200px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Boutique / Client</span></span>
                          </th>
                          <th className="min-w-[130px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Ville</span></span>
                          </th>
                          <th className="min-w-[150px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Tarif Livraison</span></span>
                          </th>
                          <th className="min-w-[150px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Solde & Crédit</span></span>
                          </th>
                          <th className="min-w-[120px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Contrat</span></span>
                          </th>
                          <th className="min-w-[110px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">Statut</span></span>
                          </th>
                          <th className="min-w-[160px] text-right">
                            <span className="kt-table-col"><span className="kt-table-col-label">Actions</span></span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <tr key={`skel-${i}`}>
                              {Array.from({ length: 7 }).map((_, j) => (
                                <td key={j}>
                                  <div style={{ height: '14px', borderRadius: '6px', background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', width: j === 6 ? '80px' : '100%' }} />
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : paginated.length > 0 ? (
                          paginated.map((c) => {
                            const isExceeded = c.isCreditExceeded || c.currentBalance > c.creditLimit;
                            return (
                              <tr key={c.id}>
                                {/* Client / Boutique */}
                                <td>
                                  <div className="flex items-center gap-2.5">
                                    <SafeAvatar
                                      name={c.businessName || c.fullName}
                                      size={36}
                                    />
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-foreground font-medium text-sm">{c.businessName}</span>
                                      <span className="text-xs text-secondary-foreground">{c.fullName} • {c.phone}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Ville */}
                                <td className="text-foreground font-normal">{c.city}</td>

                                {/* Tarif Livraison */}
                                <td>
                                  <div className="flex flex-col text-xs">
                                    <span className="font-semibold text-primary">Même ville: {c.tarifSameCity.toFixed(2)} MAD</span>
                                    <span className="text-secondary-foreground">National: {c.tarifOtherCity.toFixed(2)} MAD</span>
                                  </div>
                                </td>

                                {/* Solde & Crédit */}
                                <td>
                                  <div className="flex flex-col text-xs">
                                    <span className="font-bold text-foreground">Solde: {c.currentBalance.toFixed(2)} MAD</span>
                                    <span className="text-secondary-foreground">Plafond: {c.creditLimit.toFixed(2)} MAD</span>
                                    {isExceeded && (
                                      <span className="text-[10px] font-bold text-destructive mt-0.5 flex items-center gap-1">
                                        <i className="ki-solid ki-shield-cross text-xs" />
                                        Crédit Dépassé
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Contrat */}
                                <td>
                                  <div className="flex flex-col text-xs">
                                    <span className="font-mono text-foreground font-medium">{c.contractRef}</span>
                                    <span className={`font-medium ${c.contractStatus === 'ACTIF' ? 'text-success' : 'text-warning'}`}>{c.contractStatus}</span>
                                  </div>
                                </td>

                                {/* Statut */}
                                <td>
                                  <span className={`kt-badge ${c.status === 'ACTIF' ? 'kt-badge-success' : 'kt-badge-secondary'} kt-badge-outline rounded-[30px]`}>
                                    <span className="kt-badge-dot size-1.5" />
                                    {c.status === 'ACTIF' ? 'Actif' : 'Suspendu'}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handlePrintContract(c)}
                                      className="kt-btn kt-btn-xs kt-btn-outline cursor-pointer"
                                      title="Contrat de service PDF"
                                    >
                                      <i className="ki-filled ki-document text-xs me-1" />
                                      Contrat
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(c)}
                                      className={`kt-btn kt-btn-xs ${c.status === 'ACTIF' ? 'kt-btn-outline' : 'kt-btn-primary'} cursor-pointer`}
                                    >
                                      {c.status === 'ACTIF' ? 'Désactiver' : 'Activer'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-secondary-foreground">
                              Aucun client correspondant
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium py-4">
                    <div className="flex items-center gap-2 order-2 md:order-1">
                      Afficher
                      <KtSelect
                        value={String(perPage)}
                        onChange={(val) => { setPerPage(Number(val)); setCurrentPage(1); }}
                        className="w-16"
                        options={[{ value: '5', label: '5' }, { value: '10', label: '10' }, { value: '20', label: '20' }]}
                      />
                      par page
                    </div>
                    <div className="flex items-center gap-4 order-1 md:order-2">
                      <span>
                        Affichage de {Math.min(filtered.length, (currentPage - 1) * perPage + 1)} à {Math.min(filtered.length, currentPage * perPage)} sur {filtered.length} clients
                      </span>
                      {totalPages > 1 && (
                        <div className="flex gap-1">
                          <button className="kt-btn kt-btn-sm kt-btn-outline px-2" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>Précédent</button>
                          <span className="px-3 py-1 bg-accent/40 rounded text-foreground font-semibold">{currentPage} / {totalPages}</span>
                          <button className="kt-btn kt-btn-sm kt-btn-outline px-2" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>Suivant</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* MODAL: CREATE NEW CLIENT */}
        {isNewClientModalOpen && createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setIsNewClientModalOpen(false)}
          >
            <div
              className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <h3 className="font-bold text-base text-foreground">Nouveau Client Multi-Tenant</h3>
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground font-bold text-lg border-0 bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="flex flex-col gap-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Raison Sociale / Boutique</label>
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
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Représentant Legal</label>
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
                    <label className="text-xs font-semibold text-secondary-foreground block mb-1">Ville</label>
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
                <h4 className="text-xs font-bold uppercase text-primary">Tarification & Plafond Crédit</h4>

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
                    <label className="text-[11px] font-semibold text-secondary-foreground block mb-1">Tarif National</label>
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
                      className="kt-input text-xs font-bold text-success"
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
          </div>,
          document.body
        )}

      </main>
    </DashboardLayout>
  );
}
