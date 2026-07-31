import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardLayout from '../../components/ui/DashboardLayout';

const defaultStatusColors = {
  'Livré': '#27d37f',
  'Expédié': '#1b84ff',
  'En préparation': '#f6c000',
  'Créé': '#7239ea',
  'Retourné': '#f8285a',
};

export default function DashboardPage({ navigate }) {
  const [period, setPeriod]       = useState('month'); // 'today', 'week', 'month', 'year'
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
      // Fallback data if API unreachable
      setAnalytics({
        kpis: {
          today: { colisCrees: 12, colisLivres: 9, colisRetournes: 1, colisEnCours: 2, caToday: 3450 },
          global: { totalColis: 142, colisLivres: 95, colisRetournes: 14, tauxLivraisonGlobal: 66.9, tauxRetourGlobal: 9.8, alertReturnRate: false, caToday: 3450, caMonth: 54300, caYear: 382000 },
          comparison: { currentMonthTotal: 142, prevMonthTotal: 118, volumeGrowth: 20.3, currentMonthCa: 54300, prevMonthCa: 46200, caGrowth: 17.5 },
        },
        trendData: [
          { date: '18 Jul', fullDate: '2026-07-18', total: 10, livres: 8, retours: 1 },
          { date: '20 Jul', fullDate: '2026-07-20', total: 15, livres: 12, retours: 2 },
          { date: '22 Jul', fullDate: '2026-07-22', total: 18, livres: 15, retours: 1 },
          { date: '24 Jul', fullDate: '2026-07-24', total: 22, livres: 18, retours: 2 },
          { date: '26 Jul', fullDate: '2026-07-26', total: 19, livres: 16, retours: 1 },
          { date: '28 Jul', fullDate: '2026-07-28', total: 25, livres: 20, retours: 3 },
          { date: '30 Jul', fullDate: '2026-07-30', total: 33, livres: 26, retours: 4 },
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

  const handleExportCSV = () => {
    window.location.href = '/api/analytics/export';
  };

  const handlePrintPDF = () => {
    window.print();
  };

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

        {/* Page Header & Actions */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Tableau de Bord Analytics</h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Statistiques globales, performances logistiques et suivi du chiffre d'affaires
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

              {/* Export Buttons */}
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

            {/* KPI Alert Banner if Return Rate > 10% */}
            {global.alertReturnRate && (
              <div className="flex gap-3 border rounded-xl p-4 bg-destructive/10 border-destructive/30 text-destructive items-start">
                <i className="ki-filled ki-information-2 text-xl shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Alerte KPI — Taux de retour critique ({global.tauxRetourGlobal}%)</strong>
                  Le taux de retour global dépasse le seuil autorisé de 10%. Veuillez vérifier les colis en retour et optimiser les affectations de livraison par zone.
                </div>
              </div>
            )}

            {/* Top KPI Cards (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Card 1: Colis du jour */}
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

              {/* Card 2: Taux de livraison global */}
              <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-stats-gradient">
                <div className="mt-4 ms-5 text-success flex items-center justify-between pe-5">
                  <i className="ki-filled ki-verify text-3xl" />
                  <span className="kt-badge kt-badge-success kt-badge-outline rounded-full text-xs">
                    Global
                  </span>
                </div>
                <div className="flex flex-col gap-1 pb-4 px-5">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-semibold text-mono text-success">{global.tauxLivraisonGlobal ?? 0}%</span>
                  </div>
                  <span className="text-sm font-normal text-secondary-foreground">Taux de livraison global</span>
                  <span className="text-xs text-muted-foreground">{global.colisLivres ?? 0} livrés sur {global.totalColis ?? 0} colis</span>
                </div>
              </div>

              {/* Card 3: Chiffre d'Affaires du mois */}
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

              {/* Card 4: Comparaison Mensuelle */}
              <div className="kt-card flex-col justify-between gap-6 h-full bg-cover bg-no-repeat bg-stats-gradient">
                <div className="mt-4 ms-5 text-info flex items-center justify-between pe-5">
                  <i className="ki-filled ki-chart-line-star text-3xl" />
                  <span className="kt-badge kt-badge-info kt-badge-outline rounded-full text-xs">
                    Comparatif
                  </span>
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

              {/* Chart 1: Evolution temporelle (Area Chart 2 cols) */}
              <div className="xl:col-span-2 kt-card">
                <div className="kt-card-header">
                  <div>
                    <h3 className="kt-card-title">Évolution des Livraisons</h3>
                    <p className="text-xs text-secondary-foreground mt-0.5">Volume quotidien des colis créés et livrés</p>
                  </div>
                  <span className="kt-badge kt-badge-outline rounded-full text-xs font-medium">
                    {period === 'today' ? "Aujourd'hui" : period === 'week' ? '7 derniers jours' : period === 'year' ? 'Cette année' : '30 derniers jours'}
                  </span>
                </div>
                <div className="kt-card-content p-5 lg:p-7.5 pt-2">
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1b84ff" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#1b84ff" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLivres" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#27d37f" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#27d37f" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
                        />
                        <Legend verticalAlign="top" height={36} align="right" />
                        <Area type="monotone" dataKey="total" name="Total Colis" stroke="#1b84ff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
                        <Area type="monotone" dataKey="livres" name="Livrés" stroke="#27d37f" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLivres)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Chart 2: Répartition par Statut (Pie Chart 1 col) */}
              <div className="xl:col-span-1 kt-card">
                <div className="kt-card-header">
                  <h3 className="kt-card-title">Répartition par Statut</h3>
                </div>
                <div className="kt-card-content p-5 lg:p-7.5 pt-0 flex flex-col items-center justify-center">
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || defaultStatusColors[entry.name] || '#3f4254'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Status Legend List */}
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
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

            {/* Row 3: Carte thermique / Breakdown par Ville */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">

              {/* City Performance Chart (BarChart 2 cols) */}
              <div className="lg:col-span-2 kt-card">
                <div className="kt-card-header">
                  <div>
                    <h3 className="kt-card-title">Volume et Performance par Ville</h3>
                    <p className="text-xs text-secondary-foreground mt-0.5">Zones géographiques à fort trafic</p>
                  </div>
                </div>
                <div className="kt-card-content p-5 lg:p-7.5 pt-2">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="city" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '10px' }} />
                        <Legend verticalAlign="top" height={36} align="right" />
                        <Bar dataKey="total" name="Total Colis" fill="#1b84ff" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="livres" name="Colis Livrés" fill="#27d37f" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top Villes Summary Table (1 col) */}
              <div className="lg:col-span-1 kt-card">
                <div className="kt-card-header">
                  <h3 className="kt-card-title">Top Villes</h3>
                  <span className="text-xs text-secondary-foreground">Taux de succès</span>
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
