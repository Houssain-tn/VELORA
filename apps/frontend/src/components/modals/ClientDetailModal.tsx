import { X, Building2, Mail, Phone, MapPin, Globe, FileText, Users, Receipt, ShieldCheck } from 'lucide-react';
import { useCompany } from '@/hooks/useApi';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number | null;
}

export function ClientDetailModal({ isOpen, onClose, clientId }: ClientDetailModalProps) {
  const { data: client, isLoading } = useCompany(clientId);

  if (!isOpen || !clientId) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border-2 shadow-2xl rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center justify-between p-6 border-b bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">{isLoading ? 'Chargement...' : client?.name}</h2>
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {client?.city || 'Localisation non définie'}, {client?.country || ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-8">
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">
              Chargement du profil 360°...
            </div>
          ) : (
            <>
              {/* Infos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-muted/30 rounded-2xl p-4 border border-dashed flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                  <span className="font-bold text-sm truncate">{client?.email || '-'}</span>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-dashed flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</span>
                  <span className="font-bold text-sm truncate">{client?.phone || '-'}</span>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-dashed flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Matricule Fiscal</span>
                  <span className="font-bold text-sm truncate uppercase">{client?.mf || '-'}</span>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 border border-dashed flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1"><Globe className="w-3 h-3" /> Site Web</span>
                  <span className="font-bold text-sm truncate text-blue-500 hover:underline cursor-pointer">{client?.website || '-'}</span>
                </div>
              </div>

              {/* Grid 360 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Users / Comptes */}
                <div className="col-span-1 border rounded-3xl p-5 bg-card shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-primary">
                    <Users className="w-4 h-4" /> Comptes Utilisateurs ({client?.users?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                    {client?.users?.map((user: any) => (
                      <div key={user.id} className="p-3 bg-muted/20 rounded-2xl border border-dashed flex items-center justify-between">
                        <div>
                          <p className="font-black text-sm">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold">{user.email}</p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-[8px] uppercase tracking-widest font-black bg-blue-100 text-blue-700">
                          {user.role}
                        </span>
                      </div>
                    ))}
                    {(!client?.users || client.users.length === 0) && (
                      <div className="py-8 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">Aucun compte</div>
                    )}
                  </div>
                </div>

                {/* Contracts */}
                <div className="col-span-1 border rounded-3xl p-5 bg-card shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-emerald-600">
                    <ShieldCheck className="w-4 h-4" /> Contrats SLA ({client?.contracts?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                    {client?.contracts?.map((contract: any) => (
                      <div key={contract.id} className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-sm text-emerald-950">{contract.name}</span>
                          <span className="text-[9px] uppercase tracking-widest font-black text-emerald-600 border border-emerald-200 px-2 rounded-full">{contract.status}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700/60 font-bold uppercase">Réf: {contract.reference || 'N/A'}</span>
                      </div>
                    ))}
                    {(!client?.contracts || client.contracts.length === 0) && (
                      <div className="py-8 text-center text-emerald-600/50 text-xs font-bold uppercase tracking-widest opacity-50">Aucun contrat</div>
                    )}
                  </div>
                </div>

                {/* Invoices */}
                <div className="col-span-1 border rounded-3xl p-5 bg-card shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-orange-600">
                    <Receipt className="w-4 h-4" /> Factures ({client?.invoices?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                    {client?.invoices?.map((invoice: any) => (
                      <div key={invoice.id} className="p-3 bg-orange-50/50 rounded-2xl border border-orange-100 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-sm text-orange-950">{invoice.number}</span>
                          <span className="text-[9px] uppercase tracking-widest font-black text-orange-600 border border-orange-200 px-2 rounded-full">{invoice.status}</span>
                        </div>
                        <span className="text-[10px] text-orange-700/60 font-bold uppercase">TTC: {Number(invoice.totalTTC).toFixed(2)} DT</span>
                      </div>
                    ))}
                    {(!client?.invoices || client.invoices.length === 0) && (
                      <div className="py-8 text-center text-orange-600/50 text-xs font-bold uppercase tracking-widest opacity-50">Aucune facture</div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
