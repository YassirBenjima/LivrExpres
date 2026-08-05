import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { useLanguage } from '../../context/LanguageContext';

let _addToast = null;
let _containerEl = null;

const translateApiMessage = (msg, t) => {
  if (!msg) return '';
  if (typeof msg !== 'string') return msg;

  if (msg.includes('Identifiants invalides') || msg.includes('Invalid credentials')) {
    return t('auth.invalidCredentials', 'Identifiants invalides.');
  }
  if (msg.includes('Connexion réussie') || msg.includes('Login successful') || msg.includes('Authentification Staff réussie')) {
    return t('auth.loginSuccess', 'Connexion réussie ! Redirection...');
  }
  if (msg.includes('compte a été créé') || msg.includes('account has been created')) {
    return t('auth.regSuccessMsg', 'Votre compte a été créé avec succès.');
  }
  if (msg.includes('réinitialisation') || msg.includes('reset email')) {
    return t('auth.resetEmailSent', 'Un e-mail de réinitialisation vous a été envoyé.');
  }
  if (msg.includes('réinitialisé avec succès') || msg.includes('reset successfully')) {
    return t('auth.resetSuccessMsg', 'Votre mot de passe a été réinitialisé avec succès.');
  }
  return msg;
};

function ToastContainer() {
  const { t, language } = useLanguage();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (type, message) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 4000);
    };
    return () => { _addToast = null; };
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(toast => toast.id !== id));

  if (toasts.length === 0) return null;

  const titles = {
    fr: { success: 'Succès', info: 'Information', error: 'Erreur', danger: 'Erreur' },
    en: { success: 'Success', info: 'Information', error: 'Error', danger: 'Error' },
  };

  return ReactDOM.createPortal(
    <>
      <style>{`
        .auth-toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          left: auto;
          bottom: auto;
          z-index: 9999999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 380px;
          width: 100%;
          pointer-events: auto;
        }
        .auth-toast {
          background-color: #ffffff;
          border-left: 4px solid;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: start;
          gap: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          border: 1px solid #e4e6ef;
          transition: all 0.3s ease-out;
          animation: authToastSlideIn 0.3s ease-out forwards;
        }
        .auth-toast.success { border-left-color: #27d37f; }
        .auth-toast.error   { border-left-color: #f1416c; }
        .auth-toast.info    { border-left-color: #0094FF; }
        .auth-toast-icon {
          border-radius: 9999px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .auth-toast-icon.success { background-color: rgba(39,211,127,0.1); color: #27d37f; }
        .auth-toast-icon.error   { background-color: rgba(241,65,108,0.1); color: #f1416c; }
        .auth-toast-icon.info    { background-color: rgba(0,148,255,0.1);  color: #0094FF; }
        .auth-toast-content { flex: 1; min-width: 0; }
        .auth-toast-title   { font-size: 14px; font-weight: 600; color: #181c32; margin: 0; }
        .auth-toast-message { font-size: 12px; color: #7e8299; margin-top: 2px; word-break: break-word; }
        .auth-toast-close {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #a1a5b7;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .auth-toast-close:hover { background-color: #f5f8fa; color: #181c32; }
        @keyframes authToastSlideIn {
          from { transform: translateY(-16px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>

      <div className="auth-toast-container">
        {toasts.map(({ id, type, message }) => {
          const iconClass = type === 'success' ? 'ki-check' : type === 'info' ? 'ki-information-2' : 'ki-cross-circle';
          const title = (titles[language] || titles.fr)[type] || 'Notification';
          const displayMsg = translateApiMessage(message, t);
          return (
            <div key={id} className={`auth-toast ${type}`}>
              <div className={`auth-toast-icon ${type}`}>
                <i className={`ki-filled ${iconClass} text-base`}></i>
              </div>
              <div className="auth-toast-content">
                <h4 className="auth-toast-title">{title}</h4>
                <p className="auth-toast-message">{displayMsg}</p>
              </div>
              <button onClick={() => dismiss(id)} className="auth-toast-close">
                <i className="ki-filled ki-cross text-sm"></i>
              </button>
            </div>
          );
        })}
      </div>
    </>,
    document.body
  );
}

function ensureContainer() {
  if (_containerEl) return;
  _containerEl = document.createElement('div');
  _containerEl.id = 'auth-toast-root';
  document.body.appendChild(_containerEl);
  createRoot(_containerEl).render(<ToastContainer />);
}

export default function ApiAlert({ type, message }) {
  useEffect(() => {
    if (!message) return;
    ensureContainer();
    const t = setTimeout(() => {
      if (_addToast) _addToast(type, message);
    }, 20);
    return () => clearTimeout(t);
  }, [message, type]);

  return null;
}
