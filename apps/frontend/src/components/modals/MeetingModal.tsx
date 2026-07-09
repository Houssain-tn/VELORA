import { useState, useEffect } from 'react';
import { X, Loader2, Clock, Video, MapPin, Target, Info } from 'lucide-react';
import { addHours, format, parseISO, differenceInMinutes } from 'date-fns';

import { useAuthStore } from '@/stores/useAuthStore';
import { useProjects, useSites, useUsers, useCreateMeeting, useUpdateMeeting } from '@/hooks/useApi';

import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  meeting?: any;
}

export function MeetingModal({ isOpen, onClose, onSuccess, meeting }: MeetingModalProps) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  const { data: projects } = useProjects();
  const { data: sites } = useSites();
  const { data: users } = useUsers();
  
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    videoLink: '',
    type: 'CLIENT' as 'CLIENT' | 'INTERNAL',
    projectId: '',
    siteId: '',
    clientId: '',
    participantIds: [] as number[]
  });

  // Populate data if editing
  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title || '',
        description: meeting.description || '',
        startTime: meeting.startTime ? new Date(new Date(meeting.startTime).getTime() - (new Date(meeting.startTime).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
        endTime: meeting.endTime ? new Date(new Date(meeting.endTime).getTime() - (new Date(meeting.endTime).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
        location: meeting.location || '',
        videoLink: meeting.videoLink || '',
        type: meeting.type || 'CLIENT',
        projectId: meeting.projectId?.toString() || '',
        siteId: meeting.siteId?.toString() || '',
        clientId: meeting.clientId?.toString() || '',
        participantIds: meeting.participants?.map((p: any) => p.id) || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        videoLink: '',
        type: 'CLIENT',
        projectId: '',
        siteId: '',
        clientId: '',
        participantIds: []
      });
    }
  }, [meeting, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // Construct payload and clean it of undefined/null/NaN values to avoid 400 errors
      const rawPayload = {
        title: formData.title,
        description: formData.description || undefined,
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
        location: formData.location || undefined,
        videoLink: formData.videoLink || undefined,
        projectId: formData.projectId && formData.projectId !== "" ? Number(formData.projectId) : undefined,
        siteId: formData.siteId && formData.siteId !== "" ? Number(formData.siteId) : undefined,
        clientId: formData.clientId && formData.clientId !== "" ? Number(formData.clientId) : (user?.role === 'CLIENT' ? Number(user.companyId) : undefined),
        participantIds: formData.participantIds,
        type: isSuperAdmin ? formData.type : 'CLIENT'
      };

      const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(([_, v]) => 
          v !== undefined && 
          v !== null && 
          !(typeof v === 'number' && isNaN(v))
        )
      );

      if (meeting?.id) {
        await updateMeeting.mutateAsync({ id: meeting.id, data: payload });
        toast.success('Réunion mise à jour avec succès');
      } else {
        await createMeeting.mutateAsync(payload);
        toast.success(isSuperAdmin ? 'Réunion programmée avec succès' : 'Demande de réunion envoyée');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la création de la réunion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTimeChange = (val: string) => {
    const newFormData = { ...formData, startTime: val };
    
    // If start time is set and end time is empty (or before start), suggest end time (+1h)
    if (val && (!formData.endTime || new Date(formData.endTime) <= new Date(val))) {
      try {
        const startDate = parseISO(val);
        const endDate = addHours(startDate, 1);
        newFormData.endTime = format(endDate, "yyyy-MM-dd'T'HH:mm");
      } catch (e) {
        // Fallback for invalid date strings
      }
    }
    
    setFormData(newFormData);
  };

  const getDuration = () => {
    if (!formData.startTime || !formData.endTime) return null;
    try {
      const start = parseISO(formData.startTime);
      const end = parseISO(formData.endTime);
      const minutes = differenceInMinutes(end, start);
      if (minutes <= 0) return null;

      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
      }
      return `${mins} min`;
    } catch (e) {
      return null;
    }
  };

  const toggleParticipant = (id: number) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(id)
        ? prev.participantIds.filter(pid => pid !== id)
        : [...prev.participantIds, id]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary" />
        
        <div className="p-8 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Video className="w-5 h-5 text-primary" />
             </div>
              <div>
                <h3 className="text-2xl font-black tracking-tighter">
                  {meeting ? 'Modifier la Réunion' : (isSuperAdmin ? 'Programmer une Réunion' : 'Demande de Réunion')}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Intelligence Collaboration</p>
              </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-muted rounded-full transition-all hover:rotate-90">
             <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
          {/* Section: Basic Info */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
              <Info className="w-4 h-4" /> Détails Fondamentaux
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Objet de la réunion</label>
                <Input 
                  required
                  placeholder="ex: Revue Hebdomadaire Projet Sahloul"
                  className="h-12 text-md font-bold rounded-2xl border-muted/50"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description / Ordre du jour</label>
                <textarea 
                  className="w-full min-h-[100px] p-4 rounded-2xl border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none border-muted/50"
                  placeholder="Quels points seront abordés ?"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section: Scheduling (Admin only) or Intent (Client) */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
              <Clock className="w-4 h-4" /> Planification
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date & Heure Début</label>
                 </div>
                 <Input 
                   type="datetime-local"
                   className="h-12 font-bold rounded-2xl border-muted/50"
                   value={formData.startTime}
                   onChange={e => handleStartTimeChange(e.target.value)}
                 />
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date & Heure Fin</label>
                   {getDuration() && (
                     <span className={cn(
                       "text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary",
                       differenceInMinutes(parseISO(formData.endTime), parseISO(formData.startTime)) > 240 && "bg-rose-500/10 text-rose-600"
                     )}>
                       Durée: {getDuration()}
                     </span>
                   )}
                 </div>
                 <Input 
                   type="datetime-local"
                   className="h-12 font-bold rounded-2xl border-muted/50"
                   value={formData.endTime}
                   onChange={e => setFormData({...formData, endTime: e.target.value})}
                 />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lieu Physique (Site/Bureau)</label>
                 <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Bureau Sousse / Chantier X"
                      className="h-12 pl-10 font-bold rounded-2xl border-muted/50"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lien Visioconférence</label>
                 <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Teams / Google Meet Link"
                      className="h-12 pl-10 font-bold rounded-2xl border-muted/50"
                      value={formData.videoLink}
                      onChange={e => setFormData({...formData, videoLink: e.target.value})}
                    />
                 </div>
               </div>
            </div>
          </div>

          {/* Section: Context (Links) */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
              <Target className="w-4 h-4" /> Contexte & Assignation
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Projet Lié</label>
                 <select 
                   className="w-full h-12 px-4 rounded-2xl border bg-background font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-muted/50"
                   value={formData.projectId}
                   onChange={e => setFormData({...formData, projectId: e.target.value})}
                 >
                   <option value="">Sélectionner un projet...</option>
                   {projects?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Site Opérationnel</label>
                 <select 
                   className="w-full h-12 px-4 rounded-2xl border bg-background font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-muted/50"
                   value={formData.siteId}
                   onChange={e => setFormData({...formData, siteId: e.target.value})}
                 >
                   <option value="">Sélectionner un site...</option>
                   {sites?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                   ))}
                 </select>
               </div>
            </div>

            {isSuperAdmin && (
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex justify-between">
                   <span>Participants Waycon & Experts</span>
                   <span className="text-primary">{formData.participantIds.length} Sélectionnés</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[180px] overflow-y-auto pr-2 no-scrollbar">
                  {users?.filter((u: any) => u.role !== 'CLIENT').map((u: any) => (
                    <div 
                      key={u.id}
                      onClick={() => toggleParticipant(u.id)}
                      className={cn(
                        "p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3",
                        formData.participantIds.includes(u.id) 
                          ? "bg-primary/10 border-primary shadow-sm" 
                          : "bg-muted/10 border-transparent hover:bg-muted/30"
                      )}
                    >
                      <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center font-black text-[10px] text-primary shadow-sm uppercase border">
                         {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover rounded-xl" /> : u.name.substring(0, 2)}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter truncate">{u.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="p-8 border-t bg-muted/20 flex gap-4">
           <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl h-14 border-muted/50 font-black uppercase tracking-widest">
             Annuler
           </Button>
            <Button 
              disabled={isSubmitting} 
              onClick={handleSubmit}
              className="flex-[2] rounded-2xl h-14 bg-primary shadow-xl shadow-primary/20 font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (meeting ? 'Sauvegarder les modifications' : (isSuperAdmin ? 'Confirmer le Planning' : 'Soumettre la Demande'))}
            </Button>
        </div>
      </div>
    </div>
  );
}
