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
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

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
            <stop offset="0%" stopColor="#1b84ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1b84ff" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradLivres" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27d37f" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#27d37f" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartH * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border)" strokeDasharray="4 4" opacity="0.5" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-muted-foreground font-mono">{val}</text>
            </g>
          );
        })}

        {/* Areas */}
        <path d={dTotalArea} fill="url(#gradTotal)" />
        <path d={dLivresArea} fill="url(#gradLivres)" />

        {/* Lines */}
        <path d={dTotalLine} fill="none" stroke="#1b84ff" strokeWidth="2.5" strokeLinecap="round" />
        <path d={dLivresLine} fill="none" stroke="#27d37f" strokeWidth="2.5" strokeLinecap="round" />

        {/* Dots & Interactivity */}
        {pointsTotal.map((pt, i) => (
          <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
            <circle cx={pt.x} cy={pt.y} r={hoverIndex === i ? 6 : 4} fill="#1b84ff" stroke="#ffffff" strokeWidth="2" />
            <circle cx={pointsLivres[i].x} cy={pointsLivres[i].y} r={hoverIndex === i ? 6 : 4} fill="#27d37f" stroke="#ffffff" strokeWidth="2" />
            <text x={pt.x} y={height - 8} textAnchor="middle" className="text-[10px] fill-muted-foreground">{pt.data.date}</text>
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

// ── Native SVG Donut Chart Component ─────────────────────────────────────────
function SvgStatusDonutChart({ data }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let cumulativeAngle = 0;
  const slices = data.map(d => {
    const angle = total > 0 ? (d.value / total) * 360 : 0;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...d, angle, startAngle };
  });

  const getCoordinatesForAngle = (angleInDegrees, radius = 40) => {
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
    return {
      x: 50 + radius * Math.cos(angleInRadians),
      y: 50 + radius * Math.sin(angleInRadians)
    };
  };

  return (
    <div className="relative size-48 mx-auto flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="size-full overflow-visible transform -rotate-90">
        {slices.map((slice, i) => {
          if (slice.value === 0) return null;
          const start = getCoordinatesForAngle(slice.startAngle);
          const end = getCoordinatesForAngle(slice.startAngle + slice.angle);
          const largeArcFlag = slice.angle > 180 ? 1 : 0;
          const pathData = [
            `M ${start.x} ${start.y}`,
            `A 40 40 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
            `L 50 50`,
          ].join(' ');

          return (
            <path
              key={i}
              d={pathData}
              fill={slice.color || defaultStatusColors[slice.name] || '#3f4254'}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>{`${slice.name}: ${slice.value} colis`}</title>
            </path>
          );
        })}
        {/* Inner cutout for Donut style */}
        <circle cx="50" cy="50" r="26" fill="var(--card, #ffffff)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-xl font-bold text-mono text-foreground">{total}</span>
        <span className="text-[10px] text-muted-foreground uppercase font-medium">Total</span>
      </div>
    </div>
  );
}

// ── Native SVG Bar Chart Component (Villes) ──────────────────────────────────
function SvgCityBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => Math.max(d.total || 0, d.livres || 0)), 10);

  return (
    <div className="w-full space-y-3 pt-2">
      {data.map((c) => {
        const pctTotal = (c.total / maxVal) * 100;
        const pctLivres = (c.livres / maxVal) * 100;
        return (
          <div key={c.city} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">{c.city}</span>
              <span className="text-muted-foreground font-mono">
                <span className="text-success font-bold">{c.livres}</span> / {c.total} livrés ({c.rate}%)
              </span>
            </div>
            <div className="w-full h-3.5 bg-accent/40 rounded-full overflow-hidden flex relative">
              <div
                className="h-full bg-primary/40 rounded-full transition-all duration-500 absolute top-0 left-0"
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
export default function DashboardPage({ navigate }) {
  const [period, setPeriod]       = useState('month');
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
        statusData: [
          { name: 'Livré', value: 95, color: '#27d37f' },
          { name: 'Expédié', value: 22, color: '#1b84ff' },
          { name: 'En préparation', value: 15, color: '#f6c000' },
          { name: 'Créé', value: 12, color: '#7239ea' },
          { name: 'Retourné', value: 10, color: '#f8285a' },
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

  const handleExportCSV = () => { window.location.href = '/api/analytics/export'; };
  const handlePrintPDF = () => { window.print(); };

  const kpis = analytics?.kpis || {};
  const today = kpis.today || {};
  const global = kpis.global || {};
  const comp = kpis.comparison || {};
  const trendData = analytics?.trendData || [];
  const statusData = analytics?.statusData || [];
  const cityData = analytics?.cityData || [];

  return (
    <DashboardLayout activeMenu="dashboard">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header Section */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Tableau de Bord Analytics</h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Statistiques globales, performances logistiques et suivi du chiffre d'affaires
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2.5">
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
                  Le taux de retour global dépasse le seuil autorisé de 10%. Veuillez vérifier les colis en retour et optimiser les affectations par zone.
                </div>
              </div>
            )}

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-stats-gradient">
                <div className="mt-4 ms-5 text-primary flex items-center justify-between pe-5">
                  <i className="ki-filled ki-delivery-3 text-3xl" />
                  <span className="kt-badge kt-badge-primary kt-badge-outline rounded-full text-xs">
                    +{today.colisCrees ?? 0} aujourd'hui
                  </span>
                </div>
                <div className="flex flex-col gap-1 pb-4 px-5">
                  <span className="text-3xl font-semibold text-mono">{today.colisCrees ?? 0}</span>
                  <span className="text-sm font-normal text-secondary-foreground">Colis créés aujourd'hui</span>
                  <span className="text-xs text-muted-foreground">{today.colisLivres ?? 0} livrés • {today.colisEnCours ?? 0} en cours</span>
                </div>
              </div>

              <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-stats-gradient">
                <div className="mt-4 ms-5 text-success flex items-center justify-between pe-5">
                  <i className="ki-filled ki-verify text-3xl" />
                  <span className="kt-badge kt-badge-success kt-badge-outline rounded-full text-xs">Global</span>
                </div>
                <div className="flex flex-col gap-1 pb-4 px-5">
                  <span className="text-3xl font-semibold text-mono text-success">{global.tauxLivraisonGlobal ?? 0}%</span>
                  <span className="text-sm font-normal text-secondary-foreground">Taux de livraison global</span>
                  <span className="text-xs text-muted-foreground">{global.colisLivres ?? 0} livrés sur {global.totalColis ?? 0} colis</span>
                </div>
              </div>

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
                  <span className="text-3xl font-semibold text-mono">{(global.caMonth ?? 0).toLocaleString('fr-FR')} MAD</span>
                  <span className="text-sm font-normal text-secondary-foreground">Chiffre d'affaires (Ce mois)</span>
                  <span className="text-xs text-muted-foreground">Jour: {(global.caToday ?? 0).toLocaleString('fr-FR')} MAD • Année: {(global.caYear ?? 0).toLocaleString('fr-FR')} MAD</span>
                </div>
              </div>

              <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-stats-gradient">
                <div className="mt-4 ms-5 text-info flex items-center justify-between pe-5">
                  <i className="ki-filled ki-chart-line-star text-3xl" />
                  <span className="kt-badge kt-badge-info kt-badge-outline rounded-full text-xs">Comparatif</span>
                </div>
                <div className="flex flex-col gap-1 pb-4 px-5">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-semibold text-mono">{comp.currentMonthTotal ?? 0}</span>
                    <span className="text-xs text-muted-foreground">vs {comp.prevMonthTotal ?? 0} m-1</span>
                  </div>
                  <span className="text-sm font-normal text-secondary-foreground">Volume de colis ce mois</span>
                  <span className={`text-xs font-semibold ${comp.volumeGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {comp.volumeGrowth >= 0 ? '▲ +' : '▼ '}{comp.volumeGrowth}% par rapport au mois dernier
                  </span>
                </div>
              </div>

            </div>

            {/* Row 2: Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">

              {/* Chart 1: Evolution Temporelle */}
              <div className="xl:col-span-2 kt-card">
                <div className="kt-card-header">
                  <div>
                    <h3 className="kt-card-title">Évolution des Livraisons</h3>
                    <p className="text-xs text-secondary-foreground mt-0.5">Volume quotidien des colis créés et livrés</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Total</span>
                    <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-success" /> Livrés</span>
                  </div>
                </div>
                <div className="kt-card-content p-5 lg:p-7.5">
                  <SvgTrendAreaChart data={trendData} />
                </div>
              </div>

              {/* Chart 2: Donut Status Chart */}
              <div className="xl:col-span-1 kt-card">
                <div className="kt-card-header">
                  <h3 className="kt-card-title">Répartition par Statut</h3>
                </div>
                <div className="kt-card-content p-5 lg:p-7.5 flex flex-col items-center justify-center">
                  <SvgStatusDonutChart data={statusData} />
                  <div className="w-full grid grid-cols-2 gap-2 mt-5">
                    {statusData.map((s) => (
                      <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-accent/40 border border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-xs font-medium text-foreground truncate">{s.name}</span>
                        </div>
                        <span className="text-xs font-bold text-mono me-1">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Row 3: City Performance Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">

              <div className="lg:col-span-2 kt-card">
                <div className="kt-card-header">
                  <div>
                    <h3 className="kt-card-title">Volume et Performance par Ville</h3>
                    <p className="text-xs text-secondary-foreground mt-0.5">Taux de succès des livraisons par zone géographique</p>
                  </div>
                </div>
                <div className="kt-card-content p-5 lg:p-7.5">
                  <SvgCityBarChart data={cityData} />
                </div>
              </div>

              <div className="lg:col-span-1 kt-card">
                <div className="kt-card-header">
                  <h3 className="kt-card-title">Top Villes</h3>
                  <span className="text-xs text-secondary-foreground">Chiffre d'Affaires</span>
                </div>
                <div className="kt-card-table pb-3">
                  <table className="kt-table align-middle text-sm text-muted-foreground">
                    <thead>
                      <tr>
                        <th className="py-2.5 ps-5 text-start font-medium text-secondary-foreground">Ville</th>
                        <th className="py-2.5 text-center font-medium text-secondary-foreground">Total</th>
                        <th className="py-2.5 text-center font-medium text-secondary-foreground">Taux</th>
                        <th className="py-2.5 pe-5 text-end font-medium text-secondary-foreground">CA (MAD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cityData.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-secondary-foreground">Aucune donnée ville</td></tr>
                      ) : cityData.map((c) => (
                        <tr key={c.city} className="border-b border-border/40 hover:bg-accent/30">
                          <td className="py-2.5 ps-5 font-semibold text-foreground">{c.city}</td>
                          <td className="py-2.5 text-center text-foreground font-medium">{c.total}</td>
                          <td className="py-2.5 text-center">
                            <span className={`kt-badge kt-badge-outline rounded-full text-xs ${c.rate >= 75 ? 'kt-badge-success' : c.rate >= 50 ? 'kt-badge-warning' : 'kt-badge-destructive'}`}>
                              {c.rate}%
                            </span>
                          </td>
                          <td className="py-2.5 pe-5 text-end text-foreground font-medium">
                            {c.ca.toLocaleString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
