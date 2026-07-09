import React, { useState } from 'react';
import { X, Loader2, Building2 } from 'lucide-react';
import { useCompanies, useTenants, useCreateUser, useCustomRoles } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const { data: companies } = useCompanies();
  const { data: tenants } = useTenants();
  const { data: customRoles } = useCustomRoles();
  const createUser = useCreateUser();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TECHNICIEN',
    companyId: '',
    tenantAccess: [] as { tenantId: number, role: string }[],
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.companyId) (payload as any).companyId = parseInt(payload.companyId);
    
    createUser.mutate(payload, {
      onSuccess: () => {
        onClose();
        setFormData({ name: '', email: '', password: '', role: 'TECHNICIEN', companyId: '', tenantAccess: [] });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <h3 className="font-bold text-lg">Nouvel Utilisateur Pro</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom Complet</label>
            <input
              required
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
              placeholder="ex: Jean Dupont"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Adresse Email</label>
            <input
              required
              type="email"
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
              placeholder="jean@entreprise.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mot de Passe (Provisoire)</label>
            <input
              required
              type="password"
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rôle & Permissions</label>
            <select
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <optgroup label="Rôles Système">
                <option value="SUPER_ADMIN">Super Administrateur</option>
                <option value="ADMIN">Administrateur</option>
                <option value="DIRECTEUR">Directeur</option>
                <option value="CHEF_PROJET">Chef de Projet</option>
                <option value="RESPONSABLE_TECHNIQUE">Responsable Technique</option>
                <option value="TECHNICIEN">Technicien SAV</option>
                <option value="CLIENT">Accès Client Site</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="ACHETEUR">Acheteur</option>
              </optgroup>
              {customRoles && customRoles.length > 0 && (
                <optgroup label="Rôles Personnalisés">
                  {customRoles.map((cr: any) => (
                    <option key={`CUSTOM_${cr.id}`} value={`CUSTOM_${cr.id}`}>
                      {cr.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className={cn("w-4 h-4", formData.role === 'CLIENT' ? "text-primary" : "text-muted-foreground")} />
              Entreprise / Client {formData.role === 'CLIENT' && <span className="text-red-500">*</span>}
            </label>
            <select
              required={formData.role === 'CLIENT'}
              className={cn(
                "w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all",
                formData.role === 'CLIENT' && !formData.companyId && "border-red-500/50"
              )}
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
            >
              <option value="">Indépendant / Aucun</option>
              {companies?.map((company: any) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <p className={cn("text-[10px]", formData.role === 'CLIENT' ? "text-primary font-bold" : "text-muted-foreground")}>
              {formData.role === 'CLIENT' 
                ? "Obligatoire : Sélectionnez le client auquel ce compte appartient." 
                : "Sélectionnez \"Waycon\" pour l'équipe interne ou laissez vide."}
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Accès Multi-Espaces (Agences)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar border rounded-md p-2 bg-muted/10">
              {tenants?.map((tenant: any) => {
                const accessIndex = formData.tenantAccess.findIndex(ta => ta.tenantId === tenant.id);
                const hasAccess = accessIndex > -1;
                const currentRole = hasAccess ? formData.tenantAccess[accessIndex].role : 'TECHNICIEN';

                return (
                  <div key={tenant.id} className={cn(
                    "flex items-center justify-between p-2 rounded-lg border text-sm transition-all",
                    hasAccess ? "bg-primary/5 border-primary/30" : "bg-background border-border"
                  )}>
                     <div className="flex items-center gap-3">
                       <input 
                         type="checkbox" 
                         checked={hasAccess}
                         onChange={(e) => {
                           const newAccess = [...formData.tenantAccess];
                           if (e.target.checked) {
                             newAccess.push({ tenantId: tenant.id, role: 'TECHNICIEN' });
                           } else {
                             newAccess.splice(accessIndex, 1);
                           }
                           setFormData({ ...formData, tenantAccess: newAccess });
                         }}
                         className="w-4 h-4 rounded border-border text-primary cursor-pointer"
                       />
                       <span className="font-medium">{tenant.name}</span>
                     </div>
                     {hasAccess && (
                       <select
                         value={currentRole}
                         onChange={(e) => {
                           const newAccess = [...formData.tenantAccess];
                           newAccess[accessIndex].role = e.target.value;
                           setFormData({ ...formData, tenantAccess: newAccess });
                         }}
                         className="text-[10px] font-black bg-background border px-2 py-1 rounded-md outline-none"
                       >
                          <optgroup label="Système">
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="DIRECTEUR">DIRECTEUR</option>
                            <option value="CHEF_PROJET">CHEF_PROJET</option>
                            <option value="RESPONSABLE_TECHNIQUE">RESP. TECHNIQUE</option>
                            <option value="TECHNICIEN">TECHNICIEN</option>
                            <option value="CLIENT">CLIENT</option>
                            <option value="COMMERCIAL">COMMERCIAL</option>
                            <option value="ACHETEUR">ACHETEUR</option>
                          </optgroup>
                          {customRoles && customRoles.length > 0 && (
                            <optgroup label="Personnalisés">
                              {customRoles.map((cr: any) => (
                                <option key={`CUSTOM_${cr.id}`} value={`CUSTOM_${cr.id}`}>
                                  {cr.name.toUpperCase()}
                                </option>
                              ))}
                            </optgroup>
                          )}
                       </select>
                     )}
                  </div>
                );
              })}
              {tenants?.length === 0 && <p className="text-xs text-muted-foreground italic">Aucun espace disponible</p>}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md font-medium hover:bg-muted transition-colors disabled:opacity-50"
              disabled={createUser.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              disabled={createUser.isPending}
            >
              {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer Compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
