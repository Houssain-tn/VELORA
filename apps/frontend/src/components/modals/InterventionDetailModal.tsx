import { useState, useEffect, useRef } from 'react';
import { 
  X, Calendar, MapPin, Clock, MessageSquare, Send, FileText, CheckCircle2, Trash2, Loader2,
  Camera, Image as ImageIcon, Plus as PlusIcon
} from 'lucide-react';
import { 
  useComments, 
  useCreateComment, 
  useDeleteIntervention, 
  useUpdateIntervention, 
  useSites, 
  useUsers, 
  useCompanies,
  useIntervention,
  useCreateDocument
} from '@/hooks/useApi';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/components/ui/Toaster';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { InterventionCompletionModal } from './InterventionCompletionModal';
import { Edit2, Save, RotateCcw, FileDown, Eye } from 'lucide-react';
import { generateInterventionReport } from '@/lib/export';
import { BASE_URL } from '@/lib/api';

interface InterventionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: any;
  isDefaultEdit?: boolean;
}

export function InterventionDetailModal({ isOpen, onClose, intervention: initialIntervention, isDefaultEdit = false }: InterventionDetailModalProps) {
  const { data: intervention = initialIntervention } = useIntervention(initialIntervention?.id);
  const [comment, setComment] = useState('');
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { data: companies } = useCompanies();
  const myCompany = companies?.find((c: any) => c.id === 1);
  const { data: comments, isLoading: commentsLoading } = useComments('intervention', intervention?.id);
  const createComment = useCreateComment('intervention', intervention?.id);
  const deleteIntervention = useDeleteIntervention();
  const updateIntervention = useUpdateIntervention();
  const uploadPhoto = useCreateDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: sites } = useSites();
  const { data: users } = useUsers();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const canAdminEdit = isAdmin || isSuperAdmin;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('interventionId', intervention.id.toString());
    formData.append('type', 'PHOTO');

    try {
      await uploadPhoto.mutateAsync(formData);
      toast.success('Photo ajoutée au dossier');
    } catch {
      toast.error('Erreur lors de l\'envoi de la photo');
    }
  };
 
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    siteId: '',
    manualLocation: '',
    assignedTechnicianIds: [] as number[],
    billable: false,
    report: '',
    technicalDetails: { specs: [] as { label: string, value: string }[] },
  });

  useEffect(() => {
    if (isOpen && isDefaultEdit) {
      setIsEditing(true);
    } else if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen, isDefaultEdit]);

  useEffect(() => {
    if (intervention) {
      setFormData({
        title: intervention.title || '',
        description: intervention.description || '',
        priority: intervention.priority || 'NORMALE',
        siteId: intervention.siteId?.toString() || (intervention.manualLocation ? 'other' : ''),
        manualLocation: intervention.manualLocation || '',
        assignedTechnicianIds: intervention.assignedTechnicians?.map((t: any) => t.id) || [],
        billable: intervention.billable || false,
        report: intervention.report || '',
        technicalDetails: intervention.technicalDetails?.specs ? intervention.technicalDetails : { 
          specs: intervention.technicalDetails?.cableType ? [
            { label: 'Type de Câble', value: intervention.technicalDetails.cableType },
            { label: 'Longueur (m)', value: intervention.technicalDetails.length?.toString() || '' },
            { label: 'Test Continuité', value: 'SUCCESS' }
          ] : [] 
        },
      });
    }
  }, [intervention]);

  const toggleTechnician = (id: number) => {
    setFormData(prev => ({
      ...prev,
      assignedTechnicianIds: prev.assignedTechnicianIds.includes(id)
        ? prev.assignedTechnicianIds.filter(tid => tid !== id)
        : [...prev.assignedTechnicianIds, id]
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateIntervention.mutateAsync({
        id: intervention.id,
        data: {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          siteId: formData.siteId === 'other' || !formData.siteId ? null : parseInt(formData.siteId),
          manualLocation: formData.siteId === 'other' ? formData.manualLocation : null,
          assignedTechnicianIds: formData.assignedTechnicianIds,
          billable: formData.billable,
          report: formData.report,
          technicalDetails: formData.technicalDetails,
        }
      });
      toast.success('Intervention mise à jour');
      setIsEditing(false);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette intervention ?')) return;
    try {
      await deleteIntervention.mutateAsync(intervention.id);
      toast.success('Intervention supprimée');
      onClose();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (!isOpen || !intervention) return null;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await createComment.mutateAsync(comment);
    setComment('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded uppercase tracking-wider">
                {intervention.reference}
              </span>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", 
                intervention.priority === 'URGENTE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              )}>
                {intervention.priority}
              </span>
              {intervention.billable && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded uppercase flex items-center gap-1">
                  💰 Facturable
                </span>
              )}
              {intervention.invoice && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded uppercase flex items-center gap-1">
                  ✅ Facturé ({intervention.invoice.number})
                </span>
              )}
              {intervention.squad && (
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1.5 border"
                  style={{ borderColor: intervention.squad.color + '40', backgroundColor: intervention.squad.color + '10', color: intervention.squad.color }}
                >
                  🚀 {intervention.squad.name}
                </span>
              )}
            </div>
             <h3 className="text-xl font-bold">
               {isEditing ? (
                 <input 
                   className="bg-background border rounded px-2 py-1 text-sm w-full"
                   value={formData.title}
                   onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                 />
               ) : (
                 intervention.title
               )}
             </h3>
           </div>
           <div className="flex items-center gap-3">
             {!isEditing && (canAdminEdit || (intervention.status !== 'CLOTUREE' && intervention.status !== 'RAPPORT_SOUMIS')) && (
               <button 
                 onClick={() => setIsEditing(true)}
                 className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                 title="Modifier l'intervention"
               >
                 <Edit2 className="w-4 h-4" />
               </button>
             )}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 px-3 border rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 hover:bg-muted"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Annuler
                </button>
                <button 
                  onClick={handleUpdate}
                  disabled={updateIntervention.isPending}
                  className="p-1.5 px-3 bg-primary text-white rounded-lg text-[10px] font-bold uppercase shadow-lg hover:bg-primary/90 transition-all flex items-center gap-1.5"
                >
                  {updateIntervention.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Enregistrer
                </button>
              </div>
            ) : intervention.status !== 'CLOTUREE' && intervention.status !== 'RAPPORT_SOUMIS' && (
              <button 
                onClick={() => setIsCompletionModalOpen(true)}
                className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Clôturer
              </button>
            )}
            <button 
              onClick={() => generateInterventionReport(intervention, myCompany, 'PREVIEW')}
              className="p-2.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"
              title="Visualiser Rapport PDF"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button 
              onClick={() => generateInterventionReport(intervention, myCompany, 'SAVE')}
              className="p-2.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"
              title="Télécharger Rapport PDF"
            >
              <FileDown className="w-5 h-5" />
            </button>
            <button 
              onClick={handleDelete}
              disabled={deleteIntervention.isPending}
              className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              title="Supprimer l'intervention"
            >
              {deleteIntervention.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-3 hover:bg-muted rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <InterventionCompletionModal 
          isOpen={isCompletionModalOpen} 
          onClose={() => {
            setIsCompletionModalOpen(false);
            onClose(); // Close detail too after completion
          }} 
          intervention={intervention} 
        />

        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row pb-32 md:pb-0 scroll-smooth">
          {/* Main Info */}
          <div className="flex-1 p-4 md:p-6 md:overflow-y-auto border-r border-dashed">
            <div className="space-y-6">
               <div>
                 <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-tight mb-3">Description</h4>
                 {isEditing ? (
                   <textarea 
                     className="w-full h-32 p-3 bg-background border rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                     value={formData.description}
                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                   />
                 ) : (
                   <p className="text-sm leading-relaxed">{intervention.description || 'Aucune description fournie.'}</p>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
                   <span className="text-[10px] font-medium text-muted-foreground uppercase">Priorité</span>
                   {isEditing ? (
                     <select
                       className="w-full bg-background border rounded px-2 py-1 text-xs font-bold"
                       value={formData.priority}
                       onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                     >
                       <option value="FAIBLE">Faible</option>
                       <option value="NORMALE">Normale</option>
                       <option value="HAUTE">Haute</option>
                       <option value="URGENTE">Urgente</option>
                     </select>
                   ) : (
                     <div className={cn("text-xs font-bold font-bold", intervention.priority === 'URGENTE' ? 'text-red-600' : 'text-primary')}>
                       {intervention.priority || 'NORMALE'}
                     </div>
                   )}
                 </div>
                 <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Site Affilié</span>
                  {isEditing ? (
                    <div className="space-y-2">
                      <select
                        className="w-full bg-background border rounded px-2 py-1 text-xs font-bold"
                        value={formData.siteId}
                        onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                      >
                        <option value="">Sélectionnez un site...</option>
                        {sites?.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                        <option value="other">🏁 Autre / Manuel</option>
                      </select>
                      {(formData.siteId === 'other' || !formData.siteId) && (
                         <input 
                           className="w-full bg-background border rounded px-2 py-1 text-xs font-bold"
                           placeholder="Lieu de l'intervention..."
                           value={formData.manualLocation}
                           onChange={(e) => setFormData({ ...formData, manualLocation: e.target.value })}
                         />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className={cn("w-4 h-4", intervention.site ? "text-primary" : "text-amber-500")} /> 
                      {intervention.site?.name || intervention.manualLocation || 'Hors Site / Autre'}
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">Équipe Technique (1-6)</span>
                    {isEditing ? (
                      <div className="grid grid-cols-1 gap-1 max-h-[100px] overflow-y-auto pr-1 no-scrollbar">
                        {users?.filter((u: any) => u.role === 'TECHNICIEN' || u.role === 'ADMIN').map((u: any) => (
                          <div 
                            key={u.id}
                            onClick={() => toggleTechnician(u.id)}
                            className={cn(
                              "flex items-center gap-2 p-1.5 rounded border cursor-pointer transition-all",
                              formData.assignedTechnicianIds.includes(u.id) 
                                ? "bg-primary/10 border-primary" 
                                : "bg-background border-transparent hover:border-muted"
                            )}
                          >
                             <span className="text-[10px] font-bold truncate uppercase">{u.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex -space-x-1.5 overflow-hidden py-1">
                         {intervention.assignedTechnicians?.length > 0 ? (
                           intervention.assignedTechnicians.map((t: any) => (
                             <div 
                               key={t.id} 
                               className="w-10 h-10 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
                               title={t.name}
                             >
                               {t.avatar ? <img src={t.avatar.startsWith('http') ? t.avatar : `${BASE_URL}${t.avatar}`} className="w-full h-full object-cover" /> : t.name[0]}
                             </div>
                           ))
                         ) : (
                           <span className="text-xs text-muted-foreground italic">Non assigné</span>
                         )}
                      </div>
                    )}
                  </div>
                 <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
                   <span className="text-[10px] font-medium text-muted-foreground uppercase">Date de Création</span>
                   <div className="flex items-center gap-2 text-sm font-medium">
                     <Calendar className="w-4 h-4 text-primary" /> {format(new Date(intervention.createdAt), 'dd MMMM yyyy', { locale: fr })}
                   </div>
                 </div>
                 <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
                   <span className="text-[10px] font-medium text-muted-foreground uppercase">Délai Automatique (SLA)</span>
                   <div className="flex items-center gap-2 text-sm font-medium">
                     <Clock className="w-4 h-4 text-orange-500" /> {intervention.slaDeadline ? format(new Date(intervention.slaDeadline), 'dd/MM HH:mm') : 'N/A'}
                   </div>
                 </div>
               </div>

               <div className={cn("p-3 rounded-lg border space-y-2 transition-all", formData.billable ? "bg-amber-50 border-amber-200" : "bg-muted/10")}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Facturation</span>
                    {isEditing ? (
                      <div 
                        onClick={() => setFormData({ ...formData, billable: !formData.billable })}
                        className={cn(
                          "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                          formData.billable ? "bg-amber-500" : "bg-muted-foreground/30"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          formData.billable ? "left-6" : "left-1"
                        )} />
                      </div>
                    ) : (
                      <span className={cn("text-[10px] font-black uppercase", formData.billable ? "text-amber-600" : "text-muted-foreground")}>
                        {formData.billable ? "Facturable" : "Gratuit"}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground/70 uppercase leading-tight">
                    {formData.billable ? "Génère une facture hors contrat" : "Intervention sous contrat de maintenance"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-primary/[0.03] border-2 border-primary/10 border-dashed">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" /> Spécifications Techniques
                    </h4>
                    {isEditing && (
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          technicalDetails: { ...prev.technicalDetails, specs: [...prev.technicalDetails.specs, { label: '', value: '' }] }
                        }))}
                        className="text-[10px] font-black text-primary px-2 py-1 bg-primary/10 rounded-lg hover:bg-primary/20 transition-all uppercase tracking-widest"
                      >
                        + Ajouter Item
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {formData.technicalDetails.specs.length > 0 ? (
                      formData.technicalDetails.specs.map((spec, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <input 
                            disabled={!isEditing}
                            placeholder="Libellé (ex: Tension)"
                            className="flex-1 bg-background border rounded px-2 py-1.5 text-xs font-bold focus:ring-primary/20 outline-none w-full sm:w-auto"
                            value={spec.label}
                            onChange={(e) => {
                              const newSpecs = [...formData.technicalDetails.specs];
                              newSpecs[idx].label = e.target.value;
                              setFormData({ ...formData, technicalDetails: { ...formData.technicalDetails, specs: newSpecs } });
                            }}
                          />
                          <input 
                            disabled={!isEditing}
                            placeholder="Valeur (ex: 220V)"
                            className="flex-1 bg-background border rounded px-2 py-1.5 text-xs font-semibold focus:ring-primary/20 outline-none w-full sm:w-auto"
                            value={spec.value}
                            onChange={(e) => {
                              const newSpecs = [...formData.technicalDetails.specs];
                              newSpecs[idx].value = e.target.value;
                              setFormData({ ...formData, technicalDetails: { ...formData.technicalDetails, specs: newSpecs } });
                            }}
                          />
                          {isEditing && (
                            <button 
                              type="button"
                              onClick={() => {
                                const newSpecs = formData.technicalDetails.specs.filter((_, i) => i !== idx);
                                setFormData({ ...formData, technicalDetails: { ...formData.technicalDetails, specs: newSpecs } });
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic text-center py-2">
                        {isEditing ? "Aucune spécification technique ajoutée." : "Aucune spécification technique documentée."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Diagnostic Photos Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                       <ImageIcon className="w-4 h-4" /> Photos Diagnostic
                    </h4>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadPhoto.isPending}
                      className="p-1 px-2.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 hover:bg-primary/20 transition-all"
                    >
                      {uploadPhoto.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusIcon className="w-3.5 h-3.5" />} 
                      Ajouter Photo
                    </button>
                    <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       accept="image/*" 
                       capture="environment"
                       onChange={handleFileUpload} 
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {intervention.documents?.filter((d: any) => d.type === 'PHOTO').map((img: any) => {
                      const imgUrl = img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`;
                      return (
                        <div 
                          key={img.id} 
                          className="relative aspect-square rounded-xl overflow-hidden group border-2 border-transparent hover:border-primary transition-all bg-muted/20 cursor-zoom-in"
                          onClick={() => setPreviewImage(imgUrl)}
                        >
                          <img 
                            src={imgUrl} 
                            alt={img.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button className="p-1.5 bg-white text-black rounded-lg hover:scale-110 transition-transform">
                                  <Eye className="w-4 h-4" />
                              </button>
                          </div>
                        </div>
                      );
                    })}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:bg-primary/[0.03] hover:border-primary/30 transition-all group"
                    >
                      <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[9px] font-black uppercase text-muted-foreground group-hover:text-primary">Capturer</span>
                    </button>
                  </div>
                </div>

                {intervention.report && (
                  <div className={cn("p-4 rounded-lg border-2", isEditing ? "border-primary/20 bg-primary/[0.02]" : "border-green-100 bg-green-50/30")}>
                    <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" /> Rapport de Clôture
                    </h4>
                    {isEditing ? (
                      <textarea 
                        className="w-full h-24 p-3 bg-background border rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium italic"
                        value={formData.report}
                        onChange={(e) => setFormData({ ...formData, report: e.target.value })}
                        placeholder="Corriger le rapport technique..."
                      />
                    ) : (
                      <p className="text-sm italic text-green-800">{intervention.report}</p>
                    )}
                  </div>
                )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="w-full md:w-[350px] flex flex-col bg-muted/5">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Notes & Discussion
              </h4>
              <span className="text-[10px] bg-background px-2 py-0.5 rounded-full border">{comments?.length || 0}</span>
            </div>
            
            <div className="flex-1 md:overflow-y-auto p-4 space-y-4">
              {commentsLoading ? (
                <div className="text-center py-8 text-xs text-muted-foreground">Chargement des notes...</div>
              ) : comments?.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-2 opacity-40">
                  <MessageSquare className="w-10 h-10" />
                  <p className="text-xs">Aucun commentaire pour le moment.</p>
                </div>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-primary">{c.user.name}</span>
                      <span className="text-[9px] text-muted-foreground">{format(new Date(c.createdAt), 'HH:mm')}</span>
                    </div>
                    <div className="p-2.5 bg-background border rounded-lg rounded-tl-none text-xs shadow-sm shadow-black/5 leading-relaxed">
                      {c.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-card">
              <form onSubmit={handleSendComment} className="relative">
                <textarea
                  placeholder="Écrire une note technique..."
                  className="w-full h-24 p-3 bg-muted/30 border rounded-lg text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(e); } }}
                />
                <button 
                  type="submit"
                  disabled={!comment.trim() || createComment.isPending}
                  className="absolute bottom-2 right-2 p-1.5 bg-primary text-primary-foreground rounded-md shadow-lg hover:ring-2 ring-primary/20 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Popup */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center animate-in zoom-in-95 duration-300">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border-4 border-white/5"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="absolute bottom-10 px-6 py-2 bg-black/50 text-white/70 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-xl border border-white/10">
            Site Photo Diagnostic
          </div>
        </div>
      )}
    </div>
  );
}
