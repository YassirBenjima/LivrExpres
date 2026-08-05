import React, { useState, useRef } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import { useLanguage } from '../../context/LanguageContext';

export default function StockProductNewPage({ navigate, showNotification }) {
  const { t } = useLanguage();

  const CATEGORIES = [
    { value: '1',  label: t('stockPage.catClothing',    'Vêtements & Accessoires') },
    { value: '2',  label: t('stockPage.catCameras',     'Caméras et optiques') },
    { value: '3',  label: t('stockPage.catElectronics', 'Électronique') },
    { value: '4',  label: t('stockPage.catHealth',      'Santé & Beauté') },
    { value: '5',  label: t('stockPage.catHome',        'Maison & Jardin') },
    { value: '6',  label: t('stockPage.catOffice',      'Fournitures de bureau') },
    { value: '7',  label: t('stockPage.catSports',      'Articles de sport') },
    { value: '8',  label: t('stockPage.catToys',        'Jouets') },
    { value: '9',  label: t('stockPage.catParts',       'Pièces') },
    { value: '10', label: t('stockPage.catPets',        'Animaux et fournitures pour animaux') },
    { value: '11', label: t('stockPage.catOther',       'Autres') },
  ];

  const [name, setName]                       = useState('');
  const [category, setCategory]               = useState('');
  const [barcode, setBarcode]                 = useState('');
  const [quantity, setQuantity]               = useState('');
  const [note, setNote]                       = useState('');
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variants, setVariants]               = useState([{ barcode: '', name: '', quantity: '' }]);
  const [photo, setPhoto]                     = useState(null);
  const [photoPreview, setPhotoPreview]       = useState('/assets/media/avatars/blank1.png');
  const [loading, setLoading]                 = useState(false);

  const fileInputRef = useRef(null);

  const triggerLocalNotification = (type, message) => {
    if (showNotification) {
      showNotification(type, message);
    }
  };

  const handlePreFillNormal = () => {
    setName('Produit Simple Démo');
    setCategory('1'); // Électronique
    setBarcode('SMPL1234');
    setQuantity('100');
    setNote('Ceci est un produit simple pré-rempli pour test.');
    setVariantsEnabled(false);

    // Fetch and pre-fill existing image
    fetch('/assets/media/images/600x600/1.jpg')
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'product-simple.jpg', { type: 'image/jpeg' });
        setPhoto(file);
        setPhotoPreview('/assets/media/images/600x600/1.jpg');
      })
      .catch(err => console.error('Failed to pre-fill image:', err));
  };

  const handlePreFillVariants = () => {
    setName('Produit Variantes Démo');
    setCategory('2'); // Mode & Vêtements
    setNote('Ceci est un produit avec variantes pré-rempli pour test.');
    setVariantsEnabled(true);
    setVariants([
      { barcode: 'VAR-ROUGE', name: 'Rouge / L', quantity: '50' },
      { barcode: 'VAR-BLEU', name: 'Bleu / M', quantity: '30' },
      { barcode: 'VAR-VERT', name: 'Vert / S', quantity: '20' }
    ]);

    // Fetch and pre-fill existing image
    fetch('/assets/media/images/600x600/3.jpg')
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'product-variants.jpg', { type: 'image/jpeg' });
        setPhoto(file);
        setPhotoPreview('/assets/media/images/600x600/3.jpg');
      })
      .catch(err => console.error('Failed to pre-fill image:', err));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setPhoto(null);
    setPhotoPreview('/assets/media/avatars/blank1.png');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContainerClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAddVariantRow = () => {
    setVariants([...variants, { barcode: '', name: '', quantity: '' }]);
  };

  const handleRemoveVariantRow = (index) => {
    if (index === 0) return;
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants(
      variants.map((v, idx) => {
        if (idx === index) {
          return { ...v, [field]: value };
        }
        return v;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) { triggerLocalNotification('error', t('stockPage.productNameRequired', 'Le nom du produit est obligatoire.')); return; }
    if (!category) { triggerLocalNotification('error', t('stockPage.categoryRequired', 'Veuillez choisir une catégorie valide.')); return; }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', category);
      formData.append('note', note);
      
      if (photo) {
        formData.append('photo', photo);
      }
      
      if (variantsEnabled) {
        formData.append('variants_enabled', '1');
        variants.forEach((v, idx) => {
          formData.append(`variants[${idx}][name]`, v.name);
          formData.append(`variants[${idx}][barcode]`, v.barcode);
          formData.append(`variants[${idx}][quantity]`, v.quantity || '0');
        });
      } else {
        formData.append('barcode', barcode);
        formData.append('quantity', quantity || '0');
      }

      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/stock/products', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        triggerLocalNotification('success', t('stockPage.productCreatedSuccess', 'Produit créé avec succès !'));
        setTimeout(() => navigate('/stock/produits'), 1200);
      } else {
        const data = await res.json();
        triggerLocalNotification('error', data.message || t('stockPage.error', 'Erreur.'));
      }
    } catch {
      triggerLocalNotification('error', t('stockPage.networkError', 'Erreur réseau.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activeMenu="stock_products_new">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">{t('stockPage.addProductTitle', 'Ajouter un produit')}</h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">{t('stockPage.addProductSubtitle', 'Créez un produit')}</div>
            </div>
            <div className="flex flex-col items-end gap-2.5">
              <div className="flex items-center gap-2.5">
                <button 
                  className="kt-btn kt-btn-outline" 
                  type="button" 
                  onClick={handlePreFillNormal}
                  style={{ borderColor: '#e4e6ef', backgroundColor: '#f5f8fa', color: '#3f4254' }}
                >
                  {t('stockPage.fillSimple', 'Remplir ( Simple )')}
                </button>
                <button 
                  className="kt-btn kt-btn-outline" 
                  type="button" 
                  onClick={handlePreFillVariants}
                  style={{ borderColor: '#e4e6ef', backgroundColor: '#f5f8fa', color: '#3f4254' }}
                >
                  {t('stockPage.fillVariant', 'Remplir ( Variante )')}
                </button>
                <button className="kt-btn kt-btn-outline" type="button" onClick={() => navigate('/stock/produits')}>{t('stockPage.backToList', 'Retour à la liste')}</button>
                <button className="kt-btn kt-btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? t('stockPage.saving', 'Enregistrement...') : t('stockPage.save', 'Enregistrer')}</button>
              </div>
            </div>
          </div>
        </div>

        <div className="kt-container-fixed">
          <form onSubmit={handleSubmit} id="product-new-form">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7.5">
              
              {/* Card 1: Informations du produit */}
              <div className="col-span-1">
                <div className="kt-card min-w-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">{t('stockPage.productInfoTitle', 'Informations du produit')}</h3>
                  </div>
                  <div className="kt-card-table pb-3" style={{ overflow: 'visible' }}>
                    <table className="kt-table align-middle text-sm text-muted-foreground">
                      <tbody>
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('stockPage.photoLabel', 'Photo')}</td>
                          <td className="py-2 text-secondary-foreground font-normal text-sm">{t('stockPage.photoHint', 'Image du produit (JPG/PNG)')}</td>
                          <td className="py-2">
                            <div className="flex justify-center items-center">
                              <div 
                                className="kt-image-input" 
                                style={{ 
                                  display: 'inline-block', 
                                  position: 'relative', 
                                  width: '64px', 
                                  height: '64px',
                                  cursor: 'pointer'
                                }}
                                onClick={handleContainerClick}
                              >
                                <input 
                                  ref={fileInputRef}
                                  accept=".png, .jpg, .jpeg" 
                                  type="file" 
                                  style={{ display: 'none' }} 
                                  onChange={handlePhotoChange} 
                                />
                                {photo && (
                                  <button 
                                    style={{
                                      position: 'absolute',
                                      top: '-6px',
                                      right: '-6px',
                                      width: '20px',
                                      height: '20px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid rgb(228, 228, 231)',
                                      borderRadius: '9999px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                      zIndex: 20
                                    }}
                                    onClick={handleRemovePhoto}
                                    type="button"
                                    title={t('common.delete', 'Supprimer')}
                                  >
                                    <i className="ki-filled ki-cross" style={{ fontSize: '10px', color: '#71717a' }}></i>
                                  </button>
                                )}
                                <div 
                                  className="kt-image-input-placeholder" 
                                  style={{
                                    border: '2px solid rgb(228, 228, 231)',
                                    borderRadius: '9999px',
                                    overflow: 'hidden',
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative'
                                  }}
                                >
                                  <div 
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      backgroundImage: `url('${photoPreview}')`
                                    }}
                                  />
                                  <div 
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      height: '20px',
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                      position: 'absolute'
                                    }}
                                  >
                                    <svg className="fill-border opacity-80" height="12" viewBox="0 0 14 12" width="14" xmlns="http://www.w3.org/2000/svg" style={{ fill: '#ffffff' }}>
                                      <path d="M11.6665 2.64585H11.2232C11.0873 2.64749 10.9538 2.61053 10.8382 2.53928C10.7225 2.46803 10.6295 2.36541 10.5698 2.24335L10.0448 1.19918C9.91266 0.931853 9.70808 0.707007 9.45438 0.550249C9.20068 0.393491 8.90806 0.311121 8.60984 0.312517H5.38984C5.09162 0.311121 4.799 0.393491 4.5453 0.550249C4.2916 0.707007 4.08701 0.931853 3.95484 1.19918L3.42984 2.24335C3.37021 2.36541 3.27716 2.46803 3.1615 2.53928C3.04584 2.61053 2.91234 2.64749 2.7765 2.64585H2.33317C1.90772 2.64585 1.49969 2.81486 1.19885 3.1157C0.898014 3.41654 0.729004 3.82457 0.729004 4.25002V10.0834C0.729004 10.5088 0.898014 10.9168 1.19885 11.2177C1.49969 11.5185 1.90772 11.6875 2.33317 11.6875H11.6665C12.092 11.6875 12.5 11.5185 12.8008 11.2177C13.1017 10.9168 13.2707 10.5088 13.2707 10.0834V4.25002C13.2707 3.82457 13.1017 3.41654 12.8008 3.1157C12.5 2.81486 12.092 2.64585 11.6665 2.64585ZM6.99984 9.64585C6.39413 9.64585 5.80203 9.46624 5.2984 9.12973C4.79478 8.79321 4.40225 8.31492 4.17046 7.75532C3.93866 7.19572 3.87802 6.57995 3.99618 5.98589C4.11435 5.39182 4.40602 4.84613 4.83432 4.41784C5.26262 3.98954 5.80831 3.69786 6.40237 3.5797C6.99644 3.46153 7.61221 3.52218 8.1718 3.75397C8.7314 3.98576 9.2097 4.37829 9.54621 4.88192C9.88272 5.38554 10.0623 5.97765 10.0623 6.58335C10.0608 7.3951 9.73765 8.17317 9.16365 8.74716C8.58965 9.32116 7.81159 9.64431 7 9.64585Z"></path>
                                      <path d="M7 8.77087C8.20812 8.77087 9.1875 7.7915 9.1875 6.58337C9.1875 5.37525 8.20812 4.39587 7 4.39587C5.79188 4.39587 4.8125 5.37525 4.8125 6.58337C4.8125 7.7915 5.79188 8.77087 7 8.77087Z"></path>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 min-w-36 text-secondary-foreground font-normal">{t('stockPage.productNameLabel', 'Nom du produit')}</td>
                          <td className="py-2">
                            <input 
                              type="text" 
                              className="kt-input h-8 text-sm w-full" 
                              placeholder={t('stockPage.productNamePlaceholder', 'Nom du produit')} 
                              value={name} 
                              onChange={e => setName(e.target.value)} 
                              required 
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">{t('stockPage.categoryLabel', 'Catégorie')}</td>
                          <td className="py-2">
                            <select 
                              className="kt-select w-full h-8 text-sm" 
                              value={category} 
                              onChange={e => setCategory(e.target.value)} 
                              required
                            >
                              <option value="" disabled>{t('stockPage.categoryPlaceholder', 'Choisir une catégorie')}</option>
                              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                          </td>
                        </tr>
                        
                        {!variantsEnabled && (
                          <>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">{t('stockPage.barcodeLabel', 'Votre Code Barre')}</td>
                              <td className="py-2">
                                <input 
                                  type="text" 
                                  className="kt-input h-8 text-sm w-full" 
                                  placeholder={t('stockPage.barcodePlaceholder', 'Code barre')} 
                                  value={barcode} 
                                  onChange={e => setBarcode(e.target.value)} 
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 text-secondary-foreground font-normal">{t('stockPage.qtyLabel', 'Quantité')}</td>
                              <td className="py-2">
                                <input 
                                  type="text" 
                                  className="kt-input h-8 text-sm w-full" 
                                  placeholder={t('stockPage.qtyPlaceholder', 'Quantité')} 
                                  value={quantity} 
                                  onChange={e => setQuantity(e.target.value.replace(/[^0-9]/g, ''))} 
                                  required 
                                />
                              </td>
                            </tr>
                          </>
                        )}
                        
                        <tr>
                          <td className="py-2 text-secondary-foreground font-normal">{t('stockPage.noteLabel', 'Note du produit')}</td>
                          <td className="py-2">
                            <input 
                              type="text" 
                              className="kt-input h-8 text-sm w-full" 
                              placeholder={t('stockPage.notePlaceholder', 'Note')} 
                              value={note} 
                              onChange={e => setNote(e.target.value)} 
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Card 2: Détails / Variantes */}
              <div className="col-span-1">
                <div className="kt-card min-w-full">
                  <div className="kt-card-header">
                    <h3 className="kt-card-title">{t('stockPage.detailsTab', 'Détails')}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-secondary-foreground select-none mr-2">{t('stockPage.variantsTab', 'Variantes')}</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          style={{ display: 'none' }} 
                          checked={variantsEnabled}
                          onChange={e => setVariantsEnabled(e.target.checked)}
                        />
                        <div style={{
                          width: '36px',
                          height: '20px',
                          backgroundColor: variantsEnabled ? '#3e97ff' : 'rgb(228, 228, 231)',
                          borderRadius: '9999px',
                          position: 'relative',
                          transition: 'background-color 0.2s',
                          border: '1px solid ' + (variantsEnabled ? '#3e97ff' : 'rgb(212, 212, 216)')
                        }}>
                          <div style={{
                            width: '14px',
                            height: '14px',
                            backgroundColor: 'rgb(255, 255, 255)',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '2px',
                            left: variantsEnabled ? '18px' : '2px',
                            transition: 'left 0.2s',
                            boxShadow: 'rgba(0, 0, 0, 0.15) 0px 1px 3px'
                          }} />
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="kt-card-table pb-3" style={{ overflow: 'visible' }}>
                    {variantsEnabled ? (
                      <div className="px-6 py-5">
                        <table className="kt-table align-middle text-sm text-muted-foreground">
                          <thead>
                            <tr className="text-secondary-foreground">
                              <th className="py-2 min-w-40 font-normal">{t('stockPage.barcodeLabel', 'Votre Code Barre')}</th>
                              <th className="py-2 min-w-44 font-normal">{t('stockPage.editVariantName', 'Nom de la variante')}</th>
                              <th className="py-2 min-w-28 font-normal">{t('stockPage.qtyLabel', 'Quantité')}</th>
                              <th className="py-2 w-[60px]"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {variants.map((v, idx) => (
                              <tr key={idx} className="variant-row">
                                <td className="py-2">
                                  <input 
                                    type="text" 
                                    className="kt-input h-8 text-sm w-full" 
                                    placeholder={t('stockPage.barcodePlaceholder', 'Code barre')} 
                                    value={v.barcode} 
                                    onChange={e => handleVariantChange(idx, 'barcode', e.target.value)} 
                                  />
                                </td>
                                <td className="py-2">
                                  <input 
                                    type="text" 
                                    className="kt-input h-8 text-sm w-full" 
                                    placeholder={t('stockPage.editVariantNamePlaceholder', 'Nom de la variante')} 
                                    value={v.name} 
                                    onChange={e => handleVariantChange(idx, 'name', e.target.value)} 
                                  />
                                </td>
                                <td className="py-2">
                                  <input 
                                    type="text" 
                                    className="kt-input h-8 text-sm w-full" 
                                    placeholder="0" 
                                    value={v.quantity} 
                                    onChange={e => handleVariantChange(idx, 'quantity', e.target.value.replace(/[^0-9]/g, ''))} 
                                  />
                                </td>
                                <td className="py-2 text-end">
                                  {idx > 0 ? (
                                    <button 
                                      className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost kt-btn-destructive" 
                                      onClick={() => handleRemoveVariantRow(idx)} 
                                      type="button" 
                                      title={t('common.delete', 'Supprimer')}
                                    >
                                      <i className="ki-filled ki-trash"></i>
                                    </button>
                                  ) : (
                                    <span className="text-xs text-secondary-foreground select-none">&nbsp;</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="pt-4 flex justify-end pr-2">
                          <button 
                            className="kt-btn kt-btn-outline kt-btn-primary" 
                            type="button" 
                            onClick={handleAddVariantRow}
                          >
                            <i className="ki-filled ki-plus"></i>
                            {t('stockPage.editAddVariant', 'Ajouter une variante')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 py-5 text-sm text-secondary-foreground">
                        &nbsp;
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>

    </DashboardLayout>
  );
}
