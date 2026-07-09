import { useState } from 'react';
import { useAuditLogs } from '@/hooks/useApi';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Clock, 
  Activity, 
  Search,
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  Database, 
  User as UserIcon,
  Tag,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SortKey = 'createdAt' | 'user.name' | 'action' | 'entity';
type SortDirection = 'asc' | 'desc';

export function AuditLogs() {
  const [page, setPage] = useState(1);
  const { data: response, isLoading } = useAuditLogs(page, 50);
  const logsList = response?.data || [];
  const meta = response?.meta;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ 
    key: 'createdAt', 
    direction: 'desc' 
  });
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const filteredAndSortedLogs = logsList
    ?.filter((log: any) => {
      const searchLow = searchTerm.toLowerCase();
      return (
        log.user?.name?.toLowerCase().includes(searchLow) ||
        log.entity?.toLowerCase().includes(searchLow) ||
        log.action?.toLowerCase().includes(searchLow) ||
        log.entityId?.toString().includes(searchLow) ||
        log.newValues?.toLowerCase().includes(searchLow)
      );
    })
    .sort((a: any, b: any) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      // Handle nested properties (like user.name)
      if (sortConfig.key.includes('.')) {
        const parts = sortConfig.key.split('.');
        valA = a[parts[0]]?.[parts[1]];
        valB = b[parts[0]]?.[parts[1]];
      }

      if (!valA) return sortConfig.direction === 'asc' ? -1 : 1;
      if (!valB) return sortConfig.direction === 'asc' ? 1 : -1;

      const compare = valA.toString().localeCompare(valB.toString());
      return sortConfig.direction === 'asc' ? compare : -compare;
    });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement du journal d'audit...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Journal d'Audit
          </h2>
          <p className="text-muted-foreground font-medium">Historique complet des actions effectuées sur la plateforme.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrer par utilisateur, action..."
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-[10px] uppercase tracking-widest font-black text-muted-foreground border-b">
                <th className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors group" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center gap-2">Date & Heure {getSortIcon('createdAt')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('user.name')}>
                  <div className="flex items-center gap-2">Utilisateur {getSortIcon('user.name')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('action')}>
                  <div className="flex items-center gap-2">Action {getSortIcon('action')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('entity')}>
                  <div className="flex items-center gap-2">Entité {getSortIcon('entity')}</div>
                </th>
                <th className="px-6 py-4">Détails Rapides</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAndSortedLogs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black uppercase">
                        {log.user?.name?.substring(0, 2) || '??'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{log.user?.name || 'Système'}</span>
                        <span className="text-[10px] text-muted-foreground">{log.user?.role === 'ADMIN' ? 'Administrateur' : log.user?.role === 'TECHNICIEN' ? 'Technicien' : log.user?.role === 'CLIENT' ? 'Client' : log.user?.role || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border shadow-sm",
                      log.action === 'CREATE' ? 'bg-green-50 text-green-600 border-green-200' :
                      log.action === 'DELETE' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-blue-50 text-blue-600 border-blue-200'
                    )}>
                      {log.action === 'CREATE' ? 'Création' : log.action === 'DELETE' ? 'Suppression' : log.action === 'UPDATE' ? 'Modification' : log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary capitalize">
                      <Activity className="w-3.5 h-3.5" />
                      {log.entity} <span className="text-muted-foreground font-medium">#{log.entityId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[200px]">
                    <div className="text-[10px] text-muted-foreground truncate italic">
                      {log.newValues || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1.5 p-2 px-3 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-widest border border-primary/20"
                    >
                      <Eye className="w-3 h-3" /> Voir plus
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAndSortedLogs?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                    Aucun log correspondant à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="p-4 bg-muted/20 border-t flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">Page {meta.page} sur {meta.totalPages} <span className="text-[10px]">({meta.total} résultats au total)</span></span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-card hover:bg-muted border rounded-xl font-bold uppercase text-[10px] tracking-widest disabled:opacity-50 transition-colors"
              >
                Précédent
              </button>
              <button 
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-4 py-2 bg-card hover:bg-muted border rounded-xl font-bold uppercase text-[10px] tracking-widest disabled:opacity-50 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      <LogDetailModal 
        log={selectedLog} 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
      />
    </div>
  );
}

function LogDetailModal({ log, isOpen, onClose }: { log: any; isOpen: boolean; onClose: () => void }) {
  if (!log) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-card border rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-dashed flex justify-between items-center bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Inspection du Log</h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">ID Log: #{log.id}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5 p-4 bg-muted/20 rounded-2xl border">
                  <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <UserIcon className="w-3 h-3" /> Utilisateur
                  </span>
                  <p className="text-sm font-bold text-foreground">{log.user?.name || 'Système'}</p>
                  <p className="text-[10px] text-primary font-black uppercase">{log.user?.role || 'Service'}</p>
                </div>
                <div className="space-y-1.5 p-4 bg-muted/20 rounded-2xl border">
                  <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <Calendar className="w-3 h-3" /> Date & Heure
                  </span>
                  <p className="text-sm font-bold text-foreground">{format(new Date(log.createdAt), 'dd MMMM yyyy')}</p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{format(new Date(log.createdAt), 'HH:mm:ss')}</p>
                </div>
              </div>

              <div className="space-y-3">
                 <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Tag className="w-3 h-3" /> Métadonnées de l'Action
                 </h4>
                 <div className="p-6 bg-card border rounded-3xl space-y-4 shadow-inner">
                    <div className="flex justify-between border-b pb-4 border-dashed">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">Action</span>
                       <span className="text-xs font-black text-foreground uppercase">{log.action}</span>
                    </div>
                    <div className="flex justify-between border-b pb-4 border-dashed">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">Entité visée</span>
                       <span className="text-xs font-black text-primary uppercase">{log.entity}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">ID Entité</span>
                       <span className="text-xs font-black text-foreground">#{log.entityId}</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Activity className="w-3 h-3" /> Nouvelles Valeurs / Payload
                 </h4>
                 <div className="bg-black/95 p-6 rounded-[2rem] border overflow-x-auto">
                    <pre className="text-xs font-mono text-green-400 leading-relaxed no-scrollbar opacity-90">
                       {log.newValues ? JSON.stringify(JSON.parse(log.newValues), null, 2) : 'N/A'}
                    </pre>
                 </div>
              </div>
            </div>

            <div className="p-6 bg-muted/30 border-t flex justify-end">
               <button 
                onClick={onClose}
                className="px-8 py-3 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all"
               >
                 Fermer l'inspecteur
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
