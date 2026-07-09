import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Plus, BarChart, 
  X, Save, Minus, Navigation, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjects, useUpdatePhase } from '@/hooks/useApi';
import { addDays, differenceInDays, format, startOfDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { toast } from '@/components/ui/Toaster';

// Zoom presets: { label, daysVisible, dayWidthPx }
const ZOOM_PRESETS = [
  { id: '2w',  label: '2 Sem.',  daysVisible: 14,  dayWidth: 80  },
  { id: '1m',  label: '1 Mois',  daysVisible: 30,  dayWidth: 44  },
  { id: '3m',  label: '3 Mois',  daysVisible: 90,  dayWidth: 20  },
  { id: '6m',  label: '6 Mois',  daysVisible: 180, dayWidth: 10  },
];

const MIN_DAY_WIDTH = 6;
const MAX_DAY_WIDTH = 150;
const DEFAULT_DAY_WIDTH = 44; // 1 month view

// Color palette for projects
const PROJECT_COLORS = [
  { bg: 'bg-blue-500',   light: 'bg-blue-500/20',   border: 'border-blue-500/30',   text: 'text-blue-600',   hex: '#3b82f6' },
  { bg: 'bg-violet-500', light: 'bg-violet-500/20',  border: 'border-violet-500/30', text: 'text-violet-600', hex: '#8b5cf6' },
  { bg: 'bg-emerald-500',light: 'bg-emerald-500/20', border: 'border-emerald-500/30',text: 'text-emerald-600',hex: '#10b981' },
  { bg: 'bg-orange-500', light: 'bg-orange-500/20',  border: 'border-orange-500/30', text: 'text-orange-600', hex: '#f97316' },
  { bg: 'bg-rose-500',   light: 'bg-rose-500/20',    border: 'border-rose-500/30',   text: 'text-rose-600',   hex: '#f43f5e' },
  { bg: 'bg-cyan-500',   light: 'bg-cyan-500/20',    border: 'border-cyan-500/30',   text: 'text-cyan-600',   hex: '#06b6d4' },
];

export function ChronologicalPlanning() {
  const { data: projects, isLoading } = useProjects();
  const updatePhase = useUpdatePhase();

  const [selectedPhase, setSelectedPhase] = useState<any>(null);
  const [dayWidth, setDayWidth] = useState(DEFAULT_DAY_WIDTH);
  const [viewStartDate, setViewStartDate] = useState(() => subDays(startOfDay(new Date()), 3));

  const timelineRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());

  // How many days fit in a "standard" viewport — we render enough
  const TOTAL_DAYS = Math.ceil(window.innerWidth / dayWidth) + 60;
  const timelineDays = Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(viewStartDate, i));

  // Zoom: change dayWidth, keep today centered
  const handleZoom = useCallback((delta: number) => {
    setDayWidth(prev => {
      const next = Math.max(MIN_DAY_WIDTH, Math.min(MAX_DAY_WIDTH, prev + delta));
      return next;
    });
  }, []);

  const setPreset = (preset: typeof ZOOM_PRESETS[0]) => {
    setDayWidth(preset.dayWidth);
    // Reset view to start relative to today minus small offset
    setViewStartDate(subDays(today, 2));
    // Scroll to beginning
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = 0;
    }
  };

  // Scroll to today
  const scrollToToday = () => {
    setViewStartDate(subDays(today, 2));
    if (timelineRef.current) timelineRef.current.scrollLeft = 0;
  };

  // Navigate prev / next
  const navigate = (days: number) => {
    setViewStartDate(prev => addDays(prev, days));
  };

  // Mouse wheel zoom on the timeline
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 6 : -6;
      handleZoom(delta);
    }
  }, [handleZoom]);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Current zoom % for display
  const zoomPercent = Math.round((dayWidth / DEFAULT_DAY_WIDTH) * 100);

  // Active preset
  const activePreset = ZOOM_PRESETS.find(p => p.dayWidth === dayWidth)?.id ?? null;

  const handleUpdatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, name, startDate, endDate } = selectedPhase;
      await updatePhase.mutateAsync({
        id,
        data: {
          name,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined
        }
      });
      toast.success('Phase mise à jour avec succès');
      setSelectedPhase(null);
    } catch {
      toast.error('Échec de la mise à jour');
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      Initialisation du planning chronologique...
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Planning Chronologique</h2>
          <p className="text-muted-foreground font-medium italic">Suivi dynamique des phases de déploiement et des installations.</p>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
            {ZOOM_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => setPreset(preset)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  activePreset === preset.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Zoom Out / Slider / Zoom In */}
          <div className="flex items-center gap-1.5 bg-background border rounded-xl px-2 py-1 shadow-sm">
            <button
              onClick={() => handleZoom(-8)}
              disabled={dayWidth <= MIN_DAY_WIDTH}
              className="p-1.5 hover:bg-muted rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
              title="Dézoomer (Ctrl + Scroll)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={MIN_DAY_WIDTH}
              max={MAX_DAY_WIDTH}
              value={dayWidth}
              onChange={(e) => setDayWidth(Number(e.target.value))}
              className="w-20 h-1.5 accent-primary cursor-grab active:cursor-grabbing"
              title={`Zoom: ${zoomPercent}%`}
            />
            <button
              onClick={() => handleZoom(8)}
              disabled={dayWidth >= MAX_DAY_WIDTH}
              className="p-1.5 hover:bg-muted rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
              title="Zoomer (Ctrl + Scroll)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[9px] font-black text-muted-foreground uppercase w-10 text-center tabular-nums">
              {zoomPercent}%
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border" />

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-7)}
              className="p-2 hover:bg-muted rounded-lg transition-all border border-transparent hover:border-border active:scale-90"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollToToday}
              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center gap-1.5"
              title="Revenir à Aujourd'hui"
            >
              <Navigation className="w-3 h-3" /> Aujourd'hui
            </button>
            <button
              onClick={() => navigate(7)}
              className="p-2 hover:bg-muted rounded-lg transition-all border border-transparent hover:border-border active:scale-90"
              title="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-tighter text-right">
        Maintenez Ctrl + Molette pour zoomer · Cliquez sur une barre pour modifier
      </p>

      {/* Gantt Table */}
      <div className="border rounded-2xl bg-card text-card-foreground shadow-sm overflow-hidden">
        <div
          ref={timelineRef}
          className="overflow-x-auto custom-scrollbar select-none"
          style={{ cursor: 'grab' }}
        >
          {/* Min width ensures enough scrollable space */}
          <div style={{ minWidth: `${280 + TOTAL_DAYS * dayWidth}px` }}>

            {/* Header Timeline */}
            <div className="flex border-b bg-muted/40 sticky top-0 z-20 shadow-sm">
              {/* Fixed label column */}
              <div className="w-[280px] flex-shrink-0 p-3 border-r flex items-center gap-2 bg-muted/60">
                <BarChart className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Projets & Phases</span>
              </div>

              {/* Day columns */}
              <div className="flex" style={{ minWidth: `${TOTAL_DAYS * dayWidth}px` }}>
                {timelineDays.map((day, idx) => {
                  const isToday = day.getTime() === today.getTime();
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isMonthStart = day.getDate() === 1;
                  const showLabel = dayWidth >= 24 ? true : (idx % Math.ceil(24 / dayWidth) === 0);

                  return (
                    <div
                      key={day.toISOString()}
                      style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
                      className={cn(
                        "relative flex-shrink-0 border-r border-border/20 text-center transition-colors",
                        isToday ? "bg-primary/8" : isWeekend ? "bg-muted/40" : "",
                        isMonthStart ? "border-r-2 border-r-primary/30" : ""
                      )}
                    >
                      {showLabel && (
                        <div className={cn(
                          "px-1 py-2 text-center text-[9px] font-black uppercase tracking-widest truncate",
                          isToday ? "text-primary" : "text-muted-foreground/70"
                        )}>
                          {dayWidth >= 44
                            ? format(day, 'dd MMM', { locale: fr })
                            : dayWidth >= 20
                              ? format(day, 'dd/MM')
                              : format(day, 'd')
                          }
                        </div>
                      )}
                      {isToday && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-primary rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Projects & Phases rows */}
            <div className="divide-y divide-border/30">
              {projects?.map((project: any, pIdx: number) => {
                const color = PROJECT_COLORS[pIdx % PROJECT_COLORS.length];

                return (
                  <div key={project.id}>
                    {/* Project Header Row */}
                    <div className={cn("flex border-b border-border/40", color.light, "border-l-4", color.border.replace('border-', 'border-l-'))}>
                      <div className="w-[280px] flex-shrink-0 p-3 border-r border-border/30 bg-background/60">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", color.bg)} />
                          <h3 className="font-black text-sm truncate uppercase tracking-tight text-foreground">{project.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pl-4">
                          <div className="h-0.5 flex-1 bg-muted rounded-full overflow-hidden opacity-30">
                            <div className={cn("h-full rounded-full", color.bg)} style={{ width: '100%' }} />
                          </div>
                        </div>
                      </div>

                      {/* Project bar row (macro bar) */}
                      <div className="flex-1 relative h-12 flex items-center">
                        {/* Grid vertical lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {timelineDays.map((day) => {
                            const isToday = day.getTime() === today.getTime();
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                            return (
                              <div
                                key={day.toISOString()}
                                style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
                                className={cn(
                                  "flex-shrink-0 border-r border-dashed border-border/10",
                                  isToday ? "bg-primary/10 border-r-primary/40 border-r" : "",
                                  isWeekend ? "bg-muted/20" : ""
                                )}
                              />
                            );
                          })}
                        </div>

                        {/* Today line */}
                        {(() => {
                          const todayOffset = differenceInDays(today, viewStartDate);
                          if (todayOffset >= 0 && todayOffset < TOTAL_DAYS) {
                            return (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-10 pointer-events-none"
                                style={{ left: `${todayOffset * dayWidth + dayWidth / 2}px` }}
                              >
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Project macro bar */}
                        {(() => {
                          const projStart = project.startDate ? startOfDay(new Date(project.startDate)) : today;
                          const projEnd = project.endDate ? startOfDay(new Date(project.endDate)) : addDays(projStart, 14);
                          const offset = differenceInDays(projStart, viewStartDate);
                          const duration = differenceInDays(projEnd, projStart) + 1;

                          if (duration <= 0) return null;
                          return (
                            <div
                              className={cn("absolute h-3 rounded-full opacity-25 pointer-events-none", color.bg)}
                              style={{
                                left: `${Math.max(0, offset * dayWidth)}px`,
                                width: `${Math.max(8, duration * dayWidth)}px`,
                              }}
                            />
                          );
                        })()}
                      </div>
                    </div>

                    {/* Phase rows */}
                    {project.phases?.map((phase: any) => {
                      const phaseStart = phase.startDate ? startOfDay(new Date(phase.startDate)) : today;
                      const phaseEnd = phase.endDate ? startOfDay(new Date(phase.endDate)) : addDays(phaseStart, 3);

                      const offset = differenceInDays(phaseStart, viewStartDate);
                      const duration = differenceInDays(phaseEnd, phaseStart) + 1;

                      const isDone = (phase.progress ?? 0) >= 100;
                      const progress = phase.progress ?? 0;

                      return (
                        <div key={phase.id} className="flex border-b border-border/20 hover:bg-muted/10 transition-colors group/row">
                          {/* Phase name */}
                          <div className="w-[280px] flex-shrink-0 pl-8 pr-3 py-2.5 border-r border-border/20 flex items-center min-w-0">
                            <div className={cn("w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0", isDone ? "bg-green-500" : color.bg)} />
                            <span className={cn(
                              "text-xs font-bold truncate",
                              isDone ? "text-muted-foreground line-through opacity-50" : "text-foreground/80"
                            )}>
                              {phase.name}
                            </span>
                          </div>

                          {/* Phase timeline */}
                          <div className="flex-1 relative h-10 flex items-center">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                              {timelineDays.map((day) => {
                                const isToday = day.getTime() === today.getTime();
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                  <div
                                    key={day.toISOString()}
                                    style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
                                    className={cn(
                                      "flex-shrink-0 border-r border-dashed border-border/10",
                                      isToday ? "bg-primary/5" : "",
                                      isWeekend ? "bg-muted/10" : ""
                                    )}
                                  />
                                );
                              })}
                            </div>

                            {/* Today vertical line */}
                            {(() => {
                              const todayOffset = differenceInDays(today, viewStartDate);
                              if (todayOffset >= 0 && todayOffset < TOTAL_DAYS) {
                                return (
                                  <div
                                    className="absolute top-0 bottom-0 w-px bg-primary/30 z-10 pointer-events-none"
                                    style={{ left: `${todayOffset * dayWidth + dayWidth / 2}px` }}
                                  />
                                );
                              }
                              return null;
                            })()}

                            {/* Phase bar */}
                            {duration > 0 && offset + duration > 0 && offset < TOTAL_DAYS && (
                              <button
                                onClick={() => setSelectedPhase({
                                  ...phase,
                                  startDate: phase.startDate ? format(new Date(phase.startDate), 'yyyy-MM-dd') : '',
                                  endDate: phase.endDate ? format(new Date(phase.endDate), 'yyyy-MM-dd') : '',
                                })}
                                className={cn(
                                  "absolute h-6 rounded-full shadow-md flex items-center overflow-hidden z-10",
                                  "transition-all hover:h-7 hover:shadow-xl hover:z-20",
                                  "group/bar cursor-pointer",
                                  isDone
                                    ? "bg-gradient-to-r from-green-500 to-emerald-400 shadow-green-500/20"
                                    : `${color.bg} shadow-primary/10`
                                )}
                                style={{
                                  left: `${Math.max(0, offset) * dayWidth}px`,
                                  width: `${Math.max(dayWidth * 0.8, (duration - (offset < 0 ? -offset : 0)) * dayWidth)}px`,
                                }}
                                title={`${phase.name} — ${progress}% — Cliquer pour modifier`}
                              >
                                {/* Progress fill */}
                                <div
                                  className="absolute inset-0 bg-white/5 opacity-0 group-hover/bar:opacity-10 transition-opacity"
                                />
                                {/* Label (only if enough space) */}
                                {dayWidth * duration > 60 && (
                                  <span className="relative px-2.5 text-[9px] font-black text-white tracking-tight truncate whitespace-nowrap drop-shadow-sm">
                                    {phase.name}
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {(!projects || projects.length === 0) && (
                <div className="flex">
                  <div className="w-[280px] flex-shrink-0" />
                  <div className="flex-1 py-24 text-center text-muted-foreground">
                    <BarChart className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="font-black uppercase tracking-tighter text-lg opacity-30">Aucun projet planifié</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Phase Modal */}
      {selectedPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tighter">Modifier la Phase</h3>
                  <p className="text-xs text-muted-foreground font-medium">Ajustement du planning</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhase(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePhase} className="p-6 space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Nom de la Phase</label>
                <input
                  type="text"
                  className="w-full bg-muted/50 border rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  value={selectedPhase.name}
                  onChange={(e) => setSelectedPhase({ ...selectedPhase, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Date de Début</label>
                  <input
                    type="date"
                    className="w-full bg-muted/50 border rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    value={selectedPhase.startDate}
                    onChange={(e) => setSelectedPhase({ ...selectedPhase, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Date de Fin</label>
                  <input
                    type="date"
                    className="w-full bg-muted/50 border rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    value={selectedPhase.endDate}
                    onChange={(e) => setSelectedPhase({ ...selectedPhase, endDate: e.target.value })}
                  />
                </div>
              </div>



              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPhase(null)}
                  className="flex-1 px-4 py-3 border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updatePhase.isPending}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {updatePhase.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                    : <><Save className="w-4 h-4" /> Enregistrer</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
