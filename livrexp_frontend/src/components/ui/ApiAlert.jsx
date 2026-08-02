import React from 'react';

export default function ApiAlert({ type, message, icon }) {
  if (!message) return null;
  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <div
      className={`api-alert relative flex items-start gap-3 p-3.5 rounded-xl text-xs font-medium transition-all duration-300 shadow-sm border ${
        isError
          ? 'bg-red-500/10 dark:bg-red-500/15 border-red-500/25 text-red-600 dark:text-red-400'
          : isSuccess
          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
          : 'bg-primary/10 border-primary/20 text-primary'
      }`}
    >
      <div className={`p-1 rounded-lg shrink-0 ${isError ? 'bg-red-500/20' : isSuccess ? 'bg-emerald-500/20' : 'bg-primary/20'}`}>
        <i className={`ki-filled ${icon ? icon : isError ? 'ki-information-2' : isSuccess ? 'ki-check-circle' : 'ki-notification-status'} text-base ${isError ? 'text-red-600 dark:text-red-400' : isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}></i>
      </div>
      <div className="grow pt-0.5 leading-relaxed">
        {message}
      </div>
    </div>
  );
}
