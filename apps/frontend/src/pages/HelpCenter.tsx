import { useState, useMemo } from 'react';
import { 
  Zap, Shield, Users, Wrench, ClipboardList, ChevronRight, 
  HelpCircle, Scale, LayoutDashboard, Activity, Search,
  GanttChartSquare, CalendarDays, MapPin, Monitor, Receipt, 
  FileText, Camera, Fingerprint, Globe, Server, Database, Menu, X,
  FileCode, AlertTriangle, ShoppingCart, ArrowRightLeft, PackageCheck, Workflow
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import VeloraLogo from '@/assets/Logos/Velora_logo.png';

type SectionId = 
  | 'welcome' 
  | 'pilotage' 
  | 'interventions' 
  | 'chantiers' 
  | 'parc' 
  | 'finance' 
  | 'admin' 
  | 'workflows'
  | 'pwa'
  | 'saas'
  | 'legal'
  | 'datasheet'
  | 'copilot';

interface NavItem {
  id: SectionId;
  label: string;
  icon: any;
  description: string;
  keywords: string[];
}

export function HelpCenter() {
  const [activeSection, setActiveSection] = useState<SectionId>('welcome');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation: NavItem[] = useMemo(() => [
    { id: 'welcome', label: 'Bienvenue', icon: HelpCircle, description: 'Introduction et vision VELORA PRO', keywords: ['bienvenue', 'introduction', 'vision', 'elite', 'pro'] },
    { id: 'pilotage', label: '1. Pilotage & Analytics', icon: LayoutDashboard, description: 'KPIs, Cartographie et Control Room', keywords: ['pilotage', 'kpi', 'dashboard', 'analytics', 'carte', 'map', 'slas'] },
    { id: 'interventions', label: '2. Opérations Terrain', icon: Wrench, description: 'Workflow, Signature et Rapports PDF', keywords: ['interventions', 'tickets', 'terrain', 'signature', 'pdf', 'techniciens'] },
    { id: 'chantiers', label: '3. Gestion de Chantiers', icon: ClipboardList, description: 'Kanban, Phases de Projets et Gantt', keywords: ['chantiers', 'projets', 'kanban', 'agile', 'phases', 'gantt'] },
    { id: 'parc', label: '4. Parc Technique', icon: Monitor, description: 'Digital Twins, QR Codes et Inventaires', keywords: ['parc', 'technique', 'qr', 'code', 'jumeaux', 'inventaire'] },
    { id: 'finance', label: '5. Finance & Achats', icon: Receipt, description: 'Factures, SLAs et Transformation d\'Actifs', keywords: ['finance', 'achats', 'factures', 'procurement', 'actifs', 'transformation', 'stock'] },
    { id: 'admin', label: '6. Administration & Sec', icon: Shield, description: 'Matrice RBAC, Forensics et Audit', keywords: ['admin', 'securite', 'rbac', 'roles', 'audit', 'logs'] },
    { id: 'workflows', label: '7. Moteur de Workflows', icon: Workflow, description: 'Éditeur BPMN, Cycle de Vie', keywords: ['workflows', 'bpmn', 'etats', 'transitions', 'diagramme'] },
    { id: 'pwa', label: '8. Mode Hors-Ligne (PWA)', icon: Globe, description: 'Installation Mobile, Sync Cache', keywords: ['pwa', 'hors-ligne', 'mobile', 'cache', 'sync', 'offline'] },
    { id: 'saas', label: '9. Architecture Multi-Tenancy', icon: Database, description: 'SaaS, Agences, Isolement', keywords: ['saas', 'multi', 'tenant', 'agence', 'isolement'] },
    { id: 'copilot', label: '10. Velora Copilot (IA)', icon: Zap, description: 'Assistant intelligent, IA, Recherche NLP', keywords: ['ia', 'copilot', 'assistant', 'nlp', 'intelligence'] },
    { id: 'datasheet', label: 'Fiche Technique', icon: FileCode, description: 'Architecture Monorepo, API & Stack', keywords: ['fiche', 'technique', 'architecture', 'api', 'stack', 'serveur'] },
    { id: 'legal', label: 'Légal & Copyright', icon: Scale, description: 'Licence, Mentions et Waycon Med', keywords: ['legal', 'copyright', 'licence', 'waycon', 'mediterrannee'] },
  ], []);

  const filteredNavigation = useMemo(() => {
    if (!searchQuery.trim()) return navigation;
    const query = searchQuery.toLowerCase();
    return navigation.filter(item => 
      item.label.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) ||
      item.keywords.some(k => k.includes(query))
    );
  }, [searchQuery, navigation]);

  const ActiveContent = () => {
    switch (activeSection) {
      case 'welcome': return <WelcomeContent />;
      case 'pilotage': return <PilotageContent />;
      case 'interventions': return <InterventionsContent />;
      case 'chantiers': return <ChantiersContent />;
      case 'parc': return <ParcContent />;
      case 'finance': return <FinanceContent />;
      case 'admin': return <AdminContent />;
      case 'workflows': return <WorkflowsContent />;
      case 'pwa': return <PwaContent />;
      case 'saas': return <SaasContent />;
      case 'copilot': return <div className="p-8 space-y-6"><h2 className="text-2xl font-bold">Velora Copilot (IA)</h2><p className="text-slate-500">L'assistant Copilot analyse en temps réel vos interventions, alertes et projets pour vous fournir un état des lieux instantané. Demandez "Quelles sont mes interventions ?" ou "Où en est le stock ?".</p></div>;
      case 'datasheet': return <DatasheetContent />;
      case 'legal': return <LegalContent />;
      default: return <WelcomeContent />;
    }
  };

  return (
    <div className="w-full min-w-0 flex h-[calc(100vh-8rem)] bg-background/50 backdrop-blur-xl rounded-3xl border border-primary/10 shadow-2xl overflow-hidden relative group">
      {/* GLOW EFFECTS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* SIDEBAR NAVIGATION */}
      <aside className={cn(
        "absolute inset-y-0 left-0 z-50 w-80 bg-card/80 backdrop-blur-3xl border-r border-primary/10 transition-transform duration-300 transform lg:relative lg:translate-x-0 shrink-0 shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Help Center</h2>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
              Enterprise Edition 2026
            </p>
          </div>

          {/* SEARCH BAR */}
          <div className="relative group/search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher une fonctionnalité..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background/50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-md transition-colors">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>

          <nav className="space-y-1.5 flex-1">
            {filteredNavigation.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs font-semibold text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
              </div>
            ) : (
              filteredNavigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 p-3.5 rounded-2xl transition-all duration-300 group/btn border border-transparent relative overflow-hidden",
                    activeSection === item.id 
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] border-primary/20" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground hover:border-border/50"
                  )}
                >
                  {/* Subtle hover effect background */}
                  {activeSection !== item.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  )}

                  <item.icon className={cn(
                    "w-4 h-4 mt-0.5 shrink-0 transition-transform duration-300 group-hover/btn:scale-110", 
                    activeSection === item.id ? "text-white" : "text-primary"
                  )} />
                  <div className="flex flex-col items-start gap-1 min-w-0 flex-1 relative z-10">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black uppercase tracking-tight truncate">{item.label}</span>
                      <ChevronRight className={cn(
                        "w-3 h-3 shrink-0 transition-all duration-300", 
                        activeSection === item.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                      )} />
                    </div>
                    <span className={cn(
                      "text-[9px] font-medium text-left leading-relaxed line-clamp-2", 
                      activeSection === item.id ? "text-primary-foreground/80" : "text-muted-foreground/70"
                    )}>
                      {item.description}
                    </span>
                  </div>
                </button>
              ))
            )}
          </nav>

          <div className="mt-auto pt-4 border-t border-border/50">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-[2rem] border border-primary/20 relative overflow-hidden group/support">
               <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 -translate-x-full group-hover/support:animate-[shimmer_1.5s_infinite]" />
               <div className="flex items-center gap-3 mb-3 relative z-10">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                    <HelpCircle className="w-4 h-4 text-white" />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Waycon Dev</span>
                   <span className="text-[8px] font-bold text-muted-foreground tracking-widest uppercase">Support Live Agent</span>
                 </div>
               </div>
               <a href="mailto:contact@waycon.com" className="block w-full text-center py-2.5 bg-background border border-primary/20 text-foreground rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm relative z-10">
                 Obtenir de l'aide
               </a>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE MENU TRIGGER */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden absolute top-4 left-4 z-[60] bg-primary text-white p-2.5 rounded-xl shadow-lg hover:bg-primary/90 transition-colors"
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto px-6 py-10 lg:px-16 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <ActiveContent />
          </motion.div>
        </AnimatePresence>

        {/* NAVIGATION FOOTER */}
        <footer className="max-w-4xl mx-auto mt-24 pt-10 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 opacity-50 hover:opacity-100 transition-opacity">
           <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">VELORA PRO Suite</span>
             <span className="text-[10px] font-bold text-primary italic lowercase">conçu par Waycon Mediterrannée</span>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"><Globe className="w-4 h-4 text-primary" /> Cloud</div>
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"><Server className="w-4 h-4 text-primary" /> API</div>
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"><Database className="w-4 h-4 text-primary" /> MySQL</div>
           </div>
        </footer>
      </main>
    </div>
  );
}

