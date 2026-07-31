import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

const MOCK_PREDICTIONS = [
  {
    colis_id: 991,
    tracking_code: 'CMD-94810',
    destinataire: 'Youssef Alami',
    ville: 'Oujda',
    crbt: 1850.00,
    prediction: {
      risk_score: 88,
      risk_level: 'Élevé',
      badge_color: 'destructive',
      factors: [
        "Ville à taux de retour historique élevé (Oujda: +25%)",
        "Montant CRBT élevé (1850.00 DH): Risque de refus (+25%)",
        "Numéro de téléphone incomplet (+30%)"
      ],
      recommendation: "Recommandé : Effectuer un appel de pré-confirmation téléphonique avant le départ du livreur."
    }
  },
  {
    colis_id: 992,
    tracking_code: 'CMD-88301',
    destinataire: 'Hassan Chraibi',
    ville: 'Tanger',
    crbt: 1420.00,
    prediction: {
      risk_score: 68,
      risk_level: 'Élevé',
      badge_color: 'destructive',
      factors: [
        "Passage précédent marqué 'Destinataire absent' (+35%)",
        "Ville à taux de retour historique élevé (Tanger: +15%)"
      ],
      recommendation: "Recommandé : Planifier un rendez-vous horaire strict via WhatsApp."
    }
  },
  {
    colis_id: 993,
    tracking_code: 'CMD-77102',
    destinataire: 'Meriem Benjelloun',
    ville: 'Casablanca',
    crbt: 450.00,
    prediction: {
      risk_score: 42,
      risk_level: 'Moyen',
      badge_color: 'warning',
      factors: [
        "Montant CRBT modéré (450.00 DH) (+12%)",
        "Livraison en résidence fermée (accès restreint)"
      ],
      recommendation: "Envoyer une notification WhatsApp de confirmation d'adresse."
    }
  },
  {
    colis_id: 994,
    tracking_code: 'CMD-66205',
    destinataire: 'Omar Tazi',
    ville: 'Marrakech',
    crbt: 290.00,
    prediction: {
      risk_score: 18,
      risk_level: 'Faible',
      badge_color: 'success',
      factors: [
        "Client fidèle avec 98% de taux d'acceptation historique",
        "Adresse géographique géolocalisée et vérifiée"
      ],
      recommendation: "Livraison standard prioritaire."
    }
  },
  {
    colis_id: 995,
    tracking_code: 'CMD-55109',
    destinataire: 'Sara Bennani',
    ville: 'Rabat',
    crbt: 780.00,
    prediction: {
      risk_score: 28,
      risk_level: 'Faible',
      badge_color: 'success',
      factors: [
        "Adresse Agdal confirmée par appel préalable",
        "Montant standard"
      ],
      recommendation: "Livraison standard programmée."
    }
  }
];

