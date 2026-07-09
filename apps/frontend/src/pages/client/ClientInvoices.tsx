import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { FileText, Download, Receipt, CheckCircle2, AlertCircle } from 'lucide-react';

export function ClientInvoices() {
  const { user } = useAuthStore();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['client-invoices', user?.companyId],
    queryFn: async () => {
      const { data } = await api.get('/invoices', { params: { clientId: user?.companyId } });
      return data;
    },
    enabled: !!user?.companyId
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse font-black uppercase tracking-widest text-xs">Chargement des factures...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          Vos Factures
        </h1>
        <p className="text-muted-foreground font-medium mt-2">Consultez l'historique de votre facturation et téléchargez vos documents.</p>
      </div>

      <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-xs uppercase font-black tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Numéro</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Montant TTC</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium">
              {invoices?.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-black">{invoice.number}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(invoice.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 font-black">{Number(invoice.totalTTC).toFixed(2)} DT</td>
                  <td className="px-6 py-4">
                    {invoice.status === 'PAYEE' ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Payée
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-2.5 py-1 rounded-full w-fit">
                        <AlertCircle className="w-3 h-3" /> {invoice.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
              {(!invoices || invoices.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-bold text-sm">Aucune facture trouvée.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
