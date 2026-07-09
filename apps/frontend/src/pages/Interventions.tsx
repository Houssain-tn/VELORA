import { useState } from 'react';
import { Plus, Search, Filter, AlertCircle, CheckCircle, FileDown, Clock, Eye, MoreVertical, Trash2, FileText, Receipt, MapPin, Edit2, ExternalLink, Users, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { useInterventions, useUpdateIntervention, useDeleteIntervention, useCompanies } from '@/hooks/useApi';
import { AddInterventionModal } from '@/components/modals/AddInterventionModal';
import { InterventionDetailModal } from '@/components/modals/InterventionDetailModal';
import { InvoiceModal } from '@/components/modals/InvoiceModal';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/components/ui/Toaster';
import { generateInterventionReport } from '@/lib/export';
import { BASE_URL } from '@/lib/api';
import { ExportButton } from '@/components/ui/ExportButton';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  DEMANDE: { label: 'À Faire', icon: Clock, color: 'text-orange-500 bg-orange-50' },
  VALIDEE: { label: 'Validée', icon: CheckCircle, color: 'text-blue-500 bg-blue-50' },
  ASSIGNEE: { label: 'Assignée', icon: Users, color: 'text-indigo-500 bg-indigo-50' },
  EN_COURS: { label: 'En Cours', icon: AlertCircle, color: 'text-blue-600 bg-blue-100' },
  RAPPORT_SOUMIS: { label: 'Rapport Envoyé', icon: FileText, color: 'text-purple-500 bg-purple-50' },
  VALIDATION_CLIENT: { label: 'Val. Client', icon: Eye, color: 'text-cyan-500 bg-cyan-50' },
  CLOTUREE: { label: 'Terminée', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50' },
  ANNULEE: { label: 'Annulée', icon: XCircle, color: 'text-slate-400 bg-slate-50 opacity-60' },
};

export function Interventions() {
  const { data: interventions, isLoading, error } = useInterventions({ excludeArchived: 'true' });
  const { data: companies } = useCompanies();
  const myCompany = companies?.find((c: any) => c.id === 1);
  const updateIntervention = useUpdateIntervention();
  const deleteIntervention = useDeleteIntervention();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [interventionToInvoice, setInterventionToInvoice] = useState<any>(null);
  const [selectedInterventionIds, setSelectedInterventionIds] = useState<Set<number>>(new Set());
  const { isAdmin, isSuperAdmin, canCreateIntervention, canDeleteIntervention, canEditIntervention } = usePermissions();
  const canInvoice = isAdmin || isSuperAdmin; 

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedInterventionIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedInterventionIds(newSelected);
  };


  const toggleAll = () => {
    if (selectedInterventionIds.size === filteredInterventions?.length) {
      setSelectedInterventionIds(new Set());
    } else {
      setSelectedInterventionIds(new Set(filteredInterventions?.map((i: any) => i.id)));
    }
  };

  const handleBulkInvoice = () => {
    const selectedList = interventions?.filter((i: any) => selectedInterventionIds.has(i.id));
    setInterventionToInvoice(selectedList); // Passing array
    setIsInvoiceModalOpen(true);
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette intervention définitivement ?')) return;
    try {
      await deleteIntervention.mutateAsync(id);
      toast.success('Intervention supprimée');
    } catch {
      toast.error('Échec de la suppression');
    }
  };



  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse font-medium">Chargement des interventions...</div>;
  if (error) return <div className="p-8 text-center text-destructive bg-destructive/5 rounded-lg border border-destructive/20 m-6">Erreur lors de la récupération des interventions.</div>;

  const activeFilterCount = (statusFilter !== 'ALL' ? 1 : 0) + (priorityFilter !== 'ALL' ? 1 : 0);

  const filteredInterventions = interventions?.filter((intervention: any) => {
    const matchSearch = intervention.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.site?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || intervention.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || intervention.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Interventions Techniques</h2>
          <p className="text-muted-foreground">Suivez vos tickets et planifiez vos équipes de maintenance.</p>
        </div>
        {canCreateIntervention && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Nouvelle Intervention
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md group">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="search"
              placeholder="Rechercher par ID, titre, site..."
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all pl-9 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 border border-input rounded-md bg-background px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="DEMANDE">À Faire</option>
              <option value="VALIDEE">Validée</option>
              <option value="ASSIGNEE">Assignée</option>
              <option value="EN_COURS">En Cours</option>
              <option value="RAPPORT_SOUMIS">Rapport Envoyé</option>
              <option value="VALIDATION_CLIENT">Val. Client</option>
              <option value="CLOTUREE">Terminée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="h-9 border border-input rounded-md bg-background px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">Toutes priorités</option>
              <option value="URGENTE">🔴 Urgente</option>
              <option value="HAUTE">🟠 Haute</option>
              <option value="NORMALE">🔵 Normale</option>
              <option value="BASSE">⚪ Basse</option>
            </select>
            {/* Active filter badge */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setStatusFilter('ALL'); setPriorityFilter('ALL'); }}
                className="flex items-center gap-1.5 h-9 px-3 bg-primary/10 text-primary border border-primary/20 rounded-md text-sm font-bold hover:bg-primary/20 transition-colors"
              >
                <Filter className="w-3.5 h-3.5" /> {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''} <span className="ml-1 opacity-60">×</span>
              </button>
            )}
            <ExportButton 
              data={filteredInterventions?.map((item: any) => ({
                'Référence': item.reference,
                'Titre': item.title,
                'Site': item.site?.name || 'N/A',
                'Client': item.site?.contract?.client?.name || 'N/A',
                'Priorité': item.priority,
                'Statut': statusConfig[item.status]?.label || item.status,
                'Technicien': item.assignedTo?.name || 'Non assigné',
                'Date Création': format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
                'SLA Deadline': item.slaDeadline ? format(new Date(item.slaDeadline), 'dd/MM/yyyy HH:mm') : 'N/A',
              })) || []}
              filename="Interventions_VELORA_PRO"
              pdfTargetId="interventions-table"
            />
          </div>
        </div>
        {/* Results count */}
        {filteredInterventions && (
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {filteredInterventions.length} résultat{filteredInterventions.length !== 1 ? 's' : ''}
            {searchTerm || activeFilterCount > 0 ? ` sur ${interventions?.length || 0} interventions` : ' au total'}
          </p>
        )}
      </div>

      <div className="border rounded-lg bg-card shadow-sm border-border/50" id="interventions-table">
        <div className="hidden md:block overflow-x-auto pb-48 -mb-48">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    checked={selectedInterventionIds.size > 0 && selectedInterventionIds.size === filteredInterventions?.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-6 py-4 font-bold">Référence</th>
                <th className="px-6 py-4 font-bold">Titre</th>
                <th className="px-6 py-4 font-bold">Site Affilié</th>
                <th className="px-6 py-4 font-bold">Priorité</th>
                <th className="px-6 py-4 font-bold">Statut</th>
                <th className="px-6 py-4 font-bold">Équipe</th>
                <th className="px-6 py-4 font-bold">Date Prévue</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInterventions?.map((intervention: any) => {
                const config = statusConfig[intervention.status] || statusConfig.DEMANDE;
                const StatusIcon = config.icon;
                return (
                  <tr key={intervention.id} className={cn("last:border-0 hover:bg-muted/30 transition-colors", selectedInterventionIds.has(intervention.id) && "bg-primary/5")}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        checked={selectedInterventionIds.has(intervention.id)}
                        onChange={() => toggleSelection(intervention.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      <div className="flex flex-col">
                        <span>{intervention.reference || intervention.id}</span>
                        {intervention.billable && !intervention.invoice && (
                          <span className="text-[9px] font-black text-amber-600 uppercase flex items-center gap-0.5 mt-0.5">
                            💰 Facturable
                          </span>
                        )}
                        {intervention.invoice && (
                          <span className="text-[9px] font-black text-green-600 uppercase flex items-center gap-0.5 mt-0.5">
                            ✅ Facturé
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{intervention.title}</td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      {intervention.site?.name ? (
                        <div className="truncate max-w-[200px]" title={intervention.site.name}>
                          {intervention.site.name}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-primary italic font-bold">
                          <MapPin className="w-3.5 h-3.5" /> 
                          <span className="truncate max-w-[180px]" title={intervention.manualLocation || 'Hors Site'}>
                            {intervention.manualLocation || 'Intervention Hors Site'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", 
                        intervention.priority === 'URGENTE' ? 'bg-red-100 text-red-700' :
                        intervention.priority === 'HAUTE' ? 'bg-orange-100 text-orange-700' :
                        intervention.priority === 'NORMALE' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {intervention.priority || 'BASSE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-flex items-center group/status">
                        <StatusIcon className="absolute left-2.5 w-3.5 h-3.5 pointer-events-none z-10" />
                        <select
                          className={cn("appearance-none cursor-pointer outline-none inline-flex items-center pl-8 pr-7 py-1 rounded-md text-xs font-bold border-2 transition-all", config.color, "hover:opacity-80")}
                          value={intervention.status}
                          onChange={(e) => updateIntervention.mutate({ id: intervention.id, data: { status: e.target.value } })}
                          disabled={updateIntervention.isPending || !canEditIntervention}
                        >
                          <option value="DEMANDE">À Faire</option>
                          <option value="VALIDEE">Validée</option>
                          <option value="ASSIGNEE">Assignée</option>
                          <option value="EN_COURS">En Cours</option>
                          <option value="RAPPORT_SOUMIS">Rapport Envoyé</option>
                          <option value="VALIDATION_CLIENT">Val. Client</option>
                          <option value="CLOTUREE">Terminée</option>
                          <option value="ANNULEE">Annulée</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2 overflow-hidden">
                        {intervention.assignedTechnicians?.slice(0, 3).map((tech: any) => (
                          <div key={tech.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 overflow-hidden" title={tech.name}>
                            {tech.avatar ? (
                              <img src={tech.avatar.startsWith('http') ? tech.avatar : `${BASE_URL}${tech.avatar}`} alt={tech.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] font-black">{tech.name[0]}</div>
                            )}
                          </div>
                        ))}
                        {intervention.assignedTechnicians?.length > 3 && (
                          <div className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-50 text-[8px] font-black">
                            +{intervention.assignedTechnicians.length - 3}
                          </div>
                        )}
                        {(!intervention.assignedTechnicians || intervention.assignedTechnicians.length === 0) && (
                          <span className="text-[10px] text-muted-foreground italic">Non assigné</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{new Date(intervention.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { setSelectedIntervention(intervention); setIsEditMode(false); }}
                            className="p-1.5 px-3 bg-primary/10 text-primary rounded-md hover:bg-primary hover:text-white transition-all flex items-center gap-2 font-bold text-[10px] uppercase shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" /> Voir
                          </button>
                             <button 
                               onClick={() => { setSelectedIntervention(intervention); setIsEditMode(true); setIsModalOpen(true); }}
                               className="p-1.5 px-3 bg-blue-500/10 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 font-bold text-[10px] uppercase shadow-sm"
                               title="Modifier l'intervention"
                             >
                               <Edit2 className="w-3.5 h-3.5" /> Modifier
                             </button>
                             <div className="relative">
                               <button 
                                 onClick={() => setActiveDropdown(activeDropdown === intervention.id ? null : intervention.id)}
                                 className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors border border-transparent hover:border-border"
                               >
                                 <MoreVertical className="w-5 h-5" />
                               </button>
                             {activeDropdown === intervention.id && (
                               <>
                                 <div 
                                   className="fixed inset-0 z-10" 
                                   onClick={() => setActiveDropdown(null)} 
                                 />
                                 <div className="absolute right-0 mt-2 w-40 bg-card border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
                                   <button 
                                     onClick={() => { setSelectedIntervention(intervention); setIsEditMode(false); setActiveDropdown(null); }}
                                     className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-muted transition-colors flex items-center gap-2 border-b"
                                   >
                                     <Eye className="w-3.5 h-3.5" /> Voir Détails
                                   </button>
                                     <button 
                                       onClick={() => { setSelectedIntervention(intervention); setIsEditMode(true); setIsModalOpen(true); setActiveDropdown(null); }}
                                       className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-muted transition-colors flex items-center gap-2 border-b"
                                     >
                                       <Edit2 className="w-3.5 h-3.5" /> Modifier Détails
                                     </button>
                                       <button 
                                         onClick={() => { generateInterventionReport(intervention, myCompany, 'PREVIEW'); setActiveDropdown(null); }}
                                         className="w-full px-4 py-2.5 text-left text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 border-b"
                                       >
                                         <ExternalLink className="w-3.5 h-3.5" /> Visualiser Rapport
                                       </button>
                                       <button 
                                         onClick={() => { generateInterventionReport(intervention, myCompany, 'SAVE'); setActiveDropdown(null); }}
                                         className="w-full px-4 py-2.5 text-left text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 border-b"
                                       >
                                         <FileDown className="w-3.5 h-3.5" /> Télécharger Rapport
                                       </button>
                                   {canInvoice && intervention.status === 'CLOTUREE' && intervention.billable && !intervention.invoice && (
                                     <button 
                                       onClick={() => { 
                                         setInterventionToInvoice(intervention); 
                                         setIsInvoiceModalOpen(true); 
                                         setActiveDropdown(null); 
                                       }}
                                       className="w-full px-4 py-2.5 text-left text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2 border-b"
                                     >
                                       <Receipt className="w-3.5 h-3.5" /> Facturer
                                     </button>
                                   )}
                                   {canDeleteIntervention && (
                                     <button 
                                       onClick={() => handleDelete(intervention.id)}
                                       className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                     >
                                       <Trash2 className="w-3.5 h-3.5" /> Supprimer
                                     </button>
                                   )}
                                 </div>
                               </>
                             )}
                           </div>
                        </div>
                     </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: High-Visibility Premium Cards */}
        <div className="md:hidden space-y-6 px-1 pb-32">
          {filteredInterventions?.map((intervention: any) => {
            const config = statusConfig[intervention.status] || statusConfig.DEMANDE;
            const StatusIcon = config.icon;
            
            return (
              <div 
                key={intervention.id} 
                className="bg-card border rounded-[2.5rem] p-7 space-y-6 shadow-xl relative overflow-hidden transition-all active:scale-[0.98]"
              >
                {/* Decorative Status Accent */}
                <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none", config.color.split(' ')[0].replace('text-', 'bg-'))} />
                
                <div className="flex items-start justify-between relative">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                       <span className="text-[11px] font-black text-primary px-3 py-1.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm uppercase tracking-[0.2em]">
                        {intervention.reference || `#${intervention.id}`}
                      </span>
                      <span className={cn("px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm", 
                        intervention.priority === 'URGENTE' ? 'bg-red-50 text-red-600 border-red-600/20' :
                        intervention.priority === 'HAUTE' ? 'bg-orange-50 text-orange-600 border-orange-600/20' :
                        'bg-blue-50 text-blue-600 border-blue-600/20'
                      )}>
                        {intervention.priority}
                      </span>
                    </div>
                    <h3 className="font-black text-xl leading-tight tracking-tighter text-foreground decoration-primary/30 underline-offset-4">{intervention.title}</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => { setSelectedIntervention(intervention); setIsEditMode(false); }}
                      className="w-14 h-14 flex items-center justify-center text-primary bg-primary/10 rounded-3xl shadow-lg shadow-primary/10 active:scale-90 transition-all border border-primary/10"
                    >
                      <Eye className="w-6 h-6 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Core Details Grid */}
                <div className="grid grid-cols-1 gap-4 py-4 border-y border-dashed border-border/60">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted/50 rounded-2xl flex items-center justify-center border shadow-sm shrink-0">
                       <MapPin className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-0.5">Localisation</p>
                      <p className="text-sm font-bold text-foreground/90 truncate leading-tight">
                        {intervention.site?.name || intervention.manualLocation || 'Hors Chantier'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted/50 rounded-2xl flex items-center justify-center border shadow-sm shrink-0">
                        <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-0.5">Date Prévue</p>
                      <p className="text-sm font-bold text-foreground/90 leading-tight">
                         {intervention.plannedDate ? format(new Date(intervention.plannedDate), 'dd MMMM yyyy', { locale: fr }) : format(new Date(intervention.createdAt), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6 pt-2">
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 italic">Équipe Assignée</p>
                      <div className="flex -space-x-3">
                        {intervention.assignedTechnicians?.length > 0 ? (
                          intervention.assignedTechnicians.slice(0, 3).map((tech: any) => (
                            <div key={tech.id} className="h-12 w-12 rounded-full border-4 border-card bg-slate-100 flex items-center justify-center text-[12px] font-black overflow-hidden ring-1 ring-border/50 shadow-xl">
                               {tech.avatar ? <img src={tech.avatar.startsWith('http') ? tech.avatar : `${BASE_URL}${tech.avatar}`} alt={tech.name} className="w-full h-full object-cover" /> : tech.name[0].toUpperCase()}
                            </div>
                          ))
                        ) : (
                          <div className="h-12 w-12 rounded-full border-4 border-card bg-muted flex items-center justify-center text-[10px] font-black italic opacity-40">N/A</div>
                        )}
                        {intervention.assignedTechnicians?.length > 3 && (
                          <div className="h-12 w-12 rounded-full border-4 border-card bg-primary text-white flex items-center justify-center text-[12px] font-black shadow-xl z-10">
                            +{intervention.assignedTechnicians.length - 3}
                          </div>
                        )}
                      </div>
                   </div>

                   <div className="relative inline-flex items-center group w-full">
                    <StatusIcon className="absolute left-5 w-6 h-6 pointer-events-none z-10 opacity-70" />
                    <select
                      className={cn("appearance-none cursor-pointer outline-none w-full pl-14 pr-10 py-5 rounded-3xl text-sm font-black border-2 transition-all uppercase tracking-widest shadow-2xl", config.color, "focus:ring-8 focus:ring-primary/5")}
                      value={intervention.status}
                      onChange={(e) => updateIntervention.mutate({ id: intervention.id, data: { status: e.target.value } })}
                    >
                       <option value="DEMANDE">📌 À Faire</option>
                       <option value="VALIDEE">✔️ Validée</option>
                       <option value="ASSIGNEE">👷 Assignée</option>
                       <option value="EN_COURS">⚡ En Cours</option>
                       <option value="RAPPORT_SOUMIS">📝 Rapport Envoyé</option>
                       <option value="VALIDATION_CLIENT">👁️ Val. Client</option>
                       <option value="CLOTUREE">✅ Terminée</option>
                       <option value="ANNULEE">❌ Annulée</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                      onClick={() => generateInterventionReport(intervention, myCompany, 'PREVIEW')}
                      className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                     <FileText className="w-5 h-5 shrink-0" /> Rapport
                   </button>
                   <button 
                      onClick={() => { setSelectedIntervention(intervention); setIsEditMode(true); setIsModalOpen(true); }}
                      className="w-20 py-5 bg-muted rounded-[1.5rem] text-muted-foreground text-[11px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center border shadow-sm"
                   >
                     <Edit2 className="w-5 h-5 shrink-0" />
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AddInterventionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} intervention={selectedIntervention} isEditMode={isEditMode} />
      <InterventionDetailModal 
        isOpen={!!selectedIntervention && !isEditMode} 
        onClose={() => { setSelectedIntervention(null); setIsEditMode(false); }} 
        intervention={selectedIntervention} 
      />
      <InvoiceModal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => { setIsInvoiceModalOpen(false); setInterventionToInvoice(null); }} 
        intervention={interventionToInvoice} 
      />

      {/* Bulk Action Bar */}
      {selectedInterventionIds.size > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-md">
            <span className="text-sm font-bold">{selectedInterventionIds.size} sélectionné(s)</span>
            <div className="w-px h-4 bg-primary-foreground/20" />
            <div className="flex items-center gap-3">
              {canInvoice && (
                <button 
                   onClick={handleBulkInvoice}
                   className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all text-sm font-bold"
                >
                  <Receipt className="w-4 h-4" /> Facturer
                </button>
              )}
              <button 
                onClick={() => setSelectedInterventionIds(new Set())}
                className="text-primary-foreground/70 hover:text-primary-foreground text-sm font-medium px-2 py-1 rounded"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button */}
      {canCreateIntervention && (
        <button 
          onClick={() => { setSelectedIntervention(null); setIsEditMode(false); setIsModalOpen(true); }}
          className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform active:scale-90"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}
