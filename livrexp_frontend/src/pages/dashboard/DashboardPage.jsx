import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

const defaultStatusColors = {
  'Livré': '#27d37f',
  'Expédié': '#1b84ff',
  'En préparation': '#f6c000',
  'Créé': '#7239ea',
  'Retourné': '#f8285a',
};

// ── Native SVG Area Chart Component ──────────────────────────────────────────
function SvgTrendAreaChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 230;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };

  const maxVal = Math.max(...data.map(d => Math.max(d.total || 0, d.livres || 0)), 10);
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const pointsTotal = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding.top + chartH - ((d.total || 0) / maxVal) * chartH;
    return { x, y, data: d, index: i };
  });

  const pointsLivres = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding.top + chartH - ((d.livres || 0) / maxVal) * chartH;
    return { x, y, data: d, index: i };
  });

  const createD = (pts) => {
    if (pts.length === 0) return '';
    return pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  };

  const dTotalLine = createD(pointsTotal);
  const dTotalArea = `${dTotalLine} L ${pointsTotal[pointsTotal.length - 1].x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${padding.left} ${(padding.top + chartH).toFixed(1)} Z`;

  const dLivresLine = createD(pointsLivres);
  const dLivresArea = `${dLivresLine} L ${pointsLivres[pointsLivres.length - 1].x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${padding.left} ${(padding.top + chartH).toFixed(1)} Z`;

  const hoveredItem = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b84ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1b84ff" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradLivres" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27d37f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#27d37f" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartH * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border)" strokeDasharray="4 4" opacity="0.4" />
              <text x={padding.left - 6} y={y + 4} textAnchor="end" className="text-[10px] fill-muted-foreground font-mono">{val}</text>
            </g>
          );
        })}

        {/* Areas */}
        <path d={dTotalArea} fill="url(#gradTotal)" />
        <path d={dLivresArea} fill="url(#gradLivres)" />

        {/* Lines */}
        <path d={dTotalLine} fill="none" stroke="#1b84ff" strokeWidth="2.5" strokeLinecap="round" />
        <path d={dLivresLine} fill="none" stroke="#27d37f" strokeWidth="2.5" strokeLinecap="round" />

        {/* Dots */}
        {pointsTotal.map((pt, i) => (
          <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
            <circle cx={pt.x} cy={pt.y} r={hoverIndex === i ? 5 : 3.5} fill="#1b84ff" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx={pointsLivres[i].x} cy={pointsLivres[i].y} r={hoverIndex === i ? 5 : 3.5} fill="#27d37f" stroke="#ffffff" strokeWidth="1.5" />
            <text x={pt.x} y={height - 6} textAnchor="middle" className="text-[10px] fill-muted-foreground">{pt.data.date}</text>
          </g>
        ))}
      </svg>

      {/* Floating Tooltip */}
      {hoveredItem && (
        <div className="absolute top-2 right-4 bg-background border border-border p-2.5 rounded-lg shadow-lg text-xs z-10">
          <div className="font-bold text-foreground mb-1">{hoveredItem.date}</div>
          <div className="text-primary font-medium">Total: {hoveredItem.total} colis</div>
          <div className="text-success font-medium">Livrés: {hoveredItem.livres} colis</div>
        </div>
      )}
    </div>
  );
}

