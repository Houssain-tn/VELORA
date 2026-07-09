import { X, Printer, ShieldCheck, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';

interface QRCodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  qrValue: string;
  assetType: 'EQUIPMENT' | 'VEHICLE' | 'FIXED_ASSET' | 'OFFICE_SUPPLY';
  referenceId: string | number;
}

export function QRCodeLabelModal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  qrValue, 
  assetType,
  referenceId 
}: QRCodeLabelModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    
    // We create a new window, write the label HTML to it, and call print()
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Impression QR Code - Velora</title>
          <style>
            @page { size: auto; margin: 0mm; }
            body { 
              font-family: 'Inter', system-ui, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              background-color: white;
            }
            .label-container {
              width: 350px;
              height: 200px;
              border: 2px solid #000;
              border-radius: 12px;
              padding: 16px;
              display: flex;
              align-items: center;
              gap: 16px;
              page-break-inside: avoid;
            }
            .qr-wrapper {
              flex-shrink: 0;
            }
            .info-wrapper {
              display: flex;
              flex-direction: column;
              flex: 1;
              min-width: 0;
            }
            .brand {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 2px;
              font-weight: 900;
              color: #666;
              margin-bottom: 4px;
            }
            .title {
              font-size: 16px;
              font-weight: 800;
              margin: 0 0 4px 0;
              color: #000;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .subtitle {
              font-size: 12px;
              color: #444;
              margin: 0 0 12px 0;
            }
            .meta {
              font-size: 10px;
              font-family: monospace;
              background: #f0f0f0;
              padding: 4px 8px;
              border-radius: 4px;
              align-self: flex-start;
              font-weight: bold;
            }
            .footer {
              margin-top: auto;
              font-size: 8px;
              text-transform: uppercase;
              color: #888;
              display: flex;
              align-items: center;
              gap: 4px;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Allow images/styles to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!isOpen) return null;

  const getTypeLabel = () => {
    switch (assetType) {
      case 'EQUIPMENT': return 'Equipement Tech';
      case 'VEHICLE': return 'Véhicule';
      case 'FIXED_ASSET': return 'Immobilisation';
      case 'OFFICE_SUPPLY': return 'Fourniture';
      default: return 'Actif';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg"><Zap className="w-4 h-4 text-primary" /></div>
            <h3 className="font-black text-xs uppercase tracking-widest">Générateur QR Asset</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center bg-gradient-to-b from-background to-muted/20">
           
           {/* HIDDEN PRINT CONTAINER (This is what gets sent to window.print) */}
           <div style={{ display: 'none' }}>
             <div ref={printRef}>
                <div className="label-container">
                  <div className="qr-wrapper">
                    <QRCodeSVG value={qrValue} size={130} level="M" />
                  </div>
                  <div className="info-wrapper">
                    <div className="brand">VELORA PRO ASSET</div>
                    <h2 className="title">{title}</h2>
                    {subtitle && <p className="subtitle">{subtitle}</p>}
                    <div className="meta">REF: {referenceId}</div>
                    <div className="footer">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Propriété Enregistrée
                    </div>
                  </div>
                </div>
             </div>
           </div>

           {/* VISUAL PREVIEW */}
           <div className="w-full space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aperçu Étiquette</span>
                 <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-md">100x50 mm</span>
              </div>

              <div className="w-full bg-white rounded-2xl p-6 shadow-sm border-2 border-dashed border-slate-300 relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500" />
                 <div className="flex items-center gap-6">
                    <div className="shrink-0 p-2 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-slate-100 group-hover:scale-105 transition-transform">
                       <QRCodeSVG value={qrValue} size={110} level="M" />
                    </div>
                    <div className="flex flex-col min-w-0">
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                         Velora • {getTypeLabel()}
                       </span>
                       <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
                       {subtitle && <p className="text-[11px] font-medium text-slate-600 truncate">{subtitle}</p>}
                       <div className="mt-3 inline-block px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-700 self-start">
                         REF: {referenceId}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-2xl border">
                 <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                 <p className="text-[10px] font-medium leading-relaxed text-muted-foreground">
                   Le QR Code encode la valeur sécurisée <code className="text-primary font-bold">"{qrValue}"</code>. Imprimez cette étiquette et collez-la sur l'équipement. Les techniciens pourront la scanner via le lecteur intégré pour ouvrir la fiche de l'actif.
                 </p>
              </div>
           </div>
        </div>

        <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between gap-4">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
           >
             Fermer
           </button>
           <div className="flex gap-2">
             <button 
                onClick={handlePrint}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
             >
                <Printer className="w-4 h-4" /> Imprimer
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
