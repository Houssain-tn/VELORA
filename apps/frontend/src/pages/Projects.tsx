import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  GanttChartSquare, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { AddProjectModal } from '@/components/modals/AddProjectModal';
import { ProjectDetailModal } from '@/components/modals/ProjectDetailModal';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjects, useUpdateProject } from '@/hooks/useApi';

export function Projects() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const { canCreateProject } = usePermissions();

  const { data: projects, isLoading } = useProjects();
  const updateProject = useUpdateProject();

  const handleArchive = async (id: number) => {
    if (window.confirm('Voulez-vous archiver ce projet et tous ses chantiers ?')) {
      await updateProject.mutateAsync({ id, data: { status: 'ARCHIVE' } });
    }
  };

  const activeProjects = projects?.filter((p: any) => p.status !== 'ARCHIVE') || [];
  const filteredProjects = activeProjects.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Projets & Chantiers</h2>
          <p className="text-muted-foreground font-medium italic">Gestion des projets, phases de déploiement et chantiers actifs.</p>
        </div>
        {canCreateProject && (
          <button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Nouveau Projet
          </button>
        )}
      </div>

      <AddProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <ProjectDetailModal 
        isOpen={!!selectedProject} 
        onClose={() => setSelectedProject(null)} 
        project={selectedProject} 
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium hover:bg-muted transition-colors">
          <Filter className="w-4 h-4" />
          Filtres
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project: any) => (
          <div key={project.id} className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow border-border/50 group">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GanttChartSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">{project.name}</h3>
                    <p className="text-xs text-muted-foreground">Ref: PRJ-{project.id.toString().padStart(3, '0')}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(project);
                  }}
                  className="p-1 hover:bg-muted rounded-full"
                >
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                {project.description || 'Aucune description fournie.'}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Progression</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{project.startDate ? format(new Date(project.startDate), 'dd MMM yyyy', { locale: fr }) : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="truncate">{project.manager?.name || 'Non assigné'}</span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between group-hover:bg-primary/5 transition-colors">
              <div 
                onClick={() => setSelectedProject(project)}
                className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1"
              >
                {project.status === 'TERMINE' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Reception Finale</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600 uppercase text-[10px] tracking-wider font-black">Chantier En cours</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {project.status !== 'ARCHIVE' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleArchive(project.id); }}
                    className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all"
                    title="Archiver"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
                <ChevronRight 
                  onClick={() => setSelectedProject(project)}
                  className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform cursor-pointer" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {projects?.length === 0 && (
        <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <GanttChartSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Aucun projet trouvé</h3>
          <p className="text-muted-foreground">Les projets apparaîtront ici.</p>
          {canCreateProject && (
            <button onClick={() => setIsModalOpen(true)} className="mt-4 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted">Créer un projet</button>
          )}
        </div>
      )}
    </div>
  );
}
