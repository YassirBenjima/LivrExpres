import React, { useState } from 'react';

export default function PasswordInput({ value, onChange, placeholder, name, id, autoComplete, disabled }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
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
  );
}
