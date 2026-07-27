import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function RamassagePlanningPage({ navigate, showNotification }) {
  const [events, setEvents]   = useState([]);
  const [stats, setStats]     = useState({ total: 0, pending: 0, confirmed: 0, picked_up: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'list'
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

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

  // Date navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const prevPeriod = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextPeriod = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayPeriod = () => setCurrentDate(new Date());

  // Build calendar grid matrix
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const calendarDays = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  // Previous month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false
    });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      date: new Date(year, month, d),
      isCurrentMonth: true
    });
  }
  // Next month padding
  const totalCells = calendarDays.length <= 35 ? 35 : 42;
  const remaining = totalCells - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  // Filter events
  const filteredEvents = events.filter(evt => {
    if (statusFilter === 'all') return true;
    return evt.extendedProps?.status === statusFilter;
  });

  const getEventsForDate = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    return filteredEvents.filter(evt => evt.start && evt.start.substring(0, 10) === dateStr);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return { 
          label: 'Confirmé', 
          style: { backgroundColor: '#1b84ff', color: '#ffffff', borderColor: '#1b84ff' }
        };
      case 'picked_up':
        return { 
          label: 'Ramassé', 
          style: { backgroundColor: '#17c653', color: '#ffffff', borderColor: '#17c653' }
        };
      case 'cancelled':
        return { 
          label: 'Annulé', 
          style: { backgroundColor: '#f8285a', color: '#ffffff', borderColor: '#f8285a' }
        };
      default:
        return { 
          label: 'En attente', 
          style: { backgroundColor: '#f6c000', color: '#181c32', borderColor: '#f6c000' }
        };
    }
  };

  return (
    <DashboardLayout activeMenu="ramassage_planning">
      <main className="grow pt-5 profile-content-shift" id="content" role="content">
        
        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                <i className="ki-filled ki-calendar text-2xl text-primary"></i>
                Planification des ramassages
              </h1>
              <p className="text-sm text-secondary-foreground">
                Consultez et organisez vos demandes de ramassage interactives
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                type="button"
                className="kt-btn kt-btn-outline" 
                onClick={() => navigate('/ramassage')}
              >
                <i className="ki-filled ki-menu text-sm"></i>
                Voir la liste
              </button>
              <button 
                type="button"
                className="kt-btn kt-btn-primary" 
                onClick={() => navigate('/ramassage/new')}
              >
                <i className="ki-filled ki-plus text-sm"></i>
                Nouvelle demande
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards (Interactive Filters) */}
        <div className="kt-container-fixed">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-7.5">
            
            <div 
              onClick={() => setStatusFilter('all')}
              className={`kt-card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${statusFilter === 'all' ? 'ring-2 ring-primary border-primary' : ''}`}
            >
              <div className="kt-card-content flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <i className="ki-filled ki-parcel text-2xl"></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats.total || 0}</div>
                    <div className="text-xs text-secondary-foreground font-medium">Total demandes</div>
                  </div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setStatusFilter('pending')}
              className={`kt-card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${statusFilter === 'pending' ? 'ring-2 ring-amber-500 border-amber-500' : ''}`}
            >
              <div className="kt-card-content flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <i className="ki-filled ki-time text-2xl"></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats.pending || 0}</div>
                    <div className="text-xs text-secondary-foreground font-medium">En attente</div>
                  </div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setStatusFilter('confirmed')}
              className={`kt-card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${statusFilter === 'confirmed' ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
            >
              <div className="kt-card-content flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <i className="ki-filled ki-check-circle text-2xl"></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats.confirmed || 0}</div>
                    <div className="text-xs text-secondary-foreground font-medium">Confirmés</div>
                  </div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setStatusFilter('picked_up')}
              className={`kt-card cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${statusFilter === 'picked_up' ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}`}
            >
              <div className="kt-card-content flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <i className="ki-filled ki-car text-2xl"></i>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats.picked_up || 0}</div>
                    <div className="text-xs text-secondary-foreground font-medium">Ramassés</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Main Calendar Card */}
        <div className="kt-container-fixed">
          <div className="kt-card shadow-xs">
            
            {/* Calendar Toolbar Header */}
            <div className="kt-card-header flex flex-wrap items-center justify-between gap-4 py-4 px-6 border-b border-border">
              
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
                  <button 
                    type="button" 
                    className="p-1.5 rounded-md text-secondary-foreground hover:text-foreground hover:bg-card transition-colors"
                    onClick={prevPeriod}
                  >
                    <i className="ki-filled ki-left text-sm"></i>
                  </button>
                  <button 
                    type="button" 
                    className="px-3 py-1 text-xs font-semibold text-foreground hover:bg-card rounded-md transition-colors"
                    onClick={todayPeriod}
                  >
                    Aujourd'hui
                  </button>
                  <button 
                    type="button" 
                    className="p-1.5 rounded-md text-secondary-foreground hover:text-foreground hover:bg-card transition-colors"
                    onClick={nextPeriod}
                  >
                    <i className="ki-filled ki-right text-sm"></i>
                  </button>
                </div>

                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {monthNames[month]} <span className="text-muted-foreground font-normal">{year}</span>
                </h2>
              </div>

              {/* View Switchers */}
              <div className="flex items-center gap-2">
                {statusFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="text-xs text-primary hover:underline mr-2"
                  >
                    Effacer le filtre
                  </button>
                )}
                <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
                  <button 
                    type="button"
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'month' ? 'bg-card text-foreground shadow-xs' : 'text-secondary-foreground'}`}
                    onClick={() => setViewMode('month')}
                  >
                    Grille Mois
                  </button>
                  <button 
                    type="button"
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'list' ? 'bg-card text-foreground shadow-xs' : 'text-secondary-foreground'}`}
                    onClick={() => setViewMode('list')}
                  >
                    Liste ({filteredEvents.length})
                  </button>
                </div>
              </div>

            </div>

            {/* Calendar Body */}
            <div className="kt-card-content p-5">
              {loading ? (
                <div className="py-16 text-center text-secondary-foreground">
                  <i className="ki-filled ki-loading text-3xl animate-spin text-primary mb-3 block"></i>
                  <span>Chargement du planning...</span>
                </div>
              ) : viewMode === 'list' ? (
                /* List View Cards */
                filteredEvents.length === 0 ? (
                  <div className="py-16 text-center text-secondary-foreground">
                    <i className="ki-filled ki-calendar-remove text-4xl mb-3 text-muted-foreground/50 block"></i>
                    <p className="text-sm font-medium">Aucun événement ne correspond à vos critères.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((evt) => {
                      const badge = getStatusBadge(evt.extendedProps?.status);
                      return (
                        <div 
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between gap-3"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {evt.start ? new Date(evt.start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                              </span>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-foreground">{evt.title}</h4>
                            <p className="text-xs text-secondary-foreground flex items-center gap-1.5">
                              <i className="ki-filled ki-geolocation text-xs text-muted-foreground"></i>
                              {evt.extendedProps?.address || 'Adresse non spécifiée'}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border/60 text-muted-foreground">
                            <span>Tél: {evt.extendedProps?.phone || '-'}</span>
                            <span>Chauffeur: {evt.extendedProps?.assignedDriver || 'Non assigné'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Month Grid */
                <div>
                  {/* Header Days */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground uppercase py-2 border-b border-border mb-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                    <div>Lun</div>
                    <div>Mar</div>
                    <div>Mer</div>
                    <div>Jeu</div>
                    <div>Ven</div>
                    <div>Sam</div>
                    <div>Dim</div>
                  </div>

                  {/* Day Grid Cells */}
                  <div className="grid grid-cols-7 gap-1.5" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                    {calendarDays.map((cell, idx) => {
                      const dayEvents = getEventsForDate(cell.date);
                      const isToday = cell.date.toDateString() === new Date().toDateString();

                      const yyyy = cell.date.getFullYear();
                      const mm = String(cell.date.getMonth() + 1).padStart(2, '0');
                      const dd = String(cell.date.getDate()).padStart(2, '0');
                      const cellDateStr = `${yyyy}-${mm}-${dd}`;

                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      const cellDate = new Date(cell.date);
                      cellDate.setHours(0, 0, 0, 0);
                      const isPast = cellDate < today;

                      const handleDragOver = (e) => {
                        e.preventDefault();
                        if (isPast) {
                          e.dataTransfer.dropEffect = 'none';
                        } else {
                          e.dataTransfer.dropEffect = 'move';
                        }
                      };

                      const handleDrop = async (e) => {
                        e.preventDefault();
                        if (isPast) {
                          if (showNotification) {
                            showNotification('Impossible de replanifier vers une date passée', 'warning');
                          }
                          return;
                        }

                        const eventId = e.dataTransfer.getData('text/plain');
                        if (!eventId) return;

                        // Optimistic UI update
                        setEvents(prev => prev.map(evt => {
                          if (String(evt.id) === String(eventId)) {
                            return { ...evt, start: `${cellDateStr}T09:00:00` };
                          }
                          return evt;
                        }));

                        try {
                          const res = await fetch(`/api/ramassage/${eventId}/calendar-move`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Accept': 'application/json',
                              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify({ newDate: cellDateStr })
                          });

                          if (res.ok) {
                            if (showNotification) showNotification('Ramassage replanifié avec succès', 'success');
                          } else {
                            fetchPlanningData();
                            if (showNotification) showNotification('Erreur lors de la replanification', 'error');
                          }
                        } catch (err) {
                          console.error(err);
                          fetchPlanningData();
                        }
                      };

                      return (
                        <div 
                          key={idx}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => {
                            if (dayEvents.length > 0) {
                              setSelectedEvent(dayEvents[0]);
                            } else {
                              navigate('/ramassage/new');
                            }
                          }}
                          className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                            cell.isCurrentMonth 
                              ? 'bg-card border-border hover:border-primary/50 hover:bg-accent/30' 
                              : 'bg-muted/20 border-transparent opacity-40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`size-6 text-xs font-bold flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                              {cell.date.getDate()}
                            </span>
                            {dayEvents.length > 0 && (
                              <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full">
                                {dayEvents.length}
                              </span>
                            )}
                          </div>

                          {/* Event Indicators */}
                          <div className="flex flex-col gap-1 overflow-y-auto max-h-[72px]">
                            {dayEvents.slice(0, 2).map((evt) => {
                              const badge = getStatusBadge(evt.extendedProps?.status);
                              const phone = evt.extendedProps?.phone;

                              return (
                                <div 
                                  key={evt.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    e.dataTransfer.setData('text/plain', String(evt.id));
                                    e.dataTransfer.effectAllowed = 'move';
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(evt);
                                  }}
                                  style={badge.style}
                                  className="fc-daygrid-event text-[11px] leading-tight p-1.5 rounded border cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity"
                                  title={`Glisser-déposer pour replanifier: ${evt.title}`}
                                >
                                  <strong className="block truncate font-bold text-[11px] leading-tight">{evt.title}</strong>
                                  {phone && (
                                    <span className="block text-[10px] font-medium opacity-90 truncate leading-tight mt-0.5">
                                      {phone}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <span className="text-[10px] text-muted-foreground font-semibold px-1">
                                +{dayEvents.length - 2} de plus
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal Event Detail */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <i className="ki-filled ki-information text-primary text-xl"></i>
                  Détails de la demande
                </h3>
                <button 
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <i className="ki-filled ki-cross text-lg"></i>
                </button>
              </div>

              <div className="py-4 flex flex-col gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Titre / Client</label>
                  <p className="text-base font-semibold text-foreground">{selectedEvent.title}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Adresse</label>
                  <p className="text-sm text-foreground">{selectedEvent.extendedProps?.address || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Téléphone</label>
                    <p className="text-sm font-medium text-foreground">{selectedEvent.extendedProps?.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Statut</label>
                    <p className="text-sm font-medium text-primary">
                      {selectedEvent.extendedProps?.statusLabel || selectedEvent.extendedProps?.status || 'En attente'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button 
                  type="button"
                  className="kt-btn kt-btn-outline text-sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  Fermer
                </button>
                <button 
                  type="button"
                  className="kt-btn kt-btn-primary text-sm"
                  onClick={() => {
                    setSelectedEvent(null);
                    navigate('/ramassage');
                  }}
                >
                  Voir dans la liste
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </DashboardLayout>
  );
}
