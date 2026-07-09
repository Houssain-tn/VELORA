import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  ChevronRight, Camera, CheckCircle2, Lock, Globe,
  ShieldCheck, Zap, X, Activity, MapPin, Mail, Phone,
  Car, Building2, Package, ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toaster';

import VELORALogo from '@/assets/Logos/Velora_logo.svg';
import WayconLogo from '@/assets/Logos/Waycon_logo.png';
import CommuneLogo from '@/assets/Logos/commune-sousse.png';
import NexoraLogo from '@/assets/Logos/Nexora_logo.svg';

import { BlobCursor } from '../components/ui/BlobCursor';
import { MeshBackground } from '../components/ui/Backgrounds';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';

import { LiveTerminal } from '../components/ui/LiveTerminal';
import { CompareSlider } from '../components/ui/CompareSlider';
import { TextModal } from '../components/ui/TextModal';
import { SpotlightCard } from '../components/ui/SpotlightCard';

export const BENTO_CARDS = [
  { id: '1', title: 'Parc Automobile', icon: Car, color: 'blue', text: "Gestion complète de la flotte : missions, carburant, entretiens, alertes d'assurance et statistiques de rentabilité en temps réel.", colSpan: 'col-span-1 md:col-span-2' },
  { id: '2', title: 'Immobilisations', icon: Building2, color: 'emerald', text: "Suivi du cycle de vie de vos actifs. Affectation par site, calcul d'amortissement et audit d'inventaire ultra-rapide par scan QR.", colSpan: 'col-span-1 md:col-span-2' },
  { id: '3', title: 'Moyens Généraux', icon: Package, color: 'amber', text: "Centralisez les requêtes internes, gérez vos fournisseurs, l'occupation des espaces et le stock de fournitures critiques.", colSpan: 'col-span-1 md:col-span-1 row-span-2', justify: 'end' },
  { id: '4', title: 'Interventions ITSM', icon: ShieldCheck, color: 'rose', text: "Ticketing B2B avec suivi géolocalisé. Génération des PV de réception PDF et signature cryptée sur site.", colSpan: 'col-span-1 md:col-span-2' },
  { id: '5', title: 'Achats & CRM', icon: ShoppingCart, color: 'indigo', text: "Workflows de validation financière, suivi des contrats et factures.", colSpan: 'col-span-1 md:col-span-1', center: true },
];

