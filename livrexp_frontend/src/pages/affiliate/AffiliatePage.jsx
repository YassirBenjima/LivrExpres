import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';

export default function AffiliatePage({ navigate, showNotification }) {
  const { t } = useLanguage();
  const [data, setData] = useState({
    next_payment: 0,
    total_referred: 0,
    total_earnings: 0,
    full_link: '',
    short_link: ''
  });
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState('');

  const fetchAffiliateData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/affiliate', {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erreur chargement données affiliation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const copyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    if (showNotification) showNotification('success', t('affiliate.copiedToast', 'Lien copié dans le presse-papier !'));
    setTimeout(() => setCopiedLink(''), 2000);
  };

  return (
    <DashboardLayout activeMenu="affiliate">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Header */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">{t('affiliate.title', 'Affiliate')}</h1>
              <span className="text-sm text-secondary-foreground">
                {t('affiliate.subtitle', 'Parrainez des clients et gagnez des commissions sur chaque livraison.')}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="kt-container-fixed mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Prochain paiement */}
            <div className="kt-card">
              <div className="kt-card-content p-5 flex items-center gap-4">
                <div className="size-[50px] shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <i className="ki-filled ki-gift text-xl text-primary"></i>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-semibold text-mono">
                      {loading ? '...' : `${data.next_payment} DH`}
                    </span>
                    <span className="inline-flex items-center" title={t('affiliate.nextPaymentTooltip', 'Montant de votre prochain virement mensuel des commissions d\'affiliation.')}>
                      <i className="ki-filled ki-information-2 text-sm text-secondary-foreground cursor-help"></i>
                    </span>
                  </div>
                  <span className="text-xs text-secondary-foreground font-medium">{t('affiliate.nextPayment', 'Prochain paiement')}</span>
                </div>
              </div>
            </div>

            {/* Total référencé */}
            <div className="kt-card">
              <div className="kt-card-content p-5 flex items-center gap-4">
                <div className="size-[50px] shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <i className="ki-filled ki-people text-xl text-primary"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold text-mono">
                    {loading ? '...' : data.total_referred}
                  </span>
                  <span className="text-xs text-secondary-foreground font-medium">{t('affiliate.totalReferred', 'Total référencé')}</span>
                </div>
              </div>
            </div>

            {/* Total des gains */}
            <div className="kt-card">
              <div className="kt-card-content p-5 flex items-center gap-4">
                <div className="size-[50px] shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <i className="ki-filled ki-dollar text-xl text-primary"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold text-mono">
                    {loading ? '...' : `${data.total_earnings} DH`}
                  </span>
                  <span className="text-xs text-secondary-foreground font-medium">{t('affiliate.totalEarnings', 'Total des gains reçus')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Affiliate Links Card */}
        <div className="kt-container-fixed mb-5">
          <div className="kt-card">
            <div className="kt-card-header">
              <h3 className="kt-card-title text-sm">{t('affiliate.linksTitle', 'Vos liens d\'affiliation')}</h3>
            </div>
            <div className="kt-card-content flex flex-col gap-5">
              <p className="text-sm text-secondary-foreground leading-relaxed">
                {t('affiliate.linksDesc', 'Les liens d\'affiliation sont des URL uniques qui vous permettent de gagner une commission en référant des clients. Partagez votre lien long ou court avec d\'autres personnes et gagnez un pourcentage.')}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Full Link */}
                <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{t('affiliate.fullLink', 'Lien complet')}</span>
                    <span className="kt-badge kt-badge-primary kt-badge-outline rounded-[30px] text-xs">{t('affiliate.badgeFull', 'Full')}</span>
                  </div>
                  <div className="kt-input bg-muted/30">
                    <input
                      className="text-xs truncate w-full bg-transparent focus:outline-none"
                      readOnly
                      type="text"
                      value={data.full_link}
                    />
                  </div>
                  <button
                    className="kt-btn kt-btn-outline kt-btn-primary kt-btn-sm w-fit"
                    type="button"
                    onClick={() => copyToClipboard(data.full_link, 'full')}
                  >
                    <i className={`ki-filled ${copiedLink === 'full' ? 'ki-check' : 'ki-copy'}`}></i>
                    {copiedLink === 'full' ? t('affiliate.copiedBtn', 'Copié !') : t('affiliate.copyBtn', 'Copier')}
                  </button>
                </div>

                {/* Short Link */}
                <div className="border border-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{t('affiliate.shortLink', 'Lien court')}</span>
                    <span className="kt-badge kt-badge-success kt-badge-outline rounded-[30px] text-xs">{t('affiliate.badgeShort', 'Short')}</span>
                  </div>
                  <div className="kt-input bg-muted/30">
                    <input
                      className="text-xs truncate w-full bg-transparent focus:outline-none"
                      readOnly
                      type="text"
                      value={data.short_link}
                    />
                  </div>
                  <button
                    className="kt-btn kt-btn-outline kt-btn-primary kt-btn-sm w-fit"
                    type="button"
                    onClick={() => copyToClipboard(data.short_link, 'short')}
                  >
                    <i className={`ki-filled ${copiedLink === 'short' ? 'ki-check' : 'ki-copy'}`}></i>
                    {copiedLink === 'short' ? t('affiliate.copiedBtn', 'Copié !') : t('affiliate.copyBtn', 'Copier')}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Info & How It Works */}
        <div className="kt-container-fixed pb-5">
          <div className="kt-card">
            <div className="kt-card-content p-5 lg:p-7.5 flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <div className="size-[44px] shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <i className="ki-filled ki-percentage text-xl text-violet-600"></i>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-foreground">{t('affiliate.bannerTitle', 'Gagnez 3% sur chaque livraison')}</h3>
                  <p className="text-sm text-secondary-foreground leading-relaxed">
                    {t('affiliate.bannerDesc', 'Chaque colis livré par vos références vous rapporte 3% des frais de livraison. Vous pouvez utiliser cet argent pour livrer ou le recevoir chaque mois en paiement.')}
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <h4 className="text-sm font-semibold text-foreground">{t('affiliate.howItWorksTitle', 'Comment ça marche ?')}</h4>
                  <span className="kt-badge kt-badge-success kt-badge-outline rounded-[30px] text-xs">
                    <span className="kt-badge-dot size-1.5"></span>
                    {t('affiliate.easyAndFastBadge', 'Facile et Rapide')}
                  </span>
                </div>
                <ol className="flex flex-col gap-4">
                  <li className="flex items-start gap-3">
                    <span className="flex shrink-0 size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">1</span>
                    <span className="text-sm text-secondary-foreground pt-1">{t('affiliate.step1', 'Partagez votre lien de parrainage avec vos amis, collègues ou sur les réseaux sociaux.')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex shrink-0 size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">2</span>
                    <span className="text-sm text-secondary-foreground pt-1">{t('affiliate.step2', 'Dès qu\'ils livrent, vous gagnez plus de 3% sur chaque livraison.')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex shrink-0 size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">3</span>
                    <span className="text-sm text-secondary-foreground pt-1">{t('affiliate.step3', 'Utilisez cet argent pour vos propres envois ou recevez-le chaque mois en paiement.')}</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
