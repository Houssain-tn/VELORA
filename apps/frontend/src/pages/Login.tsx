import { useState } from 'react';
import { ShieldCheck, TrendingUp, Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import WayconLogo from '@/assets/Logos/Waycon_logo.png';
import CommuneLogo from '@/assets/Logos/commune-sousse.png';
import VeloraLogo from '@/assets/Logos/Velora_logo.svg';
import { toast } from '@/components/ui/Toaster';

import { useAuthStore } from '@/stores/useAuthStore';

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;
      
      // Update global auth state
      login(accessToken, refreshToken, user);
      
      navigate('/modules');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Identifiants invalides ou erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info("Veuillez contacter l'équipe de développement Waycon pour réinitialiser votre mot de passe.");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Visual Brand Side */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="z-10 text-center max-w-md space-y-6">
          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative p-10 bg-white rounded-[3rem] shadow-[0_0_80px_rgba(255,255,255,0.1)] border border-white/20 transform group-hover:scale-[1.05] transition-transform duration-500 ease-out">
                <img 
                  src={VeloraLogo} 
                  alt="VELORA PRO" 
                  className="h-32 md:h-40 w-full object-contain drop-shadow-2xl" 
                />
              </div>
            </div>
            <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase italic drop-shadow-sm">VELORA PRO</h2>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
              Simplifiez votre <span className="text-primary">Sécurité.</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Gérez vos interventions techniques et suivez vos équipements facilement. 
              Une solution <span className="font-bold text-foreground/80">simple, rapide et efficace</span> pour les experts de la sécurité.
            </p>
          </div>

          {/* Pro Features Grid */}
          <div className="grid grid-cols-1 gap-4 pt-6 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-left-8 duration-700 delay-150">
            <div className="flex items-center gap-4 bg-background/40 hover:bg-background/60 p-4 rounded-2xl border border-border/10 backdrop-blur-md shadow-sm transition-all hover:translate-x-2 group">
              <div className="p-2 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Vigilance Active</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-tight">Maintenance préventive pour une protection périmétrique sans faille.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-background/40 hover:bg-background/60 p-4 rounded-2xl border border-border/10 backdrop-blur-md shadow-sm transition-all hover:translate-x-2 group">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Performance Pilotée</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-tight">Analyses et SLAs optimisés pour vos infrastructures de sécurité critiques.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-background/40 hover:bg-background/60 p-4 rounded-2xl border border-border/10 backdrop-blur-md shadow-sm transition-all hover:translate-x-2 group">
              <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Réactivité Maximale</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-tight">Flux opérationnels temps réel et intelligence situationnelle immédiate.</p>
              </div>
            </div>
          </div>

          {/* Logos des partenaires */}
          <div className="pt-8 flex items-center justify-center gap-12 mt-12 border-t border-border/50">
            <img src={WayconLogo} alt="Waycon" className="h-8 grayscale hover:grayscale-0 transition-all opacity-80" />
            <img src={CommuneLogo} alt="Commune de Sousse" className="h-12 grayscale hover:grayscale-0 transition-all opacity-80" />
          </div>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="flex items-center justify-center p-8">
        <div className="mx-auto w-full max-w-md space-y-6">
          
          <div className="lg:hidden flex flex-col items-center space-y-4 mb-4">
            <div className="p-6 bg-white rounded-3xl shadow-xl border border-border/10">
              <img src={VeloraLogo} alt="VELORA PRO" className="h-20 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase italic pb-1">
              VELORA PRO
            </h1>
            <div className="flex items-center gap-6 opacity-60 pt-2">
              <img src={WayconLogo} alt="Waycon" className="h-5" />
              <img src={CommuneLogo} alt="Commune Sousse" className="h-8" />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-black uppercase tracking-tight">Accès Sécurisé</h1>
            <p className="text-sm text-muted-foreground font-medium italic">
              Accédez à votre espace de travail en toute simplicité.
            </p>
          </div>
          
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 mt-8">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="identifiant@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                  Mot de passe
                </label>
                <a 
                  href="#" 
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:underline transition-colors"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button
              disabled={loading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-4 shadow-lg shadow-primary/20"
              type="submit"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Authentification en cours...
                </div>
              ) : (
                "Se connecter"
              )}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setIsDemoOpen(true); }}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold border border-input bg-transparent hover:bg-muted hover:text-foreground h-10 px-4 py-2 w-full mt-2 transition-colors"
            >
              Demander un accès ou une démo
            </button>
          </form>
          
          <p className="px-8 text-center text-sm text-muted-foreground">
            En vous connectant, vous acceptez nos{' '}
            <button 
              onClick={() => setIsTermsOpen(true)}
              className="underline underline-offset-4 hover:text-primary transition-colors cursor-pointer"
            >
              Conditions de service
            </button>.
          </p>

          {/* Official Credits */}
          <div className="pt-8 mt-8 border-t border-border/50 text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <div className="flex flex-col items-center gap-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Copyright</p>
              <a 
                href="https://www.linkedin.com/company/waycon-m%C3%A9diterran%C3%A9e" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-black hover:text-primary transition-colors"
              >
                Waycon Méditerranée © 2026
              </a>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Infrastructured By</p>
              <a 
                href="https://www.linkedin.com/in/houssain-messaoudi/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-bold hover:text-primary transition-colors group"
              >
                HOUSSAIN MESSAOUDI 
                <span className="block text-[8px] font-black uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">Responsable SAV</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions de Service Modal */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b flex justify-between items-center bg-muted/30">
              <h3 className="text-xl font-black uppercase tracking-tight">Conditions de Service</h3>
              <button 
                onClick={() => setIsTermsOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
              <section>
                <h4 className="font-bold text-foreground mb-2 uppercase tracking-wider text-xs">1. Utilisation de la Plateforme</h4>
                <p>VELORA PRO est une plateforme réservée aux professionnels de Waycon Méditerranée et à leurs partenaires habilités. Tout accès non autorisé est strictement interdit.</p>
              </section>
              <section>
                <h4 className="font-bold text-foreground mb-2 uppercase tracking-wider text-xs">2. Confidentialité des Données</h4>
                <p>Toutes les données relatives aux interventions techniques, sites clients et infrastructures de sécurité sont classées confidentielles. L'utilisateur s'engage à ne pas divulguer ces informations à des tiers.</p>
              </section>
              <section>
                <h4 className="font-bold text-foreground mb-2 uppercase tracking-wider text-xs">3. Responsabilité de l'Utilisateur</h4>
                <p>L'utilisateur est responsable de la conservation de ses identifiants. Toute action effectuée depuis son compte est réputée être de son fait.</p>
              </section>
              <section>
                <h4 className="font-bold text-foreground mb-2 uppercase tracking-wider text-xs">4. Maintenance et Disponibilité</h4>
                <p>Waycon Méditerranée s'efforce d'assurer une disponibilité 24/7, mais se réserve le droit d'effectuer des opérations de maintenance technique sans préavis pour garantir la sécurité du système.</p>
              </section>
              <p className="text-[10px] italic pt-4 border-t opacity-60">Dernière mise à jour : Avril 2026</p>
            </div>
            <div className="p-6 bg-muted/30 border-t flex justify-end">
              <button 
                onClick={() => setIsTermsOpen(false)}
                className="px-8 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Request Modal */}
      {isDemoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-muted/30">
              <h3 className="text-xl font-black uppercase tracking-tight">Demande B2B & Démo</h3>
              <button 
                onClick={() => setIsDemoOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-sm text-foreground font-medium text-center max-w-lg mx-auto">
                Complétez ce formulaire pour être recontacté par nos experts techniques sous 24 heures et obtenir l'accès à un environnement de test sécurisé.
              </p>
              
              <form className="space-y-5" onSubmit={(e) => { 
                e.preventDefault(); 
                toast.success('Demande envoyée ! Notre équipe vous contactera rapidement.'); 
                setIsDemoOpen(false); 
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">Nom Complet *</label>
                    <input required type="text" className="w-full bg-background border border-input rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 font-medium" placeholder="Ex: Jean Dupont" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">Entreprise *</label>
                    <input required type="text" className="w-full bg-background border border-input rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 font-medium" placeholder="Ex: Waycon Security" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">Email Professionnel *</label>
                    <input required type="email" className="w-full bg-background border border-input rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 font-medium" placeholder="jean@entreprise.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">Téléphone</label>
                    <input type="tel" className="w-full bg-background border border-input rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 font-medium" placeholder="+216 XX XXX XXX" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">Votre Besoin Spécifique *</label>
                  <textarea required rows={4} className="w-full bg-background border border-input rounded-xl px-4 py-3.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 resize-none font-medium" placeholder="Décrivez votre processus actuel, le volume d'équipements, ou les modules spécifiques qui vous intéressent..."></textarea>
                </div>
                
                <div className="pt-2">
                  <button type="submit" className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all transform hover:scale-[1.02]">
                    Envoyer la Demande
                  </button>
                </div>
                
                <p className="text-[11px] text-center text-muted-foreground font-semibold uppercase tracking-wider mt-4">
                  Ou parlez à un expert au <a href="mailto:velora@waycon.com" className="text-primary hover:underline ml-1">velora@waycon.com</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
