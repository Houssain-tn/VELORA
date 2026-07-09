import { useState } from 'react';
import { 
  X, Loader2, Calendar, Clock, Video, MapPin, 
  Users, Target, Download, CheckCircle2,
  MessageSquare, ClipboardCheck, Plus, Pencil, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { useUpdateMeeting, useConvertMeetingToTask, useDeleteMeeting } from '@/hooks/useApi';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { generateMeetingPdf } from '@/lib/meetingPdf';
import { useAuthStore } from '@/stores/useAuthStore';

interface MeetingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: any;
  onUpdate?: () => void;
  onEdit?: (meeting: any) => void;
}

export function MeetingDetailModal({ isOpen, onClose, meeting, onUpdate, onEdit }: MeetingDetailModalProps) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  const updateMeeting = useUpdateMeeting();
  const convertMeetingToTask = useConvertMeetingToTask();
  const deleteMeeting = useDeleteMeeting();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState(meeting?.notes || '');
  const [conclusion, setConclusion] = useState(meeting?.conclusion || '');
  const [activeTab, setActiveTab] = useState<'info' | 'notes'>('info');

  const handleUpdateNotes = async () => {
    try {
      setIsUpdating(true);
      await updateMeeting.mutateAsync({
        id: meeting.id,
        data: {
          notes,
          conclusion,
          status: conclusion ? 'COMPLETED' : meeting.status,
        }
      });
      toast.success('Compte-rendu mis à jour');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const convertToTask = async () => {
    if (!conclusion && !notes) {
      toast.error('Veuillez d\'abord saisir des notes ou une conclusion.');
      return;
    }

    try {
      setIsUpdating(true);
      await convertMeetingToTask.mutateAsync({
        id: meeting.id,
        data: {
          noteContent: conclusion || notes
        }
      });
      toast.success('Action convertie en tâche avec succès !');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erreur lors de la conversion en tâche');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette réunion ? Cette action est irréversible.")) {
      return;
    }

    try {
      setIsUpdating(true);
      await deleteMeeting.mutateAsync(meeting.id);
      toast.success('Réunion supprimée avec succès');
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !meeting) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* TOP STATUS BAR */}
        <div className="p-8 pb-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Badge className={cn(
                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest",
                meeting.status === 'COMPLETED' ? "bg-emerald-500 text-white" : "bg-primary text-white"
              )}>
                {meeting.status}
              </Badge>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">ID-REC-00{meeting.id}</span>
           </div>
           <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <>
                  <button 
                    onClick={() => onEdit?.(meeting)}
                    className="p-2 hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                    title="Modifier"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-border mx-1" />
                </>
              )}
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-all">
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-x border-t">
          {/* LEFT: INFO PANEL */}
          <div className="w-full md:w-2/5 p-8 space-y-8 overflow-y-auto no-scrollbar bg-muted/5">
             <div className="space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner">
                   <Video className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter leading-tight italic">{meeting.title}</h2>
                <p className="text-muted-foreground font-medium leading-relaxed">{meeting.description || 'Aucune description fournie.'}</p>
             </div>

             <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shadow-sm">
                      <Calendar className="w-5 h-5 text-primary" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Date Session</span>
                      <span className="font-bold">{meeting.startTime ? format(new Date(meeting.startTime), 'EEEE d MMMM yyyy', { locale: fr }) : 'Non planifiée'}</span>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shadow-sm">
                      <Clock className="w-5 h-5 text-primary" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Plage Horaire</span>
                      <span className="font-bold">
                        {meeting.startTime ? format(new Date(meeting.startTime), 'HH:mm', { locale: fr }) : '--:--'} - {meeting.endTime ? format(new Date(meeting.endTime), 'HH:mm', { locale: fr }) : '--:--'}
                      </span>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shadow-sm">
                      {meeting.videoLink ? <Video className="w-5 h-5 text-amber-500" /> : <MapPin className="w-5 h-5 text-amber-500" />}
                   </div>
                   <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Localisation</span>
                      <span className="font-bold truncate pr-4">{meeting.videoLink ? 'Visioconférence active' : (meeting.location || 'Lieu non défini')}</span>
                   </div>
                </div>
             </div>

             <div className="pt-8 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                   <Users className="w-4 h-4" /> Participants ({meeting.participants?.length})
                </h4>
                <div className="space-y-3">
                   {meeting.participants?.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 border shadow-sm">
                         <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center font-black text-[10px] text-primary uppercase border">
                            {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover rounded-xl" /> : p.name.substring(0, 2)}
                         </div>
                         <span className="text-xs font-bold truncate">{p.name}</span>
                         <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-500" />
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* RIGHT: CONTENT PANEL */}
          <div className="flex-1 flex flex-col bg-background">
             <div className="flex border-b">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={cn("flex-1 p-4 text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'info' ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-muted-foreground opacity-50 hover:opacity-100")}
                >
                   Synthèse Contextuelle
                </button>
                <button 
                  onClick={() => setActiveTab('notes')}
                  className={cn("flex-1 p-4 text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'notes' ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-muted-foreground opacity-50 hover:opacity-100")}
                >
                   Compte-Rendu (PV)
                </button>
             </div>

             <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-8">
                {activeTab === 'info' ? (
                   <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 space-y-2">
                            <Target className="w-6 h-6 text-indigo-600 mb-2" />
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Projet Assigné</p>
                            <p className="font-black text-indigo-900 truncate">{meeting.project?.name || 'Aucun Projet'}</p>
                         </div>
                         <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 space-y-2">
                            <MapPin className="w-6 h-6 text-amber-600 mb-2" />
                            <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Site d'Action</p>
                            <p className="font-black text-amber-900 truncate">{meeting.site?.name || 'Aucun Site'}</p>
                         </div>
                      </div>

                      <div className="space-y-4 pt-4">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-3">
                            <MessageSquare className="w-4 h-4" /> Analyse du créateur
                         </h4>
                         <div className="p-6 rounded-[2rem] bg-muted/30 italic text-sm text-foreground/80 leading-relaxed border border-dashed">
                            "{meeting.description || 'Aucune consigne spécifique n\'a été listée lors de la création.'}"
                         </div>
                      </div>

                      {meeting.status === 'COMPLETED' && (
                         <div className="p-8 rounded-[2.5rem] bg-emerald-500/10 border-2 border-emerald-500/20 space-y-4">
                            <div className="flex items-center gap-3">
                               <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                               <h5 className="font-black italic text-emerald-900">Conclusions Stratégiques Validées</h5>
                            </div>
                            <p className="text-sm font-medium text-emerald-800/80 leading-relaxed">{meeting.conclusion}</p>
                            <Button 
                              onClick={() => generateMeetingPdf(meeting)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 shadow-lg shadow-emerald-500/20"
                            >
                               <Download className="w-5 h-5 mr-2" /> Télécharger le PV Officiel
                            </Button>
                         </div>
                      )}
                   </div>
                ) : (
                   <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-between">
                            <span>Discussion & Points Abordés</span>
                            {!isSuperAdmin && <Badge variant="outline">Consultation Seule</Badge>}
                         </label>
                         <textarea 
                           readOnly={!isSuperAdmin}
                           className="w-full min-h-[150px] p-6 rounded-[2rem] bg-card border-2 focus:border-primary outline-none text-sm leading-relaxed transition-all shadow-inner"
                           placeholder="Détaillez ici les échanges durant la réunion..."
                           value={notes}
                           onChange={e => setNotes(e.target.value)}
                         />
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                               <ClipboardCheck className="w-4 h-4" /> Décisions & Actions Correctives
                            </label>
                            {isSuperAdmin && (
                               <Button size="sm" variant="ghost" onClick={convertToTask} className="text-[9px] font-black uppercase tracking-widest text-primary">
                                  <Plus className="w-3 h-3 mr-1" /> Créer Tâche
                               </Button>
                            )}
                         </div>
                         <textarea 
                           readOnly={!isSuperAdmin}
                           className="w-full min-h-[120px] p-6 rounded-[2rem] bg-emerald-50/30 border-2 border-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold italic leading-relaxed transition-all"
                           placeholder="Quelles sont les conclusions finales ?"
                           value={conclusion}
                           onChange={e => setConclusion(e.target.value)}
                         />
                      </div>

                      {isSuperAdmin && (
                         <div className="flex gap-4 pt-4">
                            <Button 
                              onClick={handleUpdateNotes}
                              disabled={isUpdating}
                              className="flex-[2] rounded-2xl h-14 bg-primary text-white shadow-xl shadow-primary/20 font-black uppercase tracking-widest"
                            >
                               {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enregistrer le Compte-Rendu'}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => generateMeetingPdf({...meeting, notes, conclusion})}
                              className="flex-1 rounded-2xl h-14 border-muted/50 font-black uppercase tracking-widest"
                            >
                               <Download className="w-5 h-5 mr-2" /> Aperçu
                            </Button>
                         </div>
                      )}
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
