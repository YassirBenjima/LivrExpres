import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function ProfilePage({ navigate, showNotification }) {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [cities, setCities] = useState([]);
  const [moroccanBanks, setMoroccanBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);

  // Password state
  const [passwordState, setPasswordState] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/profile', {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setFormData(data.user);
        setCities(data.cities || []);
        setMoroccanBanks(data.moroccanBanks || []);
        if (data.user) {
          sessionStorage.setItem('user_profile', JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveField = async (fieldKey, valueToSave) => {
    setSavingField(fieldKey);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/profile/field', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ field: fieldKey, value: valueToSave ?? '' })
      });
      const data = await res.json();
      if (res.ok) {
        if (showNotification) showNotification('success', data.message || 'Champ mis à jour avec succès.');
        fetchProfile();
      } else {
        if (showNotification) showNotification('danger', data.message || 'Erreur lors de la mise à jour.');
      }
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
    } finally {
      setSavingField(null);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('avatar', file);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: fd
      });
      const data = await res.json();
      if (res.ok) {
        if (showNotification) showNotification('success', data.message);
        fetchProfile();
      } else {
        if (showNotification) showNotification('danger', data.message || 'Erreur téléversement avatar.');
      }
    } catch (err) {
      console.error('Erreur avatar:', err);
    }
  };

  const handleRemoveAvatar = async () => {
    const fd = new FormData();
    fd.append('avatar_remove', '1');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: fd
      });
      const data = await res.json();
      if (res.ok) {
        if (showNotification) showNotification('success', data.message);
        fetchProfile();
      }
    } catch (err) {
      console.error('Erreur annulation avatar:', err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(passwordState)
      });
      const data = await res.json();
      if (res.ok) {
        if (showNotification) showNotification('success', data.message);
        setPasswordState({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        if (showNotification) showNotification('danger', data.message || 'Erreur mot de passe.');
      }
    } catch (err) {
      console.error('Erreur mot de passe:', err);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="profile">
        <main className="grow pt-5 profile-content-shift" id="content" role="content">
          <div className="kt-container-fixed py-10 text-center">
            <span className="text-secondary-foreground text-sm">Chargement du profil...</span>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const initials = formData.fullName
    ? formData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const returnReceptionMode = formData.returnReception || 'En Agence';

  return (
    <DashboardLayout activeMenu="profile">
      <main className="grow pt-5 profile-content-shift" id="content" role="content">


        {/* Header Title */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Mon Profil</h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Gérez vos informations et paramètres de compte
              </div>
            </div>
            <div className="flex flex-col items-end gap-2.5">
              <div className="flex items-center gap-2.5">
                <button className="kt-btn kt-btn-outline" onClick={fetchProfile} type="button">
                  Cancel
                </button>
                <button className="kt-btn kt-btn-primary" onClick={fetchProfile} type="button">
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="kt-container-fixed">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">

            {/* Left Column */}
            <div className="col-span-1">
              <div className="grid gap-5 lg:gap-7.5">

                {/* 1. Personal Info Card */}
                <div className="kt-card min-w-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">Informations Personnelles</h3>
                  </div>
                  <div className="kt-card-table pb-3 overflow-visible">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        
                        {/* Avatar Input */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">Photo</td>
                          <td className="py-2 text-secondary-foreground font-normal text-sm">Image JPEG, PNG 150x150px</td>
                          <td className="py-2 text-center">
                            <div className="relative inline-block">
                              <label className="cursor-pointer inline-flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary font-bold text-lg overflow-hidden border-2 border-input hover:border-primary transition-colors">
                                {formData.avatarUrl ? (
                                  <img src={formData.avatarUrl} alt="Avatar" className="size-full object-cover" />
                                ) : (
                                  <div className="inline-flex items-center justify-center text-white font-semibold text-lg size-full" style={{ backgroundColor: '#007bff' }}>
                                    <span>{initials}</span>
                                  </div>
                                )}
                                <input type="file" accept=".png, .jpg, .jpeg" className="hidden" onChange={handleAvatarUpload} />
                              </label>
                              {formData.avatarUrl && (
                                <button
                                  type="button"
                                  onClick={handleRemoveAvatar}
                                  className="absolute -top-1 -right-1 bg-danger text-white rounded-full size-5 flex items-center justify-center text-xs shadow"
                                  title="Supprimer la photo"
                                >
                                  <i className="ki-filled ki-cross"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Full Name */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">Nom complet *</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              required
                              value={formData.fullName || ''}
                              onChange={e => handleChange('fullName', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('full_name', formData.fullName)}
                              disabled={savingField === 'full_name'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* Personal Phone */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">Numéro de téléphone personnel *</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              required
                              value={formData.personalPhone || ''}
                              onChange={e => handleChange('personalPhone', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('personal_phone', formData.personalPhone)}
                              disabled={savingField === 'personal_phone'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* Email */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">Adresse email *</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="email"
                              required
                              value={formData.email || ''}
                              onChange={e => handleChange('email', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('email', formData.email)}
                              disabled={savingField === 'email'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* City */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">Ville *</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <select
                              className="kt-select text-sm h-8"
                              value={formData.city || ''}
                              onChange={e => handleChange('city', e.target.value)}
                            >
                              <option value="" disabled>Choisir une ville</option>
                              {cities.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('city', formData.city)}
                              disabled={savingField === 'city'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* Address */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">Adresse *</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              placeholder="Aucune adresse definie"
                              value={formData.address || ''}
                              onChange={e => handleChange('address', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('address', formData.address)}
                              disabled={savingField === 'address'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Delivery Preferences Card */}
                <div className="kt-card min-w-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">Préférences de Livraison</h3>
                  </div>
                  <div className="kt-card-table pb-3 overflow-visible">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        
                        {/* Label Message */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">Votre message sur étiquette</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              placeholder="Ajouter un message"
                              value={formData.labelMessage || ''}
                              onChange={e => handleChange('labelMessage', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('label_message', formData.labelMessage)}
                              disabled={savingField === 'label_message'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* Package Option */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">Colis</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <select
                              className="kt-select text-sm h-8"
                              value={formData.packageOption || 'Ne pas ouvrir le colis'}
                              onChange={e => handleChange('packageOption', e.target.value)}
                            >
                              <option value="Ne pas ouvrir le colis">Ne pas ouvrir le colis</option>
                              <option value="Ouvrir le colis">Ouvrir le colis</option>
                            </select>
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('package_option', formData.packageOption)}
                              disabled={savingField === 'package_option'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Password Card */}
                <div className="kt-card min-w-full">
                  <div className="kt-card-header flex items-center justify-between">
                    <h3 className="kt-card-title">Mot de passe</h3>
                    <button
                      className="kt-btn kt-btn-primary"
                      onClick={handlePasswordSubmit}
                      disabled={passwordLoading}
                      type="button"
                    >
                      Mettre a jour le mot de passe
                    </button>
                  </div>
                  <div className="kt-card-table pb-3">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">Ancien mot de passe</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="password"
                              placeholder="Ancien mot de passe"
                              required
                              value={passwordState.current_password}
                              onChange={e => setPasswordState(prev => ({ ...prev, current_password: e.target.value }))}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">Nouveau mot de passe</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="password"
                              placeholder="Nouveau mot de passe"
                              minLength={8}
                              required
                              value={passwordState.new_password}
                              onChange={e => setPasswordState(prev => ({ ...prev, new_password: e.target.value }))}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">Re-taper le nouveau mot de passe</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="password"
                              placeholder="Re-taper le nouveau mot de passe"
                              minLength={8}
                              required
                              value={passwordState.confirm_password}
                              onChange={e => setPasswordState(prev => ({ ...prev, confirm_password: e.target.value }))}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-1">
              <div className="grid gap-5 lg:gap-7.5">

                {/* 4. Business Info Card */}
                <div className="kt-card min-w-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">Informations de l'Entreprise</h3>
                  </div>
                  <div className="kt-card-table pb-3 overflow-visible">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        
                        {/* Business Name */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">Nom du business *</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              required
                              value={formData.businessName || ''}
                              onChange={e => handleChange('businessName', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('business_name', formData.businessName)}
                              disabled={savingField === 'business_name'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* Business Phone */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">Numéro de téléphone du business *</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              required
                              value={formData.businessPhone || ''}
                              onChange={e => handleChange('businessPhone', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('business_phone', formData.businessPhone)}
                              disabled={savingField === 'business_phone'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* Client Type */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">Type de client *</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <select
                              className="kt-select text-sm h-8"
                              value={formData.clientType || ''}
                              onChange={e => handleChange('clientType', e.target.value)}
                            >
                              <option value="" disabled>Choisir un type</option>
                              <option value="E-commerce">E-commerce</option>
                              <option value="Auto Entrepreneur">Auto Entrepreneur</option>
                              <option value="SARL">SARL</option>
                              <option value="SARLAU">SARLAU</option>
                              <option value="Autres">Autres</option>
                            </select>
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('client_type', formData.clientType)}
                              disabled={savingField === 'client_type'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* ICE */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">I.C.E</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              placeholder="Non renseigné"
                              value={formData.ice || ''}
                              onChange={e => handleChange('ice', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('ice', formData.ice)}
                              disabled={savingField === 'ice'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* RC */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">R.C</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              placeholder="Non renseigné"
                              value={formData.rc || ''}
                              onChange={e => handleChange('rc', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('rc', formData.rc)}
                              disabled={savingField === 'rc'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* Website */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">Web site</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              placeholder="Non renseigné"
                              value={formData.website || ''}
                              onChange={e => handleChange('website', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('website', formData.website)}
                              disabled={savingField === 'website'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Bank Info Card */}
                <div className="kt-card min-w-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">Informations bancaires</h3>
                  </div>
                  <div className="kt-card-table pb-3 overflow-visible">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        
                        {/* Bank Name */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">Nom du banque *</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <select
                              className="kt-select text-sm h-8"
                              value={formData.bankName || ''}
                              onChange={e => handleChange('bankName', e.target.value)}
                            >
                              <option value="" disabled>Choisir une banque</option>
                              {moroccanBanks.map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('bank_name', formData.bankName)}
                              disabled={savingField === 'bank_name'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* Bank RIB */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">RIB (24 Numéro) *</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              maxLength={24}
                              pattern="\d{24}"
                              value={formData.bankRib || ''}
                              onChange={e => handleChange('bankRib', e.target.value)}
                            />
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('bank_rib', formData.bankRib)}
                              disabled={savingField === 'bank_rib'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 6. Return Address Card */}
                <div className="kt-card min-w-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">Adresse de retour</h3>
                  </div>
                  <div className="kt-card-table pb-3 overflow-visible">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        
                        {/* Reception Mode */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">Réception colis retournés</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <select
                              className="kt-select text-sm h-8"
                              value={returnReceptionMode}
                              onChange={e => {
                                handleChange('returnReception', e.target.value);
                                handleSaveField('return_reception', e.target.value);
                              }}
                            >
                              <option value="En ramassage">En ramassage</option>
                              <option value="En Agence">En Agence</option>
                            </select>
                          </td>
                          <td className="py-2 text-center">
                            <button
                              className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                              onClick={() => handleSaveField('return_reception', formData.returnReception)}
                              disabled={savingField === 'return_reception'}
                            >
                              <i className="ki-filled ki-check"></i>
                            </button>
                          </td>
                        </tr>

                        {/* Agency Dropdown (if En Agence) */}
                        {returnReceptionMode === 'En Agence' && (
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">Agence</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <select
                                className="kt-select text-sm h-8"
                                value={formData.returnAgency || ''}
                                onChange={e => handleChange('returnAgency', e.target.value)}
                              >
                                <option value="" disabled>Toutes nos agences</option>
                                <option value="Agence Principale">Agence Principale</option>
                                <option value="Agence Secondaire">Agence Secondaire</option>
                              </select>
                            </td>
                            <td className="py-2 text-center">
                              <button
                                className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                                onClick={() => handleSaveField('return_agency', formData.returnAgency)}
                                disabled={savingField === 'return_agency'}
                              >
                                <i className="ki-filled ki-check"></i>
                              </button>
                            </td>
                          </tr>
                        )}

                        {/* Ramassage Fields (if En ramassage) */}
                        {returnReceptionMode === 'En ramassage' && (
                          <>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">Téléphone</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <input
                                  className="kt-input h-8 text-sm"
                                  type="text"
                                  placeholder={formData.businessPhone || 'Notre téléphone'}
                                  value={formData.returnPhone || ''}
                                  onChange={e => handleChange('returnPhone', e.target.value)}
                                />
                              </td>
                              <td className="py-2 text-center">
                                <button
                                  className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                                  onClick={() => handleSaveField('return_phone', formData.returnPhone)}
                                  disabled={savingField === 'return_phone'}
                                >
                                  <i className="ki-filled ki-check"></i>
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">Ville</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <select
                                  className="kt-select text-sm h-8"
                                  value={formData.returnCity || ''}
                                  onChange={e => handleChange('returnCity', e.target.value)}
                                >
                                  <option value="" disabled>Choisir une ville</option>
                                  {cities.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 text-center">
                                <button
                                  className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                                  onClick={() => handleSaveField('return_city', formData.returnCity)}
                                  disabled={savingField === 'return_city'}
                                >
                                  <i className="ki-filled ki-check"></i>
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">Quartier</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <input
                                  className="kt-input h-8 text-sm"
                                  type="text"
                                  placeholder="Quartier"
                                  value={formData.returnNeighborhood || ''}
                                  onChange={e => handleChange('returnNeighborhood', e.target.value)}
                                />
                              </td>
                              <td className="py-2 text-center">
                                <button
                                  className="kt-btn kt-btn-icon kt-btn-sm kt-btn-ghost kt-btn-primary"
                                  onClick={() => handleSaveField('return_neighborhood', formData.returnNeighborhood)}
                                  disabled={savingField === 'return_neighborhood'}
                                >
                                  <i className="ki-filled ki-check"></i>
                                </button>
                              </td>
                            </tr>
                          </>
                        )}

                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
