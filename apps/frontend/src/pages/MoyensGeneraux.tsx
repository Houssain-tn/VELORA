import { useState } from 'react';
import {
  Package, Plus, Search, CheckCircle, Clock, AlertTriangle,
  Building2, Users, ShoppingBag, Clipboard, Wrench, Phone,
  Mail, MapPin, Star, Download, Eye, Edit2, X,
  BarChart3, Calendar, RefreshCw,
  Zap, Home, Coffee, Wifi, Truck, Shield, Trash2, User, QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeLabelModal } from '@/components/modals/QRCodeLabelModal';
import {
  useServiceRequests, useCreateServiceRequest, useDeleteServiceRequest,
  useSuppliers, useDeleteSupplier,
  useOfficeSupplies, useDeleteOfficeSupply,
  useCompanySpaces, useDeleteCompanySpace,
} from '@/hooks/useApi';

type ServiceStatus = 'EN_COURS' | 'RESOLU' | 'EN_ATTENTE' | 'ANNULE';
type ServiceCategory = 'NETTOYAGE' | 'SECURITE' | 'MAINTENANCE_BATIMENT' | 'IT' | 'TRANSPORT' | 'RESTAURATION' | 'AUTRE';
type SupplierType = 'NETTOYAGE' | 'SECURITE' | 'ELECTRICITE' | 'PLOMBERIE' | 'IT' | 'TRANSPORT' | 'RESTAURATION' | 'AUTRE';

interface ServiceRequest {
  id: string;
  reference: string;
  title: string;
  description: string;
  category: ServiceCategory;
  status: ServiceStatus;
  priority: 'FAIBLE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  requestedBy: string;
  department: string;
  location: string;
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  estimatedCost?: number;
}

interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  contractStatus: 'ACTIF' | 'EXPIRE' | 'EN_NEGOCIATION';
  contractExpiry?: string;
  monthlyBudget?: number;
  notes?: string;
}

interface Supply {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  supplier?: string;
  lastOrderDate?: string;
  unitCost?: number;
}

interface Space {
  id: string;
  name: string;
  type: 'BUREAU' | 'SALLE_REUNION' | 'PARKING' | 'ENTREPOT' | 'CAFETERIA' | 'AUTRE';
  capacity?: number;
  floor: string;
  status: 'DISPONIBLE' | 'OCCUPE' | 'EN_MAINTENANCE' | 'RESERVE';
  responsable?: string;
}

