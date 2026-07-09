import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical, 
  Trash2, 
  Edit,
  Receipt,
  Download,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInvoices, useDeleteInvoice, useUpdateInvoice, useCompanies } from '@/hooks/useApi';
import { InvoiceModal } from '@/components/modals/InvoiceModal';
import { toast } from '@/components/ui/Toaster';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { generateInvoicePDF } from '@/lib/export';
import api from '@/lib/api';

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  BROUILLON: { label: 'Brouillon', icon: FileText, color: 'text-muted-foreground', bgColor: 'bg-muted/50 border-muted-foreground/20' },
  ENVOYE: { label: 'Envoyée', icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  PAYE: { label: 'Payée', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  EN_RETARD: { label: 'En Retard', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  ANNULE: { label: 'Annulée', icon: Trash2, color: 'text-slate-400', bgColor: 'bg-slate-50 border-slate-200' },
};

export function Invoices() {
  const { data: invoices, isLoading, error } = useInvoices();
  const { data: companies } = useCompanies();
  const deleteInvoice = useDeleteInvoice();
  const updateInvoice = useUpdateInvoice();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownloadPDF = async (invoiceId: number) => {
    try {
      setDownloadingId(invoiceId);
      // Fetch full invoice with items
      const { data: fullInvoice } = await api.get(`/invoices/${invoiceId}`);
      // Use the first company as the issuer (standard for this setup)
      const myCompany = companies?.[0];
      
      await generateInvoicePDF(fullInvoice, myCompany);
      toast.success('Document PDF généré');
    } catch (err) {
      console.error(err);
      toast.error('Échec de la génération PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success('Facture supprimée');
    } catch {
      toast.error('Échec de la suppression');
    }
  };

  const markAsPaid = async (invoice: any) => {
    try {
      await updateInvoice.mutateAsync({ id: invoice.id, data: { status: 'PAYE' } });
      toast.success('Facture marquée comme payée');
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const filteredInvoices = invoices?.filter((item: any) => 
    item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: invoices?.reduce((acc: number, cur: any) => acc + Number(cur.totalTTC), 0) || 0,
    paid: invoices?.filter((i: any) => i.status === 'PAYE').reduce((acc: number, cur: any) => acc + Number(cur.totalTTC), 0) || 0,
    pending: invoices?.filter((i: any) => i.status !== 'PAYE' && i.status !== 'ANNULE').reduce((acc: number, cur: any) => acc + Number(cur.totalTTC), 0) || 0,
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">Initialisation du Facturier...</div>;
  if (error) return <div className="p-8 text-center text-destructive bg-destructive/5 rounded-xl border border-destructive/20 m-6 font-bold">Erreur de connexion au serveur financier.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Receipt className="w-6 h-6" />
             </div>
             Facturation
          </h2>
          <p className="text-muted-foreground font-medium italic mt-1">Gestion des factures, règlements et suivi de trésorerie.</p>
        </div>
        <button 
          onClick={() => { setSelectedInvoice(null); setIsModalOpen(true); }}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-2xl shadow-primary/20 hover:scale-105 transition-all active:scale-95 group"
        >
          <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform">
             <Plus className="w-4 h-4" />
          </div>
          Générer Facture
        </button>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-3xl p-6 flex items-center gap-6 shadow-sm group hover:border-primary/30 transition-all cursor-default">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Facturé (TTC)</p>
            <p className="text-3xl font-black tracking-tighter">{stats.total.toFixed(2)} <span className="text-sm font-medium text-muted-foreground uppercase ml-1">DT</span></p>
          </div>
        </div>
        <div className="bg-card border rounded-3xl p-6 flex items-center gap-6 shadow-sm group hover:border-green-300 transition-all cursor-default">
          <div className="p-4 bg-green-100 rounded-2xl text-green-600 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Encaissements Payés</p>
            <p className="text-3xl font-black tracking-tighter text-green-600">{stats.paid.toFixed(2)} <span className="text-sm font-medium text-muted-foreground uppercase ml-1">DT</span></p>
          </div>
        </div>
        <div className="bg-card border rounded-3xl p-6 flex items-center gap-6 shadow-sm group hover:border-orange-300 transition-all cursor-default">
          <div className="p-4 bg-orange-100 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">En Attente / Retard</p>
            <p className="text-3xl font-black tracking-tighter text-orange-500">{stats.pending.toFixed(2)} <span className="text-sm font-medium text-muted-foreground uppercase ml-1">DT</span></p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-dashed hover:border-primary/30 transition-colors">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            placeholder="Rechercher par Numéro de Facture ou Nom de Client..."
            className="w-full bg-transparent pl-12 pr-4 py-2.5 text-sm font-bold outline-none placeholder:font-medium placeholder:italic"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-2.5 hover:bg-muted rounded-xl transition-colors text-muted-foreground">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Invoices Table */}
      <div className="border rounded-3xl bg-card shadow-2xl shadow-black/5 border-border/50">
        <div className="overflow-x-auto pb-48 -mb-48">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b-2 tracking-widest font-black">
              <tr>
                <th className="px-8 py-5">N° Facture</th>
                <th className="px-6 py-5">Client</th>
                <th className="px-6 py-5">Date d'émission</th>
                <th className="px-6 py-5 text-right">Montant HT</th>
                <th className="px-6 py-5 text-right">Total TTC</th>
                <th className="px-6 py-5 text-center">Statut</th>
                <th className="px-8 py-5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y border-t-0">
              {filteredInvoices?.map((item: any) => {
                const config = statusConfig[item.status] || statusConfig.BROUILLON;
                return (
                  <tr key={item.id} className="last:border-0 hover:bg-muted/10 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-muted rounded-xl text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                            <FileText className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="font-black text-foreground uppercase tracking-tighter text-sm">{item.number}</p>
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tight">ID: {item.id}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-foreground font-bold">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{item.client?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="font-bold text-xs">{format(new Date(item.date), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-xs text-muted-foreground">
                      {Number(item.totalHT).toFixed(2)} <span className="text-[9px] lowercase italic">dt</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-black text-lg text-foreground tracking-tighter">
                        {Number(item.totalTTC).toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground ml-1">DT</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 inline-flex items-center gap-2 shadow-sm transition-transform group-hover:scale-105", 
                        config.color, 
                        config.bgColor
                      )}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {config.label}
                      </span>
                    </td>
                    <td className={cn("px-8 py-5 text-right", activeDropdown === item.id && "relative z-50")}>
                       <div className="relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                            className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-all border border-transparent hover:border-border active:scale-90"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {activeDropdown === item.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                              <div className="absolute right-0 mt-2 w-56 bg-card border-2 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                                <button 
                                  onClick={() => { setSelectedInvoice(item); setIsModalOpen(true); setActiveDropdown(null); }}
                                  className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors flex items-center gap-3 border-b"
                                >
                                  <Edit className="w-4 h-4 text-primary" /> Modifier Facture
                                </button>
                                <button 
                                  onClick={() => { handleDownloadPDF(item.id); setActiveDropdown(null); }}
                                  disabled={downloadingId === item.id}
                                  className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors flex items-center gap-3 border-b disabled:opacity-50"
                                >
                                  <Download className={cn("w-4 h-4 text-blue-500", downloadingId === item.id && "animate-bounce")} /> 
                                  {downloadingId === item.id ? "Génération..." : "Télécharger PDF"}
                                </button>
                                {item.status !== 'PAYE' && (
                                  <button 
                                    onClick={() => { markAsPaid(item); setActiveDropdown(null); }}
                                    className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-50 transition-colors flex items-center gap-3 border-b"
                                  >
                                    <CreditCard className="w-4 h-4" /> Marquer Payée
                                  </button>
                                )}
                                <button 
                                  onClick={() => { handleDelete(item.id); setActiveDropdown(null); }}
                                  className="w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                                >
                                  <Trash2 className="w-4 h-4" /> Supprimer
                                </button>
                              </div>
                            </>
                          )}
                       </div>
                     </td>
                  </tr>
                );
              })}
              {(!filteredInvoices || filteredInvoices.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6 animate-bounce">
                          <Receipt className="w-12 h-12 text-muted-foreground/30" />
                       </div>
                       <p className="font-black uppercase tracking-tighter text-2xl text-muted-foreground">Aucune Facture au Compteur</p>
                       <p className="text-xs font-bold mt-2 uppercase tracking-[0.2em] text-muted-foreground/50">Générez votre première facture pour commencer le suivi.</p>
                       <button 
                        onClick={() => setIsModalOpen(true)}
                        className="mt-8 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest animate-pulse hover:animate-none transition-all"
                       >
                         Nouveau Document
                       </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InvoiceModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedInvoice(null); }} 
        invoice={selectedInvoice}
      />
    </div>
  );
}
