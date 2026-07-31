import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

const CITIES = ['Casablanca','Rabat','Marrakech','Tanger','Agadir','Fès','Meknès','Oujda','Kénitra','Tétouan'];

export default function LivreurNewPage({ navigate, showNotification }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', city: '', address: '', businessName: 'LivrExpress' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const cityOptions = CITIES.map(c => ({ value: c, label: c }));

  const handleFillTest = () => {
    setForm({ fullName: 'Ahmed Mansouri', email: `livreur.${Date.now()}@livrexpress.ma`, password: 'livreur123', phone: '0661234567', city: 'Casablanca', address: '45 Boulevard Anfa', businessName: 'LivrExpress' });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const t = localStorage.getItem('auth_token');
      const r = await fetch('/api/livreurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.success) {
        showNotification?.('success', d.message);
        setTimeout(() => navigate('/livreurs'), 1000);
      } else {
        setErrorMsg(d.message || 'Une erreur est survenue.');
        showNotification?.('error', d.message);
      }
    } catch {
      setErrorMsg('Erreur de connexion au serveur.');
      showNotification?.('error', 'Erreur de connexion.');
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout activeMenu="livreurs_new">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Ajouter un livreur</h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Créez un compte livreur avec accès à l'application
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="kt-btn kt-btn-outline"
                onClick={handleFillTest}
                style={{ borderColor: '#e4e6ef', backgroundColor: '#f5f8fa', color: '#3f4254' }}
              >
                Remplir (Test)
              </button>
              <button type="button" className="kt-btn kt-btn-outline" onClick={() => navigate('/livreurs')}>
                Retour à la liste
              </button>
              <button
                className="kt-btn kt-btn-primary"
                form="livreur-new-form"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Création en cours...' : 'Créer le livreur'}
              </button>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="kt-container-fixed">
          {errorMsg && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm rounded-xl p-4 mb-5 flex items-center gap-3">
              <i className="ki-filled ki-information-2 text-lg" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="livreur-new-form" className="grid grid-cols-1 gap-5 lg:gap-7.5">

            {/* Info Banner Card */}
            <div className="col-span-1">
              <div className="kt-card">
                <div className="kt-card-content px-10 py-7.5 lg:pe-12.5">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 md:gap-10 p-2.5">
                    <div className="flex flex-col items-start gap-3 w-full lg:max-w-[60%]">
                      <h2 className="text-xl font-semibold text-mono">Informations</h2>
                      <div className="grid grid-cols-1 gap-2 w-full">
                        <div className="flex items-start gap-1.5 lg:pe-7.5">
                          <i className="ki-filled ki-check-circle text-base text-green-500" />
                          <span className="text-sm text-mono">Le livreur aura accès à l'application avec le rôle <strong>Livreur</strong> — il voit uniquement ses tournées et bons de livraison.</span>
                        </div>
                        <div className="flex items-start gap-1.5 lg:pe-7.5">
                          <i className="ki-filled ki-check-circle text-base text-green-500" />
                          <span className="text-sm text-mono">La <strong>ville</strong> du livreur est utilisée pour l'attribution automatique des colis par zone.</span>
                        </div>
                        <div className="flex items-start gap-1.5 lg:pe-7.5">
                          <i className="ki-filled ki-check-circle text-base text-green-500" />
                          <span className="text-sm text-mono">La <strong>commission</strong> est calculée automatiquement à 15 MAD par colis livré dans sa ville.</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 self-center lg:self-auto flex items-center justify-center">
                      <i className="ki-filled ki-delivery-3 dark:hidden text-primary" style={{ fontSize: '80px', lineHeight: '1' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Two-column form cards */}
            <div className="col-span-1">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">

                {/* Left: Informations du livreur */}
                <div className="col-span-1">
                  <div className="kt-card min-w-full">
                    <div className="kt-card-header">
                      <h3 className="kt-card-title">Informations du livreur</h3>
                    </div>
                    <div className="kt-card-table pb-3" style={{ overflow: 'visible' }}>
                      <table className="kt-table align-middle text-sm text-muted-foreground">
                        <tbody>
                          <tr>
                            <td className="py-2 min-w-36 text-secondary-foreground font-normal">Nom complet *</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input type="text" className="kt-input h-8 text-sm w-full" placeholder="Nom complet" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">Email *</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input type="email" className="kt-input h-8 text-sm w-full" placeholder="email@livrexpress.ma" value={form.email} onChange={e => set('email', e.target.value)} required />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">Mot de passe *</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input type="password" className="kt-input h-8 text-sm w-full" placeholder="Min. 6 caractères" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">Téléphone *</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input type="tel" className="kt-input h-8 text-sm w-full" placeholder="06XXXXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right: Zone d'intervention */}
                <div className="col-span-1">
                  <div className="kt-card min-w-full">
                    <div className="kt-card-header">
                      <h3 className="kt-card-title">Zone d'intervention</h3>
                    </div>
                    <div className="kt-card-table pb-3" style={{ overflow: 'visible' }}>
                      <table className="kt-table align-middle text-sm text-muted-foreground">
                        <tbody>
                          <tr>
                            <td className="py-2 min-w-36 text-secondary-foreground font-normal">Ville *</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <KtSelect
                                value={form.city}
                                onChange={(val) => set('city', val)}
                                placeholder="Choisir une ville"
                                options={cityOptions}
                                className="w-full"
                                enableSearch={true}
                                searchPlaceholder="Rechercher une ville..."
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">Adresse</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input type="text" className="kt-input h-8 text-sm w-full" placeholder="Adresse du livreur" value={form.address} onChange={e => set('address', e.target.value)} />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">Société</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input type="text" className="kt-input h-8 text-sm w-full" placeholder="Nom de la société" value={form.businessName} onChange={e => set('businessName', e.target.value)} />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </form>
        </div>

      </main>
    </DashboardLayout>
  );
}