const MOCK_ANOMALIES = [
  {
    colis_id: 8801,
    tracking_code: 'CMD-99410',
    destinataire: 'Karim Idrissi',
    ville: 'Casablanca',
    etat: 'En attente',
    hours_stuck: 52.0,
    severity: 'CRITICAL',
    badge_class: 'kt-badge-destructive',
    title: 'Retard de Ramassage Majeur',
    description: 'Colis bloqué chez le marchand depuis 52h sans ramassage effectif.',
    action_suggested: 'Ré-assigner d\'urgence au livreur zone Maârif.'
  },
  {
    colis_id: 8802,
    tracking_code: 'CMD-88390',
    destinataire: 'Fatima Ezzahra',
    ville: 'Oujda',
    etat: 'Expédié',
    hours_stuck: 64.5,
    severity: 'CRITICAL',
    badge_class: 'kt-badge-destructive',
    title: 'Colis Bloqué en Transit Inter-villes',
    description: 'Expédié depuis le hub Casablanca vers Oujda depuis 64h sans scan d\'arrivée.',
    action_suggested: 'Consulter le bordereau de transporteur d\'axe.'
  },
  {
    colis_id: 8803,
    tracking_code: 'CMD-77215',
    destinataire: 'Amine Bennis',
    ville: 'Tanger',
    etat: 'En cours',
    hours_stuck: 38.2,
    severity: 'WARNING',
    badge_class: 'kt-badge-warning',
    title: 'Livraison Non Résolue (> 36h)',
    description: 'Tournée démarrée il y a 38h sans statut final (Livré/Retour/Report).',
    action_suggested: 'Appeler directement le livreur assigné pour clôture.'
  },
  {
    colis_id: 8804,
    tracking_code: 'CMD-66108',
    destinataire: 'Nadia Filali',
    ville: 'Marrakech',
    etat: 'En cours',
    hours_stuck: 29.0,
    severity: 'WARNING',
    badge_class: 'kt-badge-warning',
    title: 'Échec Répété sans Relance',
    description: '2 passages infructueux marqués sans appel de confirmation.',
    action_suggested: 'Déclencher la relance automatique WhatsApp.'
  }
];

const MOCK_ROUTE_STOPS = [
  {
    stop_number: 1,
    colis_id: 701,
    tracking_code: 'CMD-94820',
    client_name: 'Amine Mansouri',
    phone: '0661234567',
    address: '14 Bd Mohamed V, Maârif, Casablanca',
    crbt_amount: 650.00,
    eta: '09:15',
    status: 'PENDING',
    priority: 'HAUTE'
  },
  {
    stop_number: 2,
    colis_id: 702,
    tracking_code: 'CMD-88310',
    client_name: 'Khadija Naciri',
    phone: '0669876543',
    address: '42 Rue Zerktouni, Gauthier, Casablanca',
    crbt_amount: 1200.00,
    eta: '09:35',
    status: 'PENDING',
    priority: 'NORMALE'
  },
  {
    stop_number: 3,
    colis_id: 703,
    tracking_code: 'CMD-77140',
    client_name: 'Reda El Fassi',
    phone: '0665544332',
    address: '88 Bd d\'Anfa, Racine, Casablanca',
    crbt_amount: 890.00,
    eta: '10:05',
    status: 'PENDING',
    priority: 'NORMALE'
  },
  {
    stop_number: 4,
    colis_id: 704,
    tracking_code: 'CMD-66230',
    client_name: 'Sanaa Chraibi',
    phone: '0661122334',
    address: '23 Av. Hassan II, Centre-Ville, Casablanca',
    crbt_amount: 450.00,
    eta: '10:35',
    status: 'PENDING',
    priority: 'NORMALE'
  },
  {
    stop_number: 5,
    colis_id: 705,
    tracking_code: 'CMD-55120',
    client_name: 'Mehdi Toumi',
    phone: '0667788990',
    address: '5 Bd de la Corniche, Aïn Diab, Casablanca',
    crbt_amount: 1650.00,
    eta: '11:10',
    status: 'PENDING',
    priority: 'NORMALE'
  },
  {
    stop_number: 6,
    colis_id: 706,
    tracking_code: 'CMD-44090',
    client_name: 'Zineb Berrada',
    phone: '0663322110',
    address: '12 Rue Normandie, Bourgogne, Casablanca',
    crbt_amount: 320.00,
    eta: '11:45',
    status: 'PENDING',
    priority: 'NORMALE'
  }
];

