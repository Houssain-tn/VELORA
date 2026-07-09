import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Monitor, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  MoreVertical, 
  Trash2, 
  Edit,
  QrCode,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEquipment, useDeleteEquipment } from '@/hooks/useApi';
import { EquipmentModal } from '@/components/modals/EquipmentModal';
import { QRScannerModal } from '@/components/modals/QRScannerModal';
import { toast } from '@/components/ui/Toaster';

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  OPERATIONNEL: { label: 'Opérationnel', icon: ShieldCheck, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  EN_MAINTENANCE: { label: 'Maintenance', icon: History, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  HORS_SERVICE: { label: 'Hors Service', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  EN_ATTENTE_PIECE: { label: 'Attente Pièce', icon: History, color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
};

export function Equipment() {
  const navigate = useNavigate();
  const { data: equipment, isLoading, error } = useEquipment();
  const deleteEquipment = useDeleteEquipment();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const handleScan = (decodedText: string) => {
    // Try to find the equipment by serial or QR reference
    const found = equipment?.find((e: any) => e.serialNumber === decodedText || e.qrCode === decodedText);
    if (found) {
        navigate(`/equipment/${found.id}`);
        setIsScannerOpen(false);
        toast.success(`Équipement identifié : ${found.name}`);
    } else {
        toast.error(`Aucun équipement trouvé pour: ${decodedText}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cet équipement du parc ?')) return;
    try {
      await deleteEquipment.mutateAsync(id);
      toast.success('Équipement supprimé');
    } catch {
      toast.error('Échec de la suppression');
    }
  };

  const filteredEquipment = equipment?.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.site?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: equipment?.length || 0,
    operational: equipment?.filter((e: any) => e.status === 'OPERATIONNEL').length || 0,
    down: equipment?.filter((e: any) => e.status === 'HORS_SERVICE').length || 0,
    maintenance: equipment?.filter((e: any) => e.status === 'EN_MAINTENANCE' || e.status === 'EN_ATTENTE_PIECE').length || 0,
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">Initialisation du Parc...</div>;
  if (error) return <div className="p-8 text-center text-destructive bg-destructive/5 rounded-xl border border-destructive/20 m-6 font-bold">Erreur de connexion au serveur d'inventaire.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Parc Équipements</h2>
          <p className="text-muted-foreground font-medium italic">Gestion centralisée des actifs technologiques et QR Asset Tracking.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
            onClick={() => setIsScannerOpen(true)}
            className="bg-muted text-foreground border-2 border-primary/20 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-muted/80 transition-all active:scale-95"
            >
            <QrCode className="w-4 h-4 text-primary" /> Scanner QR
            </button>
            <button 
            onClick={() => { setSelectedEquipment(null); setIsModalOpen(true); }}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
            >
            <Plus className="w-4 h-4" /> Nouvel Actif
            </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground">Total Actifs</p>
            <p className="text-2xl font-black">{stats.total}</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-100 rounded-xl text-green-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground">Opérationnels</p>
            <p className="text-2xl font-black">{stats.operational}</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground">En Maintenance</p>
            <p className="text-2xl font-black">{stats.maintenance}</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-100 rounded-xl text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground">Hors Service</p>
            <p className="text-2xl font-black text-red-600">{stats.down}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-dashed">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            placeholder="Rechercher par Nom, S/N, Marque ou Site..."
            className="w-full bg-transparent pl-10 pr-4 py-2 text-sm font-bold outline-none placeholder:font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-2 hover:bg-muted rounded-xl transition-colors">
          <Filter className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="border rounded-2xl bg-card shadow-sm border-border/50 overflow-visible">
        <div className="hidden md:block overflow-visible">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b tracking-widest font-black">
              <tr>
                <th className="px-6 py-4 rounded-tl-2xl">Actif / Équipement</th>
                <th className="px-6 py-4">Site / Localisation</th>
                <th className="px-6 py-4 text-center">État</th>
                <th className="px-6 py-4">S/N</th>
                <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t-0">
              {filteredEquipment?.map((item: any) => {
                const config = statusConfig[item.status] || statusConfig.OPERATIONNEL;
                const StatusIcon = config.icon;
                return (
                  <tr 
                    key={item.id} 
                    className="last:border-0 hover:bg-muted/10 transition-colors group cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      navigate(`/equipment/${item.id}`);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                           <Monitor className="w-4 h-4" />
                         </div>
                         <div className="min-w-0">
                           <p className="font-black text-foreground truncate uppercase text-xs tracking-tight">{item.name}</p>
                           <p className="text-[10px] text-muted-foreground font-bold leading-none mt-1 uppercase">{item.brand} {item.model}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="font-bold text-xs">{item.site?.name || '---'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5", config.color, config.bgColor)}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.serialNumber}</td>
                    <td className={cn("px-6 py-4 text-right", activeDropdown === item.id && "relative z-50")}>
                       <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button 
                            onClick={() => { setSelectedEquipment(item); setIsModalOpen(true); }}
                            className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
                            title="Modifier l'actif"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <div className="relative">
                             <button 
                               onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                               className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors border border-transparent hover:border-border"
                             >
                               <MoreVertical className="w-5 h-5" />
                             </button>
                             {activeDropdown === item.id && (
                               <>
                                 <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                                 <div className="absolute right-0 mt-2 w-48 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
                                   <button 
                                     onClick={() => { navigate(`/equipment/${item.id}`); setActiveDropdown(null); }}
                                     className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors flex items-center gap-2 border-b"
                                   >
                                     <QrCode className="w-3.5 h-3.5 text-primary" /> Voir Digital Twin
                                   </button>
                                   <button 
                                     className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors flex items-center gap-2 border-b"
                                   >
                                     <History className="w-3.5 h-3.5" /> Maintenance
                                   </button>
                                   <button 
                                     onClick={() => handleDelete(item.id)}
                                     className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                   >
                                     <Trash2 className="w-3.5 h-3.5" /> Réformer Actif
                                   </button>
                                 </div>
                               </>
                             )}
                          </div>
                        </div>
                     </td>
                  </tr>
                );
              })}
              {(!filteredEquipment || filteredEquipment.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                       <Monitor className="w-12 h-12 mb-4" />
                       <p className="font-black uppercase tracking-tighter text-xl">Aucun équipement enregistré</p>
                       <p className="text-xs font-bold mt-1 uppercase tracking-widest">Commencez par ajouter un actif au parc digital.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Equipment Cards */}
        <div className="md:hidden divide-y divide-border/30">
          {filteredEquipment?.map((item: any) => {
            const config = statusConfig[item.status] || statusConfig.OPERATIONNEL;
            const StatusIcon = config.icon;
            return (
              <div 
                key={item.id} 
                className="p-4 space-y-4 hover:bg-muted/10 active:bg-muted/20 transition-colors"
                onClick={() => navigate(`/equipment/${item.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs uppercase tracking-tight">{item.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">{item.brand} {item.model}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedEquipment(item); setIsModalOpen(true); }}
                    className="p-2 text-primary bg-primary/5 rounded-full"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-black uppercase tracking-tighter text-[8px]">Site / Localisation</p>
                    <div className="flex items-center gap-1 font-bold">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">{item.site?.name || 'Non assigné'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-black uppercase tracking-tighter text-[8px]">S/N (Série)</p>
                    <div className="flex items-center gap-1 font-bold font-mono tracking-widest uppercase">
                      <span className="truncate">{item.serialNumber || '---'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-1.5", config.color, config.bgColor)}>
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/equipment/${item.id}`); }}
                      className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1"
                    >
                      Détails <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {(!filteredEquipment || filteredEquipment.length === 0) && (
            <div className="py-20 text-center px-4">
               <Monitor className="w-12 h-12 mb-4 mx-auto opacity-10" />
               <p className="font-black uppercase tracking-tighter text-lg opacity-40">Aucun actif trouvé</p>
            </div>
          )}
        </div>
      </div>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />

      <EquipmentModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedEquipment(null); }} 
        equipment={selectedEquipment}
      />
    </div>
  );
}
