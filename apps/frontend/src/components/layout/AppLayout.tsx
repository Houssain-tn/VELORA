import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNavbar } from './BottomNavbar';
import { PullToRefresh } from './PullToRefresh';
import { CommandPalette } from './CommandPalette';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSocketStore, type AppNotification } from '@/stores/useSocketStore';
import { Bell, X, AlertTriangle, ShieldCheck, WifiOff } from 'lucide-react';
import { useCompanies } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function AppLayout() {
  const { user, isAuthenticated, simulatedRole, simulateRole } = useAuthStore();
  const { connect, disconnect, notifications } = useSocketStore();
  const { data: companies } = useCompanies();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<AppNotification | null>(null);
  const [lastProcessedAlertId, setLastProcessedAlertId] = useState<string | number | null>(null);
  const { theme } = useSettingsStore();

  // Keyboard listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Network offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  
  // Theme Manager
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
  }, [theme]);
  
  // High-visibility Alert Manager (Premium Experience)
  useEffect(() => {
    const latest = notifications[0];
    if (latest && !latest.read && latest.id !== lastProcessedAlertId) {
      // Expanded window to 30s to account for mobile latency & clock drift
      const isNew = (Math.abs(new Date().getTime() - new Date(latest.createdAt).getTime())) < 30000;
      
      if (isNew) {
        setActiveAlert(latest);
        setLastProcessedAlertId(latest.id);
        
        // Auto-close overlay after 15 seconds to keep UI clean
        const timer = setTimeout(() => setActiveAlert(null), 15000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, lastProcessedAlertId]);

  // Global Branding Injection
  useEffect(() => {
    if (!Array.isArray(companies) || !user?.companyId) return;
    
    const myCompany = companies.find((c: any) => c.id === user.companyId);
    const primaryColor = myCompany?.primaryColor;
    
    if (primaryColor && primaryColor.startsWith('#')) {
      // Helper to convert hex to HSL components
      const hexToHsl = (hex: string) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
          r = parseInt(hex[1] + hex[1], 16);
          g = parseInt(hex[2] + hex[2], 16);
          b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
          r = parseInt(hex.substring(1, 3), 16);
          g = parseInt(hex.substring(3, 5), 16);
          b = parseInt(hex.substring(5, 7), 16);
        }
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
          let d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }
        return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
      };

      const hslValue = hexToHsl(primaryColor);
      document.documentElement.style.setProperty('--primary', hslValue);
      document.documentElement.style.setProperty('--ring', hslValue);
    }
  }, [companies]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Unlock Audio on first interaction (Mobile/OS restriction fix)
  useEffect(() => {
    const unlockAudio = () => {
      // Use a simple HTML5 Audio prime instead of AudioContext to avoid Chrome warnings
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      audio.play().catch(() => {});
    };

    // { once: true } auto-removes the listener after first fire — no manual cleanup needed
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      connect(user.id, user.companyId);
    } else {
      disconnect();
      if (location.pathname !== '/login') {
        navigate('/login');
      }
    }
  }, [user, isAuthenticated, location.pathname, connect, disconnect, navigate]);

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* PREMIUM ALERT OVERLAY (BIG & PRO) */}
        {activeAlert && (
          <div 
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg animate-in slide-in-from-top-12 duration-700 ease-out fill-mode-forwards"
          >
            <div className={cn(
              "relative group p-6 rounded-[2.5rem] border-2 shadow-2xl backdrop-blur-3xl transition-all overflow-hidden",
              activeAlert.type === 'ERROR' ? "bg-rose-500/10 border-rose-500/30 text-rose-600" :
              activeAlert.type === 'WARNING' ? "bg-amber-500/10 border-amber-500/30 text-amber-600" :
              "bg-primary/10 border-primary/30 text-primary"
            )}>
              {/* Inner Glow Anchor */}
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 -translate-y-1/2 translate-x-1/2",
                activeAlert.type === 'ERROR' ? "bg-rose-500" : activeAlert.type === 'WARNING' ? "bg-amber-500" : "bg-primary"
              )} />

              <div className="flex items-center gap-5 relative z-10">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-all",
                  activeAlert.type === 'ERROR' ? "bg-rose-600/10 border-rose-500/20" :
                  activeAlert.type === 'WARNING' ? "bg-amber-600/10 border-amber-500/20" :
                  "bg-primary/10 border-primary/20"
                )}>
                  {activeAlert.type === 'ERROR' ? <ShieldCheck className="w-7 h-7" /> :
                   activeAlert.type === 'WARNING' ? <AlertTriangle className="w-7 h-7" /> :
                   <Bell className="w-7 h-7 animate-bounce-slow" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-1 leading-none opacity-60">Flash Alert Direct</h4>
                  <p className="text-xl font-black tracking-tighter text-foreground line-clamp-1 truncate pr-8">{activeAlert.title}</p>
                  <p className="text-sm font-bold text-muted-foreground line-clamp-2 mt-1.5 leading-snug">{activeAlert.message}</p>
                </div>

                <button 
                  onClick={() => setActiveAlert(null)}
                  className="absolute top-2 right-2 p-3 hover:bg-black/5 rounded-full transition-colors self-start"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Progress Dimmer */}
              <div className="absolute bottom-0 left-0 h-1.5 bg-current/20 w-full">
                 <div className="h-full bg-current animate-[timer_8s_linear_forwards]" style={{ width: '100%', transformOrigin: 'left' }} />
              </div>
            </div>
          </div>
        )}

        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* ── Offline Banner ── */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 animate-in slide-in-from-top-2 duration-300">
            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">
              Hors ligne — Les données affichées peuvent ne pas être à jour
            </p>
          </div>
        )}

        {/* ── Mode Simulation Banner ── */}
        {simulatedRole && (
          <div className="flex items-center justify-between gap-4 px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">
                Mode simulation actif — Vous naviguez en tant que : <span className="underline">{simulatedRole}</span>
              </p>
            </div>
            <button 
              onClick={() => simulateRole(null)}
              className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-800 hover:underline bg-amber-600/10 hover:bg-amber-600/20 px-3 py-1 rounded-lg transition-all"
            >
              Quitter
            </button>
          </div>
        )}

        <PullToRefresh>
          <main className="p-4 md:p-6 bg-muted/20 min-h-full">
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </PullToRefresh>
        <BottomNavbar />
      </div>
    </div>
  );
}
