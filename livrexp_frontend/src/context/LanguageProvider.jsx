import { useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { LanguageContext } from './LanguageContext';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('livrexpress_lang');
      if (['fr', 'en'].includes(saved)) {
        return saved;
      }
      localStorage.setItem('livrexpress_lang', 'fr');
    } catch {
      // Ignore localStorage errors
    }
    return 'fr';
  });

  useEffect(() => {
    try {
      localStorage.setItem('livrexpress_lang', language);
      document.documentElement.lang = language;
    } catch {
      // Ignore
    }
  }, [language]);

  /**
   * Helper to resolve translation string
   * Usage: t('nav.dashboard') or t('Unknown string', 'Valeur par défaut')
   */
  const t = (keyPath, fallbackText = '') => {
    if (!keyPath || typeof keyPath !== 'string') return fallbackText || '';

    try {
      const keys = keyPath.split('.');
      let currentObj = (translations && translations[language]) ? translations[language] : (translations?.fr || {});

      for (const key of keys) {
        if (currentObj && currentObj[key] !== undefined) {
          currentObj = currentObj[key];
        } else {
          // Fallback to French if missing in target language
          let frObj = translations?.fr || {};
          for (const k of keys) {
            if (frObj && frObj[k] !== undefined) {
              frObj = frObj[k];
            } else {
              return fallbackText || keyPath;
            }
          }
          return typeof frObj === 'string' ? frObj : (fallbackText || keyPath);
        }
      }

      return typeof currentObj === 'string' ? currentObj : (fallbackText || keyPath);
    } catch (err) {
      console.error('Translation error:', err);
      return fallbackText || keyPath;
    }
  };

  const changeLanguage = (langCode) => {
    if (['fr', 'en'].includes(langCode)) {
      setLanguage(langCode);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
