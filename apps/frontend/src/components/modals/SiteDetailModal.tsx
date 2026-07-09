import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, ShieldCheck, Trash2, Loader2, Save, Monitor } from 'lucide-react';
import { useUpdateSite, useDeleteSite, useContracts } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

interface SiteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: any;
}

export function SiteDetailModal({ isOpen, onClose, site }: SiteDetailModalProps) {
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();
  const { data: contracts } = useContracts();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    type: 'BATIMENT',
    contractId: '',
    contactName: '',
    contactPhone: '',
  });

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        address: site.address || '',
        city: site.city || '',
        type: site.type || 'BATIMENT',
        contractId: site.contractId?.toString() || '',
        contactName: site.contactName || '',
        contactPhone: site.contactPhone || '',
      });
    }
  }, [site]);

  if (!isOpen || !site) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateSite.mutate({
      id: site.id,
      data: {
        ...formData,
        contractId: formData.contractId ? parseInt(formData.contractId) : null,
      }
    }, {
      onSuccess: () => {
        toast.success('Site mis à jour');
        setIsEditing(false);
      },
      onError: () => toast.error('Erreur lors de la mise à jour')
    });
  };

  const handleDelete = () => {
    if (!window.confirm('Supprimer ce site ?')) return;
    deleteSite.mutate(site.id, {
      onSuccess: () => {
        toast.success('Site supprimé');
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">Fiche du Site</h3>
              <p className="text-xs text-muted-foreground mt-1">ID: SITE-{site.id.toString().padStart(3, '0')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-muted rounded-md transition-colors"
              >
                Modifier
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nom du Site</label>
                {isEditing ? (
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all text-sm font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-base font-bold">{site.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type de Site</label>
                {isEditing ? (
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-medium"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="BATIMENT">Bâtiment / Local</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="EQUIPEMENT_INDUSTRIEL">Équipement Industriel</option>
                    <option value="RESEAU">Réseau / Télécom</option>
                  </select>
                ) : (
                  <div>
                    <span className="px-2.5 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-lg uppercase tracking-tight">
                      {site.type}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adresse & Ville</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      placeholder="Adresse complète"
                      className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <input
                      placeholder="Ville"
                      className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                ) : (
                  <p className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" /> {site.address || ''} {site.city || 'Ville non spécifiée'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5 bg-muted/20 p-5 rounded-2xl border border-dashed border-border/50">
               <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                 <ShieldCheck className="w-4 h-4 text-primary" /> Contrat Associé
               </h4>
               {isEditing ? (
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-medium"
                    value={formData.contractId}
                    onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                  >
                    <option value="">Aucun contrat</option>
                    {contracts?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.reference})</option>
                    ))}
                  </select>
               ) : (
                 <div className="space-y-2">
                    <p className="text-xs font-bold text-primary uppercase tracking-tighter">
                      Client: {site.contract?.client?.name || 'Inconnu'}
                    </p>
                    <p className="text-sm font-bold text-foreground">{site.contract?.name || 'Aucun contrat'}</p>
                    <p className="text-xs text-muted-foreground">{site.contract?.reference || 'Pas de référence'}</p>
                 </div>
               )}
            </div>

            <div className="space-y-5 bg-muted/20 p-5 rounded-2xl border border-dashed border-border/50">
                <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                  <Save className="w-4 h-4 text-primary" /> Contact Local
                </h4>
                <div className="space-y-3">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Responsable de Site</label>
                      {isEditing ? (
                        <input
                          className="w-full px-3 py-1.5 bg-background border rounded-lg text-sm"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm font-bold">{site.contactName || 'Non spécifié'}</p>
                      )}
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Téléphone Direct</label>
                      {isEditing ? (
                        <input
                          className="w-full px-3 py-1.5 bg-background border rounded-lg text-sm"
                          value={formData.contactPhone}
                          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm font-bold text-primary">{site.contactPhone || 'Non spécifié'}</p>
                      )}
                   </div>
                </div>
            </div>
          </div>

          {!isEditing && (
            <div className="mt-8 space-y-4 px-1">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inventaire du Site ({site.equipment?.length || 0})</h4>
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <Monitor className="w-3.5 h-3.5" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {site.equipment?.length > 0 ? (
                  site.equipment.map((equip: any) => (
                    <div key={equip.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border/50 rounded-xl hover:bg-muted/40 transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-background rounded-lg border border-border/50 shadow-sm transition-colors group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-tight truncate">{equip.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold truncate uppercase">{equip.brand} {equip.model} <span className="opacity-40 mx-1">•</span> S/N: {equip.serialNumber}</p>
                        </div>
                      </div>
                      <div className={cn("shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm", 
                        equip.status === 'OPERATIONNEL' ? 'text-green-600 bg-green-50 border-green-200' : 
                        equip.status === 'HORS_SERVICE' ? 'text-red-600 bg-red-50 border-red-200' :
                        'text-blue-600 bg-blue-50 border-blue-200'
                      )}>
                        {equip.status === 'OPERATIONNEL' ? 'OK' : equip.status === 'HORS_SERVICE' ? 'DOWN' : 'SERV'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/5 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-tighter italic">Aucun équipement en inventaire sur ce site.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-tight"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border rounded-lg text-sm font-bold transition-all hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={updateSite.isPending}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                  >
                    {updateSite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-bold hover:bg-muted/80 transition-all"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
