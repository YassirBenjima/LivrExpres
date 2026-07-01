import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function ColisEditPage({ colisId, navigate, colisList = [], showNotification }) {
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
  const [fetchLoading, setFetchLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // 1. Fetch cities
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

    // 2. Fetch existing parcel data
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    fetch(`/api/colis/${colisId}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('Impossible de charger les données du colis.');
        return res.json();
      })
      .then(data => {
        setOrderNumber(data.orderNumber || '');
        setType(data.type || '');
        setRecipient(data.recipient || '');
        setCity(data.city || '');
        setAddress(data.address || '');
        setPrice(data.price ? String(data.price) : '');
        setReplacePackage(!!data.replacePackage);
        setOldColis(data.oldColis || '');
        setPackageOption(data.packageOption || 'Ne pas ouvrir le colis');
        setPhoneNumber(data.phoneNumber || '');
        setNeighborhood(data.neighborhood || '');
        setProductNature(data.productNature || '');
        setComment(data.comment || '');
        setFragile(!!data.fragile);
        setAllFragile(!!data.allFragile);
        setUseCarton(!!data.useCarton);
        setCartonOption(data.cartonOption || '');
      })
      .catch(err => {
        console.error(err);
        const msg = err.message || 'Erreur lors du chargement des données.';
        if (showNotification) {
          showNotification('error', msg);
        } else {
          setErrorMsg(msg);
        }
      })
      .finally(() => {
        setFetchLoading(false);
      });
  }, [colisId]);

  // Filter unique order numbers from colisList for replacement options:
  const oldColisChoices = Array.from(
    new Set(
      colisList
        .filter(c => {
          if (c.id === Number(colisId)) return false; // exclude current colis
          const etat = (c.etatLabel || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          const statut = (c.statutLabel || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          return (etat === 'livre' && statut === 'termine');
        })
        .map(c => c.orderNumber)
        .filter(Boolean)
    )
  );

  const typeOptions = [
    { value: 'Colis Simple', label: 'Colis Simple' },
    { value: 'Colis du stock', label: 'Colis du stock' }
  ];

  const packageOptionOptions = [
    { value: 'Ne pas ouvrir le colis', label: 'Ne pas ouvrir le colis' },
    { value: 'Ouvrir le colis', label: 'Ouvrir le colis' }
  ];

  const cityOptions = cities.map(c => {
    if (typeof c === 'object' && c !== null) {
      const val = c.name || c.label || c.value || JSON.stringify(c);
      return { value: val, label: val };
    }
    return { value: c || '', label: c || '' };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const token = localStorage.getItem('auth_token');
    const payload = {
      orderNumber: `CMD-${orderNumber}`,
      type,
      recipient,
      city,
      address,
      price: parseFloat(price) || 0,
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
      const response = await fetch(`/api/colis/${colisId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (showNotification) {
          showNotification('success', 'Colis modifié avec succès !');
        } else {
          setSuccessMsg('Colis modifié avec succès !');
        }
        
        setTimeout(() => {
          if (navigate) {
            navigate('/colis');
          }
        }, 1500);
      } else {
        const errData = await response.json();
        const errMsg = errData.message || 'Une erreur est survenue lors de la modification.';
        if (showNotification) {
          showNotification('error', errMsg);
        } else {
          setErrorMsg(errMsg);
        }
      }
    } catch (err) {
      console.error('API error:', err);
      const errMsg = 'Une erreur est survenue lors de la modification.';
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
    <DashboardLayout activeMenu="colis_list">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Header container */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                Modifier le colis
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Modifier les détails du colis #{orderNumber}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <a className="kt-btn kt-btn-outline" href="/colis">
                Retour à la liste
              </a>
              <button 
                className="kt-btn kt-btn-primary" 
                form="colis-edit-form"
                type="submit"
                disabled={loading || fetchLoading}
              >
                {loading ? 'Modification...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="kt-container-fixed">
          {fetchLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></span>
            </div>
          ) : (
            <>
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

              <form onSubmit={handleSubmit} id="colis-edit-form" className="grid grid-cols-1 gap-5 lg:gap-7.5">
                
                {/* Split cards grid */}
                <div className="col-span-1">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
                    
                    {/* Left Card: Informations du colis */}
                    <div className="col-span-1">
                      <div className="kt-card min-w-full">
                        <div className="kt-card-header">
                          <h3 className="kt-card-title">Informations du colis</h3>
                        </div>
                        <div className="kt-card-table pb-3" style={{ overflow: 'visible' }}>
                          <table className="kt-table align-middle text-sm text-muted-foreground">
                            <tbody>
                              <tr>
                                <td className="py-2 min-w-36 text-secondary-foreground font-normal">№ Commande</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <input 
                                    type="text"
                                    className="kt-input h-8 text-sm w-full"
                                    placeholder="№ Commande"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                    required
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 text-secondary-foreground font-normal">Type</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <KtSelect
                                    value={type}
                                    onChange={setType}
                                    placeholder="Choisir un type"
                                    options={typeOptions}
                                    className="w-full"
                                    enableSearch={true}
                                    searchPlaceholder="Rechercher un type..."
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 text-secondary-foreground font-normal">Destinataire</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <input 
                                    type="text"
                                    className="kt-input h-8 text-sm w-full"
                                    placeholder="Destinataire"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    required
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 text-secondary-foreground font-normal">Ville</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <KtSelect
                                    value={city}
                                    onChange={setCity}
                                    placeholder="Choisir une ville"
                                    options={cityOptions}
                                    className="w-full"
                                    enableSearch={true}
                                    searchPlaceholder="Rechercher une ville..."
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 text-secondary-foreground font-normal">Adresse</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <input 
                                    type="text"
                                    className="kt-input h-8 text-sm w-full"
                                    placeholder="Adresse"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 text-secondary-foreground font-normal">Prix</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <input 
                                    type="number"
                                    className="kt-input h-8 text-sm w-full"
                                    placeholder="Prix"
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
                          <h3 className="kt-card-title">Informations complementaires</h3>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-secondary-foreground font-normal">Colis a remplacer</span>
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
                                  <td className="py-2 text-secondary-foreground font-normal">Colis a remplacer</td>
                                  <td className="py-2 text-foreground font-normal text-sm" id="old-colis-cell">
                                    <KtSelect
                                      value={oldColis}
                                      onChange={setOldColis}
                                      placeholder="Choisir un ancien colis"
                                      options={oldColisChoices.map(c => ({ value: c, label: c }))}
                                      className="w-full"
                                      enableSearch={true}
                                      searchPlaceholder="Rechercher un colis..."
                                    />
                                  </td>
                                </tr>
                              )}
                              <tr>
                                <td className="py-2 text-secondary-foreground font-normal">Colis</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <KtSelect
                                    value={packageOption}
                                    onChange={setPackageOption}
                                    options={packageOptionOptions}
                                    className="w-full"
                                    enableSearch={true}
                                    searchPlaceholder="Rechercher une option..."
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 text-secondary-foreground font-normal">Numero de telephone</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <input 
                                    type="tel"
                                    className="kt-input h-8 text-sm w-full"
                                    placeholder="Numero de telephone"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 text-secondary-foreground font-normal">Quartier</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <input 
                                    type="text"
                                    className="kt-input h-8 text-sm w-full"
                                    placeholder="Quartier"
                                    value={neighborhood}
                                    onChange={(e) => setNeighborhood(e.target.value)}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 text-secondary-foreground font-normal">Nature de produit</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <input 
                                    type="text"
                                    className="kt-input h-8 text-sm w-full"
                                    placeholder="Nature de produit"
                                    value={productNature}
                                    onChange={(e) => setProductNature(e.target.value)}
                                    required
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 text-secondary-foreground font-normal">Commentaire</td>
                                <td className="py-2 text-foreground font-normal text-sm">
                                  <input 
                                    type="text"
                                    className="kt-input h-8 text-sm w-full"
                                    placeholder="Commentaire"
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
                      <h3 className="kt-card-title">Options de colis</h3>
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
                              Colis fragile
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
                              Je souhaite definir tous mes colis comme fragiles
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
                              Je veux utiliser un carton
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
                        <h3 className="kt-card-title">Options carton</h3>
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
                                <span className="text-mono text-sm font-medium">Petit carton (S)</span>
                                <span className="text-xs text-secondary-foreground">Avec frais: 1.5 DH</span>
                                <span className="text-xs text-secondary-foreground">Carton box de petite taille.</span>
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
                                <span className="text-mono text-sm font-medium">Carton moyen (M)</span>
                                <span className="text-xs text-secondary-foreground">Avec frais: 2.5 DH</span>
                                <span className="text-xs text-secondary-foreground">Carton box de moyenne taille.</span>
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
                                <span className="text-mono text-sm font-medium">Grand carton (L)</span>
                                <span className="text-xs text-secondary-foreground">Avec frais: 3 DH</span>
                                <span className="text-xs text-secondary-foreground">Carton box de grande taille.</span>
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
            </>
          )}
        </div>

      </main>
    </DashboardLayout>
  );
}