const MOCK_REQUESTS: ServiceRequest[] = [
  { id: '1', reference: 'MG-2026-0045', title: 'Nettoyage urgent salle de réunion R201', description: 'Suite à une réunion client, nettoyage approfondi nécessaire', category: 'NETTOYAGE', status: 'RESOLU', priority: 'HAUTE', requestedBy: 'Fatma Mansouri', department: 'Direction Commerciale', location: 'Salle R201 - 2ème étage', assignedTo: 'Société Propreté Plus', createdAt: '2026-06-03', resolvedAt: '2026-06-03', estimatedCost: 150 },
  { id: '2', reference: 'MG-2026-0044', title: 'Remplacement néons bureau Open Space', description: '4 néons défectueux dans la zone open space RDC', category: 'MAINTENANCE_BATIMENT', status: 'EN_COURS', priority: 'NORMALE', requestedBy: 'Ahmed Benali', department: 'DSI', location: 'Open Space RDC', assignedTo: 'Électricité Générale SARL', createdAt: '2026-06-02', estimatedCost: 320 },
  { id: '3', reference: 'MG-2026-0043', title: 'Fuite robinet toilettes femmes 1er étage', description: 'Robinet qui coule en permanence depuis 3 jours', category: 'MAINTENANCE_BATIMENT', status: 'EN_ATTENTE', priority: 'HAUTE', requestedBy: 'Secrétariat', department: 'Administration', location: 'Toilettes F - 1er étage', createdAt: '2026-06-01', estimatedCost: 200 },
  { id: '4', reference: 'MG-2026-0042', title: 'Commande fournitures bureau Juin 2026', description: 'Papier A4, stylos, cartouches imprimante, classeurs', category: 'AUTRE', status: 'RESOLU', priority: 'NORMALE', requestedBy: 'Administration', department: 'Administration', location: 'Stock Bureautique', createdAt: '2026-05-28', resolvedAt: '2026-05-30', estimatedCost: 850 },
  { id: '5', reference: 'MG-2026-0041', title: 'Dysfonctionnement climatiseur salle direction', description: 'Climatiseur ne refroidit plus suffisamment', category: 'MAINTENANCE_BATIMENT', status: 'EN_COURS', priority: 'URGENTE', requestedBy: 'Direction Générale', department: 'Direction', location: 'Bureau Direction - 3ème étage', assignedTo: 'Froid Confort Tunisie', createdAt: '2026-05-30', estimatedCost: 500 },
  { id: '6', reference: 'MG-2026-0040', title: 'Configuration accès WiFi visiteurs', description: 'Création réseau WiFi isolé pour les visiteurs et prestataires', category: 'IT', status: 'EN_ATTENTE', priority: 'FAIBLE', requestedBy: 'DSI', department: 'DSI', location: 'Accueil & Salles Réunion', createdAt: '2026-05-25', estimatedCost: 0 },
  { id: '7', reference: 'MG-2026-0039', title: 'Organisation déjeuner équipe commerciale', description: 'Réservation restaurant pour équipe de 12 personnes', category: 'RESTAURATION', status: 'RESOLU', priority: 'NORMALE', requestedBy: 'Direction Commerciale', department: 'Commerciale', location: 'Restaurant Externe', createdAt: '2026-05-20', resolvedAt: '2026-05-22', estimatedCost: 600 },
  { id: '8', reference: 'MG-2026-0038', title: "Transport équipements vers site Sfax", description: 'Camion pour transfert matériel électronique', category: 'TRANSPORT', status: 'EN_COURS', priority: 'HAUTE', requestedBy: 'Service Technique', department: 'Technique', location: 'Sousse → Sfax', assignedTo: 'Transport Express Tunisie', createdAt: '2026-05-28', estimatedCost: 750 },
];

const MOCK_SUPPLIERS: Supplier[] = [
  { id: '1', name: 'Propreté Plus SARL', type: 'NETTOYAGE', contactName: 'Riadh Souissi', phone: '+216 73 234 567', email: 'proprete.plus@gmail.com', address: 'Zone Industrielle Sousse', rating: 4.5, contractStatus: 'ACTIF', contractExpiry: '2026-12-31', monthlyBudget: 2500 },
  { id: '2', name: 'Électricité Générale SARL', type: 'ELECTRICITE', contactName: 'Kamel Trabelsi', phone: '+216 73 456 789', email: 'elec.generale@email.tn', address: 'Route de Tunis, Sousse', rating: 4.0, contractStatus: 'ACTIF', contractExpiry: '2026-09-30', monthlyBudget: 1200 },
  { id: '3', name: 'Froid Confort Tunisie', type: 'AUTRE', contactName: 'Sami Jabri', phone: '+216 73 567 890', email: 'froid.confort@email.tn', address: 'Khézama, Sousse', rating: 3.8, contractStatus: 'ACTIF', contractExpiry: '2026-06-30', monthlyBudget: 800 },
  { id: '4', name: 'Transport Express Tunisie', type: 'TRANSPORT', contactName: 'Mounir Belhaj', phone: '+216 71 234 567', email: 'transport.express@gmail.com', address: 'Tunis', rating: 4.2, contractStatus: 'EN_NEGOCIATION', monthlyBudget: 1500 },
  { id: '5', name: 'Security Pro Group', type: 'SECURITE', contactName: 'Tarek Hamdi', phone: '+216 73 789 012', email: 'security.pro@email.tn', address: 'Sahloul, Sousse', rating: 4.7, contractStatus: 'ACTIF', contractExpiry: '2027-01-31', monthlyBudget: 3500 },
  { id: '6', name: 'Restaurant Le Mistral', type: 'RESTAURATION', contactName: 'Hedi Chaabane', phone: '+216 73 890 123', email: 'lemistral@email.tn', address: 'Boulevard de la Corniche, Sousse', rating: 4.3, contractStatus: 'ACTIF', contractExpiry: '2026-12-31', monthlyBudget: 2000 },
];

