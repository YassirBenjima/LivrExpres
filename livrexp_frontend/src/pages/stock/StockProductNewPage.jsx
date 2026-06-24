import React, { useState } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

const CATEGORIES = [
  { value: '1', label: 'Électronique' },
  { value: '2', label: 'Vêtements' },
  { value: '3', label: 'Chaussures' },
  { value: '4', label: 'Accessoires' },
  { value: '5', label: 'Beauté & Santé' },
  { value: '6', label: 'Maison & Jardin' },
  { value: '7', label: 'Sport & Loisirs' },
  { value: '8', label: 'Jouets & Enfants' },
  { value: '9', label: 'Alimentation' },
  { value: '10', label: 'Auto & Moto' },
  { value: '11', label: 'Autre' },
];

export default function StockProductNewPage({ navigate, showNotification }) {
  const [name, setName]         = useState('');
  const [category, setCategory] = useState('');
  const [barcode, setBarcode]   = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote]         = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) { if (showNotification) showNotification('error', 'Le nom est obligatoire.'); return; }
    if (!category) { if (showNotification) showNotification('error', 'Choisir une catégorie.'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', category);
      formData.append('barcode', barcode);
      formData.append('quantity', quantity || '0');
      formData.append('note', note);
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/stock/products', {
        method: 'POST', body: formData,
        headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        if (showNotification) showNotification('success', 'Produit créé avec succès !');
        setTimeout(() => navigate('/stock/produits'), 1200);
      } else {
        const data = await res.json();
        if (showNotification) showNotification('error', data.message || 'Erreur.');
      }
    } catch { if (showNotification) showNotification('error', 'Erreur réseau.'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout activeMenu="stock_products_new">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">Ajouter un produit</h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">Créez un nouveau produit dans votre stock</div>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="kt-btn kt-btn-outline" onClick={() => navigate('/stock/produits')}>Retour à la liste</button>
              <button className="kt-btn kt-btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
        <div className="kt-container-fixed">
          <form onSubmit={handleSubmit}>
            <div className="kt-card min-w-full">
              <div className="kt-card-header"><h3 className="kt-card-title">Informations du produit</h3></div>
              <div className="kt-card-table pb-3" style={{ overflow: 'visible' }}>
                <table className="kt-table align-middle text-sm text-muted-foreground">
                  <tbody>
                    <tr>
                      <td className="py-2 min-w-36 text-secondary-foreground font-normal">Nom du produit *</td>
                      <td className="py-2"><input type="text" className="kt-input h-8 text-sm w-full" placeholder="Nom du produit" value={name} onChange={e => setName(e.target.value)} required /></td>
                    </tr>
                    <tr>
                      <td className="py-2 text-secondary-foreground font-normal">Catégorie *</td>
                      <td className="py-2">
                        <select className="kt-select w-full h-8 text-sm" value={category} onChange={e => setCategory(e.target.value)} required>
                          <option value="">Choisir une catégorie</option>
                          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-secondary-foreground font-normal">Code-barres</td>
                      <td className="py-2"><input type="text" className="kt-input h-8 text-sm w-full" placeholder="Optionnel" value={barcode} onChange={e => setBarcode(e.target.value)} /></td>
                    </tr>
                    <tr>
                      <td className="py-2 text-secondary-foreground font-normal">Quantité initiale</td>
                      <td className="py-2"><input type="number" min="0" className="kt-input h-8 text-sm w-full" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} /></td>
                    </tr>
                    <tr>
                      <td className="py-2 text-secondary-foreground font-normal">Note</td>
                      <td className="py-2"><input type="text" className="kt-input h-8 text-sm w-full" placeholder="Note interne (optionnel)" value={note} onChange={e => setNote(e.target.value)} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </div>
      </main>
    </DashboardLayout>
  );
}
