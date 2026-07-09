import { useState, useEffect } from 'react';
import { Eye, Clock, MapPin, BarChart4, Search, Filter, X, Plus } from 'lucide-react';
import { useTasks, useProjects, useSites } from '@/hooks/useApi';
import { TaskModal } from '@/components/modals/TaskModal';
import { TaskDetailModal } from '@/components/modals/TaskDetailModal';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { BASE_URL } from '@/lib/api';

const columnOrder = ['BACKLOG', 'A_FAIRE', 'EN_COURS', 'TERMINE'] as const;
const columnTitles: Record<string, string> = {
  BACKLOG: 'Backlog',
  A_FAIRE: 'À Faire',
  EN_COURS: 'En Cours',
  TERMINE: 'Terminé',
};

// Main Kanban Component
export function TaskTracking() {
  const { data: tasks, isLoading, error } = useTasks({ excludeArchived: 'true' });
  const { data: projects } = useProjects();
  const { data: sites } = useSites();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<string>('all');

  const [modalState, setModalState] = useState<{ open: boolean; task?: any; type: 'create' | 'edit' | 'detail' }>({ 
    open: false, 
    type: 'create' 
  });
  
  const [columns, setColumns] = useState<Record<string, any[]>>({
    BACKLOG: [],
    A_FAIRE: [],
    EN_COURS: [],
    TERMINE: [],
  });

  useEffect(() => {
    if (tasks) {
      const filtered = tasks.filter((task: any) => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProject = selectedProject === 'all' || task.phase?.projectId === Number(selectedProject);
        const matchesSite = selectedSite === 'all' || task.siteId === Number(selectedSite);
        return matchesSearch && matchesProject && matchesSite;
      });

      const newCols: Record<string, any[]> = { 
        BACKLOG: [], 
        A_FAIRE: [], 
        EN_COURS: [], 
        TERMINE: [],
      };
      filtered.forEach((task: any) => {
        const status = task.status || 'BACKLOG';
        if (newCols[status]) newCols[status].push(task);
      });
      setColumns(newCols);
    }
  }, [tasks, searchTerm, selectedProject, selectedSite]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse font-medium">Initialisation du Suivi des Tâches...</div>;
  if (error) return <div className="p-8 text-center text-destructive font-bold bg-destructive/5 border-2 border-dashed border-destructive/20 rounded-2xl m-6">Échec de synchronisation du tableau.</div>;

  return (
    <div className="min-h-screen lg:h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Planning & Suivi des Tâches</h2>
          <p className="text-muted-foreground font-medium text-sm">Gérez les phases de vos chantiers et priorisez les tâches en temps réel.</p>
        </div>
        <button 
          onClick={() => setModalState({ open: true, type: 'create' })} 
          className="premium-gradient text-primary-foreground px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border border-white/10"
        >
          <Plus className="w-5 h-5" /> Nouveau Chantier
        </button>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row items-center gap-4 p-5 bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm animate-in slide-in-from-top-2 duration-500">
        <div className="relative w-full sm:flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Rechercher une tâche ou un chantier..."
            className="w-full pl-11 pr-4 py-3 bg-background border border-border/50 rounded-xl text-sm font-medium focus:ring-4 focus:ring-primary/5 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border/50 rounded-xl shadow-sm hover:border-primary/50 transition-all w-full sm:w-auto">
            <Filter className="w-4 h-4 text-primary" />
             <div className="flex flex-col flex-1">
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Projet</span>
              <select 
                className="bg-transparent text-xs font-black focus:outline-none cursor-pointer pr-2 uppercase w-full"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="all">Tous les Projets</option>
                {projects?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
             </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border/50 rounded-xl shadow-sm hover:border-orange-500/50 transition-all w-full sm:w-auto">
            <MapPin className="w-4 h-4 text-orange-500" />
            <div className="flex flex-col flex-1">
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Localisation</span>
              <select 
                className="bg-transparent text-xs font-black focus:outline-none cursor-pointer pr-2 uppercase w-full"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <option value="all">Tous les Sites</option>
                {sites?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {(searchTerm || selectedProject !== 'all' || selectedSite !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedProject('all');
                setSelectedSite('all');
              }}
              className="w-full sm:w-auto px-4 py-3 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/5 rounded-xl transition-all border border-destructive/20 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Effacer
            </button>
          )}
        </div>
      </div>

      {modalState.type === 'create' || modalState.type === 'edit' ? (
        <TaskModal 
          isOpen={modalState.open} 
          onClose={() => setModalState({ ...modalState, open: false })} 
          task={modalState.task}
        />
      ) : (
        <TaskDetailModal 
          isOpen={modalState.open} 
          onClose={() => setModalState({ ...modalState, open: false })} 
          task={modalState.task} 
          onEdit={(task) => setModalState({ open: true, task, type: 'edit' })}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-8 flex-1 pb-24 lg:overflow-x-auto lg:no-scrollbar lg:custom-scrollbar">
        {columnOrder.map((columnId) => (
          <div key={columnId} className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col bg-muted/20 dark:bg-slate-900/40 rounded-[2.5rem] p-6 border border-border/50 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-8 px-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-4 h-4 rounded-full border-2 border-background shadow-sm", 
                  columnId === 'TERMINE' ? 'bg-green-500' : 
                  columnId === 'EN_COURS' ? 'bg-blue-500' : 
                  columnId === 'A_FAIRE' ? 'bg-orange-500' : 'bg-muted-foreground/30'
                )} />
                <h3 className="font-black text-[10px] tracking-[0.2em] uppercase text-foreground/50">{columnTitles[columnId]}</h3>
              </div>
              <span className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-black px-3 py-1 rounded-xl border border-border/50 shadow-sm">
                {columns[columnId]?.length || 0}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
              <div className="min-h-[200px] space-y-4">
                {columns[columnId]?.map((task) => (
                  <div
                    key={task.id}
                    className="bg-card text-card-foreground border-2 border-border/5 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:border-primary/40 hover:-translate-y-1 transition-all group relative select-none animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden"
                  >
                    {/* Status accent bar - Always visible but more intense on hover */}
                    <div className={cn("absolute left-0 top-0 bottom-0 w-2 transition-all", 
                       columnId === 'TERMINE' ? 'bg-green-500/30 group-hover:bg-green-500' : 
                       columnId === 'EN_COURS' ? 'bg-blue-500/30 group-hover:bg-blue-500' : 
                       columnId === 'A_FAIRE' ? 'bg-orange-500/30 group-hover:bg-orange-500' : 'bg-muted-foreground/10 group-hover:bg-muted-foreground'
                    )} />

                    <div className="flex justify-between items-start mb-5">
                      <h4 className="font-black text-base lg:text-sm leading-snug text-foreground group-hover:text-primary transition-colors pr-4">{task.title}</h4>
                      <BarChart4 className="w-6 h-6 text-muted-foreground/10 group-hover:text-primary/20 transition-colors shrink-0" />
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border shadow-sm",
                          task.priority === 'URGENTE' ? 'bg-red-50 text-red-600 border-red-500/20 shadow-red-500/5' : 
                          task.priority === 'HAUTE' ? 'bg-orange-50 text-orange-600 border-orange-500/20' :
                          'bg-muted/30 text-muted-foreground border-border/50'
                        )}>
                          {task.priority || 'BASSE'}
                        </span>
                        
                        {/* Team Avatars Stack */}
                        {task.assignedTechnicians && task.assignedTechnicians.length > 0 && (
                          <div className="flex items-center -space-x-2.5">
                            {task.assignedTechnicians.slice(0, 3).map((tech: any) => (
                              <div 
                                key={tech.id} 
                                className="w-9 h-9 rounded-full border-[3px] border-card bg-muted flex items-center justify-center overflow-hidden shadow-md hover:scale-110 transition-transform ring-2 ring-transparent hover:ring-primary/20"
                                title={tech.name}
                              >
                                {tech.avatar ? (
                                  <img src={tech.avatar.startsWith('http') ? tech.avatar : `${BASE_URL}${tech.avatar}`} alt={tech.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[11px] font-black">{tech.name.substring(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                            ))}
                            {task.assignedTechnicians.length > 3 && (
                              <div className="w-9 h-9 rounded-full border-[3px] border-card bg-slate-100 flex items-center justify-center shadow-md">
                                <span className="text-[9px] font-black text-slate-500">+{task.assignedTechnicians.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-4 pt-6 border-t-2 border-dashed border-border/50">
                        <div className="flex flex-col gap-2.5 overflow-hidden">
                          {task.site && (
                            <div className="text-[11px] font-black text-muted-foreground flex items-center gap-2.5 group-hover:text-foreground transition-all">
                              <MapPin className="w-4 h-4 text-orange-500/70" /> 
                              <span className="truncate uppercase tracking-tight">{task.site.name}</span>
                            </div>
                          )}
                          {task.phase?.project?.name && (
                            <div className="text-[11px] font-black text-primary/70 flex items-center gap-2.5">
                              <BarChart4 className="w-4 h-4" /> 
                              <span className="truncate uppercase tracking-wider">{task.phase.project.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                           <div className="flex items-center gap-2.5">
                              <Clock className="w-4 h-4 text-muted-foreground/30" />
                              <span className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-widest">{task.dueDate ? format(new Date(task.dueDate), 'dd MMMM', { locale: fr }) : 'Non planifié'}</span>
                           </div>
                           <button 
                             onClick={() => setModalState({ open: true, task: task, type: 'detail' })}
                             className="p-2.5 px-5 bg-primary/5 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center gap-2.5 font-black text-[10px] uppercase tracking-[0.2em] shadow-sm group-hover:premium-gradient group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20"
                           >
                             <Eye className="w-4 h-4" /> Voir
                           </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

