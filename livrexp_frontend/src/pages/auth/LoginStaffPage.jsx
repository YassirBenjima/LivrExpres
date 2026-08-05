import React, { useState } from 'react';
import AuthLayout from '../../components/ui/AuthLayout';
import ApiAlert from '../../components/ui/ApiAlert';
import PasswordInput from '../../components/ui/PasswordInput';
import { authService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/auth.css';

export default function LoginStaffPage({ navigate }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState(localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('remembered_email'));
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  const validateForm = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = t('auth.emailReq', "L'adresse email est requise");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = t('auth.emailInvalid', "Veuillez entrer une adresse email valide");
    }
    if (!password) {
      tempErrors.password = t('auth.passwordReq', "Le mot de passe est requis");
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const data = await authService.login(email, password, rememberMe);
      
      if (data.success || data.user) {
        const userPayload = data.user || {};
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
          localStorage.setItem('user', JSON.stringify(userPayload));
          sessionStorage.removeItem('user');
        } else {
          localStorage.removeItem('remembered_email');
          sessionStorage.setItem('user', JSON.stringify(userPayload));
          localStorage.removeItem('user');
        }
        sessionStorage.removeItem('user_profile');
        localStorage.removeItem('auth_token');
        setApiSuccess(t('auth.loginSuccess', 'Authentification Staff réussie ! Redirection...'));
        setTimeout(() => {
          if (userPayload.roles?.includes('ROLE_LIVREUR')) {
            navigate('/bon-livraison');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } else {
        setApiError(data.message || t('auth.invalidCredentials', 'Identifiants Staff invalides.'));
        setIsLoading(false);
      }
    } catch (error) {
      setApiError(error.message || t('auth.serverError', 'Identifiants Staff invalides ou erreur serveur.'));
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      docTitle={t('auth.pageTitleStaffLogin', 'Connexion Staff - LivrExpress')}
      rightPaneTitle={t('auth.staffPortalTitle', 'LivrExpress Admin Portal')}
      rightPaneDesc={t('auth.staffPortalDesc', 'Interface d\'administration LivrExpress. Gérez les livraisons, supervisez les opérations et assurez la qualité de service au quotidien.')}
    >
      <form onSubmit={handleLoginSubmit} className="kt-card-content flex flex-col gap-5 p-10" id="staff_sign_in_form">
        
        <div className="text-center mb-2.5">
          <div className="flex justify-center mb-4">
            <img className="h-10 w-auto" src="/assets/media/app/mini-logo.svg" alt="LivrExpress Logo" />
          </div>
          <h3 className="text-lg font-medium text-mono leading-none mb-2.5">{t('auth.staffSpace', 'Espace Administrateur & Staff')}</h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-sm text-secondary-foreground me-1.5">{t('auth.staffSpaceDesc', 'Accès réservé aux administrateurs')}</span>
          </div>
        </div>

        <ApiAlert type="error" message={apiError} />
        <ApiAlert type="success" message={apiSuccess} />

        <div className="flex flex-col gap-1">
          <label className="kt-form-label font-normal text-mono" htmlFor="inputEmail">{t('auth.emailAddress', 'Adresse email')}</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
            }}
            id="inputEmail" 
            className="kt-input" 
            autoComplete="email" 
            required 
            placeholder={t('auth.staffUsernamePlaceholder', 'admin ou livreur@livrexpress.ma')}
            disabled={isLoading}
          />
          {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email}</span>}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <label className="kt-form-label font-normal text-mono" htmlFor="inputPassword">{t('auth.password', 'Mot de passe')}</label>
          </div>
          
          <PasswordInput
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
            }}
            id="inputPassword"
            autoComplete="current-password"
            disabled={isLoading}
          />
          {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password}</span>}
        </div>

        <label className="kt-label flex items-center gap-2 cursor-pointer select-none">
          <input 
            className="kt-checkbox kt-checkbox-sm" 
            type="checkbox" 
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <span className="kt-checkbox-label">{t('auth.rememberMe', 'Se souvenir de moi')}</span>
        </label>
        
        <button className="kt-btn kt-btn-primary flex justify-center grow" type="submit" disabled={isLoading}>
          {isLoading ? t('auth.signingInBtn', 'Connexion en cours...') : t('auth.signInBtn', 'Connexion')}
        </button>

        <div className="flex items-center gap-2">
          <span className="border-t border-border w-full"></span>
          <span className="text-xs text-muted-foreground font-medium uppercase">{t('auth.or', 'Ou')}</span>
          <span className="border-t border-border w-full"></span>
        </div>

        <a 
          className="kt-btn kt-btn-outline justify-center cursor-pointer" 
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}
        >
          {t('auth.clientSpaceBtn', 'Espace Client')}
        </a>

      </form>
    </AuthLayout>
  );
}
