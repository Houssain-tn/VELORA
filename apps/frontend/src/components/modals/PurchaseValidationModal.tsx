import { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, AlertCircle, ShoppingCart, DollarSign, Calendar, MessageSquare, Paperclip, ExternalLink, Pencil, Trash2, Download, TrendingUp, Eye } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useValidateCommercialPurchase,
  useValidateDirectorPurchase,
  useProcessPurchase,
  useCompletePurchase,
  useRejectPurchase,
  useDeletePurchaseRequest,
} from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';
import { generatePurchaseRequestPDF } from '@/utils/pdfGenerator';
import { BASE_URL } from '@/lib/api';

interface PurchaseValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onEdit?: (request: any) => void;
}

export function PurchaseValidationModal({ isOpen, onClose, request, onEdit }: PurchaseValidationModalProps) {
  const { user } = useAuthStore();
  const validateCommercial = useValidateCommercialPurchase();
  const validateDirector = useValidateDirectorPurchase();
  const processPurchase = useProcessPurchase();
  const completePurchase = useCompletePurchase();
  const rejectPurchase = useRejectPurchase();
  const deletePurchase = useDeletePurchaseRequest();

  const [comment, setComment] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [actualCost, setActualCost] = useState('');
  const [isCompleteMode, setIsCompleteMode] = useState(false);
  
  const [convertToAsset, setConvertToAsset] = useState(false);
  const [assetType, setAssetType] = useState<'FIXED_ASSET' | 'VEHICLE' | 'OFFICE_SUPPLY'>('FIXED_ASSET');
  const [assetData, setAssetData] = useState<any>({});

  if (!isOpen || !request) return null;

  const handleDeleteClick = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette demande d'achat ?")) {
      try {
        await deletePurchase.mutateAsync(request.id);
        onClose();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Échec de la suppression de la demande d'achat.");
      }
    }
  };

  const handleCommercialValidate = async () => {
    try {
      await validateCommercial.mutateAsync({ id: request.id, comment: comment.trim() || undefined });
      setComment('');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Échec de la validation commerciale.");
    }
  };

  const handleDirectorValidate = async () => {
    try {
      await validateDirector.mutateAsync({ id: request.id, comment: comment.trim() || undefined });
      setComment('');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Échec de la validation de la direction.");
    }
  };

  const handleProcessPurchase = async () => {
    try {
      await processPurchase.mutateAsync(request.id);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Échec de la mise en traitement.");
    }
  };

  const handleCompletePurchase = async () => {
    if (!actualCost.trim() || isNaN(Number(actualCost)) || Number(actualCost) < 0) {
      toast.error("Veuillez saisir un coût réel d'achat valide (supérieur ou égal à 0).");
      return;
    }
    try {
      await completePurchase.mutateAsync({ 
        id: request.id, 
        actualCost: Number(actualCost),
        convertToAsset,
        assetType: convertToAsset ? assetType : undefined,
        assetData: convertToAsset ? assetData : undefined,
      });
      setActualCost('');
      setConvertToAsset(false);
      setAssetType('FIXED_ASSET');
      setAssetData({});
      setIsCompleteMode(false);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Échec de la finalisation de l'achat.");
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error("Un motif de rejet est obligatoire dans le champ commentaire.");
      return;
    }
    try {
      await rejectPurchase.mutateAsync({ id: request.id, comment: comment.trim() });
      setComment('');
      setIsRejectMode(false);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Échec du rejet.");
    }
  };

  // Determine permissions based on role
  const isCommercial = user?.role === 'COMMERCIAL' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isDirector = user?.role === 'DIRECTEUR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isBuyer = user?.role === 'ACHETEUR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Procurement Workflow Steps mapping
  const steps = [
    { label: 'Soumise', key: 'SOUMISE', active: true },
    { label: 'Val. Commercial', key: 'VALIDEE_COMMERCIAL', active: ['VALIDEE_COMMERCIAL', 'VALIDEE_DIRECTEUR', 'EN_COURS_ACHAT', 'TERMINEE'].includes(request.status) },
    { label: 'Val. Direction', key: 'VALIDEE_DIRECTEUR', active: ['VALIDEE_DIRECTEUR', 'EN_COURS_ACHAT', 'TERMINEE'].includes(request.status) },
    { label: 'Achats', key: 'EN_COURS_ACHAT', active: ['EN_COURS_ACHAT', 'TERMINEE'].includes(request.status) },
    { label: 'Livrée / Clôturée', key: 'TERMINEE', active: request.status === 'TERMINEE' },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                Demande d'Achat #{request.id}
                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", 
                  request.status === 'SOUMISE' ? 'bg-orange-100 text-orange-700' :
                  request.status === 'VALIDEE_COMMERCIAL' ? 'bg-blue-100 text-blue-700' :
                  request.status === 'VALIDEE_DIRECTEUR' ? 'bg-indigo-100 text-indigo-700' :
                  request.status === 'EN_COURS_ACHAT' ? 'bg-purple-100 text-purple-700' :
                  request.status === 'TERMINEE' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-red-100 text-red-700'
                )}>
                  {request.status.replace('_', ' ')}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">Créée par {request.requestedBy?.name} ({request.requestedBy?.role})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'SUPER_ADMIN' && (
              <>
                <button
                  onClick={() => onEdit?.(request)}
                  className="p-2 text-primary hover:text-primary-foreground hover:bg-primary/20 rounded-full transition-all hover:scale-110"
                  title="Modifier la demande"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={deletePurchase.isPending}
                  className="p-2 text-destructive hover:text-white hover:bg-destructive/20 rounded-full transition-all hover:scale-110"
                  title="Supprimer la demande"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => generatePurchaseRequestPDF(request, 'preview')}
              className="p-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-full transition-all hover:scale-110"
              title="Visualiser le Bon d'Engagement (PDF)"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => generatePurchaseRequestPDF(request)}
              className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-full transition-all hover:scale-110"
              title="Télécharger le Bon d'Engagement (PDF)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          {/* Stepper Pipeline */}
          {request.status !== 'REJETEE' ? (
            <div className="relative flex items-center justify-between w-full py-4 px-2 bg-muted/30 rounded-2xl border">
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 relative z-10">
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all", 
                    step.active 
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25' 
                      : 'bg-card border-muted text-muted-foreground'
                  )}>
                    {step.active && request.status === step.key ? (
                      <Clock className="w-4 h-4 animate-spin shrink-0" />
                    ) : step.active ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={cn("text-[9px] font-black uppercase tracking-tight mt-1.5 whitespace-nowrap", 
                    step.active ? 'text-foreground' : 'text-muted-foreground/60'
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
              
              {/* Stepper Line Background */}
              <div className="absolute left-[10%] right-[10%] top-[40%] -translate-y-1/2 h-0.5 bg-border -z-10" />
            </div>
          ) : (
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-red-700">Demande Rejetée / Refusée</p>
                <p className="text-xs text-red-600/90 leading-snug">Cette demande a été annulée et ne pourra plus suivre le pipeline d'approvisionnement.</p>
              </div>
            </div>
          )}

          {/* Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-card border rounded-2xl flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Coût Estimé</span>
                <p className="text-sm font-black text-foreground">{request.estimatedCost ? `${Number(request.estimatedCost).toLocaleString()} DT` : 'Non spécifié'}</p>
              </div>
            </div>

            <div className="p-4 bg-card border rounded-2xl flex items-center gap-3">
              <AlertCircle className={cn("w-5 h-5 shrink-0", 
                request.priority === 'URGENTE' ? 'text-red-600' : 'text-primary'
              )} />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priorité</span>
                <p className="text-sm font-black text-foreground">{request.priority || 'NORMALE'}</p>
              </div>
            </div>

            <div className="p-4 bg-card border rounded-2xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Créée Le</span>
                <p className="text-sm font-black text-foreground">{new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Cost Comparison banner */}
          {request.status === 'TERMINEE' && request.actualCost && (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-3 animate-in fade-in duration-300">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Comparatif des Coûts (Suivi Réel)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-card border rounded-xl">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Budget Estimé</span>
                  <p className="text-xs font-black text-foreground">{request.estimatedCost ? `${Number(request.estimatedCost).toLocaleString()} DT` : 'N/A'}</p>
                </div>
                <div className="p-3 bg-card border rounded-xl">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Coût Réel Réceptionné</span>
                  <p className="text-xs font-black text-foreground">{`${Number(request.actualCost).toLocaleString()} DT`}</p>
                </div>
                <div className={cn("p-3 border rounded-xl", 
                  Number(request.actualCost) <= Number(request.estimatedCost || 0)
                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-700"
                    : "bg-red-500/5 border-red-500/10 text-red-700"
                )}>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    {Number(request.actualCost) <= Number(request.estimatedCost || 0) ? "Économie Réalisée" : "Dépassement Budgétaire"}
                  </span>
                  <p className="text-xs font-black">
                    {`${Math.abs(Number(request.actualCost) - Number(request.estimatedCost || 0)).toLocaleString()} DT`}
                    <span className="text-[9px] ml-1 opacity-70">
                      ({Number(request.actualCost) <= Number(request.estimatedCost || 0) ? '-' : '+'}{(Math.abs(Number(request.actualCost) - Number(request.estimatedCost || 0)) / (Number(request.estimatedCost) || 1) * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Description du besoin</h4>
            <div className="p-4 bg-muted/20 border rounded-2xl text-xs font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {request.description || "Aucune description fournie."}
            </div>
          </div>

          {request.justification && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Justification opérationnelle</h4>
              <div className="p-4 bg-muted/20 border rounded-2xl text-xs font-medium text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {request.justification}
              </div>
            </div>
          )}

          {/* Project & Site tags if present */}
          {(request.project || request.site) && (
            <div className="flex flex-wrap gap-3">
              {request.project && (
                <span className="px-3 py-1 bg-blue-500/5 text-blue-600 border border-blue-500/10 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                  📁 Projet: {request.project.name}
                </span>
              )}
              {request.site && (
                <span className="px-3 py-1 bg-orange-500/5 text-orange-600 border border-orange-500/10 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                  📍 Site: {request.site.name}
                </span>
              )}
            </div>
          )}

          {/* Attachment if present */}
          {request.attachmentUrl && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Pièce Jointe / Devis</h4>
              <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{request.attachmentName || "Document joint"}</p>
                    <p className="text-[10px] text-muted-foreground">Cliquez sur le lien pour ouvrir ou télécharger.</p>
                  </div>
                </div>
                <a
                  href={`${BASE_URL}${request.attachmentUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
                </a>
              </div>
            </div>
          )}

          {/* Validation Comment Display */}
          {request.comment && (
            <div className="space-y-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3">
              <MessageSquare className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-wider text-amber-800">Motif de décision / Note de validation</h5>
                <p className="text-xs font-bold text-amber-700/90 mt-1 leading-normal">{request.comment}</p>
              </div>
            </div>
          )}

          {/* Actions & Comment Input Form */}
          {request.status !== 'TERMINEE' && request.status !== 'REJETEE' && (
            <div className="pt-4 border-t border-dashed space-y-4">
              
              {/* Comment field for active validators */}
              {((request.status === 'SOUMISE' && isCommercial) || 
                (request.status === 'VALIDEE_COMMERCIAL' && isDirector) ||
                isRejectMode) && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    Note / Commentaire {isRejectMode && <span className="text-red-600">* (Obligatoire pour rejet)</span>}
                  </label>
                  <textarea
                    placeholder="Ajoutez une remarque, un devis de référence, ou expliquez le motif en cas de rejet..."
                    rows={2}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              )}

              {/* Action Buttons based on status & role */}
              <div className="flex flex-wrap gap-3">
                {/* Commercial Approving */}
                {request.status === 'SOUMISE' && isCommercial && !isRejectMode && (
                  <button
                    onClick={handleCommercialValidate}
                    disabled={validateCommercial.isPending}
                    className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                  >
                    Valider (Commerciale)
                  </button>
                )}

                {/* Director Approving */}
                {request.status === 'VALIDEE_COMMERCIAL' && isDirector && !isRejectMode && (
                  <button
                    onClick={handleDirectorValidate}
                    disabled={validateDirector.isPending}
                    className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                  >
                    Accepter & Signer (Directeur)
                  </button>
                )}

                {/* Purchasing Processing */}
                {request.status === 'VALIDEE_DIRECTEUR' && isBuyer && (
                  <button
                    onClick={handleProcessPurchase}
                    disabled={processPurchase.isPending}
                    className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                  >
                    Lancer l'Achat / Approvisionnement
                  </button>
                )}

                {/* Purchasing Completing */}
                {request.status === 'EN_COURS_ACHAT' && isBuyer && (
                  <>
                    {isCompleteMode ? (
                      <div className="flex flex-col gap-4 w-full p-5 bg-muted/40 rounded-2xl border border-dashed border-emerald-500/30 animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row items-end gap-3">
                          <div className="space-y-1 w-full sm:w-44 text-left">
                            <label className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Coût Réel d'Achat (DT) *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Ex: 1950.00"
                              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              value={actualCost}
                              onChange={(e) => setActualCost(e.target.value)}
                            />
                          </div>
                          
                          <div className="flex items-center gap-3 w-full sm:w-auto pb-1.5 px-2">
                             <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Transformer en Actif :</span>
                             <button 
                               onClick={() => setConvertToAsset(!convertToAsset)}
                               className={cn(
                                 "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                 convertToAsset ? "bg-emerald-500" : "bg-muted-foreground/30"
                               )}
                             >
                               <span className={cn(
                                 "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                 convertToAsset ? "translate-x-4" : "translate-x-0"
                               )} />
                             </button>
                          </div>
                        </div>

                        {/* ASSET CONVERSION OPTIONS */}
                        {convertToAsset && (
                          <div className="p-4 bg-background border rounded-xl space-y-4 animate-in slide-in-from-top-2">
                            <div className="space-y-1">
                               <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Type d'Actif</label>
                               <select
                                  value={assetType}
                                  onChange={(e: any) => setAssetType(e.target.value)}
                                  className="flex h-9 w-full sm:w-1/2 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-bold transition-all focus:outline-none focus:ring-1 focus:ring-primary"
                               >
                                  <option value="FIXED_ASSET">Immobilisation (Matériel, PC, Mobilier...)</option>
                                  <option value="VEHICLE">Véhicule (Parc Automobile)</option>
                                  <option value="OFFICE_SUPPLY">Fourniture de Bureau (Stock)</option>
                               </select>
                            </div>

                            {assetType === 'FIXED_ASSET' && (
                               <div className="space-y-1">
                                 <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Catégorie d'Immobilisation</label>
                                 <select
                                    value={assetData.category || 'INFORMATIQUE'}
                                    onChange={(e) => setAssetData({...assetData, category: e.target.value})}
                                    className="flex h-9 w-full sm:w-1/2 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-1 focus:ring-primary"
                                 >
                                    <option value="INFORMATIQUE">Informatique</option>
                                    <option value="MOBILIER">Mobilier</option>
                                    <option value="OUTILLAGE">Outillage</option>
                                    <option value="IMMOBILIER">Immobilier</option>
                                    <option value="AUTRE">Autre</option>
                                 </select>
                               </div>
                            )}

                            {assetType === 'VEHICLE' && (
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                 <input placeholder="Immatriculation *" value={assetData.immatriculation || ''} onChange={e => setAssetData({...assetData, immatriculation: e.target.value})} className="h-9 rounded-lg border border-input px-3 text-xs" />
                                 <input placeholder="Marque *" value={assetData.marque || ''} onChange={e => setAssetData({...assetData, marque: e.target.value})} className="h-9 rounded-lg border border-input px-3 text-xs" />
                                 <input placeholder="Modèle *" value={assetData.modele || ''} onChange={e => setAssetData({...assetData, modele: e.target.value})} className="h-9 rounded-lg border border-input px-3 text-xs" />
                                 <div className="flex gap-2">
                                   <input type="number" placeholder="Année" value={assetData.annee || ''} onChange={e => setAssetData({...assetData, annee: e.target.value})} className="w-1/2 h-9 rounded-lg border border-input px-3 text-xs" />
                                   <select value={assetData.fuelType || 'DIESEL'} onChange={e => setAssetData({...assetData, fuelType: e.target.value})} className="w-1/2 h-9 rounded-lg border border-input px-3 text-xs">
                                     <option value="DIESEL">Diesel</option>
                                     <option value="ESSENCE">Essence</option>
                                     <option value="ELECTRIQUE">Électrique</option>
                                     <option value="HYBRIDE">Hybride</option>
                                   </select>
                                 </div>
                               </div>
                            )}

                            {assetType === 'OFFICE_SUPPLY' && (
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                 <input type="number" placeholder="Quantité Reçue *" min="1" value={assetData.quantity || ''} onChange={e => setAssetData({...assetData, quantity: e.target.value})} className="h-9 rounded-lg border border-input px-3 text-xs" />
                                 <input placeholder="Unité (ex: Boîtes, Unités, Rames)" value={assetData.unit || 'Unités'} onChange={e => setAssetData({...assetData, unit: e.target.value})} className="h-9 rounded-lg border border-input px-3 text-xs" />
                               </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 w-full sm:w-auto pt-2 border-t border-dashed">
                          <button
                            onClick={handleCompletePurchase}
                            disabled={completePurchase.isPending}
                            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:bg-emerald-500 transition-all flex-1 sm:flex-initial"
                          >
                            Confirmer la Réception
                          </button>
                          <button
                            onClick={() => {
                              setIsCompleteMode(false);
                              setActualCost('');
                              setConvertToAsset(false);
                              setAssetData({});
                            }}
                            className="px-4 py-2 border rounded-xl font-bold text-xs uppercase transition-all"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setIsCompleteMode(true);
                          setActualCost(request.estimatedCost ? String(request.estimatedCost) : '');
                        }}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg hover:bg-emerald-500 transition-all hover:scale-105"
                      >
                        Marquer comme Livrée / Clôturée
                      </button>
                    )}
                  </>
                )}

                {/* Reject Buttons */}
                {['SOUMISE', 'VALIDEE_COMMERCIAL', 'EN_COURS_ACHAT'].includes(request.status) && (isCommercial || isDirector || isBuyer) && (
                  <>
                    {isRejectMode ? (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={handleReject}
                          disabled={rejectPurchase.isPending}
                          className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg hover:bg-red-500 transition-all flex-1 sm:flex-initial"
                        >
                          Confirmer le Refus
                        </button>
                        <button
                          onClick={() => setIsRejectMode(false)}
                          className="px-4 py-2.5 border rounded-xl font-bold text-xs uppercase transition-all"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsRejectMode(true)}
                        className="bg-red-500/10 text-red-600 border border-red-500/20 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all hover:scale-105"
                      >
                        Refuser la Demande
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 bg-muted/20 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border rounded-xl font-bold text-sm hover:bg-muted transition-all"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
