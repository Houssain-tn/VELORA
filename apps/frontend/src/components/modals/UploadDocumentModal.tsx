import React, { useState, useRef } from 'react';
import { useCreateDocument } from '@/hooks/useApi';
import { X, Loader2, UploadCloud } from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadDocumentModal({ isOpen, onClose }: UploadDocumentModalProps) {
  const createDocument = useCreateDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('AUTRE');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-detect type if it's still 'AUTRE'
      if (type === 'AUTRE') {
        if (selectedFile.type.includes('pdf')) setType('RAPPORT_INTERVENTION');
        else if (selectedFile.type.includes('image')) setType('PHOTO');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (title) formData.append('title', title);

    createDocument.mutate(formData, {
      onSuccess: () => {
        onClose();
        setFile(null);
        setTitle('');
        setType('AUTRE');
      },
      onError: (err) => {
        console.error("Upload error:", err);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
          <h3 className="font-bold text-lg">Uploader un Document</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Titre du document (Optionnel)</label>
            <input
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all text-sm"
              placeholder="Sera le nom du fichier par défaut"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Catégorie / Type</label>
            <select
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 ring-primary/20 outline-none transition-all text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="AUTRE">Autre / Général</option>
              <option value="MANUEL">Manuel & Notice</option>
              <option value="PLAN_TECHNIQUE">Plan Technique</option>
              <option value="RAPPORT_INTERVENTION">Rapport d'Intervention</option>
              <option value="CONTRAT">Contrat & SLA</option>
              <option value="BON_INTERVENTION">Bon d'Intervention</option>
              <option value="PHOTO">Photo / Média</option>
            </select>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              required
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <UploadCloud className={`w-10 h-10 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="text-sm font-medium">
                {file ? file.name : 'Cliquez pour sélectionner un fichier'}
              </div>
              {!file && <p className="text-xs text-muted-foreground">PDF, Excel, Images (Max 10MB)</p>}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md font-medium hover:bg-muted transition-colors disabled:opacity-50"
              disabled={createDocument.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              disabled={createDocument.isPending || !file}
            >
              {createDocument.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Uploader'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
