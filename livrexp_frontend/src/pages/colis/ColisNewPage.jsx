import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function ColisNewPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [type, setType] = useState('');
  const [recipient, setRecipient] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [replacePackage, setReplacePackage] = useState(false);
  const [oldColis, setOldColis] = useState('');
  const [packageOption, setPackageOption] = useState('');
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
      const response = await fetch('/api/colis/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccessMsg('Colis ajouté avec succès !');
        // Reset form
        setOrderNumber('');
        setType('');
        setRecipient('');
        setCity('');
        setAddress('');
        setPrice('');
        setReplacePackage(false);
        setOldColis('');
        setPackageOption('');
        setPhoneNumber('');
        setNeighborhood('');
        setProductNature('');
        setComment('');
        setFragile(false);
        setAllFragile(false);
        setUseCarton(false);
        setCartonOption('');
      } else {
        const errData = await response.json();
        setErrorMsg(errData.message || 'Une erreur est survenue lors de l\'ajout.');
      }
    } catch (err) {
      console.warn('API error, simulating successful creation locally...', err);
      setSuccessMsg('Colis (Démo) ajouté avec succès !');
      // Reset form
      setOrderNumber('');
      setType('');
      setRecipient('');
      setCity('');
      setAddress('');
      setPrice('');
      setReplacePackage(false);
      setOldColis('');
      setPackageOption('');
      setPhoneNumber('');
      setNeighborhood('');
      setProductNature('');
      setComment('');
      setFragile(false);
      setAllFragile(false);
      setUseCarton(false);
      setCartonOption('');
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
                Ajouter un colis
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Ajoutez tous vos colis en un clic
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <a className="kt-btn kt-btn-outline" href="/colis/">
                Retour à la liste
              </a>
              <button 
                className="kt-btn kt-btn-primary" 
                onClick={handleSubmit} 
                disabled={loading}
              >
                {loading ? 'Ajout en cours...' : 'Ajouter le colis'}
              </button>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="kt-container-fixed">
          {successMsg && (
            <div className="bg-success/15 border border-success/30 text-success text-sm rounded-xl p-4 mb-5 flex items-center gap-3">
              <i className="ki-filled ki-check-circle text-lg"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm rounded-xl p-4 mb-5 flex items-center gap-3">
              <i className="ki-filled ki-information-2 text-lg"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:gap-7.5">
            
            {/* Info Card */}
            <div className="kt-card">
              <div className="kt-card-content px-6 py-5 sm:px-10 sm:py-7.5">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex flex-col items-start gap-3 w-full lg:max-w-[70%]">
                    <h2 className="text-lg font-semibold text-mono">
                      Informations
                    </h2>
                    <div className="grid grid-cols-1 gap-2 w-full text-sm text-secondary-foreground">
                      <div className="flex items-start gap-2">
                        <i className="ki-filled ki-check-circle text-base text-green-500 shrink-0 mt-0.5"></i>
                        <span>Pour assurer une livraison rapide de vos commandes, veuillez inclure l'adresse complète ou le quartier du client à l'intérieur du colis.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <i className="ki-filled ki-check-circle text-base text-green-500 shrink-0 mt-0.5"></i>
                        <span>Pour les colis d'un poids supérieur à 5 kg ou d'une longueur excédant 30 cm, des frais supplémentaires seront ajoutés.</span>
                      </div>
                    </div>
                  </div>
                  <i className="ki-filled ki-information text-primary text-5xl opacity-40 hidden lg:block"></i>
                </div>
              </div>
            </div>

            {/* Form grid */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
              
              {/* Left Side: General Info */}
              <div className="kt-card min-w-full">
                <div className="kt-card-header">
                  <h3 className="kt-card-title">Informations du colis</h3>
                </div>
                <div className="p-6">
                  <div className="grid gap-4">
                    
                    {/* Order Number */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">N° Commande</label>
                      <input 
                        type="text"
                        className="kt-input grow"
                        placeholder="№ Commande"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        required
                      />
                    </div>

                    {/* Type */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">Type de Colis</label>
                      <select 
                        className="kt-select grow"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        required
                      >
                        <option value="">Choisir un type</option>
                        <option value="simple">Simple</option>
                        <option value="stock">Stocké</option>
                      </select>
                    </div>

                    {/* Recipient */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">Destinataire</label>
                      <input 
                        type="text"
                        className="kt-input grow"
                        placeholder="Nom complet"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        required
                      />
                    </div>

                    {/* City */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">Ville</label>
                      <select 
                        className="kt-select grow"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      >
                        <option value="">Choisir une ville</option>
                        {cities.map(c => (
                          <option key={c} value={c.toLowerCase()}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Address */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">Adresse</label>
                      <input 
                        type="text"
                        className="kt-input grow"
                        placeholder="Adresse complète"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>

                    {/* Price */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">Prix (MAD)</label>
                      <input 
                        type="number"
                        className="kt-input grow"
                        placeholder="Montant en DH"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>

                  </div>
                </div>
              </div>

              {/* Right Side: Supplementary Info & Options */}
              <div className="grid gap-5 lg:gap-7.5">
                
                {/* Complementary Info Card */}
                <div className="kt-card min-w-full">
                  <div className="kt-card-header flex justify-between items-center">
                    <h3 className="kt-card-title">Informations complémentaires</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-secondary-foreground">Colis à remplacer</span>
                      <button 
                        type="button"
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${replacePackage ? 'bg-primary' : 'bg-input'}`}
                        onClick={() => setReplacePackage(!replacePackage)}
                      >
                        <span className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${replacePackage ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4">
                      
                      {/* Old Colis to Replace (Conditional) */}
                      {replacePackage && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">Ancien Colis</label>
                          <select 
                            className="kt-select grow"
                            value={oldColis}
                            onChange={(e) => setOldColis(e.target.value)}
                            required
                          >
                            <option value="">Choisir un colis à remplacer</option>
                            <option value="F-20260622-0001">F-20260622-0001 (Sac à Main)</option>
                          </select>
                        </div>
                      )}

                      {/* Phone Number */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">Téléphone</label>
                        <input 
                          type="tel"
                          className="kt-input grow"
                          placeholder="№ de téléphone"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>

                      {/* Neighborhood */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">Quartier</label>
                        <input 
                          type="text"
                          className="kt-input grow"
                          placeholder="Quartier"
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                        />
                      </div>

                      {/* Product Nature */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">Nature Produit</label>
                        <input 
                          type="text"
                          className="kt-input grow"
                          placeholder="Ex: Vêtements, Électronique"
                          value={productNature}
                          onChange={(e) => setProductNature(e.target.value)}
                        />
                      </div>

                      {/* Comment */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="text-sm font-medium text-secondary-foreground sm:w-1/3">Commentaire</label>
                        <input 
                          type="text"
                          className="kt-input grow"
                          placeholder="Commentaires ou instructions"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                      </div>

                    </div>
                  </div>
                </div>

                {/* Colis Options Card */}
                <div className="kt-card">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">Options de colis</h3>
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    
                    {/* Fragile option */}
                    <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/5 size-10 rounded-lg flex items-center justify-center text-primary">
                          <i className="ki-filled ki-shield-cross text-lg"></i>
                        </div>
                        <span className="text-sm font-medium">Colis fragile</span>
                      </div>
                      <button 
                        type="button" 
                        className={`kt-btn kt-btn-sm kt-btn-icon rounded-full border ${fragile ? 'bg-primary border-primary text-white' : 'border-input hover:bg-accent'}`}
                        onClick={() => setFragile(!fragile)}
                      >
                        <i className="ki-filled ki-check text-xs"></i>
                      </button>
                    </div>

                    {/* All Fragile Option */}
                    <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-50 size-10 rounded-lg flex items-center justify-center text-yellow-600">
                          <i className="ki-filled ki-shield-tick text-lg"></i>
                        </div>
                        <span className="text-sm font-medium">Définir tous mes colis comme fragiles</span>
                      </div>
                      <button 
                        type="button" 
                        className={`kt-btn kt-btn-sm kt-btn-icon rounded-full border ${allFragile ? 'bg-primary border-primary text-white' : 'border-input hover:bg-accent'}`}
                        onClick={() => setAllFragile(!allFragile)}
                      >
                        <i className="ki-filled ki-check text-xs"></i>
                      </button>
                    </div>

                    {/* Use Carton Option */}
                    <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-50 size-10 rounded-lg flex items-center justify-center text-green-600">
                          <i className="ki-filled ki-archive text-lg"></i>
                        </div>
                        <span className="text-sm font-medium">Je veux utiliser un carton</span>
                      </div>
                      <button 
                        type="button" 
                        className={`kt-btn kt-btn-sm kt-btn-icon rounded-full border ${useCarton ? 'bg-primary border-primary text-white' : 'border-input hover:bg-accent'}`}
                        onClick={() => setUseCarton(!useCarton)}
                      >
                        <i className="ki-filled ki-check text-xs"></i>
                      </button>
                    </div>

                    {/* Carton Options Choice (Conditional) */}
                    {useCarton && (
                      <div className="grid gap-3 pt-2 pl-4 border-l-2 border-border">
                        <div 
                          className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer ${cartonOption === 's' ? 'border-primary bg-primary/5' : 'border-border'}`}
                          onClick={() => setCartonOption('s')}
                        >
                          <div>
                            <div className="text-sm font-semibold">Petit carton (S)</div>
                            <div className="text-xs text-secondary-foreground">Frais additionnels: 1.5 DH</div>
                          </div>
                          {cartonOption === 's' && <i className="ki-filled ki-check text-primary text-lg"></i>}
                        </div>

                        <div 
                          className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer ${cartonOption === 'm' ? 'border-primary bg-primary/5' : 'border-border'}`}
                          onClick={() => setCartonOption('m')}
                        >
                          <div>
                            <div className="text-sm font-semibold">Carton moyen (M)</div>
                            <div className="text-xs text-secondary-foreground">Frais additionnels: 2.5 DH</div>
                          </div>
                          {cartonOption === 'm' && <i className="ki-filled ki-check text-primary text-lg"></i>}
                        </div>

                        <div 
                          className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer ${cartonOption === 'l' ? 'border-primary bg-primary/5' : 'border-border'}`}
                          onClick={() => setCartonOption('l')}
                        >
                          <div>
                            <div className="text-sm font-semibold">Grand carton (L)</div>
                            <div className="text-xs text-secondary-foreground">Frais additionnels: 3.0 DH</div>
                          </div>
                          {cartonOption === 'l' && <i className="ki-filled ki-check text-primary text-lg"></i>}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </form>

          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
