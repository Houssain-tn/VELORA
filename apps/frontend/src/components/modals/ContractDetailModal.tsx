import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Calendar, Trash2, Loader2, Save, Building2 } from 'lucide-react';
import { useUpdateContract, useDeleteContract, useCompanies } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
}

export function ContractDetailModal({ isOpen, onClose, contract }: ContractDetailModalProps) {
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const { data: companies } = useCompanies();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    clientId: '',
    startDate: '',
    endDate: '',
    type: 'GOLD',
    status: 'ACTIF',
    slaHours: 4,
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        name: contract.name || '',
        reference: contract.reference || '',
        clientId: contract.clientId?.toString() || '',
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
        type: contract.type || 'GOLD',
        status: contract.status || 'ACTIF',
        slaHours: contract.slaHours || 4,
      });
    }
  }, [contract]);

  if (!isOpen || !contract) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateContract.mutate({
      id: contract.id,
      data: {
        ...formData,
        clientId: parseInt(formData.clientId),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        slaHours: parseInt(formData.slaHours.toString()),
      }
    }, {
      onSuccess: () => {
        toast.success('Contrat mis à jour');
        setIsEditing(false);
      },
      onError: () => toast.error('Erreur lors de la mise à jour')
    });
  };

  const handleDelete = () => {
    if (!window.confirm('Supprimer ce contrat ?')) return;
    deleteContract.mutate(contract.id, {
      onSuccess: () => {
        toast.success('Contrat supprimé');
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">Détails du Contrat</h3>
              <p className="text-xs text-muted-foreground mt-1">{contract.reference || 'REF-TBD'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-muted rounded-md transition-colors"
              >
                Modifier
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nom du Contrat</label>
                {isEditing ? (
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all text-sm font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-semibold">{contract.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entreprise Cliente</label>
                {isEditing ? (
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all text-sm font-medium"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  >
                    <option value="">Sélectionner une entreprise...</option>
                    {companies?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{contract.client?.name || 'Entreprise Inconnue'}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Début</label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {formData.startDate}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fin</label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {formData.endDate}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Statut</label>
                {isEditing ? (
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-medium"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIF">ACTIF</option>
                    <option value="SUSPENDU">SUSPENDU</option>
                    <option value="EXPIRE">EXPIRE</option>
                  </select>
                ) : (
                  <div>
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider", 
                      contract.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {contract.status}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Formule SLA</label>
                {isEditing ? (
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-medium"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="PLATINUM">PLATINUM</option>
                    <option value="GOLD">GOLD</option>
                    <option value="SILVER">SILVER</option>
                    <option value="BRONZE">BRONZE</option>
                  </select>
                ) : (
                  <p className="text-sm font-bold text-primary">{contract.type || 'Standard'}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">GTI (Heures)</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                    value={formData.slaHours}
                    onChange={(e) => setFormData({ ...formData, slaHours: parseInt(e.target.value) })}
                  />
                ) : (
                  <p className="text-sm font-mono font-bold">{contract.slaHours}h</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-tight"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border rounded-lg text-sm font-bold transition-all hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={updateContract.isPending}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                  >
                    {updateContract.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-bold hover:bg-muted/80 transition-all"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