export const cardColorMap: Record<string, {bg: string, txt: string, brd: string, icn: string}> = {
  blue: { bg: 'bg-blue-500/10', txt: 'text-blue-400', brd: 'border-blue-500/20', icn: 'text-blue-500' },
  emerald: { bg: 'bg-emerald-500/10', txt: 'text-emerald-400', brd: 'border-emerald-500/20', icn: 'text-emerald-500' },
  amber: { bg: 'bg-amber-500/10', txt: 'text-amber-400', brd: 'border-amber-500/20', icn: 'text-amber-500' },
  rose: { bg: 'bg-rose-500/10', txt: 'text-rose-400', brd: 'border-rose-500/20', icn: 'text-rose-500' },
  indigo: { bg: 'bg-indigo-500/10', txt: 'text-indigo-400', brd: 'border-indigo-500/20', icn: 'text-indigo-500' },
};

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  
  // Modals state
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isTechOpen, setIsTechOpen] = useState(false);
  const [isClientsOpen, setIsClientsOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isCoreOpen, setIsCoreOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSuiviCamOpen, setIsSuiviCamOpen] = useState(false);

  // Grid State
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Scroll Parallax
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 600], [1, 0.8]);
  const heroY = useTransform(scrollY, [0, 600], [0, 200]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCTA = () => isAuthenticated ? navigate('/dashboard') : navigate('/login');

  return (
    <div className="min-h-screen bg-[#010309] text-slate-50 selection:bg-primary/30 font-sans overflow-x-hidden relative cursor-none">
      <BlobCursor />
      <MeshBackground />

      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#010309]/80 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer magnet" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={VELORALogo} alt="VELORA" className="h-8 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-transform hover:scale-110" />
            <span className="text-xl font-black tracking-widest text-white">
              VELORA <span className="text-primary italic">PRO</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
            <a href="#features" className="hover:text-white transition-colors magnet">Fonctionnalités</a>
            <a href="#ecosystem" className="hover:text-white transition-colors magnet">Écosystème</a>
            <a href="#contact" className="hover:text-white transition-colors magnet">Contact</a>
          </div>

          <Button onClick={handleCTA} className="rounded-full px-6 bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] font-black uppercase tracking-widest text-xs h-10 magnet">
            {isAuthenticated ? 'Dashboard Live' : 'Portail Sécurisé'}
          </Button>
        </div>
      </nav>

      {/* HERO SECTION with Parallax */}
      <motion.section 
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative pt-40 pb-0 lg:pt-52 overflow-hidden flex flex-col pointer-events-none"
      >
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center pointer-events-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-8">
            <Zap className="w-4 h-4" /> La Nouvelle Ère de la Gestion Technique
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 max-w-6xl leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            L'Écosystème ERP <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-indigo-500 line-clamp-1 py-1">Tout-en-un.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
            L'ERP B2B absolu. Synchronisez instantanément vos <strong>Projets</strong>, <strong>Tâches</strong>, <strong>Interventions</strong> et <strong>Contrats</strong> avec vos <strong>Actifs</strong> et votre <strong>Flotte</strong>. Le temps réel au service exclusif de votre rentabilité.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6 }} className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleCTA} className="h-14 px-8 rounded-full bg-gradient-to-r from-blue-600 to-primary text-white hover:scale-105 transition-all shadow-[0_0_40px_rgba(59,130,246,0.4)] font-black uppercase tracking-widest text-sm flex items-center gap-2 group magnet">
              Démarrer le Déploiement
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" onClick={() => setIsDemoOpen(true)} className="h-14 px-8 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-sm hover:border-white/30 transition-all backdrop-blur-sm magnet">
              Demander une Démo
            </Button>
          </motion.div>
        </div>

        <div className="pointer-events-auto">

        </div>
      </motion.section>

      {/* Terminal Easter Egg */}
      <div className="container mx-auto px-6 relative z-20">
         <LiveTerminal onTriggerDemo={() => setIsDemoOpen(true)} />
      </div>

      {/* Marquee */}
      <div className="relative w-full overflow-hidden border-y border-white/5 bg-[#010309] py-8 z-20">
        <style>
          {`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: marquee 35s linear infinite; }`}
        </style>
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#010309] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#010309] to-transparent z-10 pointer-events-none" />
        <div className="flex w-[200%] logo-track opacity-50 hover:opacity-100 transition-opacity duration-500">
          <div className="flex w-1/2 justify-around items-center animate-marquee gap-8 px-4">
            <img src={WayconLogo} className="h-8 filter grayscale hover:grayscale-0 transition-all" alt="Waycon" />
            <img src={CommuneLogo} className="h-10 filter grayscale hover:grayscale-0 transition-all" alt="Commune" />
            <img src={NexoraLogo} className="h-6 filter grayscale hover:grayscale-0 transition-all" alt="Nexora" />
            <img src={VELORALogo} className="h-6 filter grayscale hover:grayscale-0 transition-all" alt="Velora" />
            <img src={WayconLogo} className="h-8 filter grayscale hover:grayscale-0 transition-all" alt="Waycon Security" />
          </div>
          <div className="flex w-1/2 justify-around items-center animate-marquee gap-8 px-4" aria-hidden="true">
            <img src={WayconLogo} className="h-8 filter grayscale hover:grayscale-0 transition-all" alt="Waycon" />
            <img src={CommuneLogo} className="h-10 filter grayscale hover:grayscale-0 transition-all" alt="Commune" />
            <img src={NexoraLogo} className="h-6 filter grayscale hover:grayscale-0 transition-all" alt="Nexora" />
            <img src={VELORALogo} className="h-6 filter grayscale hover:grayscale-0 transition-all" alt="Velora" />
            <img src={WayconLogo} className="h-8 filter grayscale hover:grayscale-0 transition-all" alt="Waycon Security" />
          </div>
        </div>
      </div>

      {/* Stats Counter Section */}
      <div className="py-24 max-w-7xl mx-auto px-4 relative z-20 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border border-white/5 py-12 bg-white/[0.02] backdrop-blur-md rounded-[3rem]">
          <div className="flex flex-col items-center justify-center text-center space-y-3 pt-6 md:pt-0">
            <span className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 tabular-nums">
              <AnimatedCounter value={0.5} decimals={1} suffix="s" />
            </span>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-primary">Vitesse de Scan</span>
            <span className="text-xs text-slate-400 font-medium max-w-[200px]">Temps de réaction terrain immédiat sans saisie manuelle.</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center space-y-3 pt-6 md:pt-0 md:border-l border-white/5">
            <span className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
              <AnimatedCounter value={100} suffix="%" />
            </span>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Cryptage AES</span>
            <span className="text-xs text-slate-400 font-medium max-w-[200px]">Audits chiffrés et validation cryptée sur site.</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center space-y-3 pt-6 md:pt-0 md:border-l border-white/5">
            <span className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 tabular-nums">
              <AnimatedCounter value={300} suffix="+" />
            </span>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400">Équipements</span>
            <span className="text-xs text-slate-400 font-medium max-w-[200px]">Suivis activement en production par les techniciens.</span>
          </div>
        </div>
      </div>

      {/* Expandable Bento Grid Features */}
      <section id="features" className="py-24 relative z-10 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 mt-4">Un ERP Modulaire. <br />Sans limites.</h2>
            <p className="text-slate-400 font-medium text-[15px] leading-relaxed">
              Ne jonglez plus entre plusieurs logiciels métier. Velora PRO centralise toutes vos opérations de gestion d'entreprise, des véhicules jusqu'aux validations financières, dans un environnement ultra-réactif et sécurisé.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 auto-rows-[280px]">
            {BENTO_CARDS.map(card => {
              const colors = cardColorMap[card.color];
              return (
                <SpotlightCard 
                  key={card.id} 
                  onClick={() => setActiveCard(card.id)}
                  className={`magnet cursor-pointer ${card.colSpan} ${card.center ? 'items-center justify-center text-center' : ''} p-8 flex flex-col group`}
                >
                  <motion.div layoutId={`card-container-${card.id}`} className="absolute inset-0 bg-transparent z-[-1]" />
                  <motion.div layoutId={`icon-${card.id}`} className={`p-4 ${colors.bg} rounded-2xl w-max ${colors.txt} ${colors.brd} border mb-6 group-hover:scale-110 transition-transform ${card.center ? 'mx-auto group-hover:rotate-12' : ''} ${card.justify === 'end' ? 'mt-auto mb-8' : ''}`}>
                    <card.icon className="w-8 h-8" />
                  </motion.div>
                  <div className="relative z-10">
                     <motion.h3 layoutId={`title-${card.id}`} className={`${card.center ? 'text-lg' : 'text-xl'} font-black text-white mb-2 tracking-tight`}>{card.title}</motion.h3>
                     {card.text && <p className="text-sm text-slate-400 font-medium leading-relaxed">{card.text}</p>}
                  </div>
                </SpotlightCard>
              );
            })}
            
            <SpotlightCard className="col-span-1 md:col-span-3 row-span-1 p-8 flex items-center justify-between group">
              <div className="max-w-xl relative z-10">
                <h3 className="text-xl font-black text-white mb-2 tracking-tight">Profilage Multi-Acteurs avec RBAC Lock</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">Des portails dédiés pour les Directeurs, Responsables et Clients avec des niveaux d'accréditations stricts gérés via 24 permissions logicielles.</p>
              </div>
              <div className="hidden md:flex p-5 h-min bg-white/5 rounded-2xl text-slate-200 border border-white/10 group-hover:scale-110 transition-transform relative z-10">
                <Lock className="w-10 h-10" />
              </div>
            </SpotlightCard>
          </div>
        </div>

        <AnimatePresence>
          {activeCard && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/60 backdrop-blur-xl cursor-pointer" 
                onClick={() => setActiveCard(null)} 
              />
              {BENTO_CARDS.filter(c => c.id === activeCard).map(card => {
                const colors = cardColorMap[card.color];
                return (
                  <motion.div 
                    layoutId={`card-container-${card.id}`}
                    key="expanded-card"
                    className="relative bg-[#020510] border border-white/10 rounded-3xl p-8 md:p-12 max-w-3xl w-full z-10 shadow-2xl flex flex-col overflow-hidden"
                  >
                    <button className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors z-20 magnet" onClick={() => setActiveCard(null)}>
                      <X className="w-6 h-6"/>
                    </button>
                    
                    <motion.div layoutId={`icon-${card.id}`} className={`p-5 ${colors.bg} rounded-2xl w-max ${colors.txt} mb-8`}>
                      <card.icon className="w-12 h-12" />
                    </motion.div>
                    
                    <motion.h3 layoutId={`title-${card.id}`} className="text-4xl font-black text-white mb-6 tracking-tight">{card.title}</motion.h3>
                    <p className="text-slate-300 text-lg mb-10 max-w-xl">{card.text}</p>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="flex-1 min-h-[250px] rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden relative shadow-inner p-8"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center gap-4">
                         <Activity className={`w-24 h-24 ${colors.txt} opacity-20`} />
                         <span className={`text-xs font-mono ${colors.txt}`}>[ EXEMPLE D'INTERFACE PROTEGÉE ]</span>
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* Compare Slider Section */}
      <CompareSlider />

      {/* Ecosystem / Phone Orbit Section */}
      <section id="ecosystem" className="py-32 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest">
              <Camera className="w-4 h-4 text-primary" /> Scanner Ready Actif
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight text-white">
              Connecté au terrain. <br /> <span className="text-primary italic">Velora Mobile Logic.</span>
            </h2>
            <p className="text-slate-400 text-lg">
              L'infrastructure embarque un système pensé "Mobile-First" pour le terrain. Vos opérateurs engagent le scanner sur les codes QR uniques pour faire surgir la matrice exacte du matériel, garantissant zéro défaut de ciblage.
            </p>

            <ul className="space-y-4">
              {["Pointage biométrique & Sign-on-Glass légal", "Interface contextuelle allégée (Drawer & Navbar tactiles) ", "Aucun re-encodage à l'agence nécessaire"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-semibold text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500/80" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:w-1/2 relative flex justify-center perspective-1000 mt-10 md:mt-0">
            <div className="relative">
              {/* Phone Body */}
              <motion.div
                animate={{ rotateY: [-5, 5, -5], rotateX: [2, -2, 2] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="w-[300px] h-[620px] bg-[#020510] border-[8px] border-slate-800 rounded-[3rem] shadow-[0_0_50px_rgba(59,130,246,0.2)] relative overflow-hidden z-20"
              >
                <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-30">
                  <div className="w-32 h-6 bg-slate-800 rounded-b-3xl" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent flex flex-col p-6 pt-16 z-10">
                  <div className="w-full h-48 bg-[#010309] rounded-2xl border border-blue-500/30 mb-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-blue-500/10 blur-xl" />
                    <Camera className="w-12 h-12 text-primary/80 mb-2 z-10" />
                    <span className="text-xs font-black uppercase text-blue-400 z-10">Ready to Scan</span>
                  </div>
                  <div className="w-3/4 h-4 bg-white/10 rounded-full mb-3" />
                  <div className="w-1/2 h-4 bg-white/5 rounded-full mb-8" />
                  <div className="space-y-3 flex-1">
                    {[1, 2, 3].map(i => <div key={i} className="w-full h-14 bg-white/5 rounded-xl border border-white/5" />)}
                  </div>
                  <div className="h-14 mt-4 bg-primary text-white rounded-xl flex items-center justify-center font-black uppercase tracking-widest text-[11px] shadow-lg">
                    Démarrer l'Analyse
                  </div>
                </div>
              </motion.div>

              {/* Orbiting 3D Elements */}
              <motion.div animate={{ y: [-20, 20, -20], rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-10 top-20 bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.3)] z-30 backdrop-blur-xl">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <motion.div animate={{ y: [20, -20, 20], rotate: [0, -5, 5, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute -left-12 bottom-32 bg-slate-900 border border-blue-500/30 p-4 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)] z-30 backdrop-blur-xl">
                <Globe className="w-8 h-8 text-blue-400" />
              </motion.div>
              <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute right-12 top-1/2 bg-rose-500/20 backdrop-blur-md border border-rose-500/50 px-4 py-2 rounded-full shadow-[0_0_30px_rgba(244,63,94,0.4)] z-30 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">WebSocket Active</span>
              </motion.div>
            </div>
            <div className="absolute blur-[120px] w-64 h-64 bg-primary/20 top-1/2 -translate-y-1/2 -z-10" />
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 relative z-10 border-t border-white/5 bg-[#010309]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020510] to-[#010309] pointer-events-none" />
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">Investissez dans <br /><span className="text-primary italic">l'Automatisation.</span></h2>
            <p className="text-slate-400 font-medium text-lg">Des offres adaptées à l'échelle de vos opérations. Sans frais cachés.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* ESSENTIEL */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:border-blue-500/30 transition-all duration-300">
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Essentiel</h3>
              <p className="text-sm text-slate-400 mb-6">Pour les équipes techniques ciblées.</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-white">499 <span className="text-xl text-primary">TND</span></span>
                <span className="text-slate-500 text-sm font-medium"> / mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                {["Gestion ITSM & Interventions", "Suivi de Projets & Planning", "Jusqu'à 10 Utilisateurs Actifs", "Support Standard Mails"].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <Button onClick={() => setIsDemoOpen(true)} className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold tracking-widest uppercase border border-white/10">Commencer</Button>
            </div>

            {/* ENTERPRISE PRO */}
            <div className="bg-gradient-to-b from-blue-900/20 to-[#020510] border-2 border-primary/50 shadow-[0_0_50px_rgba(59,130,246,0.15)] rounded-3xl p-10 backdrop-blur-md relative transform md:-translate-y-4">
              <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
                <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">Recommandé</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Enterprise PRO</h3>
              <p className="text-sm text-blue-200/60 mb-6">La suite ERP complète pour piloter toute l'entreprise.</p>
              <div className="mb-8">
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">1290 <span className="text-2xl">TND</span></span>
                <span className="text-blue-200/50 text-sm font-medium"> / mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Tous les modules inclus (Parc Auto, Immos, Achats...)', 'Scanner QR Code Natif & Validation PDF', 'Utilisateurs Illimités (RBAC Strict)', 'Support Prioritaire 24/7 & SLA', 'Tableaux de Bord Analytics Avancés'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-200 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <Button onClick={() => setIsDemoOpen(true)} className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-primary hover:from-blue-500 text-white font-black tracking-widest uppercase shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-105 transition-all">Déployer l'Infrastructure</Button>
            </div>

            {/* ON PREMISE */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:border-white/30 transition-all duration-300">
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Sur-mesure</h3>
              <p className="text-sm text-slate-400 mb-6">Infrastructures gouvernementales ou haute sécurité.</p>
              <div className="mb-8 pt-2 pb-3">
                <span className="text-4xl font-black text-white">Sur devis</span>
              </div>
              <ul className="space-y-4 mb-8 mt-1">
                {['Installation sur vos Serveurs Physiques', 'Développement de Modules Custom', 'Intégration Active Directory (SSO)', 'Marque Blanche Totale'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                    <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <Button onClick={() => setIsDemoOpen(true)} className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold tracking-widest uppercase border border-white/10">Contacter les Ventes</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Extreme CTA Banner */}
      <section className="relative py-32 overflow-hidden bg-[#020510] border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-700/20 to-transparent blur-[150px] pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 drop-shadow-2xl">
            Acceptez L'Excellence.
          </h2>
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            L'Avenir absolu de la Gestion d'Infrastructure est déployé. Transformez instantanément vos pôles techniques en centres de confiance incassables.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 w-full justify-center">
            <Button onClick={() => setIsDemoOpen(true)} className="h-16 px-10 rounded-full bg-gradient-to-r from-blue-600 to-primary hover:from-blue-500 hover:to-blue-400 hover:scale-105 transition-all text-white font-black uppercase tracking-widest text-[14px] shadow-[0_0_60px_rgba(59,130,246,0.6)] relative group overflow-hidden magnet">
              <div className="absolute inset-0 w-full h-full bg-white/20 blur-md -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700" />
              Exiger l'accès privé
            </Button>
            <Button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} variant="outline" className="h-16 px-10 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[14px] hover:border-white/30 transition-all backdrop-blur-md magnet">
              Demander au support
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="relative z-10 border-t border-white/5 bg-[#010309] pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-4 lg:col-span-1">
              <div className="flex items-center gap-3">
                <img src={VELORALogo} alt="VELORA" className="h-6 opacity-90 drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]" />
                <span className="text-xl font-black tracking-widest text-white">VELORA</span>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-2">
                The Standard for Infrastructure Management.
              </p>
              <div className="pt-6 mt-4 border-t border-white/5 relative group w-max">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-primary/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="relative flex items-center justify-center p-3 rounded-2xl bg-[#010309] border border-white/10 hover:border-primary/50 transition-all duration-500">
                  <img src={WayconLogo} alt="Waycon Méditerranée" className="h-8 object-contain opacity-80 group-hover:opacity-100 transition-all" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs text-white mb-6">Entreprise</h4>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li><a href="#vision" onClick={(e) => { e.preventDefault(); setIsVisionOpen(true); }} className="hover:text-white transition-colors cursor-pointer magnet">Notre Vision Tactique</a></li>
                <li><a href="#tech" onClick={(e) => { e.preventDefault(); setIsTechOpen(true); }} className="hover:text-white transition-colors cursor-pointer magnet">Technologies Master</a></li>
                <li><a href="#clients" onClick={(e) => { e.preventDefault(); setIsClientsOpen(true); }} className="hover:text-white transition-colors cursor-pointer magnet">Portefeuille</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs text-white mb-6">Écosystème</h4>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li><a href="#core" onClick={(e) => { e.preventDefault(); setIsCoreOpen(true); }} className="hover:text-white transition-colors cursor-pointer magnet">Velora Core Base</a></li>
                <li><a href="#scanner" onClick={(e) => { e.preventDefault(); setIsScannerOpen(true); }} className="hover:text-white transition-colors cursor-pointer magnet">Scanner Natif</a></li>
                <li><a href="#suivicam" onClick={(e) => { e.preventDefault(); setIsSuiviCamOpen(true); }} className="hover:text-white transition-colors cursor-pointer magnet">SuiviCam Network</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-widest text-xs text-white mb-6">Contact</h4>
              <ul className="space-y-4 text-sm text-slate-400 font-medium">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Waycon Méditerranée<br />Av. Yasser Arafat, Imm. Narjess,<br />4054 Sousse</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <a href="mailto:contact@waycon.com" className="hover:text-white transition-colors magnet">contact@waycon.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>+216 73 820 747</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-6">
              <a href="#legal" onClick={(e) => { e.preventDefault(); setIsLegalModalOpen(true); }} className="text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-white transition-colors cursor-pointer magnet">Légal & Audit</a>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); setIsPrivacyModalOpen(true); }} className="text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-white transition-colors cursor-pointer magnet">Sécurité des Données</a>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 text-center md:text-right">
              &copy; 2026 Waycon Méditerranée. Infrastructured By Houssain M.
            </p>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <TextModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} title="Mentions Légales">
        <p><strong>Éditeur du site :</strong><br />Waycon Méditerranée, Sousse, Tunisie.</p>
        <p><strong>Propriété intellectuelle :</strong><br />L'ensemble du code de Velora PRO est protégé. Les architectures logiques (Velora Core) relèvent de la législation sur la propriété intellectuelle exclusive.</p>
      </TextModal>
      <TextModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} title="Sécurité et Crypto">
        <p>La donnée récoltée en intervention B2B (Mots de Passe Hashés, Signatures Biométriques Actives PDF, Adresses Ips) est purement à usage interne pour le logging du "Mission Critical System". Conformité maximale RGPD garantie sur les bases Prisma.</p>
      </TextModal>
      <TextModal isOpen={isVisionOpen} onClose={() => setIsVisionOpen(false)} title="Vision Tactique">
        <p>Transférer l'exigence et le visuel des Command-Centers informatiques internationaux directement aux PME d'installations et maintenances. Zéro papier, Temps-Réel (Sockets), Signature Légale PDF Automatique.</p>
      </TextModal>
      <TextModal isOpen={isTechOpen} onClose={() => setIsTechOpen(false)} title="Tech Master">
        <p>Backend propulsé par <strong>NestJS 11 Engine</strong> avec ORM Prisma strict. Sécurité de pointe RBAC. Frontend réactif SPA sous mémoire tampon Zustand et requête React-Query V5 (Architecture Monorepo Avancée).</p>
      </TextModal>
      <TextModal isOpen={isClientsOpen} onClose={() => setIsClientsOpen(false)} title="Portefeuille Premium">
        <p>Nous protégeons les infrastructures de grandes institutions (Gouvernementales, Hôpitaux) en fournissant l'interface exacte qui ne permet pas d'erreurs logiques sous le feu de l'action de grands projets B2B.</p>
      </TextModal>
      <TextModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Scanner Natif Terrain">
        <p>Sur votre smartphone, évitez de taper le code machine. L'outil ouvre en 0.5s via HTML5-QrCode l'environnement direct lié, tout en empêchant géographiquement d'interagir si vous n'êtes pas sur le lieu exact (Pointage GPS Backend).</p>
      </TextModal>
      <TextModal isOpen={isCoreOpen} onClose={() => setIsCoreOpen(false)} title="Velora Core Backend">
        <p>C'est l'API maître qui traite les WebSockets, gère virtuellement la monnaie SLA des contrats et encaise les alertes (Cron jobs PPM pour auto-émettre des demandes de maintenances le jour de l'anniversaire du contrat).</p>
      </TextModal>
      <TextModal isOpen={isSuiviCamOpen} onClose={() => setIsSuiviCamOpen(false)} title="SuiviCam Network">
        <p>L'héritage d'exploitation Waycon purement axé sur la télé-vidéo (CCTV). Un grand frère fonctionnel au même code source partagé (Typescript Workspace).</p>
      </TextModal>

      <TextModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} title="Demande B2B Elite">
        <div className="space-y-6 pt-2">
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); toast.success('Requête Prioritaire Envoyée !'); setIsDemoOpen(false); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Opérateur *</label><input required className="w-full bg-[#010309] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none text-white font-medium" placeholder="Ex: Directeur Général" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Société *</label><input required className="w-full bg-[#010309] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none text-white font-medium" placeholder="Ex: Tech Corp" /></div>
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Portée du Projet *</label><textarea required rows={4} className="w-full bg-[#010309] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none text-white resize-none font-medium custom-scrollbar" placeholder="Volume visé, besoin sur mesure..."></textarea></div>
            <Button type="submit" className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-primary hover:from-blue-500 text-white font-black uppercase tracking-widest shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:scale-[1.02] magnet">Envoyer au Centre Opérationnel</Button>
          </form>
        </div>
      </TextModal>
    </div>
  );
}
