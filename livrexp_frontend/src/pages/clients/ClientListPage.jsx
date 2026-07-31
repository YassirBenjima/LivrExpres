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
    const printWin = window.open('', '_blank', 'width=950,height=1000');
    if (!printWin) return;

    const todayDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Contrat de Service Logistique - ${client.businessName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          
          @page {
            size: A4;
            margin: 15mm;
          }

          * { box-sizing: border-box; }
          
          body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            color: #0f172a;
            background: #ffffff;
            line-height: 1.5;
            padding: 30px;
            margin: 0;
            font-size: 13px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 18px;
            margin-bottom: 24px;
          }

          .brand {
            display: flex;
            flex-direction: column;
          }

          .logo-text {
            font-size: 28px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.5px;
          }

          .logo-text span { color: #0f172a; }

          .company-sub {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
            margin-top: 2px;
          }

          .contract-badge-box {
            text-align: right;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px 16px;
            border-radius: 8px;
          }

          .contract-title-h1 {
            font-size: 14px;
            font-weight: 800;
            color: #1e293b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
          }

          .contract-ref {
            font-family: monospace;
            font-size: 12px;
            color: #2563eb;
            font-weight: 700;
          }

          .section-title {
            font-size: 12px;
            font-weight: 800;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-left: 3px solid #2563eb;
            padding-left: 10px;
            margin: 22px 0 10px 0;
          }

          .parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }

          .party-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px 16px;
          }

          .party-header {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
          }

          .party-name {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
          }

          .party-detail {
            font-size: 12px;
            color: #475569;
            margin-top: 2px;
          }

          .pricing-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 20px 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }

          .pricing-table th {
            background: #0f172a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            text-align: left;
            padding: 10px 14px;
          }

          .pricing-table td {
            padding: 11px 14px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12.5px;
          }

          .pricing-table tr:nth-child(even) {
            background-color: #f8fafc;
          }

          .price-tag {
            font-weight: 800;
            color: #2563eb;
          }

          .article-text {
            font-size: 12px;
            color: #334155;
            text-align: justify;
            margin-bottom: 10px;
          }

          .highlight-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 12px 16px;
            margin: 16px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .signatures-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 35px;
            page-break-inside: avoid;
          }

          .signature-box {
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            padding: 16px;
            min-height: 130px;
            display: flex;
            flex-direction: column;
            justify-content: justify-between;
            background: #fafafa;
          }

          .signature-title {
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
          }

          .signature-stamp-area {
            font-size: 11px;
            color: #94a3b8;
            font-style: italic;
            margin-top: 40px;
            text-align: center;
          }

          .footer-legal {
            margin-top: 30px;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
            line-height: 1.4;
          }

          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>

        {/* Header */}
        <div class="header">
          <div class="brand">
            <div class="logo-text">Livr<span>Express</span></div>
            <div class="company-sub">LivrExpress S.A.R.L • Transport, Messagerie & Logistique e-Commerce</div>
          </div>
          <div class="contract-badge-box">
            <div class="contract-title-h1">Contrat Cadre de Service</div>
            <div class="contract-ref">Réf: ${client.contractRef}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date d'effet : ${todayDate}</div>
          </div>
        </div>

        {/* Section 1: Parties */}
        <div class="section-title">Article 1 — Identification des Parties Contracting</div>
        <div class="parties-grid">
          <div class="party-card">
            <div class="party-header">Le Prestataire</div>
            <div class="party-name">LivrExpress S.A.R.L AU</div>
            <div class="party-detail"><strong>Siège Social:</strong> Bd d'Anfa, Casablanca, Maroc</div>
            <div class="party-detail"><strong>RC:</strong> 482910 | <strong>ICE:</strong> 00192830100029</div>
            <div class="party-detail"><strong>Service Client:</strong> support@livrexpress.ma | 0522-001122</div>
          </div>

          <div class="party-card">
            <div class="party-header">Le Client (Partenaire e-Commerce)</div>
            <div class="party-name">${client.businessName}</div>
            <div class="party-detail"><strong>Représenté par:</strong> ${client.fullName}</div>
            <div class="party-detail"><strong>Ville:</strong> ${client.city} | <strong>Tél:</strong> ${client.phone}</div>
            <div class="party-detail"><strong>Email:</strong> ${client.email}</div>
            <div class="party-detail"><strong>N° ICE / IF:</strong> ${client.ice || 'Non renseigné'}</div>
          </div>
        </div>

        {/* Section 2: Objet */}
        <div class="section-title">Article 2 — Objet & Périmètre d'Intervention</div>
        <div class="article-text">
          Le présent contrat a pour objet de définir les conditions organisationnelles, juridiques et financières dans lesquelles la société <strong>LivrExpress S.A.R.L</strong> assure pour le compte de <strong>${client.businessName}</strong> les prestations de ramassage, d'expédition, de suivi digitalisé, de livraison au destinataire final ainsi que l'encaissement des montants en Contre-Remboursement (CRBT).
        </div>

        {/* Section 3: Grille Tarifaire */}
        <div class="section-title">Article 3 — Conditions Financières & Grille Tarifaire</div>
        <table class="pricing-table">
          <thead>
            <tr>
              <th>Nature de la Prestation</th>
              <th>Couverture Géographique</th>
              <th>Délai Garanti</th>
              <th>Tarif Négocié HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Livraison Urbaine Locale</strong></td>
              <td>Même ville (${client.city})</td>
              <td>24 Heures</td>
              <td class="price-tag">${client.tarifSameCity.toFixed(2)} MAD</td>
            </tr>
            <tr>
              <td><strong>Livraison Nationale Inter-Villes</strong></td>
              <td>Toutes les villes du Royaume</td>
              <td>24h - 48h</td>
              <td class="price-tag">${client.tarifOtherCity.toFixed(2)} MAD</td>
            </tr>
            <tr>
              <td><strong>Gestion Colis Refusé / Retour</strong></td>
              <td>Retour à l'expédition Client</td>
              <td>72h max</td>
              <td class="price-tag">${client.tarifReturn.toFixed(2)} MAD</td>
            </tr>
          </tbody>
        </table>

        {/* Section 4: Cash-on-Delivery */}
        <div class="section-title">Article 4 — Reversement des Fonds (CRBT) & Réconciliation</div>
        <div class="article-text">
          Les fonds collectés auprès des destinataires finaux au titre des livraisons payées en espèces sont sécurisés par LivrExpress. Le reversement s'effectue hebdomadairement par virement bancaire sur le compte indiqué par le Client, déduction faite des frais de transport négociés. Un état de réconciliation comptable automatique est mis à disposition sur la plateforme.
        </div>

        {/* Highlight Box Credit */}
        <div class="highlight-box">
          <div>
            <div style="font-weight: 700; color: #1e3a8a;">Plafond d'Encours & Crédit Autorisé</div>
            <div style="font-size: 11.5px; color: #1e40af;">Conformément à la politique d'analyse des risques LivrExpress.</div>
          </div>
          <div style="font-size: 16px; font-weight: 800; color: #1d4ed8; font-family: monospace;">
            ${client.creditLimit.toFixed(2)} MAD
          </div>
        </div>

        {/* Section 5: Durée & Signatures */}
        <div class="section-title">Article 5 — Durée & Prise d'Effet</div>
        <div class="article-text">
          Le présent contrat est conclu pour une durée indéterminée à compter de sa signature. Il peut être résilié par l'une ou l'autre des parties sous réserve d'un préavis écrit de trente (30) jours.
        </div>

        {/* Signatures */}
        <div class="signatures-container">
          <div class="signature-box">
            <div class="signature-title">Pour le Client : ${client.businessName}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Mention manuscrite "Lu et approuvé"</div>
            <div class="signature-stamp-area">Signature & Cachet Officiel</div>
          </div>

          <div class="signature-box" style="border-color: #93c5fd; background: #f0f9ff;">
            <div class="signature-title" style="color: #1e40af;">Pour LivrExpress S.A.R.L :</div>
            <div style="font-size: 11px; color: #3b82f6; margin-top: 4px;">La Direction Commerciale & Logistique</div>
            <div class="signature-stamp-area" style="color: #2563eb;">Signature Électronique Certifiée</div>
          </div>
        </div>

        {/* Footer Legal */}
        <div class="footer-legal">
          LivrExpress S.A.R.L AU — Capitale Social: 1.000.000 DH — Registre de Commerce: N° 482910 Casablanca — ICE: 00192830100029<br/>
          Ce document constitue une convention légale régie par le droit commercial marocain.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
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
                <h3 className="kt-modal-title">Nouveau client</h3>
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
                      <label className="text-sm font-medium text-mono text-foreground">Raison Sociale / Boutique</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Casa Chic SARL"
                        className="kt-input"
                        value={newClientForm.businessName}
                        onChange={(e) => setNewClientForm({ ...newClientForm, businessName: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">Représentant Légal</label>
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
                    <div className="grid grid-cols-1 gap-1.5">
                      <label className="text-sm font-medium text-mono text-foreground">Email Professionnel</label>
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
                      <label className="text-sm font-medium text-mono text-foreground">Téléphone</label>
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
                      <label className="text-sm font-medium text-mono text-foreground">Ville</label>
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
                      <label className="text-sm font-medium text-mono text-foreground">Numéro ICE</label>
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
                    <h4 className="text-xs font-bold uppercase text-primary mb-3 me-1">Tarification & Plafond Crédit</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="grid grid-cols-1 gap-1.5">
                        <label className="text-xs font-medium text-mono text-foreground">Même Ville (MAD)</label>
                        <input
                          type="number"
                          step="0.5"
                          className="kt-input"
                          value={newClientForm.tarifSameCity}
                          onChange={(e) => setNewClientForm({ ...newClientForm, tarifSameCity: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        <label className="text-xs font-medium text-mono text-foreground">National (MAD)</label>
                        <input
                          type="number"
                          step="0.5"
                          className="kt-input"
                          value={newClientForm.tarifOtherCity}
                          onChange={(e) => setNewClientForm({ ...newClientForm, tarifOtherCity: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        <label className="text-xs font-medium text-mono text-foreground">Crédit Max (MAD)</label>
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
                      Remplir (Test)
                    </button>

                    <div className="flex items-center gap-2.5">
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
                        Créer le client
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
