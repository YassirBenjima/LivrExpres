import React from 'react';
import AuthLayout from '../../components/ui/AuthLayout';
import '../../styles/auth.css';

export default function PasswordChangedPage({ navigate }) {
  return (
    <AuthLayout cardMaxWidthClass="max-w-[440px]">
      <div className="kt-card-content p-10">
        <div className="flex justify-center mb-5">
          <img 
            alt="password changed illustration" 
            className="dark:hidden max-h-[180px]" 
            src="https://keenthemes.com/metronic/tailwind/dist/assets/media/illustrations/32.svg"
          />
          <img 
            alt="password changed illustration dark" 
            className="hidden dark:block max-h-[180px]" 
            src="https://keenthemes.com/metronic/tailwind/dist/assets/media/illustrations/32-dark.svg"
          />
        </div>
        
        <h3 className="text-lg font-medium text-mono text-center mb-4">
          Votre mot de passe est modifié
        </h3>
        
        <div className="text-sm text-center text-secondary-foreground mb-7.5">
          Votre mot de passe a été mis à jour avec succès. 
          <br/>
          La sécurité de votre compte est notre priorité.
        </div>

        <div className="flex justify-center">
          <a 
            className="kt-btn kt-btn-primary cursor-pointer"
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
          >
            Se connecter
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}
