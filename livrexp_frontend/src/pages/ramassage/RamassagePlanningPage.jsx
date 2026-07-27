import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function RamassagePlanningPage({ navigate, showNotification }) {
  const [events, setEvents]   = useState([]);
  const [stats, setStats]     = useState({ total: 0, pending: 0, confirmed: 0, picked_up: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  const headers = { 'Accept': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fetchPlanningData = async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/ramassage/calendar/events', { headers }),
        fetch('/api/ramassage/stats', { headers })
      ]);

      if (eventsRes.ok) {
        const jEvents = await eventsRes.json();
        setEvents(Array.isArray(jEvents) ? jEvents : []);
      }

      if (statsRes.ok) {
        const jStats = await statsRes.json();
        if (jStats.stats) setStats(jStats.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanningData();
  }, []);

  return (
    <DashboardLayout activeMenu="ramassage_planning">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                Planification des ramassages
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Vue d'ensemble de vos demandes de ramassage
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                className="kt-btn kt-btn-outline" 
                onClick={() => navigate('/ramassage')}
              >
                Voir la liste
              </button>
              <button 
                className="kt-btn kt-btn-primary" 
                onClick={() => navigate('/ramassage/new')}
              >
                Nouvelle demande
              </button>
            </div>
          </div>
        </div>

        {/* KPI Stats Cards */}
        <div className="kt-container-fixed">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7.5 pb-7.5">
            
            {/* Total */}
            <div className="kt-card">
              <div className="kt-card-content flex items-center gap-4 p-5">
                <div className="size-[50px] shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <i className="ki-filled ki-parcel text-xl text-primary"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold text-mono">{stats.total || 0}</span>
                  <span className="text-xs text-secondary-foreground font-medium">Total demandes</span>
                </div>
              </div>
            </div>

            {/* En attente */}
            <div className="kt-card">
              <div className="kt-card-content flex items-center gap-4 p-5">
                <div className="size-[50px] shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <i className="ki-filled ki-time text-xl text-primary"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold text-mono">{stats.pending || 0}</span>
                  <span className="text-xs text-secondary-foreground font-medium">En attente</span>
                </div>
              </div>
            </div>

            {/* Confirmés */}
            <div className="kt-card">
              <div className="kt-card-content flex items-center gap-4 p-5">
                <div className="size-[50px] shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <i className="ki-filled ki-check-circle text-xl text-primary"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold text-mono">{stats.confirmed || 0}</span>
                  <span className="text-xs text-secondary-foreground font-medium">Confirmés</span>
                </div>
              </div>
            </div>

            {/* Ramassés */}
            <div className="kt-card">
              <div className="kt-card-content flex items-center gap-4 p-5">
                <div className="size-[50px] shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <i className="ki-filled ki-car text-xl text-primary"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold text-mono">{stats.picked_up || 0}</span>
                  <span className="text-xs text-secondary-foreground font-medium">Ramassés</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Schedule List / Calendar */}
        <div className="kt-container-fixed">
          <div className="kt-card">
            <div className="kt-card-header">
              <h3 className="kt-card-title text-mono">Planification & Événements</h3>
            </div>
            <div className="kt-card-content p-5">
              {loading ? (
                <div className="py-8 text-center text-secondary-foreground animate-pulse">Chargement de la planification...</div>
              ) : events.length === 0 ? (
                <div className="py-12 text-center text-secondary-foreground">
                  <i className="ki-filled ki-calendar text-4xl mb-3 text-muted-foreground block"></i>
                  Aucune demande de ramassage planifiée pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((evt) => {
                    const statusClassMap = {
                      pending: 'border-l-warning bg-warning/5',
                      confirmed: 'border-l-primary bg-primary/5',
                      picked_up: 'border-l-success bg-success/5',
                      cancelled: 'border-l-destructive bg-destructive/5'
                    };
                    const props = evt.extendedProps || {};
                    return (
                      <div 
                        key={evt.id} 
                        className={`p-4 rounded-xl border border-border border-l-4 shadow-xs flex flex-col justify-between gap-3 ${statusClassMap[props.status] || 'border-l-primary bg-card'}`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase text-secondary-foreground">
                              {evt.start ? new Date(evt.start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                            </span>
                            <span className="kt-badge kt-badge-outline text-xs px-2 py-0.5 rounded-full">
                              {props.statusLabel || props.status}
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-foreground mt-1">{evt.title}</h4>
                          <p className="text-xs text-secondary-foreground">{props.address || '-'}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50 text-muted-foreground">
                          <span>Tél: {props.phone || '-'}</span>
                          <span>Chauffeur: {props.assignedDriver || '-'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
