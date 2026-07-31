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

export default function DashboardPage({ dashboardData = null, loading = false, refetchData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('7');
  const [fetchedData, setFetchedData] = useState(null);

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
                    <a className="kt-link kt-link-underlined kt-link-dashed" href="/colis/">
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
                      <select 
                        className="kt-select w-36" 
                        value={period} 
                        onChange={(e) => {
                          setPeriod(e.target.value);
                          if (refetchData) refetchData(e.target.value);
                        }}
                      >
                        <option value="today">Aujourd'hui</option>
                        <option value="7">7 jours</option>
                        <option value="month">Ce mois</option>
                        <option value="year">Cette année</option>
                      </select>
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
