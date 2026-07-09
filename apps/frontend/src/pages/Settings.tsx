import { useState, useEffect } from 'react';
import { 
  Database, BellRing, ShieldCheck, Palette, 
  User as UserIcon, Loader2, CheckCircle2, 
  Building2, Users, Mail, Phone, MapPin, 
  Plus, Edit2, Trash2, Globe, CloudDownload, Layers
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import api from '@/lib/api';
import { useCompanies, useUpdateCompany, useDeleteCompany, useUpdateUser, useBackups, useCreateBackup, useDeleteBackup } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';
import { ClientModal } from '@/components/modals/ClientModal';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { EspacesManagement } from '@/components/settings/EspacesManagement';

type SettingTab = 'profil' | 'entreprise' | 'espaces' | 'clients' | 'apparence' | 'securite' | 'notifications' | 'db';

export function Settings() {
  const { user } = useAuthStore();
  const { data: companies } = useCompanies();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const updateUser = useUpdateUser();
  const createBackup = useCreateBackup();
  const settings = useSettingsStore();

  const [activeTab, setActiveTab] = useState<SettingTab>('profil');
  const [isSaving, setIsSaving] = useState(false);
  
  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Password change state (proper React pattern)
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Enterprise data (Company ID 1)
  const myCompany = companies?.find((c: any) => c.id === 1);
  const [enterpriseData, setEnterpriseData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
    city: '',
    country: '',
    website: '',
    rc: '',
    mf: '',
    primaryColor: '',
  });

  // Sync enterprise data when loaded
  useEffect(() => {
    if (myCompany) {
      setEnterpriseData({
        name: myCompany.name || '',
        email: myCompany.email || '',
        phone: myCompany.phone || '',
        address: myCompany.address || '',
        logo: myCompany.logo || '',
        city: myCompany.city || '',
        country: myCompany.country || '',
        website: myCompany.website || '',
        rc: myCompany.rc || '',
        mf: myCompany.mf || '',
        primaryColor: myCompany.primaryColor || '',
      });
    }
  }, [myCompany]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await updateUser.mutateAsync({ id: user.id, data: profileData });
      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error('Erreur de sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEnterprise = () => {
    if (!myCompany) return;
    setIsSaving(true);
    updateCompany.mutate({ id: myCompany.id, data: enterpriseData }, {
      onSuccess: () => {
        toast.success('Informations entreprise mises à jour');
        setIsSaving(false);
      },
      onError: () => {
        toast.error('Erreur de sauvegarde');
        setIsSaving(false);
      }
    });
  };

  const handleDeleteClient = (id: number) => {
    if (!window.confirm('Supprimer cette entreprise client ?')) return;
    deleteCompany.mutate(id, {
      onSuccess: () => toast.success('Client supprimé'),
      onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur lors de la suppression'),
    });
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'DIRECTEUR';

  const menuItems = [
    { id: 'profil', label: 'Profil & Compte', icon: UserIcon },
    { id: 'entreprise', label: 'Mon Entreprise', icon: Building2, adminOnly: true },
    { id: 'espaces', label: 'Gestion des Espaces', icon: Layers, adminOnly: true },
    { id: 'clients', label: 'Gestion Clients', icon: Users, adminOnly: true },
    { id: 'apparence', label: 'Apparence', icon: Palette },
    { id: 'securite', label: 'Sécurité', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: BellRing },
    { id: 'db', label: 'Base de Données', icon: Database, adminOnly: true },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-foreground/90 uppercase">Paramètres Système</h2>
        <p className="text-muted-foreground font-medium italic">Gérez votre profil, votre entreprise et les configurations de la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="col-span-1 space-y-1">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingTab)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all",
                  activeTab === item.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="col-span-3 bg-card border rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
          
          {/* TAB: PROFIL */}
          {activeTab === 'profil' && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                   <UserIcon className="w-5 h-5" /> Mon Profil
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles et vos identifiants de connexion.</p>
              </div>

              <div className="grid gap-6 max-w-xl">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Nom Complet</label>
                    <input 
                       type="text" 
                       value={profileData.name}
                       onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                       className="w-full px-4 py-2.5 bg-muted/30 border rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Adresse Email</label>
                    <input 
                       type="email" 
                       value={profileData.email}
                       onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                       className="w-full px-4 py-2.5 bg-muted/30 border rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm transition-all"
                    />
                 </div>
                 <div className="pt-4">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Sauvegarder mon profil
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: ENTREPRISE */}
          {activeTab === 'entreprise' && (
            <div className="p-8 space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <header className="flex items-center gap-4 border-b border-border/50 pb-6">
                <div className="p-3 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Profil de l'Entreprise</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">Configurez vos informations légales et visuelles</p>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Logo Section */}
                <div className="lg:col-span-3 space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logo de l'entreprise</label>
                   <label className="aspect-square rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 flex flex-col items-center justify-center gap-4 group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden">
                     {enterpriseData.logo ? (
                       <img src={enterpriseData.logo} alt="Logo" className="w-full h-full object-contain p-6" />
                     ) : (
                       <>
                         <div className="p-4 bg-muted/20 rounded-2xl text-muted-foreground group-hover:text-primary transition-colors">
                           <Plus className="w-8 h-8" />
                         </div>
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Cliquer pour importer</span>
                         <span className="text-[9px] text-muted-foreground/50">PNG, JPG, SVG • Max 2MB</span>
                       </>
                     )}
                     <input
                       type="file"
                       accept="image/*"
                       className="sr-only"
                       onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (!file) return;
                         if (file.size > 2 * 1024 * 1024) return toast.error('Image trop lourde (max 2MB)');
                         const reader = new FileReader();
                         reader.onload = (ev) => setEnterpriseData({ ...enterpriseData, logo: ev.target?.result as string });
                         reader.readAsDataURL(file);
                       }}
                     />
                   </label>
                   {enterpriseData.logo && (
                     <button
                       onClick={() => setEnterpriseData({ ...enterpriseData, logo: '' })}
                       className="w-full py-1.5 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                     >
                       Supprimer le logo
                     </button>
                   )}
                 </div>

                {/* Info Section */}
                <div className="lg:col-span-9 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom de l'entreprise</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-muted/50 rounded-lg text-muted-foreground group-focus-within:text-primary transition-all shadow-inner">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="WAYCON Méditerranée"
                        className="w-full pl-14 pr-4 py-3.5 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all shadow-inner"
                        value={enterpriseData.name}
                        onChange={(e) => setEnterpriseData({ ...enterpriseData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adresse</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-muted/50 rounded-lg text-muted-foreground group-focus-within:text-primary transition-all shadow-inner">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Av. Yasser Arafat, Imm. Narjess, Sahloul 1, 4054 Sousse"
                        className="w-full pl-14 pr-4 py-3.5 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all shadow-inner"
                        value={enterpriseData.address}
                        onChange={(e) => setEnterpriseData({ ...enterpriseData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ville</label>
                      <input 
                        type="text" 
                        placeholder="Sousse"
                        className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all shadow-inner"
                        value={enterpriseData.city}
                        onChange={(e) => setEnterpriseData({ ...enterpriseData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pays</label>
                      <input 
                        type="text" 
                        placeholder="Tunisie"
                        className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all shadow-inner"
                        value={enterpriseData.country}
                        onChange={(e) => setEnterpriseData({ ...enterpriseData, country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Téléphone</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-muted/50 rounded-lg text-muted-foreground group-focus-within:text-primary transition-all">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="29 913 004"
                      className="w-full pl-12 pr-4 py-3 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all shadow-inner"
                      value={enterpriseData.phone}
                      onChange={(e) => setEnterpriseData({ ...enterpriseData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">E-mail Professionnel</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-muted/50 rounded-lg text-muted-foreground group-focus-within:text-primary transition-all">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="email" 
                      placeholder="sav.waycon@waycon-com"
                      className="w-full pl-12 pr-4 py-3 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all shadow-inner"
                      value={enterpriseData.email}
                      onChange={(e) => setEnterpriseData({ ...enterpriseData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Site Web</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-muted/50 rounded-lg text-muted-foreground group-focus-within:text-primary transition-all">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="www.waycon.com"
                      className="w-full pl-12 pr-4 py-3 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all shadow-inner"
                      value={enterpriseData.website}
                      onChange={(e) => setEnterpriseData({ ...enterpriseData, website: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Legal & Fiscal Section */}
              <div className="pt-8 border-t border-border/50 space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    Informations Légales & Fiscales
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RC (Registre Commerce)</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary">
                        <span className="text-lg font-bold">#</span>
                      </div>
                      <input 
                        type="text" 
                        placeholder="B0912502007"
                        className="w-full pl-10 pr-4 py-3 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all shadow-inner"
                        value={enterpriseData.rc}
                        onChange={(e) => setEnterpriseData({ ...enterpriseData, rc: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">MF (Matricule Fiscal)</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary">
                        <span className="text-lg font-bold">#</span>
                      </div>
                      <input 
                        type="text" 
                        placeholder="992474/ZAM/000"
                        className="w-full pl-10 pr-4 py-3 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all shadow-inner"
                        value={enterpriseData.mf}
                        onChange={(e) => setEnterpriseData({ ...enterpriseData, mf: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Couleur Identité Visuelle</label>
                     <div className="flex items-center gap-3">
                       <div className="relative group flex-1">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1 bg-muted/50 rounded-lg text-muted-foreground group-focus-within:text-primary transition-all">
                           <Palette className="w-3.5 h-3.5" />
                         </div>
                         <input 
                           type="text" 
                           placeholder="#2563eb"
                           className="w-full pl-12 pr-4 py-3 bg-muted/20 border border-border/50 rounded-2xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all shadow-inner"
                           value={enterpriseData.primaryColor}
                           onChange={(e) => setEnterpriseData({ ...enterpriseData, primaryColor: e.target.value })}
                         />
                       </div>
                       <label className="relative cursor-pointer" title="Choisir une couleur">
                         <div 
                           className="w-12 h-12 rounded-xl shadow-lg border-2 border-white/10 shrink-0 ring-4 ring-muted/20 transition-transform hover:scale-110 overflow-hidden" 
                           style={{ backgroundColor: enterpriseData.primaryColor || '#2563eb' }}
                         >
                           <input
                             type="color"
                             className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                             value={enterpriseData.primaryColor || '#2563eb'}
                             onChange={(e) => setEnterpriseData({ ...enterpriseData, primaryColor: e.target.value })}
                           />
                         </div>
                       </label>
                     </div>
                   </div>
                </div>
              </div>

              {/* Footer Save Button */}
              <div className="pt-10 flex justify-end">
                <button 
                  onClick={handleSaveEnterprise}
                  disabled={isSaving}
                  className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Sauvegarder les paramètres
                </button>
              </div>
            </div>
          )}

          {/* TAB: ESPACES (TENANTS) */}
          {activeTab === 'espaces' && <EspacesManagement />}

          {/* TAB: CLIENTS */}
          {activeTab === 'clients' && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                       <Users className="w-5 h-5" /> Entreprises Clientes
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Gérez la liste de vos partenaires et clients bénéficiaires.</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedClient(null); setIsClientModalOpen(true); }}
                    className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold text-xs uppercase flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Plus className="w-4 h-4" /> Nouveau Client
                  </button>
               </div>

               <div className="border rounded-2xl overflow-x-auto bg-background/50">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-muted text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Entreprise</th>
                          <th className="px-4 py-3">Contact</th>
                          <th className="px-4 py-3">Ville / Adresse</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y">
                        {companies?.filter((c: any) => c.id !== 1).map((client: any) => (
                          <tr key={client.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-4 py-4">
                               <div className="flex items-center gap-3">
                                  {client.logo ? (
                                    <img src={client.logo} className="w-8 h-8 rounded-lg object-contain bg-white border" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                      {client.name[0]}
                                    </div>
                                  )}
                                  <span className="font-bold">{client.name}</span>
                               </div>
                            </td>
                            <td className="px-4 py-4">
                               <div className="flex flex-col text-[11px]">
                                  <span className="text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email || '-'}</span>
                                  <span className="font-medium flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {client.phone || '-'}</span>
                               </div>
                            </td>
                            <td className="px-4 py-4">
                               <span className="text-xs truncate max-w-[200px] block">{client.address || 'Non spécifié'}</span>
                            </td>
                            <td className="px-4 py-4 text-right">
                               <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => { setSelectedClient(client); setIsClientModalOpen(true); }}
                                    className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteClient(client.id)}
                                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                               </div>
                            </td>
                          </tr>
                        ))}
                        {(!companies || companies.filter((c: any) => c.id !== 1).length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground italic">
                              Aucun client enregistré pour le moment.
                            </td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* TAB: DATABASE / BACKUP */}
          {activeTab === 'db' && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                       <Database className="w-5 h-5" /> Maintenance & Sauvegardes
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Gérez la sécurité de vos données et les archives système.</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Protection Active</p>
                      <p className="text-[11px] font-bold text-muted-foreground">Sauvegarde automatique quotidienne à 03:00</p>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-1 space-y-6">
                    <div className="bg-muted/30 border rounded-2xl p-6 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Database className="w-4 h-4" /> Snapshot Manuel
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Générez instantanément une archive complète de la base de données et des fichiers médias vers votre serveur.
                      </p>
                      <button 
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            await createBackup.mutateAsync();
                            toast.success('Génération de la sauvegarde réussie');
                          } catch (error) {
                            toast.error('Erreur lors de la génération de la sauvegarde');
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        Générer maintenant
                      </button>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-3">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">État du Stockage</h4>
                       <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[15%] rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                       </div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase flex justify-between">
                          <span>Usage Backups</span>
                          <span>1.2 GB / 10 GB</span>
                       </p>
                    </div>
                 </div>

                 <div className="md:col-span-2">
                    <div className="border rounded-2xl overflow-hidden bg-background/50">
                       <div className="px-4 py-3 bg-muted/50 border-b flex justify-between items-center">
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Historique des Sauvegardes</h4>
                          <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">Local Storage</span>
                       </div>
                       <div className="max-h-[350px] overflow-y-auto">
                          <BackupList />
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          )}

          {/* TAB: SECURITE */}
          {activeTab === 'securite' && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div>
                 <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Sécurité & Accès
                 </h3>
                 <p className="text-sm text-muted-foreground mt-1">Gérez la sécurité de votre compte et mettez à jour votre mot de passe.</p>
               </div>

               <div className="grid gap-8 max-w-xl">
                 <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-6">
                    <div className="space-y-4">
                       <h4 className="text-xs font-black uppercase tracking-widest">Changer de mot de passe</h4>
                       
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Nouveau Mot de Passe</label>
                          <input 
                             type="password" 
                             placeholder="••••••••"
                             value={passwordData.newPassword}
                             onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                             className="w-full px-4 py-2.5 bg-background border rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm transition-all"
                          />
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Confirmer le Nouveau Mot de Passe</label>
                          <input 
                             type="password" 
                             placeholder="••••••••"
                             value={passwordData.confirmPassword}
                             onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                             className={cn(
                               "w-full px-4 py-2.5 bg-background border rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm transition-all",
                               passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                                 ? "border-red-500 ring-red-200"
                                 : passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword
                                 ? "border-emerald-500 ring-emerald-200"
                                 : ""
                             )}
                          />
                          {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                            <p className="text-[10px] text-red-500 font-bold">Les mots de passe ne correspondent pas</p>
                          )}
                       </div>
                    </div>

                    <button 
                      onClick={async () => {
                        const { newPassword, confirmPassword } = passwordData;
                        
                        if (!newPassword) return toast.error('Veuillez entrer un mot de passe');
                        if (newPassword !== confirmPassword) return toast.error('Les mots de passe ne correspondent pas');
                        if (newPassword.length < 6) return toast.error('Le mot de passe doit faire au moins 6 caractères');

                        setIsSaving(true);
                        try {
                          await api.patch(`/users/${user?.id}`, { password: newPassword });
                          toast.success('Mot de passe mis à jour avec succès');
                          setPasswordData({ newPassword: '', confirmPassword: '' });
                        } catch (error) {
                          toast.error('Erreur lors du changement de mot de passe');
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Mettre à jour mon accès
                    </button>
                 </div>

                 <div className="p-4 bg-muted/30 rounded-xl border border-dashed text-center">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Pour votre sécurité, nous vous recommandons d'utiliser un mot de passe unique contenant des caractères spéciaux.</p>
                 </div>
               </div>
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div>
                 <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <BellRing className="w-5 h-5" /> Préférences de Notification
                 </h3>
                 <p className="text-sm text-muted-foreground mt-1">Contrôlez la manière dont vous recevez les alertes système.</p>
               </div>

               <div className="grid gap-6 max-w-2xl">
                 <div className="flex items-center justify-between p-5 bg-background border rounded-2xl shadow-sm">
                    <div>
                       <h4 className="font-bold text-sm">Sons In-App</h4>
                       <p className="text-xs text-muted-foreground mt-1">Jouer un signal sonore lors de la réception d'une alerte urgente (Desktop/Mobile).</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.soundEnabled} onChange={(e) => { settings.setSoundEnabled(e.target.checked); toast.success('Préférence audio enregistrée'); }} />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </label>
                 </div>

                 <div className="flex items-center justify-between p-5 bg-background border rounded-2xl shadow-sm">
                    <div>
                       <h4 className="font-bold text-sm">Notifications Push (Navigateur)</h4>
                       <p className="text-xs text-muted-foreground mt-1">Recevoir une notification directe via le système d'exploitation.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.pushEnabled} onChange={async (e) => { 
                          if (e.target.checked) {
                             if (!('Notification' in window)) return toast.error('Non supporté sur cet appareil.');
                             const perm = await Notification.requestPermission();
                             if (perm !== 'granted') return toast.error('Permission refusée par le navigateur.');
                          }
                          settings.setPushEnabled(e.target.checked);
                          toast.success('Préférence push enregistrée');
                       }} />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </label>
                 </div>

                 <div className="flex items-center justify-between p-5 bg-background border rounded-2xl shadow-sm">
                    <div>
                       <h4 className="font-bold text-sm">Récapitulatif E-mail</h4>
                       <p className="text-xs text-muted-foreground mt-1">Recevoir un rapport par e-mail des nouvelles affectations. (Prochainement V2)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer opacity-70">
                      <input type="checkbox" className="sr-only peer" checked={settings.emailEnabled} onChange={(e) => { settings.setEmailEnabled(e.target.checked); toast.success('Préférence e-mail modifiée'); }} />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </label>
                 </div>
               </div>
            </div>
          )}

          {/* TAB: APPARENCE */}
          {activeTab === 'apparence' && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div>
                 <h3 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Palette className="w-5 h-5" /> Mode d'Affichage & Thème
                 </h3>
                 <p className="text-sm text-muted-foreground mt-1">Adaptez l'interface graphique à vos préférences visuelles.</p>
               </div>

               <div className="space-y-4 max-w-2xl">
                 <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Thème de l'Application</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                       onClick={() => settings.setTheme('light')}
                       className={cn(
                          "p-6 border-2 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all",
                          settings.theme === 'light' ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted"
                       )}
                    >
                       <div className="w-12 h-12 bg-white rounded-full border shadow-sm" />
                       <span className="font-bold text-sm">Mode Clair</span>
                    </button>
                    
                    <button 
                       onClick={() => settings.setTheme('dark')}
                       className={cn(
                          "p-6 border-2 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all",
                          settings.theme === 'dark' ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted"
                       )}
                    >
                       <div className="w-12 h-12 bg-black rounded-full border shadow-sm" />
                       <span className="font-bold text-sm">Mode Sombre</span>
                    </button>

                    <button 
                       onClick={() => settings.setTheme('system')}
                       className={cn(
                          "p-6 border-2 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all",
                          settings.theme === 'system' ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted"
                       )}
                    >
                       <div className="w-12 h-12 bg-gradient-to-tr from-black to-white rounded-full border shadow-sm" />
                       <span className="font-bold text-sm">Automatique (OS)</span>
                    </button>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      <ClientModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        client={selectedClient}
      />
    </div>
  );
}

function BackupList() {
  const { data: backupsData, isLoading: loading } = useBackups();
  const backups = backupsData || [];
  const deleteBackup = useDeleteBackup();

  const handleDownload = async (filename: string) => {
    try {
      const response = await api.get(`/backup/${filename}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm('Voulez-vous supprimer cette sauvegarde du serveur ?')) return;
    try {
      await deleteBackup.mutateAsync(filename);
      toast.success('Sauvegarde supprimée');
    } catch (err) {
      toast.error('Erreur de suppression');
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  if (backups.length === 0) return (
    <div className="p-12 text-center text-muted-foreground italic text-xs">
      Aucune sauvegarde disponible sur le serveur.
    </div>
  );

  return (
    <div className="divide-y">
      {backups.map((backup: any) => (
        <div key={backup.filename} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg text-primary">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-tight text-foreground">{backup.filename}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                {new Date(backup.createdAt).toLocaleString()} • {(backup.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <button 
               onClick={() => handleDownload(backup.filename)}
               className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all"
               title="Télécharger l'archive"
             >
                <CloudDownload className="w-4 h-4" />
             </button>
             <button 
               onClick={() => handleDelete(backup.filename)}
               className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"
               title="Effacer du serveur"
             >
                <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </div>
      ))}
    </div>
  );
}

