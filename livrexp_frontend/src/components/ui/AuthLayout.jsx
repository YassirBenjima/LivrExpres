import React from 'react';

export default function AuthLayout({ 
  children, 
  rightPaneTitle = "Portail d'accès sécurisé",
  rightPaneDesc = "Une passerelle d'authentification robuste assurant un accès sécurisé et efficace à l'interface de gestion de LivrExpress.",
  useAltBg = false,
  cardMaxWidthClass = "max-w-[370px]"
}) {
  return (
    <div className="grid lg:grid-cols-2 grow min-h-screen w-full">
      {/* Left Column (Card container) */}
      <div className="flex justify-center items-center p-8 lg:p-10 order-2 lg:order-1">
        <div className={`kt-card ${cardMaxWidthClass} w-full my-10`}>
          {children}
        </div>
      </div>

      {/* Right Column (Branded Background Pane) */}
      <div className={`lg:rounded-xl lg:border lg:border-border lg:m-5 order-1 lg:order-2 bg-top xxl:bg-center xl:bg-cover bg-no-repeat ${useAltBg ? 'register-branded-bg' : 'branded-bg'} min-h-[400px]`}>
        <div className="flex flex-col p-8 lg:p-16 gap-4">
          <a href="/" onClick={e => e.preventDefault()}>
            <img className="h-[28px] max-w-none" src="https://keenthemes.com/metronic/tailwind/dist/assets/media/app/mini-logo.svg" alt="Logo"/>
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
