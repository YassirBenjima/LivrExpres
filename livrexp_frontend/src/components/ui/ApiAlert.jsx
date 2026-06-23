import React from 'react';

export default function ApiAlert({ type, message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`api-alert ${isError ? 'api-alert-error bg-red-500/10 border border-red-500/20 text-red-500' : 'api-alert-success bg-green-500/10 border border-green-500/20 text-green-500'} flex items-center gap-2 p-3 rounded text-xs`}>
      <i className={`ki-filled ${isError ? 'ki-information' : 'ki-check'} ${isError ? 'text-red-500' : 'text-green-500'}`}></i>
      <span>{message}</span>
    </div>
  );
}
