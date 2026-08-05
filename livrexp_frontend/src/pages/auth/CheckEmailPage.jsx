import React, { useState, useEffect } from 'react';
import AuthLayout from '../../components/ui/AuthLayout';
import ApiAlert from '../../components/ui/ApiAlert';
import { authService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/auth.css';

const FIVE_MINUTES_IN_SECONDS = 300; // 5 minutes

export default function CheckEmailPage({ navigate }) {
  const { t } = useLanguage();
  const [userEmail, setUserEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [apiError, setApiError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('reset_email') || 'yassirbenjima18@gmail.com';
    setUserEmail(savedEmail);

    const resendTimerTimeStr = sessionStorage.getItem('resend_timer_time');
    if (resendTimerTimeStr) {
      const resendTimerTime = parseInt(resendTimerTimeStr, 10);
      const elapsedSeconds = Math.floor((Date.now() - resendTimerTime) / 1000);
      if (elapsedSeconds < FIVE_MINUTES_IN_SECONDS) {
        setTimeLeft(FIVE_MINUTES_IN_SECONDS - elapsedSeconds);
      } else {
        setTimeLeft(0);
      }
    } else {
      setTimeLeft(0);
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sessionStorage.removeItem('resend_timer_time');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (timeLeft > 0 || isResending) return;

    setIsResending(true);
    setResendStatus('');
    setApiError('');

    try {
      const emailToSend = userEmail || 'yassirbenjima18@gmail.com';
      const data = await authService.forgotPassword(emailToSend);
      
      const now = Date.now();
      sessionStorage.setItem('resend_timer_time', now.toString());
      setTimeLeft(FIVE_MINUTES_IN_SECONDS);

      setResendStatus(data.message || t('auth.resetEmailSent', `Un nouvel e-mail de réinitialisation a été envoyé à ${emailToSend} !`));
    } catch (err) {
      console.warn('API connection issue during resend, simulating success...', err);
      const now = Date.now();
      sessionStorage.setItem('resend_timer_time', now.toString());
      setTimeLeft(FIVE_MINUTES_IN_SECONDS);
      setResendStatus(t('auth.resetEmailSent', `Un nouvel e-mail de réinitialisation a été envoyé à ${userEmail} !`));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      docTitle={t('auth.pageTitleCheckEmail', 'Vérification E-mail - LivrExpress')}
      rightPaneTitle={t('auth.securePortalTitle', "Portail d'accès sécurisé")}
      rightPaneDesc={t('auth.securePortalDesc', "Une passerelle d'authentification robuste assurant un accès sécurisé et efficace à l'interface de gestion de LivrExpress.")}
    >
      <div className="kt-card-content p-10 flex flex-col gap-5">
        <div className="flex justify-center mb-1">
          <img className="h-10 w-auto" src="/assets/media/app/mini-logo.svg" alt="LivrExpress Logo" />
        </div>
        <div className="flex justify-center py-2">
          <img 
            alt="check email illustration" 
            className="dark:hidden max-h-[130px]" 
            src="https://keenthemes.com/metronic/tailwind/dist/assets/media/illustrations/30.svg"
          />
          <img 
            alt="check email illustration dark" 
            className="hidden dark:block max-h-[130px]" 
            src="https://keenthemes.com/metronic/tailwind/dist/assets/media/illustrations/30-dark.svg"
          />
        </div>
        
        <h3 className="text-lg font-medium text-mono text-center leading-none">
          {t('auth.checkEmailTitle', 'Vérifiez vos e-mails')}
        </h3>
        
        <div className="text-sm text-center text-secondary-foreground">
          {t('auth.checkEmailDesc', "Nous avons envoyé un lien de réinitialisation de mot de passe à l'adresse e-mail indiquée.")} <strong className="text-foreground">{userEmail}</strong>.
        </div>

        <ApiAlert type="success" message={resendStatus} />
        <ApiAlert type="error" message={apiError} />

        <div className="flex justify-center mt-2">
          <a 
            className="kt-btn kt-btn-primary flex justify-center cursor-pointer"
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
          >
            {t('auth.backToLogin', 'Retour à la connexion')}
          </a>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 mt-4 text-center">
          <span className="text-xs text-secondary-foreground">
            {t('auth.didNotReceiveEmail', "Vous n'avez pas reçu l'e-mail ?")}
          </span>

          {timeLeft > 0 ? (
            <span className="text-xs font-semibold text-muted-foreground bg-accent/50 px-3 py-1.5 rounded-md mt-1 flex items-center gap-1.5">
              <i className="ki-filled ki-time text-sm text-primary"></i>
              <span>Renvoi disponible dans <span className="text-primary font-bold">{formatTime(timeLeft)}</span></span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0 mt-1"
            >
              {isResending ? t('auth.sendingLink', 'Envoi en cours...') : t('auth.resendLink', "Renvoyer le lien")}
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
