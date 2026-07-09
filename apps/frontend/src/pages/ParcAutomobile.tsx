import { useState } from 'react';
import {
  Car, Plus, Search, Download, Eye, Edit2,
  Fuel, Wrench, AlertTriangle, CheckCircle, MapPin,
  User, Calendar, BarChart3, Shield,
  TrendingUp, X,
  Navigation, Activity, Gauge, Trash2, Flag, QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeLabelModal } from '@/components/modals/QRCodeLabelModal';
import {
  useVehicles, useCreateVehicle, useDeleteVehicle,
  useFuelLogs, useCreateFuelLog, useDeleteFuelLog,
  useVehicleMissions, useCreateVehicleMission, useUpdateVehicleMission, useDeleteVehicleMission, useUsers
} from '@/hooks/useApi';
type VehicleStatus = 'DISPONIBLE' | 'EN_MISSION' | 'EN_MAINTENANCE' | 'HORS_SERVICE' | 'RESERVE';
type FuelType = 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE' | 'GPL';

interface Vehicle {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  couleur: string;
  fuelType: FuelType;
  status: VehicleStatus;
  kilometrage: number;
  prochainControleTech: string;
  prochainVidange: number; // km
  assuranceExpiry: string;
  visite_technique: string;
  driverId: number | null;
  driver?: { name: string; avatar: string | null; phone: string | null };
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  fuelBudgetMonthly: number;
  notes?: string;
}

interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  mileage: number;
  station: string;
}

interface Mission {
  id: string;
  vehicleId: string;
  driverId: number | null;
  driverUser?: { name: string; avatar: string | null };
  startDate: string;
  endDate?: string;
  departure: string;
  destination: string;
  purpose: string;
  kmStart: number;
  kmEnd?: number;
  status: 'EN_COURS' | 'TERMINEE' | 'PLANIFIEE';
}



const STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string; icon: any }> = {
  DISPONIBLE: { label: 'Disponible', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20', icon: CheckCircle },
  EN_MISSION: { label: 'En Mission', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20', icon: Navigation },
  EN_MAINTENANCE: { label: 'En Maintenance', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20', icon: Wrench },
  HORS_SERVICE: { label: 'Hors Service', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20', icon: AlertTriangle },
  RESERVE: { label: 'Réservé', color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20', icon: Shield },
};

const FUEL_COLOR: Record<FuelType, string> = {
  DIESEL: 'text-slate-700 bg-slate-100',
  ESSENCE: 'text-orange-600 bg-orange-100',
  ELECTRIQUE: 'text-emerald-600 bg-emerald-100',
  HYBRIDE: 'text-teal-600 bg-teal-100',
  GPL: 'text-blue-600 bg-blue-100',
};

function isExpiringSoon(dateStr: string) {
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff < 60;
}

function isExpired(dateStr: string) {
  return new Date(dateStr).getTime() < Date.now();
}

export function ParcAutomobile() {
  const { data: apiVehicles = [] } = useVehicles();
  const VEHICLES: Vehicle[] = apiVehicles as Vehicle[];

  const { data: apiFuelLogs = [] } = useFuelLogs();
  const FUEL_LOGS: FuelEntry[] = apiFuelLogs as FuelEntry[];

  const { data: apiMissions = [] } = useVehicleMissions();
  const MISSIONS: Mission[] = apiMissions as Mission[];

  const { data: USERS = [] } = useUsers();

  const [activeTab, setActiveTab] = useState<'flotte' | 'carburant' | 'missions' | 'alertes' | 'statistiques'>('flotte');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'TOUS'>('TOUS');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [qrModalVehicle, setQrModalVehicle] = useState<Vehicle | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { mutate: createVehicle, isPending: isCreating } = useCreateVehicle();
  const { mutate: deleteVehicle } = useDeleteVehicle();
  const { mutate: createFuelLog, isPending: isSavingFuel } = useCreateFuelLog();
  const { mutate: deleteFuelLog } = useDeleteFuelLog();
  const { mutate: createMission, isPending: isCreatingMission } = useCreateVehicleMission();
  const { mutate: updateMission } = useUpdateVehicleMission();
  const { mutate: deleteMission } = useDeleteVehicleMission();

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    immatriculation: '', marque: '', modele: '', annee: new Date().getFullYear(),
    couleur: '', fuelType: 'DIESEL', status: 'DISPONIBLE', kilometrage: 0,
    prochainControleTech: new Date().toISOString().split('T')[0], prochainVidange: 0,
    visite_technique: new Date().toISOString().split('T')[0],
    driverId: null, category: 'Berline', acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: 0, fuelBudgetMonthly: 0
  });

  const handleCreate = () => {
    createVehicle(formData as any, {
      onSuccess: () => {
        setIsAddOpen(false);
        setFormData({
          immatriculation: '', marque: '', modele: '', annee: new Date().getFullYear(),
          couleur: '', fuelType: 'DIESEL', status: 'DISPONIBLE', kilometrage: 0,
          prochainControleTech: new Date().toISOString().split('T')[0], prochainVidange: 0,
          visite_technique: new Date().toISOString().split('T')[0],
          driverId: null, category: 'Berline', acquisitionDate: new Date().toISOString().split('T')[0],
          acquisitionCost: 0, fuelBudgetMonthly: 0
        });
      }
    });
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Voulez-vous vraiment supprimer ce véhicule ?')) {
      deleteVehicle(Number(id));
    }
  };
  const [isAddMissionOpen, setIsAddMissionOpen] = useState(false);
  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);

  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    liters: '',
    pricePerLiter: '2.385',
    mileage: '',
    station: '',
  });

  const [missionForm, setMissionForm] = useState({
    vehicleId: '',
    driverId: null as number | null,
    purpose: '',
    departure: '',
    destination: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    kmStart: '',
  });

  const filtered = VEHICLES.filter(v => {
    const matchSearch = v.immatriculation.toLowerCase().includes(search.toLowerCase()) ||
      v.marque.toLowerCase().includes(search.toLowerCase()) ||
      v.modele.toLowerCase().includes(search.toLowerCase()) ||
      (v.driver?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'TOUS' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalKm = VEHICLES.reduce((s, v) => s + v.kilometrage, 0);
  const totalFuelCost = FUEL_LOGS.reduce((s, f) => s + f.totalCost, 0);
  const activeCount = VEHICLES.filter(v => v.status === 'DISPONIBLE' || v.status === 'EN_MISSION').length;
  const alertCount = VEHICLES.filter(v => isExpiringSoon(v.assuranceExpiry) || isExpiringSoon(v.visite_technique)).length;
  const totalFleetValue = VEHICLES.reduce((s, v) => s + v.acquisitionCost, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Car className="w-7 h-7 text-teal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">Gestion Parc Automobile</h1>
            <p className="text-sm text-muted-foreground">Suivi de la flotte véhicules, carburant, missions et conformité</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddFuelOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold text-sm hover:bg-muted transition-colors text-teal-600 border-teal-200"
          >
            <Fuel className="w-4 h-4" /> Saisir Carburant
          </button>
          <button
            onClick={() => setIsAddMissionOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold text-sm hover:bg-muted transition-colors"
          >
            <Navigation className="w-4 h-4" /> Nouvelle Mission
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 transition-all hover:scale-105 shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" /> Ajouter Véhicule
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Véhicules Flotte', value: VEHICLES.length, icon: Car, color: 'text-teal-500', bg: 'bg-teal-500/10', sub: 'Parc total' },
          { label: 'Opérationnels', value: activeCount, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sub: 'Dispos + En mission' },
          { label: 'Km Totaux Parcourus', value: `${(totalKm / 1000).toFixed(0)} k`, icon: Gauge, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'Cumul flotte' },
          { label: 'Coût Carburant (mois)', value: `${totalFuelCost.toFixed(0)} TND`, icon: Fuel, color: 'text-amber-500', bg: 'bg-amber-500/10', sub: 'Derniers 30 jours' },
          { label: 'Alertes Conformité', value: alertCount, icon: AlertTriangle, color: alertCount > 0 ? 'text-red-500' : 'text-green-500', bg: alertCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10', sub: 'Expirations proches' },
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
      <div className="flex gap-1 bg-muted/30 p-1 rounded-2xl w-fit overflow-x-auto">
        {([
          ['flotte', 'Flotte Véhicules'],
          ['carburant', 'Carburant'],
          ['missions', 'Missions'],
          ['alertes', 'Alertes'],
          ['statistiques', 'Statistiques'],
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

      {/* FLOTTE TAB */}
      {activeTab === 'flotte' && (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Immatriculation, marque, conducteur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-xl bg-background text-sm w-72 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-xl bg-background text-sm"
            >
              <option value="TOUS">Tous statuts</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Vehicle Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(vehicle => {
              const stat = STATUS_CONFIG[vehicle.status];
              const StatIcon = stat.icon;
              const assuranceWarning = isExpiringSoon(vehicle.assuranceExpiry);
              const vtWarning = isExpiringSoon(vehicle.visite_technique);
              const vidangeWarning = vehicle.kilometrage >= vehicle.prochainVidange - 2000;
              return (
                <div
                  key={vehicle.id}
                  className="bg-card rounded-3xl border shadow-sm p-6 flex flex-col gap-4 hover:shadow-lg transition-all hover:border-teal-500/30 group"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-primary px-2.5 py-1 bg-primary/10 rounded-lg border border-primary/20">
                          {vehicle.immatriculation}
                        </span>
                        <span className={cn('text-[9px] font-black px-2 py-1 rounded-lg', FUEL_COLOR[vehicle.fuelType])}>
                          {vehicle.fuelType}
                        </span>
                      </div>
                      <h3 className="text-lg font-black tracking-tight">{vehicle.marque} {vehicle.modele}</h3>
                      <p className="text-xs text-muted-foreground">{vehicle.annee} · {vehicle.couleur} · {vehicle.category}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Car className="w-6 h-6 text-teal-500" />
                    </div>
                  </div>

                  {/* Status */}
                  <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border', stat.color)}>
                    <StatIcon className="w-3.5 h-3.5" /> {stat.label}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-dashed">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Kilométrage</p>
                        <p className="text-xs font-black">{vehicle.kilometrage.toLocaleString()} km</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Conducteur</p>
                        <p className="text-xs font-bold truncate max-w-[80px]">{(vehicle.driver?.name || 'Non assigné').split(' ')[0]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className={cn('w-3.5 h-3.5', assuranceWarning ? 'text-red-500' : 'text-muted-foreground')} />
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Assurance</p>
                        <p className={cn('text-xs font-black', assuranceWarning ? 'text-red-500' : '')}>
                          {new Date(vehicle.assuranceExpiry).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={cn('w-3.5 h-3.5', vtWarning ? 'text-amber-500' : 'text-muted-foreground')} />
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Visite Tech.</p>
                        <p className={cn('text-xs font-black', vtWarning ? 'text-amber-500' : '')}>
                          {new Date(vehicle.visite_technique).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {(assuranceWarning || vtWarning || vidangeWarning) && (
                    <div className="space-y-1.5">
                      {assuranceWarning && (
                        <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <p className="text-[10px] font-black text-red-500">Assurance expire bientôt</p>
                        </div>
                      )}
                      {vtWarning && (
                        <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <p className="text-[10px] font-black text-amber-500">Visite technique à renouveler</p>
                        </div>
                      )}
                      {vidangeWarning && (
                        <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                          <Wrench className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <p className="text-[10px] font-black text-orange-500">Vidange à prévoir</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => setQrModalVehicle(vehicle)}
                      className="py-2 px-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-colors"
                      title="Imprimer QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedVehicle(vehicle)}
                      className="flex-1 py-2 bg-teal-500/10 text-teal-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Détails
                    </button>
                    <button className="py-2 px-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(vehicle.id)} className="py-2 px-3 bg-red-500/10 rounded-xl hover:bg-red-500 transition-colors group/delete">
                      <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover/delete:text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CARBURANT TAB */}
      {activeTab === 'carburant' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight">Journal Carburant</h3>
            <button
              onClick={() => setIsAddFuelOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Saisir Plein
            </button>
          </div>
          <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  {['Date', 'Véhicule', 'Conducteur', 'Litres', 'Prix/L', 'Coût Total', 'Km Compteur', 'Station'].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {FUEL_LOGS.map(entry => {
                  const vehicle = VEHICLES.find(v => String(v.id) === String(entry.vehicleId));
                  return (
                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 font-medium">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-4">
                        <p className="font-black text-primary">{vehicle?.immatriculation}</p>
                        <p className="text-xs text-muted-foreground">{vehicle?.marque} {vehicle?.modele}</p>
                      </td>
                      <td className="px-5 py-4 font-medium">{vehicle?.driver?.name || 'Non assigné'}</td>
                      <td className="px-5 py-4 font-bold">{entry.liters} L</td>
                      <td className="px-5 py-4 text-muted-foreground">{Number(entry.pricePerLiter).toFixed(3)} TND</td>
                      <td className="px-5 py-4 font-black text-emerald-600">{Number(entry.totalCost).toFixed(1)} TND</td>
                      <td className="px-5 py-4 font-medium">{Number(entry.mileage).toLocaleString()} km</td>
                      <td className="px-5 py-4 text-muted-foreground">{entry.station}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => deleteFuelLog(Number(entry.id))} className="p-1.5 hover:bg-red-100 rounded-lg text-muted-foreground hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/20 border-t font-black">
                <tr>
                  <td className="px-5 py-4 font-black" colSpan={3}>TOTAL</td>
                  <td className="px-5 py-4 font-black">{FUEL_LOGS.reduce((s, f) => s + Number(f.liters), 0).toFixed(1)} L</td>
                  <td />
                  <td className="px-5 py-4 font-black text-emerald-600">{FUEL_LOGS.reduce((s, f) => s + Number(f.totalCost), 0).toFixed(1)} TND</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* MISSIONS TAB */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight">Missions & Déplacements</h3>
            <button
              onClick={() => setIsAddMissionOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nouvelle Mission
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {MISSIONS.map(mission => {
              const vehicle = VEHICLES.find(v => String(v.id) === String(mission.vehicleId));
              const missionColors = {
                EN_COURS: 'border-blue-500/30 bg-blue-500/5',
                TERMINEE: 'border-emerald-500/30 bg-emerald-500/5',
                PLANIFIEE: 'border-amber-500/30 bg-amber-500/5',
              };
              const missionBadge = {
                EN_COURS: 'text-blue-600 bg-blue-100',
                TERMINEE: 'text-emerald-600 bg-emerald-100',
                PLANIFIEE: 'text-amber-600 bg-amber-100',
              };
              return (
                <div key={mission.id} className={cn('bg-card rounded-3xl border shadow-sm p-5 space-y-4', missionColors[mission.status])}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-black uppercase', missionBadge[mission.status])}>
                        {mission.status.replace('_', ' ')}
                      </span>
                      <h4 className="font-black mt-2">{mission.purpose}</h4>
                    </div>
                    <button
                      onClick={() => deleteMission(Number(mission.id))}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-muted-foreground">{mission.departure}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-bold">{mission.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{mission.driverUser?.name || 'Non assigné'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-teal-500 shrink-0" />
                      <span className="font-bold text-primary">{vehicle?.immatriculation}</span>
                      <span className="text-muted-foreground">{vehicle?.marque} {vehicle?.modele}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{new Date(mission.startDate).toLocaleDateString('fr-FR')}</span>
                      {mission.endDate && <><span>→</span><span>{new Date(mission.endDate).toLocaleDateString('fr-FR')}</span></>}
                    </div>
                    {mission.kmEnd && (
                      <div className="flex items-center gap-2 text-sm">
                        <Gauge className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-bold">{(Number(mission.kmEnd) - Number(mission.kmStart)).toLocaleString()} km parcourus</span>
                      </div>
                    )}
                  </div>
                  {mission.status === 'EN_COURS' && (
                    <button
                      onClick={() => updateMission({ id: Number(mission.id), data: { status: 'TERMINEE', endDate: new Date().toISOString() } })}
                      className="w-full py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <Flag className="w-3.5 h-3.5" /> Clôturer la Mission
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALERTES TAB */}
      {activeTab === 'alertes' && (
        <div className="space-y-4">
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Centre d'Alertes Conformité
          </h3>
          {VEHICLES.map(vehicle => {
            const assuranceWarn = isExpiringSoon(vehicle.assuranceExpiry);
            const assuranceExp = isExpired(vehicle.assuranceExpiry);
            const vtWarn = isExpiringSoon(vehicle.visite_technique);
            const vtExp = isExpired(vehicle.visite_technique);
            const vidangeWarn = vehicle.kilometrage >= vehicle.prochainVidange - 2000;
            const hasAlert = assuranceWarn || vtWarn || vidangeWarn;
            if (!hasAlert) return null;
            return (
              <div key={vehicle.id} className="bg-card rounded-3xl border shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <Car className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="font-black">{vehicle.immatriculation}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.marque} {vehicle.modele} · {vehicle.driver?.name || 'Non assigné'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(assuranceWarn || assuranceExp) && (
                    <div className={cn('flex items-center gap-3 p-3 rounded-2xl border', assuranceExp ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30')}>
                      <Shield className={cn('w-4 h-4 shrink-0', assuranceExp ? 'text-red-500' : 'text-amber-500')} />
                      <div>
                        <p className={cn('text-sm font-black', assuranceExp ? 'text-red-500' : 'text-amber-600')}>
                          {assuranceExp ? '🚨 Assurance EXPIRÉE' : '⚠️ Assurance expire bientôt'}
                        </p>
                        <p className="text-xs text-muted-foreground">Échéance: {new Date(vehicle.assuranceExpiry).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  )}
                  {(vtWarn || vtExp) && (
                    <div className={cn('flex items-center gap-3 p-3 rounded-2xl border', vtExp ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30')}>
                      <CheckCircle className={cn('w-4 h-4 shrink-0', vtExp ? 'text-red-500' : 'text-amber-500')} />
                      <div>
                        <p className={cn('text-sm font-black', vtExp ? 'text-red-500' : 'text-amber-600')}>
                          {vtExp ? '🚨 Visite Technique EXPIRÉE' : '⚠️ Visite technique à renouveler'}
                        </p>
                        <p className="text-xs text-muted-foreground">Échéance: {new Date(vehicle.visite_technique).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  )}
                  {vidangeWarn && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl border bg-orange-500/10 border-orange-500/30">
                      <Wrench className="w-4 h-4 shrink-0 text-orange-500" />
                      <div>
                        <p className="text-sm font-black text-orange-600">🔧 Vidange à planifier</p>
                        <p className="text-xs text-muted-foreground">
                          Km actuel: {vehicle.kilometrage.toLocaleString()} · Prochain: {vehicle.prochainVidange.toLocaleString()} km
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {VEHICLES.every(v => !isExpiringSoon(v.assuranceExpiry) && !isExpiringSoon(v.visite_technique) && v.kilometrage < v.prochainVidange - 2000) && (
            <div className="bg-card rounded-3xl border shadow-sm p-12 flex flex-col items-center text-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
              <p className="font-black uppercase tracking-widest">Aucune alerte active</p>
              <p className="text-sm mt-1">Tous les véhicules sont en conformité</p>
            </div>
          )}
        </div>
      )}

      {/* STATISTIQUES TAB */}
      {activeTab === 'statistiques' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-black tracking-tight mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-teal-500" /> Répartition par Statut</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = VEHICLES.filter(v => v.status === key).length;
                const StatIcon = cfg.icon;
                return (
                  <div key={key} className={cn('p-4 rounded-2xl border flex items-center gap-3', cfg.color)}>
                    <StatIcon className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-xl font-black">{count}</p>
                      <p className="text-[10px] font-black uppercase tracking-wider">{cfg.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-black tracking-tight mb-6 flex items-center gap-2"><Fuel className="w-5 h-5 text-amber-500" /> Consommation par Véhicule</h3>
            <div className="space-y-3">
              {VEHICLES.map(v => {
                const entries = FUEL_LOGS.filter(f => String(f.vehicleId) === String(v.id));
                const totalL = entries.reduce((s, f) => s + Number(f.liters), 0);
                const totalCost = entries.reduce((s, f) => s + Number(f.totalCost), 0);
                return (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold truncate">{v.immatriculation} — {v.marque}</span>
                        <span className="text-xs font-black text-amber-600">{totalL}L / {totalCost.toFixed(0)} TND</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${totalL > 0 ? Math.min(totalL / 1.2, 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-black tracking-tight mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-500" /> Valeur Totale Flotte</h3>
            <p className="text-4xl font-black text-primary">{totalFleetValue.toLocaleString()} TND</p>
            <p className="text-sm text-muted-foreground mt-1">Coût d'acquisition total du parc</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-muted/30">
                <p className="text-xs text-muted-foreground">Coût moyen/véhicule</p>
                <p className="text-lg font-black">{Math.round(totalFleetValue / Math.max(1, VEHICLES.length)).toLocaleString()} TND</p>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30">
                <p className="text-xs text-muted-foreground">Budget carburant/mois</p>
                <p className="text-lg font-black">{VEHICLES.reduce((s, v) => s + v.fuelBudgetMonthly, 0).toLocaleString()} TND</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-3xl border shadow-sm p-6">
            <h3 className="font-black tracking-tight mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-500" /> Kilométrage par Véhicule</h3>
            <div className="space-y-3">
              {[...VEHICLES].sort((a, b) => b.kilometrage - a.kilometrage).map(v => (
                <div key={v.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold">{v.immatriculation}</span>
                    <span className="text-xs font-black text-muted-foreground">{v.kilometrage.toLocaleString()} km</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-400 rounded-full"
                      style={{ width: `${(v.kilometrage / Math.max(...VEHICLES.map(x => x.kilometrage), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VEHICLE DETAIL MODAL */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex items-center justify-between bg-muted/20">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-500">{selectedVehicle.immatriculation}</p>
                <h3 className="text-xl font-black tracking-tight mt-0.5">{selectedVehicle.marque} {selectedVehicle.modele} {selectedVehicle.annee}</h3>
              </div>
              <button onClick={() => setSelectedVehicle(null)} className="p-2 hover:bg-muted rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Catégorie', value: selectedVehicle.category },
                  { label: 'Couleur', value: selectedVehicle.couleur },
                  { label: 'Carburant', value: selectedVehicle.fuelType },
                  { label: 'Statut', value: STATUS_CONFIG[selectedVehicle.status].label },
                  { label: 'Kilométrage', value: `${selectedVehicle.kilometrage.toLocaleString()} km` },
                  { label: 'Prochain Vidange', value: `${selectedVehicle.prochainVidange.toLocaleString()} km` },
                  { label: 'Assurance', value: new Date(selectedVehicle.assuranceExpiry).toLocaleDateString('fr-FR') },
                  { label: 'Visite Technique', value: new Date(selectedVehicle.visite_technique).toLocaleDateString('fr-FR') },
                  { label: 'Conducteur', value: selectedVehicle.driver?.name || 'Non assigné' },
                  { label: 'Téléphone', value: selectedVehicle.driver?.phone || 'Non renseigné' },
                  { label: 'Acquisition', value: new Date(selectedVehicle.acquisitionDate).toLocaleDateString('fr-FR') },
                  { label: 'Coût Acquisition', value: `${selectedVehicle.acquisitionCost.toLocaleString()} TND` },
                  { label: 'Budget Mensuel', value: `${selectedVehicle.fuelBudgetMonthly.toLocaleString()} TND` },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/20">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                    <p className="font-bold mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
              {selectedVehicle.notes && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs font-black uppercase text-amber-600 mb-1">Notes</p>
                  <p className="text-sm">{selectedVehicle.notes}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
              <button onClick={() => setSelectedVehicle(null)} className="px-4 py-2 text-sm font-bold rounded-xl border hover:bg-muted transition-colors">Fermer</button>
              <button className="px-4 py-2 text-sm font-bold rounded-xl bg-teal-500 text-white hover:bg-teal-600 flex items-center gap-2">
                <Download className="w-4 h-4" /> Fiche PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrModalVehicle && (
        <QRCodeLabelModal
          isOpen={!!qrModalVehicle}
          onClose={() => setQrModalVehicle(null)}
          title={`${qrModalVehicle.marque} ${qrModalVehicle.modele}`}
          subtitle={qrModalVehicle.category}
          qrValue={qrModalVehicle.immatriculation}
          assetType="VEHICLE"
          referenceId={qrModalVehicle.immatriculation}
        />
      )}

      {/* ADD VEHICLE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card border w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black tracking-tight">Ajouter un Véhicule</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-muted rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Immatriculation', placeholder: 'XXX TUN XXXX', type: 'text', key: 'immatriculation' },
                { label: 'Marque', placeholder: 'Toyota, Renault...', type: 'text', key: 'marque' },
                { label: 'Modèle', placeholder: 'Hilux, Clio...', type: 'text', key: 'modele' },
                { label: 'Année', placeholder: '2024', type: 'number', key: 'annee' },
                { label: 'Couleur', placeholder: 'Blanc, Gris...', type: 'text', key: 'couleur' },
                { label: 'Kilométrage actuel', placeholder: '0', type: 'number', key: 'kilometrage' },
                { label: 'Date Acquisition', placeholder: '', type: 'date', key: 'acquisitionDate' },
                { label: "Coût d'Acquisition (TND)", placeholder: '0', type: 'number', key: 'acquisitionCost' },
                { label: 'Assurance — Échéance', placeholder: '', type: 'date', key: 'assuranceExpiry' },
                { label: 'Visite Technique — Échéance', placeholder: '', type: 'date', key: 'visite_technique' },
                { label: 'Prochain Vidange (km)', placeholder: '10000', type: 'number', key: 'prochainVidange' },
                { label: 'Budget Carburant/mois (TND)', placeholder: '500', type: 'number', key: 'fuelBudgetMonthly' },
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
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Type Carburant</label>
                <select 
                  value={formData.fuelType}
                  onChange={e => setFormData({ ...formData, fuelType: e.target.value as any })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  <option value="DIESEL">DIESEL</option>
                  <option value="ESSENCE">ESSENCE</option>
                  <option value="ELECTRIQUE">ELECTRIQUE</option>
                  <option value="HYBRIDE">HYBRIDE</option>
                  <option value="GPL">GPL</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Catégorie</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  <option>Berline</option><option>SUV</option><option>Fourgon</option><option>Utilitaire</option><option>Camionnette</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Conducteur Affecté</label>
                <select 
                  value={formData.driverId || ''}
                  onChange={e => setFormData({ ...formData, driverId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none"
                >
                  <option value="">Aucun conducteur assigné</option>
                  {USERS.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsAddOpen(false)} className="px-5 py-2.5 border rounded-xl text-sm font-bold hover:bg-muted">Annuler</button>
              <button 
                onClick={handleCreate}
                disabled={isCreating}
                className="px-5 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> {isCreating ? 'Création...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD FUEL MODAL */}
      {isAddFuelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border w-full max-w-lg rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2"><Fuel className="w-5 h-5 text-amber-500" /> Saisir Plein Carburant</h3>
              <button onClick={() => setIsAddFuelOpen(false)} className="p-2 hover:bg-muted rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Véhicule</label>
                <select
                  value={fuelForm.vehicleId}
                  onChange={e => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {VEHICLES.map(v => <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Date</label>
                  <input type="date" value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Km Compteur</label>
                  <input type="number" placeholder="Ex: 87450" value={fuelForm.mileage} onChange={e => setFuelForm({ ...fuelForm, mileage: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Quantité (Litres)</label>
                  <input type="number" step="0.1" placeholder="Ex: 65" value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Prix / Litre (TND)</label>
                  <input type="number" step="0.001" placeholder="2.385" value={fuelForm.pricePerLiter} onChange={e => setFuelForm({ ...fuelForm, pricePerLiter: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Station Service</label>
                <input type="text" placeholder="Ex: Agil Sousse Nord" value={fuelForm.station} onChange={e => setFuelForm({ ...fuelForm, station: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              {fuelForm.liters && fuelForm.pricePerLiter && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-black text-amber-600 uppercase">Coût Total</span>
                  <span className="text-lg font-black text-amber-600">{(Number(fuelForm.liters) * Number(fuelForm.pricePerLiter)).toFixed(3)} TND</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsAddFuelOpen(false)} className="px-5 py-2.5 border rounded-xl text-sm font-bold hover:bg-muted">Annuler</button>
              <button
                onClick={() => {
                  if (!fuelForm.liters || !fuelForm.mileage) { alert('Veuillez remplir tous les champs obligatoires'); return; }
                  const totalCost = Number(fuelForm.liters) * Number(fuelForm.pricePerLiter);
                  createFuelLog({
                    vehicle: { connect: { id: Number(fuelForm.vehicleId) } },
                    date: new Date(fuelForm.date).toISOString(),
                    liters: Number(fuelForm.liters),
                    pricePerLiter: Number(fuelForm.pricePerLiter),
                    totalCost,
                    mileage: Number(fuelForm.mileage),
                    station: fuelForm.station || 'N/A',
                  }, {
                    onSuccess: () => {
                      setIsAddFuelOpen(false);
                      setFuelForm({ vehicleId: String(VEHICLES[0]?.id || ''), date: new Date().toISOString().split('T')[0], liters: '', pricePerLiter: '2.385', mileage: '', station: '' });
                    }
                  });
                }}
                disabled={isSavingFuel}
                className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 flex items-center gap-2 disabled:opacity-50"
              >
                <Fuel className="w-4 h-4" /> {isSavingFuel ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MISSION MODAL */}
      {isAddMissionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border w-full max-w-lg rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2"><Navigation className="w-5 h-5 text-blue-500" /> Nouvelle Mission</h3>
              <button onClick={() => setIsAddMissionOpen(false)} className="p-2 hover:bg-muted rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Véhicule</label>
                <select
                  value={missionForm.vehicleId}
                  onChange={e => setMissionForm({ ...missionForm, vehicleId: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {VEHICLES.filter(v => v.status === 'DISPONIBLE').map(v => <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>)}
                </select>
                <p className="text-[9px] text-muted-foreground mt-1">Seuls les véhicules disponibles sont affichés</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Conducteur</label>
                  <select
                    value={missionForm.driverId || ''}
                    onChange={e => setMissionForm({ ...missionForm, driverId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Sélectionner un conducteur</option>
                    {USERS.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Km Départ</label>
                  <input type="number" placeholder="Ex: 87450" value={missionForm.kmStart} onChange={e => setMissionForm({ ...missionForm, kmStart: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Départ</label>
                  <input type="text" placeholder="Ville / Adresse" value={missionForm.departure} onChange={e => setMissionForm({ ...missionForm, departure: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Destination</label>
                  <input type="text" placeholder="Ville / Adresse" value={missionForm.destination} onChange={e => setMissionForm({ ...missionForm, destination: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Date Départ</label>
                  <input type="date" value={missionForm.startDate} onChange={e => setMissionForm({ ...missionForm, startDate: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Retour Prévu</label>
                  <input type="date" value={missionForm.endDate} onChange={e => setMissionForm({ ...missionForm, endDate: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Objet de la Mission</label>
                <textarea rows={2} placeholder="Ex: Livraison équipements, Réunion client..." value={missionForm.purpose} onChange={e => setMissionForm({ ...missionForm, purpose: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsAddMissionOpen(false)} className="px-5 py-2.5 border rounded-xl text-sm font-bold hover:bg-muted">Annuler</button>
              <button
                onClick={() => {
                  if (!missionForm.driverId || !missionForm.destination) { alert('Veuillez remplir tous les champs obligatoires'); return; }
                  createMission({
                    vehicle: { connect: { id: Number(missionForm.vehicleId) } },
                    driver: { connect: { id: Number(missionForm.driverId) } },
                    purpose: missionForm.purpose || '',
                    departure: missionForm.departure || '',
                    destination: missionForm.destination,
                    startDate: new Date(missionForm.startDate).toISOString(),
                    endDate: missionForm.endDate ? new Date(missionForm.endDate).toISOString() : undefined,
                    kmStart: Number(missionForm.kmStart) || 0,
                    status: 'EN_COURS',
                  }, {
                    onSuccess: () => {
                      setIsAddMissionOpen(false);
                      setMissionForm({ vehicleId: String(VEHICLES[0]?.id || ''), driverId: null, purpose: '', departure: '', destination: '', startDate: new Date().toISOString().split('T')[0], endDate: '', kmStart: '' });
                    }
                  });
                }}
                disabled={isCreatingMission}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
              >
                <Navigation className="w-4 h-4" /> {isCreatingMission ? 'Création...' : 'Lancer Mission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
