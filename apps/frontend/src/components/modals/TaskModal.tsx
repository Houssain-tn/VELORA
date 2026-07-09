import React, { useState, useEffect } from 'react';
import { useCreateTask, useUpdateTask, useProjects, useUsers, useSites } from '@/hooks/useApi';
import { X, Loader2, Save, Plus, Users } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { cn } from '@/lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: any;
  defaultStatus?: string;
  initialDate?: Date | null;
}

export function TaskModal({ isOpen, onClose, task, defaultStatus = 'BACKLOG', initialDate }: TaskModalProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const { data: sites } = useSites();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'NORMALE',
    projectId: '',
    siteId: '',
    assignedTechnicianIds: [] as number[],
    estimatedHours: '',
    startDate: '',
    dueDate: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || defaultStatus,
        priority: task.priority || 'NORMALE',
        projectId: task.phase?.projectId?.toString() || task.phase?.project?.id?.toString() || '',
        siteId: task.siteId?.toString() || '',
        assignedTechnicianIds: task.assignedTechnicians?.map((t: any) => t.id) || [],
        estimatedHours: task.estimatedHours?.toString() || '',
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'NORMALE',
        projectId: '',
        siteId: '',
        assignedTechnicianIds: [],
        estimatedHours: '',
        startDate: initialDate ? initialDate.toISOString().split('T')[0] : '',
        dueDate: '',
      });
    }
  }, [task, isOpen, defaultStatus, initialDate]);

  if (!isOpen) return null;

  const toggleTechnician = (id: number) => {
    setFormData(prev => ({
      ...prev,
      assignedTechnicianIds: prev.assignedTechnicianIds.includes(id)
        ? prev.assignedTechnicianIds.filter(tid => tid !== id)
        : [...prev.assignedTechnicianIds, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      projectId: formData.projectId ? Number(formData.projectId) : undefined,
      siteId: formData.siteId ? Number(formData.siteId) : undefined,
      assignedTechnicianIds: formData.assignedTechnicianIds,
      estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
    };

    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, data: payload });
        toast.success('Tâche mise à jour');
      } else {
        await createTask.mutateAsync(payload);
        toast.success('Chantier lancé avec succès');
      }
      onClose();
    } catch (err: any) {
      console.error('Task Operation Error:', err);
      toast.error(err.response?.data?.message || "Échec de l'opération");
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-start justify-center p-0 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg mt-auto sm:my-auto rounded-t-3xl sm:rounded-2xl shadow-2xl border-t-2 sm:border-2 border-primary/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[90vh] sm:max-h-[95vh]">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {task ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
             </div>
             <h3 className="font-black uppercase tracking-tight text-xl">
               {task ? "Modifier la Tâche" : "Nouveau Chantier"}
             </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-8 space-y-4 overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Titre de la tâche</label>
            <input
              required
              className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all placeholder:font-normal"
              placeholder="ex: Installation Baie de Brassage..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description & Instructions</label>
            <textarea
              className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-medium transition-all min-h-[80px] resize-none"
              placeholder="Détails techniques du chantier..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Statut Initial</label>
              <select
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="BACKLOG">Backlog</option>
                <option value="A_FAIRE">À Faire</option>
                <option value="EN_COURS">En Cours</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Niveau d'Urgence</label>
              <select
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="FAIBLE">Basse</option>
                <option value="NORMALE">Normale</option>
                <option value="HAUTE">Haute</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>
          
          {/* TEAM SELECTION GRID */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 ml-1">
              <Users className="w-3 h-3" /> Attribution de l'Équipe (Pod)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto p-2 bg-muted/20 rounded-xl border border-dashed border-border/50 no-scrollbar">
              {users?.filter((u: any) => u.role === 'TECHNICIEN' || u.role === 'ADMIN').map((u: any) => (
                <div 
                  key={u.id}
                  onClick={() => toggleTechnician(u.id)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border-2 transition-all cursor-pointer select-none",
                    formData.assignedTechnicianIds.includes(u.id) 
                      ? "bg-primary/10 border-primary shadow-sm" 
                      : "bg-background border-transparent hover:border-muted-foreground/20"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{u.name.substring(0, 2).toUpperCase()}</span>}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black truncate">{u.name.split(' ')[0]}</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Début Prévu</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Échéance Fin</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Site Opérationnel</label>
              <select
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
              >
                <option value="">-- Aucun Site --</option>
                {sites?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Projet de Rattachement</label>
            <select
              className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            >
              <option value="">-- Projet Global --</option>
              {projects?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          </div>
          
          <div className="p-4 md:p-6 border-t bg-muted/20 flex gap-4 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
              disabled={isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (task ? 'Sauvegarder' : 'Lancer le Chantier')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
