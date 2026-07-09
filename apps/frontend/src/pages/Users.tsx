import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Shield, Mail, Trash2, Power, Save, Users as UsersIcon, Check, ShieldAlert, PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useUsers, useUpdateUser, useDeleteUser, 
  useRolePermissions, useUpdateRolePermissions, useRevokeSession,
  useCustomRoles, useCreateCustomRole, useUpdateCustomRole, useDeleteCustomRole
} from '@/hooks/useApi';
import { AddUserModal } from '@/components/modals/AddUserModal';
import { UserDetailModal } from '@/components/modals/UserDetailModal';
import { toast } from '@/components/ui/Toaster';
import { useAuthStore } from '@/stores/useAuthStore';

const ROLES = [
  { key: 'SUPER_ADMIN', label: 'Super Admin', color: 'text-purple-600 bg-purple-50' },
  { key: 'ADMIN', label: 'Admin', color: 'text-indigo-600 bg-indigo-50' },
  { key: 'DIRECTEUR', label: 'Directeur', color: 'text-amber-600 bg-amber-50' },
  { key: 'CHEF_PROJET', label: 'Chef de Projet', color: 'text-emerald-600 bg-emerald-50' },
  { key: 'RESPONSABLE_TECHNIQUE', label: 'Resp. Technique', color: 'text-cyan-600 bg-cyan-50' },
  { key: 'TECHNICIEN', label: 'Technicien', color: 'text-blue-600 bg-blue-50' },
  { key: 'CLIENT', label: 'Client', color: 'text-slate-600 bg-slate-50' },
  { key: 'COMMERCIAL', label: 'Commercial', color: 'text-rose-600 bg-rose-50' },
  { key: 'ACHETEUR', label: 'Acheteur', color: 'text-stone-600 bg-stone-50' },
];

const PERMISSION_GROUPS = [
  {
    title: 'Analyses & Tableaux de Bord',
    permissions: [
      { key: 'analytics:view', label: 'Consulter les rapports & performances' },
      { key: 'analytics:full', label: 'Accès complet aux données financières avancées' },
    ]
  },
  {
    title: 'Tâches & Chantiers',
    permissions: [
      { key: 'task:read', label: 'Consulter le tableau Kanban' },
      { key: 'task:create', label: 'Lancer des chantiers (créer)' },
      { key: 'task:edit', label: 'Mettre à jour / modifier les tâches' },
      { key: 'task:delete', label: 'Archiver / supprimer des chantiers' },
    ]
  },
  {
    title: 'Interventions Techniques',
    permissions: [
      { key: 'intervention:read', label: 'Visualiser la liste des interventions' },
      { key: 'intervention:create', label: 'Planifier de nouvelles demandes' },
      { key: 'intervention:edit', label: 'Modifier les rapports techniques' },
      { key: 'intervention:delete', label: 'Supprimer des fiches d\'intervention' },
    ]
  },
  {
    title: 'Projets ERP',
    permissions: [
      { key: 'project:read', label: 'Consulter les portefeuilles projets' },
      { key: 'project:manage', label: 'Gérer les phases, jalons et budgets' },
    ]
  },
  {
    title: 'Actifs (Sites & Localisations)',
    permissions: [
      { key: 'site:read', label: 'Consulter la cartographie des sites' },
      { key: 'site:manage', label: 'Créer/Modifier des bâtiments' },
      { key: 'equipment:read', label: 'Consulter l\'inventaire équipement' },
      { key: 'equipment:manage', label: 'Gérer les codes barres / QR Codes' },
    ]
  },
  {
    title: 'Finance & Contrats',
    permissions: [
      { key: 'contract:read', label: 'Consulter les contrats de maintenance (SLA)' },
      { key: 'contract:manage', label: 'Gérer les clauses & renouvellements' },
      { key: 'invoice:read', label: 'Consulter le journal de facturation' },
      { key: 'invoice:manage', label: 'Gérer les factures, devis & paiements' },
    ]
  },
  {
    title: 'GED & Documents',
    permissions: [
      { key: 'document:read', label: 'Consulter la bibliothèque GED' },
      { key: 'document:manage', label: 'Téléverser / Supprimer des fichiers administratifs' },
    ]
  },
  {
    title: 'Paramètres & Habilitations',
    permissions: [
      { key: 'user:manage', label: 'Gérer les profils et les rôles collaborateurs' },
      { key: 'settings:manage', label: 'Accéder aux paramètres de la marque & logo' },
    ]
  }
];

