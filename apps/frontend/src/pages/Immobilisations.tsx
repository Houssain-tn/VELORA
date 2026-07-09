import { useState } from 'react';
import {
  Building2, Plus, Search, Download, Eye, Edit2,
  Trash2, TrendingDown, DollarSign, Package, AlertTriangle,
  CheckCircle, BarChart3, ArrowUpRight,
  Calendar, User, Tag, Archive, RefreshCw, X, Save, QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImmobilisations, useCreateImmobilisation, useUpdateImmobilisation, useDeleteImmobilisation, useUsers } from '@/hooks/useApi';

import { QRCodeLabelModal } from '@/components/modals/QRCodeLabelModal';
import { ExportButton } from '@/components/ui/ExportButton';
type AssetCategory = 'INFORMATIQUE' | 'MOBILIER' | 'VEHICULE' | 'IMMOBILIER' | 'OUTILLAGE' | 'AUTRE';
type AssetStatus = 'EN_SERVICE' | 'EN_MAINTENANCE' | 'CEDE' | 'MISES_AU_REBUT' | 'EN_ATTENTE';
type AmortMethod = 'LINEAIRE' | 'DEGRESSIF';

interface FixedAsset {
  id: string;
  code: string;
  designation: string;
  category: AssetCategory;
  status: AssetStatus;
  acquisitionDate: string;
  acquisitionValue: number;
  residualValue: number;
  usefulLifeYears: number;
  amortMethod: AmortMethod;
  location: string;
  custodianId: number | null;
  custodianUser?: { name: string; avatar: string | null };
  supplier: string;
  invoiceRef: string;
  notes?: string;
  accumulatedDepreciation: number;
  netBookValue: number;
  currentYearDepreciation: number;
}


