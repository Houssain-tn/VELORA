import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { LogOut, Home, Receipt, Wrench, Menu, X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import VeloraLogo from '@/assets/Logos/Velora_logo.svg';

export function ClientLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { title: 'Tableau de bord', href: '/client/dashboard', icon: Home },
    { title: 'Mes Factures', href: '/client/invoices', icon: Receipt },
    { title: 'Assistance & Tickets', href: '/client/tickets', icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo & Desktop Nav */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center gap-4">
                <img src={VeloraLogo} alt="Logo" className="h-8 w-auto" />
                <div className="h-6 w-px bg-border hidden md:block" />
                <span className="text-sm font-black uppercase tracking-widest text-primary hidden md:block">
                  Portail Client
                </span>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-bold uppercase tracking-wider transition-all",
                        isActive 
                          ? "border-primary text-primary" 
                          : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Profile & Actions */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center gap-6">
              <button className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>
              
              <div className="flex items-center gap-4 pl-6 border-l">
                <div className="text-right">
                  <p className="text-sm font-black text-foreground">{user?.name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user?.email}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-inner">
                  {user?.name?.charAt(0) || 'C'}
                </div>
                <button 
                  onClick={() => logout()}
                  className="p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 rounded-xl transition-all ml-2"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t bg-card animate-in slide-in-from-top-4 duration-200">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      navigate(item.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full pl-3 pr-4 py-3 border-l-4 text-base font-bold",
                      isActive 
                        ? "bg-primary/5 border-primary text-primary" 
                        : "border-transparent text-muted-foreground hover:bg-muted hover:border-muted-foreground/30 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.title}
                  </button>
                );
              })}
            </div>
            <div className="pt-4 pb-3 border-t">
              <div className="flex items-center px-4 gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  {user?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="text-base font-black text-foreground">{user?.name}</div>
                  <div className="text-xs font-bold text-muted-foreground">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-3 w-full px-4 py-3 text-base font-bold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        <Outlet />
      </main>
      
      {/* Simple Footer */}
      <footer className="bg-card border-t py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Propulsé par Velora Pro &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
