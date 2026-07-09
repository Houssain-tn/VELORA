import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Wrench, Plus, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

export function ClientTickets() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MOYENNE' });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['client-tickets', user?.companyId],
    queryFn: async () => {
      const { data } = await api.get('/interventions', { params: { companyId: user?.companyId } });
      return data;
    },
    enabled: !!user?.companyId
  });

  const createTicket = useMutation({
    mutationFn: async (data: any) => {
      // Create intervention requesting support
      return api.post('/interventions', {
        ...data,
        companyId: user?.companyId,
        type: 'DEPANNAGE',
        status: 'NOUVEAU',
        requesterId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-tickets'] });
      setIsModalOpen(false);
      setNewTicket({ title: '', description: '', priority: 'MOYENNE' });
      toast.success('Votre demande a été envoyée avec succès.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket.mutate(newTicket);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            Assistance technique
          </h1>
          <p className="text-muted-foreground font-medium mt-2">Déclarez un incident ou suivez vos demandes en cours.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-600/20 hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Demande
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && <div className="col-span-full py-12 text-center text-muted-foreground animate-pulse font-black uppercase text-xs">Chargement...</div>}
        
        {tickets?.map((ticket: any) => (
          <div key={ticket.id} className="bg-card border-2 rounded-3xl p-6 shadow-sm hover:border-blue-500/30 transition-colors flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-muted text-muted-foreground">
                {ticket.reference || `TKT-${ticket.id}`}
              </span>
              <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-current text-blue-600 bg-blue-50">
                {ticket.status}
              </span>
            </div>
            
            <h3 className="font-black text-lg mb-2 leading-tight">{ticket.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-6">{ticket.description || 'Aucune description fournie.'}</p>
            
            <div className="mt-auto pt-4 border-t flex justify-between items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
              </span>
              <button className="p-2 bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg transition-colors">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {(!tickets || tickets.length === 0) && !isLoading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[3rem] bg-card/50">
            <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-black text-lg">Aucune demande</p>
            <p className="text-muted-foreground font-bold text-sm mt-1">Vous n'avez pas de ticket ouvert.</p>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-2">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h3 className="font-black text-lg uppercase tracking-tight">Ouvrir un ticket</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Titre du problème *</label>
                <input 
                  required
                  value={newTicket.title}
                  onChange={e => setNewTicket({...newTicket, title: e.target.value})}
                  className="w-full px-4 py-3 bg-background border rounded-xl font-medium focus:border-blue-500 focus:ring-2 ring-blue-500/20 outline-none transition-all"
                  placeholder="Ex: Panne de connexion serveur"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Description détaillée</label>
                <textarea 
                  rows={4}
                  value={newTicket.description}
                  onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                  className="w-full px-4 py-3 bg-background border rounded-xl font-medium focus:border-blue-500 focus:ring-2 ring-blue-500/20 outline-none transition-all resize-none"
                  placeholder="Veuillez décrire le problème rencontré..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border rounded-xl font-black text-xs uppercase tracking-widest hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={createTicket.isPending}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                  disabled={createTicket.isPending}
                >
                  {createTicket.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
