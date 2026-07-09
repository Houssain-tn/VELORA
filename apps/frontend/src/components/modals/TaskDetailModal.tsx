import { useState } from 'react';
import { X, Calendar, Users, MessageSquare, Send, CheckCircle2, Clock, BarChart4, MapPin, Lock as LockIcon, Trash2 } from 'lucide-react';
import { useComments, useCreateComment, useDeleteTask } from '@/hooks/useApi';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onEdit?: (task: any) => void;
}

export function TaskDetailModal({ isOpen, onClose, task, onEdit }: TaskDetailModalProps) {
  const [comment, setComment] = useState('');
  const { data: comments, isLoading: commentsLoading } = useComments('task', task?.id);
  const createComment = useCreateComment('task', task?.id);
  const deleteTask = useDeleteTask();
  const { canDeleteTask } = usePermissions();

  if (!isOpen || !task) return null;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await createComment.mutateAsync(comment);
    setComment('');
  };
  
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.')) {
      await deleteTask.mutateAsync(task.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BarChart4 className="w-6 h-6" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", 
                    task.status === 'TERMINE' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                  )}>
                    {task.status}
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground uppercase">
                    {task.phase?.project?.name ? `${task.phase.project.name} > ${task.phase.name}` : 'Projet global'}
                  </span>
                </div>
                <h3 className="text-lg font-bold truncate max-w-[400px]">{task.title}</h3>
             </div>
          </div>
          <div className="flex items-center gap-3">
            {onEdit && (
              <button 
                onClick={() => onEdit(task)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all text-xs font-black uppercase tracking-tight shadow-sm"
              >
                <div className="w-4 h-4" /> Modifier
              </button>
            )}
            {canDeleteTask && (
              <button 
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-all text-xs font-black uppercase tracking-tight shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> {deleteTask.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row pb-32 md:pb-0 scroll-smooth">
          {/* Main Content */}
          <div className="flex-1 p-6 md:overflow-y-auto border-r border-dashed">
            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Description du Chantier</h4>
                <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                  {task.description || 'Aucune description détaillée disponible.'}
                </p>
              </section>

              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 p-3 bg-muted/20 rounded-lg border col-span-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Équipe assignée</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {task.assignedTechnicians && task.assignedTechnicians.length > 0 ? (
                        task.assignedTechnicians.slice(0, 3).map((tech: any) => (
                          <div key={tech.id} className="flex items-center gap-2 bg-background border px-2 py-1 rounded-full shadow-sm">
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border/50">
                              {tech.avatar ? <img src={tech.avatar} alt={tech.name} className="w-full h-full object-cover" /> : <span className="text-[8px] font-black">{tech.name.substring(0, 2).toUpperCase()}</span>}
                            </div>
                            <span className="text-[10px] font-bold">{tech.name}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs font-medium text-muted-foreground italic pl-1">Aucun technicien assigné</p>
                      )}
                    </div>
                  </div>
                 <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Échéance</p>
                      <p className="text-sm font-semibold">
                        {task.dueDate ? format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: fr }) : 'Non planifiée'}
                      </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Priorité</p>
                      <p className="text-sm font-semibold capitalize">{task.priority?.toLowerCase()}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Estimation</p>
                      <p className="text-sm font-semibold">{task.estimatedHours || 0} heures</p>
                    </div>
                 </div>
                 {task.site && (
                   <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20 col-span-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Site / Client</p>
                        <p className="text-sm font-semibold">{task.site.name}</p>
                        {task.site.city && <p className="text-[10px] text-muted-foreground font-medium">{task.site.city}</p>}
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </div>

          {/* Social / Comments Section */}
          <div className="w-full md:w-[350px] flex flex-col bg-muted/5">
            <div className="p-4 border-b bg-muted/20">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Discussion d'Équipe
              </h4>
            </div>

            <div className="flex-1 md:overflow-y-auto p-4 space-y-4">
               {commentsLoading ? (
                 <div className="text-center py-8 text-xs animate-pulse font-medium">Chargement...</div>
               ) : comments?.length === 0 ? (
                 <div className="py-20 text-center opacity-30 flex flex-col items-center">
                    <MessageSquare className="w-12 h-12 mb-2" />
                    <p className="text-xs font-bold">Zéro Note Technique</p>
                 </div>
               ) : (
                 comments.map((c: any) => (
                   <div key={c.id} className="group">
                      <div className="flex items-center justify-between mb-1 px-1">
                        <span className="text-[10px] font-bold text-primary">{c.user.name}</span>
                        <div className="flex items-center gap-2">
                          {c.isInternal && <span className="flex items-center gap-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 px-1 rounded uppercase"><LockIcon className="w-2 h-2" /> Interne</span>}
                          <span className="text-[9px] text-muted-foreground italic">{format(new Date(c.createdAt), 'dd/MM HH:mm')}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-background border rounded-xl rounded-tl-none text-xs shadow-sm hover:border-primary/30 transition-colors">
                        {c.content}
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="p-4 border-t bg-card">
              <form onSubmit={handleSendComment} className="relative">
                <textarea
                  placeholder="Ajouter une mise à jour..."
                  className="w-full h-24 p-3 bg-muted/20 border-2 border-dashed rounded-xl text-xs resize-none focus:outline-none focus:border-primary/50 transition-all font-medium"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(e); } }}
                />
                <button 
                  type="submit"
                  disabled={!comment.trim() || createComment.isPending}
                  className="absolute bottom-3 right-3 p-1.5 bg-primary text-primary-foreground rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