const CATEGORY_CONFIG: Record<AssetCategory, { label: string; color: string; icon: any }> = {
  INFORMATIQUE: { label: 'Informatique', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Package },
  MOBILIER: { label: 'Mobilier', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Package },
  VEHICULE: { label: 'Véhicule', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20', icon: Package },
  IMMOBILIER: { label: 'Immobilier', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: Building2 },
  OUTILLAGE: { label: 'Outillage', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', icon: Package },
  AUTRE: { label: 'Autre', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', icon: Package },
};

const STATUS_CONFIG: Record<AssetStatus, { label: string; color: string; icon: any }> = {
  EN_SERVICE: { label: 'En Service', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20', icon: CheckCircle },
  EN_MAINTENANCE: { label: 'En Maintenance', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20', icon: RefreshCw },
  CEDE: { label: 'Cédé', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20', icon: ArrowUpRight },
  MISES_AU_REBUT: { label: 'Mis au Rebut', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20', icon: Trash2 },
  EN_ATTENTE: { label: 'En Attente', color: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:border-slate-500/20', icon: AlertTriangle },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 0 }).format(amount);
}

function AmortizationBar({ percent }: { percent: number }) {
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', percent > 80 ? 'bg-red-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500')}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

export function Immobilisations() {
  const { data: apiAssets = [] } = useImmobilisations();
  const ASSETS: FixedAsset[] = apiAssets as FixedAsset[];

  const { data: USERS = [] } = useUsers();

  const { mutate: createAsset, isPending: isCreating } = useCreateImmobilisation();
  const { mutate: updateAsset, isPending: isUpdating } = useUpdateImmobilisation();
  const { mutate: deleteAsset } = useDeleteImmobilisation();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'TOUS'>('TOUS');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'TOUS'>('TOUS');
  const [activeTab, setActiveTab] = useState<'registre' | 'amortissement' | 'statistiques'>('registre');
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [qrModalAsset, setQrModalAsset] = useState<FixedAsset | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [formData, setFormData] = useState<Partial<FixedAsset>>({
    code: '', designation: '', acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionValue: 0, usefulLifeYears: 5, residualValue: 0,
    category: 'INFORMATIQUE', status: 'EN_SERVICE', amortMethod: 'LINEAIRE',
    location: '', custodianId: null, supplier: '', invoiceRef: '', accumulatedDepreciation: 0
  });
  const [editFormData, setEditFormData] = useState<Partial<FixedAsset>>({});

  const handleCreate = () => {
    createAsset(formData as any, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        setFormData({
          code: '', designation: '', acquisitionDate: new Date().toISOString().split('T')[0],
          acquisitionValue: 0, usefulLifeYears: 5, residualValue: 0,
          category: 'INFORMATIQUE', status: 'EN_SERVICE', amortMethod: 'LINEAIRE',
          location: '', custodianId: null, supplier: '', invoiceRef: '', accumulatedDepreciation: 0
        });
      }
    });
  };

  const handleEdit = (asset: FixedAsset) => {
    setEditingAsset(asset);
    setEditFormData({ ...asset });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!editingAsset) return;
    updateAsset({ id: Number(editingAsset.id), data: editFormData as any }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        setEditingAsset(null);
        setEditFormData({});
      }
    });
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Voulez-vous vraiment supprimer cet actif ?')) {
      deleteAsset(Number(id));
    }
  };



  const filtered = ASSETS.filter(a => {
    const matchSearch = a.designation.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      (a.custodianUser?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'TOUS' || a.category === categoryFilter;
    const matchStatus = statusFilter === 'TOUS' || a.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalGrossValue = ASSETS.reduce((s, a) => s + a.acquisitionValue, 0);
  const totalDepreciation = ASSETS.reduce((s, a) => s + a.accumulatedDepreciation, 0);
  const totalNetValue = ASSETS.reduce((s, a) => s + a.netBookValue, 0);
  const totalCurrentYear = ASSETS.reduce((s, a) => s + a.currentYearDepreciation, 0);
  const activeCount = ASSETS.filter(a => a.status === 'EN_SERVICE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">Gestion des Immobilisations</h1>
            <p className="text-sm text-muted-foreground">Registre des actifs, amortissements et plan comptable immobilisations</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-xl font-bold text-sm hover:bg-purple-600 transition-all hover:scale-105 shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" /> Nouvelle Immobilisation
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Valeur Brute Totale', value: formatCurrency(totalGrossValue), icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'Coût d\'acquisition' },
          { label: 'Amort. Cumulé', value: formatCurrency(totalDepreciation), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', sub: 'Dépréciation totale' },
          { label: 'Valeur Nette Comptable', value: formatCurrency(totalNetValue), icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sub: 'Valeur résiduelle' },
          { label: 'Dotation Exercice', value: formatCurrency(totalCurrentYear), icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10', sub: 'Amort. année en cours' },
          { label: 'Actifs en Service', value: activeCount, icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-500/10', sub: `Sur ${ASSETS.length} total` },
        ].map((kpi, i) => (
          <div key={i} className="bg-card rounded-3xl border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all group">
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
      <div className="flex gap-1 bg-muted/30 p-1 rounded-2xl w-fit">
        {([['registre', 'Registre des Actifs'], ['amortissement', 'Plan d\'Amortissement'], ['statistiques', 'Statistiques']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
              activeTab === tab ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'registre' && (
        <>
          {/* FILTERS */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Rechercher actif, code, responsable..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-xl bg-background text-sm w-72 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-xl bg-background text-sm focus:outline-none"
            >
              <option value="TOUS">Toutes catégories</option>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-xl bg-background text-sm focus:outline-none"
            >
              <option value="TOUS">Tous statuts</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div className="ml-auto flex gap-2">
              <ExportButton 
                data={filtered.map(a => ({
                  Code: a.code,
                  Désignation: a.designation,
                  Catégorie: CATEGORY_CONFIG[a.category]?.label || a.category,
                  Statut: STATUS_CONFIG[a.status]?.label || a.status,
                  Méthode: a.amortMethod,
                  'Valeur Brute (TND)': a.acquisitionValue,
                  'Amort. Cumulé (TND)': a.accumulatedDepreciation,
                  'VNC (TND)': a.netBookValue,
                  'Dotation N (TND)': a.currentYearDepreciation,
                }))}
                filename="Immobilisations_VELORA_PRO"
                pdfTargetId="immobilisations-table"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-card rounded-3xl border shadow-sm overflow-hidden hidden md:block" id="immobilisations-table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Code / Désignation</th>
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catégorie</th>
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</th>
                    <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valeur Brute</th>
                    <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amort. Cumulé</th>
                    <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">VNC</th>
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taux Amorti</th>
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Méthode</th>
                    <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(asset => {
                    const cat = CATEGORY_CONFIG[asset.category];
                    const stat = STATUS_CONFIG[asset.status];
                    const StatIcon = stat.icon;
                    const amortPercent = (asset.accumulatedDepreciation / asset.acquisitionValue) * 100;
                    return (
                      <tr key={asset.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-black text-primary text-xs">{asset.code}</p>
                          <p className="font-medium text-foreground mt-0.5">{asset.designation}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <User className="w-3 h-3" /> {asset.custodianUser?.name || 'Non assigné'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border', cat.color)}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border', stat.color)}>
                            <StatIcon className="w-3 h-3" />
                            {stat.label}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-bold">{formatCurrency(asset.acquisitionValue)}</td>
                        <td className="px-5 py-4 text-right font-bold text-red-500">{formatCurrency(asset.accumulatedDepreciation)}</td>
                        <td className="px-5 py-4 text-right font-black text-emerald-600">{formatCurrency(asset.netBookValue)}</td>
                        <td className="px-5 py-4 min-w-[120px]">
                          <div className="space-y-1">
                            <AmortizationBar percent={amortPercent} />
                            <p className="text-[10px] font-black text-muted-foreground">{amortPercent.toFixed(1)}%</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('px-2 py-1 rounded text-[9px] font-black uppercase', asset.amortMethod === 'LINEAIRE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')}>
                            {asset.amortMethod === 'LINEAIRE' ? 'Linéaire' : 'Dégressif'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setQrModalAsset(asset)}
                              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-all"
                              title="Imprimer QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedAsset(asset)}
                              className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(asset)}
                              className="p-2 hover:bg-purple-50 rounded-xl transition-colors text-muted-foreground hover:text-purple-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(asset.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors text-muted-foreground hover:text-red-600">
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

          {/* MOBILE CARDS VIEW */}
          <div className="md:hidden space-y-4 pb-24">
            {filtered.map(asset => {
              const cat = CATEGORY_CONFIG[asset.category];
              const stat = STATUS_CONFIG[asset.status];
              const StatIcon = stat.icon;
              const amortPercent = (asset.accumulatedDepreciation / asset.acquisitionValue) * 100;
              return (
                <div key={asset.id} className="bg-card border rounded-[2rem] p-5 space-y-4 shadow-xl relative overflow-hidden">
                  <div className={cn("absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none", cat.color.replace('text-', 'bg-'))} />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-primary text-[10px] tracking-widest uppercase">{asset.code}</p>
                      <h3 className="font-black text-lg leading-tight mt-1">{asset.designation}</h3>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setSelectedAsset(asset)} className="w-10 h-10 flex items-center justify-center text-primary bg-primary/10 rounded-2xl active:scale-90 transition-transform">
                         <Eye className="w-5 h-5" />
                       </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={cn('px-2.5 py-1 rounded-xl text-[9px] font-black uppercase border', cat.color)}>{cat.label}</span>
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase border', stat.color)}>
                      <StatIcon className="w-3 h-3" /> {stat.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-dashed">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Valeur Brute</p>
                      <p className="font-bold text-sm">{formatCurrency(asset.acquisitionValue)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">VNC</p>
                      <p className="font-black text-emerald-600 text-sm">{formatCurrency(asset.netBookValue)}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                      <span>Amortissement ({asset.amortMethod === 'LINEAIRE' ? 'Lin.' : 'Dég.'})</span>
                      <span>{amortPercent.toFixed(1)}%</span>
                    </div>
                    <AmortizationBar percent={amortPercent} />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                       <User className="w-3 h-3" /> {asset.custodianUser?.name || 'Non assigné'}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(asset)} className="p-2 bg-muted rounded-xl hover:bg-muted/80">
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'amortissement' && (
        <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-black tracking-tight">Plan d'Amortissement Général</h3>
            <p className="text-sm text-muted-foreground mt-1">Projection des dotations aux amortissements sur la durée de vie des actifs</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Immobilisation</th>
                  <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valeur Brute</th>
                  <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date Acq.</th>
                  <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Durée (ans)</th>
                  <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tx Annuel</th>
                  <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dotation N</th>
                  <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amort. Cumulé</th>
                  <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">VNC</th>
                  <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avancement</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ASSETS.filter(a => a.status !== 'MISES_AU_REBUT').map(asset => {
                  const rate = (1 / asset.usefulLifeYears) * 100;
                  const amortPercent = (asset.accumulatedDepreciation / asset.acquisitionValue) * 100;
                  return (
                    <tr key={asset.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-black text-[11px] text-primary">{asset.code}</p>
                        <p className="text-sm font-medium">{asset.designation}</p>
                      </td>
                      <td className="px-5 py-4 text-right font-bold">{formatCurrency(asset.acquisitionValue)}</td>
                      <td className="px-5 py-4 text-right text-muted-foreground">{new Date(asset.acquisitionDate).getFullYear()}</td>
                      <td className="px-5 py-4 text-right font-bold">{asset.usefulLifeYears} ans</td>
                      <td className="px-5 py-4 text-right font-bold text-blue-500">{rate.toFixed(2)}%</td>
                      <td className="px-5 py-4 text-right font-bold text-amber-600">{formatCurrency(asset.currentYearDepreciation)}</td>
                      <td className="px-5 py-4 text-right font-bold text-red-500">{formatCurrency(asset.accumulatedDepreciation)}</td>
                      <td className="px-5 py-4 text-right font-black text-emerald-600">{formatCurrency(asset.netBookValue)}</td>
                      <td className="px-5 py-4 min-w-[150px]">
                        <div className="space-y-1">
                          <AmortizationBar percent={amortPercent} />
                          <p className="text-[10px] font-bold text-muted-foreground">{amortPercent.toFixed(1)}% amorti</p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/20 border-t-2 font-black">
                <tr>
                  <td className="px-5 py-4 font-black uppercase tracking-wider text-sm" colSpan={1}>TOTAUX GÉNÉRAUX</td>
                  <td className="px-5 py-4 text-right font-black">{formatCurrency(totalGrossValue)}</td>
                  <td colSpan={3} />
                  <td className="px-5 py-4 text-right font-black text-amber-600">{formatCurrency(totalCurrentYear)}</td>
                  <td className="px-5 py-4 text-right font-black text-red-500">{formatCurrency(totalDepreciation)}</td>
                  <td className="px-5 py-4 text-right font-black text-emerald-600">{formatCurrency(totalNetValue)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'statistiques' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category breakdown */}
          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-black tracking-tight mb-6 flex items-center gap-2"><Tag className="w-5 h-5 text-purple-500" /> Répartition par Catégorie</h3>
            <div className="space-y-4">
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                const assets = ASSETS.filter(a => a.category === key);
                const val = assets.reduce((s, a) => s + a.acquisitionValue, 0);
                const pct = totalGrossValue > 0 ? (val / totalGrossValue) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-black border', cfg.color)}>{cfg.label}</span>
                        <span className="text-xs text-muted-foreground">{assets.length} actif{assets.length > 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-sm font-black">{formatCurrency(val)} <span className="text-muted-foreground font-medium">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Status breakdown */}
          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-black tracking-tight mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500" /> Répartition par Statut</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = ASSETS.filter(a => a.status === key).length;
                const StatIcon = cfg.icon;
                return (
                  <div key={key} className="p-4 rounded-2xl bg-muted/30 border flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', cfg.color)}>
                      <StatIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-black">{count}</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{cfg.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-black text-emerald-600 mb-1">Taux de Capitalisation</p>
              <p className="text-3xl font-black text-emerald-600">{((totalNetValue / totalGrossValue) * 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">VNC / Valeur brute totale</p>
            </div>
          </div>
          {/* Biggest assets */}
          <div className="bg-card rounded-3xl border shadow-sm p-6 lg:col-span-2">
            <h3 className="font-black tracking-tight mb-6 flex items-center gap-2"><Archive className="w-5 h-5 text-amber-500" /> Top Actifs par Valeur Nette</h3>
            <div className="space-y-3">
              {[...ASSETS].sort((a, b) => b.netBookValue - a.netBookValue).slice(0, 5).map((a, idx) => (
                <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-black text-primary">#{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{a.designation}</p>
                    <p className="text-[10px] text-muted-foreground">{CATEGORY_CONFIG[a.category].label} • {a.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600">{formatCurrency(a.netBookValue)}</p>
                    <p className="text-[10px] text-muted-foreground">VNC</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ASSET DETAIL MODAL */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex items-center justify-between bg-muted/20">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">{selectedAsset.code}</p>
                <h3 className="text-xl font-black tracking-tight mt-0.5">{selectedAsset.designation}</h3>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="p-2 hover:bg-muted rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Catégorie', value: CATEGORY_CONFIG[selectedAsset.category].label },
                  { label: 'Statut', value: STATUS_CONFIG[selectedAsset.status].label },
                  { label: 'Date d\'Acquisition', value: new Date(selectedAsset.acquisitionDate).toLocaleDateString('fr-FR') },
                  { label: 'Méthode', value: selectedAsset.amortMethod === 'LINEAIRE' ? 'Linéaire' : 'Dégressif' },
                  { label: 'Durée d\'Amortissement', value: `${selectedAsset.usefulLifeYears} ans` },
                  { label: 'Fournisseur', value: selectedAsset.supplier },
                  { label: 'Réf. Facture', value: selectedAsset.invoiceRef },
                  { label: 'Responsable', value: selectedAsset.custodianUser?.name || 'Non assigné' },
                  { label: 'Localisation', value: selectedAsset.location },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/20">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                    <p className="font-bold mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <p className="text-2xl font-black text-blue-600">{formatCurrency(selectedAsset.acquisitionValue)}</p>
                  <p className="text-[10px] font-black uppercase text-blue-500 mt-1">Valeur Brute</p>
                </div>
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-2xl font-black text-red-600">{formatCurrency(selectedAsset.accumulatedDepreciation)}</p>
                  <p className="text-[10px] font-black uppercase text-red-500 mt-1">Amort. Cumulé</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-2xl font-black text-emerald-600">{formatCurrency(selectedAsset.netBookValue)}</p>
                  <p className="text-[10px] font-black uppercase text-emerald-500 mt-1">VNC</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Taux d'Amortissement</p>
                <AmortizationBar percent={(selectedAsset.accumulatedDepreciation / selectedAsset.acquisitionValue) * 100} />
                <p className="text-xs text-muted-foreground mt-1">{((selectedAsset.accumulatedDepreciation / selectedAsset.acquisitionValue) * 100).toFixed(1)}% amorti</p>
              </div>
            </div>
            <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
              <button onClick={() => setSelectedAsset(null)} className="px-4 py-2 text-sm font-bold rounded-xl border hover:bg-muted transition-colors">Fermer</button>
              <button className="px-4 py-2 text-sm font-bold rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" /> Fiche PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrModalAsset && (
        <QRCodeLabelModal
          isOpen={!!qrModalAsset}
          onClose={() => setQrModalAsset(null)}
          title={qrModalAsset.designation}
          subtitle={CATEGORY_CONFIG[qrModalAsset.category]?.label || qrModalAsset.category}
          qrValue={qrModalAsset.code}
          assetType="FIXED_ASSET"
          referenceId={qrModalAsset.code}
        />
      )}

      {/* ADD MODAL placeholder */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card border w-full max-w-2xl rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black tracking-tight">Nouvelle Immobilisation</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-muted rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Code Immobilisation', placeholder: 'IMM-2026-XXX', type: 'text', key: 'code' },
                { label: 'Désignation', placeholder: 'Ex: Serveur Dell...', type: 'text', key: 'designation' },
                { label: 'Date d\'Acquisition', placeholder: '', type: 'date', key: 'acquisitionDate' },
                { label: 'Valeur d\'Acquisition (TND)', placeholder: '0.000', type: 'number', key: 'acquisitionValue' },
                { label: 'Durée d\'Amortissement (ans)', placeholder: '5', type: 'number', key: 'usefulLifeYears' },
                { label: 'Valeur Résiduelle (TND)', placeholder: '0', type: 'number', key: 'residualValue' },
                { label: 'Fournisseur', placeholder: 'Nom du fournisseur', type: 'text', key: 'supplier' },
                { label: 'Réf. Facture', placeholder: 'INV-XXXX', type: 'text', key: 'invoiceRef' },
                { label: 'Localisation', placeholder: 'Bureau, salle, bâtiment...', type: 'text', key: 'location' },
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
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Responsable / Gardien</label>
                <select 
                  value={formData.custodianId || ''}
                  onChange={e => setFormData({ ...formData, custodianId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  <option value="">Aucun responsable assigné</option>
                  {USERS.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Catégorie</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Méthode d'Amortissement</label>
                <select 
                  value={formData.amortMethod}
                  onChange={e => setFormData({ ...formData, amortMethod: e.target.value as any })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  <option value="LINEAIRE">Linéaire</option>
                  <option value="DEGRESSIF">Dégressif</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 border rounded-xl text-sm font-bold hover:bg-muted">Annuler</button>
              <button 
                onClick={handleCreate}
                disabled={isCreating}
                className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold hover:bg-purple-600 flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> {isCreating ? 'En cours...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black tracking-tight">Modifier l'Immobilisation</h3>
                <p className="text-xs text-primary font-bold mt-0.5">{editingAsset.code}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-muted rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Code Immobilisation', type: 'text', key: 'code' },
                { label: 'Désignation', type: 'text', key: 'designation' },
                { label: "Date d'Acquisition", type: 'date', key: 'acquisitionDate' },
                { label: "Valeur d'Acquisition (TND)", type: 'number', key: 'acquisitionValue' },
                { label: "Durée d'Amortissement (ans)", type: 'number', key: 'usefulLifeYears' },
                { label: 'Valeur Résiduelle (TND)', type: 'number', key: 'residualValue' },
                { label: 'Amort. Cumulé (TND)', type: 'number', key: 'accumulatedDepreciation' },
                { label: 'Fournisseur', type: 'text', key: 'supplier' },
                { label: 'Réf. Facture', type: 'text', key: 'invoiceRef' },
                { label: 'Localisation', type: 'text', key: 'location' },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(editFormData as any)[f.key] || ''}
                    onChange={e => setEditFormData({ ...editFormData, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Responsable / Gardien</label>
                <select
                  value={editFormData.custodianId || ''}
                  onChange={e => setEditFormData({ ...editFormData, custodianId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  <option value="">Aucun responsable assigné</option>
                  {USERS.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Catégorie</label>
                <select
                  value={editFormData.category}
                  onChange={e => setEditFormData({ ...editFormData, category: e.target.value as any })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Statut</label>
                <select
                  value={editFormData.status}
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Méthode d'Amortissement</label>
                <select
                  value={editFormData.amortMethod}
                  onChange={e => setEditFormData({ ...editFormData, amortMethod: e.target.value as any })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  <option value="LINEAIRE">Linéaire</option>
                  <option value="DEGRESSIF">Dégressif</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 border rounded-xl text-sm font-bold hover:bg-muted">Annuler</button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold hover:bg-purple-600 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {isUpdating ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
