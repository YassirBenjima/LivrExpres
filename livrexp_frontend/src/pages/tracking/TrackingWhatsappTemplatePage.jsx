import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/ui/DashboardLayout';
import KtSelect from '../../components/ui/KtSelect';

export default function TrackingWhatsappTemplatePage({ navigate, showNotification }) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showNotification?.('error', 'Veuillez remplir le titre et le message.');
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
        showNotification?.('success', data.message || (editingId ? 'Modèle mis à jour.' : 'Modèle créé.'));
        setTitle('');
        setMessage('');
        setEditingId(null);
        fetchTemplates();
      } else {
        showNotification?.('error', data.message || 'Erreur lors de l\'enregistrement.');
      }
    } catch (err) {
      showNotification?.('error', 'Erreur de connexion.');
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
        showNotification?.('success', data.message || 'Statut mis à jour.');
        fetchTemplates();
      } else {
        showNotification?.('error', data.message || 'Erreur lors du changement de statut.');
      }
    } catch (err) {
      showNotification?.('error', 'Erreur de connexion.');
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
        showNotification?.('success', data.message || 'Modèle supprimé.');
        setDeleteTemplateId(null);
        fetchTemplates();
      } else {
        showNotification?.('error', data.message || 'Erreur lors de la suppression.');
      }
    } catch (err) {
      showNotification?.('error', 'Erreur de connexion.');
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchQuery ? true : [t.title, t.message].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter ? true : t.status === statusFilter;
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
              <h1 className="text-xl font-medium leading-none text-mono">Suivi par Whatsapp</h1>
              <div className="text-sm font-normal text-secondary-foreground">
                Utilisez les placeholders dans votre message: {allowedPlaceholders.join(', ')}.
              </div>
              <div className="text-2sm text-secondary-foreground">
                <span className="font-medium text-foreground">Exemple:</span> Bonjour @name, on n'est pas arrivé à vous joindre par appel pour livrer votre produit @product, on a expédié votre colis depuis Casablanca jusqu'à @address, merci d'appeler notre livreur sur @numLivreur...
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
                  {editingId ? 'Modifier le modèle WhatsApp' : 'Créer un modèle WhatsApp'}
                </h3>
                {editingId && (
                  <button type="button" className="kt-btn kt-btn-outline" onClick={handleCancelEdit}>
                    Annuler la modification
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-mono">Titre</label>
                  <input
                    type="text"
                    className="kt-input"
                    placeholder="Titre du modèle..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-mono">Message</label>
                  <textarea
                    className="kt-textarea"
                    rows={4}
                    placeholder="Rédigez le message du modèle..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <div className="flex items-center justify-between flex-wrap gap-2 text-2sm text-secondary-foreground">
                    <span>Placeholders autorisés: {allowedPlaceholders.join(', ')}</span>
                    <span>{message.length}/{messageHardLimit}</span>
                  </div>
                  {message.length > messageSoftLimit && (
                    <div className="text-2sm text-warning">
                      Message long: vérifiez que WhatsApp affiche correctement tout le texte.
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button className="kt-btn kt-btn-primary w-full lg:w-auto" type="submit" disabled={submitting}>
                    {submitting ? 'Enregistrement...' : (editingId ? 'Enregistrer' : 'Nouveau')}
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
                Affichage de {filteredTemplates.length} modèle(s)
              </h3>
              <div className="flex flex-wrap gap-2 lg:gap-5">
                <div className="flex">
                  <label className="kt-input">
                    <i className="ki-filled ki-magnifier"></i>
                    <input
                      type="text"
                      placeholder="Rechercher un modèle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <KtSelect
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    placeholder="Statut"
                    className="w-36"
                    options={[
                      { value: '', label: 'Tous les statuts' },
                      { value: 'active', label: 'Activé' },
                      { value: 'inactive', label: 'Désactivé' },
                      { value: 'default', label: 'Default' }
                    ]}
                  />
                  <button
                    className="kt-btn kt-btn-outline"
                    type="button"
                    onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
                  >
                    Réinitialiser
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
                      <th className="min-w-[180px]">Titre</th>
                      <th className="min-w-[220px]">Message</th>
                      <th className="min-w-[170px]">Date de création</th>
                      <th className="min-w-[130px]">Statut</th>
                      <th className="w-[90px] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                    ) : filteredTemplates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-secondary-foreground text-center py-8">
                          Aucun modèle WhatsApp trouvé.
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates.map((tmpl) => {
                        const isDefault = tmpl.isDefault;
                        const isActive = tmpl.status === 'active';
                        const statusClass = isActive ? 'kt-badge-success' : 'kt-badge-destructive';
                        const statusLabel = isActive ? 'Activé' : 'Désactivé';

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
                                  onClick={() => setActiveDropdownId(activeDropdownId === tmpl.id ? null : tmpl.id)}
                                >
                                  <i className="ki-filled ki-dots-vertical text-lg"></i>
                                </button>

                                {activeDropdownId === tmpl.id && (
                                  <div className="kt-menu-dropdown kt-menu-default absolute right-0 top-full mt-1 w-[180px] z-50 bg-background border border-border rounded-xl shadow-lg p-1.5">
                                    {isDefault ? (
                                      <div className="px-3 py-2 text-xs text-secondary-foreground">
                                        Modèle par défaut verrouillé
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className="kt-menu-link text-start w-full px-3 py-1.5 hover:bg-accent rounded-lg flex items-center gap-2 text-sm"
                                          onClick={() => handleEdit(tmpl)}
                                        >
                                          <i className="ki-filled ki-pencil"></i>
                                          <span>Modifier</span>
                                        </button>

                                        <button
                                          type="button"
                                          className="kt-menu-link text-start w-full px-3 py-1.5 hover:bg-accent rounded-lg flex items-center gap-2 text-sm"
                                          onClick={() => handleToggleStatus(tmpl)}
                                        >
                                          <i className="ki-filled ki-arrows-circle"></i>
                                          <span>{isActive ? 'Désactiver' : 'Activer'}</span>
                                        </button>

                                        <button
                                          type="button"
                                          className="kt-menu-link text-start w-full px-3 py-1.5 text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg flex items-center gap-2 text-sm"
                                          onClick={() => { setActiveDropdownId(null); setDeleteTemplateId(tmpl.id); }}
                                        >
                                          <i className="ki-filled ki-trash text-destructive"></i>
                                          <span>Supprimer</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
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

        {/* Delete Confirmation Modal */}
        {deleteTemplateId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background border border-border rounded-xl max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-foreground mb-2">Supprimer le modèle</h3>
              <p className="text-sm text-secondary-foreground mb-5">
                Êtes-vous sûr de vouloir supprimer ce modèle WhatsApp ?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="kt-btn kt-btn-outline"
                  onClick={() => setDeleteTemplateId(null)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="kt-btn kt-btn-destructive"
                  onClick={handleDelete}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </DashboardLayout>
  );
}
