import { useState } from 'react';
import { Layers, Plus, Trash2, Loader2 } from 'lucide-react';
import { useTenants, useCreateTenant, useDeleteTenant } from '@/hooks/useApi';
import { toast } from '@/components/ui/Toaster';

export function EspacesManagement() {
  const { data: tenantsData, isLoading } = useTenants();
  const tenants = tenantsData || [];
  
  const createTenant = useCreateTenant();
  const deleteTenant = useDeleteTenant();
  
  const [newTenantName, setNewTenantName] = useState('');

  const handleAddTenant = async () => {
    if (!newTenantName.trim()) return toast.error('Le nom est requis');
    try {
      await createTenant.mutateAsync({ name: newTenantName });
      toast.success('Espace créé avec succès');
      setNewTenantName('');
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleDeleteTenant = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet espace ? Cette action peut avoir des impacts importants.')) return;
    try {
      await deleteTenant.mutateAsync(id);
      toast.success('Espace supprimé');
    } catch (error) {
      toast.error('Impossible de supprimer cet espace (des éléments y sont liés)');
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="flex justify-between items-start">
         <div>
           <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Layers className="w-5 h-5" /> Gestion des Espaces (Agences / Filiales)
           </h3>
           <p className="text-sm text-muted-foreground mt-1">Créez et supprimez les espaces logiques de votre ERP. Utilisez la page Utilisateurs pour y affecter vos collaborateurs.</p>
         </div>
       </div>

       {/* Formulaire Rapide */}
       <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-2xl border">
         <input 
            type="text" 
            placeholder="Nom de la nouvelle agence..." 
            className="flex-1 px-4 py-3 bg-background border rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold"
            value={newTenantName}
            onChange={e => setNewTenantName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTenant()}
         />
         <button 
            onClick={handleAddTenant}
            disabled={createTenant.isPending}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
         >
            {createTenant.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Créer l'Espace
         </button>
       </div>

       {/* Liste des espaces */}
       <div className="border rounded-2xl overflow-hidden bg-background/50">
          <table className="w-full text-left text-sm">
             <thead className="bg-muted text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nom de l'Espace</th>
                  <th className="px-6 py-4">Date de Création</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {tenants.map((tenant: any) => (
                  <tr key={tenant.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-black text-muted-foreground">#{tenant.id}</td>
                    <td className="px-6 py-4 font-bold">{tenant.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => handleDeleteTenant(tenant.id)}
                         className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                         title="Supprimer l'espace"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                      Aucun espace créé.
                    </td>
                  </tr>
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
}
