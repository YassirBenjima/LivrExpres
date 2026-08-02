import React, { useState } from 'react';

export default function PasswordInput({ value, onChange, placeholder, name, id, autoComplete, disabled }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="kt-input flex items-center w-full relative">
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
        className="grow w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-foreground text-sm min-w-0"
      />
      <button 
        className="kt-btn kt-btn-sm kt-btn-ghost kt-btn-icon bg-transparent! -me-1.5 shrink-0 cursor-pointer" 
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