// ── Native SVG Bar Chart Component (Villes) ──────────────────────────────────
function SvgCityBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => Math.max(d.total || 0, d.livres || 0)), 10);

  return (
    <div className="w-full space-y-2.5 pt-1">
      {data.slice(0, 5).map((c) => {
        const pctTotal = (c.total / maxVal) * 100;
        const pctLivres = (c.livres / maxVal) * 100;
        return (
          <div key={c.city} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">{c.city}</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                <span className="text-success font-bold">{c.livres}</span> / {c.total} livrés ({c.rate}%)
              </span>
            </div>
            <div className="w-full h-3 bg-accent/40 rounded-full overflow-hidden flex relative">
              <div
                className="h-full bg-primary/30 rounded-full transition-all duration-500 absolute top-0 left-0"
                style={{ width: `${pctTotal}%` }}
              />
              <div
                className="h-full bg-success rounded-full transition-all duration-500 relative z-10"
                style={{ width: `${pctLivres}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard Component ──────────────────────────────────────────────────
export default function DashboardPage() {
  const [period, setPeriod]       = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);

  const headers = () => {
    const t = localStorage.getItem('auth_token');
    return { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  };

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/analytics/advanced?period=${period}`, { headers: headers(), credentials: 'include' });
      if (r.ok) {
        const d = await r.json();
        if (d.success) setAnalytics(d);
      }
    } catch {
      // Fallback data
      setAnalytics({
        kpis: {
          today: { colisCrees: 12, colisLivres: 9, colisRetournes: 1, colisEnCours: 2, caToday: 3450 },
          global: { totalColis: 142, colisLivres: 95, colisRetournes: 14, tauxLivraisonGlobal: 66.9, tauxRetourGlobal: 9.8, alertReturnRate: false, caToday: 3450, caMonth: 54300, caYear: 382000 },
          comparison: { currentMonthTotal: 142, prevMonthTotal: 118, volumeGrowth: 20.3, currentMonthCa: 54300, prevMonthCa: 46200, caGrowth: 17.5 },
        },
        trendData: [
          { date: '18 Jul', total: 10, livres: 8, retours: 1 },
          { date: '20 Jul', total: 15, livres: 12, retours: 2 },
          { date: '22 Jul', total: 18, livres: 15, retours: 1 },
          { date: '24 Jul', total: 22, livres: 18, retours: 2 },
          { date: '26 Jul', total: 19, livres: 16, retours: 1 },
          { date: '28 Jul', total: 25, livres: 20, retours: 3 },
          { date: '30 Jul', total: 33, livres: 26, retours: 4 },
        ],
        cityData: [
          { city: 'Casablanca', total: 58, livres: 45, retours: 4, rate: 77.6, ca: 24500 },
          { city: 'Rabat', total: 34, livres: 26, retours: 3, rate: 76.5, ca: 14200 },
          { city: 'Marrakech', total: 22, livres: 15, retours: 2, rate: 68.2, ca: 8900 },
          { city: 'Tanger', total: 16, livres: 11, retours: 1, rate: 68.8, ca: 5600 },
          { city: 'Agadir', total: 12, livres: 8, retours: 1, rate: 66.7, ca: 4100 },
        ]
      });
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // Fetch recent colis from dashboard API
  const [recentColis, setRecentColis] = useState([]);
  useEffect(() => {
    fetch('/api/dashboard', { headers: headers(), credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.recentColis) setRecentColis(data.recentColis);
      })
      .catch(() => {
        setRecentColis([
          { id: 1, trackingCode: 'F-20260731-0005', productNature: 'Téléphone portable', etatLabel: 'Livré', etatBadgeClass: 'kt-badge-success', createdAt: '31 Jul, 2026 10:30', city: 'Casablanca', price: 1200.00 },
          { id: 2, trackingCode: 'F-20260731-0004', productNature: 'Veste Cuir', etatLabel: 'En préparation', etatBadgeClass: 'kt-badge-warning', createdAt: '31 Jul, 2026 09:15', city: 'Rabat', price: 450.00 },
          { id: 3, trackingCode: 'F-20260730-0003', productNature: 'Crème Visage', etatLabel: 'Expédié', etatBadgeClass: 'kt-badge-info', createdAt: '30 Jul, 2026 17:45', city: 'Marrakech', price: 290.00 },
          { id: 4, trackingCode: 'F-20260730-0002', productNature: 'Chaussures Sport', etatLabel: 'Retourné', etatBadgeClass: 'kt-badge-destructive', createdAt: '30 Jul, 2026 14:20', city: 'Tanger', price: 650.00 },
          { id: 5, trackingCode: 'F-20260729-0001', productNature: 'Sac à Main', etatLabel: 'Créé', etatBadgeClass: 'kt-badge-primary', createdAt: '29 Jul, 2026 11:05', city: 'Fès', price: 380.00 }
        ]);
      });
  }, []);

  const handleExportCSV = () => { window.location.href = '/api/analytics/export'; };
  const handlePrintPDF = () => { window.print(); };

  const kpis = analytics?.kpis || {};
  const today = kpis.today || {};
  const global = kpis.global || {};
  const comp = kpis.comparison || {};
  const trendData = analytics?.trendData || [];
  const cityData = analytics?.cityData || [];

  const totalColisCount = global.totalColis || 142;
  const livresCount = global.colisLivres || 95;
  const retoursCount = global.colisRetournes || 14;
  const autresCount = Math.max(0, totalColisCount - livresCount - retoursCount);

  const percentLivre = totalColisCount > 0 ? (livresCount / totalColisCount) * 100 : 0;
  const percentRetour = totalColisCount > 0 ? (retoursCount / totalColisCount) * 100 : 0;
  const percentAutre = totalColisCount > 0 ? (autresCount / totalColisCount) * 100 : 0;

  const filteredColis = recentColis.filter(c => 
    !searchQuery || 
    c.trackingCode?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.productNature?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout activeMenu="dashboard">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Tableau de bord</h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Bienvenue sur le tableau de bord de LivrExpress
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              {/* Period Selector */}
              <div className="flex items-center border border-border rounded-lg bg-accent/30 p-1">
                {[
                  { key: 'today', label: "Aujourd'hui" },
                  { key: 'week', label: '7 jours' },
                  { key: 'month', label: 'Ce mois' },
                  { key: 'year', label: 'Cette année' },
                ].map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPeriod(p.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === p.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-secondary-foreground hover:text-foreground'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button type="button" className="kt-btn kt-btn-outline" onClick={handleExportCSV}>
                <i className="ki-filled ki-file-down text-base" /> Export Excel
              </button>
              <button type="button" className="kt-btn kt-btn-primary" onClick={handlePrintPDF}>
                <i className="ki-filled ki-printer text-base" /> Rapport PDF
              </button>
            </div>
          </div>
        </div>

        <div className="kt-container-fixed">
          <div className="grid gap-5 lg:gap-7.5">

            {/* KPI Alert Banner */}
            {global.alertReturnRate && (
              <div className="flex gap-3 border rounded-xl p-4 bg-destructive/10 border-destructive/30 text-destructive items-start">
                <i className="ki-filled ki-information-2 text-xl shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Alerte KPI — Taux de retour critique ({global.tauxRetourGlobal}%)</strong>
                  Le taux de retour global dépasse le seuil autorisé de 10%. Veuillez vérifier les colis en retour et optimiser les affectations de livraison.
                </div>
              </div>
            )}

            {/* Grid 1: Top 4 Metronic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7.5">
              
              {/* Card 1: Total Colis */}
              <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-stats-gradient">
                <div className="mt-4 ms-5 text-primary flex items-center justify-between pe-5">
                  <i className="ki-filled ki-delivery-3 text-3xl" />
                  <span className="kt-badge kt-badge-primary kt-badge-outline rounded-full text-xs">
                    +{today.colisCrees ?? 0} aujourd'hui
                  </span>
                </div>
                <div className="flex flex-col gap-1 pb-4 px-5">
                  <span className="text-3xl font-semibold text-mono">{totalColisCount}</span>
                  <span className="text-sm font-normal text-secondary-foreground">Colis Enregistrés</span>
                  <span className="text-xs text-muted-foreground">{today.colisLivres ?? 0} livrés • {today.colisEnCours ?? 0} en cours</span>
                </div>
              </div>

              {/* Card 2: Colis Livrés */}
              <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-stats-gradient">
                <div className="mt-4 ms-5 text-success flex items-center justify-between pe-5">
                  <i className="ki-filled ki-verify text-3xl" />
                  <span className="kt-badge kt-badge-success kt-badge-outline rounded-full text-xs">
                    {global.tauxLivraisonGlobal ?? 0}%
                  </span>
                </div>
                <div className="flex flex-col gap-1 pb-4 px-5">
                  <span className="text-3xl font-semibold text-mono text-success">{livresCount}</span>
                  <span className="text-sm font-normal text-secondary-foreground">Colis Livrés</span>
                  <span className="text-xs text-muted-foreground">Taux de livraison global de {global.tauxLivraisonGlobal ?? 0}%</span>
                </div>
              </div>

              {/* Card 3: Chiffre d'Affaires / CRBT */}
              <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-stats-gradient">
                <div className="mt-4 ms-5 text-warning flex items-center justify-between pe-5">
                  <i className="ki-filled ki-dollar text-3xl" />
                  {comp.caGrowth !== undefined && (
                    <span className={`kt-badge ${comp.caGrowth >= 0 ? 'kt-badge-success' : 'kt-badge-destructive'} kt-badge-outline rounded-full text-xs`}>
                      {comp.caGrowth >= 0 ? '+' : ''}{comp.caGrowth}% vs m-1
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 pb-4 px-5">
                  <span className="text-3xl font-semibold text-mono">{(global.caMonth ?? 54300).toLocaleString('fr-FR')} MAD</span>
                  <span className="text-sm font-normal text-secondary-foreground">Chiffre d'affaires (Ce mois)</span>
                  <span className="text-xs text-muted-foreground">Jour: {(global.caToday ?? 0).toLocaleString('fr-FR')} MAD • Année: {(global.caYear ?? 0).toLocaleString('fr-FR')} MAD</span>
                </div>
              </div>

              {/* Card 4: Colis en cours & Retours */}
              <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-stats-gradient">
                <div className="mt-4 ms-5 text-info flex items-center justify-between pe-5">
                  <i className="ki-filled ki-chart-line-star text-3xl" />
                  <span className="kt-badge kt-badge-info kt-badge-outline rounded-full text-xs">
                    Comparatif
                  </span>
                </div>
                <div className="flex flex-col gap-1 pb-4 px-5">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-semibold text-mono">{comp.currentMonthTotal ?? totalColisCount}</span>
                    <span className="text-xs text-muted-foreground">vs {comp.prevMonthTotal ?? 118} m-1</span>
                  </div>
                  <span className="text-sm font-normal text-secondary-foreground">Volume de colis ce mois</span>
                  <span className={`text-xs font-semibold ${comp.volumeGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {comp.volumeGrowth >= 0 ? '▲ +' : '▼ '}{comp.volumeGrowth}% par rapport au mois dernier
                  </span>
                </div>
              </div>

            </div>

            {/* Grid 2: Highlights Card & Volume Chart Card */}
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
                          {(global.caMonth ?? 54300).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
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
                          <span>{(global.caYear ?? 382000).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <i className="ki-filled ki-verify text-base text-muted-foreground"></i>
                          <span className="text-sm font-normal text-mono">CRBT Livré</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-foreground gap-6">
                          <span>{(global.caMonth ?? 54300).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                          <span className="flex items-center gap-0.5 text-green-500">
                            <i className="ki-filled ki-arrow-up"></i>
                            {percentLivre.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <i className="ki-filled ki-delivery-3 text-base text-muted-foreground"></i>
                          <span className="text-sm font-normal text-mono">CRBT En Transit</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-foreground gap-6">
                          <span>{(today.caToday ?? 3450).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                          <span className="flex items-center gap-0.5 text-green-500">
                            <i className="ki-filled ki-arrow-up"></i>
                            {percentAutre.toFixed(1)}%
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
                    <h3 className="kt-card-title">Volume et Évolution des Colis</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-secondary-foreground font-medium">
                        {period === 'today' ? "Aujourd'hui" : period === 'week' ? '7 derniers jours' : period === 'year' ? 'Cette année' : '30 derniers jours'}
                      </span>
                    </div>
                  </div>
                  <div className="kt-card-content flex flex-col justify-end items-stretch grow px-4 py-3">
                    <SvgTrendAreaChart data={trendData} />
                  </div>
                </div>
              </div>

            </div>

            {/* Grid 3: Performance/Top Villes & Recent Colis Table */}
            <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
              
              {/* Performance & Top Villes Card */}
              <div className="lg:col-span-1">
                <div className="kt-card h-full">
                  <div className="kt-card-content lg:p-7.5 lg:pt-6 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between flex-wrap gap-5 mb-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xl font-semibold text-mono">Performance</span>
                          <span className="text-sm font-semibold text-foreground">Répartition par Ville</span>
                        </div>
                        <i className="ki-filled ki-delivery-3 text-3xl text-primary"></i>
                      </div>
                      
                      {/* City Bar chart list */}
                      <SvgCityBarChart data={cityData} />
                    </div>

                    <div className="flex rounded-lg bg-accent/50 gap-6 p-4 mt-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-normal text-foreground">
                          <i className="ki-filled ki-geolocation text-base text-muted-foreground"></i>
                          Plateforme
                        </div>
                        <div className="text-xs font-medium text-foreground">LivrExpress</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-normal text-foreground">
                          <i className="ki-filled ki-users text-base text-muted-foreground"></i>
                          Livreurs
                        </div>
                        <div className="flex -space-x-2">
                          <div className="size-[26px] rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] ring-1 ring-background">YB</div>
                          <div className="size-[26px] rounded-full bg-success/20 text-success flex items-center justify-center font-bold text-[10px] ring-1 ring-background">KA</div>
                          <div className="size-[26px] rounded-full bg-warning/20 text-warning flex items-center justify-center font-bold text-[10px] ring-1 ring-background">MR</div>
                        </div>
                      </div>
                    </div>
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
                                      <a className="leading-none font-semibold text-sm text-mono hover:text-primary" href={`/colis/`}>
                                        {colis.trackingCode}
                                      </a>
                                      <span className="text-2sm text-secondary-foreground font-normal leading-3">
                                        {colis.productNature}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`kt-badge ${colis.etatBadgeClass || 'kt-badge-primary'} kt-badge-outline rounded-[30px] px-2 py-0.5`}>
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
                                        {colis.price?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
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
                            Affichage de {filteredColis.length} sur {recentColis.length} entrées
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
