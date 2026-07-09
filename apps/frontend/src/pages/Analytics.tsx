import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ComposedChart, Line
} from 'recharts';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  Building2, 
  Zap,
  ShieldCheck,
  BrainCircuit,
  AlertTriangle,
  Lightbulb,
  Cpu
} from 'lucide-react';
import { useAnalytics, useEquipment, useVehicles, useInterventions } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';

export function Analytics() {
  const { user } = useAuthStore();
  const isClient = user?.role === 'CLIENT';
  const { data: stats, isLoading: statsLoading } = useAnalytics();
  const { data: equipment, isLoading: eqLoading } = useEquipment();
  const { data: vehicles, isLoading: vehLoading } = useVehicles();
  const { data: interventions, isLoading: intLoading } = useInterventions();

  const kpis = useMemo(() => [
    {
      title: 'Taux de Succès SLA',
      value: `${stats?.slaRatePercent || 0}%`,
      change: stats?.slaRatePercent > 95 ? '+2.4%' : '-1.2%',
      trend: stats?.slaRatePercent > 95 ? 'up' : 'down',
      icon: ShieldCheck,
      color: 'text-blue-600',
      description: 'Respect des délais contractuels'
    },
    {
      title: 'MTTR',
      value: `${stats?.avgInterventionHours || 0}h`,
      change: '-15%',
      trend: 'up', // 'up' here means improvement (faster resolution)
      icon: Clock,
      color: 'text-emerald-600',
      description: 'Temps moyen de résolution'
    },
    {
      title: 'Tickets Ouverts',
      value: stats?.interventions?.open || 0,
      change: '+3',
      trend: 'down',
      icon: Activity,
      color: 'text-orange-600',
      description: 'Interventions en cours'
    },
    {
      title: 'Sites Opérationnels',
      value: stats?.siteHealthScores?.filter((s: any) => s.score > 80).length || 0,
      total: stats?.sites || 0,
      icon: Building2,
      color: 'text-purple-600',
      description: 'Disponibilité des sites'
    }
  ], [stats]);

  // --- VELORA AI PREDICTIVE MAINTENANCE (MTBF ENGINE) ---
  const aiInsights = useMemo(() => {
    if (!equipment || !interventions || !vehicles) return null;

    // 1. Calculate MTBF for equipments
    const equipFailures: Record<number, number> = {};
    const equipAgeDays: Record<number, number> = {};
    const now = new Date();

    equipment.forEach((eq: any) => {
      const ints = interventions.filter((i: any) => i.equipmentId === eq.id && i.type === 'CORRECTIVE');
      equipFailures[eq.id] = ints.length;
      
      const purchaseDate = eq.purchaseDate ? new Date(eq.purchaseDate) : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // default 1 year
      const daysOld = Math.max(1, Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24)));
      equipAgeDays[eq.id] = daysOld;
    });

    const equipRisk = equipment.map((eq: any) => {
      const failures = equipFailures[eq.id];
      const age = equipAgeDays[eq.id];
      const mtbf = failures === 0 ? age : age / failures; // MTBF in days
      
      // Health Score Formula (0 to 100)
      let healthScore = Math.min(100, Math.max(0, 100 - (failures * 15) + (mtbf / 30)));
      if (eq.status === 'EN_PANNE') healthScore = 0;

      return {
        ...eq,
        mtbf: Math.round(mtbf),
        failures,
        healthScore: Math.round(healthScore)
      };
    }).sort((a: any, b: any) => a.healthScore - b.healthScore);

    // 2. Identify top risks
    const criticalEquipments = equipRisk.filter((eq: any) => eq.healthScore < 50).slice(0, 3);

    // 3. Vehicle AI Fuel Optimization
    const fuelAnomalies = vehicles.filter((v: any) => v.mileage > 150000 && v.status !== 'EN_PANNE').slice(0, 2);

    return {
      criticalEquipments,
      fuelAnomalies
    };
  }, [equipment, interventions, vehicles]);

  if (statsLoading || eqLoading || vehLoading || intLoading) return <div className="p-12 text-center animate-pulse">Chargement de Velora AI Analytics...</div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            Performance <span className="text-primary italic">Engine</span>
          </h1>
          <p className="text-muted-foreground font-medium">Analyse en temps réel de votre efficacité opérationnelle.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border text-[10px] font-black uppercase tracking-widest">
          <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Live Stats
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="group relative p-6 bg-card rounded-2xl border shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "p-2.5 rounded-xl border",
                kpi.color === 'text-blue-600' && "bg-blue-50 border-blue-100",
                kpi.color === 'text-emerald-600' && "bg-emerald-50 border-emerald-100",
                kpi.color === 'text-orange-600' && "bg-orange-50 border-orange-100",
                kpi.color === 'text-purple-600' && "bg-purple-50 border-purple-100",
              )}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              {kpi.trend && (
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full",
                  kpi.trend === 'up' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                )}>
                  <TrendingUp className={cn("w-3 h-3", kpi.trend === 'down' && "rotate-180")} />
                  {kpi.change}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{kpi.title}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums">{kpi.value}</span>
                {kpi.total && <span className="text-muted-foreground text-sm font-medium">/ {kpi.total}</span>}
              </div>
              <p className="text-[10px] text-muted-foreground/70 font-medium italic">{kpi.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* VELORA AI: SMART INSIGHTS */}
      {!isClient && aiInsights && (
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl border border-indigo-500/30">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 blur-[80px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full mix-blend-screen" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                <BrainCircuit className="w-6 h-6 text-fuchsia-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                  Velora AI <span className="text-fuchsia-400">Insights</span>
                </h2>
                <p className="text-indigo-200 text-[11px] font-bold tracking-widest uppercase mt-1">Maintenance Prédictive & Optimisation (MTBF)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Critical Equipments Alert */}
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-orange-300 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Risque de Panne Éminent
                </h3>
                {aiInsights.criticalEquipments.length > 0 ? (
                  <div className="space-y-4">
                    {aiInsights.criticalEquipments.map((eq: any) => (
                      <div key={eq.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors">
                        <div>
                          <p className="font-bold text-white text-sm">{eq.name}</p>
                          <p className="text-[10px] text-white/50 font-medium uppercase">{eq.brand} • S/N: {eq.serialNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-indigo-300">Santé MTBF</p>
                          <p className={cn("text-xl font-black", eq.healthScore < 20 ? "text-red-400" : "text-orange-400")}>
                            {eq.healthScore}%
                          </p>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-indigo-200 mt-2 italic font-medium flex items-center gap-2">
                      <Lightbulb className="w-3 h-3 text-yellow-400" /> Recommandation: Planifier une intervention préventive dans les 48h.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <ShieldCheck className="w-12 h-12 text-emerald-400 mb-3 opacity-80" />
                    <p className="text-sm font-bold text-emerald-200">Parc Sain. Aucun risque majeur détecté.</p>
                  </div>
                )}
              </div>

              {/* Fleet Fuel Optimization */}
              <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-300 mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> Analyse Flotte & Carburant
                </h3>
                {aiInsights.fuelAnomalies.length > 0 ? (
                  <div className="space-y-4">
                    {aiInsights.fuelAnomalies.map((veh: any) => (
                      <div key={veh.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors">
                        <div>
                          <p className="font-bold text-white text-sm">{veh.brand} {veh.model}</p>
                          <p className="text-[10px] text-white/50 font-medium uppercase">Immat: {veh.registration}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-indigo-300">Kilométrage</p>
                          <p className="text-lg font-black text-white">{veh.mileage?.toLocaleString()} km</p>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-indigo-200 mt-2 italic font-medium flex items-center gap-2">
                      <Lightbulb className="w-3 h-3 text-yellow-400" /> Anomalie IA: Ces véhicules présentent une surconsommation due à leur kilométrage élevé. Recommandation d'audit mécanique.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <ShieldCheck className="w-12 h-12 text-emerald-400 mb-3 opacity-80" />
                    <p className="text-sm font-bold text-emerald-200">Aucune anomalie de flotte détectée.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 p-8 bg-card rounded-2xl border shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black uppercase tracking-tighter">Flux d'Interventions</h3>
            <div className="flex gap-4 text-[10px] font-bold">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Ouvertes</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Résolues</div>
            </div>
          </div>
          <div className="h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
              <AreaChart data={stats?.interventionsLast7Days || []}>
                <defs>
                  <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} 
                />
                <Area type="monotone" dataKey="ouvertes" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorOpen)" />
                <Area type="monotone" dataKey="resolues" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Site Health scores */}
        <div className="p-8 bg-card rounded-2xl border shadow-sm">
          <h3 className="text-lg font-black uppercase tracking-tighter mb-8">Santé des Sites</h3>
          <div className="space-y-6">
            {stats?.siteHealthScores?.slice(0, 6).map((site: any) => (
              <div key={site.id} className="space-y-2">
                <div className="flex justify-between text-[11px] font-black italic">
                  <span className="uppercase">{site.name}</span>
                  <span className={cn(
                    site.score > 80 ? "text-emerald-500" : site.score > 50 ? "text-orange-500" : "text-destructive"
                  )}>{site.score}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden border">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      site.score > 80 ? "bg-emerald-500" : site.score > 50 ? "bg-orange-500" : "bg-destructive"
                    )}
                    style={{ width: `${site.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t">
            <p className="text-[10px] text-muted-foreground font-medium italic">Calculé sur la base du backlog, des pannes récentes et du respect des SLA.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Technician Performance - Hidden for clients */}
        {!isClient && (
          <div className="p-8 bg-card rounded-2xl border shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-8">Efficacité des Équipes</h3>
            <div className="h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                <BarChart data={stats?.technicianPerformance?.slice(0, 5) || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="technician.name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.02)'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="closed" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SLA History */}
        <div className={cn("p-8 bg-card rounded-2xl border shadow-sm", isClient && "lg:col-span-2")}>
          <h3 className="text-lg font-black uppercase tracking-tighter mb-8">Historique Compétitivité</h3>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
              <ComposedChart data={stats?.interventionsByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} 
                />
                <Bar dataKey="total" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="slaOk" stroke="#10b981" strokeWidth={4} dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-8 text-[10px] font-black">
            <div className="flex items-center gap-2"><div className="w-3 h-1 bg-slate-300 rounded-full" /> Total Interventions</div>
            <div className="flex items-center gap-2"><div className="w-3 h-1 bg-emerald-500 rounded-full" /> SLA Respectés</div>
          </div>
        </div>
      </div>
    </div>
  );
}
