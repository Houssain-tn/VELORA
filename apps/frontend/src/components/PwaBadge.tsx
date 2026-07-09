import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function PwaBadge() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error: Error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!isOffline && !offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {isOffline && (
        <div className="bg-amber-500/20 backdrop-blur-xl border border-amber-500/50 text-amber-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <WifiOff className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="font-bold text-sm">Mode Hors-Ligne Actif</p>
            <p className="text-xs opacity-80">Vous consultez les données en cache.</p>
          </div>
        </div>
      )}

      {needRefresh && (
        <div className="bg-indigo-500/20 backdrop-blur-xl border border-indigo-500/50 text-indigo-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center animate-spin">
            <RefreshCw className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="font-bold text-sm">Nouvelle version disponible</p>
            <p className="text-xs opacity-80">Cliquez pour mettre à jour l'application.</p>
          </div>
          <div className="flex gap-2 ml-4">
            <button onClick={() => updateServiceWorker(true)} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors">
              Mettre à jour
            </button>
            <button onClick={close} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}

      {offlineReady && !isOffline && (
        <div className="bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
          <div>
            <p className="font-bold text-sm">Application Prête</p>
            <p className="text-xs opacity-80">L'application fonctionne désormais hors-ligne.</p>
          </div>
          <button onClick={close} className="ml-4 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors">
            Ok
          </button>
        </div>
      )}
    </div>
  );
}
