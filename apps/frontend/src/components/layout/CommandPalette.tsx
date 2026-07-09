import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, User, Building2, Calendar, Wrench, ChevronRight, Loader2 } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useGlobalSearch(query);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (results && prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results && results[selectedIndex]) {
          navigate(results[selectedIndex].link);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'USER': return <User className="w-5 h-5 text-blue-500" />;
      case 'CLIENT': return <Building2 className="w-5 h-5 text-purple-500" />;
      case 'INVOICE': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'TASK': return <Calendar className="w-5 h-5 text-emerald-500" />;
      case 'INTERVENTION': return <Wrench className="w-5 h-5 text-cyan-500" />;
      default: return <Search className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-card border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b">
          <Search className="w-6 h-6 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg font-medium placeholder:text-muted-foreground/50"
            placeholder="Rechercher une facture, un client, un collaborateur..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground ml-3" />}
          <div className="flex items-center gap-1 ml-4 hidden sm:flex">
             <kbd className="px-2 py-1 bg-muted rounded text-[10px] font-black uppercase text-muted-foreground">ESC</kbd>
          </div>
        </div>

        {query.length > 0 && results?.length === 0 && !isLoading && (
          <div className="py-12 text-center text-muted-foreground text-sm font-medium">
            Aucun résultat trouvé pour "{query}"
          </div>
        )}

        {results && results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {results.map((result: any, index: number) => (
              <div
                key={`${result.type}-${result.id}`}
                className={cn(
                  "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors",
                  index === selectedIndex ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/30 border-l-2 border-transparent"
                )}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  navigate(result.link);
                  onClose();
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    {getIcon(result.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight text-foreground">{result.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{result.subtitle}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span className="text-[9px] uppercase tracking-widest font-black text-primary/70">{result.tag}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
              </div>
            ))}
          </div>
        )}
        
        {query.length === 0 && (
          <div className="py-8 px-6 text-center">
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recherche Globale (Command Palette)</p>
             <div className="flex justify-center gap-4 mt-4">
                <span className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60"><User className="w-3 h-3"/> Utilisateurs</span>
                <span className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60"><Building2 className="w-3 h-3"/> Clients</span>
                <span className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60"><FileText className="w-3 h-3"/> Factures</span>
                <span className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60"><Wrench className="w-3 h-3"/> Interventions</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
