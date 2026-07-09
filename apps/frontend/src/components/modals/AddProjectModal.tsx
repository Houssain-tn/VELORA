import React, { useState } from 'react';
import { useCreateProject, useUsers } from '@/hooks/useApi';
import { X, Loader2, User } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProjectModal({ isOpen, onClose }: AddProjectModalProps) {
  const createProject = useCreateProject();
  const { data: users } = useUsers();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    managerId: '',
  });

  if (!isOpen) return null;

  // Potential managers: ADMIN, SUPER_ADMIN, DIRECTEUR, CHEF_PROJET
  const potentialManagers = users?.filter((u: any) => 
    ['ADMIN', 'SUPER_ADMIN', 'DIRECTEUR', 'CHEF_PROJET'].includes(u.role)
  ) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.managerId) {
      toast.error('Veuillez sélectionner un manager pour ce projet');
      return;
    }

    createProject.mutate({
      ...formData,
      managerId: parseInt(formData.managerId),
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    }, {
      onSuccess: () => {
        toast.success('Projet créé avec succès');
        onClose();
        setFormData({ name: '', description: '', startDate: '', endDate: '', managerId: '' });
      },
      onError: () => {
        toast.error('Erreur lors de la création du projet');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <h3 className="font-bold text-lg text-primary flex items-center gap-2">
            <User className="w-5 h-5" />
            Nouveau Projet
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom du Projet</label>
            <input
              required
              className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all text-sm"
              placeholder="ex: Déploiement Fibre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manager responsable</label>
            <select
              required
              className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all text-sm font-bold"
              value={formData.managerId}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            >
              <option value="">Sélectionnez un manager...</option>
              {potentialManagers.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all min-h-[80px] text-sm"
              placeholder="Description détaillée du projet..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date de début</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all text-sm"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date d'échéance</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all text-sm"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg font-bold text-sm hover:bg-muted transition-colors disabled:opacity-50 uppercase tracking-tight"
              disabled={createProject.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 uppercase tracking-tight"
              disabled={createProject.isPending}
            >
              {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer le Projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
