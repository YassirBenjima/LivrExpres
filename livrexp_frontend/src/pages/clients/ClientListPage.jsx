import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import SafeAvatar from '../../components/ui/SafeAvatar';
import { useLanguage } from '../../context/LanguageContext';

export default function ClientListPage({ showNotification }) {
  const { t, language } = useLanguage();
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

  useEffect(() => {
    let isMounted = true;

    const fetchClients = async () => {
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
          if (isMounted) setClients(data.clients || data.data || []);
        } else {
          if (isMounted) setClients([]);
        }
      } catch (err) {
        console.error('Erreur chargement clients:', err);
        if (isMounted) setClients([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchClients();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Toggle Status (Active / Suspendu)
  const handleToggleStatus = async (clientItem) => {
    const newStatus = clientItem.status === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    setClients(prev => prev.map(c => c.id === clientItem.id ? { ...c, status: newStatus } : c));

    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/clients/${clientItem.id}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Erreur toggle statut client:', err);
    }

    if (showNotification) {
      showNotification('success', `Statut du client "${clientItem.businessName}" mis à jour avec succès !`);
    }
  };

  // Handle Create Client Form Submit
  const handleCreateClient = async (e) => {
    e.preventDefault();
    const newId = clients.length + 1;
    const newObj = {
      id: newId,
      businessName: newClientForm.businessName,
      fullName: newClientForm.fullName,
      email: newClientForm.email,
      phone: newClientForm.phone,
      city: newClientForm.city,
      ice: newClientForm.ice || '00000000000000',
      colisCount: 0,
      tarifSameCity: parseFloat(newClientForm.tarifSameCity) || 35.00,
      tarifOtherCity: parseFloat(newClientForm.tarifOtherCity) || 45.00,
      tarifReturn: parseFloat(newClientForm.tarifReturn) || 15.00,
      creditLimit: parseFloat(newClientForm.creditLimit) || 5000.00,
      currentBalance: 0.00,
      isCreditExceeded: false,
      contractRef: `CTR-2026-000${newId}`,
      contractStatus: 'ACTIF',
      contractDate: new Date().toLocaleDateString('fr-FR'),
      status: 'ACTIF'
    };

    setClients([newObj, ...clients]);
    setIsNewClientModalOpen(false);

    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/clients/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newClientForm)
      });
    } catch (err) {
      console.error('Erreur création client API:', err);
    }

    if (showNotification) {
      const msg = t('clients.clientCreatedSuccess', `Client "${newClientForm.businessName}" créé avec succès !`).replace('{name}', newClientForm.businessName);
      showNotification('success', msg);
    }

    // Reset Form
    setNewClientForm({
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
  };

  // Service Contract PDF Generator
  const handlePrintContract = (c) => {
    const printWin = window.open('', '_blank', 'width=950,height=1000');
    if (!printWin) return;

    const isEn = language === 'en';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${isEn ? 'Logistics Service Contract' : 'Contrat de Prestation Logistique'} - ${c.businessName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 28px; font-weight: 800; color: #ef4444; letter-spacing: -0.5px; }
          .contract-title { font-size: 18px; font-weight: 700; text-align: right; color: #0f172a; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .meta-box h4 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #64748b; }
          .terms { font-size: 13px; color: #334155; margin-bottom: 30px; text-align: justify; }
          .terms h3 { font-size: 15px; color: #0f172a; margin-top: 20px; }
          .pricing-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .pricing-table th { background: #1e293b; color: white; padding: 10px; text-align: left; font-size: 13px; }
          .pricing-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
          .sig-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; height: 120px; text-align: center; }
          .sig-box strong { display: block; font-size: 14px; color: #475569; margin-bottom: 5px; }
          .sig-box em { font-size: 12px; color: #94a3b8; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">LivrExpress</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${isEn ? 'National Transport & Logistics Network' : 'Réseau National de Transport & Logistique Maroc'}</div>
          </div>
          <div class="contract-title">
            ${isEn ? 'LOGISTICS SERVICE CONTRACT' : 'CONTRAT DE PRESTATION LOGISTIQUE'}
            <div style="font-size: 13px; font-weight: 500; color: #64748b; margin-top: 4px;">${isEn ? 'Ref:' : 'Réf:'} ${c.contractRef || 'CTR-2026-0001'}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <h4>${isEn ? 'PARTNER CLIENT (STORE)' : 'CLIENT PARTENAIRE (BOUTIQUE)'}</h4>
            <div><strong>Raison Sociale :</strong> ${c.businessName}</div>
            <div><strong>Représentant :</strong> ${c.fullName}</div>
            <div><strong>Email :</strong> ${c.email}</div>
            <div><strong>Téléphone :</strong> ${c.phone}</div>
            <div><strong>Ville :</strong> ${c.city}</div>
            <div><strong>ICE :</strong> ${c.ice || '00000000000000'}</div>
          </div>
          <div class="meta-box">
            <h4>${isEn ? 'CARRIER PROVIDER' : 'PRESTATAIRE TRANSPORTEUR'}</h4>
            <div><strong>Société :</strong> LivrExpress S.A.R.L</div>
            <div><strong>Siège Social :</strong> Bd Zerktouni, Casablanca</div>
            <div><strong>ICE :</strong> 002948102000049</div>
            <div><strong>RC :</strong> 49201 Casablanca</div>
            <div><strong>Date de Contrat :</strong> ${c.contractDate || '10/01/2026'}</div>
            <div><strong>Statut :</strong> <span style="color: #16a34a; font-weight: bold;">${c.contractStatus || 'ACTIF'}</span></div>
          </div>
        </div>

        <div class="terms">
          <h3>${isEn ? 'Article 1 — Purpose of the Contract' : 'Article 1 — Objet du contrat'}</h3>
          <p>${isEn ? 'This contract defines the technical, operational and financial conditions under which LivrExpress carries out parcel collection, dispatch, delivery and cash-on-delivery (COD) collection services on behalf of the client store.' : 'Le présent contrat a pour objet de définir les conditions techniques, opérationnelles et financières selon lesquelles la société LivrExpress assure la collecte, le dispatching, la livraison et le recouvrement des montants CRBT des colis pour le compte de la boutique cliente.'}</p>

          <h3>${isEn ? 'Article 2 — Tariff Terms & Delivery Conditions' : 'Article 2 — Grille Tarifaire & Conditions de Livraison'}</h3>
          <table class="pricing-table">
            <thead>
              <tr>
                <th>${isEn ? 'Service Type' : 'Type de Prestation'}</th>
                <th>${isEn ? 'Geographic Coverage' : 'Zone Géographique'}</th>
                <th>${isEn ? 'Unit Rate (Excl. Tax)' : 'Tarif Unitaire (HT)'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${isEn ? 'Same City Delivery' : 'Livraison Urbaine (Même ville)'}</td>
                <td>${c.city}</td>
                <td><strong>${(c.tarifSameCity || 35.00).toFixed(2)} MAD</strong></td>
              </tr>
              <tr>
                <td>${isEn ? 'Inter-city National Delivery' : 'Livraison Inter-villes (National)'}</td>
                <td>${isEn ? 'All Morocco Cities' : 'Toutes villes du Maroc'}</td>
                <td><strong>${(c.tarifOtherCity || 45.00).toFixed(2)} MAD</strong></td>
              </tr>
              <tr>
                <td>${isEn ? 'Returned Parcel Processing' : 'Traitement Colis Retourné'}</td>
                <td>${isEn ? 'National Network' : 'Réseau National'}</td>
                <td><strong>${(c.tarifReturn || 15.00).toFixed(2)} MAD</strong></td>
              </tr>
            </tbody>
          </table>

          <h3>${isEn ? 'Article 3 — Credit Limit & Payment Conditions' : 'Article 3 — Plafond de Crédit & Délais de Virement'}</h3>
          <p>${isEn ? 'A maximum credit limit of' : 'Un plafond de crédit maximal de'} <strong>${(c.creditLimit || 5000.00).toFixed(2)} MAD</strong> ${isEn ? 'is granted to the merchant. Cash on delivery funds (COD) are transferred to the client account via bank transfer twice weekly after delivery validation.' : 'est accordé au commerçant. Les montants des encaissés (CRBT) sont reversés au compte client par virement bancaire 2 fois par semaine après validation de la livraison.'}</p>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <strong>${isEn ? 'For LivrExpress SARL' : 'Pour la Société LivrExpress SARL'}</strong>
            <em>${isEn ? 'Signature & Commercial Stamp' : 'Signature & Cachet Commercial'}</em>
          </div>
          <div class="sig-box">
            <strong>${isEn ? 'For Client Store' : 'Pour la Boutique Cliente'} ${c.businessName}</strong>
            <em>${isEn ? 'Signature & Approval "Read and Approved"' : 'Signature & Mention « Lu et Approuvé »'}</em>
          </div>
        </div>

        <div class="footer">
          LivrExpress S.A.R.L - Capital: 100.000 MAD - RC 49201 Casablanca - IF 4920192 - ICE 002948102000049
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

  // Filter Logic
  const filtered = clients.filter(c => {
    const matchesSearch = search === '' ||
      (c.businessName && c.businessName.toLowerCase().includes(search.toLowerCase())) ||
      (c.fullName && c.fullName.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search)) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()));

    const matchesCity = filterCity === '' || c.city === filterCity;
    const matchesStatut = filterStatut === '' || c.status === filterStatut;

    return matchesSearch && matchesCity && matchesStatut;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const cityOptions = [
    { value: '', label: t('clients.allCities', 'Toutes les villes') },
    { value: 'Casablanca', label: 'Casablanca' },
    { value: 'Rabat', label: 'Rabat' },
    { value: 'Marrakech', label: 'Marrakech' },
    { value: 'Tanger', label: 'Tanger' },
    { value: 'Agadir', label: 'Agadir' },
    { value: 'Fès', label: 'Fès' }
  ];

  const statutOptions = [
    { value: '', label: t('clients.allStatuses', 'Tous les statuts') },
    { value: 'ACTIF', label: t('clients.statusActive', 'Actif') },
    { value: 'INACTIF', label: t('clients.statusSuspended', 'Suspendu') }
  ];

  const handleReset = () => {
    setSearch('');
    setFilterCity('');
    setFilterStatut('');
    setCurrentPage(1);
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
      showNotification('success', t('clients.exportSuccess', 'Export des clients CSV téléchargé avec succès !'));
    }
  };

  const handleFillTestFields = () => {
    const testId = Math.floor(100 + Math.random() * 900);
    setNewClientForm({
      businessName: `Boutique Express ${testId}`,
      fullName: `Mehdi Alami`,
      email: `contact.express${testId}@boutique.ma`,
      phone: `06${Math.floor(10000000 + Math.random() * 89999999)}`,
      city: 'Casablanca',
      ice: `00${Math.floor(100000000000 + Math.random() * 899999999999)}`,
      creditLimit: 8000,
      tarifSameCity: 30,
      tarifOtherCity: 40,
      tarifReturn: 15
    });
  };

  return (
    <DashboardLayout activeMenu="clients">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">{t('clients.title', 'Gestion des Clients')}</h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">{t('clients.total', 'Total :')}</span>
                <span className="text-base text-foreground font-medium me-2">{filtered.length} {t('clients.clients', 'clients')}</span>
                <span className="text-base text-secondary-foreground">{t('clients.activeCount', 'Actifs :')}</span>
                <span className="text-base text-foreground font-medium me-2">{clients.filter(c => c.status === 'ACTIF').length}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="kt-btn kt-btn-outline cursor-pointer"
                onClick={handleExportCsv}
              >
                <i className="ki-filled ki-file-down text-base me-1" /> {t('clients.exportCsv', 'Export CSV')}
              </button>
              <button
                type="button"
                className="kt-btn kt-btn-primary cursor-pointer"
                onClick={() => setIsNewClientModalOpen(true)}
              >
                {t('clients.addClient', 'Ajouter un client')}
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            <div className="kt-card kt-card-grid min-w-full">

              {/* Card Header & Filters */}
              <div className="kt-card-header flex-wrap gap-2">
                <h3 className="kt-card-title text-sm">
                  {t('clients.showingCount', 'Affichage de')} {filtered.length} {t('clients.clientsCount', 'client(s)')}
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-5">
                  <div className="flex">
                    <label className="kt-input">
                      <i className="ki-filled ki-magnifier" />
                      <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder={t('clients.searchPlaceholder', 'Rechercher un client ou boutique...')}
                        type="text"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <KtSelect
                      value={filterCity}
                      onChange={(val) => { setFilterCity(val); setCurrentPage(1); }}
                      placeholder={t('clients.allCities', 'Toutes les villes')}
                      className="w-40"
                      options={cityOptions}
                    />
                    <KtSelect
                      value={filterStatut}
                      onChange={(val) => { setFilterStatut(val); setCurrentPage(1); }}
                      placeholder={t('clients.allStatuses', 'Tous les statuts')}
                      className="w-40"
                      options={statutOptions}
                    />
                    <button className="kt-btn kt-btn-outline" onClick={handleReset}>
                      {t('clients.resetBtn', 'Réinitialiser')}
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
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('clients.colStoreClient', 'Boutique / Client')}</span></span>
                          </th>
                          <th className="min-w-[130px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('clients.colCity', 'Ville')}</span></span>
                          </th>
                          <th className="min-w-[150px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('clients.colRate', 'Tarif Livraison')}</span></span>
                          </th>
                          <th className="min-w-[150px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('clients.colBalanceCredit', 'Solde & Crédit')}</span></span>
                          </th>
                          <th className="min-w-[120px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('clients.colContract', 'Contrat')}</span></span>
                          </th>
                          <th className="min-w-[110px]">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('clients.colStatus', 'Statut')}</span></span>
                          </th>
                          <th className="min-w-[160px] text-right">
                            <span className="kt-table-col"><span className="kt-table-col-label">{t('clients.colActions', 'Actions')}</span></span>
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
                                    <span className="font-semibold text-primary">{t('clients.sameCity', 'Même ville :')} {c.tarifSameCity.toFixed(2)} MAD</span>
                                    <span className="text-secondary-foreground">{t('clients.national', 'National :')} {c.tarifOtherCity.toFixed(2)} MAD</span>
                                  </div>
                                </td>

                                {/* Solde & Crédit */}
                                <td>
                                  <div className="flex flex-col text-xs">
                                    <span className="font-bold text-foreground">{t('clients.balance', 'Solde :')} {c.currentBalance.toFixed(2)} MAD</span>
                                    <span className="text-secondary-foreground">{t('clients.limit', 'Plafond :')} {c.creditLimit.toFixed(2)} MAD</span>
                                    {isExceeded && (
                                      <span className="text-[10px] font-bold text-destructive mt-0.5 flex items-center gap-1">
                                        <i className="ki-solid ki-shield-cross text-xs" />
                                        {t('clients.creditExceeded', 'Crédit Dépassé')}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Contrat */}
                                <td>
                                  <div className="flex flex-col text-xs">
                                    <span className="font-mono text-foreground font-medium">{c.contractRef}</span>
                                    <span className={`font-medium ${c.contractStatus === 'ACTIF' ? 'text-success' : 'text-warning'}`}>
                                      {c.contractStatus === 'ACTIF' ? t('clients.contractStatusActive', 'ACTIF') : c.contractStatus === 'NEGOCIATION' ? t('clients.contractStatusNegotiation', 'NÉGOCIATION') : (c.contractStatus || t('clients.contractStatusUnspecified', 'NON SPÉCIFIÉ'))}
                                    </span>
                                  </div>
                                </td>

                                {/* Statut */}
                                <td>
                                  <span className={`kt-badge ${c.status === 'ACTIF' ? 'kt-badge-success' : 'kt-badge-secondary'} kt-badge-outline rounded-[30px]`}>
                                    <span className="kt-badge-dot size-1.5" />
                                    {c.status === 'ACTIF' ? t('clients.statusActive', 'Actif') : t('clients.statusSuspended', 'Suspendu')}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handlePrintContract(c)}
                                      className="kt-btn kt-btn-xs kt-btn-outline cursor-pointer"
                                      title={t('clients.contractPdf', 'Contrat')}
                                    >
                                      <i className="ki-filled ki-document text-xs me-1" />
                                      {t('clients.contractPdf', 'Contrat')}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(c)}
                                      className={`kt-btn kt-btn-xs ${c.status === 'ACTIF' ? 'kt-btn-outline' : 'kt-btn-primary'} cursor-pointer`}
                                    >
                                      {c.status === 'ACTIF' ? t('clients.deactivate', 'Désactiver') : t('clients.activate', 'Activer')}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-secondary-foreground">
                              {t('clients.noClientFound', 'Aucun client correspondant')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium py-4">
                    <div className="flex items-center gap-2 order-2 md:order-1">
                      {t('clients.show', 'Afficher')}
                      <KtSelect
                        value={String(perPage)}
                        onChange={(val) => { setPerPage(Number(val)); setCurrentPage(1); }}
                        className="w-16"
                        options={[{ value: '5', label: '5' }, { value: '10', label: '10' }, { value: '20', label: '20' }]}
                      />
                      {t('clients.perPage', 'par page')}
                    </div>
                    <div className="flex items-center gap-4 order-1 md:order-2">
                      <span>
                        {t('clients.showing', 'Affichage de')} {filtered.length === 0 ? 0 : Math.min(filtered.length, (currentPage - 1) * perPage + 1)} {t('clients.to', 'à')} {Math.min(filtered.length, currentPage * perPage)} {t('clients.of', 'sur')} {filtered.length} {t('clients.clients', 'clients')}
                      </span>
                      {totalPages > 1 && (
                        <div className="flex gap-1">
                          <button className="kt-btn kt-btn-sm kt-btn-outline px-2" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>{t('clients.previous', 'Précédent')}</button>
                          <span className="px-3 py-1 bg-accent/40 rounded text-foreground font-semibold">{currentPage} / {totalPages}</span>
                          <button className="kt-btn kt-btn-sm kt-btn-outline px-2" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>{t('clients.next', 'Suivant')}</button>
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
            onClick={() => setIsNewClientModalOpen(false)}
          >
            <div
              className="kt-modal-content w-full max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="kt-modal-header">
                <h3 className="kt-modal-title">{t('clients.newClientModalTitle', 'Nouveau client')}</h3>
                <button
                  className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost shrink-0"
                  onClick={() => setIsNewClientModalOpen(false)}
                  type="button"
                >
                  <i className="ki-filled ki-cross"></i>
                </button>
              </div>

              <div className="kt-modal-body px-5 py-5">
                <form onSubmit={handleCreateClient} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">{t('clients.businessNameLabel', 'Raison Sociale / Boutique')}</label>
                      <input
                        type="text"
                        required
                        placeholder={t('clients.businessNamePlaceholder', 'Ex: Casa Chic SARL')}
                        className="kt-input"
                        value={newClientForm.businessName}
                        onChange={(e) => setNewClientForm({ ...newClientForm, businessName: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="grid grid-cols-1 gap-1.5">
                        <label className="text-sm font-medium text-mono text-foreground">{t('clients.fullNameLabel', 'Représentant Légal')}</label>
                        <input
                          type="text"
                          required
                          placeholder={t('clients.fullNamePlaceholder', 'Ex: Yassine El Amrani')}
                          className="kt-input"
                          value={newClientForm.fullName}
                          onChange={(e) => setNewClientForm({ ...newClientForm, fullName: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">{t('clients.emailLabel', 'Email Professionnel')}</label>
                      <input
                        type="email"
                        required
                        placeholder="contact@boutique.ma"
                        className="kt-input"
                        value={newClientForm.email}
                        onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">{t('clients.phoneLabel', 'Téléphone')}</label>
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
                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">{t('clients.city', 'Ville')}</label>
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

                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">{t('clients.iceLabel', 'Numéro ICE')}</label>
                      <input
                        type="text"
                        placeholder="00298102000099"
                        className="kt-input font-mono text-xs"
                        value={newClientForm.ice}
                        onChange={(e) => setNewClientForm({ ...newClientForm, ice: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border mt-1">
                    <h4 className="text-xs font-bold uppercase text-primary mb-3 me-1">{t('clients.rateSectionTitle', 'Tarification & Plafond Crédit')}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="grid grid-cols-1 gap-1.5">
                        <label className="text-xs font-medium text-mono text-foreground">{t('clients.sameCityRate', 'Même Ville (MAD)')}</label>
                        <input
                          type="number"
                          step="0.5"
                          className="kt-input"
                          value={newClientForm.tarifSameCity}
                          onChange={(e) => setNewClientForm({ ...newClientForm, tarifSameCity: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        <label className="text-xs font-medium text-mono text-foreground">{t('clients.nationalRate', 'National (MAD)')}</label>
                        <input
                          type="number"
                          step="0.5"
                          className="kt-input"
                          value={newClientForm.tarifOtherCity}
                          onChange={(e) => setNewClientForm({ ...newClientForm, tarifOtherCity: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        <label className="text-xs font-medium text-mono text-foreground">{t('clients.maxCredit', 'Crédit Max (MAD)')}</label>
                        <input
                          type="number"
                          step="500"
                          className="kt-input font-bold text-success"
                          value={newClientForm.creditLimit}
                          onChange={(e) => setNewClientForm({ ...newClientForm, creditLimit: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                    <button
                      type="button"
                      onClick={handleFillTestFields}
                      className="kt-btn kt-btn-outline cursor-pointer"
                      style={{ borderColor: '#e4e6ef', backgroundColor: '#f5f8fa', color: '#3f4254' }}
                    >
                      <i className="ki-filled ki-magic-wand text-xs me-1" />
                      {t('clients.fillTest', 'Remplir (Test)')}
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsNewClientModalOpen(false)}
                        className="kt-btn kt-btn-outline cursor-pointer"
                      >
                        {t('clients.cancel', 'Annuler')}
                      </button>
                      <button
                        type="submit"
                        className="kt-btn kt-btn-primary cursor-pointer"
                      >
                        {t('clients.createClient', 'Créer le client')}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      </main>
    </DashboardLayout>
  );
}
