import { useState } from 'react';
import {
  ClipboardList,
  Wrench,
  AlertTriangle,
  Activity,
  QrCode,
  ArrowUpRight,
  Target,
  ShieldCheck,
  MapPin,
  Bell,
  Plus,
  CheckCircle,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useInterventions, useAnalytics, useEquipment, useUsers } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { QRScannerModal } from '@/components/modals/QRScannerModal';
import { toast } from '@/components/ui/Toaster';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isClient = user?.role === 'CLIENT';
  const { data: interventions } = useInterventions();
  const { data: analytics, isLoading: isAnalyticsLoading } = useAnalytics();
  const { data: equipment } = useEquipment();
  const { data: users } = useUsers();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState('Notification' in window ? Notification.permission : 'denied');

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Les notifications ne sont pas supportées sur ce système.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      toast.success('Alertes Navigateur Activées');
      new Notification("VELORA PRO", { 
        body: "Les notifications sont maintenant actives sur cet appareil.",
        icon: '/favicon.png',
        tag: 'VELORA-welcome'
      });
    }
  };

  const handleScan = (decodedText: string) => {
     const found = equipment?.find((e: any) => e.serialNumber === decodedText || e.qrCode === decodedText);
     if (found) {
        navigate(`/equipment/${found.id}`);
        setIsScannerOpen(false);
        toast.success(`Identifié : ${found.name}`);
     } else {
        toast.error(`QR Inconnu: ${decodedText}`);
     }
  };

  const kpiData = analytics?.interventionsLast7Days || [];
  const slaBurnDown = (analytics?.slaBurnDown || []).slice(0, 4);
  const healthScores = analytics?.siteHealthScores || [];
  const topTechnicians = (users || []).filter((u: any) => u.role === 'TECHNICIEN').sort((a: any, b: any) => (b._count?.interventions || 0) - (a._count?.interventions || 0)).slice(0, 3);

  // BI Dashboard Derived Data
  const ticketStatusData = [
    { name: 'En Cours', value: interventions?.filter((i: any) => i.status === 'EN_COURS').length || 0, color: '#3b82f6' }, // blue
    { name: 'En Attente', value: interventions?.filter((i: any) => i.status === 'EN_ATTENTE').length || 0, color: '#f59e0b' }, // amber
    { name: 'Clôturé', value: interventions?.filter((i: any) => i.status === 'CLOTUREE').length || 0, color: '#10b981' }, // emerald
    { name: 'Annulé', value: interventions?.filter((i: any) => i.status === 'ANNULEE').length || 0, color: '#ef4444' }, // red
  ].filter(d => d.value > 0);

  
  const stats = [
    { title: "Actions en Attente", value: (analytics?.tasks?.total || 0) - (analytics?.tasks?.done || 0), icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-500/10", visible: !isClient, href: '/task-tracking' },
    { title: "Sites Actifs", value: analytics?.sites || 0, icon: MapPin, color: "text-blue-500", bg: "bg-blue-500/10", visible: isClient, href: '/sites' },
    { title: "Interventions en Cours", value: analytics?.interventions?.open || 0, icon: Wrench, color: "text-amber-500", bg: "bg-amber-500/10", visible: true, href: '/interventions' },
    { title: "Alertes Critiques", value: analytics?.interventions?.slaBreached || 0, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", visible: true, href: '/interventions' },
    { title: "Performance SLA", value: analytics?.slaRatePercent ? `${analytics.slaRatePercent}%` : '100%', icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10", visible: true, href: '/interventions' },
  ].filter(s => s.visible);

  if (isAnalyticsLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-black uppercase tracking-[0.3em] opacity-40">Synchronisation des Données...</span>
      </div>
    );
  }

  const showEmptyState = isClient && (analytics?.sites === 0 || !analytics?.sites);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* MOBILE TITLE (New Audit Polish) */}
      <div className="lg:hidden px-6 pt-6 pb-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2">
            {isClient ? 'Portail Client' : 'Tableau de Bord'}
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-[0.3em] mt-1">Live Intelligence Active</p>
      </div>

      {/* PREMIUM DESKTOP COMMAND HEADER */}
      <header className="hidden lg:flex items-center justify-between px-8 py-6 bg-background/95 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-tight flex items-center gap-3">
              VELORA PRO 
              <span className="text-primary text-xs font-black uppercase tracking-[0.4em] px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                {isClient ? 'Portail Client' : 'Mission Control'}
              </span>
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-[0.3em] mt-1 ml-1">Live Operational Intelligence Platform</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 rounded-2xl border border-border/50">
              <button 
                onClick={requestNotifPermission}
                className={cn(
                  "p-2 rounded-xl transition-all relative group",
                  notifPermission === 'granted' ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10 animate-pulse"
                )}
                title={notifPermission === 'granted' ? "Notifications Actives" : "Activer les Notifications"}
              >
                <Bell className="w-4 h-4" />
                {notifPermission !== 'granted' && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </button>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-0.5">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Système Synchronisé</span>
                </div>
                <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-30 italic leading-none">Audit Actif</p>
              </div>
           </div>
           
           <div className="flex gap-3">
             <button 
               onClick={() => navigate('/interventions')}
               className="hidden sm:flex items-center gap-2 px-6 py-3 bg-muted/50 text-foreground rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all border border-border/50"
             >
               <Plus className="w-4 h-4" /> Nouvelle Demande
             </button>
             <button 
               onClick={() => setIsScannerOpen(true)}
               className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all border border-white/5"
             >
               <QrCode className="w-4 h-4" /> Audit QR
             </button>
           </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 p-6 min-h-0">
        {showEmptyState ? (
          <div className="col-span-12 flex items-center justify-center py-20">
            <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-primary/20 p-12 text-center shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 blur-[60px] rounded-full" />
               <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary/20">
                  <ShieldCheck className="w-10 h-10 text-primary" />
               </div>
               <h2 className="text-3xl font-black tracking-tighter text-foreground mb-4 italic uppercase">Bienvenue sur VELORA</h2>
               <p className="text-muted-foreground font-medium mb-10 leading-relaxed italic opacity-70">
                 Votre espace sécurisé est opérationnel. Vos KPIs et interventions s'afficheront ici en temps réel dès le raccordement de votre premier site.
               </p>
               <div className="flex flex-col gap-3">
                 <Link to="/sites" className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-primary/20">
                    Gérer mes sites
                 </Link>
                 <Link to="/documents" className="inline-flex items-center justify-center px-8 py-4 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-black uppercase tracking-widest text-xs transition-all">
                    Mes Documents
                 </Link>
               </div>
            </div>
          </div>
        ) : (
          <>
            {/* TOP KPI GRID */}
            <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-6 mb-2">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  onClick={() => navigate(stat.href)}
                  className="bg-card p-6 rounded-[2.5rem] border shadow-xl flex flex-col gap-4 group hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer relative overflow-hidden"
                  title={`Voir ${stat.title}`}
                >
                   <div className={cn("absolute -top-6 -right-6 w-24 h-24 blur-3xl opacity-[0.05] group-hover:opacity-20 transition-all rounded-full", stat.bg)} />
                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", stat.bg)}>
                      <stat.icon className={cn("w-6 h-6", stat.color)} />
                   </div>
                   <div className="flex flex-col relative z-10">
                      <span className="text-3xl font-black tracking-tighter leading-none mb-2 text-foreground/90">{stat.value}</span>
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60 leading-tight group-hover:text-primary transition-colors">{stat.title}</span>
                   </div>
                   <ArrowUpRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground/20 group-hover:text-primary/50 transition-colors" />
                </div>
              ))}
            </div>

            {/* LEFT COLUMN (HERO) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 min-h-0">
              {/* PERFORMANCE MATRIX */}
              <section className="h-[400px] bg-card rounded-[2.5rem] border shadow-xl p-8 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] pointer-events-none group-hover:bg-primary/10 transition-colors" />
                <div className="flex justify-between items-start mb-8 z-10">
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase mb-0.5 text-foreground">Flux d'Interventions</h2>
                    <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-[0.2em] opacity-60">
                       Volume des 7 derniers jours <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 animate-bounce-slow" />
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-4 py-2 rounded-xl bg-muted/50 text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm">Audit Live</div>
                  </div>
                </div>

                <div className="flex-1 w-full h-[280px] min-w-0 relative">
                  <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                    <AreaChart data={kpiData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        hide={false} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fontWeight: 900, fill: 'hsl(var(--muted-foreground))' }}
                        dy={10}
                      />
                      <YAxis 
                        hide={false} 
                        axisLine={false} 
                        tickLine={false} 
                        domain={[0, 'auto']}
                        tick={{ fontSize: 9, fontWeight: 900, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderRadius: '1.5rem', 
                          border: '1px solid hsl(var(--border))', 
                          boxShadow: '0 20px 50px -12px rgba(0,0,0,0.2)', 
                          padding: '15px' 
                        }}
                        itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="resolues" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* BI DASHBOARD MODULE */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* DONUT CHART: Répartition Tickets */}
                 <div className="bg-card rounded-[2.5rem] border shadow-xl p-8 relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px]" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-foreground/70">
                      <Target className="w-4 h-4 text-amber-500" /> Répartition des Statuts
                    </h3>
                    <div className="h-[220px] w-full">
                       {ticketStatusData.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                           <PieChart>
                             <Pie
                               data={ticketStatusData}
                               cx="50%"
                               cy="50%"
                               innerRadius={60}
                               outerRadius={80}
                               paddingAngle={5}
                               dataKey="value"
                               stroke="none"
                             >
                               {ticketStatusData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                               ))}
                             </Pie>
                             <Tooltip 
                               contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                               itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                             />
                             <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                           </PieChart>
                         </ResponsiveContainer>
                       ) : (
                         <div className="h-full flex items-center justify-center opacity-30">
                           <p className="text-xs font-black uppercase tracking-widest">Aucune donnée</p>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* COST/BUDGET SUMMARY (Placeholder BI Box) */}
                 <div className="bg-card rounded-[2.5rem] border shadow-xl p-8 relative overflow-hidden group flex flex-col">
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px]" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-foreground/70">
                      <Activity className="w-4 h-4 text-emerald-500" /> Rendement Opérationnel
                    </h3>
                    <div className="flex-1 flex flex-col justify-center gap-6">
                       <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border border-border/50">
                         <div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Taux de Résolution</p>
                           <p className="text-2xl font-black text-emerald-500 mt-1">94.2%</p>
                         </div>
                         <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
                       </div>
                       <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border border-border/50">
                         <div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Coût Moyen Intervention</p>
                           <p className="text-2xl font-black text-blue-500 mt-1">125 TND</p>
                         </div>
                         <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center"><Wrench className="w-5 h-5 text-blue-500" /></div>
                       </div>
                    </div>
                 </div>
              </section>

              {/* SITE HEALTH GRID */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {healthScores.slice(0, 4).map((site: any, idx: number) => (
                  <div key={site.id} className="bg-card rounded-2xl border shadow-xl p-5 flex flex-col justify-between group hover:border-primary/50 transition-all cursor-pointer overflow-hidden relative border-border/50">
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary/5 rounded-full group-hover:scale-[4] transition-transform duration-700" />
                    <div className="flex justify-between items-start z-10">
                       <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shadow-inner">
                          <ShieldCheck className={cn("w-5 h-5", site.score > 80 ? "text-emerald-500" : "text-amber-500")} />
                       </div>
                       <span className="text-[9px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">RANG {idx + 1}</span>
                    </div>
                    <div className="z-10 mt-4">
                      <p className="text-xs font-black uppercase truncate mb-1 group-hover:text-primary transition-colors tracking-tight">{site.name}</p>
                      <div className="flex items-end gap-2">
                        <span className={cn("text-3xl font-black tracking-tighter leading-none", site.score > 80 ? "text-emerald-500" : "text-amber-500")}>
                          {site.score}%
                        </span>
                        <span className="text-[10px] font-black uppercase text-muted-foreground mb-1 leading-none opacity-60">Score Santé</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full mt-4 overflow-hidden z-10 border border-border/10">
                       <div 
                          className={cn("h-full transition-all duration-1000", site.score > 80 ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "bg-amber-500")}
                          style={{ width: `${site.score}%` }} 
                       />
                    </div>
                  </div>
                ))}
              </section>

              {/* TOP TECHNICIANS */}
              {!isClient && topTechnicians.length > 0 && (
                <section className="bg-card rounded-[2.5rem] border shadow-xl p-8 flex flex-col relative overflow-hidden group border-border/50">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
                  <div className="flex justify-between items-start mb-6 z-10">
                    <div>
                      <h2 className="text-2xl font-black tracking-tighter uppercase mb-0.5 text-foreground flex items-center gap-3">
                         <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                           <Target className="w-5 h-5" />
                         </div>
                         Top Exécutants
                      </h2>
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-60 ml-1">Les techniciens les plus actifs</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 z-10">
                    {topTechnicians.map((tech: any, idx: number) => (
                      <div key={tech.id} className="bg-muted/20 border border-border/50 rounded-2xl p-5 flex items-center gap-4 hover:border-blue-500/30 hover:bg-muted/40 transition-all group/tech cursor-pointer">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-white border shadow-sm overflow-hidden flex items-center justify-center font-black text-xl text-blue-500">
                             {tech.avatar ? <img src={tech.avatar.startsWith('http') ? tech.avatar : `${BASE_URL}${tech.avatar}`} className="h-full w-full object-cover" /> : tech.name[0]}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black uppercase shadow-lg border-2 border-card shadow-blue-500/50">
                             #{idx + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black uppercase truncate tracking-tight group-hover/tech:text-blue-500 transition-colors">{tech.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest mt-0.5">{tech._count?.interventions || 0} Int. Actives</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN (ASIDE) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
              {/* PRIORITY RISKS */}
              <section className="bg-card rounded-[2.5rem] border p-8 flex flex-col shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[60px] -translate-y-1/2 translate-x-1/2" />
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-600 flex items-center gap-4">
                       <div className="p-2.5 bg-rose-500/10 rounded-xl animate-pulse">
                        <AlertTriangle className="w-4 h-4" />
                       </div>
                       Matrice des Risques SLA
                    </h3>
                    <span className="text-[9px] font-black px-2 py-1 bg-rose-500/10 text-rose-600 rounded-full">LIVE</span>
                 </div>
                 
                 <div className="flex-1 space-y-4 overflow-y-auto pr-1 no-scrollbar min-h-[160px]">
                    {slaBurnDown.map((sla: any) => (
                       <div key={sla.id} className="p-5 bg-muted/20 rounded-[1.5rem] border border-border/40 hover:border-rose-500/40 transition-all cursor-pointer">
                          <div className="flex justify-between items-start mb-3 gap-4">
                            <p className="text-xs font-black uppercase tracking-tight text-foreground/70 line-clamp-1">{sla.title}</p>
                            <span className="shrink-0 text-[10px] font-black px-2.5 py-1.5 bg-rose-600 text-white rounded-xl">
                               {formatDistanceToNow(new Date(sla.slaDeadline), { locale: fr })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase opacity-40">
                             <MapPin className="w-3 h-3" /> {sla.site?.name || 'Site Inconnu'}
                          </div>
                       </div>
                    ))}
                    {slaBurnDown.length === 0 && (
                       <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-10">
                          <ShieldCheck className="w-16 h-16 mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Sécurité Totale</p>
                       </div>
                    )}
                 </div>
              </section>

              {/* OPERATIONAL FLUX */}
              <section className="bg-card rounded-[2.5rem] border shadow-2xl p-8 flex flex-col relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] translate-y-1/2 translate-x-1/2" />
                 <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    Intelligence Opérationnelle
                 </h3>
                 
                 <div className="flex-1 space-y-4 overflow-y-auto pr-1 no-scrollbar min-h-[300px]">
                    {interventions?.slice(0, 6).map((inv: any) => (
                      <div key={inv.id} className="flex gap-5 p-5 hover:bg-primary/[0.02] rounded-[2rem] transition-all cursor-pointer group/item border border-transparent hover:border-primary/20">
                        <div className={cn("shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl", 
                           inv.status === 'CLOTUREE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted/30 text-primary border-border/50'
                        )}>
                          <Wrench className="w-7 h-7" />
                        </div>
                        <div className="min-w-0 flex-1 py-1">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-black uppercase tracking-tight truncate group-hover/item:text-primary transition-colors flex-1">{inv.title}</p>
                            {!isClient && (
                              <div className="flex -space-x-3 overflow-hidden ml-4">
                                {inv.assignedTechnicians?.slice(0, 3).map((tech: any) => (
                                  <div key={tech.id} className="h-7 w-7 rounded-full border-2 border-background ring-1 ring-muted bg-slate-100 flex items-center justify-center text-[10px] font-black overflow-hidden">
                                     {tech.avatar ? <img src={tech.avatar.startsWith('http') ? tech.avatar : `${BASE_URL}${tech.avatar}`} className="h-full w-full object-cover" /> : <span>{tech.name[0]}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 opacity-50">
                             <MapPin className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-black uppercase truncate tracking-widest leading-none">{inv.site?.name || 'Waycon Infrastructure'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
                 
                 <button 
                   onClick={() => navigate('/interventions')}
                   className="mt-8 w-full py-5 text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:bg-primary/5 rounded-[1.5rem] transition-all border-2 border-dashed border-primary/20 flex items-center justify-center gap-3 group/btn"
                 >
                    Accéder au Suivi <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </button>
              </section>
            </div>
          </>
        )}
      </main>
      
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
    </div>
  );
}
