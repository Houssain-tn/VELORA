import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export function TextModal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-[#020510] border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-emerald-500" />
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.01]">
          <h2 className="text-xl md:text-2xl font-black tracking-widest uppercase text-white drop-shadow-md">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-colors text-slate-400 magnet">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar text-slate-300 space-y-4 text-[14px] font-medium leading-relaxed bg-[#010309]/50">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
