import React, { useState } from 'react';
import AuthLayout from '../../components/ui/AuthLayout';
import ApiAlert from '../../components/ui/ApiAlert';
import PasswordInput from '../../components/ui/PasswordInput';
import { authService } from '../../services/api';
import '../../styles/auth.css';

export default function LoginPage({ navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
        localStorage.setItem('user', JSON.stringify(userPayload));
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        } else {
          localStorage.setItem('auth_token', 'session');
        }
        setApiSuccess('Connexion réussie ! Redirection...');
        setTimeout(() => {
          navigate(data.redirect || '/dashboard');
        }, 800);
      } else {
        setApiError(data.message || 'Identifiants invalides.');
        setIsLoading(false);
      }
    } catch (error) {
      setApiError(error.message || 'Identifiants invalides ou erreur serveur.');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      rightPaneTitle="LivrExpress Portal"
      rightPaneDesc="Votre solution complète pour la gestion logistique. Accédez à vos expéditions, suivez vos colis et optimisez vos opérations en quelques clics."
    >
      <form onSubmit={handleLoginSubmit} className="kt-card-content flex flex-col gap-5 p-10" id="sign_in_form">
        
        <div className="text-center mb-2.5">
          <h3 className="text-lg font-medium text-mono leading-none mb-2.5">Espace des clients</h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-sm text-secondary-foreground me-1.5">Pas encore de compte ?</span>
            <a 
              className="text-sm kt-link auth-link-custom cursor-pointer" 
              href="/register"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
            >
              S'inscrire
            </a>
          </div>
        </div>

        <ApiAlert type="error" message={apiError} />
        <ApiAlert type="success" message={apiSuccess} />

        <div className="flex flex-col gap-1">
          <label className="kt-form-label font-normal text-mono" htmlFor="inputUsername">Adresse email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="inputUsername" 
            className="kt-input" 
            autoComplete="username" 
            required 
            placeholder="contact@votre-entreprise.com"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <label className="kt-form-label font-normal text-mono" htmlFor="inputPassword">Mot de passe</label>
            <a 
              className="text-sm kt-link auth-link-custom shrink-0 cursor-pointer" 
              href="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                navigate('/forgot-password');
              }}
            >
              Mot de passe oublié ?
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
          <span className="kt-checkbox-label">Se souvenir de moi</span>
        </label>
        
        <button className="kt-btn kt-btn-primary flex justify-center grow" type="submit" disabled={isLoading}>
          {isLoading ? 'Connexion en cours...' : 'Connexion'}
        </button>

        <div className="flex items-center gap-2">
          <span className="border-t border-border w-full"></span>
          <span className="text-xs text-muted-foreground font-medium uppercase">Ou</span>
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
          Connexion Staff
        </a>
      </form>
    </AuthLayout>
  );
}
