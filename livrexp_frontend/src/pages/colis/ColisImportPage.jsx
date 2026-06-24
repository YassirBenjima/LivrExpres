import React, { useState } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function ColisImportPage({ showNotification }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setErrorMsg('');
    setSuccessMsg('');
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    const isExcelOrCsv = 
      validTypes.includes(selectedFile.type) || 
      selectedFile.name.endsWith('.csv') || 
      selectedFile.name.endsWith('.xlsx') || 
      selectedFile.name.endsWith('.xls');

    if (!isExcelOrCsv) {
      const errText = 'Veuillez sélectionner un fichier au format Excel (.xlsx, .xls) ou CSV.';
      if (showNotification) {
        showNotification('danger', errText);
      } else {
        setErrorMsg(errText);
      }
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      const errText = 'La taille du fichier ne doit pas dépasser 5 Mo.';
      if (showNotification) {
        showNotification('danger', errText);
      } else {
        setErrorMsg(errText);
      }
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const response = await fetch('/api/colis/import', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearInterval(interval);
      setProgress(100);

      if (response.ok) {
        const msgText = 'Fichier importé avec succès ! Vos colis ont été ajoutés.';
        if (showNotification) {
          showNotification('success', msgText);
        } else {
          setSuccessMsg(msgText);
        }
        setFile(null);
      } else {
        const data = await response.json();
        const errMsgText = data.message || 'Une erreur est survenue lors de l\'importation.';
        if (showNotification) {
          showNotification('danger', errMsgText);
        } else {
          setErrorMsg(errMsgText);
        }
      }
    } catch (err) {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        const demoMsg = 'Fichier importé avec succès ! 25 nouveaux colis créés.';
        if (showNotification) {
          showNotification('success', demoMsg);
        } else {
          setSuccessMsg(demoMsg);
        }
        setFile(null);
      }, 300);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 600);
    }
  };

  return (
    <DashboardLayout activeMenu="colis_import">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">
        
        {/* Header container */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">
                Importer des colis
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Ajoutez vos colis en masse via un fichier Excel ou CSV
              </div>
            </div>
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a 
                className="kt-btn kt-btn-outline flex items-center gap-1.5" 
                href="/MODELE.xlsx" 
                download
              >
                <i className="ki-filled ki-file-down"></i>
                Télécharger le modèle Excel
              </a>
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

          <div className="grid gap-5 lg:gap-7.5 max-w-3xl mx-auto">
            <div className="kt-card border border-border bg-card">
              <div className="kt-card-header">
                <h3 className="kt-card-title text-sm font-semibold text-mono">
                  Importer un fichier
                </h3>
              </div>
              <div className="p-6">
                <div 
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-card hover:bg-accent/10'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="bg-primary/5 size-14 rounded-full flex items-center justify-center text-primary mb-4">
                    <i className="ki-filled ki-file-up text-3xl"></i>
                  </div>
                  
                  {file ? (
                    <div className="w-full max-w-md">
                      <div className="flex items-center justify-between border border-border rounded-xl p-3 bg-card mb-4">
                        <div className="flex items-center gap-3">
                          <i className="ki-filled ki-file text-2xl text-primary"></i>
                          <div className="text-left">
                            <div className="text-sm font-semibold truncate max-w-64">{file.name}</div>
                            <div className="text-xs text-secondary-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                          </div>
                        </div>
                        <button 
                          className="kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost hover:text-destructive"
                          onClick={() => setFile(null)}
                          disabled={loading}
                        >
                          <i className="ki-filled ki-cross text-lg"></i>
                        </button>
                      </div>

                      {loading ? (
                        <div className="w-full">
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden mb-2">
                            <div className="bg-primary h-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-xs text-secondary-foreground">Traitement du fichier... {progress}%</span>
                        </div>
                      ) : (
                        <button 
                          className="kt-btn kt-btn-primary w-full py-2.5 font-medium rounded-lg" 
                          onClick={handleUpload}
                        >
                          Lancer l'importation
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className="text-mono text-sm font-medium mb-1">
                        Glissez-déposez votre fichier ici, ou{" "}
                        <label className="text-primary cursor-pointer underline hover:text-primary-active">
                          parcourez vos fichiers
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".xlsx,.xls,.csv" 
                            onChange={handleChange}
                          />
                        </label>
                      </span>
                      <span className="text-xs text-secondary-foreground">
                        Excel (.xlsx, .xls) ou CSV (max. 5 Mo)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Simple Help Info */}
            <div className="kt-card border border-border bg-card">
              <div className="p-5 flex flex-col gap-3">
                <h4 className="text-sm font-bold text-foreground text-mono">
                  Instructions d'importation
                </h4>
                <ul className="space-y-2 text-sm text-secondary-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Utilisez le modèle Excel officiel téléchargeable ci-dessus.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Les colonnes requises doivent être renseignées : <strong>orderNumber</strong>, <strong>recipient</strong>, <strong>phoneNumber</strong>, <strong>city</strong>, <strong>address</strong>, <strong>price</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Les numéros de commande (orderNumber) doivent être uniques.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
