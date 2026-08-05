import { createContext, useContext } from 'react';

export const LanguageContext = createContext({
  language: 'fr',
  setLanguage: () => {},
  t: (keyPath, fallbackText = '') => fallbackText || keyPath,
});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'fr',
      setLanguage: () => {},
      t: (keyPath, fallbackText = '') => fallbackText || keyPath,
    };
  }
  return context;
};
