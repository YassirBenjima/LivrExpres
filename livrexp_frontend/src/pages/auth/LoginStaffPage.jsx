import React, { useState } from 'react';
import AuthLayout from '../../components/ui/AuthLayout';
import ApiAlert from '../../components/ui/ApiAlert';
import PasswordInput from '../../components/ui/PasswordInput';
import { authService } from '../../services/api';
import '../../styles/auth.css';

export default function LoginStaffPage({ navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  const validateForm = () => {
    const tempErrors = {};
    if (!email) {
      tempErrors.email = "L'adresse email est requise";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Veuillez entrer une adresse email valide";
    }
    if (!password) {
      tempErrors.password = "Le mot de passe est requis";
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
        localStorage.setItem('user', JSON.stringify(userPayload));
        localStorage.removeItem('auth_token'); // Sensitive tokens are handled via HttpOnly cookie for XSS protection
        setApiSuccess('Authentification Staff réussie ! Redirection...');
        setTimeout(() => {
          if (userPayload.roles?.includes('ROLE_LIVREUR')) {
            navigate('/bon-livraison');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } else {
        setApiError(data.message || 'Identifiants Staff invalides.');
        setIsLoading(false);
      }
    } catch (error) {
      setApiError(error.message || 'Identifiants Staff invalides ou erreur serveur.');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      rightPaneTitle="Staff Control Center"
      rightPaneDesc="Interface d'administration LivrExpress. Gérez les livraisons, supervisez les opérations et assurez la qualité de service au quotidien."
    >
      <form onSubmit={handleLoginSubmit} className="kt-card-content flex flex-col gap-5 p-10" id="staff_sign_in_form">
        
        <div className="text-center mb-2.5">
          <h3 className="text-lg font-medium text-mono leading-none mb-2.5">Espace Staff 👋</h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-sm text-secondary-foreground me-1.5">Accès réservé aux administrateurs</span>
          </div>
        </div>

        <ApiAlert type="error" message={apiError} />
        <ApiAlert type="success" message={apiSuccess} />

        <div className="flex flex-col gap-1">
          <label className="kt-form-label font-normal text-mono" htmlFor="inputEmail">Adresse email</label>
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
            placeholder="email@email.com"
            disabled={isLoading}
          />
          {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email}</span>}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <label className="kt-form-label font-normal text-mono" htmlFor="inputPassword">Mot de passe</label>
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
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}
        >
          Connexion Client
        </a>
      </form>
    </AuthLayout>
  );
}
