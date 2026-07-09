import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useApi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { MessageSquare, Bell, CheckCheck, Info, AlertTriangle, X, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      await markRead.mutateAsync(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COMMENTAIRE': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'RETARD_SLA': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'INTERVENTION_CREEE': return <Bell className="w-4 h-4 text-primary" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      {/* MOBILE BACKDROP - Dim and Blur the background */}
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className={cn(
        "bg-card border shadow-2xl z-[100] animate-in duration-200 overflow-hidden flex flex-col transition-all",
        // Mobile (default)
        "fixed inset-x-4 top-1/2 -translate-y-1/2 rounded-[2.5rem] max-h-[85vh]",
        // Desktop (overriding EVERYTHING mobile)
        "lg:absolute lg:inset-y-auto lg:inset-x-auto lg:top-full lg:right-0 lg:translate-y-0 lg:mt-3 lg:w-96 lg:max-h-[600px] lg:rounded-2xl lg:border-primary/10"
      )}>
        <div className="p-5 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bell className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest">
              Notifications
            </h4>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => markAllRead.mutate()}
              className="text-[10px] font-black text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 transition-all flex items-center gap-2 uppercase tracking-widest"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Tout lire
            </button>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-muted rounded-full">
               <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* ── Push Notification Permission Banner ── */}
        <NotificationPermissionBanner />

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="p-12 text-center">
               <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase opacity-40">Sync en cours...</p>
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-16 text-center opacity-30 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em]">Flux d'activité vide</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notif: any) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "p-5 hover:bg-muted/40 cursor-pointer transition-all relative flex gap-4 border-l-0 shadow-sm",
                    !notif.read ? "bg-primary/[0.05] border-l-4 border-l-primary" : "bg-background border-b border-border/20"
                  )}
                >
                  <div className="shrink-0 w-10 h-10 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50 shadow-sm transition-transform group-hover:scale-110">
                    {getTypeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-4">
                      <p className="text-[11px] font-black uppercase tracking-tight leading-tight text-foreground/90">{notif.title}</p>
                      {!notif.read && (
                        <div className="shrink-0 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <Clock className="w-3 h-3 text-muted-foreground/30" />
                       <p className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-widest italic">
                        {format(new Date(notif.createdAt), 'dd MMMM à HH:mm', { locale: fr })}
                       </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-muted/5 dark:bg-slate-900/40 text-center">
          <button 
            onClick={() => { navigate('/notifications'); onClose(); }}
            className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted rounded-xl transition-all border-2 border-dashed border-border/50 flex items-center justify-center gap-2"
          >
            Centre de Monitoring Complet <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Push Permission Banner — detects browser state and guides the user
// Shows inside the NotificationsPanel, handles all 4 permission states.
// ─────────────────────────────────────────────────────────────────────────────
function NotificationPermissionBanner() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  // Re-render after the user clicks "Autoriser" and the browser responds
  useEffect(() => {
    const refresh = () => {
      if ('Notification' in window) setPermission(Notification.permission);
    };
    window.addEventListener('notif-permission-changed', refresh);
    return () => window.removeEventListener('notif-permission-changed', refresh);
  }, []);

  // Browser API not available at all
  if (permission === 'unsupported') return null;

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  const isHttps = window.location.protocol === 'https:';
  const isSecureContext = isLocalhost || isHttps;

  // ── Case 1: LAN HTTP (e.g., http://192.168.x.x) ───────────────────────────
  // Browsers BLOCK Notification API on non-secure HTTP origins.
  // No code workaround exists — must use HTTPS or localhost.
  if (!isSecureContext) {
    return (
      <div className="mx-4 mt-3 mb-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">
            Alertes OS — HTTPS requis
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Les alertes navigateur nécessitent <strong>HTTPS</strong>. En réseau local HTTP, seules les notifications in-app et l'alerte overlay sont actives.
            Sur l'ordinateur serveur, accédez via <code className="bg-muted px-1 py-0.5 rounded text-[9px] font-mono">localhost:5175</code> pour les activer.
          </p>
        </div>
      </div>
    );
  }

  // ── Case 2: Already granted — banner not needed ────────────────────────────
  if (permission === 'granted') return null;

  // ── Case 3: Denied by user — show manual unblock instructions ─────────────
  if (permission === 'denied') {
    return (
      <div className="mx-4 mt-3 mb-1 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3 items-start">
        <Bell className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">
            Notifications bloquées — à débloquer manuellement
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed space-y-1">
            <span className="block">🖥 <strong>Chrome / Edge PC :</strong> Cliquer sur 🔒 dans la barre d'adresse → Notifications → <em>Autoriser</em> → Recharger la page.</span>
            <span className="block">🖥 <strong>Firefox PC :</strong> Cliquer sur 🔒 → Connexion sécurisée → Plus d'infos → Permissions → Notifications → <em>Autoriser</em>.</span>
            <span className="block">📱 <strong>Chrome Mobile :</strong> Menu ⋮ → Paramètres du site → Notifications → <em>Autoriser</em>.</span>
            <span className="block">📱 <strong>Safari iOS :</strong> Réglages → Applications → Safari → Sites web → Notifications → <em>Demander</em>.</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Case 4: Not yet asked (permission === 'default') ──────────────────────
  const handleRequestPermission = async () => {
    try {
      await Notification.requestPermission();
    } catch (e) {
      console.warn('Notification permission request failed:', e);
    } finally {
      // Dispatch event to refresh banner state after browser dialog closes
      window.dispatchEvent(new Event('notif-permission-changed'));
    }
  };

  return (
    <div className="mx-4 mt-3 mb-1 p-3 rounded-xl bg-primary/5 border border-primary/20 flex gap-3 items-center">
      <Bell className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">
          Activer les alertes système
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Recevez les alertes SLA et interventions même quand l'onglet est en arrière-plan.
        </p>
      </div>
      <button
        onClick={handleRequestPermission}
        className="shrink-0 px-3 py-2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/90 active:scale-95 transition-all shadow-sm whitespace-nowrap"
      >
        Autoriser
      </button>
    </div>
  );
}
