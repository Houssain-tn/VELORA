import React, { useState } from 'react';
import { useCreateEquipment, useSites } from '@/hooks/useApi';
import { X, Loader2 } from 'lucide-react';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddEquipmentModal({ isOpen, onClose }: AddEquipmentModalProps) {
  const createEq = useCreateEquipment();
  const { data: sites } = useSites();
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    type: 'HVAC',
    siteId: '',
    status: 'OPERATIONNEL',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId) return alert('Veuillez sélectionner un site');
    
    createEq.mutate({
      ...formData,
      siteId: parseInt(formData.siteId),
    }, {
      onSuccess: () => {
        onClose();
        setFormData({ name: '', serialNumber: '', type: 'HVAC', siteId: '', status: 'OPERATIONNEL' });
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <h3 className="font-bold text-lg">Nouvel Équipement</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom de l'équipement</label>
            <input
              required
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
              placeholder="ex: Climatiseur VRV III"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Numéro de Série</label>
            <input
              required
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
              placeholder="ex: SN-123456789"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="HVAC">HVAC / Clim</option>
                <option value="IT">IT / Serveur</option>
                <option value="ENERGIE">Énergie / Onduleur</option>
                <option value="ASCENSEUR">Ascenseur</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut Inicial</label>
              <select
                className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="OPERATIONNEL">Opérationnel</option>
                <option value="EN_PANNE">En Panne</option>
                <option value="MAINTENANCE">En Maintenance</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Site d'Installation</label>
            <select
              required
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
            >
              <option value="">Sélectionner un site...</option>
              {sites?.map((site: any) => (
                <option key={site.id} value={site.id}>{site.name} ({site.city})</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md font-medium hover:bg-muted transition-colors disabled:opacity-50"
              disabled={createEq.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              disabled={createEq.isPending}
            >
              {createEq.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter au Parc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
