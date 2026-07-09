import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, UserCircle, LogOut, Settings as SettingsIcon, Sparkles, Building } from 'lucide-react';
import { useSocketStore } from '@/stores/useSocketStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAskCopilot } from '@/hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import VELORALogo from '@/assets/Logos/Velora_logo.png';
import { NotificationsPanel } from './NotificationsPanel';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { unreadCount, isConnected } = useSocketStore();
  const { user, logout, activeTenantId, setActiveTenant } = useAuthStore();
  const navigate = useNavigate();
  const askCopilot = useAskCopilot();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="relative h-16 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 z-[999] w-full flex-shrink-0 shadow-sm isolate pointer-events-auto">
      <div className="flex items-center gap-4 flex-1 pointer-events-none">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-muted-foreground hover:bg-accent rounded-md lg:hidden pointer-events-auto"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Mobile Branding */}
        <div className="lg:hidden flex items-center gap-2 pointer-events-auto">
          <img src={VELORALogo} alt="VELORA PRO" className="h-7 drop-shadow-sm" />
        </div>
        
        <div className="relative w-96 hidden lg:block group pointer-events-auto" ref={searchRef}>
          <Sparkles className={cn(
            "absolute left-3 top-2.5 h-4 w-4 transition-all duration-500",
            askCopilot.isPending ? "text-primary animate-pulse" : "text-primary/60 group-focus-within:text-primary group-focus-within:rotate-12"
          )} />
          <input
            type="search"
            placeholder="Demandez à Velora Copilot (ex: Combien d'achats ?)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                askCopilot.mutate(searchQuery);
              }
            }}
            className={cn(
              "flex h-9 w-full rounded-full border bg-muted/20 hover:bg-muted/40 px-3 py-1 text-sm shadow-inner transition-all duration-300 pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:bg-background font-medium",
              isSearchFocused ? "border-primary/50 shadow-primary/20 shadow-lg" : "border-input"
            )}
          />
          
          {isSearchFocused && (
             <div className="absolute top-12 left-0 w-full bg-card border rounded-3xl shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
               
               {/* Decorative Gradient Background */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

               {askCopilot.isPending ? (
                 <div className="flex flex-col items-center justify-center py-6 gap-3">
                   <Sparkles className="w-6 h-6 text-primary animate-spin" />
                   <p className="text-xs font-bold text-muted-foreground animate-pulse">Velora analyse vos données...</p>
                 </div>
               ) : askCopilot.data ? (
                 <div className="space-y-4 relative z-10">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                       <Sparkles className="w-3 h-3 text-primary" />
                     </div>
                     <p className="text-[10px] font-black uppercase text-primary tracking-widest">Réponse de l'IA</p>
                   </div>
                   
                   <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                     {/* Very simple markdown parser for bold lists */}
                     {askCopilot.data.text.split('\n').map((line, i) => {
                       const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<span class="font-black text-primary">$1</span>');
                       return <p key={i} dangerouslySetInnerHTML={{ __html: formattedLine || '<br/>' }} />
                     })}
                   </div>

                   {askCopilot.data.suggestions && (
                     <div className="pt-3 flex flex-wrap gap-2 border-t border-border/50">
                       {askCopilot.data.suggestions.map((sug, i) => (
                         <button 
                           key={i}
                           onClick={() => { setSearchQuery(sug); askCopilot.mutate(sug); }}
                           className="text-[10px] font-bold px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                         >
                           {sug}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
               ) : (
                 <>
                   <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-widest mb-3">Suggestions Velora</p>
                   <div className="space-y-2">
                     <div onClick={() => { setSearchQuery("Combien de demandes d'achat en attente ?"); askCopilot.mutate("Combien de demandes d'achat en attente ?"); }} className="p-3 bg-muted/20 hover:bg-muted/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-primary/30 group/item flex items-center gap-3">
                        <div className="p-1.5 bg-primary/10 rounded-lg group-hover/item:bg-primary group-hover/item:text-white transition-colors"><Sparkles className="w-3 h-3 text-primary group-hover/item:text-white" /></div>
                        <p className="text-xs font-bold">Combien de demandes d'achat en attente ?</p>
                     </div>
                     <div onClick={() => { setSearchQuery("Quelles sont mes tâches en cours ?"); askCopilot.mutate("Quelles sont mes tâches en cours ?"); }} className="p-3 bg-muted/20 hover:bg-muted/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-primary/30 group/item flex items-center gap-3">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors"><Sparkles className="w-3 h-3 text-blue-500 group-hover/item:text-white" /></div>
                        <p className="text-xs font-bold">Quelles sont mes tâches en cours ?</p>
                     </div>
                     <div onClick={() => { setSearchQuery("Y a-t-il des alertes sur le stock ?"); askCopilot.mutate("Y a-t-il des alertes sur le stock ?"); }} className="p-3 bg-muted/20 hover:bg-muted/40 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-primary/30 group/item flex items-center gap-3">
                        <div className="p-1.5 bg-amber-500/10 rounded-lg group-hover/item:bg-amber-500 group-hover/item:text-white transition-colors"><Sparkles className="w-3 h-3 text-amber-500 group-hover/item:text-white" /></div>
                        <p className="text-xs font-bold">Y a-t-il des alertes sur le stock ?</p>
                     </div>
                   </div>
                 </>
               )}
             </div>
          )}
        </div>

    {/* Mobile Search Overlay */}
    {isMobileSearchOpen && (
      <div className="lg:hidden fixed inset-0 z-[70] bg-background/95 backdrop-blur-md flex flex-col p-4 pt-16 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-3">
          {/* Tenant Selector for SaaS Admins or Multi-Tenant Users */}
          {(isAdmin || (user?.tenantAccess && user.tenantAccess.length > 1)) && (
            <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl pointer-events-auto">
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

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={mobileSearchRef}
              autoFocus
              type="search"
              placeholder="Rechercher équipement, intervention, S/N..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 py-1 text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 font-medium"
            />
          </div>
          <button
            onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors font-bold text-sm"
          >
            Annuler
          </button>
        </div>
        {searchQuery.length > 1 && (
          <div className="mt-4 bg-card border rounded-2xl shadow-xl p-4 space-y-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-widest mb-3">Aller vers</p>
            <div onClick={() => { setIsMobileSearchOpen(false); navigate('/equipment'); }} className="p-3 bg-muted/20 hover:bg-muted/40 rounded-xl cursor-pointer transition-colors">
              <p className="text-sm font-black text-primary">🔍 Rechercher dans Inventaire...</p>
            </div>
            <div onClick={() => { setIsMobileSearchOpen(false); navigate('/interventions'); }} className="p-3 bg-muted/20 hover:bg-muted/40 rounded-xl cursor-pointer transition-colors">
              <p className="text-sm font-black text-amber-600">🔧 Rechercher dans Interventions...</p>
            </div>
          </div>
        )}
      </div>
    )}
  </div>

      <div className="flex items-center gap-2 md:gap-4 pointer-events-auto relative z-50">
        {/* Mobile Search Button */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors"
          title="Rechercher"
        >
          <Search className="w-5 h-5" />
        </button>
        {/* Notifications Bell */}
        <div className="relative" ref={bellRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={cn(
              "relative z-50 p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors cursor-pointer pointer-events-auto",
              isNotificationsOpen && "bg-accent text-primary"
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-destructive rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <NotificationsPanel onClose={() => setIsNotificationsOpen(false)} />
          )}
        </div>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full transition-all duration-500",
            isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]'
          )} title={isConnected ? 'En ligne' : 'Déconnecté'} />
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="relative z-50 flex items-center gap-2 pl-4 border-l cursor-pointer hover:opacity-80 transition-opacity pointer-events-auto">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user?.name || 'Administrateur'}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">{user?.role || 'SUPER_ADMIN'}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 hover:scale-105 transition-transform shadow-sm">
                <UserCircle className="w-6 h-6" />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 shadow-2xl border-primary/10">
            <DropdownMenuLabel className="font-bold">Mon Profil</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer group flex items-center">
              <SettingsIcon className="mr-2 h-4 w-4 group-hover:rotate-45 transition-transform" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer font-bold group">
              <LogOut className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
