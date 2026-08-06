import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';

export default function RamassagePlanningPage({ navigate, showNotification }) {
  const { t } = useLanguage();
  const [events, setEvents]   = useState([]);
  const [stats, setStats]     = useState({ total: 0, pending: 0, confirmed: 0, picked_up: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'list'
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const getAuthToken = () => localStorage.getItem('auth_token');

  const fetchPlanningData = useCallback(async () => {
    const headers = { 'Accept': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchPlanningData();
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchPlanningData]);

  // Date navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    t('colisPage.months.january', 'Janvier'),
    t('colisPage.months.february', 'Février'),
    t('colisPage.months.march', 'Mars'),
    t('colisPage.months.april', 'Avril'),
    t('colisPage.months.may', 'Mai'),
    t('colisPage.months.june', 'Juin'),
    t('colisPage.months.july', 'Juillet'),
    t('colisPage.months.august', 'Août'),
    t('colisPage.months.september', 'Septembre'),
    t('colisPage.months.october', 'Octobre'),
    t('colisPage.months.november', 'Novembre'),
    t('colisPage.months.december', 'Décembre')
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
          label: t('status.confirmed', 'Confirmé'), 
          style: { backgroundColor: '#1b84ff', color: '#ffffff', borderColor: '#1b84ff' },
          bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
        };
      case 'picked_up':
        return { 
          label: t('status.pickedUp', 'Ramassé'), 
          style: { backgroundColor: '#17c653', color: '#ffffff', borderColor: '#17c653' },
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        };
      case 'cancelled':
        return { 
          label: t('status.cancelled', 'Annulé'), 
          style: { backgroundColor: '#f8285a', color: '#ffffff', borderColor: '#f8285a' },
          bg: 'bg-red-500/10 text-red-600 border-red-500/20'
        };
      default:
        return { 
          label: t('status.pending', 'En attente'), 
          style: { backgroundColor: '#f6c000', color: '#181c32', borderColor: '#f6c000' },
          bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
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
              <h1 className="text-xl font-medium leading-none text-mono">
                {t('colisPage.planningTitle', 'Planification des ramassages')}
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium">
                <span className="text-base text-secondary-foreground">
                  {t('colisPage.totalEvents', 'Total événements')}:
                </span>
                <span className="text-base text-foreground font-medium">{events.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                type="button"
                className="kt-btn kt-btn-outline" 
                onClick={() => navigate('/ramassage')}
              >
                <i className="ki-filled ki-menu text-sm"></i>
                {t('colisPage.viewList', 'Voir la liste')}
              </button>
              <button 
                type="button"
                className="kt-btn kt-btn-primary" 
                onClick={() => navigate('/ramassage/new')}
              >
                <i className="ki-filled ki-plus text-sm"></i>
                {t('colisPage.newRequest', 'Nouvelle demande')}
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards (Creative Vibrant Design) */}
        <div className="kt-container-fixed">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7.5 pb-7.5">
            
            {/* Card 1: Total */}
            <div 
              onClick={() => setStatusFilter('all')}
              className="kt-card cursor-pointer transition-all duration-300 relative overflow-hidden group hover:shadow-lg hover:-translate-y-1"
              style={{
                border: statusFilter === 'all' ? '2px solid #6366f1' : '1px solid var(--tw-border-opacity, rgba(229, 231, 235, 0.5))',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="kt-card-content p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold tracking-wider text-secondary-foreground uppercase">
                      {t('colisPage.totalRequests', 'Total demandes')}
                    </span>
                    <span className="text-3xl font-extrabold text-mono text-foreground tracking-tight">{stats.total || 0}</span>
                  </div>
                  <div 
                    className="size-12 shrink-0 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: '#6366f1', color: '#ffffff' }}
                  >
                    <i className="ki-filled ki-parcel text-2xl text-white"></i>
                  </div>
                </div>
                <div className="mt-4 w-full bg-indigo-500/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            {/* Card 2: En attente */}
            <div 
              onClick={() => setStatusFilter('pending')}
              className="kt-card cursor-pointer transition-all duration-300 relative overflow-hidden group hover:shadow-lg hover:-translate-y-1"
              style={{
                border: statusFilter === 'pending' ? '2px solid #f59e0b' : '1px solid var(--tw-border-opacity, rgba(229, 231, 235, 0.5))',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="kt-card-content p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold tracking-wider text-secondary-foreground uppercase">
                      {t('status.pending', 'En attente')}
                    </span>
                    <span className="text-3xl font-extrabold text-mono text-foreground tracking-tight">{stats.pending || 0}</span>
                  </div>
                  <div 
                    className="size-12 shrink-0 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: '#f59e0b', color: '#ffffff' }}
                  >
                    <i className="ki-filled ki-time text-2xl text-white"></i>
                  </div>
                </div>
                <div className="mt-4 w-full bg-amber-500/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.total ? Math.round(((stats.pending || 0) / stats.total) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Card 3: Confirmés */}
            <div 
              onClick={() => setStatusFilter('confirmed')}
              className="kt-card cursor-pointer transition-all duration-300 relative overflow-hidden group hover:shadow-lg hover:-translate-y-1"
              style={{
                border: statusFilter === 'confirmed' ? '2px solid #3b82f6' : '1px solid var(--tw-border-opacity, rgba(229, 231, 235, 0.5))',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="kt-card-content p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold tracking-wider text-secondary-foreground uppercase">
                      {t('status.confirmed', 'Confirmés')}
                    </span>
                    <span className="text-3xl font-extrabold text-mono text-foreground tracking-tight">{stats.confirmed || 0}</span>
                  </div>
                  <div 
                    className="size-12 shrink-0 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                  >
                    <i className="ki-filled ki-check-circle text-2xl text-white"></i>
                  </div>
                </div>
                <div className="mt-4 w-full bg-blue-500/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.total ? Math.round(((stats.confirmed || 0) / stats.total) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Card 4: Ramassés */}
            <div 
              onClick={() => setStatusFilter('picked_up')}
              className="kt-card cursor-pointer transition-all duration-300 relative overflow-hidden group hover:shadow-lg hover:-translate-y-1"
              style={{
                border: statusFilter === 'picked_up' ? '2px solid #10b981' : '1px solid var(--tw-border-opacity, rgba(229, 231, 235, 0.5))',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="kt-card-content p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold tracking-wider text-secondary-foreground uppercase">
                      {t('status.pickedUp', 'Ramassés')}
                    </span>
                    <span className="text-3xl font-extrabold text-mono text-foreground tracking-tight">{stats.picked_up || 0}</span>
                  </div>
                  <div 
                    className="size-12 shrink-0 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                  >
                    <i className="ki-filled ki-car text-2xl text-white"></i>
                  </div>
                </div>
                <div className="mt-4 w-full bg-emerald-500/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.total ? Math.round(((stats.picked_up || 0) / stats.total) * 100) : 0}%` }}
                  ></div>
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
                    {t('colisPage.today', 'Aujourd\'hui')}
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
                    {t('colisPage.clearFilter', 'Effacer le filtre')}
                  </button>
                )}
                <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
                  <button 
                    type="button"
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      viewMode === 'month' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-secondary-foreground hover:text-foreground'
                    }`}
                    onClick={() => setViewMode('month')}
                  >
                    {t('colisPage.gridMonth', 'Grille Mois')}
                  </button>
                  <button 
                    type="button"
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-secondary-foreground hover:text-foreground'
                    }`}
                    onClick={() => setViewMode('list')}
                  >
                    {t('colisPage.listMode', 'Liste')} ({filteredEvents.length})
                  </button>
                </div>
              </div>

            </div>

            {/* Calendar Body */}
            <div className="kt-card-content p-5">
              {loading ? (
                <div className="py-16 text-center text-secondary-foreground">
                  <i className="ki-filled ki-loading text-3xl animate-spin text-primary mb-3 block"></i>
                  <span>{t('colisPage.loadingPlanning', 'Chargement du planning...')}</span>
                </div>
              ) : viewMode === 'list' ? (
                /* List View Cards */
                filteredEvents.length === 0 ? (
                  <div className="py-16 text-center text-secondary-foreground">
                    <i className="ki-filled ki-calendar-remove text-4xl mb-3 text-muted-foreground/50 block"></i>
                    <p className="text-sm font-medium">{t('colisPage.noEventFound', 'Aucun événement ne correspond à vos critères.')}</p>
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
                              {evt.extendedProps?.address || t('colisPage.noAddressSpecified', 'Adresse non spécifiée')}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border/60 text-muted-foreground">
                            <span>{t('colisPage.phone', 'Tél')}: {evt.extendedProps?.phone || '-'}</span>
                            <span>{t('colisPage.driver', 'Chauffeur')}: {evt.extendedProps?.assignedDriver || t('colisPage.unassigned', 'Non assigné')}</span>
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
                    <div>{t('colisPage.days.mon', 'Lun')}</div>
                    <div>{t('colisPage.days.tue', 'Mar')}</div>
                    <div>{t('colisPage.days.wed', 'Mer')}</div>
                    <div>{t('colisPage.days.thu', 'Jeu')}</div>
                    <div>{t('colisPage.days.fri', 'Ven')}</div>
                    <div>{t('colisPage.days.sat', 'Sam')}</div>
                    <div>{t('colisPage.days.sun', 'Dim')}</div>
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
                            showNotification('warning', t('colisPage.cannotReschedulePast', 'Impossible de replanifier vers une date passée'));
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
                          const token = localStorage.getItem('auth_token');
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
                            if (showNotification) showNotification('success', t('colisPage.rescheduledSuccess', 'Ramassage replanifié avec succès'));
                          } else {
                            fetchPlanningData();
                            if (showNotification) showNotification('error', t('colisPage.rescheduleError', 'Erreur lors de la replanification'));
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
                                  title={`${t('colisPage.dragToReschedule', 'Glisser-déposer pour replanifier')}: ${evt.title}`}
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
                                +{dayEvents.length - 2} {t('colisPage.more', 'de plus')}
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
                  {t('colisPage.requestDetailsTitle', 'Détails de la demande')}
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
                  <label className="text-xs text-muted-foreground font-medium">
                    {t('colisPage.titleClientLabel', 'Titre / Client')}
                  </label>
                  <p className="text-base font-semibold text-foreground">{selectedEvent.title}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    {t('colisPage.address', 'Adresse')}
                  </label>
                  <p className="text-sm text-foreground">{selectedEvent.extendedProps?.address || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">
                      {t('colisPage.phone', 'Téléphone')}
                    </label>
                    <p className="text-sm font-medium text-foreground">{selectedEvent.extendedProps?.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">
                      {t('colisPage.statut', 'Statut')}
                    </label>
                    <p className="text-sm font-medium text-primary">
                      {getStatusBadge(selectedEvent.extendedProps?.status).label}
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
                  {t('common.close', 'Fermer')}
                </button>
                <button 
                  type="button"
                  className="kt-btn kt-btn-primary text-sm"
                  onClick={() => {
                    setSelectedEvent(null);
                    navigate('/ramassage');
                  }}
                >
                  {t('colisPage.viewInList', 'Voir dans la liste')}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </DashboardLayout>
  );
}
