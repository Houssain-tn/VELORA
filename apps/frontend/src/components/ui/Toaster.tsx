import { useState, useEffect, createContext } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ addToast: (msg: string, type: ToastType) => void } | null>(null);

export const toast = {
  success: (msg: string) => (window as any)._addToast?.(msg, 'success'),
  error: (msg: string) => (window as any)._addToast?.(msg, 'error'),
  info: (msg: string) => (window as any)._addToast?.(msg, 'info'),
};

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    (window as any)._addToast = (message: string, type: ToastType) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast: (window as any)._addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={cn(
              "px-5 py-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border flex items-center justify-between pointer-events-auto animate-in slide-in-from-right-full slide-in-from-bottom-2 duration-300 backdrop-blur-xl",
              t.type === 'success' ? 'bg-green-50/95 border-green-500/30 text-green-900' :
              t.type === 'error' ? 'bg-red-50/95 border-red-500/30 text-red-900' :
              'bg-blue-50/95 border-blue-500/30 text-blue-900'
            )}
          >
            <div className="flex items-center gap-3 font-bold text-sm">
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
              {t.message}
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
              className="p-1 hover:bg-black/5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
