import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function ColisNewPage({ navigate, colisList = [], showNotification }) {
  const { t } = useLanguage();
  const [orderNumber, setOrderNumber] = useState('');
  const [type, setType] = useState('');
  const [recipient, setRecipient] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [replacePackage, setReplacePackage] = useState(false);
  const [oldColis, setOldColis] = useState('');
  const [packageOption, setPackageOption] = useState('Ne pas ouvrir le colis');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [productNature, setProductNature] = useState('');
  const [comment, setComment] = useState('');
  
  // Package Options
  const [fragile, setFragile] = useState(false);
  const [allFragile, setAllFragile] = useState(false);
  const [useCarton, setUseCarton] = useState(false);
  const [cartonOption, setCartonOption] = useState('');

  const [cities, setCities] = useState(['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Oujda']);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/cities')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCities(data);
        } else if (data && Array.isArray(data.cities)) {
          setCities(data.cities);
        }
      })
      .catch(err => console.warn('Could not fetch cities, using defaults:', err));

    const token = localStorage.getItem('auth_token');
    fetch('/api/settings', {
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: 'include'
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch settings');
      })
      .then(data => {
        if (data?.package_option) {
          setPackageOption(data.package_option);
        } else {
          const isOpenColis = data?.parcel_settings?.open_colis?.enabled;
          if (typeof isOpenColis === 'boolean') {
            setPackageOption(isOpenColis ? 'Ouvrir le colis' : 'Ne pas ouvrir le colis');
          }
        }
      })
      .catch(err => console.warn('Could not fetch user settings, using default package option:', err));
  }, []);

  const handleFillTestFields = () => {
    setOrderNumber(Math.floor(100000 + Math.random() * 900000).toString());
    setType('Colis Simple');
    setRecipient('Destinataire Test');
    
    // Choose first available city from cities
    let firstCity = 'Casablanca';
    if (cities.length > 0) {
      const c = cities[0];
      firstCity = (typeof c === 'object' && c !== null) ? (c.name || c.label || c.value || 'Casablanca') : (c || 'Casablanca');
    }
    setCity(firstCity);
    
    setAddress('123 Boulevard d\'Anfa, Apt 4');
    setPrice('250');
    setReplacePackage(false);
    setOldColis('');
    setPhoneNumber('0612345678');
    setNeighborhood('Maârif');
    setProductNature('Article de test');
    setComment('Livraison urgente avant 18h');
    setFragile(true);
    setAllFragile(false);
    setUseCarton(true);
    setCartonOption('m');
  };

  // Filter unique order numbers from colisList for replacement options:
  // Must have etatLabel normalized to 'Livre' or 'Livré' and statutLabel normalized to 'Termine' or 'Terminé'.
  const oldColisChoices = Array.from(
    new Set(
      colisList
        .filter(c => {
          const e = (c.etatLabel || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const s = (c.statutLabel || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return e === 'livre' && s === 'termine';
        })
        .map(c => c.orderNumber)
        .filter(Boolean)
    )
  );  const typeOptions = [
    { value: 'Colis Simple', label: t('colisForm.standardParcel', 'Colis Simple') },
    { value: 'Colis du stock', label: t('colisForm.stockParcel', 'Colis du stock') }
  ];

  const packageOptionOptions = [
    { value: 'Ne pas ouvrir le colis', label: t('colisForm.doNotOpen', 'Ne pas ouvrir le colis') },
    { value: 'Ouvrir le colis', label: t('colisForm.openPackage', 'Ouvrir le colis') }
  ];

  const cityOptions = cities.map(c => {
    if (typeof c === 'object' && c !== null) {
      const val = c.name || c.label || c.value || JSON.stringify(c);
      return { value: val, label: val };
    }
    return { value: c || '', label: c || '' };
  });

  // Calculate dynamic fees and total price
  const deliveryFee = 40.00;
  const cartonFee = useCarton ? (
    cartonOption === 's' ? 1.50 :
    cartonOption === 'm' ? 2.50 :
    cartonOption === 'l' ? 3.00 : 0
  ) : 0;
  const basePrice = parseFloat(price) || 0;
  const totalPrice = basePrice + deliveryFee + cartonFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      orderNumber: `CMD-${orderNumber}`,
      type,
      recipient,
      city,
      address,
      price: totalPrice,
      basePrice: basePrice,
      deliveryFee: deliveryFee,
      cartonFee: cartonFee,
      replacePackage,
      oldColis: replacePackage ? oldColis : null,
      packageOption,
      phoneNumber,
      neighborhood,
      productNature,
      comment,
      fragile,
      allFragile,
      useCarton,
      cartonOption: useCarton ? cartonOption : null
    };

    try {
      const response = await fetch('/api/colis/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (showNotification) {
          showNotification('success', t('notifications.colisAdded', 'Colis ajouté avec succès !'));
        } else {
          setSuccessMsg(t('notifications.colisAdded', 'Colis ajouté avec succès !'));
        }
        // Reset form
        setOrderNumber('');
        setType('');
        setRecipient('');
        setCity('');
        setAddress('');
        setPrice('');
        setReplacePackage(false);
        setOldColis('');
        setPackageOption('Ne pas ouvrir le colis');
        setPhoneNumber('');
        setNeighborhood('');
        setProductNature('');
        setComment('');
        setFragile(false);
        setAllFragile(false);
        setUseCarton(false);
        setCartonOption('');
        
        setTimeout(() => {
          if (navigate) {
            navigate('/colis');
          }
        }, 1500);
      } else {
        const errData = await response.json();
        const errMsg = errData.message || 'Une erreur est survenue lors de l\'ajout.';
        if (showNotification) {
          showNotification('error', errMsg);
        } else {
          setErrorMsg(errMsg);
        }
      }
    } catch (err) {
      console.error('API error:', err);
      const errMsg = 'Une erreur est survenue lors de l\'ajout.';
      if (showNotification) {
        showNotification('error', errMsg);
      } else {
        setErrorMsg(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activeMenu="colis_new">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Header container */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                {t('colisPage.newParcelTitle', 'Ajouter un colis')}
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                {t('colisPage.newParcelSubtitle', 'Créez un nouveau colis à expédier.')}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                type="button" 
                className="kt-btn kt-btn-outline" 
                onClick={handleFillTestFields}
                style={{ borderColor: '#e4e6ef', backgroundColor: '#f5f8fa', color: '#3f4254' }}
              >
                {t('colisPage.quickFillTest', 'Remplir (Test)')}
              </button>
              <a className="kt-btn kt-btn-outline" href="/colis">
                {t('colisForm.backToList', 'Retour à la liste')}
              </a>
              <button 
                className="kt-btn kt-btn-primary" 
                form="colis-new-form"
                type="submit"
                disabled={loading}
              >
                {loading ? t('common.loading', 'Ajout en cours...') : t('colisPage.saveParcel', 'Ajouter le colis')}
              </button>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="kt-container-fixed">
          {!showNotification && successMsg && (
            <div className="bg-success/15 border border-success/30 text-success text-sm rounded-xl p-4 mb-5 flex items-center gap-3">
              <i className="ki-filled ki-check-circle text-lg"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {!showNotification && errorMsg && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm rounded-xl p-4 mb-5 flex items-center gap-3">
              <i className="ki-filled ki-information-2 text-lg"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="colis-new-form" className="grid grid-cols-1 gap-5 lg:gap-7.5">
            
            {/* Info Card */}
            <div className="col-span-1">
              <div className="kt-card">
                <div className="kt-card-content px-10 py-7.5 lg:pe-12.5">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 md:gap-10 p-2.5">
                    <div className="flex flex-col items-start gap-3 w-full lg:max-w-[60%]">
                      <h2 className="text-xl font-semibold text-mono">
                        {t('colisForm.infoHeading', 'Informations')}
                      </h2>
                      <div className="grid grid-cols-1 gap-2 w-full">
                        <div className="flex items-start gap-1.5 lg:pe-7.5">
                          <i className="ki-filled ki-check-circle text-base text-green-500"></i>
                          <span className="text-sm text-mono">
                            {t('colisForm.infoBullet1', "Pour assurer une livraison rapide de vos commandes, veuillez inclure l'adresse complète ou le quartier du client à l'intérieur du colis.")}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 lg:pe-7.5">
                          <i className="ki-filled ki-check-circle text-base text-green-500"></i>
                          <span className="text-sm text-mono">
                            {t('colisForm.infoBullet2', "Pour les colis d'un poids supérieur à 5 kg ou d'une longueur excédant 30 cm, des frais supplémentaires seront ajoutés.")}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 lg:pe-7.5">
                          <i className="ki-filled ki-check-circle text-base text-green-500"></i>
                          <span className="text-sm text-mono">
                            {t('colisForm.infoBullet3', "Pour les colis stockés, vous pouvez ajouter des cartons, sachets ou papier bulle pour une meilleure protection.")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 self-center lg:self-auto flex items-center justify-center">
                      <i className="colis-info-icon ki-filled ki-information dark:hidden text-primary" style={{ fontSize: '80px', lineHeight: '1' }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Split cards grid */}
            <div className="col-span-1">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
                
                {/* Left Card: Informations du colis */}
                <div className="col-span-1">
                  <div className="kt-card min-w-full">
                    <div className="kt-card-header">
                      <h3 className="kt-card-title">{t('colisForm.parcelInfo', 'Informations du colis')}</h3>
                    </div>
                    <div className="kt-card-table pb-3" style={{ overflow: 'visible' }}>
                      <table className="kt-table align-middle text-sm text-muted-foreground">
                        <tbody>
                          <tr>
                            <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('colisForm.orderNoLabel', '№ Commande')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input 
                                type="text"
                                className="kt-input h-8 text-sm w-full"
                                placeholder={t('colisForm.orderNoPlaceholder', '№ Commande')}
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                required
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.typeLabel', 'Type')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <KtSelect
                                value={type}
                                onChange={setType}
                                placeholder={t('colisForm.chooseType', 'Choisir un type')}
                                options={typeOptions}
                                className="w-full"
                                enableSearch={true}
                                searchPlaceholder={t('colisForm.searchType', 'Rechercher un type...')}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.recipientLabel', 'Destinataire')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input 
                                type="text"
                                className="kt-input h-8 text-sm w-full"
                                placeholder={t('colisForm.recipientPlaceholder', 'Destinataire')}
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                required
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.cityLabel', 'Ville')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <KtSelect
                                value={city}
                                onChange={setCity}
                                placeholder={t('colisForm.chooseCity', 'Choisir une ville')}
                                options={cityOptions}
                                className="w-full"
                                enableSearch={true}
                                searchPlaceholder={t('colisForm.searchCity', 'Rechercher une ville...')}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.addressLabel', 'Adresse')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input 
                                type="text"
                                className="kt-input h-8 text-sm w-full"
                                placeholder={t('colisForm.addressPlaceholder', 'Adresse')}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.priceLabel', 'Prix')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input 
                                type="number"
                                className="kt-input h-8 text-sm w-full"
                                placeholder={t('colisForm.pricePlaceholder', 'Prix')}
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Card: Informations complementaires */}
                <div className="col-span-1">
                  <div className="kt-card min-w-full">
                    <div className="kt-card-header flex justify-between items-center">
                      <h3 className="kt-card-title">{t('colisForm.additionalInfo', 'Informations complementaires')}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-secondary-foreground font-normal">{t('colisForm.replaceColisToggle', 'Colis a remplacer')}</span>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            style={{ display: 'none' }}
                            checked={replacePackage}
                            onChange={(e) => setReplacePackage(e.target.checked)}
                          />
                          <div 
                            style={{
                              width: '36px',
                              height: '20px',
                              backgroundColor: replacePackage ? 'var(--primary, #007bff)' : '#e4e4e7',
                              borderRadius: '9999px',
                              position: 'relative',
                              transition: 'background-color 0.2s ease',
                              border: '1px solid',
                              borderColor: replacePackage ? 'var(--primary, #007bff)' : '#d4d4d8',
                            }}
                          >
                            <div 
                              style={{
                                width: '14px',
                                height: '14px',
                                backgroundColor: '#ffffff',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '2px',
                                left: replacePackage ? '18px' : '2px',
                                transition: 'left 0.2s ease',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                              }}
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="kt-card-table pb-3" style={{ overflow: 'visible' }}>
                      <table className="kt-table align-middle text-sm text-muted-foreground colis-form-table">
                        <tbody>
                          {replacePackage && (
                            <tr id="old-colis-row">
                              <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.replaceColisToggle', 'Colis a remplacer')}</td>
                              <td className="py-2 text-foreground font-normal text-sm" id="old-colis-cell">
                                <KtSelect
                                  value={oldColis}
                                  onChange={setOldColis}
                                  placeholder={t('colisForm.chooseOldColis', 'Choisir un ancien colis')}
                                  options={oldColisChoices.map(c => ({ value: c, label: c }))}
                                  className="w-full"
                                  enableSearch={true}
                                  searchPlaceholder={t('colisForm.searchOldColis', 'Rechercher un colis...')}
                                />
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.packageOptionLabel', 'Colis')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <KtSelect
                                value={packageOption}
                                onChange={setPackageOption}
                                options={packageOptionOptions}
                                className="w-full"
                                enableSearch={true}
                                searchPlaceholder={t('common.search', 'Rechercher une option...')}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.phoneLabel', 'Numero de telephone')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input 
                                type="tel"
                                className="kt-input h-8 text-sm w-full"
                                placeholder={t('colisForm.phonePlaceholder', 'Numero de telephone')}
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.neighborhoodLabel', 'Quartier')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input 
                                type="text"
                                className="kt-input h-8 text-sm w-full"
                                placeholder={t('colisForm.neighborhoodPlaceholder', 'Quartier')}
                                value={neighborhood}
                                onChange={(e) => setNeighborhood(e.target.value)}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.productNatureLabel', 'Nature de produit')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input 
                                type="text"
                                className="kt-input h-8 text-sm w-full"
                                placeholder={t('colisForm.productNaturePlaceholder', 'Nature de produit')}
                                value={productNature}
                                onChange={(e) => setProductNature(e.target.value)}
                                required
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-secondary-foreground font-normal">{t('colisForm.commentLabel', 'Commentaire')}</td>
                            <td className="py-2 text-foreground font-normal text-sm">
                              <input 
                                type="text"
                                className="kt-input h-8 text-sm w-full"
                                placeholder={t('colisForm.commentPlaceholder', 'Commentaire')}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Options de colis card */}
            <div className="col-span-1">
              <div className="kt-card">
                <div className="kt-card-header">
                  <h3 className="kt-card-title">{t('colisForm.parcelOptionsHeading', 'Options de colis')}</h3>
                </div>
                <div className="kt-card-content pb-7.5 px-4 sm:px-6">
                  <div className="grid gap-2.5">
                    
                    {/* Fragile */}
                    <div className="flex items-start sm:items-center justify-between group border border-border rounded-xl gap-3 px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative size-[50px] shrink-0">
                          <svg className="w-full h-full stroke-primary/10 fill-primary/5" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                          </svg>
                          <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a6 6 0 00-6 6v3.5a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V8a6 6 0 00-6-6zM12 13v6M9 22h6M12 5v3l-2 1" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-mono text-sm font-medium break-words leading-5">
                          {t('colisForm.fragileLabel', 'Colis fragile')}
                        </span>
                      </div>
                      <button 
                        className={`kt-btn kt-btn-sm kt-btn-icon kt-btn-primary kt-btn-outline rounded-full shrink-0 self-start sm:self-center ${fragile ? 'active' : ''}`}
                        type="button"
                        onClick={() => setFragile(!fragile)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>

                    {/* All Fragile */}
                    <div className="flex items-start sm:items-center justify-between group border border-border rounded-xl gap-3 px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative size-[50px] shrink-0">
                          <svg className="w-full h-full stroke-yellow-200 dark:stroke-yellow-950 fill-yellow-100 dark:fill-yellow-950/30" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                          </svg>
                          <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-mono text-sm font-medium break-words leading-5">
                          {t('colisForm.allFragileLabel', 'Je souhaite definir tous mes colis comme fragiles')}
                        </span>
                      </div>
                      <button 
                        className={`kt-btn kt-btn-sm kt-btn-icon kt-btn-primary kt-btn-outline rounded-full shrink-0 self-start sm:self-center ${allFragile ? 'active' : ''}`}
                        type="button"
                        onClick={() => setAllFragile(!allFragile)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Carton Option */}
                    <div className="flex items-start sm:items-center justify-between group border border-border rounded-xl gap-3 px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative size-[50px] shrink-0">
                          <svg className="w-full h-full stroke-green-200 dark:stroke-green-950 fill-green-100 dark:fill-green-950/30" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                          </svg>
                          <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-mono text-sm font-medium break-words leading-5">
                          {t('colisForm.useCartonLabel', 'Je veux utiliser un carton')}
                        </span>
                      </div>
                      <button 
                        className={`kt-btn kt-btn-sm kt-btn-icon kt-btn-primary kt-btn-outline rounded-full shrink-0 self-start sm:self-center ${useCarton ? 'active' : ''}`}
                        type="button"
                        onClick={() => setUseCarton(!useCarton)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Options carton card */}
            {useCarton && (
              <div className="col-span-1" id="carton-options-card">
                <div className="kt-card">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">{t('colisForm.cartonOptionsHeading', 'Options carton')}</h3>
                  </div>
                  <div className="kt-card-content pb-7.5 px-4 sm:px-6">
                    <div className="grid gap-2.5">
                      
                      {/* Petit carton (S) */}
                      <div className="flex items-start sm:items-center justify-between group border border-border rounded-xl gap-3 px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="size-[50px] shrink-0 rounded-xl bg-muted/60 flex items-center justify-center">
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-mono text-sm font-medium">{t('colisForm.smallCartonTitle', 'Petit carton (S)')}</span>
                            <span className="text-xs text-secondary-foreground">{t('colisForm.smallCartonFee', 'Avec frais: 1.5 DH')}</span>
                            <span className="text-xs text-secondary-foreground">{t('colisForm.smallCartonDesc', 'Carton box de petite taille.')}</span>
                          </div>
                        </div>
                        <button 
                          className={`kt-btn kt-btn-sm kt-btn-icon kt-btn-primary kt-btn-outline rounded-full shrink-0 self-start sm:self-center ${cartonOption === 's' ? 'active' : ''}`}
                          type="button"
                          onClick={() => setCartonOption('s')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Carton moyen (M) */}
                      <div className="flex items-start sm:items-center justify-between group border border-border rounded-xl gap-3 px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="size-[50px] shrink-0 rounded-xl bg-muted/60 flex items-center justify-center">
                            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-mono text-sm font-medium">{t('colisForm.mediumCartonTitle', 'Carton moyen (M)')}</span>
                            <span className="text-xs text-secondary-foreground">{t('colisForm.mediumCartonFee', 'Avec frais: 2.5 DH')}</span>
                            <span className="text-xs text-secondary-foreground">{t('colisForm.mediumCartonDesc', 'Carton box de moyenne taille.')}</span>
                          </div>
                        </div>
                        <button 
                          className={`kt-btn kt-btn-sm kt-btn-icon kt-btn-primary kt-btn-outline rounded-full shrink-0 self-start sm:self-center ${cartonOption === 'm' ? 'active' : ''}`}
                          type="button"
                          onClick={() => setCartonOption('m')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Grand carton (L) */}
                      <div className="flex items-start sm:items-center justify-between group border border-border rounded-xl gap-3 px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="size-[50px] shrink-0 rounded-xl bg-muted/60 flex items-center justify-center">
                            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-mono text-sm font-medium">{t('colisForm.largeCartonTitle', 'Grand carton (L)')}</span>
                            <span className="text-xs text-secondary-foreground">{t('colisForm.largeCartonFee', 'Avec frais: 3 DH')}</span>
                            <span className="text-xs text-secondary-foreground">{t('colisForm.largeCartonDesc', 'Carton box de grande taille.')}</span>
                          </div>
                        </div>
                        <button 
                          className={`kt-btn kt-btn-sm kt-btn-icon kt-btn-primary kt-btn-outline rounded-full shrink-0 self-start sm:self-center ${cartonOption === 'l' ? 'active' : ''}`}
                          type="button"
                          onClick={() => setCartonOption('l')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}

          </form>

        </div>

      </main>
    </DashboardLayout>
  );
}
