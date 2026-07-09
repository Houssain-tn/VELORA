import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export const CompareSlider = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = (_e: any, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newPos = ((info.point.x - rect.left) / rect.width) * 100;
    newPos = Math.max(0, Math.min(100, newPos));
    setSliderPos(newPos);
  };

  return (
    <div className="py-32 max-w-6xl mx-auto px-6 relative z-10 w-full">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">L'Évolution Opérationnelle</h2>
        <p className="text-slate-400 font-medium">Glissez pour observer la transition du chaos obsolète vers l'excellence absolue du système Velora Pro.</p>
      </div>

      <div ref={containerRef} className="relative w-full h-[500px] md:h-[600px] rounded-[2rem] overflow-hidden select-none bg-slate-900 border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.15)] group/slider cursor-crosshair">
        
        {/* Left Side (Before - Chaos) */}
        <div 
          className="absolute inset-0 bg-[#0d0f1a] flex flex-col items-center justify-center p-8 overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
             {/* Mockup of Chaos */}
             <div className="absolute -left-10 top-10 md:top-20 rotate-[-15deg] w-64 h-80 bg-slate-100 border border-slate-300 p-4 shadow-xl z-10 blur-[2px] rounded-sm">
                <div className="w-1/2 h-4 bg-red-400 mb-4" />
                <div className="w-full h-2 bg-slate-300 mb-2" />
                <div className="w-3/4 h-2 bg-slate-300 mb-2" />
                <div className="w-5/6 h-2 bg-slate-300 mb-2" />
                <div className="text-red-500 text-xs font-mono mt-8 font-bold border-2 border-red-500 p-2 transform rotate-12 inline-block">MANQUANT</div>
             </div>
             <div className="absolute right-10 top-1/2 rotate-[10deg] w-72 h-40 bg-slate-200 border border-slate-300 p-4 shadow-xl flex gap-4 opacity-50 blur-[1px] rounded-md">
                <div className="w-16 h-16 bg-slate-300 rounded-full shrink-0" />
                <div className="flex-1 space-y-2"><div className="w-full h-3 bg-slate-300"/><div className="w-2/3 h-3 bg-slate-300"/></div>
             </div>
             <div className="absolute top-1/4 max-w-sm text-center opacity-80 mix-blend-screen px-4 z-20 drop-shadow-md">
               <div className="text-4xl font-black text-rose-500/80 mb-4">La Méthode Obsolete</div>
               <div className="text-sm text-white/50 font-mono">Dossiers illisibles, communication perdue, validations papier aléatoires.</div>
             </div>
        </div>

        {/* Right Side (After - Velora) */}
        <div 
          className="absolute inset-0 bg-[#020510] flex flex-col items-center justify-center p-8 overflow-hidden border-l border-blue-500/50 shadow-[-20px_0_50px_rgba(59,130,246,0.3)] pointer-events-none"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
             {/* Dynamic Mesh */}
             <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(to right, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 100%' }} />
             <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(to bottom, #3b82f6 1px, transparent 1px)', backgroundSize: '100% 40px' }} />
             <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent" />
             
             {/* Velora Mockup */}
             <div className="relative w-full max-w-xl bg-[#010309]/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 shadow-2xl z-10 lg:translate-x-[15%]">
               <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                 <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
                 <div><div className="text-white font-bold text-lg">Velora Hub Pro</div><div className="text-emerald-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> Réseau Sécurisé</div></div>
               </div>
               <div className="space-y-4">
                 {[100, 75, 40].map((w,i) => (
                   <div key={i} className="h-12 bg-white/5 border border-white/5 rounded-xl flex items-center px-4 gap-4">
                     <div className="w-3 h-3 rounded-full bg-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                     <div className="h-2 bg-white/10 rounded-full flex-1 overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full" style={{ width: `${w}%` }} />
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="absolute bottom-1/4 right-0 text-center z-20 px-10 py-6 bg-slate-900/50 backdrop-blur-xl rounded-l-[3rem] border-y border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               <div className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Le Standard Velora</div>
               <div className="text-xs text-blue-200/70 font-mono tracking-widest uppercase">Précision Absolute.</div>
             </div>
        </div>

        {/* Drag Handle */}
        <motion.div
           drag="x"
           dragConstraints={containerRef}
           dragElastic={0}
           dragMomentum={false}
           onDrag={handleDrag}
           className="absolute top-0 bottom-0 w-12 flex items-center justify-center z-50 group hover:-translate-x-[24px] cursor-grab active:cursor-grabbing pointer-events-auto"
           style={{ left: `calc(${sliderPos}% - 24px)` }}
        >
          <div className="h-full w-1.5 bg-white/50 group-hover:bg-primary transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] group-active:shadow-[0_0_25px_rgba(59,130,246,0.8)]" />
          <div className="absolute w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl text-black border-4 border-[#010309] -translate-x-0.5 group-hover:scale-110 transition-transform">
            <span className="text-[10px] tracking-tighter mix-blend-difference font-bold opacity-30 px-1">◂▸</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
