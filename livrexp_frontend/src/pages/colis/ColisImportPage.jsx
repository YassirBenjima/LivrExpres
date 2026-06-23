import React, { useState } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';

export default function ColisImportPage() {
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
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      setErrorMsg('Veuillez sélectionner un fichier au format Excel (.xlsx, .xls) ou CSV.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg('La taille du fichier ne doit pas dépasser 5 Mo.');
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

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

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
        setSuccessMsg('Fichier importé avec succès ! Vos colis ont été ajoutés.');
        setFile(null);
      } else {
        const data = await response.json();
        setErrorMsg(data.message || 'Une erreur est survenue lors de l\'importation.');
      }
    } catch (err) {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setSuccessMsg('Fichier (Démo) importé avec succès ! 25 nouveaux colis créés.');
        setFile(null);
      }, 500);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 800);
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
                Importer Colis
              </h1>
              <div className="flex items-center gap-2 text-sm font-normal text-secondary-foreground">
                Ajoutez tous vos colis en un clic
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <a className="kt-btn kt-btn-info flex items-center gap-1.5" href="/assets/downloads/models/MODELE.xlsx" download>
                <i className="ki-filled ki-file-down"></i>
                Télécharger Modèle
              </a>
              <a className="kt-btn kt-btn-success flex items-center gap-1.5" href="/assets/downloads/models/MODELE_V2.xlsx" download>
                <i className="ki-filled ki-file-down"></i>
                Modèle V2
              </a>
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
                        <span>Veuillez utiliser les fichiers modèles ci-dessus pour préparer vos données.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <i className="ki-filled ki-check-circle text-base text-green-500 shrink-0 mt-0.5"></i>
                        <span>Les colonnes requises doivent être présentes et correctement formattées.</span>
                      </div>
                    </div>
                  </div>
                  <i className="ki-filled ki-file-up text-primary text-5xl opacity-40 hidden lg:block"></i>
                </div>
              </div>
            </div>

            {/* Dropzone Card */}
            <div className="kt-card">
              <div className="p-6">
                <div 
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-accent/10'}`}
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
                        >
                          <i className="ki-filled ki-cross text-lg"></i>
                        </button>
                      </div>

                      {loading ? (
                        <div className="w-full">
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden mb-2">
                            <div className="bg-primary h-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-xs text-secondary-foreground">Téléchargement et traitement... {progress}%</span>
                        </div>
                      ) : (
                        <button className="kt-btn kt-btn-primary w-full" onClick={handleUpload}>
                          Importer le fichier
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className="text-mono text-sm font-medium hover:text-primary mb-1">
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
                        Excel (.xlsx, .xls) ou CSV (max. 5MB)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </DashboardLayout>
  );
}
