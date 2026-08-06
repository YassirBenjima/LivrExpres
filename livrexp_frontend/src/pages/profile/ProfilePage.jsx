import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';
import KtSelect from '../../components/ui/KtSelect';

const FIELD_KEY_MAP = {
  fullName: 'full_name',
  personalPhone: 'personal_phone',
  businessPhone: 'business_phone',
  email: 'email',
  city: 'city',
  address: 'address',
  businessName: 'business_name',
  clientType: 'client_type',
  ice: 'ice',
  rc: 'rc',
  website: 'website',
  labelMessage: 'label_message',
  packageOption: 'package_option',
  bankName: 'bank_name',
  bankRib: 'bank_rib',
  returnReception: 'return_reception',
  returnAgency: 'return_agency',
  returnPhone: 'return_phone',
  returnCity: 'return_city',
  returnNeighborhood: 'return_neighborhood'
};

export default function ProfilePage({ showNotification }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({});
  const [initialData, setInitialData] = useState({});
  const [saving, setSaving] = useState(false);
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const isDirty = Object.keys(FIELD_KEY_MAP).some(key => {
    const current = formData[key] ?? '';
    const initial = initialData[key] ?? '';
    return current !== initial;
  });

  const fetchProfile = async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
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
        const userData = data.user || {};
        setFormData(userData);
        setInitialData(userData);
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
    let ignore = false;
    const loadProfile = async () => {
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
          if (!ignore) {
            const userData = data.user || {};
            setFormData(userData);
            setInitialData(userData);
            setCities(data.cities || []);
            setMoroccanBanks(data.moroccanBanks || []);
            if (data.user) {
              sessionStorage.setItem('user_profile', JSON.stringify(data.user));
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAll = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const changedKeys = Object.keys(FIELD_KEY_MAP).filter(key => {
        const current = formData[key] ?? '';
        const initial = initialData[key] ?? '';
        return current !== initial;
      });

      let hasError = false;
      for (const key of changedKeys) {
        const fieldKey = FIELD_KEY_MAP[key];
        const val = formData[key] ?? '';
        const res = await fetch('/api/profile/field', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ field: fieldKey, value: val })
        });
        if (!res.ok) {
          hasError = true;
          const data = await res.json();
          if (showNotification) showNotification('danger', data.message || t('profile.updateError', 'Erreur lors de la mise à jour.'));
          break;
        }
      }

      if (!hasError) {
        if (showNotification) showNotification('success', t('profile.saveSuccess', 'Profil mis à jour avec succès.'));
        await fetchProfile();
      }
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      if (showNotification) showNotification('danger', t('profile.networkError', 'Une erreur réseau est survenue.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...initialData });
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
        if (showNotification) showNotification('success', data.message || t('profile.fieldUpdatedSuccess', 'Champ mis à jour avec succès.'));
        fetchProfile();
      } else {
        if (showNotification) showNotification('danger', data.message || t('profile.updateError', 'Erreur lors de la mise à jour.'));
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
        if (showNotification) showNotification('success', data.message || t('profile.avatarSuccess', 'Avatar mis à jour.'));
        fetchProfile();
      } else {
        if (showNotification) showNotification('danger', data.message || t('profile.avatarUploadError', 'Erreur téléversement avatar.'));
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
    if (e) e.preventDefault();
    setPasswordError('');

    if (!passwordState.current_password) {
      const msg = t('profile.passCurrentReq', 'Veuillez saisir votre mot de passe actuel.');
      setPasswordError(msg);
      if (showNotification) showNotification('danger', msg);
      return;
    }

    if (!passwordState.new_password || passwordState.new_password.length < 8) {
      const msg = t('profile.passMinChars', 'Le nouveau mot de passe doit comporter au moins 8 caractères.');
      setPasswordError(msg);
      if (showNotification) showNotification('danger', msg);
      return;
    }

    if (passwordState.new_password !== passwordState.confirm_password) {
      const msg = t('profile.passMismatch', 'Les nouveaux mots de passe ne correspondent pas.');
      setPasswordError(msg);
      if (showNotification) showNotification('danger', msg);
      return;
    }

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
        if (showNotification) showNotification('success', data.message || t('profile.passUpdatedSuccess', 'Mot de passe mis à jour avec succès.'));
        setPasswordState({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const errMsg = data.message || t('profile.passUpdateError', 'Erreur lors de la mise à jour du mot de passe.');
        setPasswordError(errMsg);
        if (showNotification) showNotification('danger', errMsg);
      }
    } catch (err) {
      console.error('Erreur mot de passe:', err);
      if (showNotification) showNotification('danger', t('profile.networkError', 'Une erreur réseau est survenue.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="profile">
        <main className="grow pt-5 profile-content-shift" id="content" role="content">
          <div className="kt-container-fixed py-10 text-center">
            <span className="text-secondary-foreground text-sm">{t('profile.loadingProfile', 'Chargement du profil...')}</span>
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
              <h1 className="text-xl font-medium leading-none text-mono">{t('profile.title', 'Mon Profil')}</h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                {t('profile.subtitle', 'Gérez vos informations et paramètres de compte')}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2.5">
              <div className="flex items-center gap-2.5">
                <button
                  className="kt-btn kt-btn-outline"
                  onClick={handleCancel}
                  disabled={!isDirty || saving}
                  type="button"
                >
                  {t('profile.cancelBtn', 'Annuler')}
                </button>
                <button
                  className="kt-btn kt-btn-primary"
                  onClick={handleSaveAll}
                  disabled={!isDirty || saving}
                  type="button"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin border-2 border-white border-t-transparent rounded-full size-4"></span>
                      {t('profile.savingBtn', 'Enregistrement...')}
                    </span>
                  ) : (
                    t('profile.saveBtn', 'Enregistrer')
                  )}
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
                    <h3 className="kt-card-title">{t('profile.personalInfoTitle', 'Informations Personnelles')}</h3>
                  </div>
                  <div className="kt-card-table pb-3 overflow-visible">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        
                        {/* Avatar Input */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('profile.photoLabel', 'Photo')}</td>
                          <td className="py-2 text-secondary-foreground font-normal text-sm">{t('profile.photoSpecs', 'Image JPEG, PNG 150x150px')}</td>
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
                                  title={t('profile.avatarDeleteTitle', 'Supprimer la photo')}
                                >
                                  <i className="ki-filled ki-cross"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Full Name */}
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.fullNameLabel', 'Nom complet *')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              required
                              placeholder={t('profile.fullNamePlaceholder', 'Nom complet')}
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.personalPhoneLabel', 'Numéro de téléphone personnel *')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              required
                              placeholder={t('profile.personalPhonePlaceholder', 'Téléphone personnel')}
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.emailLabel', 'Adresse email *')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="email"
                              required
                              placeholder={t('profile.emailPlaceholder', 'Adresse email')}
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.cityLabel', 'Ville *')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <KtSelect
                              value={formData.city || ''}
                              onChange={val => handleChange('city', val)}
                              placeholder={t('profile.selectCityPlaceholder', 'Choisir une ville')}
                              enableSearch={true}
                              searchPlaceholder={t('profile.searchCity', 'Rechercher une ville...')}
                              options={cities.map(c => ({ value: c, label: c }))}
                            />
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.addressLabel', 'Adresse *')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              placeholder={t('profile.noAddressDefined', 'Aucune adresse définie')}
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
                    <h3 className="kt-card-title">{t('profile.deliveryPrefsTitle', 'Préférences de Livraison')}</h3>
                  </div>
                  <div className="kt-card-table pb-3 overflow-visible">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        
                        {/* Label Message */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('profile.labelMsgLabel', 'Votre message sur étiquette')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              placeholder={t('profile.addMsgPlaceholder', 'Ajouter un message')}
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.packageLabel', 'Colis')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <KtSelect
                              value={formData.packageOption || 'Ne pas ouvrir le colis'}
                              onChange={val => handleChange('packageOption', val)}
                              enableSearch={true}
                              searchPlaceholder={t('common.search', 'Rechercher...')}
                              options={[
                                { value: 'Ne pas ouvrir le colis', label: t('profile.packageDoNotOpen', 'Ne pas ouvrir le colis') },
                                { value: 'Ouvrir le colis', label: t('profile.packageOpen', 'Ouvrir le colis') }
                              ]}
                            />
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
                    <h3 className="kt-card-title">{t('profile.passwordTitle', 'Mot de passe')}</h3>
                    <button
                      className="kt-btn kt-btn-primary"
                      onClick={handlePasswordSubmit}
                      disabled={passwordLoading}
                      type="button"
                    >
                      {passwordLoading ? t('profile.updatingPasswordBtn', 'Mise à jour...') : t('profile.updatePasswordBtn', 'Mettre à jour le mot de passe')}
                    </button>
                  </div>

                  {passwordError && (
                    <div className="mx-5 mt-3 p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-500 rounded-md flex items-center gap-2">
                      <i className="ki-solid ki-information-2 text-base"></i>
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div className="kt-card-table pb-3">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>

                        {/* Current Password */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('profile.currentPassLabel', 'Ancien mot de passe *')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <div className="relative">
                              <input
                                className="kt-input h-8 text-sm pe-8"
                                type={showCurrentPassword ? 'text' : 'password'}
                                placeholder={t('profile.currentPassPlaceholder', 'Ancien mot de passe')}
                                required
                                value={passwordState.current_password}
                                onChange={e => setPasswordState(prev => ({ ...prev, current_password: e.target.value }))}
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                              >
                                <i className={`ki-filled ${showCurrentPassword ? 'ki-eye-slash' : 'ki-eye'}`}></i>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* New Password */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('profile.newPassLabel', 'Nouveau mot de passe *')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <div className="relative">
                              <input
                                className="kt-input h-8 text-sm pe-8"
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder={t('profile.newPassPlaceholder', 'Nouveau mot de passe (min. 8 caractères)')}
                                minLength={8}
                                required
                                value={passwordState.new_password}
                                onChange={e => setPasswordState(prev => ({ ...prev, new_password: e.target.value }))}
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                              >
                                <i className={`ki-filled ${showNewPassword ? 'ki-eye-slash' : 'ki-eye'}`}></i>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Confirm Password */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('profile.confirmPassLabel', 'Re-taper le nouveau mot de passe *')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <div className="relative">
                              <input
                                className={`kt-input h-8 text-sm pe-8 ${
                                  passwordState.confirm_password.length > 0
                                    ? (passwordState.confirm_password === passwordState.new_password ? 'border-green-500 focus:border-green-500' : 'border-red-500 focus:border-red-500')
                                    : ''
                                }`}
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder={t('profile.confirmPassPlaceholder', 'Confirmer le nouveau mot de passe')}
                                minLength={8}
                                required
                                value={passwordState.confirm_password}
                                onChange={e => setPasswordState(prev => ({ ...prev, confirm_password: e.target.value }))}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                              >
                                <i className={`ki-filled ${showConfirmPassword ? 'ki-eye-slash' : 'ki-eye'}`}></i>
                              </button>
                            </div>
                            
                            {/* Visual Confirmation Match Badge */}
                            {passwordState.confirm_password.length > 0 && (
                              passwordState.confirm_password === passwordState.new_password ? (
                                <div className="flex items-center gap-1.5 text-xs text-green-500 mt-1 font-medium">
                                  <i className="ki-solid ki-check-circle text-sm"></i>
                                  <span>{t('profile.passwordsMatch', 'Les mots de passe correspondent')}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1 font-medium">
                                  <i className="ki-solid ki-cross-circle text-sm"></i>
                                  <span>{t('profile.passwordsDoNotMatch', 'Les mots de passe ne correspondent pas')}</span>
                                </div>
                              )
                            )}
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
                    <h3 className="kt-card-title">{t('profile.businessInfoTitle', "Informations de l'Entreprise")}</h3>
                  </div>
                  <div className="kt-card-table pb-3 overflow-visible">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        
                        {/* Business Name */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('profile.businessNameLabel', 'Nom du business *')}</td>
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.businessPhoneLabel', 'Numéro de téléphone du business *')}</td>
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.clientTypeLabel', 'Type de client *')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <KtSelect
                              value={formData.clientType || ''}
                              onChange={val => handleChange('clientType', val)}
                              placeholder={t('profile.selectTypePlaceholder', 'Choisir un type')}
                              enableSearch={true}
                              searchPlaceholder={t('common.search', 'Rechercher...')}
                              options={[
                                { value: 'E-commerce', label: 'E-commerce' },
                                { value: 'Auto Entrepreneur', label: 'Auto Entrepreneur' },
                                { value: 'SARL', label: 'SARL' },
                                { value: 'SARLAU', label: 'SARLAU' },
                                { value: 'Autres', label: 'Autres' }
                              ]}
                            />
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.iceLabel', 'I.C.E')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              placeholder={t('profile.notSpecified', 'Non renseigné')}
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.rcLabel', 'R.C')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              placeholder={t('profile.notSpecified', 'Non renseigné')}
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.websiteLabel', 'Web site')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <input
                              className="kt-input h-8 text-sm"
                              type="text"
                              placeholder={t('profile.notSpecified', 'Non renseigné')}
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
                    <h3 className="kt-card-title">{t('profile.bankInfoTitle', 'Informations bancaires')}</h3>
                  </div>
                  <div className="kt-card-table pb-3 overflow-visible">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        
                        {/* Bank Name */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('profile.bankNameLabel', 'Nom de la banque *')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <KtSelect
                              value={formData.bankName || ''}
                              onChange={val => handleChange('bankName', val)}
                              placeholder={t('profile.selectBankPlaceholder', 'Choisir une banque')}
                              enableSearch={true}
                              searchPlaceholder={t('profile.searchBank', 'Rechercher une banque...')}
                              options={moroccanBanks.map(b => ({ value: b, label: b }))}
                            />
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
                          <td className="py-2 text-secondary-foreground font-normal">{t('profile.bankRibLabel', 'RIB (24 Numéros) *')}</td>
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
                    <h3 className="kt-card-title">{t('profile.returnAddressTitle', 'Adresse de retour')}</h3>
                  </div>
                  <div className="kt-card-table pb-3 overflow-visible">
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        
                        {/* Reception Mode */}
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('profile.receptionModeLabel', 'Réception colis retournés')}</td>
                          <td className="py-2 text-foreground font-normal text-sm">
                            <KtSelect
                              value={returnReceptionMode}
                              onChange={val => {
                                handleChange('returnReception', val);
                                handleSaveField('return_reception', val);
                              }}
                              enableSearch={true}
                              searchPlaceholder={t('common.search', 'Rechercher...')}
                              options={[
                                { value: 'En ramassage', label: t('profile.pickupMode', 'En ramassage') },
                                { value: 'En Agence', label: t('profile.agencyMode', 'En Agence') }
                              ]}
                            />
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
                            <td className="py-2 text-secondary-foreground font-normal">{t('profile.agencyLabel', 'Agence')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <KtSelect
                                value={formData.returnAgency || ''}
                                onChange={val => handleChange('returnAgency', val)}
                                placeholder={t('profile.allAgencies', 'Toutes nos agences')}
                                enableSearch={true}
                                searchPlaceholder={t('common.search', 'Rechercher...')}
                                options={[
                                  { value: 'Agence Principale', label: t('profile.mainAgency', 'Agence Principale') },
                                  { value: 'Agence Secondaire', label: t('profile.secondaryAgency', 'Agence Secondaire') }
                                ]}
                              />
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
                              <td className="py-2 text-secondary-foreground font-normal">{t('profile.phoneLabel', 'Téléphone')}</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <input
                                  className="kt-input h-8 text-sm"
                                  type="text"
                                  placeholder={formData.businessPhone || t('profile.ourPhonePlaceholder', 'Notre téléphone')}
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
                              <td className="py-2 text-secondary-foreground font-normal">{t('profile.cityLabel', 'Ville')}</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <KtSelect
                                  value={formData.returnCity || ''}
                                  onChange={val => handleChange('returnCity', val)}
                                  placeholder={t('profile.selectCityPlaceholder', 'Choisir une ville')}
                                  enableSearch={true}
                                  searchPlaceholder={t('profile.searchCity', 'Rechercher une ville...')}
                                  options={cities.map(c => ({ value: c, label: c }))}
                                />
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
                              <td className="py-2 text-secondary-foreground font-normal">{t('profile.neighborhoodLabel', 'Quartier')}</td>
                              <td className="py-2 text-foreground font-normal text-sm">
                                <input
                                  className="kt-input h-8 text-sm"
                                  type="text"
                                  placeholder={t('profile.neighborhoodPlaceholder', 'Quartier')}
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
