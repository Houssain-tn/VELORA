import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft, Camera, ShieldCheck } from 'lucide-react';
import { QRScannerModal } from '@/components/modals/QRScannerModal';
import { useEquipment } from '@/hooks/useApi';
import { toast } from '@/components/ui/Toaster';

export function ScannerPage() {
  const navigate = useNavigate();
  const { data: equipment } = useEquipment();
  // Fix: start as false — let user trigger camera with explicit button press
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleScan = (decodedText: string) => {
    const found = equipment?.find((e: any) => e.serialNumber === decodedText || e.qrCode === decodedText);
    if (found) {
      navigate(`/equipment/${found.id}`);
      // Fix: corrected UTF-8 encoding
      toast.success(`Identifié : ${found.name}`);
    } else {
      toast.error(`Code QR non reconnu : ${decodedText}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-8 animate-pulse">
        <QrCode className="w-10 h-10 text-primary" />
      </div>
      
      <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Lecteur QR — Identification Terrain</h2>
      {/* Fix: corrected UTF-8 encoding */}
      <p className="text-slate-400 text-sm font-medium max-w-[280px] mb-8 leading-relaxed">
        Identifiez instantanément vos équipements en scannant le code QR ou le numéro de série.
      </p>

      <div className="space-y-4 w-full max-w-xs">
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 active:scale-95 transition-all"
        >
          {/* Fix: corrected UTF-8 encoding */}
          <Camera className="w-5 h-5" /> Activer la Caméra
        </button>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" /> Retour au Dashboard
        </button>
      </div>

      <div className="mt-12 pt-8 border-t border-white/5 w-full max-w-xs opacity-40">
        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
           <ShieldCheck className="w-3 h-3" /> Chiffrement Bout-en-Bout
        </div>
      </div>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
    </div>
  );
}
