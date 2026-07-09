import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { toast } from '@/components/ui/Toaster';
import { cn } from '@/lib/utils';
import { useInterventions, useTasks } from '@/hooks/useApi';
import { AddInterventionModal } from '@/components/modals/AddInterventionModal';
import { TaskModal } from '@/components/modals/TaskModal';

export function CalendarView() {
  const { data: interventions, isLoading: isLoadingInv } = useInterventions();
  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showQuickAction, setShowQuickAction] = useState<{ date: Date, x: number, y: number } | null>(null);

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  let daysToShow: Date[] = [];
  let startDayOffset = 0;

  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    daysToShow = eachDayOfInterval({ start: monthStart, end: monthEnd });
    startDayOffset = getDay(monthStart) - 1;
    if (startDayOffset < 0) startDayOffset = 6;
  } else if (viewMode === 'week') {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    daysToShow = eachDayOfInterval({ start: weekStart, end: weekEnd });
  } else if (viewMode === 'day') {
    daysToShow = [currentDate];
  }

  const handlePrevious = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleExportICal = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//VELORA PRO//FR\n";
    
    interventions?.forEach((inv: any) => {
        if (!inv.scheduledDate) return;
        const d = new Date(inv.scheduledDate);
        const dateStr = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        icsContent += "BEGIN:VEVENT\n";
        icsContent += `DTSTART:${dateStr}\n`;
        icsContent += `DTEND:${dateStr}\n`;
        icsContent += `SUMMARY:${inv.title}\n`;
        icsContent += `DESCRIPTION:${inv.description ? inv.description.replace(/\n/g, '\\n') : ''}\n`;
        icsContent += "END:VEVENT\n";
    });
    
    tasks?.forEach((task: any) => {
        if (!task.startDate) return;
        const d = new Date(task.startDate);
        const dateStr = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        icsContent += "BEGIN:VEVENT\n";
        icsContent += `DTSTART:${dateStr}\n`;
        icsContent += `DTEND:${dateStr}\n`;
        icsContent += `SUMMARY:[Tâche] ${task.title}\n`;
        icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `VELORA_PRO_Planning_${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Planning exporté en format iCal (.ics)');
  };

  if (isLoadingInv || isLoadingTasks) return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement de votre planning...</div>;

  const handleDayClick = (e: React.MouseEvent, day: Date) => {
    // Only trigger if clicking on the day cell itself, not on an event
    if ((e.target as HTMLElement).closest('.event-item')) return;
    
    setSelectedDate(day);
    setShowQuickAction({
      date: day,
      x: e.clientX,
      y: e.clientY
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendrier des Interventions</h2>
          <p className="text-muted-foreground">Planification quotidienne de vos techniciens sur le terrain.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportICal}
            className="flex items-center gap-2 px-3 py-1.5 border border-primary/20 bg-primary/5 text-primary rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-colors shadow-sm"
          >
            <div className="w-4 h-4 bg-primary rounded flex items-center justify-center text-[8px] font-black text-white">N</div>
            iCal
          </button>
          <button onClick={() => { setSelectedDate(null); setIsInterventionModalOpen(true); }} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 shadow hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Planifier
          </button>
        </div>
      </div>

      <AddInterventionModal 
        isOpen={isInterventionModalOpen} 
        onClose={() => setIsInterventionModalOpen(false)} 
        initialDate={selectedDate}
      />
      
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        initialDate={selectedDate}
      />

      {showQuickAction && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowQuickAction(null)}></div>
          <div 
            className="fixed z-50 bg-card border rounded-lg shadow-xl p-2 w-48 animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              top: Math.min(showQuickAction.y, window.innerHeight - 100), 
              left: Math.min(showQuickAction.x, window.innerWidth - 200) 
            }}
          >
            <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 mb-1 border-b">
              Planifier le {format(showQuickAction.date, 'dd MMMM', { locale: fr })}
            </div>
            <button 
              onClick={() => { setIsInterventionModalOpen(true); setShowQuickAction(null); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-primary"></div> Intervention
            </button>
            <button 
              onClick={() => { setIsTaskModalOpen(true); setShowQuickAction(null); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-orange-500"></div> Tâche / Chantier
            </button>
          </div>
        </>
      )}

      <div className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-4">
            <button onClick={handlePrevious} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <input 
                type="month" 
                value={format(currentDate, 'yyyy-MM')} 
                title="Modifier le mois / l'année"
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month] = e.target.value.split('-');
                    const newDate = new Date(currentDate);
                    newDate.setFullYear(parseInt(year), parseInt(month) - 1);
                    setCurrentDate(newDate);
                  }
                }}
                className="bg-transparent font-bold text-lg border-none outline-none focus:ring-0 cursor-pointer hover:text-primary transition-colors uppercase tracking-tight content-center text-center p-0 w-[140px]"
              />
            </div>
            <button onClick={handleNext} className="p-1 hover:bg-muted rounded-md transition-colors"><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="flex bg-muted p-1 rounded-md text-sm">
            <button onClick={() => setViewMode('month')} className={cn("px-3 py-1 rounded-sm font-medium transition-colors", viewMode === 'month' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Mois</button>
            <button onClick={() => setViewMode('week')} className={cn("px-3 py-1 rounded-sm font-medium transition-colors", viewMode === 'week' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Semaine</button>
            <button onClick={() => setViewMode('day')} className={cn("px-3 py-1 rounded-sm font-medium transition-colors", viewMode === 'day' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Jour</button>
          </div>
        </div>

        {/* Days of week */}
        <div className={cn("grid border-b bg-muted/30", viewMode === 'day' ? "grid-cols-1" : "grid-cols-7")}>
          {viewMode === 'day' ? (
             <div className="py-2 text-center text-sm font-black uppercase tracking-widest text-primary">
               {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
             </div>
          ) : (
            ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground border-r last:border-0">
                {day}
              </div>
            ))
          )}
        </div>

        {/* Grid */}
        <div className={cn("grid auto-rows-fr", viewMode === 'day' ? "grid-cols-1 min-h-[400px]" : "grid-cols-7 min-h-[600px]")}>
          {viewMode === 'month' && Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="border-r border-b bg-muted/10 p-2"></div>
          ))}
          
          {daysToShow.map(day => {
            const dayInterventions = interventions?.filter((inv: any) => isSameDay(new Date(inv.scheduledDate || inv.createdAt), day)) || [];
            const dayTasks = tasks?.filter((task: any) => isSameDay(new Date(task.startDate || task.createdAt), day)) || [];
            const isTodayDate = isSameDay(day, new Date());

            return (
              <div 
                key={day.toString()} 
                onClick={(e) => handleDayClick(e, day)}
                className={cn(
                  "border-r border-b p-2 transition-colors hover:bg-muted/10 overflow-hidden flex flex-col cursor-pointer group relative", 
                  isTodayDate && "bg-primary/5"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-transform group-hover:scale-110", isTodayDate ? "bg-primary text-primary-foreground" : "text-foreground")}>
                    {format(day, 'd')}
                  </span>
                  <Plus className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide pr-1">
                  {dayInterventions.map((event: any) => (
                    <div key={`inv-${event.id}`} className={cn(
                      "event-item px-2 py-1 rounded-md border truncate font-bold cursor-help shadow-sm transition-all hover:scale-[1.02]",
                      viewMode === 'day' ? "text-xs mb-2" : "text-[9px] mb-0.5",
                      event.priority === 'URGENTE' ? 'bg-red-50 border-red-200 text-red-700' :
                      event.priority === 'HAUTE' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                      'bg-blue-50 border-blue-200 text-blue-700'
                    )} title={`Intervention: ${event.title}`}>
                      <div className="flex justify-between items-center">
                        <span className="truncate">INT: {event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayTasks.map((task: any) => (
                    <div key={`task-${task.id}`} className={cn(
                      "event-item px-2 py-1 rounded-md border truncate font-bold cursor-help shadow-sm bg-slate-50 border-slate-200 text-slate-700 transition-all hover:scale-[1.02]",
                      viewMode === 'day' ? "text-xs mb-2" : "text-[9px] mb-0.5"
                    )} title={`Tâche: ${task.title}`}>
                      TK: {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
