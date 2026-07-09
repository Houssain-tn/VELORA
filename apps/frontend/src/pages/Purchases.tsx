import { useState } from 'react';
import {
  Plus,
  Search,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Briefcase,
  MapPin,
  Eye,
  Activity,
} from 'lucide-react';
import { usePurchaseRequests } from '@/hooks/useApi';
import { PurchaseRequestModal } from '@/components/modals/PurchaseRequestModal';
import { PurchaseValidationModal } from '@/components/modals/PurchaseValidationModal';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';

export function Purchases() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const { data: requests, isLoading, error } = usePurchaseRequests();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [editingRequest, setEditingRequest] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse font-medium">
        Chargement des demandes d'achat en cours...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive bg-destructive/5 rounded-lg border border-destructive/20 m-6">
        Erreur lors du chargement des demandes d'achat.
      </div>
    );
  }

  // Filter logic
  const filteredRequests = requests?.filter((req: any) => {
    const matchesSearch = 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedBy?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(req.id).includes(searchTerm);
      
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || req.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate Metrics for widgets
  const totalCost = filteredRequests?.reduce((acc: number, curr: any) => acc + (curr.estimatedCost ? Number(curr.estimatedCost) : 0), 0) || 0;
  const completedRequests = filteredRequests?.filter((r: any) => r.status === 'TERMINEE' && r.actualCost) || [];
  const totalActualCost = completedRequests.reduce((acc: number, curr: any) => acc + Number(curr.actualCost), 0) || 0;
  const totalSavings = completedRequests.reduce((acc: number, curr: any) => acc + (Number(curr.estimatedCost || 0) - Number(curr.actualCost)), 0) || 0;
  const pendingCommercial = requests?.filter((r: any) => r.status === 'SOUMISE').length || 0;
  const pendingDirector = requests?.filter((r: any) => r.status === 'VALIDEE_COMMERCIAL').length || 0;
  const processingPurchases = requests?.filter((r: any) => r.status === 'EN_COURS_ACHAT').length || 0;
  const completedCount = requests?.filter((r: any) => r.status === 'TERMINEE').length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            Demandes d'Achat (Procurement)
          </h2>
          <p className="text-muted-foreground text-sm">
            Gérez vos demandes de matériel, validations commerciales, signatures de direction et suivi achats.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Nouvelle Demande
          </button>
        )}
      </div>

      {/* Premium Bento Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Widget 1: Budget & Suivi Réel */}
        <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-60">Coût Estimé / Réel</span>
              <p className="text-xl font-black text-foreground">
                {totalCost.toLocaleString()} DT <span className="text-[10px] text-muted-foreground font-semibold">est.</span>
              </p>
              {totalActualCost > 0 && (
                <p className="text-xs font-bold text-emerald-600 leading-none mt-1">
                  {totalActualCost.toLocaleString()} DT <span className="text-[9px] text-emerald-600/70">réel</span>
                </p>
              )}
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
              <DollarSign className="w-5 h-5 shrink-0" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            {totalSavings >= 0 ? (
              <span>Économies: +{totalSavings.toLocaleString()} DT</span>
            ) : (
              <span className="text-red-500">Dépassement: {totalSavings.toLocaleString()} DT</span>
            )}
          </div>
        </div>

        {/* Widget 2: Attente Commerciale */}
        <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-60">Attente Commerciale</span>
              <p className="text-2xl font-black text-foreground">{pendingCommercial}</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-600">
              <Clock className="w-5 h-5 shrink-0 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-orange-600">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>À valider par la commerciale</span>
          </div>
        </div>

        {/* Widget 3: Attente Direction */}
        <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-60">Attente Directeur</span>
              <p className="text-2xl font-black text-foreground">{pendingDirector}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600">
              <ShoppingCart className="w-5 h-5 shrink-0" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-indigo-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Prêt pour signature direction</span>
          </div>
        </div>

        {/* Widget 4: En Cours d'Achat */}
        <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground opacity-60">En Cours d'Achat</span>
              <p className="text-2xl font-black text-foreground">{processingPurchases}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-600">
              <ShoppingCart className="w-5 h-5 shrink-0" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-purple-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Articles commandés (Livrés: {completedCount})</span>
          </div>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 w-full max-w-md group">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            placeholder="Rechercher par ID, article, collaborateur..."
            className="flex h-10 w-full rounded-xl border border-input bg-background/50 px-3 pl-10 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Multi-Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <select
            className="flex h-10 rounded-xl border border-input bg-background/50 px-3 py-2 text-xs font-bold transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="SOUMISE">Soumise</option>
            <option value="VALIDEE_COMMERCIAL">Validée Commercial</option>
            <option value="VALIDEE_DIRECTEUR">Validée Directeur</option>
            <option value="EN_COURS_ACHAT">En cours d'Achat</option>
            <option value="TERMINEE">Terminée / Livrée</option>
            <option value="REJETEE">Rejetée</option>
          </select>

          {/* Priority filter */}
          <select
            className="flex h-10 rounded-xl border border-input bg-background/50 px-3 py-2 text-xs font-bold transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">Toutes les priorités</option>
            <option value="FAIBLE">Basse</option>
            <option value="NORMALE">Normale</option>
            <option value="HAUTE">Haute</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

      </div>

      {/* Main Glass Table */}
      <div className="border border-border/50 rounded-2xl bg-card/40 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-muted/40 border-b tracking-wider font-black">
              <tr>
                <th className="px-6 py-4">ID / Réf</th>
                <th className="px-6 py-4">Demandeur</th>
                <th className="px-6 py-4">Article / Description</th>
                <th className="px-6 py-4">Coût estimé</th>
                <th className="px-6 py-4">Coût réel</th>
                <th className="px-6 py-4">Priorité</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Date Création</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredRequests && filteredRequests.length > 0 ? (
                filteredRequests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-muted/20 transition-all group">
                    <td className="px-6 py-4 font-black text-primary">
                      #{req.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                          {req.requestedBy?.name?.[0].toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-foreground/90 leading-none">{req.requestedBy?.name}</p>
                          <span className="text-[9px] font-semibold text-muted-foreground uppercase">{req.requestedBy?.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground leading-snug">{req.title}</span>
                        {req.description && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                            {req.description}
                          </span>
                        )}
                        <div className="flex gap-1.5 mt-1">
                          {req.project && (
                            <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-0.5">
                              <Briefcase className="w-2.5 h-2.5" /> {req.project.name}
                            </span>
                          )}
                          {req.site && (
                            <span className="text-[8px] font-black uppercase text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" /> {req.site.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-foreground/90">
                      {req.estimatedCost ? `${Number(req.estimatedCost).toLocaleString()} DT` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {req.actualCost ? (
                        <div className="flex flex-col">
                          <span className="font-black text-emerald-600">
                            {Number(req.actualCost).toLocaleString()} DT
                          </span>
                          {req.estimatedCost && (
                            <span className={cn("text-[9px] font-bold mt-0.5", 
                              Number(req.actualCost) <= Number(req.estimatedCost)
                                ? "text-emerald-500"
                                : "text-red-500"
                            )}>
                              {Number(req.actualCost) <= Number(req.estimatedCost) ? '↓' : '↑'}
                              {Math.abs(Number(req.actualCost) - Number(req.estimatedCost)).toLocaleString()} DT
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", 
                        req.priority === 'URGENTE' ? 'bg-red-50 text-red-600 border-red-100' :
                        req.priority === 'HAUTE' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        req.priority === 'NORMALE' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-gray-50 text-gray-600 border-gray-100'
                      )}>
                        {req.priority || 'NORMALE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit border", 
                        req.status === 'SOUMISE' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        req.status === 'VALIDEE_COMMERCIAL' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        req.status === 'VALIDEE_DIRECTEUR' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        req.status === 'EN_COURS_ACHAT' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        req.status === 'TERMINEE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      )}>
                        {req.status === 'SOUMISE' && <Clock className="w-3.5 h-3.5" />}
                        {req.status === 'VALIDEE_COMMERCIAL' && <Clock className="w-3.5 h-3.5" />}
                        {req.status === 'VALIDEE_DIRECTEUR' && <ShoppingCart className="w-3.5 h-3.5" />}
                        {req.status === 'EN_COURS_ACHAT' && <Activity className="w-3.5 h-3.5 animate-pulse" />}
                        {req.status === 'TERMINEE' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {req.status === 'REJETEE' && <XCircle className="w-3.5 h-3.5" />}
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="p-1.5 px-3 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-wider ml-auto shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspecter
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground font-semibold">
                    Aucune demande d'achat enregistrée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <PurchaseRequestModal
        isOpen={isRequestModalOpen || !!editingRequest}
        onClose={() => {
          setIsRequestModalOpen(false);
          setEditingRequest(null);
        }}
        request={editingRequest}
      />

      <PurchaseValidationModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onEdit={(req) => {
          setSelectedRequest(null);
          setEditingRequest(req);
        }}
      />

    </div>
  );
}