export function Users() {
  const { user, simulatedRole, simulateRole } = useAuthStore();
  const userRole = user?.role;
  const isAdminOrSuper = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'DIRECTEUR';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [showInactive, setShowInactive] = useState(false);
  
  // API Queries & Mutations
  const { data: users, isLoading: usersLoading, error: usersError } = useUsers(showInactive);
  const { data: rolePermissions, isLoading: permissionsLoading } = useRolePermissions();
  const { data: customRoles } = useCustomRoles();
  const updatePermissionsMutation = useUpdateRolePermissions();
  const createCustomRoleMutation = useCreateCustomRole();
  const updateCustomRoleMutation = useUpdateCustomRole();
  const deleteCustomRoleMutation = useDeleteCustomRole();

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const revokeSession = useRevokeSession();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Local state for permissions matrix
  const [localPermissions, setLocalPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let perms = rolePermissions ? { ...rolePermissions } : {};
    if (customRoles) {
      customRoles.forEach((cr: any) => {
        perms[`CUSTOM_${cr.id}`] = cr.permissions || [];
      });
    }
    setLocalPermissions(perms);
  }, [rolePermissions, customRoles]);

  const handleToggleActive = async (user: any) => {
    try {
      await updateUser.mutateAsync({ id: user.id, data: { isActive: !user.isActive } });
      toast.success(user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé');
    } catch {
      toast.error('Échec de la mise à jour');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce collaborateur ?')) return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success('Utilisateur supprimé');
    } catch {
      toast.error('Échec de la suppression');
    }
  };

  const handleRevokeSession = async (userId: number, userName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir forcer la déconnexion de ${userName} ? Sa session active sera immédiatement révoquée.`)) return;
    try {
      await revokeSession.mutateAsync(userId);
    } catch {
      // handled in hook
    }
  };

  const handleTogglePermission = (roleKey: string, permissionKey: string) => {
    setLocalPermissions(prev => {
      const currentRolePerms = prev[roleKey] || [];
      const updatedPerms = currentRolePerms.includes(permissionKey)
        ? currentRolePerms.filter(p => p !== permissionKey)
        : [...currentRolePerms, permissionKey];
      return { ...prev, [roleKey]: updatedPerms };
    });
  };

  const handleSavePermissions = async () => {
    try {
      // Split global permissions from custom roles permissions
      const globalPerms: Record<string, string[]> = {};
      const customPermsToUpdate: { id: number, data: any }[] = [];

      Object.entries(localPermissions).forEach(([key, perms]) => {
        if (key.startsWith('CUSTOM_')) {
          const id = parseInt(key.replace('CUSTOM_', ''));
          customPermsToUpdate.push({ id, data: { permissions: perms } });
        } else {
          globalPerms[key] = perms;
        }
      });

      // Update global
      await updatePermissionsMutation.mutateAsync(globalPerms);

      // Update custom roles
      if (customPermsToUpdate.length > 0) {
        await Promise.all(customPermsToUpdate.map(upd => updateCustomRoleMutation.mutateAsync(upd)));
      }
      
    } catch (err) {
      // toast.error is already handled in mutation
    }
  };

  const handleCreateCustomRole = async () => {
    const name = window.prompt('Nom du nouveau rôle personnalisé :');
    if (!name || name.trim() === '') return;
    try {
      await createCustomRoleMutation.mutateAsync({ name, permissions: [] });
    } catch (err) {
      // handled
    }
  };

  const handleDeleteCustomRole = async (id: number, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le rôle personnalisé "${name}" ?`)) return;
    try {
      await deleteCustomRoleMutation.mutateAsync(id);
    } catch (err) {
      // handled
    }
  };

  const filteredUsers = users?.filter((user: any) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allRoles = [
    ...ROLES,
    ...(customRoles?.map((cr: any) => ({
      key: `CUSTOM_${cr.id}`,
      label: cr.name,
      color: 'text-fuchsia-600 border-fuchsia-200 bg-fuchsia-50',
      isCustom: true,
      id: cr.id,
    })) || []),
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Habilitations & Organisation</h2>
          <p className="text-muted-foreground font-medium text-sm">Gérez les comptes collaborateurs et pilotez les droits d'accès de votre ERP.</p>
        </div>
        
        {activeTab === 'users' ? (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="premium-gradient text-primary-foreground px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border border-white/10"
          >
            <UserPlus className="w-5 h-5" /> Nouvel Utilisateur
          </button>
        ) : (
          isAdminOrSuper && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-card border border-border/50 px-4 py-2.5 rounded-2xl shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Simuler :</span>
                <select 
                  value={simulatedRole || ''}
                  onChange={(e) => simulateRole(e.target.value || null)}
                  className="bg-transparent text-xs font-black uppercase tracking-wider text-foreground focus:outline-none border-none cursor-pointer"
                >
                  <option value="" className="bg-background text-foreground">Aucun (Rôle Réel)</option>
                  {ROLES.map(r => (
                    <option key={r.key} value={r.key} className="bg-background text-foreground">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleSavePermissions}
                disabled={updatePermissionsMutation.isPending}
                className="premium-gradient text-primary-foreground px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border border-white/10 disabled:opacity-50 whitespace-nowrap"
              >
                <Save className="w-5 h-5" /> Enregistrer les Habilitations
              </button>
            </div>
          )
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2.5",
            activeTab === 'users' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <UsersIcon className="w-4 h-4" /> Collaborateurs
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={cn(
            "px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2.5",
            activeTab === 'permissions' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Shield className="w-4 h-4" /> Matrice des Habilitations (Droits)
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' ? (
        <>
          <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          <UserDetailModal 
            isOpen={isDetailModalOpen} 
            onClose={() => setIsDetailModalOpen(false)} 
            user={selectedUser} 
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="search"
                placeholder="Rechercher un membre par nom, email..."
                className="w-full pl-11 pr-4 py-3 bg-background border border-border/50 rounded-xl text-sm font-medium focus:ring-4 focus:ring-primary/5 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2.5 bg-card border border-border/50 px-4 py-2 rounded-xl shadow-sm">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Afficher les collaborateurs inactifs</span>
               <button 
                 onClick={() => setShowInactive(!showInactive)}
                 className={cn(
                   "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                   showInactive ? "bg-primary" : "bg-muted-foreground/30"
                 )}
               >
                 <span className={cn(
                   "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                   showInactive ? "translate-x-4" : "translate-x-0"
                 )} />
               </button>
            </div>
          </div>

          {usersLoading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse font-medium">Chargement des collaborateurs...</div>
          ) : usersError ? (
            <div className="p-8 text-center text-destructive border-2 border-dashed border-destructive/20 rounded-2xl m-6 bg-destructive/5">
              Erreur lors du chargement des profils.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers?.map((u: any) => (
                <div key={u.id} className={cn(
                  "border border-border/50 rounded-3xl bg-card text-card-foreground shadow-sm hover:shadow-xl hover:border-primary/45 transition-all group overflow-hidden flex flex-col justify-between min-h-[220px]",
                  !u.isActive && "opacity-75 grayscale-[0.3]"
                )}>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black transition-all shadow-sm shrink-0 border uppercase",
                          u.isActive ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                        )}>
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-sm text-foreground truncate max-w-[140px] leading-tight">{u.name}</h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1.5 font-medium truncate max-w-[180px]">
                            <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" /> {u.email}
                          </div>
                        </div>
                      </div>
                      <div className={cn("px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0", 
                        allRoles.find(r => r.key === (u.customRoleId ? `CUSTOM_${u.customRoleId}` : u.role))?.color || 'bg-muted text-muted-foreground'
                      )}>
                        {allRoles.find(r => r.key === (u.customRoleId ? `CUSTOM_${u.customRoleId}` : u.role))?.label || u.role}
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-6 pt-4 border-t border-dashed">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground/70 font-bold flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-muted-foreground/45" /> Accès ERP
                        </span>
                        <span className={cn("inline-flex items-center gap-1 font-black text-[9px] tracking-widest", u.isActive ? "text-emerald-600" : "text-rose-600")}>
                          {u.isActive ? 'ACTIF' : 'INACTIF'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground/70 font-bold">Rattachement :</span>
                        <span className="font-bold text-foreground truncate max-w-[150px] uppercase text-[10px]">{u.company?.name || 'Indépendant'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 border-t bg-muted/5 flex justify-between items-center mt-auto">
                     <div className="flex gap-2">
                        {isAdminOrSuper && (
                          <>
                            <button 
                              onClick={() => handleToggleActive(u)}
                              className={cn(
                                "p-2 rounded-xl transition-all border shadow-sm",
                                u.isActive ? "hover:bg-red-50 text-red-500 border-red-100 hover:border-red-200" : "hover:bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-200"
                              )}
                              title={u.isActive ? "Suspendre le compte" : "Activer le compte"}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            {u.isActive && u.id !== user?.id && (
                              <button 
                                onClick={() => handleRevokeSession(u.id, u.name)}
                                disabled={revokeSession.isPending}
                                className="p-2 hover:bg-amber-50 text-muted-foreground hover:text-amber-500 transition-all border border-transparent hover:border-amber-100 rounded-xl disabled:opacity-50"
                                title="Forcer la déconnexion de session"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(u.id)}
                              className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all border border-transparent hover:border-red-100 rounded-xl"
                              title="Supprimer collaborateur"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                     </div>
                     <button 
                       onClick={() => { setSelectedUser(u); setIsDetailModalOpen(true); }}
                       className="text-primary hover:underline text-[10px] font-black uppercase tracking-widest"
                     >
                       Gérer Profil
                     </button>
                  </div>
                </div>
              ))}
              
              {filteredUsers?.length === 0 && (
                <div className="col-span-full border-2 border-dashed rounded-[2.5rem] py-24 text-center flex flex-col items-center justify-center gap-4 border-border/60 opacity-60 bg-card/20">
                  <UsersIcon className="w-12 h-12 text-muted-foreground" />
                  <div>
                     <p className="font-black text-sm uppercase tracking-wider">Aucun collaborateur trouvé</p>
                     <p className="text-xs text-muted-foreground font-medium mt-1">Modifiez vos mots clés ou intégrez un nouveau profil.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Dynamic Permissions Matrix Grid UI */
        <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-500">
          {permissionsLoading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse font-medium">Chargement de la matrice des habilitations...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-muted/30 border-b">
                    <th className="p-4 pl-6 text-xs font-black uppercase tracking-wider text-muted-foreground w-1/4">
                      Module & Permissions
                      {isSuperAdmin && (
                        <button 
                          onClick={handleCreateCustomRole}
                          className="ml-4 px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold text-[10px] inline-flex items-center gap-1"
                        >
                          <PlusCircle className="w-3 h-3" /> Nouveau Rôle
                        </button>
                      )}
                    </th>
                    {allRoles.map((role: any) => (
                      <th key={role.key} className="p-4 text-center text-[9px] font-black uppercase tracking-wider text-muted-foreground min-w-[110px] relative group">
                        <div className={cn("px-2 py-1.5 rounded-xl border inline-block relative", role.color)}>
                          {role.label}
                          {role.isCustom && isSuperAdmin && (
                            <button 
                              onClick={() => handleDeleteCustomRole(role.id, role.label)}
                              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Supprimer ce rôle"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {PERMISSION_GROUPS.map((group, groupIdx) => (
                    <React.Fragment key={groupIdx}>
                      <tr className="bg-muted/10">
                        <td colSpan={allRoles.length + 1} className="p-3 pl-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                          {group.title}
                        </td>
                      </tr>
                      {group.permissions.map((perm) => (
                        <tr key={perm.key} className="hover:bg-muted/5 transition-colors">
                          <td className="p-4 pl-8 text-xs font-bold text-foreground flex flex-col">
                            <span className="text-[11px] uppercase font-black text-foreground">{perm.key}</span>
                            <span className="text-[9px] text-muted-foreground/80 font-medium leading-relaxed mt-0.5">{perm.label}</span>
                          </td>
                          {allRoles.map((role: any) => {
                            const isChecked = (localPermissions[role.key] || []).includes(perm.key);
                            const isSuperAdminAlways = role.key === 'SUPER_ADMIN'; // SUPER_ADMIN cannot be edited to keep system safe

                            return (
                              <td key={role.key} className="p-4 text-center">
                                <button
                                  type="button"
                                  disabled={isSuperAdminAlways || !isAdminOrSuper}
                                  onClick={() => handleTogglePermission(role.key, perm.key)}
                                  className={cn(
                                    "mx-auto w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center",
                                    isChecked 
                                      ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10" 
                                      : "border-border hover:border-muted-foreground/50",
                                    isSuperAdminAlways && "opacity-75 cursor-not-allowed",
                                    !isAdminOrSuper && "cursor-not-allowed"
                                  )}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {isAdminOrSuper && (
            <div className="p-6 bg-muted/20 border-t flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setLocalPermissions(rolePermissions || {})}
                className="px-6 py-2.5 border rounded-xl text-xs font-bold transition-all hover:bg-muted"
                disabled={updatePermissionsMutation.isPending}
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="premium-gradient text-primary-foreground px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 border border-white/10 disabled:opacity-50"
                disabled={updatePermissionsMutation.isPending}
              >
                {updatePermissionsMutation.isPending ? 'Enregistrement...' : 'Enregistrer la matrice'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
