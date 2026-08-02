import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export default function ApiAlert({ type, message, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
  }, [message, type]);

  if (!message || !visible) return null;

  const isError = type === 'error';
  const isSuccess = type === 'success';

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed top-6 right-6 z-[9999999] max-w-[380px] w-full pointer-events-auto transition-all duration-300">
      <div
        className={`bg-white dark:bg-slate-900 border-l-4 ${
          isError
            ? 'border-l-red-500 border-red-500/20'
            : isSuccess
            ? 'border-l-emerald-500 border-emerald-500/20'
            : 'border-l-primary border-primary/20'
        } rounded-xl p-4 flex items-start gap-3 shadow-2xl border animate-in fade-in slide-in-from-top-4 duration-300`}
        style={{
          boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div
          className={`p-2 rounded-full flex items-center justify-center shrink-0 ${
            isError
              ? 'bg-red-500/10 text-red-500'
              : isSuccess
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-primary/10 text-primary'
          }`}
        >
          <i
            className={`ki-filled ${
              isError
                ? 'ki-cross-circle'
                : isSuccess
                ? 'ki-check-circle'
                : 'ki-information-2'
            } text-lg`}
          ></i>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
            {isError ? 'Erreur' : isSuccess ? 'Succès' : 'Information'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words">
            {message}
          </p>
        </div>

        <button
          onClick={handleClose}
          type="button"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer border-0 bg-transparent"
        >
          <i className="ki-filled ki-cross text-sm"></i>
        </button>
      </div>
    </div>,
    document.body
  );
}
