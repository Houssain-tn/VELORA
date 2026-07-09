import { useState } from 'react';
import { 
  Building2, Plus, Search, MapPin, Mail, Phone, FileText, 
  MoreVertical, Edit, Trash2, Eye 
} from 'lucide-react';
import { useCompanies, useDeleteCompany } from '@/hooks/useApi';
import { ClientModal } from '@/components/modals/ClientModal';
import { ClientDetailModal } from '@/components/modals/ClientDetailModal';
import { toast } from '@/components/ui/Toaster';

export function Clients() {
  const { data: clients, isLoading, error } = useCompanies();
  const deleteCompany = useDeleteCompany();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const filteredClients = clients?.filter((c: any) => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce client ? Toutes ses données liées pourraient être impactées.')) return;
    try {
      await deleteCompany.mutateAsync(id);
      toast.success('Client supprimé');
    } catch {
      toast.error('Échec de la suppression');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">Chargement du CRM...</div>;
  if (error) return <div className="p-8 text-center text-destructive bg-destructive/5 rounded-xl border border-destructive/20 m-6 font-bold">Erreur de chargement.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Building2 className="w-6 h-6" />
             </div>
             CRM & Clients
          </h2>
          <p className="text-muted-foreground font-medium italic mt-1">Gérez votre portefeuille clients et consultez leur fiche 360°.</p>
        </div>
        <button 
          onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-2xl shadow-primary/20 hover:scale-105 transition-all active:scale-95 group"
        >
          <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform">
             <Plus className="w-4 h-4" />
          </div>
          Nouveau Client
        </button>
      </div>

      <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-dashed hover:border-primary/30 transition-colors">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            placeholder="Rechercher par raison sociale, email..."
            className="w-full bg-transparent pl-12 pr-4 py-2.5 text-sm font-bold outline-none placeholder:font-medium placeholder:italic"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients?.map((client: any) => (
          <div key={client.id} className="bg-card border-2 border-border/50 rounded-3xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-xl group flex flex-col h-full">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4 relative">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 border flex items-center justify-center text-primary font-black text-xl uppercase shadow-sm">
                    {client.name?.charAt(0) || <Building2 className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-lg text-foreground truncate max-w-[180px] leading-tight" title={client.name}>{client.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {client.city || 'Ville non spécifiée'}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === client.id ? null : client.id)}
                    className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-all active:scale-90"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {activeDropdown === client.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                      <div className="absolute right-0 mt-2 w-48 bg-card border-2 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                        <button 
                          onClick={() => { setSelectedClient(client); setIsModalOpen(true); setActiveDropdown(null); }}
                          className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors flex items-center gap-3 border-b"
                        >
                          <Edit className="w-4 h-4 text-primary" /> Modifier Fiche
                        </button>
                        <button 
                          onClick={() => { handleDelete(client.id); setActiveDropdown(null); }}
                          className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                        >
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-6">
                {client.email && (
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                    <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0"><Mail className="w-3 h-3" /></div>
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                    <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0"><Phone className="w-3 h-3" /></div>
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.mf && (
                  <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                    <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0"><FileText className="w-3 h-3" /></div>
                    <span className="uppercase">MF: {client.mf}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/10 p-4 border-t flex justify-between items-center mt-auto">
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Comptes</p>
                  <p className="font-black text-sm">{client._count?.users || 0}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Factures</p>
                  <p className="font-black text-sm">{client._count?.invoices || 0}</p>
                </div>
              </div>

              <button 
                onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }}
                className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                <Eye className="w-3.5 h-3.5" /> Profil 360°
              </button>
            </div>
          </div>
        ))}
      </div>

      {(!filteredClients || filteredClients.length === 0) && (
        <div className="py-32 text-center flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] bg-card/20">
          <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6">
            <Building2 className="w-12 h-12 text-muted-foreground/30" />
          </div>
          <p className="font-black uppercase tracking-tighter text-2xl text-muted-foreground">Aucun Client Trouvé</p>
          <p className="text-xs font-bold mt-2 uppercase tracking-[0.2em] text-muted-foreground/50">Ajoutez votre premier client pour alimenter le CRM.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-8 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest animate-pulse hover:animate-none transition-all"
          >
            Créer un Client
          </button>
        </div>
      )}

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedClient(null); }} 
        client={selectedClient} 
      />
      <ClientDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => { setIsDetailModalOpen(false); setSelectedClient(null); }} 
        clientId={selectedClient?.id} 
      />
    </div>
  );
}
