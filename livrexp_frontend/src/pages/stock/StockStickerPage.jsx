import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function StockStickerPage({ navigate, id, isVariant, showNotification }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStickerData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const url = isVariant
          ? `/api/stock/products/variant/${id}/sticker-data`
          : `/api/stock/products/${id}/sticker-data`;

        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          showNotification('error', 'Impossible de charger les données du sticker.');
        }
      } catch (e) {
        console.error(e);
        showNotification('error', 'Erreur de connexion avec le serveur.');
      } finally {
        setLoading(false);
      }
    };

    fetchStickerData();
  }, [id, isVariant]);

  if (loading) {
    return (
      <DashboardLayout activeMenu="stock_products">
        <main className="grow pt-5 dashboard-content-shift">
          <div className="kt-container-fixed">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout activeMenu="stock_products">
        <main className="grow pt-5 dashboard-content-shift">
          <div className="kt-container-fixed">
            <div className="text-center py-10">
              <p className="text-secondary-foreground">Aucune donnée trouvée pour ce sticker.</p>
              <button onClick={() => navigate('/stock/produits')} className="kt-btn kt-btn-primary mt-4">
                Retour aux produits
              </button>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="stock_products">
      <style>{`
        @media print {
          /* Hide everything except the print-area */
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 90mm;
            height: 50mm;
            margin: 0;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
          /* Prevent showing URL/headers/footers from browsers if possible */
          @page {
            size: 90mm 50mm;
            margin: 0;
          }
        }
        .sticker-card {
          width: 90mm;
          min-height: 50mm;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 14px 16px;
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 14px;
          align-items: start;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .sticker-card .qr {
          width: 100%;
          max-width: 150px;
          height: auto;
          image-rendering: pixelated;
          border-radius: 8px;
        }
        .sticker-card .code {
          font-size: 24px;
          letter-spacing: 1px;
          font-weight: 800;
          margin-top: 10px;
        }
      `}</style>

      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        <div className="kt-container-fixed">
          {/* Top Header Actions */}
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5 print:hidden">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                Sticker {isVariant ? 'variante' : 'produit'}
              </h1>
              <div className="text-sm text-secondary-foreground">
                {data.product_name} {data.variant_name && `— ${data.variant_name}`}
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => navigate('/stock/produits')} 
                className="kt-btn kt-btn-outline"
                type="button"
              >
                Retour
              </button>
              <button 
                className="kt-btn kt-btn-primary" 
                type="button" 
                onClick={() => window.print()}
              >
                Imprimer
              </button>
            </div>
          </div>

          {/* Sticker Preview Container */}
          <div className="flex justify-center py-10 print:py-0 print:block">
            <div id="print-area" className="sticker-card text-zinc-900 border-zinc-200 bg-white">
              <div>
                {data.qr_data_uri ? (
                  <img className="qr" alt="QR" src={data.qr_data_uri} />
                ) : (
                  <div className="text-secondary-foreground text-xs">QR indisponible</div>
                )}
              </div>
              <div className="flex flex-col justify-between h-full text-left">
                <div>
                  <div className="text-mono text-sm font-semibold truncate max-w-[160px]" title={data.product_name}>
                    {data.product_name}
                  </div>
                  <ul className="mt-2 text-mono text-xs text-zinc-600 list-disc pl-4 space-y-0.5">
                    {data.variant_name && <li>{data.variant_name}</li>}
                    <li>{data.barcode || '-'}</li>
                  </ul>
                </div>
                <div className="code text-mono text-zinc-900 font-extrabold leading-none truncate max-w-[160px]" title={data.barcode}>
                  {data.barcode || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
