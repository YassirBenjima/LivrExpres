import { useState } from 'react';
import AuthLayout from '../../components/ui/AuthLayout';
import ApiAlert from '../../components/ui/ApiAlert';
import PasswordInput from '../../components/ui/PasswordInput';
import { authService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/auth.css';

export default function LoginPage({ navigate }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState(localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('remembered_email'));
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');
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
        setApiSuccess(t('auth.loginSuccess', 'Connexion réussie ! Redirection...'));
        setTimeout(() => {
          navigate(data.redirect || '/dashboard');
        }, 800);
      } else {
        setApiError(data.message || t('auth.invalidCredentials', 'Identifiants invalides.'));
        setIsLoading(false);
      }
    } catch (error) {
      setApiError(error.message || t('auth.serverError', 'Identifiants invalides ou erreur serveur.'));
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      docTitle={t('auth.pageTitleLogin', 'Connexion - LivrExpress')}
      rightPaneTitle={t('auth.portalTitle', 'LivrExpress Portal')}
      rightPaneDesc={t('auth.portalDesc', 'Votre solution complète pour la gestion logistique. Accédez à vos expéditions, suivez vos colis et optimisez vos opérations en quelques clics.')}
    >
      <form onSubmit={handleLoginSubmit} className="kt-card-content flex flex-col gap-5 p-10" id="sign_in_form">
        
        <div className="text-center mb-2.5">
          <div className="flex justify-center mb-4">
            <img className="h-10 w-auto" src="/assets/media/app/mini-logo.svg" alt="LivrExpress Logo" />
          </div>
          <h3 className="text-lg font-medium text-mono leading-none mb-2.5">{t('auth.clientSpace', 'Espace des clients')}</h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-sm text-secondary-foreground me-1.5">{t('auth.noAccountYet', 'Pas encore de compte ?')}</span>
            <a 
              className="text-sm kt-link auth-link-custom cursor-pointer" 
              href="/register"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
            >
              {t('auth.signUp', "S'inscrire")}
            </a>
          </div>
        </div>

        <ApiAlert type="error" message={apiError} />
        <ApiAlert type="success" message={apiSuccess} />

        <div className="flex flex-col gap-1">
          <label className="kt-form-label font-normal text-mono" htmlFor="inputUsername">{t('auth.emailAddress', 'Adresse email')}</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="inputUsername" 
            className="kt-input" 
            autoComplete="username" 
            required 
            placeholder={t('auth.emailPlaceholder', 'contact@votre-entreprise.com')}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <label className="kt-form-label font-normal text-mono" htmlFor="inputPassword">{t('auth.password', 'Mot de passe')}</label>
            <a 
              className="text-sm kt-link auth-link-custom shrink-0 cursor-pointer" 
              href="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                navigate('/forgot-password');
              }}
            >
              {t('auth.forgotPassword', 'Mot de passe oublié ?')}
            </a>
          </div>
          
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            id="inputPassword"
            autoComplete="current-password"
            disabled={isLoading}
          />
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
          href="/login-staff"
          onClick={(e) => {
            e.preventDefault();
            navigate('/login-staff');
          }}
        >
          {t('auth.staffSignInBtn', 'Connexion Staff')}
        </a>

      </form>
    </AuthLayout>
  );
}