const MOCK_SUPPLIES: Supply[] = [
  { id: '1', name: 'Papier A4 (Ramette 80g)', category: 'Bureautique', currentStock: 48, minStock: 20, unit: 'Ramettes', supplier: 'Bureau Plus', lastOrderDate: '2026-05-30', unitCost: 8.5 },
  { id: '2', name: 'Cartouche HP 304XL Noire', category: 'Impression', currentStock: 6, minStock: 10, unit: 'Unités', supplier: 'Tech Office', lastOrderDate: '2026-05-15', unitCost: 45 },
  { id: '3', name: 'Stylos Bic Cristal (Boîte 50)', category: 'Bureautique', currentStock: 8, minStock: 5, unit: 'Boîtes', supplier: 'Bureau Plus', lastOrderDate: '2026-04-20', unitCost: 12 },
  { id: '4', name: 'Produit Nettoyant Sol 5L', category: 'Nettoyage', currentStock: 25, minStock: 10, unit: 'Bidons', supplier: 'Hygiène Pro', lastOrderDate: '2026-05-20', unitCost: 18 },
  { id: '5', name: 'Eau Minérale (Pack 6x1.5L)', category: 'Restauration', currentStock: 4, minStock: 15, unit: 'Packs', supplier: 'Safia Distribution', lastOrderDate: '2026-06-01', unitCost: 6.5 },
  { id: '6', name: 'Café Grain (Kg)', category: 'Restauration', currentStock: 12, minStock: 5, unit: 'Kg', supplier: 'Café Arabica', lastOrderDate: '2026-05-25', unitCost: 28 },
  { id: '7', name: 'Serviettes Papier (Pack 200)', category: 'Nettoyage', currentStock: 30, minStock: 15, unit: 'Packs', supplier: 'Hygiène Pro', lastOrderDate: '2026-05-10', unitCost: 4.5 },
  { id: '8', name: 'Classeurs A4 (Lot 10)', category: 'Bureautique', currentStock: 3, minStock: 8, unit: 'Lots', supplier: 'Bureau Plus', lastOrderDate: '2026-04-15', unitCost: 22 },
];

const MOCK_SPACES: Space[] = [
  { id: '1', name: 'Salle Réunion R101', type: 'SALLE_REUNION', capacity: 12, floor: 'RDC', status: 'DISPONIBLE', responsable: 'Accueil' },
  { id: '2', name: 'Salle Réunion R201', type: 'SALLE_REUNION', capacity: 20, floor: '2ème', status: 'OCCUPE', responsable: 'Direction' },
  { id: '3', name: 'Bureau Direction Générale', type: 'BUREAU', capacity: 3, floor: '3ème', status: 'OCCUPE', responsable: 'DG' },
  { id: '4', name: 'Open Space Équipe Technique', type: 'BUREAU', capacity: 25, floor: 'RDC', status: 'DISPONIBLE', responsable: 'RH' },
  { id: '5', name: 'Parking Principal', type: 'PARKING', capacity: 30, floor: 'Ext.', status: 'DISPONIBLE', responsable: 'Sécurité' },
  { id: '6', name: 'Cafétéria Personnel', type: 'CAFETERIA', capacity: 40, floor: '1er', status: 'DISPONIBLE', responsable: 'Administration' },
  { id: '7', name: 'Local Technique / Serveurs', type: 'AUTRE', floor: 'RDC', status: 'RESERVE', responsable: 'DSI' },
  { id: '8', name: 'Entrepôt Matériel', type: 'ENTREPOT', floor: 'Sous-sol', status: 'DISPONIBLE', responsable: 'Logistique' },
];

