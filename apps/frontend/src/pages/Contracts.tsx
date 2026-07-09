import { useState } from 'react';
import { Search, Filter, Plus, FileText, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContracts } from '@/hooks/useApi';
import { AddContractModal } from '@/components/modals/AddContractModal';
import { ContractDetailModal } from '@/components/modals/ContractDetailModal';
import { usePermissions } from '@/hooks/usePermissions';

const contractStatusConfig: Record<string, { label: string; color: string }> = {
  ACTIF:   { label: 'Actif',   color: 'bg-green-100 text-green-700' },
  EXPIRE:  { label: 'Expiré',  color: 'bg-red-100 text-red-700' },
  SUSPENDU:{ label: 'Suspendu',color: 'bg-orange-100 text-orange-700' },
};

export function Contracts() {
  const { data: contracts, isLoading, error } = useContracts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const { canCreateContract } = usePermissions();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Chargement des contrats...</div>;
  if (error) return <div className="p-8 text-center text-destructive">Erreur lors de la récupération des contrats.</div>;

  const filteredContracts = contracts?.filter((contract: any) => 
    contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contrats & SLA</h2>
          <p className="text-muted-foreground">Gérez les engagements de service et les échéances de vos clients.</p>
        </div>
        {canCreateContract && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nouveau Contrat
          </button>
        )}
      </div>

      <AddContractModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <ContractDetailModal 
        isOpen={!!selectedContract} 
        onClose={() => setSelectedContract(null)} 
        contract={selectedContract} 
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher un contrat..."
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors pl-9 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium hover:bg-muted transition-colors">
          <Filter className="w-4 h-4" /> Filtres
        </button>
      </div>

      <div className="border rounded-lg bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-balance">Référence & Nom</th>
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">SLA (GTI)</th>
                <th className="px-6 py-3 font-medium">Consommation</th>
                <th className="px-6 py-3 font-medium">Fin du Contrat</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts?.map((contract: any) => {
                const consumptionPercent = contract.maxHours > 0 ? Math.min(100, (contract.usedHours / contract.maxHours) * 100) : 0;
                const isOverLimit = consumptionPercent >= 100;
                const isWarning = consumptionPercent > 80;

                return (
                  <tr key={contract.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded text-primary">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            {contract.reference || 'N/A'}
                            {isOverLimit && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Limite dépassée" />}
                          </p>
                          <p className="text-xs text-muted-foreground leading-tight text-balance">{contract.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-muted-foreground">{contract.client?.name || 'Inconnu'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{contract.slaHours}h</td>
                    <td className="px-6 py-4 min-w-[150px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                          <span className={cn(isOverLimit ? "text-red-600" : isWarning ? "text-amber-600" : "text-muted-foreground")}>
                            {contract.usedHours?.toFixed(1) || 0}h / {contract.maxHours || 0}h
                          </span>
                          <span>{Math.round(consumptionPercent)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              isOverLimit ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-primary"
                            )}
                            style={{ width: `${consumptionPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" />
                      {new Date(contract.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", 
                      contractStatusConfig[contract.status]?.color || 'bg-muted text-muted-foreground'
                    )}>
                      {contractStatusConfig[contract.status]?.label || contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedContract(contract)}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
