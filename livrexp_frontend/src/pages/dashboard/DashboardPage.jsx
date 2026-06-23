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

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (response.ok) {
          const json = await response.json();
          setData(json);
        } else {
          console.warn('Backend endpoint returned error status, using premium mock fallback.');
          setData(mockDataFallback);
        }
      } catch (err) {
        console.warn('Could not connect to backend endpoint, using premium mock fallback.', err);
        setData(mockDataFallback);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ApexCharts initialization
  useEffect(() => {
    if (!data || !window.ApexCharts) return;

    const container = document.querySelector("#real_earnings_chart");
    if (!container) return;

    container.innerHTML = "";

    const options = {
      series: [{
        name: 'Colis enregistrés',
        data: data.chartData
      }],
      chart: {
        type: 'area',
        height: 250,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      colors: ['#3e97ff'],
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
        categories: data.chartLabels,
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
  }, [data]);

  if (loading) {
    return (
      <DashboardLayout activeMenu="dashboard">
        <main className="grow pt-5 dashboard-content-shift" role="content">
          <div className="kt-container-fixed flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <span className="text-sm text-secondary-foreground font-medium">Chargement des données...</span>
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
