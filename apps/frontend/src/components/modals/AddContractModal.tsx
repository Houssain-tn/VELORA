import React, { useState } from 'react';
import { useCreateContract, useCompanies } from '@/hooks/useApi';
import { X, Loader2, Building2 } from 'lucide-react';

interface AddContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddContractModal({ isOpen, onClose }: AddContractModalProps) {
  const createContract = useCreateContract();
  const { data: companies } = useCompanies();
  
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    startDate: '',
    endDate: '',
    type: 'GOLD',
    status: 'ACTIF',
    maxHours: 0,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) return alert('Veuillez sélectionner un client/utilisateur');
    
    createContract.mutate({
      ...formData,
      clientId: parseInt(formData.clientId),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    }, {
      onSuccess: () => {
        onClose();
        setFormData({ name: '', clientId: '', startDate: '', endDate: '', type: 'GOLD', status: 'ACTIF', maxHours: 0 });
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <h3 className="font-bold text-lg">Nouveau Contrat SLA</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Référence / Nom du Contrat</label>
            <input
              required
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
              placeholder="ex: Contrat Maintenance Waycon 2026"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5"><Building2 className="w-4 h-4" />Entreprise Cliente</label>
            <select
              required
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            >
              <option value="">Sélectionner une entreprise...</option>
              {companies?.map((company: any) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de Début</label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date d'Échéance</label>
              <input
                required
                type="date"
                className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau de Service (SLA)</label>
              <select
                className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="PLATINUM">Platinum (2h GTI / 4h GTR)</option>
                <option value="GOLD">Gold (4h GTI / 8h GTR)</option>
                <option value="SILVER">Silver (8h GTI / 24h GTR)</option>
                <option value="BRONZE">Bronze (NBD)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Heures Incluses (Total)</label>
              <input
                required
                type="number"
                min="1"
                className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
                placeholder="ex: 100"
                value={formData.maxHours}
                onChange={(e) => setFormData({ ...formData, maxHours: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md font-medium hover:bg-muted transition-colors disabled:opacity-50"
              disabled={createContract.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              disabled={createContract.isPending}
            >
              {createContract.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activer Contrat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
