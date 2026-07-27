import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function RamassageNewPage({ navigate, showNotification }) {
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    phone: '',
    supplier_phone: '',
    city: '',
    neighborhood: '',
    address: '',
    product_name: '',
    type: 'simple',
    note: '',
    has_labels: true
  });

  const headers = { 'Accept': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  useEffect(() => {
    // Populate form with stored user info if available
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setForm(prev => ({
          ...prev,
          city: u.city || '',
          address: u.address || '',
          phone: u.phone || ''
        }));
      }
    } catch (e) {}

    // Fetch cities
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await fetch('/api/cities');
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json.cities || []);
          setCities(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.phone) {
      if (showNotification) showNotification('error', 'Le numéro de téléphone est obligatoire.');
      return;
    }
    if (!form.city) {
      if (showNotification) showNotification('error', 'La ville est obligatoire.');
      return;
    }
    if (!form.neighborhood) {
      if (showNotification) showNotification('error', 'Le quartier est obligatoire.');
      return;
    }
    if (!form.address) {
      if (showNotification) showNotification('error', 'L’adresse est obligatoire.');
      return;
    }
    if (!form.product_name) {
      if (showNotification) showNotification('error', 'La nature du produit est obligatoire.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/ramassage/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const data = await res.json();
        if (showNotification) showNotification('success', data.message || 'Demande de ramassage créée avec succès.');
        navigate('/ramassage');
      } else {
        let msg = 'Erreur lors de la création de la demande.';
        try {
          const errData = await res.json();
          if (errData.message) msg = errData.message;
        } catch (err) {}
        if (showNotification) showNotification('error', msg);
      }
    } catch (err) {
      console.error(err);
      if (showNotification) showNotification('error', 'Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout activeMenu="ramassage_new">
      <main className="grow pt-5 profile-content-shift" id="content" role="content">
        
        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                Nouvelle demande de ramassage
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Remplissez les informations pour planifier un ramassage
              </div>
            </div>
            <div className="flex flex-col items-end gap-2.5">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="kt-btn kt-btn-outline"
                  onClick={() => navigate('/ramassage')}
                >
                  Retour à la liste
                </button>
                <button
                  type="submit"
                  form="ramassage-new-form"
                  className="kt-btn kt-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Envoi...' : 'Soumettre la demande'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Form Cards */}
        <div className="kt-container-fixed">
          <div className="grid grid-cols-1 gap-5 lg:gap-7.5">
            <div className="col-span-1">
              <form id="ramassage-new-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
                  
                  {/* Card 1: Informations du ramassage */}
                  <div className="col-span-1">
                    <div className="kt-card min-w-full">
                      <div className="kt-card-header">
                        <h3 className="kt-card-title">Informations du ramassage</h3>
                      </div>
                      <div className="kt-card-table pb-3" style={{ overflow: 'visible' }}>
                        <table className="kt-table align-middle text-sm text-muted-foreground">
                          <tbody>
                            <tr>
                              <td className="py-2 min-w-36 text-secondary-foreground font-normal">Téléphone *</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <input
                                  className="kt-input h-8 text-sm w-full"
                                  type="text"
                                  placeholder="Numéro de téléphone"
                                  value={form.phone}
                                  onChange={e => handleChange('phone', e.target.value)}
                                  required
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">Téléphone fournisseur</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <input
                                  className="kt-input h-8 text-sm w-full"
                                  type="text"
                                  placeholder="Téléphone du fournisseur (optionnel)"
                                  value={form.supplier_phone}
                                  onChange={e => handleChange('supplier_phone', e.target.value)}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">Ville *</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <KtSelect
                                  value={form.city}
                                  onChange={val => handleChange('city', val)}
                                  placeholder={loadingCities ? 'Chargement...' : 'Choisir une ville'}
                                  enableSearch={true}
                                  searchPlaceholder="Rechercher une ville..."
                                  options={cities.map(c => {
                                    const val = typeof c === 'object' && c !== null ? (c.name || c.label || c.value || '') : c;
                                    return { value: val, label: val };
                                  })}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">Quartier *</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <input
                                  className="kt-input h-8 text-sm w-full"
                                  type="text"
                                  placeholder="Quartier"
                                  value={form.neighborhood}
                                  onChange={e => handleChange('neighborhood', e.target.value)}
                                  required
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">Adresse *</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <input
                                  className="kt-input h-8 text-sm w-full"
                                  type="text"
                                  placeholder="Adresse complète"
                                  value={form.address}
                                  onChange={e => handleChange('address', e.target.value)}
                                  required
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Informations complémentaires */}
                  <div className="col-span-1">
                    <div className="kt-card min-w-full">
                      <div className="kt-card-header">
                        <h3 className="kt-card-title">Informations complémentaires</h3>
                      </div>
                      <div className="kt-card-table pb-3" style={{ overflow: 'visible' }}>
                        <table className="kt-table align-middle text-sm text-muted-foreground">
                          <tbody>
                            <tr>
                              <td className="py-2 min-w-36 text-secondary-foreground font-normal">Nature du produit *</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <input
                                  className="kt-input h-8 text-sm w-full"
                                  type="text"
                                  placeholder="Description du produit à ramasser"
                                  value={form.product_name}
                                  onChange={e => handleChange('product_name', e.target.value)}
                                  required
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">Type</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <KtSelect
                                  value={form.type}
                                  onChange={val => handleChange('type', val)}
                                  placeholder="Choisir un type"
                                  options={[
                                    { value: 'simple', label: 'Simple' },
                                    { value: 'stock', label: 'Stock' }
                                  ]}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">Note</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <input
                                  className="kt-input h-8 text-sm w-full"
                                  type="text"
                                  placeholder="Instructions spéciales (optionnel)"
                                  value={form.note}
                                  onChange={e => handleChange('note', e.target.value)}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">Étiquettes</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <div className="flex items-center gap-2.5">
                                  <input
                                    className="kt-switch kt-switch-sm"
                                    type="checkbox"
                                    checked={form.has_labels}
                                    onChange={e => handleChange('has_labels', e.target.checked)}
                                  />
                                  <span className="text-xs text-secondary-foreground">J'ai les étiquettes</span>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              </form>
            </div>
          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
