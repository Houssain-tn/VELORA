import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/stores/useAuthStore';
import { useInterventions, useTasks } from '@/hooks/useApi';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  GanttChartSquare,
  Wrench,
  Monitor,
  MapPin,
  FileText,
  Settings,
  Users,
  ShieldCheck,
  CalendarClock,
  Receipt,
  Shield,
  Archive,
  Activity,
  X,
  BookOpen,
  Video,
  Navigation,
  ShoppingCart,
  Building2,
  Car,
  Package,
  Grid3X3,
} from 'lucide-react';
import VELORALogo from '@/assets/Logos/Velora_logo.svg';

const adminItems = [
  { title: 'Utilisateurs', icon: Users, href: '/users' },
  { title: 'Équipes (Squads)', icon: Users, href: '/squads' },
  { title: "Journal d'Audit", icon: Shield, href: '/audit-logs' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const {
    canSeeAdminMenu,
    canSeeAnalytics,
    canSeeTasks,
    canSeeInterventions,
    canSeeProjects,
    canSeeSites,
    canSeeEquipment,
    canSeeContracts,
    canSeeInvoices,
    canSeeDocuments
  } = usePermissions();

  // Live count badges
  const { data: interventions } = useInterventions({ excludeArchived: 'true' });
  const { data: tasks } = useTasks({ excludeArchived: 'true' });
  const openInterventionsCount = (interventions || []).filter((i: any) => !['CLOTUREE', 'ANNULEE'].includes(i.status)).length || 0;
  const pendingTasksCount = (tasks || []).filter((t: any) => t.status !== 'TERMINE' && t.status !== 'ANNULE').length || 0;

  const badgeMap: Record<string, number> = {
    '/interventions': openInterventionsCount,
    '/task-tracking': pendingTasksCount,
  };

  const navigationGroups = [
    {
      group: 'Accueil ERP',
      items: [
        { title: 'Tableau de Bord', icon: LayoutDashboard, href: '/dashboard', visible: true },
        { title: 'Performances', icon: Activity, href: '/analytics', visible: canSeeAnalytics },
      ]
    },
    {
      group: 'Maintenance',
      items: [
        { title: 'Live Tracking', icon: Navigation, href: '/live-tracking', visible: canSeeInterventions },
        { title: 'Interventions', icon: Wrench, href: '/interventions', visible: canSeeInterventions },
        { title: 'PPM (Préventif)', icon: CalendarClock, href: '/ppm', visible: canSeeInterventions },
      ]
    },
    {
      group: 'Planification',
      items: [
        { title: 'Suivi des Tâches', icon: ClipboardList, href: '/task-tracking', visible: canSeeTasks },
        { title: 'Planning Chronologique', icon: GanttChartSquare, href: '/chronological-planning', visible: canSeeTasks },
        { title: 'Calendrier', icon: CalendarDays, href: '/calendar', visible: canSeeTasks },
        { title: 'Réunions & PV', icon: Video, href: '/meetings', visible: true },
        { title: 'Projets', icon: GanttChartSquare, href: '/projects', visible: canSeeProjects },
      ]
    },
    {
      group: 'Parc & Actifs',
      items: [
        { title: 'Sites / Localisations', icon: MapPin, href: '/sites', visible: canSeeSites },
        { title: 'Inventaire Équipements', icon: Monitor, href: '/equipment', visible: canSeeEquipment },
      ]
    },
    {
      group: 'Actifs d\'Entreprise',
      items: [
        { title: 'Immobilisations', icon: Building2, href: '/immobilisations', visible: user?.role !== 'CLIENT' },
        { title: 'Parc Automobile', icon: Car, href: '/parc-automobile', visible: user?.role !== 'CLIENT' },
        { title: 'Moyens Généraux', icon: Package, href: '/moyens-generaux', visible: user?.role !== 'CLIENT' },
        { title: "Demandes d'Achat", icon: ShoppingCart, href: '/purchases', visible: user?.role !== 'CLIENT' },
      ]
    },
    {
      group: 'Back-Office',
      items: [
        { title: 'Clients (CRM)', icon: Building2, href: '/clients', visible: true },
        { title: 'Contrats & SLA', icon: ShieldCheck, href: '/contracts', visible: canSeeContracts },
        { title: 'Facturation', icon: Receipt, href: '/invoices', visible: canSeeInvoices },
        { title: 'Documents Sociaux', icon: FileText, href: '/documents', visible: canSeeDocuments },
      ]
    },
    {
      group: 'Plus',
      items: [
        { title: 'Archives', icon: Archive, href: '/archive', visible: true },
        { title: 'Centre d\'Aide', icon: BookOpen, href: '/help', visible: true },
        { title: 'Paramètres', icon: Settings, href: '/settings', visible: true },
      ]
    }
  ];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-[100] w-64 bg-sidebar border-r flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shadow-lg",
      isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
    )}>
      {/* Brand area */}
      <div className="h-16 flex items-center justify-between px-6 border-b bg-sidebar/50 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-xl font-bold flex items-center gap-3 w-full">
          <img src={VELORALogo} alt="VELORA PRO" className="h-7 drop-shadow-sm transition-transform hover:scale-110" />
          <span className="text-sm font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 whitespace-nowrap overflow-hidden text-ellipsis">
            VELORA PRO
          </span>
        </h1>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 no-scrollbar">
        <div className="mb-2">
          <Link
            to="/modules"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all shadow-sm shadow-primary/20"
          >
            <Grid3X3 className="w-4 h-4" />
            Accueil (Modules)
          </Link>
        </div>
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter(item => item.visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group} className="space-y-1">
              <p className="px-3 text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] py-2">
                {group.group}
              </p>
              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-[11px] font-bold group',
                        active
                          ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                      )}
                    >
                      <item.icon className={cn(
                        "w-4 h-4 transition-transform group-hover:scale-110",
                        active ? "text-primary" : "text-muted-foreground/60"
                      )} />
                      <span className="uppercase tracking-tight flex-1">{item.title}</span>
                      {badgeMap[item.href] > 0 && (
                        <span className={cn(
                          "ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-black rounded-full",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                        )}>
                          {badgeMap[item.href] > 99 ? '99+' : badgeMap[item.href]}
                        </span>
                      )}
                      {active && !badgeMap[item.href] && <div className="ml-auto w-1 h-3 bg-primary rounded-full" />}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}

        {canSeeAdminMenu && (
          <div className="pt-4 mt-4 border-t border-dashed border-border/50">
            <p className="px-3 text-[9px] font-black text-destructive/60 uppercase tracking-[0.2em] py-2">
              Administration
            </p>
            <nav className="space-y-0.5">
              {adminItems.map((item) => {
                const active = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-[11px] font-bold group',
                      active
                        ? 'bg-destructive/5 text-destructive border-r-2 border-destructive'
                        : 'text-muted-foreground hover:bg-destructive/5 hover:text-destructive',
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="uppercase tracking-tight">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Sidebar Footer - Credits */}
      <div className="p-4 md:p-6 border-t bg-muted/5 space-y-4 pb-24 lg:pb-6">
        <div className="flex flex-col gap-1">
          <a
            href="https://www.linkedin.com/company/waycon-m%C3%A9diterran%C3%A9e"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Waycon Méditerranée © 2026
          </a>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/40 leading-none">Infrastructured By</p>
          <a
            href="https://www.linkedin.com/in/houssain-messaoudi/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors truncate"
          >
            HOUSSAIN MESSAOUDI <span className="opacity-40 font-medium text-[8px] ml-1">(VELORA CORE)</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
