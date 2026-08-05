import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';
import { useLanguage } from '../../context/LanguageContext';

export default function TrackingWhatsappTemplatePage({ navigate, showNotification }) {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState(null);

  const allowedPlaceholders = ['@name', '@product', '@address', '@numLivreur'];
  const messageHardLimit = 2000;
  const messageSoftLimit = 400;

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/suivi/modele-whatsapp?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || data || []);
      }
    } catch (err) {
      console.error('Erreur chargement modèles WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const handleDocumentClick = () => setActiveDropdownId(null);
    window.addEventListener('click', handleDocumentClick);
    return () => window.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showNotification?.('error', t('whatsappTracking.fillRequired', 'Veuillez remplir le titre et le message.'));
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingId ? `/api/suivi/modele-whatsapp/${editingId}` : '/api/suivi/modele-whatsapp';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ title, message })
      });

      const data = await res.json();
      if (res.ok) {
        showNotification?.('success', editingId ? t('whatsappTracking.updateSuccess', 'Modèle mis à jour.') : t('whatsappTracking.createSuccess', 'Modèle créé.'));
        setTitle('');
        setMessage('');
        setEditingId(null);
        fetchTemplates();
      } else {
        showNotification?.('error', data.message || t('whatsappTracking.saveError', 'Erreur lors de l\'enregistrement.'));
      }
    } catch (err) {
      showNotification?.('error', t('whatsappTracking.connectionError', 'Erreur de connexion.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (tmpl) => {
    setEditingId(tmpl.id);
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setActiveDropdownId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
  };

  const handleToggleStatus = async (tmpl) => {
    setActiveDropdownId(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/suivi/modele-whatsapp/${tmpl.id}/status`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok) {
        showNotification?.('success', t('whatsappTracking.statusUpdated', 'Statut mis à jour.'));
        fetchTemplates();
      } else {
        showNotification?.('error', data.message || t('whatsappTracking.statusUpdateError', 'Erreur lors du changement de statut.'));
      }
    } catch (err) {
      showNotification?.('error', t('whatsappTracking.connectionError', 'Erreur de connexion.'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTemplateId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/suivi/modele-whatsapp/${deleteTemplateId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok) {
        showNotification?.('success', t('whatsappTracking.deleteSuccess', 'Modèle supprimé.'));
        setDeleteTemplateId(null);
        fetchTemplates();
      } else {
        showNotification?.('error', data.message || t('whatsappTracking.deleteError', 'Erreur lors de la suppression.'));
      }
    } catch (err) {
      showNotification?.('error', t('whatsappTracking.connectionError', 'Erreur de connexion.'));
    }
  };

  const filteredTemplates = templates.filter(tmpl => {
    const matchesSearch = !searchQuery ? true : [tmpl.title, tmpl.message].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter ? true : tmpl.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="py-4">
          <div
            style={{
              height: '14px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, var(--accent) 25%, var(--border) 50%, var(--accent) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
              width: i === 0 ? '120px' : i === 3 ? '70px' : i === 4 ? '40px' : '90%',
            }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <DashboardLayout activeMenu="suivi_whatsapp_template">
      <main className="grow pt-5 dashboard-content-shift" id="content" role="content">

        {/* Page Title & Guidelines */}
        <div className="kt-container-fixed">
          <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-xl font-medium leading-none text-mono">{t('whatsappTracking.pageTitle', 'Suivi par Whatsapp')}</h1>
              <div className="text-sm font-normal text-secondary-foreground">
                {t('whatsappTracking.placeholdersHelp', 'Utilisez les placeholders dans votre message: @name, @product, @address, @numLivreur.')}
              </div>
              <div className="text-2sm text-secondary-foreground">
                <span className="font-medium text-foreground">{t('whatsappTracking.exampleLabel', 'Exemple:')}</span> {t('whatsappTracking.exampleText', "Bonjour @name, on n'est pas arrivé à vous joindre par appel pour livrer votre produit @product, on a expédié votre colis depuis Casablanca jusqu'à @address, merci d'appeler notre livreur sur @numLivreur...")}
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="kt-container-fixed">
          <div className="kt-card border border-border/60 mb-5">
            <div className="kt-card-content p-4 lg:p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {editingId ? t('whatsappTracking.editTitle', 'Modifier le modèle WhatsApp') : t('whatsappTracking.createTitle', 'Créer un modèle WhatsApp')}
                </h3>
                {editingId && (
                  <button type="button" className="kt-btn kt-btn-outline" onClick={handleCancelEdit}>
                    {t('whatsappTracking.cancelEdit', 'Annuler la modification')}
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-mono">{t('whatsappTracking.titleLabel', 'Titre')}</label>
                  <input
                    type="text"
                    className="kt-input"
                    placeholder={t('whatsappTracking.titlePlaceholder', 'Titre du modèle...')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-mono">{t('whatsappTracking.messageLabel', 'Message')}</label>
                  <textarea
                    className="kt-textarea"
                    rows={4}
                    placeholder={t('whatsappTracking.messagePlaceholder', 'Rédigez le message du modèle...')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <div className="flex items-center justify-between flex-wrap gap-2 text-2sm text-secondary-foreground">
                    <span>{t('whatsappTracking.allowedPlaceholders', 'Placeholders autorisés:')} {allowedPlaceholders.join(', ')}</span>
                    <span>{message.length}/{messageHardLimit}</span>
                  </div>
                  {message.length > messageSoftLimit && (
                    <div className="text-2sm text-warning">
                      {t('whatsappTracking.longMessageWarning', 'Message long: vérifiez que WhatsApp affiche correctement tout le texte.')}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button className="kt-btn kt-btn-primary w-full lg:w-auto" type="submit" disabled={submitting}>
                    {submitting ? t('whatsappTracking.savingBtn', 'Enregistrement...') : (editingId ? t('whatsappTracking.saveBtn', 'Enregistrer') : t('whatsappTracking.newBtn', 'Nouveau'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="kt-container-fixed">
          <div className="kt-card kt-card-grid min-w-full">
            
            {/* Header / Search / Filter */}
            <div className="kt-card-header flex-wrap gap-2">
              <h3 className="kt-card-title text-sm">
                {t('whatsappTracking.showingCount', 'Affichage de')} {filteredTemplates.length} {t('whatsappTracking.templatesCount', 'modèle(s)')}
              </h3>
              <div className="flex flex-wrap gap-2 lg:gap-5">
                <div className="flex">
                  <label className="kt-input">
                    <i className="ki-filled ki-magnifier"></i>
                    <input
                      type="text"
                      placeholder={t('whatsappTracking.searchPlaceholder', 'Rechercher un modèle...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <KtSelect
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    placeholder={t('whatsappTracking.allStatuses', 'Tous les statuts')}
                    className="w-36"
                    options={[
                      { value: '', label: t('whatsappTracking.allStatuses', 'Tous les statuts') },
                      { value: 'active', label: t('whatsappTracking.statusActive', 'Activé') },
                      { value: 'inactive', label: t('whatsappTracking.statusInactive', 'Désactivé') },
                      { value: 'default', label: t('whatsappTracking.statusDefault', 'Default') }
                    ]}
                  />
                  <button
                    className="kt-btn kt-btn-outline"
                    type="button"
                    onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
                  >
                    {t('whatsappTracking.resetBtn', 'Réinitialiser')}
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="kt-card-content">
              <div className="kt-scrollable-x-auto">
                <table className="kt-table table-auto kt-table-border">
                  <thead>
                    <tr>
                      <th className="min-w-[180px]">{t('whatsappTracking.colTitle', 'Titre')}</th>
                      <th className="min-w-[220px]">{t('whatsappTracking.colMessage', 'Message')}</th>
                      <th className="min-w-[170px]">{t('whatsappTracking.colCreationDate', 'Date de création')}</th>
                      <th className="min-w-[130px]">{t('whatsappTracking.colStatus', 'Statut')}</th>
                      <th className="w-[90px] text-center">{t('whatsappTracking.colActions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                    ) : filteredTemplates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-secondary-foreground text-center py-8">
                          {t('whatsappTracking.noTemplateFound', 'Aucun modèle WhatsApp trouvé.')}
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates.map((tmpl) => {
                        const isDefault = tmpl.isDefault;
                        const isActive = tmpl.status === 'active';
                        const statusClass = isActive ? 'kt-badge-success' : 'kt-badge-destructive';
                        const statusLabel = isActive ? t('whatsappTracking.statusActive', 'Activé') : t('whatsappTracking.statusInactive', 'Désactivé');

                        return (
                          <tr key={tmpl.id}>
                            <td className="text-foreground font-medium">{tmpl.title}</td>
                            <td className="text-foreground font-normal">
                              <span className="truncate inline-block max-w-[220px]" title={tmpl.message}>
                                {tmpl.message}
                              </span>
                            </td>
                            <td className="text-foreground font-normal">{tmpl.createdAt || '-'}</td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                {isDefault && (
                                  <span className="kt-badge kt-badge-info kt-badge-outline rounded-[30px]">
                                    <span className="kt-badge-dot size-1.5"></span>
                                    Default
                                  </span>
                                )}
                                <span className={`kt-badge ${statusClass} kt-badge-outline rounded-[30px]`}>
                                  <span className="kt-badge-dot size-1.5"></span>
                                  {statusLabel}
                                </span>
                              </div>
                            </td>
                            <td className="text-center relative">
                              <div className="inline-block text-left">
                                <button
                                  type="button"
                                  className="kt-menu-toggle kt-btn kt-btn-sm kt-btn-icon kt-btn-ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.right + window.scrollX - 180 });
                                    setActiveDropdownId(activeDropdownId === tmpl.id ? null : tmpl.id);
                                  }}
                                >
                                  <i className="ki-filled ki-dots-vertical text-lg"></i>
                                </button>

                                {activeDropdownId === tmpl.id && dropdownPos && createPortal(
                                  <div
                                    className="kt-menu-dropdown kt-menu-default fixed w-[180px]"
                                    style={{
                                      position: 'fixed',
                                      top: `${dropdownPos.top - window.scrollY}px`,
                                      left: `${dropdownPos.left - window.scrollX}px`,
                                      zIndex: 99999,
                                      display: 'block'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {isDefault ? (
                                      <>
                                        <div className="kt-menu-item">
                                          <button className="kt-menu-link text-start w-full opacity-60 cursor-not-allowed" type="button" disabled>
                                            <span className="kt-menu-icon"><i className="ki-filled ki-lock-2"></i></span>
                                            <span className="kt-menu-title text-xs">{t('whatsappTracking.lockedEdit', 'Modif. verrouillée')}</span>
                                          </button>
                                        </div>
                                        <div className="kt-menu-item">
                                          <button className="kt-menu-link text-start w-full opacity-60 cursor-not-allowed" type="button" disabled>
                                            <span className="kt-menu-icon"><i className="ki-filled ki-lock-2"></i></span>
                                            <span className="kt-menu-title text-xs">{t('whatsappTracking.lockedStatus', 'Statut verrouillé')}</span>
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="kt-menu-item">
                                          <button
                                            type="button"
                                            className="kt-menu-link text-start w-full"
                                            onClick={() => handleEdit(tmpl)}
                                          >
                                            <span className="kt-menu-icon"><i className="ki-filled ki-pencil"></i></span>
                                            <span className="kt-menu-title">{t('whatsappTracking.actionEdit', 'Modifier')}</span>
                                          </button>
                                        </div>

                                        <div className="kt-menu-item">
                                          <button
                                            type="button"
                                            className="kt-menu-link text-start w-full"
                                            onClick={() => handleToggleStatus(tmpl)}
                                          >
                                            <span className="kt-menu-icon"><i className="ki-filled ki-arrows-circle"></i></span>
                                            <span className="kt-menu-title">{isActive ? t('whatsappTracking.actionDeactivate', 'Désactiver') : t('whatsappTracking.actionActivate', 'Activer')}</span>
                                          </button>
                                        </div>

                                        <div className="kt-menu-item">
                                          <button
                                            type="button"
                                            className="kt-menu-link text-start w-full text-destructive hover:!bg-red-50 dark:hover:!bg-red-950/30 hover:!text-red-600 dark:hover:!text-red-400"
                                            onClick={() => { setActiveDropdownId(null); setDeleteTemplateId(tmpl.id); }}
                                          >
                                            <span className="kt-menu-icon text-destructive"><i className="ki-filled ki-trash"></i></span>
                                            <span className="kt-menu-title text-destructive">{t('whatsappTracking.actionDelete', 'Supprimer')}</span>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>,
                                  document.body
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* Delete Confirmation Modal (Centered Portal) */}
        {deleteTemplateId && createPortal(
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 99999,
              padding: '16px',
              animation: 'fadeIn 0.15s ease-out'
            }}
            onClick={() => setDeleteTemplateId(null)}
          >
            <div 
              className="bg-white dark:bg-zinc-950 border rounded-lg shadow-xl overflow-hidden" 
              style={{ width: '100%', maxWidth: '440px', borderColor: 'var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div 
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <h3 className="text-base font-semibold text-foreground">{t('whatsappTracking.deleteTitle', 'Supprimer le modèle')}</h3>
                <button 
                  type="button"
                  onClick={() => setDeleteTemplateId(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <i className="ki-filled ki-cross text-lg"></i>
                </button>
              </div>

              {/* Content & Actions */}
              <div className="p-5">
                <div 
                  className="flex gap-3 border rounded-lg p-4 mb-5"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <i className="ki-filled ki-information-2 text-red-600 text-xl shrink-0 mt-0.5"></i>
                  <div className="text-sm text-foreground leading-relaxed">
                    {t('whatsappTracking.deleteConfirm', 'Vous êtes sur le point de supprimer le modèle')}. {t('whatsappTracking.irreversibleText', 'Cette action est irréversible et supprimera définitivement le modèle de la base de données.')}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button 
                    type="button" 
                    onClick={() => setDeleteTemplateId(null)} 
                    className="kt-btn kt-btn-outline"
                  >
                    {t('whatsappTracking.cancel', 'Annuler')}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    className="kt-btn kt-btn-destructive"
                  >
                    {t('whatsappTracking.actionDelete', 'Supprimer')}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      </main>
    </DashboardLayout>
  );
}
