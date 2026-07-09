import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, GanttChartSquare, Calendar, User, Trash2, Loader2, Save, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useUpdateProject, useDeleteProject, useUsers, useProject } from '@/hooks/useApi';
import { toast } from '@/components/ui/Toaster';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

export function ProjectDetailModal({ isOpen, onClose, project: initialProject }: ProjectDetailModalProps) {
  const { data: deepProject, isLoading: isFetching } = useProject(initialProject?.id && isOpen ? initialProject.id : null);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { data: users } = useUsers();
  
  const displayProject = deepProject || initialProject;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    progress: 0,
    managerId: '',
  });

  useEffect(() => {
    if (displayProject) {
      setFormData({
        name: displayProject.name || '',
        description: displayProject.description || '',
        startDate: displayProject.startDate ? new Date(displayProject.startDate).toISOString().split('T')[0] : '',
        endDate: displayProject.endDate ? new Date(displayProject.endDate).toISOString().split('T')[0] : '',
        progress: displayProject.progress || 0,
        managerId: displayProject.managerId?.toString() || '',
      });
    }
  }, [displayProject]);

  if (!isOpen || !displayProject) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject.mutate({
      id: displayProject.id,
      data: {
        ...formData,
        progress: parseInt(formData.progress.toString()),
        managerId: formData.managerId ? parseInt(formData.managerId) : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      }
    }, {
      onSuccess: () => {
        toast.success('Projet mis à jour');
        setIsEditing(false);
      },
      onError: () => toast.error('Erreur lors de la mise à jour')
    });
  };

  const handleDelete = () => {
    if (!window.confirm('Supprimer ce projet ?')) return;
    deleteProject.mutate(displayProject.id, {
      onSuccess: () => {
        toast.success('Projet supprimé');
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
              <GanttChartSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">Détails du Projet</h3>
              <p className="text-xs text-muted-foreground mt-1">PRJ-{displayProject.id.toString().padStart(3, '0')}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nom du Projet</label>
                {isEditing ? (
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all text-sm font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-xl font-black text-foreground flex items-center gap-2">
                    {displayProject.name}
                    {isFetching && <Loader2 className="w-4 h-4 animate-spin text-primary opacity-50" />}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{displayProject.description || 'Pas de description.'}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manager</label>
                    {isEditing ? (
                      <select
                        className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all text-sm font-bold"
                        value={formData.managerId}
                        onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      >
                        <option value="">Sélectionnez un manager...</option>
                        {users?.filter((u: any) => ['ADMIN', 'SUPER_ADMIN', 'DIRECTEUR', 'CHEF_PROJET'].includes(u.role)).map((m: any) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm font-bold flex items-center gap-2"><User className="w-4 h-4" /> {displayProject.manager?.name || 'Non assigné'}</p>
                    )}
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Échéance</label>
                    {isEditing ? (
                      <input
                        type="date"
                        className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-bold flex items-center gap-2"><Calendar className="w-4 h-4" /> {formData.endDate}</p>
                    )}
                 </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Progression</span>
                    <span className="text-sm font-black text-primary">{formData.progress}%</span>
                  </div>
                  <div className="h-3 bg-background border rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-primary transition-all duration-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
                       style={{ width: `${formData.progress}%` }} 
                     />
                  </div>
                  {isEditing && (
                    <p className="text-[9px] text-muted-foreground mt-3 font-bold uppercase tracking-tight italic opacity-70">
                      ℹ️ Mise à jour via les chantiers associés
                    </p>
                  )}
               </div>

               {/* Chantiers List */}
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <GanttChartSquare className="w-4 h-4" /> Chantiers Associés
                  </h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {isFetching ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground/40 animate-pulse">
                         <Loader2 className="w-10 h-10 animate-spin" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Chargement des chantiers...</span>
                      </div>
                    ) : (
                      displayProject.phases?.map((phase: any) => (
                      <div key={phase.id} className="space-y-2">
                        {phase.tasks?.length > 0 ? (
                          phase.tasks.map((task: any) => (
                            <div key={task.id} className="bg-background border rounded-xl p-4 flex items-center gap-4 group hover:border-primary/30 transition-all shadow-sm">
                              <div className="flex-1 min-w-0 flex flex-col gap-1">
                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{task.title}</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {task.status === 'TERMINE' && <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full whitespace-nowrap"><CheckCircle2 className="w-3 h-3" /> Terminé</span>}
                                  {task.status === 'EN_COURS' && <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full whitespace-nowrap"><Clock className="w-3 h-3" /> En cours</span>}
                                  {(task.status === 'A_FAIRE' || task.status === 'BACKLOG') && <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full whitespace-nowrap"><AlertCircle className="w-3 h-3" /> À Faire</span>}
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate">Phase: {phase.name}</span>
                                </div>
                              </div>
                              <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                                 <span className="text-[9px] font-black text-primary/40 uppercase tracking-tighter">Progression</span>
                                 <div className="w-16 sm:w-24 h-1.5 bg-muted rounded-full overflow-hidden shadow-inner">
                                   <div 
                                     className={cn(
                                       "h-full transition-all duration-500 shadow-sm",
                                       task.status === 'TERMINE' ? "bg-green-500" : "bg-primary"
                                     )}
                                     style={{ width: task.status === 'TERMINE' ? '100%' : task.status === 'EN_COURS' ? '50%' : '5%' }}
                                   />
                                 </div>
                              </div>
                            </div>
                          ))
                        ) : null}
                      </div>
                    )))}
                    {!isFetching && (!displayProject.phases || displayProject.phases.every((p: any) => !p.tasks || p.tasks.length === 0)) && (
                      <div className="text-center py-8 bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest italic opacity-40">Aucun chantier assigné à ce projet.</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>

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
                    disabled={updateProject.isPending}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                  >
                    {updateProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