// --- NEW PRO MODULES CONTENT ---

function WorkflowsContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-5">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
          <Workflow className="w-10 h-10 sm:w-12 sm:h-12 text-primary shrink-0" />
          7. Moteur de Workflows
        </h2>
        <p className="text-lg text-muted-foreground font-medium border-l-4 border-primary/30 pl-5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          Modélisation visuelle BPMN pour définir le cycle de vie exact de chaque processus métier.
        </p>
      </header>
      <div className="p-8 bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-primary/20 shadow-xl space-y-6">
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          Le module de Workflows (accessible via <code>/workflows</code>) vous permet de visualiser et d'adapter les états par lesquels passe une entité (ex: Intervention).
          Il est conçu avec Framer Motion pour animer les transitions et fournir une vision globale des processus agiles et restrictifs.
        </p>
      </div>
    </div>
  );
}

function PwaContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-5">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
          <Globe className="w-10 h-10 sm:w-12 sm:h-12 text-primary shrink-0" />
          8. Mode Hors-Ligne (PWA)
        </h2>
        <p className="text-lg text-muted-foreground font-medium border-l-4 border-primary/30 pl-5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          Application mobile native avec Service Worker et synchronisation en mode dégradé.
        </p>
      </header>
      <div className="p-8 bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-primary/20 shadow-xl space-y-6">
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          Velora Pro agit comme une Progressive Web App (PWA). Un Service Worker met intelligemment en cache les ressources de l'interface et vos requêtes API.
          Si vous perdez le réseau sur un site distant, un badge jaune "Mode Hors-Ligne Actif" apparaîtra, et vous pourrez consulter l'historique sans connexion.
        </p>
      </div>
    </div>
  );
}

function SaasContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-5">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
          <Database className="w-10 h-10 sm:w-12 sm:h-12 text-primary shrink-0" />
          9. Architecture Multi-Tenancy
        </h2>
        <p className="text-lg text-muted-foreground font-medium border-l-4 border-primary/30 pl-5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          Isolation stricte des données B2B pour le déploiement d'un écosystème Multi-Agences.
        </p>
      </header>
      <div className="p-8 bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-primary/20 shadow-xl space-y-6">
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
          Toute la base de données est cloisonnée par <code>tenantId</code>. Le backend NestJS filtre implicitement chaque requête pour qu'aucune agence ne puisse voir les données d'une autre agence.
          Les Super Administrateurs bénéficient d'un sélecteur global sur le Hub pour basculer facilement de contexte.
        </p>
      </div>
    </div>
  );
}

// --- CHAPTER COMPONENTS ---

function WelcomeContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="space-y-6 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20 backdrop-blur-md whitespace-nowrap">
                <Zap className="w-4 h-4 shrink-0" /> Excellence Opérationnelle
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 backdrop-blur-md whitespace-nowrap">
                <Database className="w-4 h-4 shrink-0" /> Multi-Tenant Ready
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight text-foreground leading-tight">
              Système de <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 italic">Commandement</span> <br />
              <span className="text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tighter opacity-80 mt-3 block">VELORA PRO v3.0</span>
            </h1>
            <p className="text-base text-muted-foreground font-medium leading-relaxed max-w-2xl border-l-4 border-primary pl-6 py-2 bg-gradient-to-r from-primary/5 to-transparent">
              Le standard numérique <strong>« Elite Standing »</strong> conçu pour transformer la maintenance et la gestion d'actifs en un centre productif de profit, sans la moindre compromission de qualité et de réactivité.
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center lg:justify-end">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/30 rounded-[3rem] blur-3xl scale-110 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
              <div className="relative p-6 lg:p-10 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border border-primary/20 rounded-[3rem] shadow-2xl hover:shadow-primary/20 hover:border-primary/40 transition-all duration-500 hover:scale-105">
                <img
                  src={VeloraLogo}
                  alt="VELORA PRO"
                  className="w-32 sm:w-40 lg:w-56 h-auto object-contain drop-shadow-2xl"
                />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-primary to-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-primary/20 whitespace-nowrap">
                  Enterprise 2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-8 bg-card/50 backdrop-blur-md border border-border/50 rounded-[2.5rem] space-y-4 hover:shadow-2xl hover:border-primary/30 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-colors" />
          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Shield className="w-6 h-6" /></div> Vision Tactique
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
            VELORA PRO n'est pas qu'une simple suite logicielle de gestion ; c'est un véritable <strong>Système de Commandement Opérationnel</strong> conçu pour les grandes entreprises d'ingénierie et les sociétés de services gérant des équipements critiques. L'application utilise une esthétique <i>« Elite Dark / Glassmorphism »</i> de prestige et un moteur temps réel hautement optimisé.
          </p>
        </div>

        <div className="p-8 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[2.5rem] space-y-5 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
          <div className="flex -space-x-3 mb-2 relative z-10">
            {[
              { icon: Shield, color: 'text-primary' },
              { icon: Users, color: 'text-blue-500' },
              { icon: Wrench, color: 'text-orange-500' },
              { icon: ClipboardList, color: 'text-purple-500' }
            ].map((user, i) => (
              <div key={i} className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-md border-2 border-primary/20 flex items-center justify-center shadow-lg hover:-translate-y-2 transition-transform duration-300">
                <user.icon className={cn("w-5 h-5", user.color)} />
              </div>
            ))}
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-1">Collaboratif & Temps Réel</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Admins · Techniciens · Squads</p>
          </div>
        </div>

        <div className="md:col-span-3 p-8 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden group">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
           <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30 group-hover:scale-110 transition-transform relative z-10">
             <PackageCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
           </div>
           <div className="relative z-10">
             <h4 className="text-lg font-black uppercase tracking-tight text-foreground flex items-center gap-3">
               Mise à Jour v3.0 Déployée <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/30">Nouveautés</span>
             </h4>
             <p className="text-xs text-muted-foreground font-medium mt-2 leading-relaxed max-w-4xl">
               Découvrez le nouveau <strong>Module Multi-Tenant</strong> permettant d'isoler parfaitement les agences et locataires, le système <strong>Role-Based Access Control (RBAC)</strong> dynamique avec délégation fine d'accès par espace, et l'architecture "Zero-Downtime". L'interface a été enrichie de composants dynamiques offrant une esthétique d'exception.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}

function PilotageContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-5">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
          <LayoutDashboard className="w-10 h-10 sm:w-12 sm:h-12 text-primary shrink-0" />
          1. Pilotage & Analytics
        </h2>
        <p className="text-lg text-muted-foreground font-medium italic border-l-4 border-primary/30 pl-5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          La Control Room de l'entreprise : Mesurez en direct l'activité opérationnelle et le respect des SLAs.
        </p>
      </header>

      <div className="space-y-12">
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <span className="border-b-4 border-primary pb-1">Station de Contrôle</span> (Control Room)
            </h4>
            <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20 inline-flex items-center gap-2 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Flux WebSocket Actif
            </div>
          </div>
          
          <div className="p-8 sm:p-10 bg-card/40 backdrop-blur-xl border border-border/50 rounded-[3rem] shadow-xl space-y-8 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-3">
                   <h5 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                     <Activity className="w-4 h-4" /> KPIs & Performance
                   </h5>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     Visualisez instantanément le statut des interventions et les volumes de tickets urgents. La plateforme intègre des graphiques dynamiques propulsés par <strong>Recharts</strong>, configurés avec des dimensions adaptatives pour s'ajuster impeccablement à tout type d'écran.
                   </p>
                </div>
                <div className="space-y-3">
                   <h5 className="font-black text-sm uppercase tracking-widest text-orange-500 flex items-center gap-2">
                     <MapPin className="w-4 h-4" /> Live Map & Cartographie
                   </h5>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     Une carte interactive en direct place vos sites à l'aide de coordonnées GPS décimales. Les icônes clignotent en temps réel en cas d'intervention urgente déclenchée, offrant une vue hélicoptère immédiate des points chauds technologiques.
                   </p>
                </div>
             </div>
             
             <div className="p-6 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl border-l-4 border-primary text-xs font-semibold flex items-start gap-4 relative z-10">
               <Zap className="w-6 h-6 text-primary shrink-0 mt-0.5" />
               <div>
                 <span className="font-black uppercase tracking-widest text-primary block mb-2">Live Alerting Overlay System</span>
                 <p className="text-muted-foreground leading-relaxed">
                   Le serveur WebSocket pousse instantanément des overlays visuels clignotants à mesure que l'échéance d'intervention contractuelle (<code>slaDeadline</code>) s'approche de l'expiration pour éviter toute pénalité financière.
                 </p>
               </div>
             </div>
          </div>
        </section>

        <section className="space-y-6">
           <h4 className="text-xl font-black uppercase tracking-tight">
              Module Analytics & Reporting
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { label: "Volume d'Activité", desc: "Suivi mensuel et annuel de l'activité technique terrain.", icon: Activity },
                { label: "Charge des Squads", desc: "Répartition automatisée par équipe opérationnelle et pods.", icon: Users },
                { label: "Suivi Contractuel", desc: "Ratio et rentabilité des contrats d'assistance vs interventions facturables.", icon: Receipt },
              ].map((m, i) => (
                <div key={i} className="p-6 bg-card/50 backdrop-blur-sm rounded-3xl border border-border/50 hover:border-primary/30 flex flex-col items-center text-center space-y-4 hover:-translate-y-1 transition-all duration-300">
                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                     <m.icon className="w-6 h-6 text-primary animate-pulse" />
                   </div>
                   <div className="space-y-1.5">
                     <h6 className="font-black uppercase text-[11px] tracking-widest leading-none text-foreground">{m.label}</h6>
                     <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">{m.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
}

function InterventionsContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-5">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
          <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-primary shrink-0" />
          2. Opérations Terrain
        </h2>
        <p className="text-lg text-muted-foreground font-medium border-l-4 border-primary/30 pl-5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          Le cœur opérationnel : cycles d'interventions rigides, signature biométrique sur mobile et rapports PDF pros.
        </p>
      </header>

      <div className="space-y-12">
        <section className="space-y-6">
           <h4 className="text-xl font-black uppercase tracking-tight text-foreground">Le Cycle de Vie Intransigeant des Tickets</h4>
           <div className="p-8 bg-card/40 backdrop-blur-xl border border-border/50 rounded-[3rem] space-y-8 shadow-lg">
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Le moteur de tickets d'intervention est doté d'une machine d'états stricte garantissant une conformité absolue. Aucun contournement n'est techniquement toléré :
              </p>
              <div className="flex flex-col gap-6 relative before:absolute before:inset-y-0 before:left-[1.15rem] before:w-px before:bg-border">
                 {[
                   { t: "Demande & Diagnostic", d: "Saisie de la demande d'incident, géolocalisation du site et assignation à l'escouade technique (Squad)." },
                   { t: "Diagnostic Terrain & Photos", d: "Le technicien intervient, insère ses notes techniques et prend des clichés avant/après enregistrés de manière persistante." },
                   { t: "Signature Numérique Immuable", d: "Le client signe directement sur l'écran tactile du smartphone ou de la tablette à l'aide du Signature Pad. Signature gravée en base." },
                   { t: "Génération PDF & Clôture", d: "L'application génère à la volée le rapport officiel d'intervention, intègre signatures, photos et le transmet par e-mail en clôturant le flux." },
                 ].map((s, i) => (
                   <div key={i} className="flex gap-6 items-start relative z-10 group">
                      <div className="w-10 h-10 rounded-2xl bg-background border-2 border-primary text-primary flex items-center justify-center font-black text-sm shrink-0 shadow-[0_0_15px_rgba(var(--primary),0.2)] group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        {i+1}
                      </div>
                      <div className="space-y-1.5 pt-1">
                         <h5 className="font-black uppercase text-xs tracking-widest text-foreground group-hover:text-primary transition-colors">{s.t}</h5>
                         <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{s.d}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[3rem] shadow-2xl space-y-5 border-b-8 border-primary relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <h4 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3 relative z-10">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md"><Fingerprint className="w-5 h-5 text-primary" /></div>
                Signature Digitale
              </h4>
              <p className="text-xs font-medium leading-relaxed text-slate-300 relative z-10">
                Grâce au Signature Pad sécurisé intégré, le client authentifie le passage du technicien directement depuis le terminal mobile. La preuve de résolution est sécurisée logiciellement dans la base relationnelle pour éliminer toute contestation contractuelle.
              </p>
           </div>
           
           <div className="p-8 bg-card/60 backdrop-blur-md border border-primary/20 rounded-[3rem] space-y-5 shadow-lg relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-foreground relative z-10">
                <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><FileText className="w-5 h-5" /></div>
                Générateur PDF Legal
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium relative z-10">
                Le moteur <strong>Export Engine</strong> natif compile côté client des rapports structurés ultra-rapides :
              </p>
              <ul className="text-[10px] font-bold text-foreground space-y-3 uppercase tracking-tight relative z-10">
                <li className="flex items-center gap-3"><CheckBadge /> Dates, IP et géolocalisation précise</li>
                <li className="flex items-center gap-3"><CheckBadge /> Relevés techniques complets</li>
                <li className="flex items-center gap-3"><CheckBadge /> Photos Diagnostic (Avant/Après)</li>
                <li className="flex items-center gap-3"><CheckBadge /> Tracés vectoriels des Signatures</li>
              </ul>
           </div>
        </section>
      </div>
    </div>
  );
}

function CheckBadge() {
  return (
    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
    </div>
  );
}

function ChantiersContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-5">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
          <ClipboardList className="w-10 h-10 sm:w-12 sm:h-12 text-primary shrink-0" />
          3. Pilotage Chantiers
        </h2>
        <p className="text-lg text-muted-foreground font-medium italic border-l-4 border-primary/30 pl-5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          Gérez vos projets d'infrastructure complexes, divisez en phases budgétaires et assignez en escouades.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-6">
            <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><GanttChartSquare className="w-5 h-5 text-primary" /></div>
              Kanban Agile
            </h4>
            <div className="p-8 bg-card/50 backdrop-blur-md border border-border/50 rounded-[2.5rem] shadow-lg space-y-6 hover:shadow-primary/5 transition-all">
               <p className="text-xs text-muted-foreground leading-relaxed">
                  Sur la route <code>/task-tracking</code>, la modélisation Kanban offre une réactivité sans faille à l'aide de bibliothèques d'agilité <strong>@dnd-kit</strong>. Organisez vos tâches instantanément :
               </p>
               <div className="grid grid-cols-2 gap-3">
                  {['Backlog', 'À Faire', 'En Cours', 'Terminé'].map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                       <span className={cn("w-2 h-2 rounded-full", i === 3 ? "bg-emerald-500" : i === 2 ? "bg-blue-500" : i === 1 ? "bg-orange-500" : "bg-muted-foreground")} /> 
                       {c}
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <h4 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><CalendarDays className="w-5 h-5 text-primary" /></div>
              Phases & Délégation
            </h4>
            <div className="p-8 bg-muted/20 backdrop-blur-sm border-2 border-dashed border-border/60 rounded-[2.5rem] space-y-6">
               <p className="text-xs text-muted-foreground leading-relaxed">
                  Pour les déploiements de grande envergure, le découpage temporel structuré par **Phases** permet d'afficher l'avancement modulaire exact et d'anticiper le taux de réussite.
               </p>
               <div className="p-5 bg-background border border-border/50 rounded-2xl flex items-start gap-4 shadow-sm hover:border-primary/30 transition-colors">
                 <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-0.5"><Users className="w-5 h-5 text-primary" /></div>
                 <div>
                   <span className="text-[11px] font-black uppercase tracking-wider block mb-1 text-foreground">Pods & Squads</span>
                   <span className="text-[10px] font-medium text-muted-foreground leading-relaxed block">Assignez des chantiers complets à des groupes de techniciens (Escouades) pour une délégation de masse.</span>
                 </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function ParcContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-5">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
          <Monitor className="w-10 h-10 sm:w-12 sm:h-12 text-primary shrink-0" />
          4. Parc Technique
        </h2>
        <p className="text-lg text-muted-foreground font-medium italic border-l-4 border-primary/30 pl-5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          Fichage complet des actifs matériels de l'entreprise et connectivité instantanée via puces QR.
        </p>
      </header>

      <div className="space-y-8">
         <div className="flex flex-col md:flex-row gap-8 items-center bg-card/60 backdrop-blur-xl border border-primary/20 rounded-[3rem] p-8 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-[2.5rem] flex items-center justify-center shrink-0 border border-primary/30 shadow-inner relative z-10">
               <Activity className="w-10 h-10 sm:w-14 sm:h-14 text-primary" />
            </div>
            <div className="space-y-3 relative z-10 text-center md:text-left">
               <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Digital Twins</h4>
               <p className="text-xs text-muted-foreground leading-relaxed font-medium max-w-2xl">
                 Chaque actif matériel (caméra IP, serveur, onduleur) possède sa fiche de métadonnées dynamique. Vous accédez au numéro de série OEM, dates d'expiration des garanties contractuelles et historique chronologique absolu de toutes interventions techniques menées dessus.
               </p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-card/40 backdrop-blur-md rounded-[2.5rem] space-y-4 border border-border/50 hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-all group">
               <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6">
                 <MapPin className="w-7 h-7 text-orange-500 group-hover:scale-110 transition-transform" />
               </div>
               <h5 className="font-black text-sm uppercase tracking-[0.2em] text-foreground group-hover:text-orange-500 transition-colors">Géolocalisation</h5>
               <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                 VELORA PRO utilise des coordonnées décimales de haute précision pour situer vos locaux sur la Live Map. Les équipes d'intervention peuvent lancer le GPS directement depuis l'application mobile en un clic.
               </p>
            </div>
            
            <div className="p-8 bg-card/40 backdrop-blur-md rounded-[2.5rem] space-y-4 border border-border/50 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] transition-all group">
               <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                 <Camera className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
               </div>
               <h5 className="font-black text-sm uppercase tracking-[0.2em] text-foreground group-hover:text-primary transition-colors">QR Code Scanner</h5>
               <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                 Générez des étiquettes à QR Codes uniques pour chaque équipement. Le scan via le module mobile ouvre instantanément la fiche technique dans la main de l'intervenant et permet de pré-remplir un ticket sans erreur.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}

function FinanceContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-5">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
          <Receipt className="w-10 h-10 sm:w-12 sm:h-12 text-primary shrink-0" />
          5. Finance & Achats
        </h2>
        <p className="text-lg text-muted-foreground font-medium italic border-l-4 border-primary/30 pl-5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          Facturation, processus sécurisé de Procurement et synchronisation automatisée vers les Actifs d'Entreprise.
        </p>
      </header>

      <div className="space-y-10">
        {/* PROCUREMENT & TRANSFORMATION ACTIFS - NEW FEATURE HIGHLIGHT */}
        <section className="p-8 sm:p-10 bg-gradient-to-br from-card to-card/50 backdrop-blur-2xl border-2 border-emerald-500/30 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
           
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-3 text-foreground">
                <div className="p-3 bg-emerald-500/10 rounded-2xl"><ShoppingCart className="w-6 h-6 text-emerald-500" /></div>
                Procurement & Actifs
              </h4>
              <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Nouveauté 2026
              </span>
           </div>

           <div className="space-y-6 relative z-10">
             <p className="text-sm text-muted-foreground leading-relaxed font-medium">
               Le module des <strong>Demandes d'Achat</strong> gère un pipeline d'approbation strict (Soumise → Validée → Achat). Mais sa plus grande force réside dans son <strong>Moteur de Synchronisation d'Actifs</strong>.
             </p>

             <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl space-y-6">
                <h5 className="font-black text-xs uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" /> La Conversion "Achat → Inventaire"
                </h5>
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                  Lorsqu'un acheteur marque une commande comme "Livrée" (Terminée), il peut activer l'option <strong>"Transformer en Actif"</strong>. L'application va alors instantanément et silencieusement injecter l'achat dans vos bases de données opérationnelles :
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="p-5 bg-background border border-border/50 rounded-2xl space-y-3 shadow-sm hover:border-emerald-500/40 transition-colors">
                      <Monitor className="w-6 h-6 text-emerald-500" />
                      <span className="block font-black text-[10px] uppercase tracking-widest">Immobilisations</span>
                      <p className="text-[9px] text-muted-foreground font-medium">Matériel IT, Mobilier. Calcule la valeur d'acquisition et prépare l'amortissement comptable.</p>
                   </div>
                   <div className="p-5 bg-background border border-border/50 rounded-2xl space-y-3 shadow-sm hover:border-emerald-500/40 transition-colors">
                      <MapPin className="w-6 h-6 text-emerald-500" />
                      <span className="block font-black text-[10px] uppercase tracking-widest">Parc Automobile</span>
                      <p className="text-[9px] text-muted-foreground font-medium">Véhicules d'entreprise. Demande l'immatriculation et l'ajoute au pool de missions.</p>
                   </div>
                   <div className="p-5 bg-background border border-border/50 rounded-2xl space-y-3 shadow-sm hover:border-emerald-500/40 transition-colors">
                      <PackageCheck className="w-6 h-6 text-emerald-500" />
                      <span className="block font-black text-[10px] uppercase tracking-widest">Moyens Généraux</span>
                      <p className="text-[9px] text-muted-foreground font-medium">Fournitures de bureau. Incrémente le stock et calcule le coût unitaire moyen.</p>
                   </div>
                </div>
             </div>
           </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-8 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-[3rem] shadow-xl space-y-5 relative overflow-hidden group">
             <Receipt className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700" />
             <h4 className="text-2xl font-black uppercase tracking-tight relative z-10">Facturation & Contrats</h4>
             <p className="text-xs font-medium leading-relaxed opacity-90 relative z-10">
               Sur l'onglet Factures (<code>/invoices</code>), le module comptable gère les statuts. Les heures passées en intervention sur le terrain diminuent dynamiquement la banque de crédits horaires SLAs des contrats de maintenance rédigés avec vos clients réguliers.
             </p>
             <div className="flex flex-wrap gap-2 pt-2 relative z-10">
                {['Gestion SLAs', 'Historique Paiements', 'Calcul TVA'].map(tag => (
                  <div key={tag} className="px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest">{tag}</div>
                ))}
             </div>
          </div>

          <div className="p-8 bg-card/50 backdrop-blur-md border border-border/50 rounded-[3rem] space-y-5 flex flex-col justify-center">
             <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="text-sm font-black uppercase tracking-widest">Sécurité Budgétaire</h4>
             </div>
             <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
               Suite au durcissement de sécurité du module d'achat, les actions d'<strong>Ajout (Nouvelle Demande)</strong>, de **Modification (Édition des champs)** et de **Suppression** sont réservées **strictement au rôle de `SUPER_ADMIN`** dans l'application, interdisant toute initiative budgétaire non approuvée au niveau opérationnel.
             </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-5">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
          <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-primary shrink-0" />
          6. Admin & Sécurité
        </h2>
        <p className="text-lg text-muted-foreground font-medium border-l-4 border-primary/30 pl-5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          Contrôles RBAC exclusifs, répartition des pods opérationnels et journalisation d'audit forensique.
        </p>
      </header>

      <div className="space-y-12">
         <section className="space-y-6">
            <h4 className="text-xl font-black uppercase tracking-tight text-foreground">Matrice RBAC (Role Based Access Control)</h4>
            <div className="overflow-x-auto rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-md shadow-lg">
               <table className="w-full text-left text-[10px] font-black uppercase tracking-widest">
                  <thead className="bg-muted/80 text-muted-foreground border-b border-border/50">
                     <tr>
                        <th className="p-5">Fonctionnalité</th>
                        <th className="p-5 text-center">Super Admin</th>
                        <th className="p-5 text-center">Admin</th>
                        <th className="p-5 text-center">Directeur</th>
                        <th className="p-5 text-center">Tech</th>
                        <th className="p-5 text-center">Client</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-muted-foreground">
                     {[
                       { f: "Configuration de la Marque", sa: "FULL", a: "NONE", d: "NONE", t: "NONE", c: "NONE" },
                       { f: "Administration Utilisateurs", sa: "FULL", a: "FULL", d: "VIEW", t: "NONE", c: "NONE" },
                       { f: "Création des Réunions", sa: "FULL", a: "NONE", d: "NONE", t: "NONE", c: "NONE" },
                       { f: "Création Demandes d'Achat", sa: "FULL", a: "NONE", d: "NONE", t: "NONE", c: "NONE" },
                       { f: "Validation d'Achats", sa: "FULL", a: "NONE", d: "YES", t: "NONE", c: "NONE" },
                       { f: "Signature Terrain", sa: "FULL", a: "FULL", d: "NONE", t: "FULL", c: "YES" },
                       { f: "Visualisation Journal d'Audit", sa: "FULL", a: "VIEW", d: "NONE", t: "NONE", c: "NONE" },
                     ].map((r, i) => (
                       <tr key={i} className="hover:bg-primary/5 transition-colors">
                          <td className="p-5 font-bold text-foreground">{r.f}</td>
                          <td className="p-5 text-center text-primary font-black">{r.sa}</td>
                          <td className="p-5 text-center text-primary">{r.a}</td>
                          <td className="p-5 text-center text-blue-500">{r.d}</td>
                          <td className="p-5 text-center text-orange-500">{r.t}</td>
                          <td className="p-5 text-center">{r.c}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </section>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 sm:p-10 bg-card/40 backdrop-blur-xl border border-border/50 rounded-[3rem] space-y-5 hover:border-primary/30 transition-colors shadow-lg">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div>
               <h4 className="text-xl font-black uppercase tracking-tight text-foreground">Pods & Squads</h4>
               <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Organisez vos collaborateurs de terrain en <strong>escouades spécialisées</strong> (ex: Squad Réseau, Squad CVC). L'assignation d'un ticket à une Squad permet à n'importe quel technicien disponible du groupe d'accepter et de résoudre la mission sur son mobile en direct.
               </p>
            </div>
            
            <div className="p-8 sm:p-10 bg-slate-900 text-white rounded-[3rem] space-y-5 shadow-2xl border-b-8 border-primary relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md relative z-10"><Fingerprint className="w-6 h-6 text-primary" /></div>
               <h4 className="text-xl font-black uppercase tracking-tight relative z-10">Forensique Numérique</h4>
               <p className="text-[11px] font-medium leading-relaxed text-slate-300 relative z-10">
                  Pour des raisons de conformité légale, toutes les opérations critiques (modifications d'achats, suppression d'équipements) sont journalisées secrètement. L'administrateur peut visualiser sur <code>/audit-logs</code> l'historique complet (IP, heure, agent) et la restitution des modifications (Diff JSON exact affichant <code>oldValues</code> et <code>newValues</code>).
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}

function DatasheetContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-5">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
          <FileCode className="w-10 h-10 sm:w-12 sm:h-12 text-primary shrink-0" />
          Fiche Technique
        </h2>
        <p className="text-lg text-muted-foreground font-medium border-l-4 border-primary/30 pl-5 py-2 bg-gradient-to-r from-primary/5 to-transparent">
          Spécifications d'architecture monorepo, technologies sous-jacentes, et topologie réseau.
        </p>
      </header>

      <div className="space-y-10">
        <section className="space-y-6">
           <h4 className="text-xl font-black uppercase tracking-tight text-foreground">Topologie de l'Architecture</h4>
           <div className="p-8 bg-black/90 text-green-400 rounded-3xl font-mono text-[11px] space-y-2 overflow-x-auto shadow-2xl border border-border/50">
             <div className="font-bold text-white mb-4">SuiviTech/ <span className="text-muted-foreground">(Pseudo-Monorepo agile)</span></div>
             <div>├── apps/</div>
             <div>│   ├── backend/ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;← NestJS API modulaire &amp; Sockets (Port 3001)</div>
             <div>│   ├── frontend/ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ← React 19 Client Web SPA &amp; Vite (Port 5175)</div>
             <div>│   └── apps/frontend/src/ &nbsp; &nbsp;← Architecture d'extensions mobiles Drawers</div>
             <div>├── packages/</div>
             <div>│   ├── types/ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;← Interfaces TypeScript partagées (DRY)</div>
             <div>│   └── utils/ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;← Formats temps et utilitaires</div>
             <div className="mt-4 text-muted-foreground"># Démarrage Serveurs: npm run start:dev (Backend) | npm run dev (Frontend)</div>
           </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="p-8 bg-card/60 backdrop-blur-md border border-border/50 rounded-3xl space-y-6 shadow-lg">
              <h5 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Server className="w-4 h-4" /></div> Backend API
              </h5>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-[11px] font-medium text-muted-foreground divide-y divide-border/50">
                    <tbody className="divide-y divide-border/50">
                       <tr><td className="py-3 text-foreground font-bold">NestJS Framework</td><td className="py-3 text-right">^11.0.1</td></tr>
                       <tr><td className="py-3 text-foreground font-bold">Prisma ORM</td><td className="py-3 text-right">MySQL DB</td></tr>
                       <tr><td className="py-3 text-foreground font-bold">TypeScript</td><td className="py-3 text-right">Strict Mode</td></tr>
                       <tr><td className="py-3 text-foreground font-bold">Passport.js JWT</td><td className="py-3 text-right">Auth Sec</td></tr>
                    </tbody>
                 </table>
              </div>
           </div>

           <div className="p-8 bg-card/60 backdrop-blur-md border border-border/50 rounded-3xl space-y-6 shadow-lg">
              <h5 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Monitor className="w-4 h-4" /></div> Frontend Client
              </h5>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-[11px] font-medium text-muted-foreground divide-y divide-border/50">
                    <tbody className="divide-y divide-border/50">
                       <tr><td className="py-3 text-foreground font-bold">React SPA</td><td className="py-3 text-right">^19.2.4</td></tr>
                       <tr><td className="py-3 text-foreground font-bold">Vite Bundler</td><td className="py-3 text-right">ESBuild Fast</td></tr>
                       <tr><td className="py-3 text-foreground font-bold">Zustand</td><td className="py-3 text-right">State Manager</td></tr>
                       <tr><td className="py-3 text-foreground font-bold">React Query</td><td className="py-3 text-right">Server Cache</td></tr>
                    </tbody>
                 </table>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}

function LegalContent() {
  return (
    <div className="space-y-16">
      <header className="space-y-6 text-center max-w-2xl mx-auto pt-10">
        <h2 className="text-5xl sm:text-6xl font-black tracking-tighter uppercase italic text-foreground">
          Légal & <span className="text-primary">Licence</span>
        </h2>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          VELORA PRO est une propriété intellectuelle stricte, protégée par les lois internationales sur le droit d'auteur.
        </p>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
         <div className="p-10 bg-card/50 backdrop-blur-xl border border-border/50 rounded-[3rem] shadow-2xl text-center space-y-8 relative overflow-hidden">
            <Scale className="w-24 h-24 text-primary/10 mx-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            <div className="space-y-2 relative z-10">
               <h3 className="text-2xl font-black uppercase tracking-tight">Waycon Mediterrannée</h3>
               <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Division Software Engineering</p>
            </div>
            
            <div className="w-16 h-1 bg-primary/30 mx-auto rounded-full relative z-10" />
            
            <div className="space-y-4 text-xs text-muted-foreground font-medium leading-relaxed relative z-10">
               <p>
                 Ce logiciel, incluant son code source, son design d'interface "Elite Dark", son architecture de base de données et l'intégralité de ses modules (Pilote, Interventions, Parc, Achats) est la propriété exclusive de <strong>Waycon Mediterrannée</strong>.
               </p>
               <p>
                 Toute reproduction, décompilation, ingénierie inverse, ou distribution non autorisée est formellement interdite et s'expose à des poursuites judiciaires. L'utilisation est soumise au paiement régulier de la redevance d'exploitation SaaS ou à l'achat d'une licence perpétuelle certifiée.
               </p>
            </div>

            <div className="pt-6 relative z-10">
               <span className="inline-block px-6 py-2 bg-muted/50 rounded-full text-[10px] font-black uppercase tracking-widest border border-border/50">
                 Copyright © 2026 - All Rights Reserved
               </span>
            </div>
         </div>
      </div>
    </div>
  );
}