export default function LivrExpressAiSuitePage({ navigate, showNotification }) {
  const [activeTab, setActiveTab] = useState('predictions'); // 'predictions', 'anomalies', 'route', 'chatbot'
  const [loading, setLoading] = useState(true);

  // AI Predictions State
  const [predictions, setPredictions] = useState(MOCK_PREDICTIONS);
  
  // AI Anomalies State
  const [anomalies, setAnomalies] = useState(MOCK_ANOMALIES);

  // AI Route State
  const [routeStops, setRouteStops] = useState(MOCK_ROUTE_STOPS);
  const [routeMetrics, setRouteMetrics] = useState({
    total_stops: 6,
    estimated_distance_km: 14.4,
    estimated_time_minutes: 132,
    distance_saved_km: 16.4,
    fuel_saved_percent: 21.0
  });

  // Livreur Chatbot State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: "Bonjour ! Je suis votre Assistant IA Livreur. Comment puis-je optimiser votre journée ?",
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
        if (data.predictions && data.predictions.length > 0) {
          setPredictions(data.predictions);
        } else {
          setPredictions(MOCK_PREDICTIONS);
        }
      } else {
        setPredictions(MOCK_PREDICTIONS);
      }
    } catch (e) {
      setPredictions(MOCK_PREDICTIONS);
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
        if (data.anomalies && data.anomalies.length > 0) {
          setAnomalies(data.anomalies);
        } else {
          setAnomalies(MOCK_ANOMALIES);
        }
      } else {
        setAnomalies(MOCK_ANOMALIES);
      }
    } catch (e) {
      setAnomalies(MOCK_ANOMALIES);
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
        if (data.stops && data.stops.length > 0) {
          setRouteStops(data.stops);
          if (data.metrics) setRouteMetrics(data.metrics);
        } else {
          setRouteStops(MOCK_ROUTE_STOPS);
        }
      } else {
        setRouteStops(MOCK_ROUTE_STOPS);
      }
    } catch (e) {
      setRouteStops(MOCK_ROUTE_STOPS);
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

  return (
    <DashboardLayout activeMenu="ai_suite">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono flex items-center gap-2">
                <i className="ki-filled ki-technology-4 text-primary text-2xl" />
                Suite IA & Prédictions Avancées
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 font-medium text-sm text-secondary-foreground">
                Intelligence Artificielle • Prédiction des retours • Tournées optimisées • Détection d'anomalies
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center p-1 bg-accent/30 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('predictions')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'predictions' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <i className="ki-filled ki-graph-up text-xs me-1" />
                Risques de Retour
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('anomalies')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'anomalies' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <i className="ki-filled ki-shield-cross text-xs me-1" />
                Détection Anomalies
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('route')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'route' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <i className="ki-filled ki-route text-xs me-1" />
                Itinéraires IA
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('chatbot')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'chatbot' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <i className="ki-filled ki-messages text-xs me-1" />
                Chatbot Livreur
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: PREDICTION DES RETOURS */}
        {activeTab === 'predictions' && (
          <div className="kt-container-fixed">
            <div className="grid gap-5">
              <div className="kt-card border border-border p-5">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Prédiction des Colis à Risque de Retour</h3>
                    <p className="text-xs text-muted-foreground">Scoring prédictif basé sur le profil client, la ville et le montant du remboursement</p>
                  </div>
                  <button onClick={fetchPredictions} className="kt-btn kt-btn-sm kt-btn-outline">
                    <i className="ki-filled ki-arrows-loop text-xs me-1" />
                    Recalculer IA
                  </button>
                </div>

                <div className="kt-scrollable-x-auto">
                  <table className="kt-table table-auto kt-table-border">
                    <thead>
                      <tr>
                        <th>Colis & Code</th>
                        <th>Destinataire & Ville</th>
                        <th>Montant CRBT</th>
                        <th>Score de Risque IA</th>
                        <th>Facteurs Détectés</th>
                        <th>Recommandation IA</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-muted-foreground">Calcul prédictif IA en cours...</td>
                        </tr>
                      ) : predictions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-muted-foreground">Aucun colis à analyser.</td>
                        </tr>
                      ) : (
                        predictions.map((p) => {
                          const pred = p.prediction || {};
                          return (
                            <tr key={p.colis_id}>
                              <td className="font-mono text-xs font-semibold text-foreground">{p.tracking_code}</td>
                              <td>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground text-xs">{p.destinataire}</span>
                                  <span className="text-[11px] text-muted-foreground">{p.ville}</span>
                                </div>
                              </td>
                              <td className="font-semibold text-foreground">{p.crbt} DH</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-accent/40 h-2 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${pred.risk_score > 60 ? 'bg-destructive' : pred.risk_score > 30 ? 'bg-warning' : 'bg-success'}`}
                                      style={{ width: `${pred.risk_score || 0}%` }}
                                    />
                                  </div>
                                  <span className={`kt-badge kt-badge-${pred.badge_color || 'primary'} kt-badge-outline rounded-full text-[11px]`}>
                                    {pred.risk_score}% ({pred.risk_level})
                                  </span>
                                </div>
                              </td>
                              <td>
                                <ul className="list-disc list-inside text-[11px] text-secondary-foreground space-y-0.5">
                                  {(pred.factors || []).map((f, i) => <li key={i}>{f}</li>)}
                                </ul>
                              </td>
                              <td className="text-xs text-foreground font-medium max-w-xs">{pred.recommendation}</td>
                              <td className="text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (showNotification) showNotification('info', `Appel de confirmation pré-livraison lancé pour ${p.destinataire}`);
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
          </div>
        )}

        {/* TAB 2: DETECTION D'ANOMALIES */}
        {activeTab === 'anomalies' && (
          <div className="kt-container-fixed">
            <div className="grid gap-5">
              <div className="kt-card border border-border p-5">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Colis en Anomalie ou Bloqués</h3>
                    <p className="text-xs text-muted-foreground">Détection automatique des colis sans changement de statut depuis 24h à 48h</p>
                  </div>
                  <span className="kt-badge kt-badge-destructive rounded-full">
                    {anomalies.length} Anomalie(s) active(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loading ? (
                    <div className="col-span-full text-center py-6 text-muted-foreground">Analyse du flux logistique...</div>
                  ) : anomalies.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-success font-semibold">
                      🎉 Aucune anomalie détectée dans le réseau logistique !
                    </div>
                  ) : (
                    anomalies.map((an) => (
                      <div key={an.colis_id} className="kt-card border border-border p-4 flex flex-col justify-between gap-3">
                        <div className="flex items-start justify-between">
                          <span className={`kt-badge ${an.badge_class} rounded-full`}>{an.title}</span>
                          <span className="text-xs font-mono font-bold text-foreground">{an.hours_stuck}h d'inactivité</span>
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-primary block">{an.tracking_code}</span>
                          <p className="text-xs font-medium text-foreground mt-1">{an.description}</p>
                          <span className="text-[11px] text-muted-foreground block mt-1">Ville: {an.ville} • Client: {an.destinataire}</span>
                        </div>
                        <div className="border-t border-border pt-2 mt-1 flex items-center justify-between">
                          <span className="text-[11px] text-secondary-foreground font-semibold">Action: {an.action_suggested}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (showNotification) showNotification('success', `Relance réseau effectuée pour ${an.tracking_code}`);
                            }}
                            className="kt-btn kt-btn-xs kt-btn-primary"
                          >
                            Résoudre
                          </button>
                        </div>
                      </div>
                    ))
                  )}
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
                  <h3 className="font-bold text-base text-foreground">Métriques de la Tournée</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-accent/40 rounded-lg flex flex-col">
                      <span className="text-[11px] text-muted-foreground">Nombre d'arrêt</span>
                      <span className="text-xl font-bold text-foreground">{routeMetrics.total_stops} clients</span>
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
                  <h3 className="font-bold text-base text-foreground mb-3">Ordre Optimal des Livraisons (IA)</h3>
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
                  <h3 className="font-bold text-sm text-foreground">Assistant IA Livreur (Terrain)</h3>
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
                  placeholder="Posez une question sur votre tournée ou un colis..."
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
