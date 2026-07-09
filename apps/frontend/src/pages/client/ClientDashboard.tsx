import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Receipt, Wrench, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ClientDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Fetch client specific summary
  const { data: summary, isLoading } = useQuery({
    queryKey: ['client-summary', user?.companyId],
    queryFn: async () => {
      const [invoices, interventions] = await Promise.all([
        api.get('/invoices', { params: { clientId: user?.companyId } }),
        api.get('/interventions', { params: { companyId: user?.companyId } })
      ]);
      
      const pendingInvoices = invoices.data.filter((i: any) => i.status !== 'PAYEE');
      const activeTickets = interventions.data.filter((i: any) => i.status !== 'TERMINE' && i.status !== 'ANNULE');
      
      return {
        pendingInvoicesCount: pendingInvoices.length,
        totalUnpaid: pendingInvoices.reduce((acc: number, curr: any) => acc + Number(curr.totalTTC), 0),
        activeTicketsCount: activeTickets.length,
        recentTickets: activeTickets.slice(0, 3)
      };
    },
    enabled: !!user?.companyId
  });

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse font-black uppercase tracking-widest text-xs">Chargement de votre espace...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter">Bienvenue, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground font-medium mt-1">Voici le résumé de votre activité avec nous.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Invoices Widget */}
        <div className="bg-card border-2 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-orange-600">{summary?.pendingInvoicesCount}</span>
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Factures Impayées</h3>
            <p className="text-2xl font-black mt-1">{summary?.totalUnpaid.toFixed(2)} DT</p>
          </div>
          <button 
            onClick={() => navigate('/client/invoices')}
            className="mt-6 w-full py-3 bg-muted/50 hover:bg-muted rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            Voir les factures <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tickets Widget */}
        <div className="bg-card border-2 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-blue-600">{summary?.activeTicketsCount}</span>
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Tickets d'Assistance</h3>
            <p className="text-sm font-bold mt-1 text-muted-foreground">Demandes en cours de traitement</p>
          </div>
          <button 
            onClick={() => navigate('/client/tickets')}
            className="mt-6 w-full py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            Nouveau Ticket <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* SLA Contracts */}
        <div className="bg-card border-2 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Contrats de Service</h3>
            <p className="text-sm font-bold mt-1 text-emerald-600 flex items-center gap-2"><Activity className="w-4 h-4" /> SLA Actif</p>
          </div>
          <button 
            className="mt-6 w-full py-3 bg-muted/50 hover:bg-muted rounded-xl text-xs font-black uppercase tracking-widest transition-colors cursor-not-allowed opacity-50"
          >
            Contrats Bientôt
          </button>
        </div>
      </div>

      {/* Recent Tickets List */}
      <div className="bg-card border-2 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b bg-muted/10">
          <h2 className="font-black tracking-tight text-lg">Vos demandes récentes</h2>
        </div>
        <div className="divide-y">
          {summary?.recentTickets?.map((ticket: any) => (
            <div key={ticket.id} className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors">
              <div>
                <p className="font-black text-foreground">{ticket.title}</p>
                <p className="text-xs font-bold text-muted-foreground mt-1">{ticket.reference}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 border border-blue-200">
                {ticket.status}
              </span>
            </div>
          ))}
          {(!summary?.recentTickets || summary.recentTickets.length === 0) && (
            <div className="p-12 text-center">
              <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold text-sm">Aucune demande en cours</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
