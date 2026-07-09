import { useState, useEffect } from 'react';
import { X, Save, Loader2, Monitor, Hash, Calendar, Shield, MapPin, Tag } from 'lucide-react';
import { useCreateEquipment, useUpdateEquipment, useSites } from '@/hooks/useApi';
import { toast } from '@/components/ui/Toaster';
import { QRCodeSVG } from 'qrcode.react';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment?: any;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  OPERATIONNEL: { label: 'Opérationnel', color: 'text-green-600 bg-green-50 border-green-200' },
  EN_MAINTENANCE: { label: 'En Maintenance', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  HORS_SERVICE: { label: 'Hors Service', color: 'text-red-600 bg-red-50 border-red-200' },
  EN_ATTENTE_PIECE: { label: 'Attente Pièce', color: 'text-orange-600 bg-orange-50 border-orange-200' },
};

export function EquipmentModal({ isOpen, onClose, equipment }: EquipmentModalProps) {
  const { data: sites } = useSites();
  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'MATERIEL',
    brand: '',
    model: '',
    serialNumber: '',
    status: 'OPERATIONNEL',
    siteId: '',
    installDate: '',
    warrantyEnd: '',
    notes: '',
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        type: equipment.type || 'MATERIEL',
        brand: equipment.brand || '',
        model: equipment.model || '',
        serialNumber: equipment.serialNumber || '',
        status: equipment.status || 'OPERATIONNEL',
        siteId: equipment.siteId?.toString() || '',
        installDate: equipment.installDate ? new Date(equipment.installDate).toISOString().split('T')[0] : '',
        warrantyEnd: equipment.warrantyEnd ? new Date(equipment.warrantyEnd).toISOString().split('T')[0] : '',
        notes: equipment.notes || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'MATERIEL',
        brand: '',
        model: '',
        serialNumber: '',
        status: 'OPERATIONNEL',
        siteId: '',
        installDate: '',
        warrantyEnd: '',
        notes: '',
      });
    }
  }, [equipment, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('qr-print-area');
    if (!printContent) return;
    
    const printWindow = window.open('', '', 'width=600,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${formData.name || 'Equipement'}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif; margin: 0; }
            .qr-container { text-align: center; display: flex; flex-direction: column; align-items: center; }
            svg { width: 300px; height: 300px; margin-bottom: 24px; }
            h4 { margin: 0 0 8px 0; font-size: 24px; text-transform: uppercase; font-weight: 900; }
            p { margin: 0; color: #64748b; font-family: monospace; font-size: 14px; letter-spacing: 2px; }
            @media print {
              @page { margin: 0; size: auto; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId) return toast.error('Veuillez sélectionner un site');

    const data = {
      ...formData,
      siteId: parseInt(formData.siteId),
      installDate: formData.installDate ? new Date(formData.installDate).toISOString() : null,
      warrantyEnd: formData.warrantyEnd ? new Date(formData.warrantyEnd).toISOString() : null,
    };

    try {
      if (equipment) {
        await updateEquipment.mutateAsync({ id: equipment.id, data });
        toast.success('Équipement mis à jour');
      } else {
        await createEquipment.mutateAsync(data);
        toast.success('Équipement ajouté au parc');
      }
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Left Side: QR & Preview */}
        <div className="md:w-1/3 bg-muted/30 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-dashed">
          <div id="qr-print-area" className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-3xl shadow-xl mb-6 ring-8 ring-primary/5">
               <QRCodeSVG 
                  value={equipment ? `E-${equipment.id}-${equipment.serialNumber}` : "PREVIEW"} 
                  size={180}
                  level="H"
                  includeMargin={true}
               />
            </div>
            <div className="text-center px-4">
              <h4 className="text-lg font-black uppercase tracking-tight line-clamp-2">{formData.name || "NOM DE L'EQUIPEMENT"}</h4>
              <p className="text-[10px] text-muted-foreground font-bold tracking-widest mt-1">S/N: {formData.serialNumber || "--------"}</p>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 gap-2 w-full px-4">
             <button 
               type="button"
               onClick={handlePrint}
               className="w-full py-2 bg-white border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
             >
               Imprimer QR Code
             </button>
          </div>
        </div>

        {/* Right Side: Form */}
        <form onSubmit={handleSubmit} className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Monitor className="w-5 h-5" />
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight">
                 {equipment ? "Édition Équipement" : "Nouvel Équipement"}
               </h3>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom de l'équipement</label>
              <div className="relative">
                 <input
                   required
                   className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                   placeholder="ex: Serveur Principal"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 />
                 <Tag className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Numéro de Série</label>
              <div className="relative">
                 <input
                   required
                   className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                   placeholder="ex: SN-123456"
                   value={formData.serialNumber}
                   onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                 />
                 <Hash className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Marque / Constructeur</label>
               <input
                 className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                 placeholder="ex: DELL, HP, APC"
                 value={formData.brand}
                 onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
               />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Modèle / Référence</label>
               <input
                 className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                 placeholder="ex: PowerEdge R640"
                 value={formData.model}
                 onChange={(e) => setFormData({ ...formData, model: e.target.value })}
               />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Site de Localisation</label>
              <div className="relative">
                <select
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                >
                  <option value="">Sélectionner un site</option>
                  {sites?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                  ))}
                </select>
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">État de l'équipement</label>
              <select
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {Object.entries(statusConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date d'installation</label>
              <div className="relative">
                 <input
                   type="date"
                   className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                   value={formData.installDate}
                   onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                 />
                 <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fin de Garantie</label>
              <div className="relative">
                 <input
                   type="date"
                   className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all text-red-600"
                   value={formData.warrantyEnd}
                   onChange={(e) => setFormData({ ...formData, warrantyEnd: e.target.value })}
                 />
                 <Shield className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notes Techniques / Spécifications</label>
             <textarea
               className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-medium transition-all h-24 resize-none"
               placeholder="Détails supplémentaires..."
               value={formData.notes}
               onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
             />
          </div>

          <div className="mt-10 flex gap-3">
             <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
             >
                Annuler
             </button>
             <button
                type="submit"
                disabled={createEquipment.isPending || updateEquipment.isPending}
                className="flex-[2] py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
                {(createEquipment.isPending || updateEquipment.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {equipment ? "Mettre à jour" : "Ajouter au parc"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
