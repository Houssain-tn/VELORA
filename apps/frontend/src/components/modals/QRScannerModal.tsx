import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Loader2, QrCode, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSecure, setIsSecure] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    setIsSecure(window.isSecureContext);
    
    if (isOpen) {
      if (!window.isSecureContext) {
        setIsInitializing(false);
        return;
      }

      setIsInitializing(true);
      
      // Delay for modal animation to finish and element to be in DOM
      const timeoutId = setTimeout(() => {
        if (!document.getElementById('qr-reader')) {
          console.warn("QR Reader element not found yet, retrying...");
          setIsInitializing(false);
          return;
        }

        try {
          const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
          );

          scanner.render((decodedText) => {
            onScan(decodedText);
            scanner.clear();
            onClose();
          }, (_error) => {
            // Silence common scanning errors to avoid spamming the console
          });

          scannerRef.current = scanner;
          setIsInitializing(false);
        } catch (err) {
          console.error("Scanner Error:", err);
          setIsInitializing(false);
        }
      }, 800);

      return () => {
        clearTimeout(timeoutId);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.warn("Clear error", e));
        }
      };
    }
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-lg my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <h3 className="font-black text-xs uppercase tracking-widest">Scanner Asset QR</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center justify-center min-h-[400px] relative">
          {!isSecure ? (
            <div className="space-y-6 text-center">
               <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <ShieldCheck className="w-8 h-8" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-tight">Accès Caméra Restreint</h4>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed max-w-[300px] mx-auto">
                     Le navigateur bloque la caméra car vous n'êtes pas sur un domaine sécurisé (HTTPS).
                  </p>
               </div>
               
               <div className="bg-muted p-4 rounded-xl text-left space-y-3 border-2 border-dashed">
                  <p className="text-[10px] font-black uppercase text-primary border-b pb-2">📋 Solution Rapide (Chrome/Edge)</p>
                  <ol className="text-[9px] font-bold text-muted-foreground space-y-2 list-decimal list-inside uppercase">
                     <li>Ouvrez un nouvel onglet : <strong>chrome://flags</strong></li>
                     <li>Recherchez : <strong>unsafely-treat-insecure-origin-as-secure</strong></li>
                     <li>Ajoutez l'URL de l'application : <br/>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(window.location.origin); toast.success('URL Copiée'); }}
                          className="text-primary hover:underline font-black mt-1"
                        >
                          {window.location.origin} (Copier)
                        </button>
                     </li>
                     <li>Mettez sur <strong>Enabled</strong> et <strong>Relaunch</strong>.</li>
                  </ol>
               </div>
            </div>
          ) : (
            <>
              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-card z-10 gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-tighter opacity-50">Activation de la caméra...</p>
                </div>
              )}
              <div id="qr-reader" className="w-full border-2 border-dashed border-muted rounded-xl overflow-hidden" />
              <p className="mt-6 text-[10px] font-bold text-muted-foreground uppercase text-center max-w-[250px] leading-relaxed">
                Alignez le QR code de l'équipement dans le cadre pour accéder à sa fiche technique.
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-muted/30 border-t flex justify-center">
            <button 
                onClick={onClose}
                className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
                Annuler
            </button>
        </div>
      </div>
    </div>
  );
}
