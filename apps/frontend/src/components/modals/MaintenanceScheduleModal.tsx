import { useState, useEffect } from 'react';
import { X, Save, Loader2, Calendar, MapPin, Monitor, User, Clock, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateSchedule, useUpdateSchedule, useSites, useEquipment, useUsers } from '@/hooks/useApi';
import { toast } from '@/components/ui/Toaster';

interface MaintenanceScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: any;
  equipment?: any;
}

const frequencyOptions = [
  { value: 'MONTHLY', label: 'Mensuelle' },
  { value: 'QUARTERLY', label: 'Trimestrielle' },
  { value: 'SEMI_ANNUALLY', label: 'Semestrielle' },
  { value: 'ANNUALLY', label: 'Annuelle' },
];

export function MaintenanceScheduleModal({ isOpen, onClose, schedule }: MaintenanceScheduleModalProps) {
  const { data: sites } = useSites();
  const { data: equipment } = useEquipment();
  const { data: users } = useUsers();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'MONTHLY',
    startDate: '',
    siteId: '',
    equipmentId: '',
    assignedToId: '',
    status: 'ACTIVE',
    billable: false,
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        title: schedule.title || '',
        description: schedule.description || '',
        frequency: schedule.frequency || 'MONTHLY',
        startDate: schedule.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : '',
        siteId: schedule.siteId?.toString() || '',
        equipmentId: schedule.equipmentId?.toString() || '',
        assignedToId: schedule.assignedToId?.toString() || '',
        status: schedule.status || 'ACTIVE',
        billable: schedule.billable || false,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        frequency: 'MONTHLY',
        startDate: '',
        siteId: '',
        equipmentId: '',
        assignedToId: '',
        status: 'ACTIVE',
        billable: false,
      });
    }
  }, [schedule, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId) return toast.error('Veuillez sélectionner un site');

    const data = {
      ...formData,
      siteId: parseInt(formData.siteId),
      equipmentId: formData.equipmentId ? parseInt(formData.equipmentId) : null,
      assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : null,
      startDate: new Date(formData.startDate).toISOString(),
    };

    try {
      if (schedule) {
        await updateSchedule.mutateAsync({ id: schedule.id, data });
      } else {
        await createSchedule.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const filteredEquipment = equipment?.filter((e: any) => e.siteId === parseInt(formData.siteId));

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Repeat className="w-5 h-5" />
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight">
                 {schedule ? "Modifier le Planning" : "Planifier une Maintenance"}
               </h3>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Titre du Planning</label>
              <input
                required
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                placeholder="ex: Maintenance mensuelle serveurs"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fréquence</label>
              <div className="relative">
                <select
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                >
                  {frequencyOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <Clock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date de début</label>
              <div className="relative">
                 <input
                   type="date"
                   required
                   className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                   value={formData.startDate}
                   onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                 />
                 <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Site</label>
              <div className="relative">
                <select
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value, equipmentId: '' })}
                >
                  <option value="">Sélectionner un site</option>
                  {sites?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Équipement spécifique (Optionnel)</label>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                >
                  <option value="">Tous les équipements</option>
                  {filteredEquipment?.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.serialNumber})</option>
                  ))}
                </select>
                <Monitor className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Technicien assigné</label>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                >
                  <option value="">Non assigné</option>
                  {users?.filter((u: any) => u.role === 'TECHNICIEN').map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <User className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">État</label>
              <select
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Actif</option>
                <option value="PAUSED">En Pause</option>
                <option value="COMPLETED">Terminé</option>
              </select>
            </div>

            <div className={cn("p-1.5 px-4 rounded-xl border flex items-center justify-between transition-all md:col-span-2", formData.billable ? "bg-amber-50 border-amber-200" : "bg-muted/10")}>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Maintenance Hors Forfait</span>
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase mt-1">Si activé, l'intervention générée sera marquée comme facturable.</span>
               </div>
               <div 
                  onClick={() => setFormData({ ...formData, billable: !formData.billable })}
                  className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-colors shrink-0",
                    formData.billable ? "bg-amber-500" : "bg-muted-foreground/30"
                  )}
               >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    formData.billable ? "left-7" : "left-1"
                  )} />
               </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Instructions détaillées</label>
             <textarea
               className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-medium transition-all h-24 resize-none"
               placeholder="Actions à effectuer lors de la maintenance..."
               value={formData.description}
               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
             />
          </div>

          <div className="mt-10 flex gap-3">
             <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
             >
                Annuler
             </button>
             <button
                type="submit"
                disabled={createSchedule.isPending || updateSchedule.isPending}
                className="flex-[2] py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
                {(createSchedule.isPending || updateSchedule.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {schedule ? "Mettre à jour" : "Planifier PPM"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
