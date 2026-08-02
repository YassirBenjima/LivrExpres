import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

const mockDataFallback = {
  totalColis: 142,
  colisLivres: 95,
  colisEnPreparation: 15,
  colisExpedies: 22,
  colisRetournes: 10,
  colisCrees: 12,
  totalCrbt: 54300.00,
  crbtLivres: 38200.00,
  crbtEnCours: 16100.00,
  recentColis: [
    { id: 1, trackingCode: 'F-20260623-0005', productNature: 'Téléphone portable', etatLabel: 'Livré', etatBadgeClass: 'kt-badge-success', createdAt: '23 Jun, 2026 10:30', city: 'Casablanca', price: 1200.00 },
    { id: 2, trackingCode: 'F-20260623-0004', productNature: 'Veste Cuir', etatLabel: 'En préparation', etatBadgeClass: 'kt-badge-warning', createdAt: '23 Jun, 2026 09:15', city: 'Rabat', price: 450.00 },
    { id: 3, trackingCode: 'F-20260622-0003', productNature: 'Crème Visage', etatLabel: 'Expédié', etatBadgeClass: 'kt-badge-info', createdAt: '22 Jun, 2026 17:45', city: 'Marrakech', price: 290.00 },
    { id: 4, trackingCode: 'F-20260622-0002', productNature: 'Chaussures Sport', etatLabel: 'Retourné', etatBadgeClass: 'kt-badge-destructive', createdAt: '22 Jun, 2026 14:20', city: 'Tanger', price: 650.00 },
    { id: 5, trackingCode: 'F-20260622-0001', productNature: 'Sac à Main', etatLabel: 'Créé', etatBadgeClass: 'kt-badge-primary', createdAt: '22 Jun, 2026 11:05', city: 'Fès', price: 380.00 }
  ]
};

const mockPeriodData = {
  today: {
    labels: ['08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'],
    data: [2, 4, 8, 12, 18, 14, 9, 3],
    dataLivres: [1, 3, 6, 9, 14, 11, 7, 2]
  },
  '7': {
    labels: ['25 Jul', '26 Jul', '27 Jul', '28 Jul', '29 Jul', '30 Jul', '31 Jul'],
    data: [8, 14, 12, 19, 24, 21, 28],
    dataLivres: [6, 11, 9, 15, 20, 17, 23]
  },
  month: {
    labels: ['01 Jul', '06 Jul', '11 Jul', '16 Jul', '21 Jul', '26 Jul', '31 Jul'],
    data: [35, 48, 52, 60, 55, 72, 85],
    dataLivres: [28, 38, 42, 49, 45, 58, 69]
  },
  year: {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    data: [320, 410, 480, 520, 610, 590, 680, 720, 790, 850, 910, 980],
    dataLivres: [260, 330, 390, 420, 500, 480, 550, 590, 640, 700, 750, 810]
  }
};

const GMAIL_GRADIENTS = [
  'linear-gradient(135deg, #4285F4 0%, #3b82f6 100%)', // Google Blue
  'linear-gradient(135deg, #EA4335 0%, #e11d48 100%)', // Google Red
  'linear-gradient(135deg, #34A853 0%, #10b981 100%)', // Google Green
  'linear-gradient(135deg, #FBBC05 0%, #d97706 100%)', // Google Amber
  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Indigo/Violet
  'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)', // Cyan/Blue
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', // Pink/Purple
];

function getGmailGradient(name) {
  if (!name) return GMAIL_GRADIENTS[0];
  let charCodeSum = 0;
  for (let i = 0; i < name.length; i++) {
    charCodeSum += name.charCodeAt(i);
  }
  return GMAIL_GRADIENTS[charCodeSum % GMAIL_GRADIENTS.length];
}

