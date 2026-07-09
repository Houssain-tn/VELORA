import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import VELORALogo from '@/assets/Logos/Velora_logo.svg';

const VeloraSplashScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initialisation de VELORA CORE...');
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const steps = [
    { threshold: 15, message: 'Chargement du noyau système...' },
    { threshold: 35, message: 'Synchronisation des flux matériels...' },
    { threshold: 60, message: 'Optimisation de l\'UI Master...' },
    { threshold: 85, message: 'Sécurisation de l\'accès (AES-256)...' },
    { threshold: 95, message: 'Prêt pour l\'excellence.' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const increment = 0.8 + Math.random() * 0.9;
        const next = prev + increment;

        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setLoading(false), 800);
          return 100;
        }

        const currentStep = steps.findLast(s => next >= s.threshold);
        if (currentStep) setStatus(currentStep.message);

        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(30px)' }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#010309] text-white overflow-hidden"
        >
          {/* Cyber Mesh Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 mix-blend-screen">
             <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
               className="absolute inset-[0%] min-w-[200vw] min-h-[200vh] left-[-50%] top-[-50%] opacity-10"
               style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '50px 50px' }}
             />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#010309]/80 to-[#010309] z-10" />
          </div>

          {/* Deep Glows */}
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[150px] top-[-20%] left-[-10%]" />
          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.2, 0.05] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[150px] bottom-[-20%] right-[-10%]" />

          <div className="relative z-20 flex flex-col items-center w-full max-w-4xl px-6">
            
            {/* Cinematic Radar Fallback Container */}
            <div className="relative w-full aspect-[21/9] md:aspect-[16/6] mb-12 flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#020510]/80 shadow-[0_0_100px_rgba(37,99,235,0.15)] ring-1 ring-white/5 backdrop-blur-xl">
              {!videoError ? (
                <video ref={videoRef} autoPlay muted playsInline onEnded={() => setProgress(100)} onError={() => setVideoError(true)} className="w-full h-full object-cover opacity-90 rounded-3xl">
                  <source src="/intro_logo.mp4" type="video/mp4" />
                </video>
              ) : (
                <div className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden">
                  {/* Cyber Radar Animation */}
                  <div className="absolute inset-0 border border-blue-500/10 rounded-full scale-[2] pointer-events-none" />
                  <div className="absolute inset-0 border border-blue-500/20 rounded-full scale-150 pointer-events-none" />
                  <div className="absolute inset-0 border border-dotted border-blue-500/30 rounded-full scale-100 pointer-events-none" />
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="absolute w-[150%] h-[150%]">
                    <div className="absolute top-1/2 left-1/2 w-full h-full bg-gradient-to-tl from-blue-600/30 via-transparent to-transparent origin-top-left -translate-x-1/2 -translate-y-1/2" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }} />
                  </motion.div>
                  
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative z-10 flex flex-col items-center"
                  >
                    <div className="w-32 h-32 flex items-center justify-center bg-black/60 rounded-3xl border border-blue-500/30 shadow-[0_0_80px_rgba(59,130,246,0.5)] backdrop-blur-2xl mb-2 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent mix-blend-overlay" />
                      <img src={VELORALogo} alt="VELORA" className="w-20 h-20 drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] z-10 animate-pulse" />
                      <motion.div className="absolute -inset-x-full h-1/2 bg-white/20 blur-[20px] skew-y-12" animate={{ top: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Typography */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center w-full">
              <h1 className="text-5xl md:text-7xl font-black tracking-[-0.02em] mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl">
                VELORA <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 italic drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">PRO</span>
              </h1>
              <p className="text-blue-400 text-xs md:text-sm font-black tracking-[0.5em] uppercase mb-12 opacity-80 decoration-blue-500/50">
                Mission Critical Systems
              </p>
            </motion.div>

            {/* Elite Progress Bar */}
            <div className="w-full max-w-[320px] space-y-3">
              <div className="flex justify-between items-end mb-1 px-1">
                <AnimatePresence mode="wait">
                  <motion.span key={status} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-400/80">
                    {status}
                  </motion.span>
                </AnimatePresence>
                <div className="text-right flex items-baseline gap-1">
                  <span className="text-white font-black text-xl tabular-nums drop-shadow-[0_0_10px_white]">{Math.floor(progress)}</span>
                  <span className="text-white/50 text-[10px] font-bold">%</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-[#010309] rounded-full overflow-hidden relative border border-white/10 shadow-inner">
                <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-primary to-cyan-300 shadow-[0_0_20px_rgba(59,130,246,1)]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: "tween", ease: "linear", duration: 0.1 }} />
              </div>
            </div>

          </div>

          <div className="absolute bottom-8 flex flex-col items-center gap-3 opacity-40">
             <div className="w-12 h-[1px] bg-slate-500" />
             <span className="text-[9px] font-black tracking-[0.4em] text-slate-400 uppercase">Waycon Méditerranée © 2026</span>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default VeloraSplashScreen;
