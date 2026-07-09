import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Repeat, 
  Clock, 
  Trash2, 
  Edit,
  CheckCircle2,
  PauseCircle,
  LayoutGrid,
  List,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSchedules, useDeleteSchedule, useTriggerPPM } from '@/hooks/useApi';
import { MaintenanceScheduleModal } from '@/components/modals/MaintenanceScheduleModal';
import { toast } from '@/components/ui/Toaster';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

const frequencyLabels: Record<string, string> = {
  MONTHLY: 'Mensuelle',
  QUARTERLY: 'Trimestrielle',
  SEMI_ANNUALLY: 'Semestrielle',
  ANNUALLY: 'Annuelle',
};

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  ACTIVE: { label: 'Actif', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  PAUSED: { label: 'En Pause', icon: PauseCircle, color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
  COMPLETED: { label: 'Terminé', icon: CheckCircle2, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
};

export function PPM() {
  const { data: schedules, isLoading, error } = useSchedules();
  const deleteSchedule = useDeleteSchedule();
  const triggerPPM = useTriggerPPM();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce planning de maintenance ?')) return;
    try {
      await deleteSchedule.mutateAsync(id);
    } catch {
      toast.error('Échec de la suppression');
    }
  };

  const handleTrigger = async () => {
    if (!window.confirm('Forcer la génération des interventions pour les échéances proches ?')) return;
    try {
      await triggerPPM.mutateAsync();
    } catch {
      toast.error('Erreur lors de la génération');
    }
  };

  const filteredSchedules = schedules?.filter((s: any) => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.site?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">Chargement du Planning PPM...</div>;
  if (error) return <div className="p-8 text-center text-destructive bg-destructive/5 rounded-xl border border-destructive/20 m-6 font-bold">Erreur de connexion au serveur PPM.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Maintenance Préventive (PPM)</h2>
          <p className="text-muted-foreground font-medium italic">Planification des visites récurrentes et automatisation des rondes techniques périodiques.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={handleTrigger}
            disabled={triggerPPM.isPending}
            className="flex-1 sm:flex-none border border-primary/20 text-primary px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-all active:scale-95"
          >
            <Zap className={cn("w-4 h-4", triggerPPM.isPending && "animate-pulse text-orange-500")} /> 
            Génération Forcée
          </button>
          <button 
            onClick={() => { setSelectedSchedule(null); setIsModalOpen(true); }}
            className="flex-1 sm:flex-none bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nouveau Planning
          </button>
        </div>
      </div>

      {/* Grid vs List Toggles & Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-dashed">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            placeholder="Rechercher un planning, un site..."
            className="w-full bg-transparent pl-10 pr-4 py-2 text-sm font-bold outline-none placeholder:font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto px-2">
           <div className="flex bg-background rounded-lg border p-1 shadow-sm">
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted")}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
           </div>
           <button className="p-2.5 bg-background border rounded-xl hover:bg-muted transition-colors shadow-sm">
             <Filter className="w-4 h-4 text-muted-foreground" />
           </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="border rounded-2xl bg-card shadow-sm border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b tracking-widest font-black">
                <tr>
                  <th className="px-6 py-4">Sujet de Maintenance</th>
                  <th className="px-6 py-4">Site / Équipement</th>
                  <th className="px-6 py-4">Fréquence</th>
                  <th className="px-6 py-4">Prochaine Échéance</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-t-0">
                {filteredSchedules?.map((s: any) => (
                  <tr key={s.id} className="last:border-0 hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/5 rounded-lg text-primary">
                           <Repeat className="w-4 h-4" />
                         </div>
                         <div className="min-w-0">
                           <div className="flex items-center gap-2">
                             <p className="font-black text-foreground uppercase text-xs tracking-tight">{s.title}</p>
                             {s.billable && (
                               <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-widest">💰 Facturable</span>
                             )}
                           </div>
                           <p className="text-[10px] text-muted-foreground font-bold leading-none mt-1 uppercase line-clamp-1">{s.description || 'Aucune instruction d\'intervention'}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="font-bold text-xs">{s.site?.name}</p>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase">{s.equipment?.name || 'Site global'}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className="px-2 py-0.5 bg-muted rounded-md text-[10px] font-black uppercase tracking-widest">
                         {frequencyLabels[s.frequency]}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span className="font-bold text-xs">{format(new Date(s.nextDueDate), 'dd MMM yyyy', { locale: fr })}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", statusConfig[s.status]?.color, statusConfig[s.status]?.bgColor)}>
                          {s.status}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setSelectedSchedule(s); setIsModalOpen(true); }}
                            className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredSchedules?.map((s: any) => (
             <div key={s.id} className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className={cn("absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest border-l border-b", statusConfig[s.status]?.color, statusConfig[s.status]?.bgColor)}>
                   {statusConfig[s.status]?.label || s.status}
                </div>
                <div className="flex items-start gap-4 mb-6">
                   <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                     <Repeat className="w-6 h-6" />
                   </div>
                   <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 pr-12">
                         <h4 className="font-black uppercase tracking-tight text-sm truncate">{s.title}</h4>
                         {s.billable && <span className="text-[8px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded font-black shrink-0">💰</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-1">Ref: PPM-{s.id.toString().padStart(3, '0')}</p>
                   </div>
                </div>

                <div className="space-y-3 mb-6">
                   <div className="flex items-center gap-3 text-xs bg-muted/30 p-2.5 rounded-xl border border-dashed">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Prochaine Échéance</p>
                         <p className="font-black uppercase">{format(new Date(s.nextDueDate), 'PPP', { locale: fr })}</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-muted/20 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Fréquence</p>
                        <p className="text-[11px] font-black uppercase">{frequencyLabels[s.frequency]}</p>
                      </div>
                      <div className="p-2.5 bg-muted/20 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Dernier Run</p>
                        <p className="text-[11px] font-black uppercase">{s.lastRunDate ? format(new Date(s.lastRunDate), 'dd/MM/yy') : '--/--/--'}</p>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dashed">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border text-[10px] font-bold">
                        {s.assignedTo?.name.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Technicien</p>
                        <p className="text-[10px] font-black uppercase truncate">{s.assignedTo?.name || 'Libre'}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => { setSelectedSchedule(s); setIsModalOpen(true); }} className="p-2 hover:bg-muted rounded-xl transition-colors"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4 text-red-600" /></button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {(!filteredSchedules || filteredSchedules.length === 0) && (
        <div className="py-24 text-center">
           <div className="flex flex-col items-center justify-center opacity-20">
              <Clock className="w-16 h-16 mb-4" />
              <p className="font-black uppercase tracking-tighter text-xl">Aucun planning de maintenance</p>
              <p className="text-xs font-bold mt-1 uppercase tracking-widest">Automatisez vos visites périodiques pour gagner en efficacité.</p>
           </div>
        </div>
      )}

      <MaintenanceScheduleModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedSchedule(null); }} 
        schedule={selectedSchedule}
      />
    </div>
  );
}
