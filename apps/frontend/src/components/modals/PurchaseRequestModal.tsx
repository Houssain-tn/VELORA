import { useState, useEffect } from 'react';
import { X, AlertCircle, ShoppingCart, Paperclip, Trash2 } from 'lucide-react';
import { useCreatePurchaseRequest, useUpdatePurchaseRequest, useProjects, useSites, useCreateDocument } from '@/hooks/useApi';
import { toast } from '@/components/ui/Toaster';

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: any;
}

export function PurchaseRequestModal({ isOpen, onClose, request }: PurchaseRequestModalProps) {
  const { data: projects } = useProjects();
  const { data: sites } = useSites();
  const createPurchase = useCreatePurchaseRequest();
  const updatePurchase = useUpdatePurchaseRequest();
  const uploadDoc = useCreateDocument();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [justification, setJustification] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [priority, setPriority] = useState('NORMALE');
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (request) {
      setTitle(request.title || '');
      setDescription(request.description || '');
      setJustification(request.justification || '');
      setEstimatedCost(request.estimatedCost ? String(request.estimatedCost) : '');
      setPriority(request.priority || 'NORMALE');
      setProjectId(request.projectId ? String(request.projectId) : '');
      setSiteId(request.siteId ? String(request.siteId) : '');
    } else {
      setTitle('');
      setDescription('');
      setJustification('');
      setEstimatedCost('');
      setPriority('NORMALE');
      setProjectId('');
      setSiteId('');
    }
  }, [request, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre de la demande est requis.");
      return;
    }

    try {
      let attachmentUrl: string | undefined = undefined;
      let attachmentName: string | undefined = undefined;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('type', 'AUTRE');
        
        const uploadResult = await uploadDoc.mutateAsync(formData);
        attachmentUrl = uploadResult.data.url;
        attachmentName = uploadResult.data.name;
      }

      if (request?.id) {
        await updatePurchase.mutateAsync({
          id: request.id,
          data: {
            title,
            description: description.trim() || undefined,
            justification: justification.trim() || undefined,
            estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
            priority,
            projectId: projectId ? Number(projectId) : undefined,
            siteId: siteId ? Number(siteId) : undefined,
            attachmentUrl: attachmentUrl || request.attachmentUrl,
            attachmentName: attachmentName || request.attachmentName,
          }
        });
      } else {
        await createPurchase.mutateAsync({
          title,
          description: description.trim() || undefined,
          justification: justification.trim() || undefined,
          estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
          priority,
          projectId: projectId ? Number(projectId) : undefined,
          siteId: siteId ? Number(siteId) : undefined,
          attachmentUrl,
          attachmentName,
        });
      }
      // Reset form
      setTitle('');
      setDescription('');
      setJustification('');
      setEstimatedCost('');
      setPriority('NORMALE');
      setProjectId('');
      setSiteId('');
      setFile(null);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Échec de la soumission de la demande.");
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-foreground">{request ? 'Modifier la Demande' : "Nouvelle Demande d'Achat"}</h3>
              <p className="text-xs text-muted-foreground">{request ? `Modification de la demande #${request.id}` : 'Formalisez un besoin en biens ou services.'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Titre de la demande *</label>
            <input
              type="text"
              required
              placeholder="Ex: Ordinateur portable développeur, Outillage cuivre..."
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coût Estimé (DT)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 2450.00"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priorité</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="FAIBLE">Basse</option>
                <option value="NORMALE">Normale</option>
                <option value="HAUTE">Haute</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description détaillée</label>
            <textarea
              placeholder="Spécifications techniques, modèle exact, liens ou références..."
              rows={3}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Justification de l'achat</label>
            <textarea
              placeholder="Pourquoi cet achat est-il nécessaire pour vos opérations ?"
              rows={2}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Projet Lié (Optionnel)</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Aucun projet</option>
                {projects?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Site / Localisation (Optionnel)</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
              >
                <option value="">Aucun site</option>
                {sites?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Pièce Jointe (Devis, image, pdf, ...)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="purchase-attachment"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="purchase-attachment"
                className="flex items-center justify-center h-10 px-4 rounded-xl border border-dashed border-input bg-background/50 hover:bg-muted text-sm font-semibold cursor-pointer transition-all gap-2 flex-1"
              >
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                {file ? file.name : "Choisir un document..."}
              </label>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-2 border rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {file && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Taille : {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          {/* Alert / Tip */}
          <div className="p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-blue-700/80 font-bold leading-normal">
              Une fois soumise, votre demande sera notifiée à la commerciale pour une première validation technique et budgétaire avant signature du Directeur.
            </p>
          </div>

        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-xl font-bold text-sm hover:bg-muted transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={createPurchase.isPending}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            {createPurchase.isPending ? 'Envoi en cours...' : 'Soumettre la Demande'}
          </button>
        </div>

      </div>
    </div>
  );
}