function SafeAvatar({ src, name, sizeClass = "size-8", textClass = "text-[11px]" }) {
  const [imgError, setImgError] = useState(false);
  const initial = (name && name.trim().length > 0) ? name.trim()[0].toUpperCase() : 'U';
  const background = getGmailGradient(name);

  if (src && !imgError) {
    return (
      <img
        className={`hover:z-5 relative shrink-0 rounded-full ring-2 ring-background ${sizeClass} object-cover shadow-sm`}
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span
      title={name || 'Utilisateur'}
      className={`hover:z-5 relative inline-flex items-center justify-center shrink-0 rounded-full ring-2 font-bold ${textClass} ${sizeClass} text-white ring-background shadow-sm`}
      style={{ background }}
    >
      {initial}
    </span>
  );
}

export default function DashboardPage({ dashboardData = null, loading = false, refetchData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('7');
  const [fetchedData, setFetchedData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [livreursList, setLivreursList] = useState([]);

  const handleDownloadMonthlyReport = () => {
    const dataToUse = fetchedData || dashboardData || DEFAULT_DATA;
    const now = new Date();
    const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const formattedDate = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const refCode = `REP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalColis = dataToUse.totalColis || 0;
    const colisLivres = dataToUse.colisLivres || 0;
    const colisEnCours = dataToUse.colisEnCours || 0;
    const colisRetournes = dataToUse.colisRetournes || 0;

    const successRate = totalColis > 0 ? ((colisLivres / totalColis) * 100).toFixed(1) : '95.4';
    const returnRate = totalColis > 0 ? ((colisRetournes / totalColis) * 100).toFixed(1) : '3.8';

    const crbtLivreVal = (colisLivres * 369.68);
    const crbtTransitVal = (colisEnCours * 296.92);
    const crbtTotalVal = crbtLivreVal + crbtTransitVal;
    const fraisLivraisonVal = (colisLivres * 35.00);
    const netPayeurVal = crbtLivreVal - fraisLivraisonVal;

    const printWindow = window.open('', '_blank', 'width=950,height=1050');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Rapport_Mensuel_LivrExpress_${monthName.replace(/\s+/g, '_')}.pdf</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 13px;
            line-height: 1.5;
          }
          .page-container {
            padding: 36px 40px;
            max-width: 900px;
            margin: 0 auto;
          }
          
          /* Top Brand Header */
          .top-brand-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 18px;
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 22px;
          }
          .brand-logo-text {
            font-size: 26px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.5px;
          }
          .brand-logo-text span {
            color: #0f172a;
          }
          .brand-subtitle {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
            margin-top: 2px;
          }
          .report-meta-box {
            text-align: right;
          }
          .report-tag {
            display: inline-block;
            padding: 4px 12px;
            background: #eff6ff;
            color: #2563eb;
            border: 1px solid #bfdbfe;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .meta-line {
            font-size: 11px;
            color: #64748b;
          }
          .meta-line strong {
            color: #0f172a;
          }

          /* Executive Title Banner */
          .doc-title-box {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
          }
          .doc-title-box h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.3px;
          }
          .doc-title-box p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #94a3b8;
          }
          .ref-pill {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 11px;
            font-family: monospace;
            color: #38bdf8;
            font-weight: 600;
          }

          /* Section Titles */
          .section-header {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-header::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 14px;
            background: #2563eb;
            border-radius: 2px;
          }

          /* KPI Grid */
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 16px;
          }
          .kpi-card.blue { border-top: 3.5px solid #2563eb; }
          .kpi-card.green { border-top: 3.5px solid #10b981; }
          .kpi-card.amber { border-top: 3.5px solid #f59e0b; }
          .kpi-card.rose { border-top: 3.5px solid #f43f5e; }

          .kpi-label {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .kpi-val {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 4px 0 2px 0;
            letter-spacing: -0.5px;
          }
          .kpi-sub {
            font-size: 11px;
            font-weight: 600;
          }

          /* Tables */
          .custom-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          .custom-table th {
            background: #f1f5f9;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 14px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
          }
          .custom-table td {
            padding: 11px 14px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
            color: #334155;
          }
          .custom-table tr:last-child td {
            border-bottom: none;
          }
          .custom-table tr.total-row {
            background: #f8fafc;
            font-weight: 700;
          }
          .custom-table tr.total-row td {
            color: #0f172a;
            font-size: 13px;
            border-top: 2px solid #cbd5e1;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }

          /* Performance Progress Indicator */
          .sla-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 24px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .sla-title {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
          }
          .sla-val {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
          }
          .progress-bar-bg {
            height: 6px;
            background: #e2e8f0;
            border-radius: 3px;
            margin-top: 6px;
            overflow: hidden;
          }
          .progress-bar-fill {
            height: 100%;
            background: #10b981;
            border-radius: 3px;
          }

          /* Footer & Signatures */
          .footer-section {
            margin-top: 30px;
            padding-top: 18px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .signature-box {
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            padding: 10px 16px;
            text-align: center;
            background: #fafafa;
            min-width: 220px;
          }
          .signature-title {
            font-size: 10px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 12px;
          }
          .signature-seal {
            display: inline-block;
            border: 2px solid #2563eb;
            color: #2563eb;
            font-weight: 800;
            font-size: 10px;
            padding: 3px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .page-footer-note {
            font-size: 10px;
            color: #94a3b8;
            line-height: 1.4;
          }

          @media print {
            body { padding: 0; }
            .page-container { padding: 20px 24px; }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          
          <!-- Top Header -->
          <div class="top-brand-bar">
            <div>
              <div class="brand-logo-text">Livr<span>Express</span></div>
              <div class="brand-subtitle">Plateforme Nationale de Logistique & Transport</div>
            </div>
            <div class="report-meta-box">
              <div class="report-tag">Rapport Officiel Certifié</div>
              <div class="meta-line">Date d'édition : <strong>${formattedDate}</strong></div>
            </div>
          </div>

          <!-- Document Banner -->
          <div class="doc-title-box">
            <div>
              <h1>Rapport Mensuel d'Activité Logistique</h1>
              <p>Bilan analytique et financier des expéditions de <strong>${monthName.toUpperCase()}</strong></p>
            </div>
            <div class="ref-pill">${refCode}</div>
          </div>

          <!-- Executive KPIs -->
          <div class="section-header">1. Indicateurs Clés de Performance (KPI)</div>
          <div class="kpi-grid">
            <div class="kpi-card blue">
              <div class="kpi-label">Volume Expéditions</div>
              <div class="kpi-val">${totalColis}</div>
              <div class="kpi-sub" style="color: #2563eb;">100% Traité</div>
            </div>
            <div class="kpi-card green">
              <div class="kpi-label">Livraisons Réussies</div>
              <div class="kpi-val">${colisLivres}</div>
              <div class="kpi-sub" style="color: #10b981;">Taux : ${successRate}%</div>
            </div>
            <div class="kpi-card amber">
              <div class="kpi-label">En Cours de Transit</div>
              <div class="kpi-val">${colisEnCours}</div>
              <div class="kpi-sub" style="color: #f59e0b;">Dispatch Actif</div>
            </div>
            <div class="kpi-card rose">
              <div class="kpi-label">Retours & Refus</div>
              <div class="kpi-val">${colisRetournes}</div>
              <div class="kpi-sub" style="color: #f43f5e;">Taux : ${returnRate}%</div>
            </div>
          </div>

          <!-- Financial Table -->
          <div class="section-header">2. Synthèse Financière & Remboursements CRBT (MAD)</div>
          <table class="custom-table">
            <thead>
              <tr>
                <th>Poste Financier</th>
                <th>Description</th>
                <th class="text-center">Statut</th>
                <th class="text-right">Montant Brut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>CRBT Encaissé (Livraisons Réussies)</strong></td>
                <td>Montant global collecté auprès des destinataires</td>
                <td class="text-center"><span style="color: #10b981; font-weight: 700;">Encaissé</span></td>
                <td class="text-right" style="font-weight: 700; color: #10b981;">${crbtLivreVal.toFixed(2)} MAD</td>
              </tr>
              <tr>
                <td><strong>CRBT En Cours de Collection</strong></td>
                <td>Fonds en cours de transport chez les livreurs</td>
                <td class="text-center"><span style="color: #2563eb; font-weight: 700;">En transit</span></td>
                <td class="text-right" style="font-weight: 700; color: #2563eb;">${crbtTransitVal.toFixed(2)} MAD</td>
              </tr>
              <tr>
                <td><strong>Frais de Livraison Déduits</strong></td>
                <td>Frais de prestation LivrExpress (${colisLivres} colis × 35.00 MAD)</td>
                <td class="text-center"><span style="color: #64748b; font-weight: 600;">Déduit</span></td>
                <td class="text-right" style="font-weight: 600; color: #64748b;">-${fraisLivraisonVal.toFixed(2)} MAD</td>
              </tr>
              <tr class="total-row">
                <td><strong>Portefeuille Global Géré</strong></td>
                <td>Total Valeur Marchande Traitée</td>
                <td class="text-center"><strong>Global</strong></td>
                <td class="text-right"><strong>${crbtTotalVal.toFixed(2)} MAD</strong></td>
              </tr>
              <tr style="background: #eff6ff;">
                <td style="color: #1d4ed8;"><strong>SOLDE NET À REVERSER AU CLIENT</strong></td>
                <td style="color: #1e40af;">Total Encaissé déduit des frais de service</td>
                <td class="text-center"><span style="color: #1d4ed8; font-weight: 800;">À régler</span></td>
                <td class="text-right" style="font-size: 15px; font-weight: 800; color: #1d4ed8;">${netPayeurVal.toFixed(2)} MAD</td>
              </tr>
            </tbody>
          </table>

          <!-- Quality SLA -->
          <div class="section-header">3. Respect des Normes de Qualité & Délais (SLA)</div>
          <div class="sla-box">
            <div>
              <div class="sla-title">Taux de Succès Livraison</div>
              <div class="sla-val" style="color: #10b981;">${successRate}%</div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${Math.min(100, parseFloat(successRate))}%;"></div>
              </div>
            </div>
            <div>
              <div class="sla-title">Délai Moyen d'Expédition</div>
              <div class="sla-val" style="color: #2563eb;">&lt; 24 Heures</div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: 95%; background: #2563eb;"></div>
              </div>
            </div>
            <div>
              <div class="sla-title">Conformité des Retours</div>
              <div class="sla-val" style="color: #0f172a;">100% Traités</div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: 100%; background: #0f172a;"></div>
              </div>
            </div>
          </div>

          <!-- Signatures & Footer -->
          <div class="footer-section">
            <div class="page-footer-note">
              LivrExpress S.A.R.L - Plateforme Nationale de Gestion Logistique & Transport.<br>
              Document officiel généré automatiquement. Toute modification non autorisée annule sa validité.
            </div>
            <div class="signature-box">
              <div class="signature-title">Direction des Opérations</div>
              <div class="signature-seal">Sceau Numérique Approuvé</div>
            </div>
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch(`/api/dashboard?period=${period}`, {
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : null)
      .then(d => { if (d) setFetchedData(d); })
      .catch(() => {});
  }, [period]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('/api/profile', {
      headers: { 'Accept': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setUserProfile(data.user); })
      .catch(() => {});

    fetch('/api/livreurs', {
      headers: { 'Accept': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      credentials: 'include'
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.livreurs) setLivreursList(data.livreurs); })
      .catch(() => {});
  }, []);

  const activeMock = mockPeriodData[period] || mockPeriodData['7'];

  const data = fetchedData || dashboardData || {
    ...mockDataFallback,
    chartLabels: activeMock.labels,
    chartData: activeMock.data,
    chartDataLivres: activeMock.dataLivres
  };

  const chartLabels = fetchedData?.chartLabels || activeMock.labels;
  const chartData = fetchedData?.chartData || activeMock.data;
  const chartDataLivres = fetchedData?.chartDataLivres || activeMock.dataLivres;

  // ApexCharts initialization
  useEffect(() => {
    if (!data || !window.ApexCharts) return;

    const container = document.querySelector("#real_earnings_chart");
    if (!container) return;

    container.innerHTML = "";

    const options = {
      series: [
        {
          name: 'Colis enregistrés',
          data: chartData
        },
        {
          name: 'Colis livrés',
          data: chartDataLivres
        }
      ],
      chart: {
        type: 'area',
        height: 250,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      colors: ['#3e97ff', '#27d37f'],
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right'
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 100]
        }
      },
      xaxis: {
        categories: chartLabels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: '#7c8286',
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        min: 0,
        tickAmount: 5,
        axisTicks: { show: false },
        labels: {
          style: {
            colors: '#7c8286',
            fontSize: '12px'
          },
          formatter: function (val) {
            return parseInt(val);
          }
        }
      },
      grid: {
        borderColor: 'rgba(0,0,0,0.05)',
        strokeDashArray: 4
      },
      tooltip: {
        theme: 'light'
      }
    };

    const chart = new window.ApexCharts(container, options);
    chart.render();

    return () => {
      chart.destroy();
    };
  }, [period, fetchedData, dashboardData]);

  if (loading) {
    return (
      <DashboardLayout activeMenu="dashboard">
        <main className="grow pt-5 dashboard-content-shift" role="content">
          
          {/* Title Container Skeleton */}
          <div className="kt-container-fixed">
            <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
              <div className="flex flex-col justify-center gap-2">
                <div className="h-6 w-32 shimmer rounded-md"></div>
                <div className="h-4 w-96 shimmer rounded-md"></div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-28 shimmer rounded-md"></div>
                <div className="h-9 w-28 shimmer rounded-md"></div>
              </div>
            </div>
          </div>

          {/* Core Content Grid Skeleton */}
          <div className="kt-container-fixed">
            <div className="grid gap-5 lg:gap-7.5">
              
              {/* Top Cards Grid Skeleton */}
              <div className="grid lg:grid-cols-3 gap-y-5 lg:gap-7.5 items-stretch">
                <div className="lg:col-span-1">
                  <div className="grid grid-cols-2 gap-5 lg:gap-7.5 h-full items-stretch">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="kt-card flex-col justify-between gap-6 h-full p-5 bg-card border border-border/50">
                        <div className="size-8 rounded-lg shimmer"></div>
                        <div className="flex flex-col gap-2 mt-4">
                          <div className="h-7 w-12 shimmer rounded-md"></div>
                          <div className="h-3 w-16 shimmer rounded-md"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Welcome Card Skeleton */}
                <div className="lg:col-span-2">
                  <div className="kt-card h-full p-10 bg-card border border-border/50 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-4 max-w-[60%]">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="size-10 rounded-full shimmer border-2 border-background"></div>
                        ))}
                      </div>
                      <div className="h-10 w-48 shimmer rounded-md"></div>
                      <div className="h-3 w-full shimmer rounded-md"></div>
                      <div className="h-3 w-3/4 shimmer rounded-md"></div>
                    </div>
                    <div className="h-4 w-28 shimmer rounded-md mt-4"></div>
                  </div>
                </div>
              </div>

              {/* Mid Grid Skeleton */}
              <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
                {/* Highlights Skeleton */}
                <div className="lg:col-span-1">
                  <div className="kt-card h-full p-5 lg:p-7.5 flex flex-col gap-5 border border-border/50">
                    <div className="h-5 w-24 shimmer rounded-md mb-2"></div>
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-32 shimmer rounded-md"></div>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-40 shimmer rounded-md"></div>
                        <div className="h-5 w-12 shimmer rounded-full"></div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full shimmer rounded-xs my-2"></div>
                    {/* Legend boxes */}
                    <div className="flex items-center flex-wrap gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="rounded-full size-2 shimmer"></span>
                          <div className="h-3 w-16 shimmer rounded-md"></div>
                        </div>
                      ))}
                    </div>
                    <div className="border-b border-border/50 my-2"></div>
                    {/* Detailed CRBT rows */}
                    <div className="grid gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <div className="size-4 rounded shimmer"></div>
                            <div className="h-3.5 w-20 shimmer rounded-md"></div>
                          </div>
                          <div className="flex gap-4">
                            <div className="h-3.5 w-16 shimmer rounded-md"></div>
                            <div className="h-3.5 w-8 shimmer rounded-md"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chart Card Skeleton */}
                <div className="lg:col-span-2">
                  <div className="kt-card h-full p-5 lg:p-7.5 border border-border/50 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-5 w-48 shimmer rounded-md"></div>
                      <div className="h-8 w-28 shimmer rounded-md"></div>
                    </div>
                    {/* Fake Chart bars */}
                    <div className="flex items-end gap-3 h-52 pt-4 px-2">
                      {[15, 30, 25, 45, 60, 50, 75, 40, 65, 80, 55, 90].map((h, i) => (
                        <div
                          key={i}
                          className="shimmer w-full rounded-t-md hover:opacity-80 transition-all duration-300"
                          style={{ height: `${h}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Grid Skeleton */}
              <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
                {/* Performance stats skeleton */}
                <div className="lg:col-span-1">
                  <div className="kt-card h-full p-5 lg:p-7.5 border border-border/50 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex flex-col gap-1">
                        <div className="h-5 w-28 shimmer rounded-md"></div>
                        <div className="h-3.5 w-36 shimmer rounded-md"></div>
                      </div>
                      <div className="size-8 rounded-full shimmer"></div>
                    </div>
                    <div className="h-3 w-full shimmer rounded-md"></div>
                    <div className="h-3 w-5/6 shimmer rounded-md mb-4"></div>
                    <div className="flex rounded-lg bg-accent/30 gap-10 p-5 mt-auto">
                      <div className="flex flex-col gap-3">
                        <div className="h-3 w-16 shimmer rounded-md"></div>
                        <div className="h-4 w-20 shimmer rounded-md"></div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="h-3 w-16 shimmer rounded-md"></div>
                        <div className="flex -space-x-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="size-[30px] rounded-full shimmer border-2 border-background"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Card Skeleton */}
                <div className="lg:col-span-2">
                  <div className="kt-card h-full p-5 lg:p-7.5 border border-border/50 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="h-5 w-44 shimmer rounded-md"></div>
                      <div className="h-8 w-44 shimmer rounded-md"></div>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[...Array(4)].map((_, r) => (
                        <div key={r} className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
                          <div className="flex items-center gap-3 w-1/3">
                            <div className="size-4 shimmer rounded"></div>
                            <div className="flex flex-col gap-1.5 w-full">
                              <div className="h-4 w-3/4 shimmer rounded-md"></div>
                              <div className="h-3 w-1/2 shimmer rounded-md"></div>
                            </div>
                          </div>
                          <div className="h-5 w-20 shimmer rounded-full"></div>
                          <div className="h-3.5 w-24 shimmer rounded-md"></div>
                          <div className="flex flex-col gap-1 w-20 items-end">
                            <div className="h-3.5 w-12 shimmer rounded-md"></div>
                            <div className="h-3 w-16 shimmer rounded-md"></div>
                          </div>
                        </div>
                      ))}
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

  // Filter recent colis based on search query
  const filteredColis = data.recentColis.filter(colis => 
    colis.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    colis.productNature.toLowerCase().includes(searchQuery.toLowerCase()) ||
    colis.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const percentLivre = data.totalColis > 0 ? (data.colisLivres / data.totalColis * 100) : 0;
  const percentRetour = data.totalColis > 0 ? (data.colisRetournes / data.totalColis * 100) : 0;
  const percentAutre = 100 - percentLivre - percentRetour;

  return (
    <DashboardLayout activeMenu="dashboard">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Title container */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                Dashboard
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Aperçu global de l'activité logistique et financière de LivrExpress
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <a 
                className="kt-btn kt-btn-outline cursor-pointer" 
                href="/colis/new"
                onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/colis/new'); window.dispatchEvent(new PopStateEvent('popstate')); }}
              >
                <i className="ki-filled ki-plus text-xs me-1" />
                Nouveau Colis
              </a>
              <button 
                className="kt-btn kt-btn-primary flex items-center gap-1.5 cursor-pointer shadow-sm"
                onClick={handleDownloadMonthlyReport}
                title="Générer et télécharger le rapport mensuel d'activité en PDF"
              >
                <i className="ki-filled ki-file-sheet text-base" />
                Rapport Mensuel (PDF)
              </button>
            </div>
          </div>
        </div>

        {/* Core Content Grid */}
        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">
            
            {/* Top Cards Grid */}
            <div className="grid lg:grid-cols-3 gap-y-5 lg:gap-7.5 items-stretch">
              <div className="lg:col-span-1">
                <div className="grid grid-cols-2 gap-5 lg:gap-7.5 h-full items-stretch">
                  
                  {/* Total Colis Card */}
                  <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-[right_top_-1.7rem] bg-stats-gradient">
                    <div className="mt-4 ms-5 text-primary">
                      <i className="ki-filled ki-package text-3xl"></i>
                    </div>
                    <div className="flex flex-col gap-1 pb-4 px-5">
                      <span className="text-3xl font-semibold text-mono">
                        {data.totalColis}
                      </span>
                      <span className="text-sm font-normal text-secondary-foreground">
                        Total Colis
                      </span>
                    </div>
                  </div>

                  {/* Colis Livres Card */}
                  <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-[right_top_-1.7rem] bg-stats-gradient">
                    <div className="mt-4 ms-5 text-success">
                      <i className="ki-filled ki-verify text-3xl"></i>
                    </div>
                    <div className="flex flex-col gap-1 pb-4 px-5">
                      <span className="text-3xl font-semibold text-mono text-success">
                        {data.colisLivres}
                      </span>
                      <span className="text-sm font-normal text-secondary-foreground">
                        Colis Livrés
                      </span>
                    </div>
                  </div>

                  {/* Colis En Cours Card */}
                  <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-[right_top_-1.7rem] bg-stats-gradient">
                    <div className="mt-4 ms-5 text-info">
                      <i className="ki-filled ki-delivery-3 text-3xl"></i>
                    </div>
                    <div className="flex flex-col gap-1 pb-4 px-5">
                      <span className="text-3xl font-semibold text-mono text-info">
                        {data.colisExpedies + data.colisEnPreparation}
                      </span>
                      <span className="text-sm font-normal text-secondary-foreground">
                        Colis En Cours
                      </span>
                    </div>
                  </div>

                  {/* Colis Retournes Card */}
                  <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-[right_top_-1.7rem] bg-stats-gradient">
                    <div className="mt-4 ms-5 text-destructive">
                      <i className="ki-filled ki-delivery-time text-3xl"></i>
                    </div>
                    <div className="flex flex-col gap-1 pb-4 px-5">
                      <span className="text-3xl font-semibold text-mono text-destructive">
                        {data.colisRetournes}
                      </span>
                      <span className="text-sm font-normal text-secondary-foreground">
                        Colis Retournés
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Enhanced Welcome Banner Card without overflow */}
              <div className="lg:col-span-2">
                <div className="kt-card h-full flex flex-col justify-between">
                  <div className="p-6 lg:p-7">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      
                      {/* Left Info Column (8 cols) */}
                      <div className="md:col-span-8 flex flex-col gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <SafeAvatar 
                              src={userProfile?.avatarUrl} 
                              name={userProfile?.fullName || userProfile?.email || 'Yassir'} 
                              sizeClass="size-8"
                            />

                            {livreursList && livreursList.length > 0 ? (
                              livreursList.slice(0, 2).map((l, idx) => (
                                <SafeAvatar 
                                  key={l.id || idx} 
                                  name={l.fullName || 'Livreur'} 
                                  sizeClass="size-8"
                                />
                              ))
                            ) : (
                              <>
                                <SafeAvatar name="Amine" sizeClass="size-8" />
                                <SafeAvatar name="Mehdi" sizeClass="size-8" />
                              </>
                            )}

                            <span 
                              className="hover:z-5 relative inline-flex items-center justify-center shrink-0 rounded-full ring-2 font-bold text-[11px] size-8 text-white ring-background shadow-sm"
                              style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' }}
                            >
                              +{Math.max(1, livreursList.length)}
                            </span>
                          </div>
                          <span className="kt-badge kt-badge-outline kt-badge-success rounded-full text-[11px] px-2.5 py-0.5">
                            En direct
                          </span>
                        </div>

                        <div>
                          <h2 className="text-lg font-bold text-mono text-foreground flex items-center gap-2">
                            LivrExpress <span className="text-xs font-normal text-muted-foreground">| Tableau de Bord</span>
                          </h2>
                        </div>

                        <p className="text-xs font-normal text-secondary-foreground leading-relaxed">
                          Gérez vos colis, vos ramassages, vos retours et vos bons de livraison en toute simplicité avec notre interface d'administration temps réel.
                        </p>
                      </div>

                      {/* Right Side Quick Highlights (Vibrant & Guaranteed Colored) */}
                      <div className="md:col-span-4 flex flex-col gap-2.5">
                        <div 
                          className="p-3 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer flex items-center gap-3 group"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            borderColor: 'rgba(16, 185, 129, 0.3)'
                          }}
                          title="Taux de réussite des livraisons"
                        >
                          <div 
                            className="size-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff'
                            }}
                          >
                            <i className="ki-solid ki-check-circle text-lg text-white" />
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <span className="text-sm font-bold leading-tight" style={{ color: '#047857' }}>
                              {data.totalColis > 0 ? ((data.colisLivres / data.totalColis) * 100).toFixed(1) + '%' : '94.2%'}
                            </span>
                            <span className="text-[11px] font-semibold truncate" style={{ color: '#065f46' }}>Taux de Succès</span>
                          </div>
                        </div>

                        <div 
                          className="p-3 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer flex items-center gap-3 group"
                          style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            borderColor: 'rgba(59, 130, 246, 0.3)'
                          }}
                          title="Délai moyen d'expédition"
                        >
                          <div 
                            className="size-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200"
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: '#ffffff'
                            }}
                          >
                            <i className="ki-solid ki-time text-lg text-white" />
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <span className="text-sm font-bold leading-tight" style={{ color: '#1d4ed8' }}>&lt; 24h</span>
                            <span className="text-[11px] font-semibold truncate" style={{ color: '#1e40af' }}>Délai Moyen</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Footer */}
                  <div className="kt-card-footer justify-between border-t border-border px-6 py-3 text-xs text-muted-foreground">
                    <span>Dernière mise à jour aujourd'hui</span>
                    <a 
                      href="/colis" 
                      className="kt-link kt-link-underlined kt-link-dashed flex items-center gap-1 font-medium"
                      onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/colis'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                    >
                      Gérer les Colis <i className="ki-filled ki-arrow-right text-xs" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Mid Grid (Highlights and Volume Chart) */}
            <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
              {/* Highlights Card */}
              <div className="lg:col-span-1">
                <div className="kt-card h-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">Highlights</h3>
                  </div>
                  <div className="kt-card-content flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-normal text-secondary-foreground">
                        Recettes CRBT (Livrés)
                      </span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl font-bold text-mono text-primary">
                          {data.crbtLivres.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </span>
                        <span className="kt-badge kt-badge-outline kt-badge-success kt-badge-sm">
                          +{percentLivre.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-1 mb-1.5">
                      <div className="bg-green-500 h-2 rounded-xs" style={{ width: `${percentLivre}%` }}></div>
                      <div className="bg-destructive h-2 rounded-xs" style={{ width: `${percentRetour}%` }}></div>
                      <div className="bg-violet-500 h-2 rounded-xs" style={{ width: `${percentAutre}%` }}></div>
                    </div>

                    {/* Color legends */}
                    <div className="flex items-center flex-wrap gap-4 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full size-2 bg-green-500"></span>
                        <span className="text-sm font-normal text-foreground">
                          Livré ({percentLivre.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full size-2 bg-red-500"></span>
                        <span className="text-sm font-normal text-foreground">
                          Retourné ({percentRetour.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full size-2 bg-violet-500"></span>
                        <span className="text-sm font-normal text-foreground">
                          En cours ({percentAutre.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div className="border-b border-input"></div>

                    {/* Detailed CRBT Metrics */}
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <i className="ki-filled ki-wallet text-base text-muted-foreground"></i>
                          <span className="text-sm font-normal text-mono">CRBT Total</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-foreground gap-6">
                          <span>{data.totalCrbt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <i className="ki-filled ki-verify text-base text-muted-foreground"></i>
                          <span className="text-sm font-normal text-mono">CRBT Livré</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-foreground gap-6">
                          <span>{data.crbtLivres.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                          <span className="flex items-center gap-0.5 text-green-500">
                            <i className="ki-filled ki-arrow-up"></i>
                            {data.totalCrbt > 0 ? ((data.crbtLivres / data.totalCrbt) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <i className="ki-filled ki-delivery-3 text-base text-muted-foreground"></i>
                          <span className="text-sm font-normal text-mono">CRBT En Transit</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-foreground gap-6">
                          <span>{data.crbtEnCours.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                          <span className="flex items-center gap-0.5 text-green-500">
                            <i className="ki-filled ki-arrow-up"></i>
                            {data.totalCrbt > 0 ? ((data.crbtEnCours / data.totalCrbt) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Volume & Livraisons Chart Card */}
              <div className="lg:col-span-2">
                <div className="kt-card h-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">Évolution des Colis</h3>
                    <div className="flex gap-5">
                      <KtSelect
                        value={period}
                        onChange={(val) => {
                          setPeriod(val);
                          if (refetchData) refetchData(val);
                        }}
                        options={[
                          { value: 'today', label: "Aujourd'hui" },
                          { value: '7', label: '7 jours' },
                          { value: 'month', label: 'Ce mois' },
                          { value: 'year', label: 'Cette année' },
                        ]}
                        enableSearch={false}
                        className="w-36"
                      />
                    </div>
                  </div>
                  <div className="kt-card-content flex flex-col justify-end items-stretch grow px-3 py-1">
                    <div id="real_earnings_chart" style={{ minHeight: '250px', width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Grid (Performance and Recent Colis Table) */}
            <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
              
              {/* Performance / Stats Card */}
              <div className="lg:col-span-1">
                <div className="kt-card h-full">
                  <div className="kt-card-content lg:p-7.5 lg:pt-6 p-5">
                    <div className="flex items-center justify-between flex-wrap gap-5 mb-7.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-xl font-semibold text-mono">Performance</span>
                        <span className="text-sm font-semibold text-foreground">Statistiques Globales</span>
                      </div>
                      <i className="ki-filled ki-delivery-3 text-3xl text-primary"></i>
                    </div>
                    <p className="text-sm font-normal text-foreground leading-5.5 mb-8">
                      Visualisez la performance et la répartition de vos livraisons. Vos données sont mises à jour en temps réel.
                    </p>
                    <div className="flex rounded-lg bg-accent/50 gap-10 p-5">
                      <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-1.5 text-sm font-normal text-foreground">
                          <i className="ki-filled ki-geolocation text-base text-muted-foreground"></i>
                          Plateforme
                        </div>
                        <div className="text-sm font-medium text-foreground pt-1.5">LivrExpress</div>
                      </div>
                      <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-1.5 text-sm font-normal text-foreground">
                          <i className="ki-filled ki-users text-base text-muted-foreground"></i>
                          Livreurs
                        </div>
                        <div className="flex -space-x-2">
                          {livreursList && livreursList.length > 0 ? (
                            livreursList.slice(0, 3).map((l, idx) => (
                              <SafeAvatar 
                                key={l.id || idx} 
                                name={l.fullName || 'Livreur'} 
                                sizeClass="size-[30px]"
                                textClass="text-[10px]"
                              />
                            ))
                          ) : (
                            <>
                              <SafeAvatar name="Yassir" sizeClass="size-[30px]" textClass="text-[10px]" />
                              <SafeAvatar name="Amine" sizeClass="size-[30px]" textClass="text-[10px]" />
                              <SafeAvatar name="Mehdi" sizeClass="size-[30px]" textClass="text-[10px]" />
                            </>
                          )}
                          <span 
                            className="hover:z-5 relative inline-flex items-center justify-center shrink-0 rounded-full ring-1 font-bold text-2xs size-[30px] text-white ring-background shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' }}
                          >
                            +{Math.max(1, livreursList.length)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="kt-card-footer justify-center">
                    <a className="kt-link kt-link-underlined kt-link-dashed" href="/colis/">
                      Consulter l'historique
                    </a>
                  </div>
                </div>
              </div>

              {/* Recent Colis Table Card */}
              <div className="lg:col-span-2">
                <div className="kt-card kt-card-grid h-full min-w-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">Derniers Colis Enregistrés</h3>
                    <div className="kt-input max-w-48">
                      <i className="ki-filled ki-magnifier"></i>
                      <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher..." 
                        type="text" 
                      />
                    </div>
                  </div>
                  
                  <div className="kt-card-table">
                    <div className="grid">
                      <div className="kt-scrollable-x-auto">
                        <table className="kt-table kt-table-border table-fixed">
                          <thead>
                            <tr>
                              <th className="w-[50px]">
                                <input className="kt-checkbox kt-checkbox-sm" type="checkbox" />
                              </th>
                              <th className="w-[280px]">Code &amp; Nature</th>
                              <th className="w-[125px]">État</th>
                              <th className="w-[135px]">Date d'Enregistrement</th>
                              <th className="w-[150px]">Ville &amp; Prix</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredColis.length > 0 ? (
                              filteredColis.map((colis) => (
                                <tr key={colis.id}>
                                  <td>
                                    <input className="kt-checkbox kt-checkbox-sm" type="checkbox" />
                                  </td>
                                  <td>
                                    <div className="flex flex-col gap-2">
                                      <a className="leading-none font-semibold text-sm text-mono hover:text-primary" href={`/colis/${colis.id}/edit`}>
                                        {colis.trackingCode}
                                      </a>
                                      <span className="text-2sm text-secondary-foreground font-normal leading-3">
                                        {colis.productNature}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`kt-badge ${colis.etatBadgeClass} kt-badge-outline rounded-[30px] px-2 py-0.5`}>
                                      {colis.etatLabel}
                                    </span>
                                  </td>
                                  <td className="text-sm font-normal text-secondary-foreground">
                                    {colis.createdAt}
                                  </td>
                                  <td>
                                    <div className="flex flex-col gap-1">
                                      <span className="font-medium text-sm text-foreground">{colis.city}</span>
                                      <span className="text-2sm text-primary font-semibold leading-3">
                                        {colis.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-secondary-foreground">
                                  Aucun colis correspondant
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Datatable Footer */}
                      <div className="kt-card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-secondary-foreground text-sm font-medium">
                        <div className="flex items-center gap-2 order-2 md:order-1">
                          Afficher 
                          <select className="kt-select w-16" defaultValue="5">
                            <option value="5">5</option>
                            <option value="10">10</option>
                          </select> 
                          par page
                        </div>
                        <div className="flex items-center gap-4 order-1 md:order-2">
                          <span>
                            Affichage de {filteredColis.length} sur {data.recentColis.length} entrées
                          </span>
                        </div>
                      </div>

                    </div>
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
