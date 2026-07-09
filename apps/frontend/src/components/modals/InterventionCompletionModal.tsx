import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, FileText, Download } from 'lucide-react';
import { useUpdateIntervention, useCompanies } from '@/hooks/useApi';
import { toast } from '@/components/ui/Toaster';
import { generateInterventionReport } from '@/lib/export';
import { SignaturePad } from '../ui/SignaturePad';

interface InterventionCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: any;
}

export function InterventionCompletionModal({ isOpen, onClose, intervention }: InterventionCompletionModalProps) {
  const updateIntervention = useUpdateIntervention();
  const { data: companies } = useCompanies();
  const myCompany = companies?.find((c: any) => c.id === 1);
  const [report, setReport] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !intervention) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report.trim()) return toast.error('Le rapport est obligatoire');

    updateIntervention.mutate({
      id: intervention.id,
      data: {
        status: 'RAPPORT_SOUMIS',
        report: report,
        signature: signature,
        clientValidated: !!signature
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
        toast.success('Intervention clôturée avec succès');
      },
      onError: () => toast.error('Erreur lors de la clôture')
    });
  };

  const handleDownload = () => {
    generateInterventionReport({ ...intervention, report, signature }, myCompany, 'SAVE');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-lg my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {isSuccess ? (
          <div className="p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-foreground">Mission Accomplie !</h3>
            <p className="text-muted-foreground">Le rapport technique a été enregistré et le client en a été notifié.</p>
            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                <Download className="w-5 h-5" /> Télécharger mon rapport PDF
              </button>
              <button 
                onClick={onClose}
                className="w-full py-3 border rounded-xl font-bold hover:bg-muted transition-colors"
              >
                Retourner aux interventions
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b flex justify-between items-center bg-primary/5">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Clôturer l'Intervention</h3>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="p-4 bg-muted/20 border rounded-xl space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Rappel de l'intervention</p>
                <p className="font-bold text-sm">{intervention.reference}: {intervention.title}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2">
                  Rapport de Résolution <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Décrivez ici les actions techniques effectuées, les pièces remplacées, et les éventuelles recommandations..."
                  className="w-full p-4 bg-background border rounded-xl focus:ring-4 ring-primary/10 outline-none transition-all text-sm leading-relaxed"
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <SignaturePad onSave={setSignature} height={180} />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border rounded-xl font-bold hover:bg-muted transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateIntervention.isPending}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updateIntervention.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Valider & Clôturer</>}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
