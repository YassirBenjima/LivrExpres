import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';

let _addToast = null;
let _containerEl = null;

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (type, message) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };
    return () => { _addToast = null; };
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  if (toasts.length === 0) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        left: 'auto',
        bottom: 'auto',
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'auto',
      }}
    >
      {toasts.map(({ id, type, message }) => {
        const isError = type === 'error';
        const isSuccess = type === 'success';
        const borderColor = isError ? '#f1416c' : isSuccess ? '#27d37f' : '#0094FF';
        const iconBg = isError ? 'rgba(241,65,108,0.1)' : isSuccess ? 'rgba(39,211,127,0.1)' : 'rgba(0,148,255,0.1)';
        const iconColor = isError ? '#f1416c' : isSuccess ? '#27d37f' : '#0094FF';
        const iconClass = isError ? 'ki-cross-circle' : isSuccess ? 'ki-check-circle' : 'ki-information-2';
        const title = isError ? 'Erreur' : isSuccess ? 'Succès' : 'Information';

        return (
          <div
            key={id}
            style={{
              backgroundColor: '#ffffff',
              borderLeft: `4px solid ${borderColor}`,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)',
              border: '1px solid #e4e6ef',
              animation: 'toastSlideInRight 0.3s ease-out forwards',
            }}
          >
            <div style={{ borderRadius: '9999px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: iconBg, color: iconColor }}>
              <i className={`ki-filled ${iconClass}`} style={{ fontSize: '18px' }}></i>
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
              <h4 style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 600, color: '#181c32' }}>{title}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#7e8299', wordBreak: 'break-word', lineHeight: 1.5 }}>{message}</p>
            </div>
            <button onClick={() => dismiss(id)} type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a1a5b7', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '6px', flexShrink: 0 }}>
              <i className="ki-filled ki-cross" style={{ fontSize: '14px' }}></i>
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toastSlideInRight {
          from { transform: translateX(30px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>,
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
