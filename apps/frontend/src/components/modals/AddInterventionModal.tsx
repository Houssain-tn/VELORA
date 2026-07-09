import { useState, useEffect } from 'react';
import { useCreateIntervention, useUpdateIntervention, useSites, useUsers, useSquads } from '@/hooks/useApi';
import { X, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from '@/components/ui/Toaster';
import { cn } from '@/lib/utils';

interface AddInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention?: any;
  isEditMode?: boolean;
  initialDate?: Date | null;
  initialPriority?: string;
  initialEquipmentId?: string | number;
}

export function AddInterventionModal({ isOpen, onClose, intervention, isEditMode, initialDate, initialPriority, initialEquipmentId }: AddInterventionModalProps) {
  const { user } = useAuthStore();
  const createInv = useCreateIntervention();
  const updateInv = useUpdateIntervention();
  const { data: sites } = useSites();
  const { data: users } = useUsers();
  const { data: squads } = useSquads();

  const isClient = user?.role === 'CLIENT';

  const [formData, setFormData] = useState({
    title: intervention?.title || '',
    description: intervention?.description || '',
    priority: intervention?.priority || 'NORMALE',
    siteId: intervention?.siteId?.toString() || '',
    equipmentId: intervention?.equipmentId?.toString() || '',
    manualLocation: intervention?.manualLocation || '',
    assignedTechnicianIds: intervention?.assignedTechnicians?.map((t: any) => t.id) || [] as number[],
    squadId: intervention?.squadId?.toString() || '',
    status: intervention?.status || 'DEMANDE',
    scheduledDate: intervention?.scheduledDate ? new Date(intervention.scheduledDate).toISOString().split('T')[0] : (initialDate ? initialDate.toISOString().split('T')[0] : ''),
  });

  useEffect(() => {
    if (intervention && isEditMode) {
      setFormData({
        title: intervention.title || '',
        description: intervention.description || '',
        priority: intervention.priority || 'NORMALE',
        siteId: intervention.siteId?.toString() || '',
        equipmentId: intervention.equipmentId?.toString() || '',
        manualLocation: intervention.manualLocation || '',
        assignedTechnicianIds: intervention.assignedTechnicians?.map((t: any) => t.id) || [],
        squadId: intervention.squadId?.toString() || '',
        status: intervention.status || 'DEMANDE',
        scheduledDate: intervention.scheduledDate ? new Date(intervention.scheduledDate).toISOString().split('T')[0] : '',
      });
    } else if (!isEditMode && isOpen) {
      setFormData({ 
        title: '', 
        description: '', 
        priority: initialPriority || 'NORMALE', 
        siteId: '', 
        equipmentId: initialEquipmentId ? initialEquipmentId.toString() : '',
        manualLocation: '', 
        assignedTechnicianIds: [], 
        squadId: '', 
        status: 'DEMANDE',
        scheduledDate: initialDate ? initialDate.toISOString().split('T')[0] : '',
      });
    }
  }, [intervention, isEditMode, isOpen, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId && !formData.manualLocation) {
      return toast.error('Veuillez sélectionner un site ou saisir un lieu');
    }

    if (formData.assignedTechnicianIds.length > 6) {
      return toast.error('Maximum 6 techniciens par intervention');
    }

    if (isEditMode && intervention) {
      const updateData = {
        ...formData,
        siteId: formData.siteId === 'other' || !formData.siteId ? null : parseInt(formData.siteId),
        equipmentId: formData.equipmentId ? parseInt(formData.equipmentId) : null,
        squadId: formData.squadId ? parseInt(formData.squadId) : null,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : null,
      };
      
      updateInv.mutate({ id: intervention.id, data: updateData }, {
        onSuccess: () => {
          onClose();
          toast.success('Intervention mise à jour');
        }
      });
      return;
    }

    // Clean payload for creation to match CreateInterventionDto
    const createPayload = {
      title: formData.title,
      description: formData.description,
      priority: isClient ? 'NORMALE' : formData.priority,
      type: 'INCIDENT', // Default type if not in form, or extract from elsewhere
      siteId: formData.siteId === 'other' || !formData.siteId ? null : parseInt(formData.siteId),
      equipmentId: formData.equipmentId ? parseInt(formData.equipmentId) : undefined,
      manualLocation: formData.siteId === 'other' ? formData.manualLocation : null,
      assignedTechnicianIds: isClient ? [] : formData.assignedTechnicianIds,
      squadId: formData.squadId ? parseInt(formData.squadId) : null,
      scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined,
    };

    createInv.mutate(createPayload, {
      onSuccess: () => {
        onClose();
        setFormData({ title: '', description: '', priority: 'NORMALE', siteId: '', equipmentId: '', manualLocation: '', assignedTechnicianIds: [], squadId: '', status: 'DEMANDE', scheduledDate: '' });
        toast.success('Intervention créée avec succès');
      },
    });
  };

  const toggleTechnician = (id: number) => {
    setFormData((prev: any) => ({
      ...prev,
      assignedTechnicianIds: prev.assignedTechnicianIds.includes(id)
        ? prev.assignedTechnicianIds.filter((tid: number) => tid !== id)
        : [...prev.assignedTechnicianIds, id]
    }));
  };

  const handleSquadChange = (squadIdStr: string) => {
    const sId = squadIdStr ? parseInt(squadIdStr) : '';
    const selectedSquad = squads?.find((s: any) => s.id === sId);

    if (selectedSquad) {
      const memberIds = selectedSquad.members.map((m: any) => m.id);
      setFormData(prev => ({
        ...prev,
        squadId: squadIdStr,
        assignedTechnicianIds: Array.from(new Set([...prev.assignedTechnicianIds, ...memberIds])).slice(0, 6)
      }));
    } else {
      setFormData(prev => ({ ...prev, squadId: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-start justify-center p-0 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg mt-auto sm:my-auto rounded-t-3xl sm:rounded-2xl shadow-2xl border-t-2 sm:border-2 border-primary/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[90vh] sm:max-h-[95vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <h3 className="font-bold text-lg text-primary">
            {isClient ? 'Besoin d\'Assistance ?' : 'Planning Intervention Équipe'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar">
            {isClient && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-blue-700 shadow-sm animate-pulse">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider">Aide & Support</p>
                  <p className="text-[11px] leading-relaxed">Décrivez votre problème technique. L'équipe Waycon sera notifiée immédiatement pour planification.</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Objet de la demande</label>
              <input
                required
                className="w-full px-4 py-2.5 bg-background border-2 border-muted rounded-lg focus:border-primary outline-none transition-all text-sm font-medium"
                placeholder={isClient ? "Quel appareil ou service pose problème ?" : "ex: Panne Camera Entrée Principale"}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Description détaillée</label>
              <textarea
                required
                className="w-full px-4 py-2.5 bg-background border-2 border-muted rounded-lg focus:border-primary outline-none transition-all min-h-[120px] text-sm resize-none"
                placeholder="Décrivez précisément les symptômes constatés..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isClient && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Priorité</label>
                  <select
                    className="w-full px-4 py-2.5 bg-background border-2 border-muted rounded-lg focus:border-primary outline-none transition-all text-sm font-bold"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="FAIBLE">Faible</option>
                    <option value="NORMALE">Normale</option>
                    <option value="HAUTE">Haute</option>
                    <option value="URGENTE">Urgente (SLA Critique)</option>
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Site concerné</label>
                <select
                  required
                  className="w-full px-4 py-2.5 bg-background border-2 border-muted rounded-lg focus:border-primary outline-none transition-all text-sm font-bold"
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                >
                  <option value="">Sélectionnez le site...</option>
                  {sites?.map((site: any) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                  <option value="other" className="text-primary font-black uppercase tracking-tighter italic"> Autre / Lieu Public</option>
                </select>
              </div>

              {formData.siteId === 'other' && (
                <div className="col-span-full space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold flex items-center gap-1.5 text-primary uppercase tracking-widest">
                    <MapPin className="w-3 h-3" /> Lieu de l'intervention (Saisie Manuelle)
                  </label>
                  <input
                    required
                    className="w-full px-4 py-2.5 bg-primary/5 border-2 border-primary/20 rounded-lg focus:border-primary outline-none transition-all text-sm font-bold placeholder:font-normal"
                    placeholder="ex: Rond-point Sahloul, Rue de France..."
                    value={formData.manualLocation}
                    onChange={(e) => setFormData({ ...formData, manualLocation: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Date d'Intervention Prévue</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-background border-2 border-muted rounded-lg focus:border-primary outline-none transition-all text-sm font-bold"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>

            {!isClient && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Assigner une Équipe (Squad)</label>
                  <select
                    className="w-full px-4 py-2.5 bg-primary/[0.03] border-2 border-primary/10 rounded-lg outline-none focus:border-primary transition-all text-sm font-bold appearance-none cursor-pointer"
                    value={formData.squadId}
                    onChange={(e) => handleSquadChange(e.target.value)}
                  >
                    <option value="">Aucune équipe sélectionnée...</option>
                    {squads?.map((s: any) => (
                      <option key={s.id} value={s.id}>🚀 {s.name}</option>
                    ))}
                  </select>
                </div>

                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex justify-between pt-2">
                  <span>Techniciens Individuels (1-6)</span>
                  <span className="text-primary">{formData.assignedTechnicianIds.length}/6</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-2 bg-muted/20 rounded-xl border-2 border-dashed border-muted no-scrollbar">
                  {users?.filter((u: any) => u.role === 'TECHNICIEN' || u.role === 'ADMIN').map((u: any) => (
                    <div
                      key={u.id}
                      onClick={() => toggleTechnician(u.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all",
                        formData.assignedTechnicianIds.includes(u.id)
                          ? "bg-primary/10 border-primary shadow-sm"
                          : "bg-background border-transparent hover:border-muted-foreground/20"
                      )}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black">{u.name[0]}</div>}
                      </div>
                      <span className="text-[10px] font-bold truncate tracking-tighter uppercase">{u.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="p-4 md:p-6 border-t bg-muted/20 flex gap-4 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 rounded-xl font-bold text-sm hover:bg-muted transition-all disabled:opacity-50 uppercase tracking-wider"
              disabled={createInv.isPending || updateInv.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-[2] px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 uppercase tracking-widest hover:scale-105 active:scale-95"
              disabled={createInv.isPending || updateInv.isPending}
            >
              {(createInv.isPending || updateInv.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : (isClient ? 'Envoyer ma Demande' : (isEditMode ? 'Mettre à jour' : 'Lancer l\'Intervention'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
