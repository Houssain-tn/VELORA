import { useState } from 'react';
import { 
  Calendar, Video, MapPin, Plus, List, Clock, 
  Users, ChevronRight, FileText,
  Search, Filter
} from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths 
} from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMeetings } from '@/hooks/useApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { generateMeetingPdf } from '@/lib/meetingPdf';
import { MeetingModal } from '@/components/modals/MeetingModal';
import { MeetingDetailModal } from '@/components/modals/MeetingDetailModal';

export function Meetings() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  const { data: meetingsData, isLoading } = useMeetings();
  const meetings = meetingsData || [];
  
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const getStatusBadge = (status: string, isArchived: boolean = false) => {
    if (isArchived && status === 'SCHEDULED') {
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Terminée</Badge>;
    }
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">En attente</Badge>;
      case 'SCHEDULED': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">Programmée</Badge>;
      case 'COMPLETED': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Terminée</Badge>;
      case 'CANCELLED': return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-200">Annulée</Badge>;
      default: return null;
    }
  };

  const isOngoing = (start: string, end: string) => {
    const now = new Date();
    return new Date(start) <= now && new Date(end) >= now;
  };

  // Stats calculation
  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter((m: any) => m.status === 'COMPLETED').length;
  const pvRate = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 100;
  
  const meetingsThisMonth = meetings.filter((m: any) => {
    if (!m.startTime) return false;
    const date = new Date(m.startTime);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const now = new Date();
  
  const activeMeetings = meetings.filter((m: any) => {
    if (['COMPLETED', 'CANCELLED'].includes(m.status)) return false;
    // Auto-archive meetings that happened in the past (using endTime or startTime + 2 hours)
    if (m.endTime && new Date(m.endTime) < now) return false;
    if (!m.endTime && m.startTime && new Date(m.startTime).getTime() + 2 * 60 * 60 * 1000 < now.getTime()) return false;
    return true;
  });

  const archivedMeetings = meetings.filter((m: any) => !activeMeetings.includes(m));

  const renderMeetingCard = (meeting: any, isArchived: boolean = false) => (
    <Card 
      key={meeting.id} 
      onClick={() => {
        setSelectedMeeting(meeting);
        setIsDetailOpen(true);
      }}
      className={cn("group overflow-hidden rounded-[2.5rem] border transition-all hover:shadow-2xl cursor-pointer relative",
        ['COMPLETED', 'CANCELLED'].includes(meeting.status) || isArchived ? "opacity-70 hover:opacity-100 hover:border-muted-foreground/30 grayscale-[0.2]" : "hover:border-primary/30 hover:shadow-primary/5")}
    >
      {/* Status Header */}
      <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2">
        {getStatusBadge(meeting.status, isArchived)}
        {meeting.status === 'SCHEDULED' && !isArchived && isOngoing(meeting.startTime, meeting.endTime) && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500 rounded-full animate-pulse shadow-lg shadow-rose-500/20">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">En Direct</span>
          </div>
        )}
      </div>
      
      <div className="p-8 space-y-6">
        {/* Visual Accent */}
        <div className="flex items-start justify-between">
          <div className={cn(
            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:-rotate-3",
            meeting.type === 'CLIENT' ? "bg-amber-500" : "bg-primary"
          )}>
            <Video className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {meeting.title}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-widest">
              <Users className="w-4 h-4" />
              <span>{meeting.participants?.length || 0} Participants</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{meeting.startTime ? format(new Date(meeting.startTime), 'EEEE d MMMM yyyy', { locale: fr }) : 'Date à définir'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Clock className="w-4 h-4 text-primary" />
              <span>{meeting.startTime ? format(new Date(meeting.startTime), 'HH:mm', { locale: fr }) : '--:--'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              {meeting.videoLink ? <Video className="w-4 h-4 text-amber-500" /> : <MapPin className="w-4 h-4 text-amber-500" />}
              <span className="truncate">{meeting.videoLink ? 'Lien Visio prêt' : (meeting.location || 'Lieu non défini')}</span>
            </div>
          </div>

          {meeting.client && (
            <div className="mt-4 p-4 rounded-2xl bg-muted/20 border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border shadow-sm font-black text-primary uppercase">
                {meeting.client.name.substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Partenaire Client</p>
                 <p className="font-bold truncate">{meeting.client.name}</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t flex items-center justify-between">
           <div className="flex -space-x-3">
              {meeting.participants?.slice(0, 4).map((p: any, i: number) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  {p.avatar ? (
                     <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-[10px] font-black uppercase">{p.name.substring(0, 2)}</span>
                  )}
                </div>
              ))}
              {meeting.participants?.length > 4 && (
                <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-black">
                  +{meeting.participants.length - 4}
                </div>
              )}
           </div>

           <div className="flex items-center gap-2">
              {meeting.status === 'COMPLETED' && (
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="rounded-xl h-10 w-10 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    generateMeetingPdf(meeting);
                  }}
                >
                  <FileText className="w-5 h-5 text-primary" />
                </Button>
              )}
              <Button size="icon" variant="ghost" className="rounded-xl h-10 w-10 bg-muted/30 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                <ChevronRight className="w-6 h-6" />
              </Button>
           </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/50 backdrop-blur-xl border p-8 rounded-[2rem] shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <Video className="w-6 h-6 text-primary animate-pulse-slow" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter">Réunions & <span className="text-primary italic">PV</span></h1>
            </div>
            <p className="text-muted-foreground font-medium pl-15">Gérez vos prises de contact et documentez vos décisions stratégiques.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex p-1 bg-muted/30 rounded-2xl border">
               <button 
                 onClick={() => setView('list')}
                 className={cn("p-2 px-4 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest", view === 'list' ? "bg-background shadow-lg scale-105" : "text-muted-foreground opacity-50 hover:opacity-100")}
               >
                 <List className="w-4 h-4" /> Liste
               </button>
               <button 
                 onClick={() => setView('calendar')}
                 className={cn("p-2 px-4 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest", view === 'calendar' ? "bg-background shadow-lg scale-105" : "text-muted-foreground opacity-50 hover:opacity-100")}
               >
                 <Calendar className="w-4 h-4" /> Calendrier
               </button>
             </div>
             
             {isSuperAdmin && (
               <Button 
                 onClick={() => setIsModalOpen(true)}
                 className="rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 bg-primary hover:scale-105 transition-transform"
               >
                 <Plus className="w-5 h-5 mr-2" /> Programmer
               </Button>
             )}
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
          <Input 
            placeholder="Rechercher une réunion par titre, client ou projet..." 
            className="pl-12 h-14 rounded-2xl border-muted/50 focus:ring-primary/20 text-lg font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-14 rounded-2xl border-muted/50 bg-card font-black uppercase tracking-widest">
          <Filter className="w-5 h-5 mr-2 opacity-40" /> Filtrer
        </Button>
      </div>

      {/* MEETINGS VIEW */}
      {view === 'list' ? (
        <div className="space-y-12">
          {/* Active Meetings Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-3">
                <Video className="w-5 h-5 text-primary" /> À Venir & En Direct
              </h2>
              {activeMeetings.length > 0 && (
                <Badge variant="secondary" className="rounded-xl px-3">{activeMeetings.length}</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full h-64 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : activeMeetings.length === 0 ? (
                <Card className="col-span-full p-20 flex flex-col items-center justify-center text-center space-y-4 rounded-[3rem] border-dashed border-2">
                  <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                    <Video className="w-12 h-12" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black">Aucune réunion prévue</h3>
                    <p className="text-muted-foreground">Commencez par planifier votre prochain rendez-vous stratégique.</p>
                  </div>
                  {isSuperAdmin && (
                    <Button 
                      variant="outline" 
                      className="rounded-xl mt-4"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Programmer maintenant
                    </Button>
                  )}
                </Card>
              ) : (
                activeMeetings
                  .filter((m: any) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((m: any) => renderMeetingCard(m, false))
              )}
            </div>
          </div>

          {/* Archive / History Section */}
          {archivedMeetings.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pt-8 border-t">
                <h2 className="text-xl font-black flex items-center gap-3 text-muted-foreground">
                  <Clock className="w-5 h-5" /> Historique & Archives
                </h2>
                <Badge variant="outline" className="rounded-xl px-3">{archivedMeetings.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {archivedMeetings
                  .filter((m: any) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((m: any) => renderMeetingCard(m, true))}
              </div>
            </div>
          )}
        </div>
      ) : (

        /* CALENDAR VIEW */
        <Card className="rounded-[3rem] border-2 shadow-2xl bg-card/40 backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-500">
           <div className="p-8 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <h3 className="text-2xl font-black capitalize tracking-tighter">
                   {format(selectedDate, 'MMMM yyyy', { locale: fr })}
                 </h3>
                 <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="rounded-xl">
                       <ChevronRight className="w-5 h-5 rotate-180" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="rounded-xl">
                       <ChevronRight className="w-5 h-5" />
                    </Button>
                 </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl px-4 font-black" onClick={() => setSelectedDate(new Date())}>Aujourd'hui</Button>
           </div>

           <div className="grid grid-cols-7 border-b divide-x">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                 <div key={day} className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                   {day}
                 </div>
              ))}
           </div>

           <div className="grid grid-cols-7 divide-x divide-y -mt-px border-l -ml-px">
              {(() => {
                const monthStart = startOfMonth(selectedDate);
                const monthEnd = endOfMonth(monthStart);
                const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
                const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

                return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map((day, i) => {
                  const dayMeetings = meetings.filter((m: any) => m.startTime && isSameDay(new Date(m.startTime), day));
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "min-h-[140px] p-4 transition-all hover:bg-muted/30 group relative flex flex-col gap-2",
                        !isCurrentMonth && "bg-muted/5 opacity-30 pointer-events-none grayscale"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                        isToday ? "bg-primary text-white shadow-xl shadow-primary/30 scale-110" : "text-muted-foreground group-hover:text-primary"
                      )}>
                        {format(day, 'd')}
                      </span>

                      <div className="space-y-1.5 mt-auto">
                        {dayMeetings.slice(0, 3).map((m: any) => (
                          <div 
                            key={m.id}
                            onClick={() => { setSelectedMeeting(m); setIsDetailOpen(true); }}
                            className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-bold truncate cursor-pointer transition-all hover:scale-105",
                              m.type === 'CLIENT' ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-primary/10 text-primary border border-primary/20"
                            )}
                          >
                            {format(new Date(m.startTime), 'HH:mm')} {m.title}
                          </div>
                        ))}
                        {dayMeetings.length > 3 && (
                          <p className="text-[10px] font-black text-muted-foreground pl-1">+{dayMeetings.length - 3} autres</p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
           </div>
        </Card>
      )}

      {/* QUICK STATS/PREMIUM BANNER */}
      <div className={cn("grid gap-6 pb-12", isSuperAdmin ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
        <div className="p-8 rounded-[3rem] bg-slate-900 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/40 transition-all duration-1000" />
          <div className="relative z-10 space-y-6">
            <h4 className="text-3xl font-black leading-tight tracking-tight">Rapports & PV <br />Automatisés</h4>
            <p className="text-slate-400 font-medium">Exportez vos conclusions en PDF signés et traçables en un clic pour une transparence totale avec vos clients.</p>
            <div className="pt-4 flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-4xl font-black text-primary">{meetingsThisMonth}</span>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Réunions ce mois</span>
              </div>
              <div className="w-px h-12 bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-4xl font-black text-emerald-500">{pvRate}%</span>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">PV Générés</span>
              </div>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="p-8 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/10 transition-colors cursor-pointer group">
             <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Calendar className="w-10 h-10 text-primary" />
             </div>
             <div className="space-y-1">
               <h5 className="text-xl font-black">Besoin d'une session technique ?</h5>
               <p className="text-muted-foreground px-12">Nos experts sont à votre disposition pour vos audits et coordinations chantiers.</p>
             </div>
             <Button 
               onClick={() => setIsModalOpen(true)}
               className="rounded-2xl h-14 px-8 mt-4 font-black uppercase tracking-widest shadow-xl shadow-primary/20"
             >
               Prendre Rendez-vous
             </Button>
          </div>
        )}
      </div>

      <MeetingModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMeeting(null);
        }} 
        meeting={selectedMeeting}
      />

      <MeetingDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedMeeting(null);
        }}
        meeting={selectedMeeting}
        onEdit={(meeting) => {
          setIsDetailOpen(false);
          setSelectedMeeting(meeting);
          setIsModalOpen(true);
        }}
      />
    </div>
  );
}
