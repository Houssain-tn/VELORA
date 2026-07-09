import { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, MapPin, Globe, FileText, Briefcase } from 'lucide-react';
import { useCreateCompany, useUpdateCompany } from '@/hooks/useApi';
import { toast } from '@/components/ui/Toaster';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: any;
}

export function ClientModal({ isOpen, onClose, client }: ClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    mf: '',
    rc: '',
    website: '',
  });

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        country: client.country || '',
        mf: client.mf || '',
        rc: client.rc || '',
        website: client.website || '',
      });
    } else {
      setFormData({
        name: '', email: '', phone: '', address: '', city: '', country: '', mf: '', rc: '', website: ''
      });
    }
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (client) {
        await updateCompany.mutateAsync({ id: client.id, data: formData });
        toast.success('Client mis à jour');
      } else {
        await createCompany.mutateAsync(formData);
        toast.success('Client créé avec succès');
      }
      onClose();
    } catch {
      toast.error('Une erreur est survenue');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border-2 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">{client ? 'Modifier le Client' : 'Nouveau Client'}</h2>
              <p className="text-xs font-bold text-muted-foreground">Fiche d'identification de l'entreprise</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> Raison Sociale *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-background border-2 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Ex: Waycon Méditerranée..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-background border-2 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="contact@entreprise.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-background border-2 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="+216 73 000 000"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Adresse
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-background border-2 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Adresse complète"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ville</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-background border-2 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Sousse"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pays</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-background border-2 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Tunisie"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Matricule Fiscal (MF)
              </label>
              <input
                type="text"
                value={formData.mf}
                onChange={(e) => setFormData({ ...formData, mf: e.target.value })}
                className="w-full bg-background border-2 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                placeholder="1234567M/A/M/000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" /> Registre de Commerce (RC)
              </label>
              <input
                type="text"
                value={formData.rc}
                onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                className="w-full bg-background border-2 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                placeholder="B0000000000"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Site Web
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full bg-background border-2 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="https://www.exemple.com"
              />
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createCompany.isPending || updateCompany.isPending}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {client ? 'Enregistrer' : 'Créer Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
