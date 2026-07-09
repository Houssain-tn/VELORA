import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Phone, Building2, Trash2, Loader2, Save, Power } from 'lucide-react';
import { useUpdateUser, useDeleteUser, useCompanies, useTenants, useCustomRoles } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function UserDetailModal({ isOpen, onClose, user }: UserDetailModalProps) {
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { data: companies } = useCompanies();
  const { data: tenants } = useTenants();
  const { data: customRoles } = useCustomRoles();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    companyId: '',
    password: '',
    isActive: true,
    tenantAccess: [] as { tenantId: number, role: string }[],
  });

  useEffect(() => {
    if (user) {
      // Map tenantAccess custom roles
      const tenantAccessFormatted = (user.tenantAccess || []).map((ta: any) => ({
        tenantId: ta.tenantId,
        role: ta.customRoleId ? `CUSTOM_${ta.customRoleId}` : ta.role
      }));

      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.customRoleId ? `CUSTOM_${user.customRoleId}` : (user.role || 'TECHNICIEN'),
        companyId: user.companyId?.toString() || '',
        password: '',
        isActive: user.isActive ?? true,
        tenantAccess: tenantAccessFormatted,
      });
      setIsEditing(false);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser.mutate({
      id: user.id,
      data: {
        ...formData,
        companyId: formData.companyId ? parseInt(formData.companyId) : null,
      }
    }, {
      onSuccess: () => {
        toast.success('Profil mis à jour');
        setIsEditing(false);
      },
      onError: () => toast.error('Erreur lors de la mise à jour')
    });
  };

  const handleDelete = () => {
    if (!window.confirm('Supprimer ce collaborateur définitivement ?')) return;
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success('Utilisateur supprimé');
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              user.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">Gestion du Profil</h3>
              <p className="text-xs text-muted-foreground mt-1 tracking-tight">{user.email}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nom Complet</label>
                {isEditing ? (
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-lg focus:ring-2 ring-primary/20 outline-none transition-all text-sm font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-bold">{user.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium">{user.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Téléphone
                </label>
                {isEditing ? (
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                    placeholder="ex: +216 55 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium">{user.phone || 'Non renseigné'}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Rôle Système
                </label>
                {isEditing ? (
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-bold"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <optgroup label="Système">
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="DIRECTEUR">DIRECTEUR</option>
                      <option value="CHEF_PROJET">CHEF_PROJET</option>
                      <option value="RESPONSABLE_TECHNIQUE">RESPONSABLE_TECHNIQUE</option>
                      <option value="TECHNICIEN">TECHNICIEN</option>
                      <option value="CLIENT">CLIENT</option>
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
                ) : (
                  <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {user.customRole ? user.customRole.name : user.role}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Entreprise Cliente
                </label>
                {isEditing ? (
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-lg text-sm font-medium"
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  >
                    <option value="">Aucune (Indépendant)</option>
                    {companies?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-bold flex items-center gap-2">
                    {user.company?.name || 'Indépendant'}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> Réinitialiser Mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
                    className="w-full px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <p className="text-[9px] text-muted-foreground italic">Si vous changez ce champ, le collaborateur devra utiliser ce nouveau mot de passe.</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Statut du Compte</label>
                <div className="flex items-center gap-3">
                   <div className={cn(
                     "w-2.5 h-2.5 rounded-full",
                     formData.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500"
                   )} />
                   <span className="text-xs font-bold">{formData.isActive ? 'COMPTE ACTIF' : 'COMPTE SUSPENDU'}</span>
                   {isEditing && (
                     <button
                       type="button"
                       onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                       className={cn(
                         "ml-auto p-1.5 rounded-lg border transition-all",
                         formData.isActive ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"
                       )}
                     >
                       <Power className="w-3.5 h-3.5" />
                     </button>
                   )}
                </div>
              </div>

              {/* Multi-Tenant Access */}
              <div className="space-y-3 pt-4 border-t">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Accès Multi-Espaces (Agences)
                </label>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {tenants?.map((tenant: any) => {
                    const accessIndex = formData.tenantAccess.findIndex(ta => ta.tenantId === tenant.id);
                    const hasAccess = accessIndex > -1;
                    const currentRole = hasAccess ? formData.tenantAccess[accessIndex].role : 'TECHNICIEN';

                    return (
                      <div key={tenant.id} className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all",
                        hasAccess ? "bg-primary/5 border-primary/30 shadow-inner" : "bg-muted/10 border-border opacity-60"
                      )}>
                         <div className="flex items-center gap-3">
                           <input 
                             type="checkbox" 
                             checked={hasAccess}
                             disabled={!isEditing}
                             onChange={(e) => {
                               const newAccess = [...formData.tenantAccess];
                               if (e.target.checked) {
                                 newAccess.push({ tenantId: tenant.id, role: 'TECHNICIEN' });
                               } else {
                                 newAccess.splice(accessIndex, 1);
                               }
                               setFormData({ ...formData, tenantAccess: newAccess });
                             }}
                             className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                           />
                           <span className="text-xs font-bold">{tenant.name}</span>
                         </div>
                         {hasAccess && (
                           <select
                             disabled={!isEditing}
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
            </div>
          </div>

          <div className="mt-12 pt-6 border-t flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-tight"
            >
              <Trash2 className="w-4 h-4" /> Supprimer Collaborateur
            </button>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border rounded-xl text-xs font-bold transition-all hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={updateUser.isPending}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                  >
                    {updateUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Sauvegarder
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-bold hover:bg-muted/80 transition-all"
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
