import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const FlagFR = ({ className = "w-5 h-3.5" }) => (
  <img 
    src="https://flagcdn.com/w40/fr.png" 
    srcSet="https://flagcdn.com/w80/fr.png 2x" 
    alt="Français" 
    className={`${className} object-cover rounded-[3px] shadow-xs shrink-0 inline-block align-middle`}
  />
);

const FlagGB = ({ className = "w-5 h-3.5" }) => (
  <img 
    src="https://flagcdn.com/w40/gb.png" 
    srcSet="https://flagcdn.com/w80/gb.png 2x" 
    alt="English" 
    className={`${className} object-cover rounded-[3px] shadow-xs shrink-0 inline-block align-middle`}
  />
);

export default function AuthLayout({ 
  children, 
  rightPaneTitle = "Portail d'accès sécurisé",
  rightPaneDesc = "Une passerelle d'authentification robuste assurant un accès sécurisé et efficace à l'interface de gestion de LivrExpress.",
  cardMaxWidthClass = "max-w-[370px]",
  docTitle
}) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (docTitle) {
      document.title = docTitle;
    }
  }, [docTitle, language]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectLanguage = (lang, e) => {
    e.preventDefault();
    e.stopPropagation();
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="grid lg:grid-cols-2 grow min-h-screen w-full relative">
      
      {/* Solid Floating Language Selector (Non-Transparent) */}
      <div 
        ref={dropdownRef}
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999 }}
      >
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(prev => !prev);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-accent text-foreground text-xs font-semibold shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer select-none"
          >
            {language === 'fr' ? (
              <>
                <FlagFR />
                <span className="tracking-wide">FR</span>
              </>
            ) : (
              <>
                <FlagGB />
                <span className="tracking-wide">EN</span>
              </>
            )}
            <i className={`ki-filled ki-down text-[10px] transition-transform duration-200 text-muted-foreground ${isOpen ? 'rotate-180 text-primary' : ''}`}></i>
          </button>

          {/* Upwards Solid Dropdown Menu (Non-Transparent) */}
          {isOpen && (
            <div 
              style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '10px', zIndex: 99999 }}
              className="w-44 bg-card border border-border rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              <button
                type="button"
                onClick={(e) => selectLanguage('fr', e)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer select-none ${
                  language === 'fr' 
                    ? 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20' 
                    : 'text-foreground hover:bg-accent font-medium'
                }`}
              >
                <FlagFR />
                <span className="grow">Français</span>
                {language === 'fr' && <i className="ki-solid ki-check text-xs text-primary"></i>}
              </button>

              <button
                type="button"
                onClick={(e) => selectLanguage('en', e)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer select-none ${
                  language === 'en' 
                    ? 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20' 
                    : 'text-foreground hover:bg-accent font-medium'
                }`}
              >
                <FlagGB />
                <span className="grow">English</span>
                {language === 'en' && <i className="ki-solid ki-check text-xs text-primary"></i>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Left Column (Card container) */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-10 order-2 lg:order-1 relative">
        <div className={`kt-card ${cardMaxWidthClass} w-full my-6`}>
          {children}
        </div>
      </div>

      {/* Right Column (Original Inner Layout with LivrExpress Background) */}
      <div className="lg:rounded-xl lg:border lg:border-border lg:m-5 order-1 lg:order-2 livrexpress-auth-bg min-h-[400px] relative overflow-hidden">
        <div className="glow-orb-primary"></div>
        <div className="glow-orb-secondary"></div>
        
        <div className="flex flex-col p-8 lg:p-16 gap-4 relative z-10">
          <a href="/" onClick={e => e.preventDefault()}>
            <img className="h-[28px] max-w-none" src="/assets/media/app/default-logo.svg" alt="LivrExpress Logo"/>
          </a>
          <div className="flex flex-col gap-3">
            <h3 className="text-2xl font-semibold text-mono">{rightPaneTitle}</h3>
            <div className="text-base font-medium text-secondary-foreground">
              {rightPaneDesc}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