const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; icon: any }> = {
  EN_COURS: { label: 'En Cours', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: RefreshCw },
  RESOLU: { label: 'Résolu', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle },
  EN_ATTENTE: { label: 'En Attente', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  ANNULE: { label: 'Annulé', color: 'text-slate-600 bg-slate-50 border-slate-200', icon: X },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  FAIBLE: { label: 'Faible', color: 'text-slate-600 bg-slate-100' },
  NORMALE: { label: 'Normale', color: 'text-blue-600 bg-blue-100' },
  HAUTE: { label: 'Haute', color: 'text-orange-600 bg-orange-100' },
  URGENTE: { label: 'Urgente', color: 'text-red-600 bg-red-100' },
};

const CAT_ICONS: Record<ServiceCategory, any> = {
  NETTOYAGE: Zap,
  SECURITE: Shield,
  MAINTENANCE_BATIMENT: Wrench,
  IT: Wifi,
  TRANSPORT: Truck,
  RESTAURATION: Coffee,
  AUTRE: Package,
};

const CAT_LABELS: Record<ServiceCategory, string> = {
  NETTOYAGE: 'Nettoyage', SECURITE: 'Sécurité', MAINTENANCE_BATIMENT: 'Maintenance Bât.',
  IT: 'Informatique', TRANSPORT: 'Transport', RESTAURATION: 'Restauration', AUTRE: 'Autre',
};

const SPACE_STATUS_CONFIG: Record<Space['status'], { color: string; label: string }> = {
  DISPONIBLE: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Disponible' },
  OCCUPE: { color: 'text-red-600 bg-red-50 border-red-200', label: 'Occupé' },
  EN_MAINTENANCE: { color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'En Maintenance' },
  RESERVE: { color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Réservé' },
};

const SPACE_ICONS: Record<Space['type'], any> = {
  BUREAU: Building2, SALLE_REUNION: Users, PARKING: Truck, ENTREPOT: Package,
  CAFETERIA: Coffee, AUTRE: Home,
};

export function MoyensGeneraux() {
  const { data: apiRequests = [] } = useServiceRequests();
  const REQUESTS: ServiceRequest[] = (apiRequests.length > 0 ? apiRequests : MOCK_REQUESTS) as ServiceRequest[];

  const { data: apiSuppliers = [] } = useSuppliers();
  const SUPPLIERS: Supplier[] = (apiSuppliers.length > 0 ? apiSuppliers : MOCK_SUPPLIERS) as Supplier[];

  const { data: apiSupplies = [] } = useOfficeSupplies();
  const SUPPLIES: Supply[] = (apiSupplies.length > 0 ? apiSupplies : MOCK_SUPPLIES) as Supply[];

  const { data: apiSpaces = [] } = useCompanySpaces();
  const SPACES: Space[] = (apiSpaces.length > 0 ? apiSpaces : MOCK_SPACES) as Space[];

  const [activeTab, setActiveTab] = useState<'demandes' | 'prestataires' | 'fournitures' | 'locaux' | 'tableau-bord'>('tableau-bord');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'TOUS'>('TOUS');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [qrModalSpace, setQrModalSpace] = useState<Space | null>(null);

  const { mutate: createRequest, isPending: isCreating } = useCreateServiceRequest();
  const { mutate: deleteRequest } = useDeleteServiceRequest();
  const { mutate: deleteSupplier } = useDeleteSupplier();
  const { mutate: deleteSupply } = useDeleteOfficeSupply();
  const { mutate: deleteSpace } = useDeleteCompanySpace();

  const [formData, setFormData] = useState<Partial<ServiceRequest>>({
    title: '', description: '', location: '', requestedBy: '', department: '',
    category: 'NETTOYAGE', priority: 'NORMALE', estimatedCost: 0, status: 'EN_ATTENTE'
  });

  const handleCreate = () => {
    createRequest(formData as any, {
      onSuccess: () => {
        setIsAddOpen(false);
        setFormData({
          title: '', description: '', location: '', requestedBy: '', department: '',
          category: 'NETTOYAGE', priority: 'NORMALE', estimatedCost: 0, status: 'EN_ATTENTE'
        });
      }
    });
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Voulez-vous vraiment supprimer cette demande ?')) {
      deleteRequest(Number(id));
    }
  };

  const filteredRequests = REQUESTS.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.reference.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'TOUS' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCount = REQUESTS.filter(r => r.status === 'EN_COURS' || r.status === 'EN_ATTENTE').length;
  const resolvedCount = REQUESTS.filter(r => r.status === 'RESOLU').length;
  const lowStockCount = SUPPLIES.filter(s => s.currentStock <= s.minStock).length;
  const activeSupplierCount = SUPPLIERS.filter(s => s.contractStatus === 'ACTIF').length;
  const totalMonthlyBudget = SUPPLIERS.reduce((sum, s) => sum + (s.monthlyBudget || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
            <Package className="w-7 h-7 text-lime-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">Moyens Généraux</h1>
            <p className="text-sm text-muted-foreground">Services généraux, prestataires, fournitures et gestion des locaux</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-lime-500 text-white rounded-xl font-bold text-sm hover:bg-lime-600 transition-all hover:scale-105 shadow-lg shadow-lime-500/20"
        >
          <Plus className="w-4 h-4" /> Nouvelle Demande
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Demandes Ouvertes', value: openCount, icon: Clipboard, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'En cours + En attente' },
          { label: 'Demandes Résolues', value: resolvedCount, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sub: 'Ce mois-ci' },
          { label: 'Prestataires Actifs', value: activeSupplierCount, icon: Users, color: 'text-lime-500', bg: 'bg-lime-500/10', sub: 'Sous contrat' },
          { label: 'Alertes Stock', value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? 'text-red-500' : 'text-green-500', bg: lowStockCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10', sub: 'Stock minimum atteint' },
          { label: 'Budget Prestataires', value: `${totalMonthlyBudget.toLocaleString()} TND`, icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10', sub: 'Mensuel contractuel' },
        ].map((kpi, i) => (
          <div key={i} className="bg-card rounded-3xl border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', kpi.bg)}>
              <kpi.icon className={cn('w-5 h-5', kpi.color)} />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight leading-tight">{kpi.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{kpi.label}</p>
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-2xl w-fit overflow-x-auto no-scrollbar">
        {([
          ['tableau-bord', 'Tableau de Bord'],
          ['demandes', 'Demandes de Service'],
          ['prestataires', 'Prestataires'],
          ['fournitures', 'Fournitures & Stock'],
          ['locaux', 'Locaux & Espaces'],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'shrink-0 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
              activeTab === tab ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TABLEAU DE BORD TAB */}
      {activeTab === 'tableau-bord' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Requests */}
          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-black tracking-tight mb-4 flex items-center gap-2"><Clipboard className="w-5 h-5 text-blue-500" /> Demandes Récentes</h3>
            <div className="space-y-3">
              {REQUESTS.slice(0, 5).map(req => {
                const stat = STATUS_CONFIG[req.status];
                const CatIcon = CAT_ICONS[req.category];
                return (
                  <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setSelectedRequest(req)}>
                    <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center shrink-0">
                      <CatIcon className="w-4 h-4 text-lime-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{req.title}</p>
                      <p className="text-[10px] text-muted-foreground">{req.reference} · {req.requestedBy}</p>
                    </div>
                    <span className={cn('shrink-0 px-2 py-1 rounded-lg text-[10px] font-black border', stat.color)}>{stat.label}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setActiveTab('demandes')} className="w-full mt-4 py-2.5 text-xs font-black uppercase tracking-widest text-lime-600 hover:bg-lime-500/5 rounded-2xl transition-colors border-2 border-dashed border-lime-500/20">
              Voir Toutes les Demandes →
            </button>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-black tracking-tight mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Alertes Stock Fournitures</h3>
            <div className="space-y-3">
              {SUPPLIES.filter(s => s.currentStock <= s.minStock).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl bg-red-500/5 border border-red-500/20">
                  <ShoppingBag className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">Stock: {s.currentStock} {s.unit} · Minimum: {s.minStock} {s.unit}</p>
                  </div>
                  <button className="shrink-0 px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black hover:bg-red-600 transition-colors">Commander</button>
                </div>
              ))}
              {SUPPLIES.filter(s => s.currentStock <= s.minStock).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold">Stock suffisant pour tous les articles</p>
                </div>
              )}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-black tracking-tight mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-purple-500" /> Demandes par Catégorie</h3>
            <div className="space-y-3">
              {Object.entries(CAT_LABELS).map(([key, label]) => {
                const count = REQUESTS.filter(r => r.category === key).length;
                const CatIcon = CAT_ICONS[key as ServiceCategory];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CatIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <span className="text-sm font-black">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-lime-500/60 rounded-full transition-all" style={{ width: `${(count / Math.max(REQUESTS.length, 1)) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supplier Ratings */}
          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-black tracking-tight mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Évaluation Prestataires</h3>
            <div className="space-y-3">
              {[...SUPPLIERS].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-black text-primary text-sm">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.type}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-black">{Number(s.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DEMANDES TAB */}
      {activeTab === 'demandes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Titre, référence, demandeur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-xl bg-background text-sm w-72 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-2 border rounded-xl bg-background text-sm">
              <option value="TOUS">Tous statuts</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div className="ml-auto flex gap-2">
              <button className="flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium hover:bg-muted transition-colors text-green-600 border-green-200">
                <Download className="w-4 h-4" /> Excel
              </button>
            </div>
          </div>

          <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  {['Référence / Titre', 'Catégorie', 'Priorité', 'Statut', 'Demandeur', 'Département', 'Date', 'Coût Est.', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRequests.map(req => {
                  const stat = STATUS_CONFIG[req.status];
                  const StatIcon = stat.icon;
                  const prio = PRIORITY_CONFIG[req.priority];
                  const CatIcon = CAT_ICONS[req.category];
                  return (
                    <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-black text-primary text-xs">{req.reference}</p>
                        <p className="font-medium mt-0.5">{req.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{req.location}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <CatIcon className="w-4 h-4 text-lime-500 shrink-0" />
                          <span className="text-xs font-medium">{CAT_LABELS[req.category]}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('px-2 py-1 rounded-lg text-[10px] font-black', prio.color)}>{prio.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border', stat.color)}>
                          <StatIcon className="w-3 h-3" /> {stat.label}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium">{req.requestedBy}</td>
                      <td className="px-5 py-4 text-muted-foreground">{req.department}</td>
                      <td className="px-5 py-4 text-muted-foreground">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-4 font-bold">{req.estimatedCost ? `${req.estimatedCost} TND` : '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedRequest(req)} className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setSelectedRequest(req)} className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground" title="Voir/Modifier">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(req.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors text-muted-foreground hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRESTATAIRES TAB */}
      {activeTab === 'prestataires' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {SUPPLIERS.map(supplier => {
            const isExpiring = supplier.contractExpiry && new Date(supplier.contractExpiry).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 60;
            return (
              <div key={supplier.id} className={cn('bg-card rounded-3xl border shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-all', isExpiring && 'border-amber-500/30')}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black tracking-tight">{supplier.name}</h4>
                    <span className="inline-block mt-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-lime-500/10 text-lime-600 border border-lime-500/20">{supplier.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black',
                      supplier.contractStatus === 'ACTIF' ? 'bg-emerald-100 text-emerald-600' :
                      supplier.contractStatus === 'EXPIRE' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    )}>
                      <div className={cn('w-1.5 h-1.5 rounded-full', supplier.contractStatus === 'ACTIF' ? 'bg-emerald-500' : supplier.contractStatus === 'EXPIRE' ? 'bg-red-500' : 'bg-amber-500')} />
                      {supplier.contractStatus}
                    </div>
                    <button
                      onClick={() => { if (confirm('Supprimer ce prestataire ?')) deleteSupplier(Number(supplier.id)); }}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm py-3 border-y border-dashed">
                  <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" /><span>{supplier.contactName}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" /><span>{supplier.phone}</span></div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><span className="truncate">{supplier.email}</span></div>
                  {supplier.contractExpiry && (
                    <div className="flex items-center gap-2">
                      <Calendar className={cn('w-3.5 h-3.5', isExpiring ? 'text-amber-500' : 'text-muted-foreground')} />
                      <span className={isExpiring ? 'text-amber-600 font-bold' : ''}>Contrat jusqu'au {new Date(supplier.contractExpiry).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={cn('w-4 h-4', s <= Math.round(Number(supplier.rating) || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground')} />
                      ))}
                      <span className="text-xs font-black ml-1">{(Number(supplier.rating) || 0).toFixed(1)}</span>
                    </div>
                    {supplier.monthlyBudget && (
                      <p className="text-xs text-muted-foreground">{supplier.monthlyBudget.toLocaleString()} TND/mois</p>
                    )}
                  </div>
                  {isExpiring && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-black text-amber-600">Renouveler</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOURNITURES TAB */}
      {activeTab === 'fournitures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight">Stock de Fournitures</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-lime-500 text-white rounded-xl text-sm font-bold hover:bg-lime-600">
              <Plus className="w-4 h-4" /> Nouvelle Commande
            </button>
          </div>
          <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  {['Article', 'Catégorie', 'Stock Actuel', 'Stock Min.', 'Unité', 'Fournisseur', 'Coût Unit.', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {SUPPLIES.map(s => {
                  const isLow = s.currentStock <= s.minStock;
                  const isCritical = s.currentStock < s.minStock * 0.5;
                  return (
                    <tr key={s.id} className={cn('hover:bg-muted/20 transition-colors', isLow && 'bg-red-500/5')}>
                      <td className="px-5 py-4 font-medium">{s.name}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-1 rounded bg-muted text-xs font-bold">{s.category}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('font-black', isCritical ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-foreground')}>
                          {s.currentStock}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{s.minStock}</td>
                      <td className="px-5 py-4 text-muted-foreground">{s.unit}</td>
                      <td className="px-5 py-4 text-muted-foreground">{s.supplier || '—'}</td>
                      <td className="px-5 py-4 font-bold">{s.unitCost ? `${s.unitCost} TND` : '—'}</td>
                      <td className="px-5 py-4">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black border border-red-200">
                            <AlertTriangle className="w-3 h-3" /> Critique
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Stock bas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black transition-all', isLow ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-muted hover:bg-muted/80 text-muted-foreground')}>
                            {isLow ? 'Commander' : 'Réappro.'}
                          </button>
                          <button
                            onClick={() => { if (confirm('Supprimer cet article ?')) deleteSupply(Number(s.id)); }}
                            className="p-1.5 hover:bg-red-100 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOCAUX TAB */}
      {activeTab === 'locaux' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight">Gestion des Espaces & Locaux</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-lime-500 text-white rounded-xl text-sm font-bold hover:bg-lime-600">
              <Plus className="w-4 h-4" /> Ajouter Espace
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SPACES.map(space => {
              const SpaceIcon = SPACE_ICONS[space.type];
              const statCfg = SPACE_STATUS_CONFIG[space.status];
              return (
                <div key={space.id} className="bg-card rounded-3xl border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
                        <SpaceIcon className="w-5 h-5 text-lime-500" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm leading-tight">{space.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{space.floor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2.5 py-1 rounded-xl text-[10px] font-black border', statCfg.color)}>{statCfg.label}</span>
                      <button
                        onClick={() => setQrModalSpace(space)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                        title="Imprimer QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Supprimer cet espace ?')) deleteSpace(Number(space.id)); }}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {space.capacity && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Capacité: <strong>{space.capacity} personnes</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Responsable: <strong className="text-foreground">{space.responsable || '—'}</strong></span>
                  </div>
                  {space.status === 'DISPONIBLE' && (
                    <button className="w-full py-2 bg-lime-500/10 text-lime-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-lime-500 hover:text-white transition-all border border-lime-500/20">
                      Réserver
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REQUEST DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex items-center justify-between bg-muted/20">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-lime-500">{selectedRequest.reference}</p>
                <h3 className="text-lg font-black tracking-tight mt-0.5">{selectedRequest.title}</h3>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-muted rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Catégorie', value: CAT_LABELS[selectedRequest.category] },
                  { label: 'Statut', value: STATUS_CONFIG[selectedRequest.status].label },
                  { label: 'Priorité', value: selectedRequest.priority },
                  { label: 'Demandeur', value: selectedRequest.requestedBy },
                  { label: 'Département', value: selectedRequest.department },
                  { label: 'Localisation', value: selectedRequest.location },
                  { label: 'Assigné à', value: selectedRequest.assignedTo || 'Non assigné' },
                  { label: 'Coût Estimé', value: selectedRequest.estimatedCost ? `${selectedRequest.estimatedCost} TND` : '—' },
                  { label: 'Date Création', value: new Date(selectedRequest.createdAt).toLocaleDateString('fr-FR') },
                  { label: 'Date Résolution', value: selectedRequest.resolvedAt ? new Date(selectedRequest.resolvedAt).toLocaleDateString('fr-FR') : '—' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/20">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                    <p className="font-bold mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
              <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 text-sm font-bold rounded-xl border hover:bg-muted">Fermer</button>
              <button className="px-4 py-2 text-sm font-bold rounded-xl bg-lime-500 text-white hover:bg-lime-600 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD REQUEST MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card border w-full max-w-lg rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black tracking-tight">Nouvelle Demande de Service</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-muted rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Titre de la Demande', type: 'text', placeholder: 'Décrivez brièvement le besoin', key: 'title' },
                { label: 'Localisation / Local', type: 'text', placeholder: 'Ex: Bureau 201, Salle de réunion...', key: 'location' },
                { label: 'Demandeur', type: 'text', placeholder: 'Votre nom', key: 'requestedBy' },
                { label: 'Département', type: 'text', placeholder: 'Votre département', key: 'department' },
                { label: 'Coût Estimé (TND)', type: 'number', placeholder: '0', key: 'estimatedCost' },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">{f.label}</label>
                  <input 
                    type={f.type} 
                    placeholder={f.placeholder} 
                    value={(formData as any)[f.key] || ''}
                    onChange={e => setFormData({ ...formData, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" 
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Catégorie</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Priorité</label>
                <select 
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Description Détaillée</label>
                <textarea 
                  rows={3} 
                  placeholder="Décrivez le problème ou le besoin en détail..." 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsAddOpen(false)} className="px-5 py-2.5 border rounded-xl text-sm font-bold hover:bg-muted">Annuler</button>
              <button 
                onClick={handleCreate}
                disabled={isCreating}
                className="px-5 py-2.5 bg-lime-500 text-white rounded-xl text-sm font-bold hover:bg-lime-600 flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> {isCreating ? 'Création...' : 'Soumettre Demande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE MODAL FOR SPACES */}
      {qrModalSpace && (
        <QRCodeLabelModal
          isOpen={!!qrModalSpace}
          onClose={() => setQrModalSpace(null)}
          title={qrModalSpace.name}
          subtitle={`Localisation: ${qrModalSpace.floor}`}
          qrValue={`SPACE-${qrModalSpace.id}`}
          assetType="OFFICE_SUPPLY"
          referenceId={`SP-${qrModalSpace.id}`}
        />
      )}
    </div>
  );
}
