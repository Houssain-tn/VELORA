import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Monitor, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  History, 
  ChevronLeft,
  Calendar,
  Tag,
  Hash,
  Wrench,
  Printer,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { useEquipmentById } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { toast } from '@/components/ui/Toaster';
import { AddInterventionModal } from '@/components/modals/AddInterventionModal';
import { MaintenanceScheduleModal } from '@/components/modals/MaintenanceScheduleModal';

export function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: equipment, isLoading, error } = useEquipmentById(Number(id));
  
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isPPMModalOpen, setIsPPMModalOpen] = useState(false);
  const [interventionType, setInterventionType] = useState('');

  if (isLoading) return <div className="p-8 text-center animate-pulse font-black uppercase text-xs tracking-widest">Récupération de l'Identité Digitale...</div>;
  if (error || !equipment) return <div className="p-8 text-center text-destructive font-bold uppercase">Équipement introuvable dans le registre.</div>;

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${equipment.name}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; margin: 0; }
            .qr-container { text-align: center; display: flex; flex-direction: column; align-items: center; }
            img { width: 300px; height: 300px; margin-bottom: 24px; }
            h4 { margin: 0 0 8px 0; font-size: 24px; text-transform: uppercase; font-weight: 900; }
            p { margin: 0; color: #64748b; font-family: monospace; font-size: 14px; letter-spacing: 2px; }
            @media print {
              @page { margin: 0; size: auto; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${equipment.qrCode}&color=000000&bgcolor=ffffff" alt="QR Code" onload="window.print(); window.close();" />
            <h4>${equipment.name}</h4>
            <p>S/N: ${equipment.serialNumber || 'NON-SÉRIALISÉ'}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const statusConfig: any = {
    OPERATIONNEL: { label: 'Opérationnel', icon: ShieldCheck, color: 'text-green-600', bgColor: 'bg-green-50' },
    EN_MAINTENANCE: { label: 'En Maintenance', icon: History, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    HORS_SERVICE: { label: 'Hors Service', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
    EN_ATTENTE_PIECE: { label: 'Attente Pièce', icon: History, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  };

  const config = statusConfig[equipment.status] || statusConfig.OPERATIONNEL;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/equipment')}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" /> Retour au Parc
        </button>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="p-2 border rounded-xl hover:bg-muted transition-colors shadow-sm" title="Imprimer Étiquette">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={handlePrint} className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <QrCode className="w-4 h-4" /> Étiquette QR
          </button>
        </div>
      </div>

      {/* Hero Section: Technical Identity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-2xl p-8 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
               <Monitor className="w-64 h-64 -rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-6", config.color, config.bgColor)}>
                <StatusIcon className="w-3.5 h-3.5" /> {config.label}
              </div>
              <h1 className="text-4xl font-black tracking-tight uppercase mb-2">{equipment.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm tracking-tight uppercase">{equipment.brand} • {equipment.model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm tracking-tight uppercase">{equipment.site?.name || 'Localisation Inconnue'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specs & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-card border rounded-2xl p-6 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                   <Hash className="w-4 h-4 text-primary" /> Identifiants Uniques
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center bg-muted/20 p-3 rounded-xl border border-dashed">
                      <span className="text-[10px] font-black uppercase text-muted-foreground/60">Numéro de Série</span>
                      <span className="font-mono text-sm font-black">{equipment.serialNumber || 'NON-SÉRIALISÉ'}</span>
                   </div>
                   <div className="flex justify-between items-center bg-muted/20 p-3 rounded-xl border border-dashed">
                      <span className="text-[10px] font-black uppercase text-muted-foreground/60">Identifiant Système</span>
                      <span className="font-mono text-xs font-black text-primary">{equipment.qrCode}</span>
                   </div>
                </div>
             </div>

             <div className="bg-card border rounded-2xl p-6 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-primary" /> Cycle de Vie
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-muted-foreground/60">Installation</span>
                      <span className="text-xs font-bold uppercase">{equipment.installDate ? format(new Date(equipment.installDate), 'dd MMMM yyyy', { locale: fr }) : 'Non renseignée'}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-muted-foreground/60">Fin Garantie</span>
                      <span className={cn("text-xs font-black uppercase", equipment.warrantyEnd && new Date(equipment.warrantyEnd) < new Date() ? 'text-red-500' : 'text-green-600')}>
                        {equipment.warrantyEnd ? format(new Date(equipment.warrantyEnd), 'dd MMMM yyyy', { locale: fr }) : 'Indéterminée'}
                      </span>
                   </div>
                </div>
             </div>
          </div>

          {/* Intervention History (The "Black Box") */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 leading-none">
                 <History className="w-4 h-4 text-primary" /> Historique de Maintenance (Digital Black Box)
              </h3>
              <span className="text-[10px] font-black px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-tighter">
                {equipment.interventions?.length || 0} Interventions
              </span>
            </div>
            
            <div className="space-y-3">
              {equipment.interventions?.map((inv: any) => (
                <div key={inv.id} className="flex items-center gap-4 p-4 rounded-xl border bg-muted/5 group hover:bg-muted/10 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-card border flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                     <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase truncate tracking-tight">{inv.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[9px] font-bold text-muted-foreground opacity-60 uppercase">{format(new Date(inv.createdAt), 'dd/MM/yyyy')}</span>
                       <span className="text-[9px] text-muted-foreground/30">•</span>
                       <span className={cn("text-[9px] font-black uppercase", inv.status === 'CLOTUREE' ? 'text-green-600' : 'text-primary')}>
                          {inv.status === 'CLOTUREE' ? 'Clôturée' : inv.status === 'EN_COURS' ? 'En Cours' : inv.status === 'EN_ATTENTE' ? 'En Attente' : inv.status === 'PLANIFIEE' ? 'Planifiée' : inv.status === 'RAPPORT_SOUMIS' ? 'Rapport Soumis' : inv.status}
                       </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              ))}
              {(!equipment.interventions || equipment.interventions.length === 0) && (
                <div className="py-12 text-center opacity-30">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Aucun incident enregistré</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Status & Actions */}
        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm text-center">
             <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center border-2 border-dashed border-primary/20 relative group p-2">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${equipment.qrCode}&color=000000&bgcolor=ffffff`}
                  alt="QR Code" 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                   <p className="text-[8px] font-black text-white uppercase tracking-widest flex flex-col items-center gap-1">
                     <QrCode className="w-6 h-6" />
                     <span>Agrandir</span>
                   </p>
                </div>
             </div>
             <p className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-tighter">Référence QR — Actif</p>
             <p className="font-mono text-xs font-black text-primary bg-primary/5 py-1 rounded-md mb-6">{equipment.qrCode}</p>
             <button onClick={() => toast.success('Label Digital régénéré avec succès.')} className="w-full py-3 bg-muted hover:bg-muted/80 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border shadow-sm">
                Régénérer Label Digital
             </button>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Actions Rapides
             </h4>
             <div className="space-y-3">
                <button onClick={() => { setInterventionType(''); setIsInterventionModalOpen(true); }} className="w-full py-2.5 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                   Créer Intervention
                </button>
                <button onClick={() => setIsPPMModalOpen(true)} className="w-full py-2.5 bg-background border rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-muted transition-all">
                   Planifier Maintenance (PPM)
                </button>
                <button onClick={() => { setInterventionType('PANNE'); setIsInterventionModalOpen(true); }} className="w-full py-2.5 bg-background border border-destructive/20 text-destructive rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all">
                   Déclarer en Panne
                </button>
             </div>
          </div>
        </div>
      </div>
      
      <AddInterventionModal 
         isOpen={isInterventionModalOpen} 
         onClose={() => setIsInterventionModalOpen(false)} 
         initialEquipmentId={equipment.id}
         initialPriority={interventionType === 'PANNE' ? 'URGENTE' : undefined}
      />
      <MaintenanceScheduleModal 
         isOpen={isPPMModalOpen} 
         onClose={() => setIsPPMModalOpen(false)} 
         equipment={equipment}
      />
    </div>
  );
}

