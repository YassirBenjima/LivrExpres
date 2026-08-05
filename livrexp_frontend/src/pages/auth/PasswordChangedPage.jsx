import AuthLayout from '../../components/ui/AuthLayout';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/auth.css';

export default function PasswordChangedPage({ navigate }) {
  const { t } = useLanguage();
  return (
    <AuthLayout
      docTitle={t('auth.pageTitlePasswordChanged', 'Mot de Passe Modifié - LivrExpress')}
      cardMaxWidthClass="max-w-[440px]"
    >
      <div className="kt-card-content p-10">
        <div className="flex justify-center mb-3">
          <img className="h-10 w-auto" src="/assets/media/app/mini-logo.svg" alt="LivrExpress Logo" />
        </div>
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
          {t('auth.passwordChangedTitle', 'Mot de passe modifié !')}
        </h3>
        
        <div className="text-sm text-center text-secondary-foreground mb-7.5">
          {t('auth.passwordChangedDesc', 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.')}
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
            {t('auth.goToLoginBtn', 'Se connecter')}
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}
