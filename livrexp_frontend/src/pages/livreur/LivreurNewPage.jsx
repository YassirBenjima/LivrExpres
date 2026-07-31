import React, { useState } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

const CITIES = ['Casablanca','Rabat','Marrakech','Tanger','Agadir','Fès','Meknès','Oujda','Kenitra','Tétouan'];

export default function LivreurNewPage({ navigate, showNotification }) {
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', city: '', address: '', businessName: 'LivrExpress',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Nom requis';
    if (!form.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.password || form.password.length < 6) e.password = 'Mot de passe : min 6 caractères';
    if (!form.phone.trim()) e.phone = 'Téléphone requis';
    if (!form.city) e.city = 'Ville requise';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
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
        navigate('/livreurs');
      } else {
        showNotification?.('error', d.message || 'Erreur lors de la création.');
      }
    } catch {
      showNotification?.('error', 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const fillTest = () => {
    setForm({ fullName: 'Ahmed Mansouri', email: `livreur.test.${Date.now()}@livrexpress.ma`, password: 'livreur123', phone: '0661234567', city: 'Casablanca', address: '45 Bd Anfa', businessName: 'LivrExpress' });
    setErrors({});
  };

  return (
    <DashboardLayout activeMenu="livreurs_new">
      <main className="grow pt-5 dashboard-content-shift" role="content">
        <div className="kt-container-fixed max-w-3xl">

          {/* Header */}
          <div className="flex items-center justify-between gap-5 pb-7.5">
            <div>
              <h1 className="text-xl font-medium text-mono">Nouveau Livreur</h1>
              <p className="text-sm text-secondary-foreground mt-1">Créer un compte livreur avec accès à l'application</p>
            </div>
            <div className="flex gap-2.5">
              <button className="kt-btn kt-btn-outline" onClick={() => navigate('/livreurs')}>
                <i className="ki-filled ki-left me-1" /> Retour
              </button>
              <button className="kt-btn kt-btn-outline kt-btn-warning" onClick={fillTest}>
                <i className="ki-filled ki-notepad-edit me-1" /> Remplir (Test)
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Card Infos */}
            <div className="kt-card mb-5">
              <div className="kt-card-header">
                <h3 className="kt-card-title"><i className="ki-filled ki-user me-2 text-primary" />Informations personnelles</h3>
              </div>
              <div className="kt-card-content p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Nom complet <span className="text-destructive">*</span></label>
                  <input className={`kt-input ${errors.fullName ? 'border-destructive' : ''}`} type="text" placeholder="Ex: Karim Alami" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Email <span className="text-destructive">*</span></label>
                  <input className={`kt-input ${errors.email ? 'border-destructive' : ''}`} type="email" placeholder="livreur@exemple.ma" value={form.email} onChange={e => set('email', e.target.value)} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Mot de passe <span className="text-destructive">*</span></label>
                  <input className={`kt-input ${errors.password ? 'border-destructive' : ''}`} type="password" placeholder="Min. 6 caractères" value={form.password} onChange={e => set('password', e.target.value)} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Téléphone <span className="text-destructive">*</span></label>
                  <input className={`kt-input ${errors.phone ? 'border-destructive' : ''}`} type="tel" placeholder="06XXXXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Ville <span className="text-destructive">*</span></label>
                  <select className={`kt-select ${errors.city ? 'border-destructive' : ''}`} value={form.city} onChange={e => set('city', e.target.value)}>
                    <option value="">Sélectionner une ville</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Adresse</label>
                  <input className="kt-input" type="text" placeholder="Adresse du livreur" value={form.address} onChange={e => set('address', e.target.value)} />
                </div>

              </div>
            </div>

            {/* Info box */}
            <div className="kt-card mb-5 border-info/30 bg-info/5">
              <div className="kt-card-content p-4 flex items-start gap-3">
                <i className="ki-filled ki-information-2 text-info text-xl mt-0.5" />
                <div className="text-sm text-foreground">
                  <p className="font-semibold mb-1">Compte Livreur</p>
                  <p className="text-secondary-foreground">Le livreur aura accès à l'application avec le rôle <strong>ROLE_LIVREUR</strong>. Il verra uniquement ses tournées et bons de livraison. Le mot de passe peut être modifié depuis son profil.</p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button type="button" className="kt-btn kt-btn-outline" onClick={() => navigate('/livreurs')}>Annuler</button>
              <button type="submit" className="kt-btn kt-btn-primary" disabled={loading}>
                {loading ? (<><i className="ki-filled ki-spinner animate-spin me-1" />Création...</>) : (<><i className="ki-filled ki-check me-1" />Créer le livreur</>)}
              </button>
            </div>
          </form>

        </div>
      </main>
    </DashboardLayout>
  );
}
