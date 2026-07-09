import { 
  Users as UsersIcon, Plus, Pencil, Trash2, Shield, 
  Search, LayoutGrid, List
} from 'lucide-react';
import React, { useState } from 'react';
import { useSquads, useUsers, useCreateSquad, useUpdateSquad, useDeleteSquad } from '@/hooks/useApi';
import { toast } from '@/components/ui/Toaster';
import { cn } from '@/lib/utils';

export function SquadManagement() {
  const { data: squads, isLoading: squadsLoading } = useSquads();
  const { data: users } = useUsers();
  const createSquad = useCreateSquad();
  const updateSquad = useUpdateSquad();
  const deleteSquad = useDeleteSquad();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSquad, setEditingSquad] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    leaderId: '',
    memberIds: [] as number[],
  });

  const handleOpenModal = (squad?: any) => {
    if (squad) {
      setEditingSquad(squad);
      setFormData({
        name: squad.name,
        description: squad.description || '',
        color: squad.color || '#3b82f6',
        leaderId: squad.leaderId?.toString() || '',
        memberIds: squad.members?.map((m: any) => m.id) || [],
      });
    } else {
      setEditingSquad(null);
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6',
        leaderId: '',
        memberIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      leaderId: formData.leaderId ? parseInt(formData.leaderId) : undefined,
      memberIds: formData.memberIds,
    };

    try {
      if (editingSquad) {
        await updateSquad.mutateAsync({ id: editingSquad.id, data: payload });
        toast.success('Équipe mise Ã  jour');
      } else {
        await createSquad.mutateAsync(payload);
        toast.success('Nouvelle équipe créée');
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Erreur lors de l\'opération');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette équipe ?')) return;
    try {
      await deleteSquad.mutateAsync(id);
      toast.success('Équipe supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleMember = (id: number) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter(mid => mid !== id)
        : [...prev.memberIds, id]
    }));
  };

  const filteredSquads = squads?.filter((s: any) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-2xl border shadow-sm ring-1 ring-black/5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <UsersIcon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Gestion des Équipes Techniques</h1>
          </div>
          <p className="text-muted-foreground font-medium italic">Structurez vos équipes terrain pour une efficacité opérationnelle maximale.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[3]" /> Nouvelle Équipe
        </button>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Rechercher une équipe..."
            className="w-full pl-11 pr-4 py-3 bg-card border rounded-xl outline-none focus:ring-4 ring-primary/5 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center bg-muted/30 p-1.5 rounded-xl border">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Squads Rendering */}
      {squadsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl border border-dashed" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSquads?.map((squad: any) => (
            <div 
              key={squad.id} 
              className="group bg-card rounded-2xl border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all flex flex-col overflow-hidden ring-1 ring-black/5"
            >
              <div 
                className="h-2 w-full"
                style={{ backgroundColor: squad.color }}
              />
              <div className="p-6 flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{squad.name}</h3>
                    {squad.leader && (
                       <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                         <Shield className="w-3.5 h-3.5 text-blue-500" /> Resp. : {squad.leader.name}
                       </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(squad)}
                      className="p-2 hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-lg transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(squad.id)}
                      className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {squad.description || 'Aucune description définie pour cette équipe.'}
                </p>

                <div className="space-y-3 pt-4 border-t border-dashed">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    <span>Membres ({squad.members?.length || 0})</span>
                    <span>{squad._count?.interventions || 0} Intervention(s)</span>
                  </div>
                  <div className="flex -space-x-3 overflow-hidden p-1">
                    {squad.members?.map((m: any) => (
                      <div 
                        key={m.id} 
                        className="h-10 w-10 rounded-full border-2 border-card ring-2 ring-muted bg-slate-100 flex items-center justify-center text-xs font-black overflow-hidden hover:translate-y-[-2px] hover:z-10 transition-all cursor-default"
                        title={m.name}
                      >
                        {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : m.name[0]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border shadow-sm overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-black uppercase text-muted-foreground">Équipe</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-muted-foreground">Responsable</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-muted-foreground">Effectif</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-muted-foreground">Activité</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSquads?.map((squad: any) => (
                <tr key={squad.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: squad.color }} />
                      <span className="font-bold">{squad.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">{squad.leader?.name || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-muted rounded-full text-xs font-bold">{squad.members?.length || 0} Membre(s)</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-muted-foreground font-medium">{squad._count?.interventions || 0} interventions</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleOpenModal(squad)} className="p-2 hover:bg-primary/5 text-primary rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                       <button onClick={() => handleDelete(squad.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Creator/Editor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/20">
                <h3 className="text-lg font-bold">{editingSquad ? "Modifier l'Équipe" : 'Créer une Nouvelle Squad'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-muted rounded-full transition-all"><Plus className="w-5 h-5 rotate-45" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Nom de l'équipe</label>
                    <input 
                      required
                      className="w-full bg-background border rounded-xl p-3 outline-none focus:ring-4 ring-primary/5 transition-all text-sm font-bold"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ex: Équipe Maintenance Sousse"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Couleur Badge</label>
                    <div className="flex gap-2 p-1.5 bg-background border rounded-xl items-center">
                      <input 
                        type="color"
                        className="w-8 h-8 rounded p-0 border-none bg-transparent cursor-pointer"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      />
                      <span className="text-xs font-mono font-bold text-muted-foreground uppercase">{formData.color}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Description</label>
                  <textarea 
                    className="w-full bg-background border rounded-xl p-3 outline-none focus:ring-4 ring-primary/5 transition-all text-sm resize-none"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Objectifs de l'équipe, zone géographique, spécialités..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 flex flex-col">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">Responsable (Lead)</label>
                    <select 
                      className="w-full bg-background border rounded-xl p-3 outline-none focus:ring-4 ring-primary/5 transition-all text-sm font-bold appearance-none"
                      value={formData.leaderId}
                      onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                    >
                      <option value="">Sélectionnez un responsable...</option>
                      {users?.filter((u: any) => u.isActive).map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1 flex justify-between">
                    <span>Membres de l'équipe</span>
                    <span className="text-primary">{formData.memberIds.length} sélectionnés</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar border p-4 rounded-xl bg-muted/10">
                    {users?.filter((u: any) => u.isActive && (u.role === 'TECHNICIEN' || u.role === 'ADMIN' || u.role === 'RESPONSABLE_TECHNIQUE')).map((u: any) => (
                      <div 
                        key={u.id}
                        onClick={() => toggleMember(u.id)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]",
                          formData.memberIds.includes(u.id) 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                            : "bg-background border-transparent hover:border-muted font-bold text-xs"
                        )}
                      >
                         <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-white/20">
                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-500 font-black flex items-center justify-center h-full uppercase">{u.name[0]}</span>}
                         </div>
                         <span className={cn("truncate text-[10px] font-black uppercase tracking-tight", formData.memberIds.includes(u.id) ? "text-white" : "text-foreground")}>
                           {u.name}
                         </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 border rounded-xl font-bold hover:bg-muted transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={createSquad.isPending || updateSquad.isPending}
                    className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    {createSquad.isPending || updateSquad.isPending ? <Plus className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {editingSquad ? "Enregistrer" : "Créer l'équipe"}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}


