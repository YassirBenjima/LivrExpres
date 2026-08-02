import React, { useState } from 'react';

function getPasswordStrength(pass) {
  if (!pass) return { score: 0, label: '', textClass: '', barBg: '' };
  
  let score = 1;
  if (pass.length >= 6 && (/[A-Z]/.test(pass) || /[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass))) {
    score = 2;
  }
  if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) {
    score = 3;
  }

  if (score === 1) {
    return { score: 1, label: 'Faible', textClass: 'text-red-500', barBg: 'bg-red-500' };
  } else if (score === 2) {
    return { score: 2, label: 'Moyen', textClass: 'text-amber-500', barBg: 'bg-amber-500' };
  } else {
    return { score: 3, label: 'Fort', textClass: 'text-emerald-500', barBg: 'bg-emerald-500' };
  }
}

export default function PasswordInput({ 
  value, 
  onChange, 
  placeholder, 
  name, 
  id, 
  autoComplete, 
  disabled,
  showStrength = false,
  matchValue
}) {
  const [showPassword, setShowPassword] = useState(false);
  const strength = showStrength ? getPasswordStrength(value) : null;
  const isMatching = matchValue !== undefined && value ? value === matchValue : null;

  return (
    <div className="flex flex-col w-full">
      <div className="kt-input" data-kt-toggle-password="true">
        <input 
          type={showPassword ? 'text' : 'password'} 
          value={value}
          onChange={onChange}
          id={id}
          name={name}
          autoComplete={autoComplete} 
          required 
          placeholder={placeholder || "••••••••••"}
          disabled={disabled}
        />
        <button 
          className="kt-btn kt-btn-sm kt-btn-ghost kt-btn-icon bg-transparent! -me-1.5" 
          onClick={() => setShowPassword(!showPassword)}
          type="button"
        >
          <span>
            <i className={`ki-filled ${showPassword ? 'ki-eye-slash' : 'ki-eye'} text-muted-foreground`}></i>
          </span>
        </button>
      </div>

      {/* Password Strength Meter */}
      {showStrength && value && (
        <div className="flex flex-col gap-1 mt-2">
          <div className="grid grid-cols-3 gap-2 h-1.5 w-full">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.barBg : 'bg-slate-200 dark:bg-slate-700'}`}></div>
            <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.barBg : 'bg-slate-200 dark:bg-slate-700'}`}></div>
            <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.barBg : 'bg-slate-200 dark:bg-slate-700'}`}></div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold mt-0.5">
            <span className={strength.score === 1 ? `${strength.textClass} text-left` : 'invisible'}>Faible</span>
            <span className={strength.score === 2 ? `${strength.textClass} text-center` : 'invisible'}>Moyen</span>
            <span className={strength.score === 3 ? `${strength.textClass} text-right` : 'invisible'}>Fort</span>
          </div>
        </div>
      )}

      {/* Password Similarity / Match Indicator */}
      {matchValue !== undefined && value && (
        <div className={`flex items-center gap-1.5 text-xs font-medium mt-1.5 ${isMatching ? 'text-emerald-500' : 'text-red-500'}`}>
          <i className={`ki-filled ${isMatching ? 'ki-check-circle' : 'ki-cross-circle'}`}></i>
          <span>{isMatching ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}</span>
        </div>
      )}
    </div>
  );
}
