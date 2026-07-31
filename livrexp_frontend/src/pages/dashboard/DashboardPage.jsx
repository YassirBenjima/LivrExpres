import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

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
  ],
  chartLabels: ['17 Jun', '18 Jun', '19 Jun', '20 Jun', '21 Jun', '22 Jun', '23 Jun'],
  chartData: [8, 14, 12, 19, 24, 21, 28]
};

// Clean SVG Area Chart for Volume Card
function VolumeAreaChart({ labels = [], chartData = [] }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!chartData || chartData.length === 0) return null;

  const width = 600;
  const height = 220;
  const padLeft = 35;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const maxVal = Math.max(...chartData, 10);
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const points = chartData.map((val, i) => {
    const x = padLeft + (i / Math.max(chartData.length - 1, 1)) * chartW;
    const y = padTop + chartH - (val / maxVal) * chartH;
    return { x, y, val, label: labels[i] || `Jour ${i + 1}` };
  });

  const lineD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const areaD = `${lineD} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${padLeft} ${(padTop + chartH).toFixed(1)} Z`;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b84ff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1b84ff" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {[0, 0.33, 0.66, 1].map((r, i) => {
          const y = padTop + chartH * (1 - r);
          const v = Math.round(maxVal * r);
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="var(--border)" strokeDasharray="3 3" opacity="0.4" />
              <text x={padLeft - 6} y={y + 3} textAnchor="end" className="text-[10px] fill-muted-foreground font-mono">{v}</text>
            </g>
          );
        })}

        <path d={areaD} fill="url(#volGrad)" />
        <path d={lineD} fill="none" stroke="#1b84ff" strokeWidth="3" strokeLinecap="round" />

        {points.map((p, i) => (
          <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
            <circle cx={p.x} cy={p.y} r={hoverIdx === i ? 6 : 4} fill="#1b84ff" stroke="#ffffff" strokeWidth="2" />
            <text x={p.x} y={height - 8} textAnchor="middle" className="text-[10px] fill-muted-foreground">{p.label}</text>
          </g>
        ))}
      </svg>

      {hoverIdx !== null && points[hoverIdx] && (
        <div
          className="absolute bg-background border border-border px-2.5 py-1.5 rounded-md shadow-md text-xs font-semibold pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: `${(points[hoverIdx].x / width) * 100}%`, top: `${(points[hoverIdx].y / height) * 100 - 8}%` }}
        >
          {points[hoverIdx].val} colis ({points[hoverIdx].label})
        </div>
      )}
    </div>
  );
}

