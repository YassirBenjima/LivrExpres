import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function ApiDocsPage({ navigate, showNotification }) {
  const [activeTab, setActiveTab] = useState('key');
  const [apiKey, setApiKey] = useState('');
  const [hostInfo, setHostInfo] = useState({ host: 'localhost:5173', schemeAndHttpHost: 'http://localhost:5173' });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchDocsInfo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/api-docs', {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        setApiKey(json.api_key || '');
        if (json.host) {
          setHostInfo({
            host: json.host,
            schemeAndHttpHost: json.schemeAndHttpHost || `http://${json.host}`
          });
        }
      }
    } catch (err) {
      console.error('Erreur chargement documentation API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocsInfo();
  }, []);

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/api-docs/generate-key', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        setApiKey(json.api_key);
        if (showNotification) showNotification(json.message || 'Nouvelle clé API générée.', 'success');
      }
    } catch (err) {
      console.error('Erreur génération clé API:', err);
    } finally {
      setGenerating(false);
    }
  };

  const copyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    if (showNotification) showNotification('Clé API copiée !', 'success');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <DashboardLayout activeMenu="api_docs">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header */}
        <div className="kt-container-fixed mb-6">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-5 border-b border-border">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Documentation API</h1>
              <span className="text-sm text-secondary-foreground">
                Intégrez les services de LivrExpress directement dans vos outils et applications.
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="kt-container-fixed mb-5">
          <div className="flex items-center overflow-x-auto whitespace-nowrap gap-6 border-b border-border">
            {[
              { id: 'key', label: 'Clé API', icon: 'ki-code' },
              { id: 'colis', label: 'Colis', icon: 'ki-delivery-3' },
              { id: 'villes', label: 'Les Villes', icon: 'ki-map' },
              { id: 'ramassage', label: 'Ramassage', icon: 'ki-delivery' },
              { id: 'stock', label: 'Stock', icon: 'ki-archive' },
              { id: 'retour', label: 'Retour', icon: 'ki-arrow-left' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-secondary-foreground hover:text-primary'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`ki-filled ${tab.icon} text-base`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Banner Info */}
        <div className="kt-container-fixed mb-5">
          <div className="kt-card bg-primary-light/5 border border-primary/20">
            <div className="kt-card-content p-5 flex flex-col gap-3 text-center md:text-left">
              <p className="text-sm text-foreground leading-relaxed">
                Toutes les requêtes à l'API LivrExpress nécessitent une authentification à l'aide d'un en-tête HTTP personnalisé nommé <span className="bg-danger/10 text-danger text-xs font-bold px-1.5 py-0.5 rounded">X-API-Key</span>. Vous devez inclure votre clé API unique dans cet en-tête pour accéder aux points de terminaison de l'API.
              </p>
              <p className="text-sm text-secondary-foreground">
                Vous pouvez toujours vérifier l'état de l'API LivrExpress à l'aide du point de terminaison suivant : <code className="bg-danger/10 text-danger text-xs px-1.5 py-0.5 rounded font-mono font-bold">{hostInfo.host}/api/health</code>
              </p>
            </div>
          </div>
        </div>

        {/* TAB 1: CLÉ API */}
        {activeTab === 'key' && (
          <div className="kt-container-fixed flex flex-col gap-5">
            
            {/* Obtention de votre clé API */}
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">Obtention de votre clé API</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">Vous pouvez générer une nouvelle clé API ci-dessous.</p>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="table-auto w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 text-secondary-foreground text-left text-xs uppercase font-medium">
                        <th className="p-4 w-2/3">Clé API</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-4">
                          {loading ? (
                            <span className="text-secondary-foreground text-sm">Chargement...</span>
                          ) : apiKey ? (
                            <span className="bg-danger/10 text-danger font-mono text-sm px-3 py-1.5 rounded inline-block break-all">
                              {apiKey}
                            </span>
                          ) : (
                            <span className="text-secondary-foreground italic text-sm">
                              Aucune clé API active. Veuillez en générer une.
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-2">
                          {apiKey && (
                            <button className="kt-btn kt-btn-outline kt-btn-primary kt-btn-sm" onClick={copyKey} type="button">
                              <i className={`ki-filled ${copiedKey ? 'ki-check' : 'ki-copy'}`}></i>
                              {copiedKey ? 'Copié !' : 'Copier'}
                            </button>
                          )}
                          <button
                            className="kt-btn kt-btn-primary kt-btn-sm"
                            type="button"
                            disabled={generating}
                            onClick={handleGenerateKey}
                          >
                            <i className="ki-filled ki-arrows-loop"></i>
                            {generating ? 'Génération...' : 'générer une nouvelle clé API'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Utilisation de votre clé API */}
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">Utilisation de votre clé API</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground leading-relaxed">
                  Pour inclure votre clé API dans vos requêtes API, vous devez définir l'en-tête HTTP 'X-API-Key' avec la valeur de votre clé API. Par exemple :
                </p>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  X-API-Key: {apiKey || 'votre_clé_API_unique_ici'}
                </div>
              </div>
            </div>

            {/* Importance de l'authentification */}
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">Importance de l'authentification</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground leading-relaxed">
                  L'authentification est essentielle pour garantir la sécurité et l'intégrité de vos données. En exigeant une clé API pour chaque requête, l'API LivrExpress s'assure que seuls les utilisateurs autorisés peuvent accéder à ses fonctionnalités.
                </p>
              </div>
            </div>

            {/* Conseils de sécurité */}
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">Conseils pour la sécurité de votre clé API</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <ul className="list-disc list-inside text-sm text-secondary-foreground flex flex-col gap-2">
                  <li>Ne partagez jamais votre clé API avec personne d'autre.</li>
                  <li>Conservez votre clé API en lieu sûr et confidentiel.</li>
                  <li>Ne stockez pas votre clé API dans le code source de vos applications.</li>
                  <li>Si vous pensez que votre clé API a été compromise, changez la immédiatement.</li>
                </ul>
              </div>
            </div>

            {/* Réponse en cas de succès */}
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">Réponse en cas de succès</h3>
              </div>
              <div className="kt-card-content p-5">
                <pre className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm overflow-x-auto">{`{
  "AUTH": {
    "RESULT": "SUCCESS",
    "MESSAGE": "Customer Authenticated, Welcome to LivrExpress API"
  }
}`}</pre>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: COLIS */}
        {activeTab === 'colis' && (
          <div className="kt-container-fixed flex flex-col gap-5">
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">Ajouter Nouveau colis</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">
                  Cette documentation décrit l'API permettant d'ajouter un nouveau colis à votre compte LivrExpress.
                </p>
                <h4 className="text-sm font-bold text-foreground">Méthode</h4>
                <div>
                  <span className="bg-blue-500/10 text-blue-500 font-bold text-xs uppercase px-3 py-1 rounded">POST</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">URL</h4>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  {hostInfo.schemeAndHttpHost}/api/customer/Parcels/AddParcel
                </div>
                
                <h4 class="text-sm font-bold text-foreground mt-2">Réponse en cas de succès</h4>
                <pre className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm overflow-x-auto">{`{
  "ADD-PARCEL": {
    "RESULT": "SUCCESS",
    "MESSAGE": "Parcel Added successfully",
    "TRACKING": "EXP-123456789-MA"
  }
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VILLES */}
        {activeTab === 'villes' && (
          <div className="kt-container-fixed flex flex-col gap-5">
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">Récupérer la liste des villes</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">
                  Cette documentation décrit l'API permettant de récupérer la liste des villes desservies par LivrExpress.
                </p>
                <h4 className="text-sm font-bold text-foreground">Méthode</h4>
                <div>
                  <span className="bg-emerald-500/10 text-emerald-500 font-bold text-xs uppercase px-3 py-1 rounded">GET</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">URL</h4>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  {hostInfo.schemeAndHttpHost}/api/customer/Cities
                </div>
                <h4 className="text-sm font-bold text-foreground mt-2">Exemple de réponse</h4>
                <pre className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm overflow-x-auto">{`[
  "17": {
    "CODE": "NDR",
    "NAME": "Nador",
    "D_FEES": "45",
    "D_FEES_SAME_CITY": "25"
  },
  "04": {
    "CODE": "CAS",
    "NAME": "Casablanca",
    "D_FEES": "30",
    "D_FEES_SAME_CITY": "20"
  }
]`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RAMASSAGE */}
        {activeTab === 'ramassage' && (
          <div className="kt-container-fixed flex flex-col gap-5">
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">Ajouter une nouvelle demande de ramassage</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">
                  Cette documentation décrit l'API permettant d'ajouter une nouvelle demande de ramassage.
                </p>
                <h4 className="text-sm font-bold text-foreground">Méthode</h4>
                <div>
                  <span className="bg-blue-500/10 text-blue-500 font-bold text-xs uppercase px-3 py-1 rounded">POST</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">URL</h4>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  {hostInfo.schemeAndHttpHost}/api/customer/Pickups/CreateRequest
                </div>
                <h4 className="text-sm font-bold text-foreground mt-2">Exemple de réponse</h4>
                <pre className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm overflow-x-auto">{`{
  "ADD-PICKUP": {
    "RESULT": "SUCCESS",
    "MESSAGE": "New Pickup request created successfully"
  }
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STOCK */}
        {activeTab === 'stock' && (
          <div className="kt-container-fixed flex flex-col gap-5">
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">Vos produits en stock</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">
                  Cette documentation décrit l'API permettant de récupérer la liste de vos produits en stock.
                </p>
                <h4 className="text-sm font-bold text-foreground">Méthode</h4>
                <div>
                  <span className="bg-emerald-500/10 text-emerald-500 font-bold text-xs uppercase px-3 py-1 rounded">GET</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">URL</h4>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  {hostInfo.schemeAndHttpHost}/api/customer/Stock
                </div>
                <h4 className="text-sm font-bold text-foreground mt-2">Exemple de réponse</h4>
                <pre className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm overflow-x-auto">{`{
  "30986": [
    {
      "REF": "KA2NP",
      "QUANTITY": "44",
      "WAITING_QUANTITY": "0"
    }
  ]
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RETOUR */}
        {activeTab === 'retour' && (
          <div className="kt-container-fixed flex flex-col gap-5">
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">Demandes de retour</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">
                  Cette documentation décrit l'API permettant de soumettre des demandes de retour de colis.
                </p>
                <h4 className="text-sm font-bold text-foreground">Méthode</h4>
                <div>
                  <span className="bg-blue-500/10 text-blue-500 font-bold text-xs uppercase px-3 py-1 rounded">POST</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">URL</h4>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  {hostInfo.schemeAndHttpHost}/api/customer/Returns/CreateRequest
                </div>
                <h4 className="text-sm font-bold text-foreground mt-2">Exemple de réponse</h4>
                <pre className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm overflow-x-auto">{`{
  "CREATE-RETURN": {
    "RESULT": "SUCCESS",
    "MESSAGE": "Return request registered successfully"
  }
}`}</pre>
              </div>
            </div>
          </div>
        )}

      </main>
    </DashboardLayout>
  );
}
