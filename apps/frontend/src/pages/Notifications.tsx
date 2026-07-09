import { Bell, CheckCircle, Clock, ExternalLink, Trash2, MailOpen } from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useApi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/Toaster';

export function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success('Toutes les notifications sont lues');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markRead.mutateAsync(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-medium">Chargement des notifications...</div>;

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary" /> Notifications
          </h2>
          <p className="text-muted-foreground mt-1 font-medium">
            Vous avez <span className="text-primary font-bold">{unreadCount}</span> {unreadCount === 0 ? 'notification non lue' : unreadCount === 1 ? 'nouvelle notification' : 'nouvelles notifications'}.
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/20"
          >
            <CheckCircle className="w-4 h-4" /> Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications?.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/10">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <MailOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium italic">Aucune notification pour le moment.</p>
          </div>
        ) : (
          notifications?.map((notification: any) => (
            <div 
              key={notification.id}
              onClick={() => !notification.read && handleMarkRead(notification.id)}
              className={cn(
                "group relative p-5 rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer",
                notification.read 
                  ? "bg-muted/30 border-transparent grayscale-[0.5]" 
                  : "bg-card border-primary/20 shadow-md hover:shadow-lg hover:border-primary/50"
              )}
            >
              <div className={cn(
                "p-3 rounded-xl transition-colors",
                notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
              )}>
                <Bell className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h4 className={cn("font-bold truncate", !notification.read && "text-primary")}>
                    {notification.title}
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(notification.createdAt), 'dd MMMM yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {notification.message}
                </p>
                
                {notification.link && (
                  <Link 
                    to={notification.link}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline uppercase tracking-tighter"
                  >
                    Consulter <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {!notification.read && (
                <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full animate-bounce shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              )}
              
              <button 
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