export default function DashboardPage({ dashboardData = null, loading = false, refetchData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [apiData, setApiData] = useState(dashboardData);

  useEffect(() => {
    if (dashboardData) {
      setApiData(dashboardData);
      return;
    }
    const token = localStorage.getItem('auth_token');
    fetch('/api/dashboard', {
      headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: 'include',
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setApiData(data); })
      .catch(() => {});
  }, [dashboardData]);

  const data = apiData || mockDataFallback;

  if (loading) {
    return (
      <DashboardLayout activeMenu="dashboard">
        <main className="grow pt-5 dashboard-content-shift" role="content">
          <div className="kt-container-fixed">
            <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
              <div className="flex flex-col justify-center gap-2">
                <div className="h-6 w-32 shimmer rounded-md"></div>
                <div className="h-4 w-96 shimmer rounded-md"></div>
              </div>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const filteredColis = (data.recentColis || []).filter(colis => 
    colis.trackingCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    colis.productNature?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    colis.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalColis = data.totalColis || 0;
  const percentLivre = totalColis > 0 ? ((data.colisLivres || 0) / totalColis * 100) : 0;
  const percentRetour = totalColis > 0 ? ((data.colisRetournes || 0) / totalColis * 100) : 0;
  const percentAutre = Math.max(0, 100 - percentLivre - percentRetour);

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
              <a className="kt-btn kt-btn-outline" href="/colis/new">
                Nouveau Colis
              </a>
              <a className="kt-btn kt-btn-primary" href="/bon-livraison/new">
                Nouveau Bon
              </a>
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
                        {data.totalColis || 0}
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
                        {data.colisLivres || 0}
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
                        {(data.colisExpedies || 0) + (data.colisEnPreparation || 0)}
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
                        {data.colisRetournes || 0}
                      </span>
                      <span className="text-sm font-normal text-secondary-foreground">
                        Colis Retournés
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Welcome Banner Card */}
              <div className="lg:col-span-2">
                <div className="kt-card h-full welcome-callout-card">
                  <div className="kt-card-content p-10 bg-no-repeat bg-[length:40%] bg-[right_center] lg:bg-[right_10%_center]">
                    <div className="flex flex-col justify-center gap-4 max-w-[60%]">
                      <div className="flex -space-x-2">
                        <img className="hover:z-5 relative shrink-0 rounded-full ring-1 ring-background size-10" src="/assets/media/avatars/300-4.png" alt="Avatar"/>
                        <img className="hover:z-5 relative shrink-0 rounded-full ring-1 ring-background size-10" src="/assets/media/avatars/300-1.png" alt="Avatar"/>
                        <img className="hover:z-5 relative shrink-0 rounded-full ring-1 ring-background size-10" src="/assets/media/avatars/300-2.png" alt="Avatar"/>
                        <span className="hover:z-5 relative inline-flex items-center justify-center shrink-0 rounded-full ring-1 font-semibold leading-none text-2xs size-10 text-white text-xs ring-background bg-green-500">
                          S
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-mono">
                        LivrExpress<br/>Tableau de Bord
                      </h2>
                      <p className="text-sm font-normal text-secondary-foreground leading-5.5">
                        Gérez vos colis, vos ramassages, vos retours et vos bons de livraison en toute simplicité avec notre interface d'administration temps réel.
                      </p>
                    </div>
                  </div>
                  <div className="kt-card-footer justify-center">
                    <a className="kt-link kt-link-underlined kt-link-dashed" href="/colis">
                      Gérer les Colis
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
                          {(data.crbtLivres || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
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
                          <span>{(data.totalCrbt || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <i className="ki-filled ki-verify text-base text-muted-foreground"></i>
                          <span className="text-sm font-normal text-mono">CRBT Livré</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-foreground gap-6">
                          <span>{(data.crbtLivres || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                          <span className="flex items-center gap-0.5 text-green-500">
                            <i className="ki-filled ki-arrow-up"></i>
                            {(data.totalCrbt || 0) > 0 ? (((data.crbtLivres || 0) / data.totalCrbt) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <i className="ki-filled ki-delivery-3 text-base text-muted-foreground"></i>
                          <span className="text-sm font-normal text-mono">CRBT En Transit</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-foreground gap-6">
                          <span>{(data.crbtEnCours || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                          <span className="flex items-center gap-0.5 text-green-500">
                            <i className="ki-filled ki-arrow-up"></i>
                            {(data.totalCrbt || 0) > 0 ? (((data.crbtEnCours || 0) / data.totalCrbt) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Volume Chart Card */}
              <div className="lg:col-span-2">
                <div className="kt-card h-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">Volume des Colis Enregistrés</h3>
                    <div className="flex gap-5">
                      <select className="kt-select w-36" defaultValue="1">
                        <option value="1">7 jours</option>
                      </select>
                    </div>
                  </div>
                  <div className="kt-card-content flex flex-col justify-end items-stretch grow p-5">
                    <VolumeAreaChart labels={data.chartLabels} chartData={data.chartData} />
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
                          <img className="hover:z-5 relative shrink-0 rounded-full ring-1 ring-background size-[30px]" src="/assets/media/avatars/300-4.png" alt="Avatar"/>
                          <img className="hover:z-5 relative shrink-0 rounded-full ring-1 ring-background size-[30px]" src="/assets/media/avatars/300-1.png" alt="Avatar"/>
                          <img className="hover:z-5 relative shrink-0 rounded-full ring-1 ring-background size-[30px]" src="/assets/media/avatars/300-2.png" alt="Avatar"/>
                          <span className="hover:z-5 relative inline-flex items-center justify-center shrink-0 rounded-full ring-1 font-semibold leading-none text-2xs size-[30px] text-white text-xs ring-background bg-green-500">
                            +5
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="kt-card-footer justify-center">
                    <a className="kt-link kt-link-underlined kt-link-dashed" href="/colis">
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
                                      <a className="leading-none font-semibold text-sm text-mono hover:text-primary" href={`/colis`}>
                                        {colis.trackingCode}
                                      </a>
                                      <span className="text-2sm text-secondary-foreground font-normal leading-3">
                                        {colis.productNature}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`kt-badge ${colis.etatBadgeClass || 'kt-badge-primary'} kt-badge-outline rounded-[30px] px-2 py-0.5`}>
                                      {colis.etatLabel || 'Créé'}
                                    </span>
                                  </td>
                                  <td className="text-sm font-normal text-secondary-foreground">
                                    {colis.createdAt}
                                  </td>
                                  <td>
                                    <div className="flex flex-col gap-1">
                                      <span className="font-medium text-sm text-foreground">{colis.city}</span>
                                      <span className="text-2sm text-primary font-semibold leading-3">
                                        {(colis.price || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
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
                            Affichage de {filteredColis.length} sur {(data.recentColis || []).length} entrées
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
