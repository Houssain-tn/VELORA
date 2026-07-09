import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSocketStore } from '@/stores/useSocketStore';
import {
  Wrench, ClipboardList, GanttChartSquare, CalendarDays,
  MapPin, Monitor, ShieldCheck, Receipt, FileText, ShoppingCart,
  Users, Shield, Activity, BarChart3, Building2, Car,
  Package, Settings, Archive,
  Video, CalendarClock, ArrowRight, Zap, Search,
  Star, Plus, QrCode, Bell, Workflow, Building, Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import VELORALogo from '@/assets/Logos/Velora_logo.svg';
import { useAnalytics, useInterventions, useEquipment, useTasks } from '@/hooks/useApi';
import { AddInterventionModal } from '@/components/modals/AddInterventionModal';
import { TaskModal } from '@/components/modals/TaskModal';

interface ERPModule {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
  gradient: string;
  category: string;
  badge?: string;
  isNew?: boolean;
  isPro?: boolean;
  stat?: string;
  statLabel?: string;
}

const ERP_MODULES: ERPModule[] = [
  // OPERATIONS
  {
    id: 'live-tracking',
    title: 'Command Center (Live)',
    description: 'Hyper-supervision en temps réel des techniciens, des véhicules et des sites sur une carte interactive globale.',
    icon: Navigation,
    href: '/live-tracking',
    color: 'text-rose-500',
    gradient: 'from-rose-500/20 to-red-500/10',
    category: 'Opérations',
    isNew: true,
    isPro: true,
  },
  {
    id: 'interventions',
    title: 'Interventions Techniques',
    description: 'Gestion complète des tickets, incidents et demandes de maintenance corrective et préventive.',
    icon: Wrench,
    href: '/interventions',
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 to-orange-500/10',
    category: 'Opérations',
  },
  {
    id: 'ppm',
    title: 'PPM / Maintenance Préventive',
    description: 'Planification des opérations de maintenance préventive, calendriers et fréquences automatiques.',
    icon: CalendarClock,
    href: '/ppm',
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-indigo-500/10',
    category: 'Opérations',
  },
  {
    id: 'tasks',
    title: 'Suivi des Tâches',
    description: 'Gestion des tâches opérationnelles, affectation aux techniciens et suivi de progression Kanban.',
    icon: ClipboardList,
    href: '/task-tracking',
    color: 'text-violet-500',
    gradient: 'from-violet-500/20 to-purple-500/10',
    category: 'Opérations',
  },
  {
    id: 'planning',
    title: 'Planning Chronologique',
    description: 'Vue Gantt et planning temporel des interventions, projets et équipes avec gestion des conflits.',
    icon: GanttChartSquare,
    href: '/chronological-planning',
    color: 'text-cyan-500',
    gradient: 'from-cyan-500/20 to-teal-500/10',
    category: 'Opérations',
  },
  // PROJETS
  {
    id: 'projects',
    title: 'Gestion de Projets',
    description: 'Suivi des projets multi-phases, jalons, budgets et équipes avec tableau de bord avancé.',
    icon: GanttChartSquare,
    href: '/projects',
    color: 'text-indigo-500',
    gradient: 'from-indigo-500/20 to-blue-500/10',
    category: 'Projets',
  },
  {
    id: 'calendar',
    title: 'Calendrier Global',
    description: 'Vue calendrier unifiée de toutes les interventions, réunions, maintenances et échéances.',
    icon: CalendarDays,
    href: '/calendar',
    color: 'text-rose-500',
    gradient: 'from-rose-500/20 to-pink-500/10',
    category: 'Projets',
  },
  {
    id: 'meetings',
    title: 'Réunions & PV',
    description: "Planification et documentation des réunions d'équipe, PV, décisions et actions de suivi.",
    icon: Video,
    href: '/meetings',
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-green-500/10',
    category: 'Projets',
  },
  // ACTIFS
  {
    id: 'sites',
    title: 'Sites & Localisations',
    description: 'Référentiel des sites, bâtiments et zones géographiques avec cartographie et gestion des accès.',
    icon: MapPin,
    href: '/sites',
    color: 'text-orange-500',
    gradient: 'from-orange-500/20 to-amber-500/10',
    category: 'Actifs',
  },
  {
    id: 'equipment',
    title: 'Inventaire Équipements',
    description: 'Registre complet du parc technique avec QR codes, historique de maintenance et alertes.',
    icon: Monitor,
    href: '/equipment',
    color: 'text-sky-500',
    gradient: 'from-sky-500/20 to-blue-500/10',
    category: 'Actifs',
  },
  {
    id: 'immobilisations',
    title: 'Gestion des Immobilisations',
    description: 'Registre des actifs immobilisés, calcul automatique des amortissements, cessions et mises au rebut.',
    icon: Building2,
    href: '/immobilisations',
    color: 'text-purple-500',
    gradient: 'from-purple-500/20 to-violet-500/10',
    category: 'Actifs',
    isNew: true,
    isPro: true,
  },
  {
    id: 'parc-auto',
    title: 'Parc Automobile',
    description: 'Gestion complète de la flotte véhicules: suivi carburant, maintenance, assurances et missions.',
    icon: Car,
    href: '/parc-automobile',
    color: 'text-teal-500',
    gradient: 'from-teal-500/20 to-emerald-500/10',
    category: 'Actifs',
    isNew: true,
    isPro: true,
  },
  // MOYENS GENERAUX
  {
    id: 'moyens-generaux',
    title: 'Moyens Généraux',
    description: "Gestion des services généraux: prestataires, fournitures, locaux, espaces et demandes internes.",
    icon: Package,
    href: '/moyens-generaux',
    color: 'text-lime-500',
    gradient: 'from-lime-500/20 to-green-500/10',
    category: 'Moyens Généraux',
    isNew: true,
    isPro: true,
  },
  // FINANCE
  {
    id: 'contracts',
    title: 'Contrats & SLA',
    description: 'Gestion des contrats clients, accords de niveau de service et suivi des engagements contractuels.',
    icon: ShieldCheck,
    href: '/contracts',
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-indigo-500/10',
    category: 'Finance',
  },
  {
    id: 'invoices',
    title: 'Facturation',
    description: 'Création et suivi des factures, devis, avoirs et paiements avec génération PDF automatique.',
    icon: Receipt,
    href: '/invoices',
    color: 'text-green-500',
    gradient: 'from-green-500/20 to-emerald-500/10',
    category: 'Finance',
  },
  {
    id: 'purchases',
    title: "Demandes d'Achat",
    description: 'Circuit de validation des demandes d\'achat avec workflow commercial, directeur et acheteur. Conversion automatique en actifs.',
    icon: ShoppingCart,
    href: '/purchases',
    color: 'text-amber-500',
    gradient: 'from-amber-500/20 to-yellow-500/10',
    category: 'Actifs',
    isNew: true,
    isPro: true,
  },
  // INTELLIGENCE
  {
    id: 'analytics',
    title: 'Performances & Analytics',
    description: 'Tableaux de bord avancés, KPIs opérationnels, rapports personnalisés et intelligence métier.',
    icon: BarChart3,
    href: '/analytics',
    color: 'text-indigo-500',
    gradient: 'from-indigo-500/20 to-blue-500/10',
    category: 'Intelligence',
  },
  {
    id: 'dashboard',
    title: 'Mission Control',
    description: 'Tableau de bord opérationnel en temps réel avec flux d\'interventions et alertes SLA actives.',
    icon: Activity,
    href: '/dashboard',
    color: 'text-rose-500',
    gradient: 'from-rose-500/20 to-red-500/10',
    category: 'Intelligence',
  },
  // ADMINISTRATION
  {
    id: 'documents',
    title: 'Documents & GED',
    description: 'Gestion électronique de documents: contrats, rapports, plans techniques et archives.',
    icon: FileText,
    href: '/documents',
    color: 'text-slate-500',
    gradient: 'from-slate-500/20 to-gray-500/10',
    category: 'Administration',
  },
  {
    id: 'users',
    title: 'Utilisateurs & Rôles',
    description: 'Gestion des comptes, profils, rôles et permissions avec authentification sécurisée.',
    icon: Users,
    href: '/users',
    color: 'text-indigo-500',
    gradient: 'from-indigo-500/20 to-violet-500/10',
    category: 'Administration',
  },
  {
    id: 'archive',
    title: 'Archives',
    description: 'Archivage intelligent des interventions, projets et documents avec moteur de recherche avancé.',
    icon: Archive,
    href: '/archive',
    color: 'text-stone-500',
    gradient: 'from-stone-500/20 to-gray-500/10',
    category: 'Administration',
  },
  {
    id: 'audit',
    title: "Journal d'Audit",
    description: 'Traçabilité complète de toutes les actions utilisateurs avec horodatage et piste d\'audit.',
    icon: Shield,
    href: '/audit-logs',
    color: 'text-red-500',
    gradient: 'from-red-500/20 to-rose-500/10',
    category: 'Administration',
  },
  {
    id: 'settings',
    title: 'Paramètres Système',
    description: 'Configuration de la plateforme, personnalisation, intégrations et préférences utilisateur.',
    icon: Settings,
    href: '/settings',
    color: 'text-gray-500',
    gradient: 'from-gray-500/20 to-slate-500/10',
    category: 'Administration',
  },
  {
    id: 'workflows',
    title: 'Moteur de Workflows',
    description: 'Configuration BPMN des processus métiers, automatisation et règles de transition des statuts.',
    icon: Workflow,
    href: '/workflows',
    color: 'text-fuchsia-500',
    gradient: 'from-fuchsia-500/20 to-purple-500/10',
    category: 'Administration',
    isNew: true,
    isPro: true,
  },
];

const CATEGORIES = ['Tous', 'Opérations', 'Projets', 'Actifs', 'Moyens Généraux', 'Finance', 'Intelligence', 'Administration'];

export function ModuleHub() {
  const navigate = useNavigate();
  const { user, activeTenantId, setActiveTenant } = useAuthStore();
  const socketConnected = useSocketStore((state) => state.isConnected);
  const unreadCount = useSocketStore((state) => state.unreadCount);

  // API Live Data for KPIs
  const { data: analytics } = useAnalytics();
  const { data: interventions } = useInterventions({ excludeArchived: 'true' });
  const { data: equipment } = useEquipment();
  const { data: tasks } = useTasks({ excludeArchived: 'true' });

  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Favorites & Recents state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  
  // Modals state
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Load favorites & recents on mount
  useEffect(() => {
    const savedFavs = localStorage.getItem('velora_module_favorites');
    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs));
    }
    const savedRecents = localStorage.getItem('velora_module_recents');
    if (savedRecents) {
      setRecents(JSON.parse(savedRecents));
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('velora_module_favorites', JSON.stringify(updated));
  };

  const trackVisit = (id: string) => {
    const updated = [id, ...recents.filter(rId => rId !== id)].slice(0, 4);
    setRecents(updated);
    localStorage.setItem('velora_module_recents', JSON.stringify(updated));
  };

  const handleNavigate = (href: string, id: string) => {
    trackVisit(id);
    navigate(href);
  };

  const role = user?.role || 'CLIENT';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const ROLE_ACCESS: Record<string, string[]> = {
    CLIENT: ['dashboard', 'sites', 'documents', 'interventions'],
    TECHNICIEN: ['dashboard', 'interventions', 'tasks', 'equipment', 'parc-auto', 'moyens-generaux', 'ppm', 'planning', 'sites', 'calendar', 'live-tracking'],
  };

  // Stats calculation
  const openInterventionsCount = (interventions || []).filter((i: any) => !['CLOTUREE', 'ANNULEE'].includes(i.status)).length || 0;
  const activeTasksCount = (tasks || []).filter((t: any) => t.status !== 'TERMINE' && t.status !== 'ANNULE').length || 0;
  const activeEquipmentCount = equipment?.length || 0;
  const currentSLAPercent = analytics?.slaRatePercent || 98.4;

  const visibleModules = ERP_MODULES.filter(m => {
    const matchesCategory = activeCategory === 'Tous' || m.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).map(m => {
    const isLocked = !isAdmin && !(ROLE_ACCESS[role] || []).includes(m.id);
    
    // Inject dynamic badges
    if (m.id === 'interventions') {
      return { ...m, isLocked, stat: openInterventionsCount.toString(), statLabel: 'Ouvertes' };
    }
    if (m.id === 'equipment') {
      return { ...m, isLocked, stat: activeEquipmentCount.toString(), statLabel: 'Actifs' };
    }
    if (m.id === 'tasks') {
      return { ...m, isLocked, stat: activeTasksCount.toString(), statLabel: 'En cours' };
    }
    if (m.id === 'dashboard') {
      return { ...m, isLocked, stat: `${currentSLAPercent}%`, statLabel: 'SLA' };
    }
    return { ...m, isLocked };
  });

  const favoriteModules = ERP_MODULES.filter(m => favorites.includes(m.id)).map(m => {
    const isLocked = !isAdmin && !(ROLE_ACCESS[role] || []).includes(m.id);
    return { ...m, isLocked };
  });

  const recentModules = ERP_MODULES.filter(m => recents.includes(m.id)).map(m => {
    const isLocked = !isAdmin && !(ROLE_ACCESS[role] || []).includes(m.id);
    return { ...m, isLocked };
  });

  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden select-none">
      {/* Dynamic Background Premium Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/10 rounded-[100%] blur-[120px] opacity-70" />
        <div className="absolute top-[30vh] right-[10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[130px] opacity-40" />
        <div className="absolute bottom-0 left-[5%] w-[850px] h-[850px] bg-blue-600/5 rounded-full blur-[150px] opacity-50" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* TOP COMPACT BRAND HEADER */}
        <header className="w-full px-6 py-4 flex justify-between items-center bg-white/[0.01] border-b border-white/5 backdrop-blur-2xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={VELORALogo} alt="VELORA PRO" className="h-6 brightness-0 invert" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                PRO PLATFORM
              </span>
            </div>
            {/* Live Connectivity Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full">
              {socketConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">SOCKET CONNECTÉ</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">CONNEXION PERDUE</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Tenant Selector for SaaS Admins or Multi-Tenant Users */}
            {(isAdmin || (user?.tenantAccess && user.tenantAccess.length > 1)) && (
              <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <Building className="w-3.5 h-3.5 text-fuchsia-400" />
                <select 
                  className="bg-transparent text-xs font-black text-white outline-none cursor-pointer"
                  value={activeTenantId || ''}
                  onChange={(e) => setActiveTenant(e.target.value ? Number(e.target.value) : null)}
                >
                  {isAdmin && <option className="text-black" value="">Tous les Espaces (Global)</option>}
                  {user?.tenantAccess?.map((access) => (
                    <option key={access.tenantId} className="text-black" value={access.tenantId}>
                      {access.tenant.name} ({access.role})
                    </option>
                  ))}
                  {isAdmin && user?.tenantAccess?.length === 0 && (
                     <option className="text-black" value="1" disabled>Admin (Accès Global actif)</option>
                  )}
                </select>
              </div>
            )}

            {/* Quick unread notification indicator - Always visible now */}
            <button 
              onClick={() => navigate('/notifications')} 
              className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black uppercase text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-black text-white leading-none mb-0.5">{user?.name || 'Utilisateur'}</p>
                <p className="text-[8px] font-black uppercase tracking-widest text-white/40">{user?.role || 'INVITÉ'}</p>
              </div>
            </button>

            <button 
              onClick={() => useAuthStore.getState().logout()}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-xs font-bold text-white/70 hover:text-white"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* HERO TITLE CONTAINER */}
        <div className="flex flex-col items-center justify-center pt-12 pb-6 text-center px-4 animate-in slide-in-from-bottom-8 fade-in duration-1000">
          <h1 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.6em] text-white/40 mb-2">
            Système Opérationnel Unifié & GED
          </h1>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/95 to-white/30 pb-1">
            PORTAIL DES MODULES
          </h2>
        </div>

        {/* 1. ERP COMMAND KPI BAR */}
        <section className="max-w-7xl mx-auto w-full px-6 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-1000 delay-200 fill-mode-both">
          {/* Card 1 */}
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-[1.5rem] backdrop-blur-xl flex items-center gap-4 hover:border-white/10 hover:bg-white/[0.04] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Wrench className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Interventions Actives</p>
              <h3 className="text-xl font-black text-white">{openInterventionsCount}</h3>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-[1.5rem] backdrop-blur-xl flex items-center gap-4 hover:border-white/10 hover:bg-white/[0.04] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ClipboardList className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Chantiers / Tâches</p>
              <h3 className="text-xl font-black text-white">{activeTasksCount}</h3>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-[1.5rem] backdrop-blur-xl flex items-center gap-4 hover:border-white/10 hover:bg-white/[0.04] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Monitor className="w-5 h-5 group-hover:animate-pulse transition-transform" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Équipements Suivis</p>
              <h3 className="text-xl font-black text-white">{activeEquipmentCount}</h3>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-[1.5rem] backdrop-blur-xl flex items-center gap-4 hover:border-white/10 hover:bg-white/[0.04] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Taux SLA Moyen</p>
              <h3 className="text-xl font-black text-white">{currentSLAPercent}%</h3>
            </div>
          </div>
        </section>

        {/* 2. QUICK ACTIONS & FAVORITES */}
        <section className="max-w-7xl mx-auto w-full px-6 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-1000 delay-300 fill-mode-both">
          {/* Quick actions box */}
          <div className="lg:col-span-1 bg-white/[0.01] border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-1">Actions Instantanées</h3>
              <p className="text-[11px] text-white/60 mb-5">Lancez des opérations critiques directement depuis le hub.</p>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              <button 
                onClick={() => setIsInterventionModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl transition-all text-xs font-black uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" /> Nouvelle Intervention
              </button>
              
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all text-xs font-black uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" /> Nouveau Chantier/Tâche
              </button>

              <button 
                onClick={() => navigate('/scanner')}
                className="w-full flex items-center justify-center gap-2 p-3 bg-white/[0.02] border border-white/5 hover:border-white/20 text-white/60 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <QrCode className="w-4 h-4 text-primary" /> Scanner un QR Code Équipement
              </button>
            </div>
          </div>

          {/* Favorites/Recent section */}
          <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl flex flex-col justify-between min-h-[200px]">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Vos Raccourcis Favoris
              </h3>
              
              {favoriteModules.length === 0 ? (
                <div className="h-24 flex items-center justify-center border border-dashed border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/20">
                  Aucun favori épinglé. Cliquez sur l'étoile ★ d'un module ci-dessous.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {favoriteModules.map(module => (
                    <button
                      key={module.id}
                      disabled={module.isLocked}
                      onClick={() => handleNavigate(module.href, module.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:-translate-y-0.5 transition-all text-left",
                        module.isLocked && "opacity-40 grayscale cursor-not-allowed"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg bg-white/5 border border-white/10", module.color)}>
                        <module.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-tight text-white/80 truncate">{module.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recents list at the bottom */}
            {recentModules.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mr-3">Dernières visites :</span>
                <div className="inline-flex gap-2 flex-wrap">
                  {recentModules.map(module => (
                    <button
                      key={module.id}
                      onClick={() => handleNavigate(module.href, module.id)}
                      className="text-[10px] font-bold text-white/50 hover:text-primary transition-colors bg-white/[0.01] px-2.5 py-1 rounded-md border border-white/5"
                    >
                      {module.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SEARCH & FILTER CONTROLS */}
        <section className="max-w-7xl mx-auto w-full px-6 mb-8 animate-in fade-in duration-1000 delay-400 fill-mode-both">
          <div className="relative group max-w-xl mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-white/[0.02] border border-white/5 backdrop-blur-xl rounded-2xl p-1 transition-all group-focus-within:border-white/20">
              <Search className="w-5 h-5 text-white/30 ml-4 shrink-0" />
              <input
                type="text"
                placeholder="Rechercher un module par mot clé..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-white placeholder-white/20 px-4 py-3 focus:outline-none focus:ring-0 text-sm font-medium"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 border',
                  activeCategory === cat
                    ? 'bg-white text-black border-white shadow-xl shadow-white/5 scale-105'
                    : 'bg-white/[0.02] text-white/40 hover:bg-white/10 hover:text-white border-white/5'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* 3. MODULES MAIN GRID */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 pb-24">
          {/* We group by category if 'Tous' is selected, to build structural clarity */}
          {activeCategory === 'Tous' && searchQuery === '' ? (
            <div className="space-y-12">
              {CATEGORIES.filter(c => c !== 'Tous').map(cat => {
                const catModules = visibleModules.filter(m => m.category === cat);
                if (catModules.length === 0) return null;

                return (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{cat}</h3>
                      <span className="text-[9px] font-bold text-white/20">({catModules.length})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {catModules.map(module => (
                        <ModuleCard 
                          key={module.id} 
                          module={module} 
                          isFavorite={favorites.includes(module.id)}
                          onFavoriteToggle={(e) => toggleFavorite(module.id, e)}
                          onNavigate={() => handleNavigate(module.href, module.id)} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {visibleModules.map(module => (
                <ModuleCard 
                  key={module.id} 
                  module={module} 
                  isFavorite={favorites.includes(module.id)}
                  onFavoriteToggle={(e) => toggleFavorite(module.id, e)}
                  onNavigate={() => handleNavigate(module.href, module.id)} 
                />
              ))}
            </div>
          )}
          
          {visibleModules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-white/20 animate-in fade-in">
              <Search className="w-12 h-12 mb-4 opacity-30" />
              <p className="font-black uppercase tracking-widest text-xs">Aucun module trouvé</p>
            </div>
          )}
        </main>
        
        {/* 4. PREMIUM SYSTEM BAR FOOTER */}
        <footer className="w-full bg-white/[0.01] border-t border-white/5 py-4 px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black uppercase tracking-widest text-white/30">
          <div>
            VELORA PRO PLATFORM © 2026 — WAYCON MÉDITERRANÉE
          </div>
          <div className="flex items-center gap-6">
            <span>Identifiant : {user?.name || 'Inconnu'}</span>
            <span>Rôle : {role}</span>
            <span>Version app : v3.1.2 PRO</span>
          </div>
        </footer>
      </div>

      {/* QUICK OPERATIONS MODALS */}
      <AddInterventionModal 
        isOpen={isInterventionModalOpen} 
        onClose={() => setIsInterventionModalOpen(false)} 
      />

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
      />
    </div>
  );
}

interface ModuleCardProps {
  module: ERPModule & { isLocked: boolean };
  isFavorite: boolean;
  onFavoriteToggle: (e: React.MouseEvent) => void;
  onNavigate: () => void;
}

function ModuleCard({ module, isFavorite, onFavoriteToggle, onNavigate }: ModuleCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={() => {
        if (!module.isLocked) onNavigate();
      }}
      className={cn(
        "group w-full relative flex flex-col items-start p-5 rounded-[1.5rem] border border-white/5 bg-white/[0.01] backdrop-blur-xl transition-all duration-500 focus:outline-none text-left overflow-hidden min-h-[160px] justify-between",
        module.isLocked 
          ? "opacity-40 grayscale cursor-not-allowed" 
          : "hover:bg-white/[0.03] hover:-translate-y-1 hover:border-white/10 cursor-pointer"
      )}
    >
      {/* Spotlight cursor glow */}
      {!module.isLocked && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[1.5rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(180px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.05), transparent 40%)`,
          }}
        />
      )}
      
      {/* Background Gradient overlay on hover */}
      <div className={cn('absolute inset-0 opacity-0 transition-opacity duration-700 bg-gradient-to-b', !module.isLocked && 'group-hover:opacity-5', module.gradient)} />
      
      {/* Card Header (Icon + Favorite Button) */}
      <div className="w-full flex justify-between items-start relative z-10">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 transition-all duration-500 shadow-2xl', 
          !module.isLocked && 'group-hover:scale-105',
          module.color.replace('text-', 'bg-').replace('-500', '-500/10')
        )}>
          <module.icon className={cn('w-5 h-5 transition-transform duration-500', !module.isLocked && 'group-hover:rotate-6', module.color)} />
        </div>

        {/* Favorite pin button */}
        {!module.isLocked && (
          <button
            onClick={onFavoriteToggle}
            className="p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/10 hover:border-white/10 transition-all text-white/30 hover:text-amber-400"
            title={isFavorite ? "Retirer des favoris" : "Épingler en favori"}
          >
            <Star className={cn("w-3.5 h-3.5 transition-transform group-hover:scale-110", isFavorite ? "text-amber-400 fill-amber-400" : "")} />
          </button>
        )}
      </div>
      
      {/* Title & Description */}
      <div className="w-full mt-4 relative z-10">
        <h4 className={cn("text-xs font-black tracking-tight leading-snug mb-1 transition-colors flex items-center gap-1.5", module.isLocked ? "text-white/40" : "text-white/80 group-hover:text-white")}>
          {module.title}
          {module.isPro && !module.isLocked && (
            <Zap className="w-3 h-3 text-primary shrink-0" />
          )}
        </h4>
        <p className="text-[10px] text-white/40 leading-relaxed font-medium line-clamp-2 transition-colors group-hover:text-white/50">
          {module.description}
        </p>
      </div>

      {/* Footer stats if available */}
      {module.stat && !module.isLocked ? (
        <div className="w-full mt-3 flex justify-between items-center relative z-10 pt-2 border-t border-white/5">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{module.statLabel}</span>
          <span className={cn('text-xs font-black', module.color)}>{module.stat}</span>
        </div>
      ) : (
        <div className="w-full mt-3 flex justify-between items-center relative z-10 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] font-black uppercase tracking-widest text-primary">Accéder</span>
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
        </div>
      )}

      {/* Locked Overlay badge */}
      {module.isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] rounded-[1.5rem] z-20">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full shadow-2xl">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Accès restreint</span>
          </div>
        </div>
      )}
    </div>
  );
}
