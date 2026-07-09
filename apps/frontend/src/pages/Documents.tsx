import { useState, useEffect } from 'react';
import { FileText, Download, Search, Plus, Wrench, ShieldCheck, HardDrive, Eye, Trash2, X } from 'lucide-react';
import { useDocuments, useInterventions, useCompanies, useDeleteDocument } from '@/hooks/useApi';
import { UploadDocumentModal } from '@/components/modals/UploadDocumentModal';
import { usePermissions } from '@/hooks/usePermissions';
import { generateInterventionReport } from '@/lib/export';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { BASE_URL } from '@/lib/api';

export function Documents() {
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const { data: interventions, isLoading: intsLoading } = useInterventions();
  const { data: companies } = useCompanies();
  const { canCreateIntervention, canDeleteDocument } = usePermissions();
  const deleteDocument = useDeleteDocument();
  
  const myCompany = companies?.find((c: any) => c.id === 1);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'MANUEL' | 'PLAN_TECHNIQUE' | 'RAPPORT_INTERVENTION' | 'AUTRE'>('ALL');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (docsLoading || intsLoading) return (
    <div className="p-12 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground animate-pulse font-medium">Chargement de la bibliothèque documentaire...</p>
    </div>
  );

  // Map physical documents from DB
  const physicalDocs = documents?.map((doc: any) => ({
    id: `doc-${doc.id}`,
    realId: doc.id,
    title: doc.name,
    type: doc.type,
    url: doc.url,
    size: doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'N/A',
    createdAt: doc.createdAt,
    author: doc.uploadedBy?.name || 'Système',
    isVirtual: false
  })) || [];

  // Map virtual documents from closed interventions
  const virtualDocs = interventions
    ?.filter((int: any) => int.status === 'CLOTUREE' || int.status === 'RAPPORT_SOUMIS')
    .map((int: any) => ({
      id: `int-${int.id}`,
      realId: int.id,
      title: `Rapport - ${int.reference || int.id} - ${int.title}`,
      type: 'RAPPORT_INTERVENTION',
      createdAt: int.updatedAt,
      author: int.assignedTo?.name || 'Technicien',
      isVirtual: true,
      originalData: int
    })) || [];

  const allDocs = [...physicalDocs, ...virtualDocs].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredDocs = allDocs.filter((doc: any) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'ALL' || doc.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'MANUEL': return <HardDrive className="w-6 h-6 text-orange-500" />;
      case 'PLAN_TECHNIQUE': return <ShieldCheck className="w-6 h-6 text-purple-500" />;
      case 'RAPPORT_INTERVENTION': return <Wrench className="w-6 h-6 text-blue-500" />;
      default: return <FileText className="w-6 h-6 text-primary" />;
    }
  };

  const handlePreview = (doc: any) => {
    if (doc.isVirtual) {
      generateInterventionReport(doc.originalData, myCompany, 'PREVIEW');
    } else {
      const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.url);
      if (isImage) {
        setPreviewImage(`${BASE_URL}${doc.url}`);
      } else {
        window.open(`${BASE_URL}${doc.url}`, '_blank');
      }
    }
  };

  const handleDownload = (doc: any) => {
    if (doc.isVirtual) {
      generateInterventionReport(doc.originalData, myCompany, 'SAVE');
    } else {
      const link = document.createElement('a');
      link.href = `${BASE_URL}${doc.url}`;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = async (doc: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le document "${doc.title}" ?`)) {
       await deleteDocument.mutateAsync(doc.realId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Documents & Rapports</h2>
          <p className="text-muted-foreground font-medium italic">Manuels techniques, plans et rapports d'interventions synchronisés en temps réel.</p>
        </div>
        {canCreateIntervention && (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Importer un Document
          </button>
        )}
      </div>

      <UploadDocumentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-1">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'Tous' },
              { id: 'MANUEL', label: 'Manuels' },
              { id: 'PLAN_TECHNIQUE', label: 'Plans Techniques' },
              { id: 'RAPPORT_INTERVENTION', label: 'Rapports d\'Int.' },
              { id: 'AUTRE', label: 'Divers' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-[2px] whitespace-nowrap",
                  activeTab === tab.id 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="search"
              placeholder="Rechercher par titre ou référence..."
              className="flex h-10 w-full rounded-lg border-2 border-input bg-background px-3 py-1 text-sm shadow-sm transition-all pl-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc: any) => (
            <div key={doc.id} className={cn(
              "border-2 rounded-xl bg-card text-card-foreground p-5 flex flex-col justify-between hover:border-primary/40 transition-all group overflow-hidden shadow-sm relative",
              doc.isVirtual && "bg-muted/5 border-dashed"
            )}>
              {doc.isVirtual && (
                <div className="absolute top-0 right-0 px-2.5 py-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-tighter rounded-bl-lg animate-pulse">
                  Généré Auto
                </div>
              )}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-all shadow-inner border",
                    doc.isVirtual 
                      ? "bg-blue-50/50 text-blue-600 border-blue-100" 
                      : "bg-primary/5 text-primary border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                  )}>
                    {getIcon(doc.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm leading-tight text-balance group-hover:text-primary transition-colors line-clamp-2">{doc.title}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-wider flex items-center gap-2">
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[9px]">{doc.size || 'GÉNÉRÉ'}</span>
                      <span className="text-primary/70">{doc.type.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-dashed flex justify-between items-end relative z-10">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{format(new Date(doc.createdAt), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-tighter italic">Téléchargé par</span>
                    <span className="text-xs font-black text-foreground/90 truncate">{doc.author}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePreview(doc)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all shadow-md border-2 hover:scale-110 active:scale-95",
                      doc.isVirtual 
                        ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" 
                        : "bg-background text-primary border-primary/10 hover:border-primary hover:bg-primary/5"
                    )}
                    title="Visionner (Sans téléchargement)"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDownload(doc)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all shadow-md border-2 hover:scale-110 active:scale-95",
                      doc.isVirtual 
                        ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-400" 
                        : "bg-primary text-white border-primary hover:bg-primary/90"
                    )}
                    title="Télécharger le fichier"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {!doc.isVirtual && canDeleteDocument && (
                    <button 
                      onClick={() => handleDelete(doc)}
                      className="p-2.5 rounded-xl transition-all shadow-md border-2 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:scale-110 active:scale-95"
                      title="Supprimer dÃ©finitivement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredDocs.length === 0 && (
            <div className="col-span-full border-2 border-dashed rounded-2xl p-16 text-center text-muted-foreground bg-muted/10 flex flex-col items-center gap-3">
              <FileText className="w-12 h-12 opacity-20" />
              <p className="font-bold text-sm">Aucun document trouvé pour cette catégorie ou recherche.</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox Popup */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center animate-in zoom-in-95 duration-300">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border-4 border-white/5"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="absolute bottom-10 px-6 py-2 bg-black/50 text-white/70 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-xl border border-white/10">
            Prévisualisation du Document
          </div>
        </div>
      )}
    </div>
  );
}

