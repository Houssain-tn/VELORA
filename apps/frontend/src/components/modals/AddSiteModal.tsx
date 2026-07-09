import React, { useState } from 'react';
import { useCreateSite } from '@/hooks/useApi';
import { X, Loader2, Building2 } from 'lucide-react';

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSiteModal({ isOpen, onClose }: AddSiteModalProps) {
  const createSite = useCreateSite();
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    type: 'BATIMENT',
    contactName: '',
    contactPhone: '',
    latitude: '',
    longitude: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse strings to floats if provided
    const payload = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
    };

    createSite.mutate(payload, {
      onSuccess: () => {
        onClose();
        setFormData({ name: '', city: '', type: 'BATIMENT', contactName: '', contactPhone: '', latitude: '', longitude: '' });
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Building2 className="w-5 h-5" />
             </div>
             <h3 className="font-black uppercase tracking-tight text-xl">Nouveau Site</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom du Site</label>
            <input
              required
              className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all placeholder:font-normal"
              placeholder="ex: Siège Social Sousse"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ville / Localisation</label>
            <input
              required
              className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all placeholder:font-normal"
              placeholder="ex: Tunis, Sousse..."
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Type de Site</label>
            <select
              className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="BATIMENT">Bâtiment / Bureau</option>
              <option value="USINE">Usine / Industriel</option>
              <option value="EXTERIEUR">Extérieur / Site Technique</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Responsable Site</label>
              <input
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all placeholder:font-normal"
                placeholder="Nom du contact"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Téléphone</label>
              <input
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all placeholder:font-normal"
                placeholder="73 --- ---"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Latitude (GPS)</label>
              <input
                type="number"
                step="any"
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all placeholder:font-normal"
                placeholder="ex: 35.8256"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Longitude (GPS)</label>
              <input
                type="number"
                step="any"
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all placeholder:font-normal"
                placeholder="ex: 10.6369"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all disabled:opacity-50"
              disabled={createSite.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              disabled={createSite.isPending}
            >
              {createSite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer le Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
