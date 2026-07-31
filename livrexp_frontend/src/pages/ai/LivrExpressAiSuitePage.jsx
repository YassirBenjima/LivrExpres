import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function LivrExpressAiSuitePage({ navigate, showNotification, defaultTab = 'predictions', activeMenu = 'ai_predictions' }) {
  const getInitialTab = () => {
    const path = window.location.pathname;
    if (path.includes('anomalies')) return 'anomalies';
    if (path.includes('tournees') || path.includes('itineraire')) return 'route';
    if (path.includes('chatbot')) return 'chatbot';
    if (path.includes('prediction')) return 'predictions';
    return defaultTab;
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loading, setLoading] = useState(true);

  // Sync tab with URL on navigation / click
  useEffect(() => {
    const syncTab = () => {
      const path = window.location.pathname;
      if (path.includes('anomalies')) setActiveTab('anomalies');
      else if (path.includes('tournees') || path.includes('itineraire')) setActiveTab('route');
      else if (path.includes('chatbot')) setActiveTab('chatbot');
      else if (path.includes('prediction')) setActiveTab('predictions');
      else setActiveTab(defaultTab);
    };

    syncTab();
    window.addEventListener('popstate', syncTab);
    return () => window.removeEventListener('popstate', syncTab);
  }, [defaultTab, activeMenu]);

  // Search & Filter state for predictions table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Search & Filter state for anomalies table
  const [anomalySearchQuery, setAnomalySearchQuery] = useState('');
  const [selectedAnomalyType, setSelectedAnomalyType] = useState('');
  const [anomalyPage, setAnomalyPage] = useState(1);
  const [anomalyPerPage] = useState(10);

  // AI Predictions State
  const [predictions, setPredictions] = useState([]);
  
  // AI Anomalies State
  const [anomalies, setAnomalies] = useState([]);

  // AI Route State
  const [routeStops, setRouteStops] = useState([]);
  const [routeMetrics, setRouteMetrics] = useState({
    total_stops: 0,
    estimated_distance_km: 0,
    estimated_time_minutes: 0,
    distance_saved_km: 0,
    fuel_saved_percent: 0
  });

  // Livreur Chatbot State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: "Bonjour ! Je suis votre Assistant IA Livreur. Posez-moi une question sur vos commandes réelles ou votre tournée.",
      quick_actions: [
        { label: "📍 Voir ma tournée optimisée", action: "OPEN_ROUTE" },
        { label: "⚠️ Colis à risque de retour", action: "CHECK_RISK" }
      ]
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/ai/predict-return-risk', {
        headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/ai/anomalies', {
        headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data.anomalies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteOptimization = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/ai/route-optimizer', {
        headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setRouteStops(data.stops || []);
        if (data.metrics) setRouteMetrics(data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'predictions') fetchPredictions();
    if (activeTab === 'anomalies') fetchAnomalies();
    if (activeTab === 'route') fetchRouteOptimization();
  }, [activeTab]);

  const handleSendChat = async (msgText = null) => {
    const textToSend = msgText || inputMsg;
    if (!textToSend.trim()) return;

    const userMessage = { sender: 'user', text: textToSend };
    setChatMessages(prev => [...prev, userMessage]);
    setInputMsg('');
    setIsChatSending(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/ai/livreur-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: textToSend })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply,
            quick_actions: data.quick_actions || []
          }
        ]);
      }
    } catch (e) {
      setChatMessages(prev => [
        ...prev,
        { sender: 'bot', text: "Erreur de connexion avec l'IA." }
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Predictions Filtered & Paginated
  const filteredPredictions = predictions.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (p.tracking_code && p.tracking_code.toLowerCase().includes(q)) ||
      (p.destinataire && p.destinataire.toLowerCase().includes(q)) ||
      (p.ville && p.ville.toLowerCase().includes(q));

    const matchesRisk = !selectedRisk || (p.prediction && p.prediction.risk_level === selectedRisk);
    return matchesSearch && matchesRisk;
  });

  const totalPages = Math.ceil(filteredPredictions.length / perPage) || 1;
  const paginatedPredictions = filteredPredictions.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Anomalies Filtered & Paginated
  const filteredAnomalies = anomalies.filter(an => {
    const q = anomalySearchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (an.tracking_code && an.tracking_code.toLowerCase().includes(q)) ||
      (an.destinataire && an.destinataire.toLowerCase().includes(q)) ||
      (an.ville && an.ville.toLowerCase().includes(q));

    const matchesType = !selectedAnomalyType || (an.title && an.title.includes(selectedAnomalyType));
    return matchesSearch && matchesType;
  });

  const totalAnomalyPages = Math.ceil(filteredAnomalies.length / anomalyPerPage) || 1;
  const paginatedAnomalies = filteredAnomalies.slice((anomalyPage - 1) * anomalyPerPage, anomalyPage * anomalyPerPage);

  return (
    <DashboardLayout activeMenu={activeMenu}>
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono flex items-center gap-2">
                <i className="ki-filled ki-technology-4 text-primary text-2xl" />
                LivrExpress PRO - Suite Logistique
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium text-sm text-secondary-foreground">
                Analyse en temps réel de vos commandes réelles enregistrées
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={fetchPredictions}
                className="kt-btn kt-btn-outline"
              >
                <i className="ki-filled ki-arrows-loop text-sm me-1" />
                Recalculer IA
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: PREDICTION DES RETOURS */}
        {activeTab === 'predictions' && (
          <div className="kt-container-fixed">
            <div className="grid gap-5 lg:gap-7.5">
              <div className="kt-card kt-card-grid min-w-full">
                
                {/* Card Header & Filter Bar */}
                <div className="kt-card-header flex-wrap gap-2">
                  <h3 className="kt-card-title text-sm">
                    Affichage de {filteredPredictions.length} prédictions colis
                  </h3>
                  <div className="flex flex-wrap gap-2 lg:gap-5">
                    <div className="flex">
                      <label className="kt-input">
                        <i className="ki-filled ki-magnifier"></i>
                        <input
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder="Rechercher par code ou client..."
                          type="text"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <KtSelect
                        value={selectedRisk}
                        onChange={(val) => { setSelectedRisk(val); setCurrentPage(1); }}
                        placeholder="Niveau de risque"
                        className="w-40"
                        options={[
                          { value: '', label: 'Tous les risques' },
                          { value: 'Élevé', label: 'Risque Élevé' },
                          { value: 'Moyen', label: 'Risque Moyen' },
                          { value: 'Faible', label: 'Risque Faible' }
                        ]}
                      />
                      <button
                        className="kt-btn kt-btn-outline"
                        onClick={() => { setSearchQuery(''); setSelectedRisk(''); setCurrentPage(1); }}
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Content & Table */}
                <div className="kt-card-content">
                  <div className="grid">
                    <div className="kt-scrollable-x-auto">
                      <table className="kt-table table-auto kt-table-border">
                        <thead>
                          <tr>
                            <th className="min-w-[140px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Code Colis</span>
                              </span>
                            </th>
                            <th className="min-w-[180px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Destinataire & Ville</span>
                              </span>
                            </th>
                            <th className="min-w-[130px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Montant CRBT</span>
                              </span>
                            </th>
                            <th className="min-w-[180px] text-center">
                              <span className="kt-table-col justify-center">
                                <span className="kt-table-col-label">Score de Risque IA</span>
                              </span>
                            </th>
                            <th className="min-w-[240px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Facteurs Détectés</span>
                              </span>
                            </th>
                            <th className="min-w-[220px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Recommandation IA</span>
                              </span>
                            </th>
                            <th className="min-w-[120px] text-right">
                              <span className="kt-table-col justify-end">
                                <span className="kt-table-col-label">Action</span>
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                                  Analyse prédictive des colis en cours...
                                </div>
                              </td>
                            </tr>
                          ) : paginatedPredictions.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                Aucun colis trouvé correspondant à vos critères de recherche.
                              </td>
                            </tr>
                          ) : (
                            paginatedPredictions.map((p) => {
                              const pred = p.prediction || {};
                              return (
                                <tr key={p.colis_id} className="hover:bg-accent/40 transition-colors">
                                  <td className="font-mono text-xs font-semibold text-foreground">
                                    {p.tracking_code}
                                  </td>
                                  <td>
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-foreground text-xs">{p.destinataire}</span>
                                      <span className="text-[11px] text-muted-foreground">{p.ville}</span>
                                    </div>
                                  </td>
                                  <td className="font-semibold text-foreground text-xs">
                                    {p.crbt ? p.crbt.toFixed(2) : '0.00'} DH
                                  </td>
                                  <td className="text-center">
                                    <span className={`kt-badge kt-badge-${pred.badge_color || 'primary'} kt-badge-outline rounded-full text-[11px]`}>
                                      {pred.risk_score}% ({pred.risk_level})
                                    </span>
                                  </td>
                                  <td>
                                    <ul className="list-disc list-inside text-[11px] text-secondary-foreground space-y-0.5">
                                      {(pred.factors || []).map((f, i) => (
                                        <li key={i}>{f}</li>
                                      ))}
                                    </ul>
                                  </td>
                                  <td className="text-xs text-foreground font-medium max-w-xs">
                                    {pred.recommendation}
                                  </td>
                                  <td className="text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (showNotification) showNotification('success', `Appel de pré-livraison lancé pour ${p.destinataire}`);
                                      }}
                                      className="kt-btn kt-btn-xs kt-btn-outline"
                                    >
                                      📞 Confirmer
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Card Footer & Pagination */}
                <div className="kt-card-footer justify-between md:justify-between flex-col md:flex-row gap-5">
                  <div className="flex items-center gap-2 text-sm text-secondary-foreground">
                    Affichage de {filteredPredictions.length > 0 ? (currentPage - 1) * perPage + 1 : 0} à {Math.min(currentPage * perPage, filteredPredictions.length)} sur {filteredPredictions.length} éléments
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="kt-btn kt-btn-sm kt-btn-outline disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <span className="text-xs font-semibold px-2">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="kt-btn kt-btn-sm kt-btn-outline disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETECTION D'ANOMALIES */}
        {activeTab === 'anomalies' && (
          <div className="kt-container-fixed">
            <div className="grid gap-5 lg:gap-7.5">
              <div className="kt-card kt-card-grid min-w-full">
                
                {/* Card Header & Filter Bar */}
                <div className="kt-card-header flex flex-wrap gap-4 justify-between items-center py-4 px-6 border-b border-border">
                  <div className="flex flex-col gap-1">
                    <h3 className="kt-card-title text-base font-bold text-foreground">
                      Détection des anomalies ({filteredAnomalies.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Détection en temps réel des retards de ramassage ou livraisons non clôturées sur vos colis réels
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <i className="ki-filled ki-magnifier text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 text-sm" />
                      <input
                        type="text"
                        className="kt-input ps-9 py-2 text-xs w-64"
                        placeholder="Rechercher code, destinataire, ville..."
                        value={anomalySearchQuery}
                        onChange={(e) => { setAnomalySearchQuery(e.target.value); setAnomalyPage(1); }}
                      />
                    </div>

                    <KtSelect
                      value={selectedAnomalyType}
                      onChange={(val) => { setSelectedAnomalyType(val); setAnomalyPage(1); }}
                      placeholder="Type d'anomalie"
                      className="w-44"
                      options={[
                        { value: '', label: 'Toutes les anomalies' },
                        { value: 'Ramassage', label: 'Retard Ramassage' },
                        { value: 'Inactif', label: 'Inactivité prolongée' },
                        { value: 'Livraison', label: 'Problème Livraison' }
                      ]}
                    />

                    <button
                      className="kt-btn kt-btn-outline text-xs"
                      onClick={() => { setAnomalySearchQuery(''); setSelectedAnomalyType(''); setAnomalyPage(1); }}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>

                {/* Card Content & Table */}
                <div className="kt-card-content">
                  <div className="grid">
                    <div className="kt-scrollable-x-auto">
                      <table className="kt-table table-auto kt-table-border">
                        <thead>
                          <tr>
                            <th className="min-w-[140px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Code Colis</span>
                              </span>
                            </th>
                            <th className="min-w-[180px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Destinataire & Ville</span>
                              </span>
                            </th>
                            <th className="min-w-[170px] text-center">
                              <span className="kt-table-col justify-center">
                                <span className="kt-table-col-label">Type d'Anomalie</span>
                              </span>
                            </th>
                            <th className="min-w-[120px] text-center">
                              <span className="kt-table-col justify-center">
                                <span className="kt-table-col-label">Inactivité</span>
                              </span>
                            </th>
                            <th className="min-w-[240px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Description & Impact</span>
                              </span>
                            </th>
                            <th className="min-w-[200px]">
                              <span className="kt-table-col">
                                <span className="kt-table-col-label">Action Recommandée</span>
                              </span>
                            </th>
                            <th className="min-w-[110px] text-right">
                              <span className="kt-table-col justify-end">
                                <span className="kt-table-col-label">Action</span>
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                                  Analyse du flux logistique et détection des anomalies...
                                </div>
                              </td>
                            </tr>
                          ) : paginatedAnomalies.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-success font-semibold">
                                🎉 Aucune anomalie détectée pour les critères sélectionnés !
                              </td>
                            </tr>
                          ) : (
                            paginatedAnomalies.map((an) => (
                              <tr key={an.colis_id} className="hover:bg-accent/40 transition-colors">
                                <td className="font-mono text-xs font-semibold text-foreground">
                                  {an.tracking_code}
                                </td>
                                <td>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-foreground text-xs">{an.destinataire}</span>
                                    <span className="text-[11px] text-muted-foreground">{an.ville}</span>
                                  </div>
                                </td>
                                <td className="text-center">
                                  <span className={`kt-badge ${an.badge_class || 'kt-badge-warning'} rounded-full text-[11px]`}>
                                    {an.title}
                                  </span>
                                </td>
                                <td className="text-center font-mono text-xs font-bold text-foreground">
                                  {an.hours_stuck}h
                                </td>
                                <td className="text-xs font-medium text-foreground max-w-xs">
                                  {an.description}
                                </td>
                                <td className="text-xs text-secondary-foreground font-semibold max-w-xs">
                                  {an.action_suggested}
                                </td>
                                <td className="text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (showNotification) showNotification('success', `Relance réseau effectuée pour ${an.tracking_code}`);
                                    }}
                                    className="kt-btn kt-btn-xs kt-btn-primary"
                                  >
                                    Résoudre
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Card Footer & Pagination */}
                <div className="kt-card-footer justify-between md:justify-between flex-col md:flex-row gap-5">
                  <div className="flex items-center gap-2 text-sm text-secondary-foreground">
                    Affichage de {filteredAnomalies.length > 0 ? (anomalyPage - 1) * anomalyPerPage + 1 : 0} à {Math.min(anomalyPage * anomalyPerPage, filteredAnomalies.length)} sur {filteredAnomalies.length} éléments
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={anomalyPage <= 1}
                      onClick={() => setAnomalyPage(prev => Math.max(1, prev - 1))}
                      className="kt-btn kt-btn-sm kt-btn-outline disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <span className="text-xs font-semibold px-2">
                      Page {anomalyPage} / {totalAnomalyPages}
                    </span>
                    <button
                      type="button"
                      disabled={anomalyPage >= totalAnomalyPages}
                      onClick={() => setAnomalyPage(prev => Math.min(totalAnomalyPages, prev + 1))}
                      className="kt-btn kt-btn-sm kt-btn-outline disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OPTIMISATION DE TOURNEES */}
        {activeTab === 'route' && (
          <div className="kt-container-fixed">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Route Summary Metrics */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="kt-card border border-border p-5 flex flex-col gap-3">
                  <h3 className="font-bold text-base text-foreground">Métriques de Tournée Réelle</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-accent/40 rounded-lg flex flex-col">
                      <span className="text-[11px] text-muted-foreground">Nombre d'arrêt</span>
                      <span className="text-xl font-bold text-foreground">{routeMetrics.total_stops} colis</span>
                    </div>
                    <div className="p-3 bg-accent/40 rounded-lg flex flex-col">
                      <span className="text-[11px] text-muted-foreground">Distance Estimée</span>
                      <span className="text-xl font-bold text-primary">{routeMetrics.estimated_distance_km} km</span>
                    </div>
                    <div className="p-3 bg-accent/40 rounded-lg flex flex-col">
                      <span className="text-[11px] text-muted-foreground">Distance Économisée</span>
                      <span className="text-xl font-bold text-success">-{routeMetrics.distance_saved_km} km</span>
                    </div>
                    <div className="p-3 bg-accent/40 rounded-lg flex flex-col">
                      <span className="text-[11px] text-muted-foreground">Économie Carburant</span>
                      <span className="text-xl font-bold text-amber-500">{routeMetrics.fuel_saved_percent}%</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (showNotification) showNotification('success', 'Itinéraire synchronisé avec l\'application livreur !');
                    }}
                    className="kt-btn kt-btn-primary w-full mt-2"
                  >
                    🗺️ Lancer le GPS & Navigation
                  </button>
                </div>
              </div>

              {/* Stop Sequence */}
              <div className="lg:col-span-2">
                <div className="kt-card border border-border p-5">
                  <h3 className="font-bold text-base text-foreground mb-3">Ordre Optimal des Livraisons Réelles (IA)</h3>
                  {routeStops.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Aucun colis à planifier pour le moment.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {routeStops.map((stop) => (
                        <div key={stop.stop_number} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                              #{stop.stop_number}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-foreground">{stop.client_name} ({stop.tracking_code})</span>
                              <span className="text-[11px] text-muted-foreground">{stop.address}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-semibold text-foreground">ETA: {stop.eta}</span>
                            <span className="kt-badge kt-badge-outline kt-badge-primary rounded-full">{stop.crbt_amount} DH</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: CHATBOT LIVREUR */}
        {activeTab === 'chatbot' && (
          <div className="kt-container-fixed">
            <div className="max-w-2xl mx-auto kt-card border border-border flex flex-col h-[550px]">
              <div className="p-4 border-b border-border bg-accent/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ki-filled ki-messages text-primary text-xl" />
                  <h3 className="font-bold text-sm text-foreground">Assistant IA Livreur (Terrain & Colis Réels)</h3>
                </div>
                <span className="kt-badge kt-badge-success kt-badge-outline rounded-full">En ligne</span>
              </div>

              {/* Chat Messages */}
              <div className="grow p-4 overflow-y-auto flex flex-col gap-3">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-3 rounded-xl text-xs max-w-[80%] whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-accent/50 text-foreground rounded-bl-none border border-border'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.quick_actions && msg.quick_actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.quick_actions.map((act, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendChat(act.label)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-background hover:bg-accent border border-border rounded-full text-primary shadow-sm transition-all"
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-border flex items-center gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Posez une question ou entrez un numéro de commande réel..."
                  className="kt-input grow"
                />
                <button
                  type="button"
                  onClick={() => handleSendChat()}
                  disabled={isChatSending}
                  className="kt-btn kt-btn-primary"
                >
                  {isChatSending ? '...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </DashboardLayout>
  );
}
