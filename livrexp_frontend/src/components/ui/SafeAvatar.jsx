import { useState } from 'react';

const GMAIL_GRADIENTS = [
  'linear-gradient(135deg, #4285F4 0%, #3b82f6 100%)', // Google Blue
  'linear-gradient(135deg, #EA4335 0%, #e11d48 100%)', // Google Red
  'linear-gradient(135deg, #34A853 0%, #10b981 100%)', // Google Green
  'linear-gradient(135deg, #FBBC05 0%, #d97706 100%)', // Google Amber
  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Indigo/Violet
  'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)', // Cyan/Blue
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', // Pink/Purple
];

function getGmailGradient(name) {
  if (!name) return GMAIL_GRADIENTS[0];
  let charCodeSum = 0;
  for (let i = 0; i < name.length; i++) {
    charCodeSum += name.charCodeAt(i);
  }
  return GMAIL_GRADIENTS[charCodeSum % GMAIL_GRADIENTS.length];
}

export default function SafeAvatar({ src, name, size = 32, sizeClass = "", textClass = "text-xs" }) {
  const [imgError, setImgError] = useState(false);
  const initial = (name && name.trim().length > 0) ? name.trim()[0].toUpperCase() : 'U';
  const background = getGmailGradient(name);

  const inlineStyle = { width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` };

  if (src && !imgError) {
    return (
      <img
        className={`relative shrink-0 rounded-full ring-2 ring-background object-cover shadow-sm ${sizeClass}`}
        style={inlineStyle}
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span
      title={name || 'Utilisateur'}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full ring-2 font-bold ${textClass} text-white ring-background shadow-sm ${sizeClass}`}
      style={{ ...inlineStyle, background }}
    >
      {initial}
    </span>
  );
}
