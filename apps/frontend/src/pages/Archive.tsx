import { useState } from 'react';
import { useTasks, useProjects, useInterventions } from '@/hooks/useApi';
import { 
  Archive as ArchiveIcon, 
  Search, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  FileText,
  Wrench,
  ClipboardList,
  LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { cn } from '@/lib/utils';

export function Archive() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'PROJECTS' | 'INTERVENTIONS'>('PROJECTS');
  
  // Fetch ALL tasks (we will filter them locally for better UX in the archive)
  const { data: allTasks, isLoading: tasksLoading } = useTasks({ projectStatus: 'TERMINE,ARCHIVE' });
  
  // Fetch ALL closed interventions
  const { data: allInterventions, isLoading: interventionsLoading } = useInterventions({ status: 'CLOTUREE' });

  const archivedProjects = projects
    ?.filter((p: any) => p.status === 'TERMINE' || p.status === 'ARCHIVE')
    .sort((a: any, b: any) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    }) || [];
  
  const filteredProjects = archivedProjects.filter((p: any) => {
    const searchLow = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLow) ||
      p.contract?.name?.toLowerCase().includes(searchLow) ||
      p.id.toString().includes(searchLow)
    );
  });

  const filteredInterventions = (allInterventions || []).filter((i: any) => {
    const searchLow = searchTerm.toLowerCase();
    return (
      i.title.toLowerCase().includes(searchLow) ||
      i.reference?.toLowerCase().includes(searchLow) ||
      i.site?.name?.toLowerCase().includes(searchLow)
    );
  });

  if (projectsLoading || tasksLoading || interventionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Exploration des archives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Search */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground flex items-center gap-4">
            <ArchiveIcon className="w-10 h-10 text-primary" />
            Réception Finale & Archives
          </h2>
          <p className="text-muted-foreground font-medium">Consultez l'historique complet de vos chantiers et interventions clôturées.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          {/* Tabs */}
          <div className="flex bg-muted/50 p-1 rounded-2xl border-2 border-border/50 shadow-inner w-full md:w-auto">
            <button
              onClick={() => setViewMode('PROJECTS')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === 'PROJECTS' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Projets
            </button>
            <button
              onClick={() => setViewMode('INTERVENTIONS')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === 'INTERVENTIONS' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Interventions
            </button>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {viewMode === 'PROJECTS' ? (
        <div className="grid grid-cols-1 gap-8">
          {filteredProjects.length === 0 ? (
            <div className="py-32 text-center bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/50">
              <ArchiveIcon className="w-20 h-20 mx-auto mb-6 text-muted-foreground/20" />
              <h3 className="text-2xl font-black text-muted-foreground/40 uppercase tracking-widest">Aucun projet archivé</h3>
            </div>
          ) : (
            filteredProjects.map((project: any) => {
              // Get tasks for this project
              const projectTasks = (allTasks || []).filter((t: any) => t.phase?.projectId === project.id);
              
              // Get interventions for this project (linked via Contract/Site)
              const projectInterventions = (allInterventions || []).filter((i: any) => 
                 i.site?.contractId === project.contractId
              );

              const totalItems = projectTasks.length + projectInterventions.length;

              return (
                <div key={project.id} className="bg-card border-2 border-border/40 rounded-[2.5rem] overflow-hidden shadow-xl hover:border-primary/30 transition-all group">
                  {/* Project Header */}
                  <div className="p-8 bg-muted/30 border-b-2 border-border/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner">
                        <LayoutGrid className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shadow-sm">Projet Réceptionné</span>
                          <span className="text-xs font-bold text-muted-foreground">REF: {project.contract?.reference || project.id}</span>
                        </div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">{project.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                           <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Finalisé le {project.updatedAt ? format(new Date(project.updatedAt), 'dd MMMM yyyy', { locale: fr }) : 'Date inconnue'}</div>
                           {project.contract && <div className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {project.contract.name}</div>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Total Actions</p>
                          <p className="text-3xl font-black text-primary leading-none">{totalItems}</p>
                       </div>
                       <div className="h-12 w-0.5 bg-border/50 mx-2" />
                       <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Progression</p>
                          <p className="text-3xl font-black text-green-500 leading-none">100%</p>
                       </div>
                    </div>
                  </div>

                  {/* Combined List (Tasks & Interventions) */}
                  <div className="p-4 bg-muted/10">
                    <div className="bg-background/50 rounded-3xl border-2 border-border/20 overflow-x-auto shadow-inner">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border/20">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type / Libellé</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chantier</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {/* Render Project Tasks */}
                          {projectTasks.map((task: any) => (
                            <tr key={`task-${task.id}`} className="hover:bg-primary/5 transition-colors group/row">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                                    <ClipboardList className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm text-foreground group-hover/row:text-primary transition-colors">{task.title}</span>
                                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">Tâche de Phase</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[200px] uppercase tracking-tight">{task.site?.name || 'Non spécifié'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => setSelectedTask(task)}
                                  className="inline-flex items-center gap-2 p-2 px-4 bg-muted/5 hover:bg-primary hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.2em] border border-border/50 group-hover/row:border-primary/30"
                                >
                                  Historique <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}

                          {/* Render Project Related Interventions */}
                          {projectInterventions.map((intervention: any) => (
                            <tr key={`inter-${intervention.id}`} className="hover:bg-primary/5 transition-colors group/row">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                    <Wrench className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm text-foreground group-hover/row:text-primary transition-colors">{intervention.title}</span>
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Intervention (Ref: {intervention.reference})</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[200px] uppercase tracking-tight">{intervention.site?.name || 'Non spécifié'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => setSelectedTask({...intervention, isIntervention: true})}
                                  className="inline-flex items-center gap-2 p-2 px-4 bg-muted/5 hover:bg-primary hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.2em] border border-border/50 group-hover/row:border-primary/30"
                                >
                                  Rapport <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}

                          {totalItems === 0 && (
                            <tr>
                              <td colSpan={3} className="px-6 py-12 text-center text-xs font-bold text-muted-foreground italic opacity-50 uppercase tracking-widest bg-muted/5">
                                Aucune donnée trouvée pour ce projet dans les archives.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* Standalone Interventions View */
        <div className="bg-card border-2 border-border/40 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="p-8 border-b-2 border-border/20 flex items-center justify-between bg-muted/30">
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tight italic uppercase">Mssions Clôturées</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Interventions de maintenance terminées et archivées</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Missions Archivées</p>
              <p className="text-3xl font-black text-primary leading-none">{filteredInterventions.length}</p>
            </div>
          </div>
          <div className="p-4">
             <div className="bg-background/50 rounded-3xl border-2 border-border/20 overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-muted/50 border-b border-border/20">
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">ID / Référence</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Désignation</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client / Site</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date Clôture</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border/10">
                   {filteredInterventions.map((intervention: any) => (
                     <tr key={intervention.id} className="hover:bg-primary/5 transition-colors group/row">
                       <td className="px-6 py-4">
                         <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black border border-blue-500/20">
                           {intervention.reference}
                         </span>
                       </td>
                       <td className="px-6 py-4">
                         <span className="font-bold text-sm text-foreground">{intervention.title}</span>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-xs font-bold text-foreground">
                             {intervention.site?.contract?.client?.name || 'Client Inconnu'}
                           </span>
                           <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-tight truncate max-w-[150px]">
                             {intervention.site?.name || 'Site Inconnu'}
                           </span>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <span className="text-xs font-bold text-muted-foreground">
                           {intervention.updatedAt ? format(new Date(intervention.updatedAt), 'dd/MM/yyyy') : 'N/A'}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button 
                            onClick={() => setSelectedTask({...intervention, isIntervention: true})}
                            className="inline-flex items-center gap-2 p-2 px-4 bg-muted/5 hover:bg-primary hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.2em] border border-border/50"
                          >
                            Rapport <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                       </td>
                     </tr>
                   ))}
                   {filteredInterventions.length === 0 && (
                     <tr>
                       <td colSpan={5} className="py-20 text-center text-muted-foreground/50 font-black uppercase tracking-widest text-sm">
                         Aucune intervention dans les archives
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
        />
      )}
    </div>
  );
}
