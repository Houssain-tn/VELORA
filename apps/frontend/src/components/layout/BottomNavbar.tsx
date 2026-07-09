import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  QrCode,
  Bell,
  LayoutGrid,
} from 'lucide-react';
import { useSocketStore } from '@/stores/useSocketStore';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

export function BottomNavbar() {
  const location = useLocation();
  const { canSeeAnalytics, canSeeInterventions } = usePermissions();
  const { unreadCount } = useSocketStore();

  const navItems = [
    { 
      label: 'Accueil', 
      icon: LayoutDashboard, 
      href: '/dashboard', 
      visible: canSeeAnalytics 
    },
    { 
      label: 'Modules', 
      icon: LayoutGrid, 
      href: '/modules', 
      visible: true 
    },
    { 
      label: 'Scanner', 
      icon: QrCode, 
      href: '/scanner', 
      visible: true 
    },
    { 
      label: 'Interv.', 
      icon: Wrench, 
      href: '/interventions', 
      visible: canSeeInterventions 
    },
    { 
      label: 'Alertes', 
      icon: Bell, 
      href: '/notifications', 
      visible: true 
    },
  ].filter(item => item.visible);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t z-50 px-2 pb-safe-area-inset-bottom h-16 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[56px] px-1 transition-all duration-300",
              isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
            )}
          >
            <div className="relative">
              <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]")} />
              {item.label === 'Alertes' && unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[8px] font-black text-white bg-destructive rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-in zoom-in border border-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
            {isActive && (
              <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full animate-in zoom-in" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
