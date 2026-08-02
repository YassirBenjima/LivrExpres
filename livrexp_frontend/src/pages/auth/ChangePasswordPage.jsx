import React, { useState, useRef } from 'react';
import AuthLayout from '../../components/ui/AuthLayout';
import ApiAlert from '../../components/ui/ApiAlert';
import PasswordInput from '../../components/ui/PasswordInput';
import { authService } from '../../services/api';
import '../../styles/auth.css';

export default function ChangePasswordPage({ navigate }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  const inputRefs = useRef([]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }));

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    const otpCode = otp.join('');

    if (otpCode.length < 6) {
      tempErrors.otp = "Veuillez entrer le code à 6 chiffres reçu par e-mail";
    }

    if (!password) {
      tempErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      tempErrors.password = "Le mot de passe doit comporter au moins 6 caractères";
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setApiSuccess('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const otpCode = otp.join('');
      const data = await authService.resetPasswordChange(password, confirmPassword, otpCode);
      setApiSuccess(data.message || 'Votre mot de passe a été réinitialisé avec succès.');
      setTimeout(() => {
        navigate('/reset-password/changed');
      }, 1500);
    } catch (error) {
      setApiError(error.message || 'Erreur lors de la réinitialisation du mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      rightPaneTitle="Sécurité renforcée"
      rightPaneDesc="Saisissez le code de vérification à 6 chiffres reçu par e-mail ainsi que votre nouveau mot de passe pour sécuriser votre compte."
    >
      <form onSubmit={handleSubmit} className="kt-card-content flex flex-col gap-5 p-10" id="reset_password_change_password_form">
        <div className="text-center mb-1">
          <h3 className="text-lg font-medium text-mono mb-1">
            Changer le mot de passe 🔒
          </h3>
          <span className="text-xs text-secondary-foreground">
            Saisissez le code de vérification à 6 chiffres et définissez votre nouveau mot de passe.
          </span>
        </div>

        <ApiAlert type="error" message={apiError} />
        <ApiAlert type="success" message={apiSuccess} />

        {/* 6-Digit OTP Code Section */}
        <div className="flex flex-col gap-2">
          <label className="kt-form-label text-mono text-xs font-semibold text-center">
            Code de vérification (6 chiffres)
          </label>
          <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                disabled={isLoading}
                className="w-11 h-12 text-center text-lg font-bold border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              />
            ))}
          </div>
          {errors.otp && <span className="text-red-500 text-xs text-center mt-1">{errors.otp}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="kt-form-label text-mono text-xs">
            Nouveau mot de passe
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
            }}
            disabled={isLoading}
          />
          {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="kt-form-label text-mono text-xs">
            Confirmer le mot de passe
          </label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
            }}
            disabled={isLoading}
          />
          {errors.confirmPassword && <span className="text-red-500 text-xs mt-1">{errors.confirmPassword}</span>}
        </div>

        <button className="kt-btn kt-btn-primary flex justify-center grow py-2.5 mt-2" type="submit" disabled={isLoading}>
          {isLoading ? 'Réinitialisation...' : 'Valider et réinitialiser'}
        </button>
      </form>
    </AuthLayout>
  );
}
