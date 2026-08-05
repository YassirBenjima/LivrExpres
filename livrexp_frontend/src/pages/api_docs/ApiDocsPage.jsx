import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';

export default function ApiDocsPage({ showNotification }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('key');
  const [apiKey, setApiKey] = useState('');
  const [hostInfo, setHostInfo] = useState({ host: 'localhost:5173', schemeAndHttpHost: 'http://localhost:5173' });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    const fetchDocsInfo = async () => {
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
        if (showNotification) showNotification('success', t('apiDocs.keyGeneratedToast', 'Votre nouvelle clé API a été générée avec succès.'));
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
    if (showNotification) showNotification('success', t('apiDocs.copiedToast', 'Clé API copiée !'));
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <DashboardLayout activeMenu="api_docs">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header */}
        <div className="kt-container-fixed mb-6">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-5 border-b border-border">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">{t('apiDocs.title', 'Documentation API')}</h1>
              <span className="text-sm text-secondary-foreground">
                {t('apiDocs.subtitle', 'Intégrez les services de LivrExpress directement dans vos outils et applications.')}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="kt-container-fixed mb-5">
          <div className="flex items-center overflow-x-auto whitespace-nowrap gap-6 border-b border-border">
            {[
              { id: 'key', label: t('apiDocs.tabApiKey', 'Clé API'), icon: 'ki-code' },
              { id: 'colis', label: t('apiDocs.tabParcels', 'Colis'), icon: 'ki-delivery-3' },
              { id: 'villes', label: t('apiDocs.tabCities', 'Les Villes'), icon: 'ki-map' },
              { id: 'ramassage', label: t('apiDocs.tabPickup', 'Ramassage'), icon: 'ki-delivery' },
              { id: 'stock', label: t('apiDocs.tabStock', 'Stock'), icon: 'ki-archive' },
              { id: 'retour', label: t('apiDocs.tabReturns', 'Retour'), icon: 'ki-arrow-left' },
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
                {t('apiDocs.bannerPre', "Toutes les requêtes à l'API LivrExpress nécessitent une authentification à l'aide d'un en-tête HTTP personnalisé nommé")} <span className="bg-danger/10 text-danger text-xs font-bold px-1.5 py-0.5 rounded">X-API-Key</span>{t('apiDocs.bannerPost', ". Vous devez inclure votre clé API unique dans cet en-tête pour accéder aux points de terminaison de l'API.")}
              </p>
              <p className="text-sm text-secondary-foreground">
                {t('apiDocs.healthCheckText', "Vous pouvez toujours vérifier l'état de l'API LivrExpress à l'aide du point de terminaison suivant :")} <code className="bg-danger/10 text-danger text-xs px-1.5 py-0.5 rounded font-mono font-bold">{hostInfo.host}/api/health</code>
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
                <h3 className="kt-card-title text-sm font-semibold">{t('apiDocs.getKeyTitle', 'Obtention de votre clé API')}</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">{t('apiDocs.getKeyDesc', 'Vous pouvez générer une nouvelle clé API ci-dessous.')}</p>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="table-auto w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 text-secondary-foreground text-left text-xs uppercase font-medium">
                        <th className="p-4 w-2/3">{t('apiDocs.colApiKey', 'Clé API')}</th>
                        <th className="p-4 text-center">{t('apiDocs.colActions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-4">
                          {loading ? (
                            <span className="text-secondary-foreground text-sm">{t('apiDocs.loadingText', 'Chargement...')}</span>
                          ) : apiKey ? (
                            <span className="bg-danger/10 text-danger font-mono text-sm px-3 py-1.5 rounded inline-block break-all">
                              {apiKey}
                            </span>
                          ) : (
                            <span className="text-secondary-foreground italic text-sm">
                              {t('apiDocs.noActiveKey', 'Aucune clé API active. Veuillez en générer une.')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-2">
                          {apiKey && (
                            <button className="kt-btn kt-btn-outline kt-btn-primary kt-btn-sm" onClick={copyKey} type="button">
                              <i className={`ki-filled ${copiedKey ? 'ki-check' : 'ki-copy'}`}></i>
                              {copiedKey ? t('apiDocs.copiedBtn', 'Copié !') : t('apiDocs.copyBtn', 'Copier')}
                            </button>
                          )}
                          <button
                            className="kt-btn kt-btn-primary kt-btn-sm"
                            type="button"
                            disabled={generating}
                            onClick={handleGenerateKey}
                          >
                            <i className="ki-filled ki-arrows-loop"></i>
                            {generating ? t('apiDocs.generatingBtn', 'Génération...') : t('apiDocs.generateBtn', 'générer une nouvelle clé API')}
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
                <h3 className="kt-card-title text-sm font-semibold">{t('apiDocs.useKeyTitle', 'Utilisation de votre clé API')}</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground leading-relaxed">
                  {t('apiDocs.useKeyDesc', "Pour inclure votre clé API dans vos requêtes API, vous devez définir l'en-tête HTTP 'X-API-Key' avec la valeur de votre clé API. Par exemple :")}
                </p>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  X-API-Key: {apiKey || t('apiDocs.placeholderKey', 'votre_clé_API_unique_ici')}
                </div>
              </div>
            </div>

            {/* Importance de l'authentification */}
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">{t('apiDocs.authImportanceTitle', "Importance de l'authentification")}</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground leading-relaxed">
                  {t('apiDocs.authImportanceDesc', "L'authentification est essentielle pour garantir la sécurité et l'intégrité de vos données. En exigeant une clé API pour chaque requête, l'API LivrExpress s'assure que seuls les utilisateurs autorisés peuvent accéder à ses fonctionnalités.")}
                </p>
              </div>
            </div>

            {/* Conseils de sécurité */}
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">{t('apiDocs.securityTipsTitle', 'Conseils pour la sécurité de votre clé API')}</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <ul className="list-disc list-inside text-sm text-secondary-foreground flex flex-col gap-2">
                  <li>{t('apiDocs.tip1', "Ne partagez jamais votre clé API avec personne d'autre.")}</li>
                  <li>{t('apiDocs.tip2', 'Conservez votre clé API en lieu sûr et confidentiel.')}</li>
                  <li>{t('apiDocs.tip3', 'Ne stockez pas votre clé API dans le code source de vos applications.')}</li>
                  <li>{t('apiDocs.tip4', 'Si vous pensez que votre clé API a été compromise, changez la immédiatement.')}</li>
                </ul>
              </div>
            </div>

            {/* Réponse en cas de succès */}
            <div className="kt-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold">{t('apiDocs.successResponseTitle', 'Réponse en cas de succès')}</h3>
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
                <h3 className="kt-card-title text-sm font-semibold">{t('apiDocs.addParcelTitle', 'Ajouter Nouveau colis')}</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">
                  {t('apiDocs.addParcelDesc', "Cette documentation décrit l'API permettant d'ajouter un nouveau colis à votre compte LivrExpress.")}
                </p>
                <h4 className="text-sm font-bold text-foreground">{t('apiDocs.methodLabel', 'Méthode')}</h4>
                <div>
                  <span className="bg-blue-500/10 text-blue-500 font-bold text-xs uppercase px-3 py-1 rounded">POST</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{t('apiDocs.urlLabel', 'URL')}</h4>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  {hostInfo.schemeAndHttpHost}/api/customer/Parcels/AddParcel
                </div>
                
                <h4 className="text-sm font-bold text-foreground mt-2">{t('apiDocs.successResponseTitle', 'Réponse en cas de succès')}</h4>
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
                <h3 className="kt-card-title text-sm font-semibold">{t('apiDocs.getCitiesTitle', 'Récupérer la liste des villes')}</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">
                  {t('apiDocs.getCitiesDesc', "Cette documentation décrit l'API permettant de récupérer la liste des villes desservies par LivrExpress.")}
                </p>
                <h4 className="text-sm font-bold text-foreground">{t('apiDocs.methodLabel', 'Méthode')}</h4>
                <div>
                  <span className="bg-emerald-500/10 text-emerald-500 font-bold text-xs uppercase px-3 py-1 rounded">GET</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{t('apiDocs.urlLabel', 'URL')}</h4>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  {hostInfo.schemeAndHttpHost}/api/customer/Cities
                </div>
                <h4 className="text-sm font-bold text-foreground mt-2">{t('apiDocs.exampleResponseTitle', 'Exemple de réponse')}</h4>
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
                <h3 className="kt-card-title text-sm font-semibold">{t('apiDocs.addPickupTitle', 'Ajouter une nouvelle demande de ramassage')}</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">
                  {t('apiDocs.addPickupDesc', "Cette documentation décrit l'API permettant d'ajouter une nouvelle demande de ramassage.")}
                </p>
                <h4 className="text-sm font-bold text-foreground">{t('apiDocs.methodLabel', 'Méthode')}</h4>
                <div>
                  <span className="bg-blue-500/10 text-blue-500 font-bold text-xs uppercase px-3 py-1 rounded">POST</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{t('apiDocs.urlLabel', 'URL')}</h4>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  {hostInfo.schemeAndHttpHost}/api/customer/Pickups/CreateRequest
                </div>
                <h4 className="text-sm font-bold text-foreground mt-2">{t('apiDocs.exampleResponseTitle', 'Exemple de réponse')}</h4>
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
                <h3 className="kt-card-title text-sm font-semibold">{t('apiDocs.stockProductsTitle', 'Vos produits en stock')}</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">
                  {t('apiDocs.stockProductsDesc', "Cette documentation décrit l'API permettant de récupérer la liste de vos produits en stock.")}
                </p>
                <h4 className="text-sm font-bold text-foreground">{t('apiDocs.methodLabel', 'Méthode')}</h4>
                <div>
                  <span className="bg-emerald-500/10 text-emerald-500 font-bold text-xs uppercase px-3 py-1 rounded">GET</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{t('apiDocs.urlLabel', 'URL')}</h4>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  {hostInfo.schemeAndHttpHost}/api/customer/Stock
                </div>
                <h4 className="text-sm font-bold text-foreground mt-2">{t('apiDocs.exampleResponseTitle', 'Exemple de réponse')}</h4>
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
                <h3 className="kt-card-title text-sm font-semibold">{t('apiDocs.returnRequestsTitle', 'Demandes de retour')}</h3>
              </div>
              <div className="kt-card-content p-5 flex flex-col gap-4">
                <p className="text-sm text-secondary-foreground">
                  {t('apiDocs.returnRequestsDesc', "Cette documentation décrit l'API permettant de soumettre des demandes de retour de colis.")}
                </p>
                <h4 className="text-sm font-bold text-foreground">{t('apiDocs.methodLabel', 'Méthode')}</h4>
                <div>
                  <span className="bg-blue-500/10 text-blue-500 font-bold text-xs uppercase px-3 py-1 rounded">POST</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{t('apiDocs.urlLabel', 'URL')}</h4>
                <div className="bg-[#1e1e2f] text-[#f8f8f2] font-mono p-4 rounded-lg text-sm">
                  {hostInfo.schemeAndHttpHost}/api/customer/Returns/CreateRequest
                </div>
                <h4 className="text-sm font-bold text-foreground mt-2">{t('apiDocs.exampleResponseTitle', 'Exemple de réponse')}</h4>
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
