import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Save, Plus, GitBranch, Play, PlayCircle, StopCircle, 
  Workflow, ArrowRight, Shield, Zap, Search, Activity, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { Navigate } from 'react-router-dom';

// Types
type NodeType = 'start' | 'process' | 'decision' | 'end';
interface Node {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  color: string;
  icon: any;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// Mock Data
const MOCK_WORKFLOWS = [
  { id: 'wf_interventions', name: 'Cycle de vie - Interventions', category: 'Opérations', active: true },
  { id: 'wf_achats', name: "Circuit de validation d'Achats", category: 'Finance', active: true },
  { id: 'wf_reservations', name: 'Réservation Véhicules', category: 'Actifs', active: false },
  { id: 'wf_onboarding', name: 'Onboarding Technicien', category: 'RH', active: false },
];

const INTERVENTION_NODES: Node[] = [
  { id: 'n_nouveau', label: 'NOUVEAU', type: 'start', x: 100, y: 250, color: 'text-slate-500', icon: PlayCircle },
  { id: 'n_attente', label: 'EN_ATTENTE', type: 'process', x: 350, y: 100, color: 'text-amber-500', icon: Clock },
  { id: 'n_cours', label: 'EN_COURS', type: 'process', x: 350, y: 250, color: 'text-blue-500', icon: Activity },
  { id: 'n_resolu', label: 'RESOLU', type: 'process', x: 600, y: 250, color: 'text-emerald-500', icon: CheckCircle },
  { id: 'n_cloture', label: 'CLOTUREE', type: 'end', x: 850, y: 250, color: 'text-teal-600', icon: StopCircle },
  { id: 'n_annule', label: 'ANNULEE', type: 'end', x: 600, y: 400, color: 'text-rose-500', icon: AlertCircle },
];

const INTERVENTION_EDGES: Edge[] = [
  { id: 'e_n_to_c', source: 'n_nouveau', target: 'n_cours', label: 'Assignation' },
  { id: 'e_n_to_a', source: 'n_nouveau', target: 'n_attente', label: 'Info manquante' },
  { id: 'e_a_to_c', source: 'n_attente', target: 'n_cours', label: 'Reprise' },
  { id: 'e_c_to_r', source: 'n_cours', target: 'n_resolu', label: 'Travaux terminés' },
  { id: 'e_r_to_cl', source: 'n_resolu', target: 'n_cloture', label: 'Validation Client' },
  { id: 'e_r_to_c', source: 'n_resolu', target: 'n_cours', label: 'Rejet Client' },
  { id: 'e_c_to_an', source: 'n_cours', target: 'n_annule', label: 'Intervention annulée' },
];

export function Workflows() {
  const { user } = useAuthStore();
  const [activeWf, setActiveWf] = useState(MOCK_WORKFLOWS[0]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  
  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/modules" />;
  }

  // Canvas drawing utilities
  const getNodeCenter = (node: Node) => ({ x: node.x + 80, y: node.y + 40 }); // Assuming node width 160, height 80

  const generatePath = (sourceNode: Node, targetNode: Node) => {
    const s = getNodeCenter(sourceNode);
    const t = getNodeCenter(targetNode);
    // Add simple bezier curve
    const dx = Math.abs(t.x - s.x);
    return `M ${s.x} ${s.y} C ${s.x + dx/2} ${s.y}, ${t.x - dx/2} ${t.y}, ${t.x} ${t.y}`;
  };

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      
      {/* LEFT SIDEBAR: WORKFLOW LIST */}
      <aside className="w-80 border-r bg-muted/10 flex flex-col hidden md:flex">
        <div className="p-6 border-b bg-background">
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl text-primary"><Workflow className="w-5 h-5" /></div>
             BPMN Engine
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Business Process Modeling</p>
        </div>
        
        <div className="p-4 border-b">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input 
               type="text" 
               placeholder="Rechercher un processus..." 
               className="w-full bg-muted/50 border border-transparent focus:border-primary/30 rounded-xl py-2 pl-9 pr-4 text-sm font-medium outline-none transition-all"
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {MOCK_WORKFLOWS.map(wf => (
            <button
              key={wf.id}
              onClick={() => { setActiveWf(wf); setSelectedNode(null); setSelectedEdge(null); }}
              className={cn(
                "w-full text-left p-4 rounded-[1.5rem] transition-all border group",
                activeWf.id === wf.id 
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 border-primary" 
                  : "bg-card border-border hover:border-primary/30 hover:shadow-lg"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                 <span className={cn(
                   "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                   activeWf.id === wf.id ? "bg-black/20" : "bg-muted text-muted-foreground"
                 )}>
                   {wf.category}
                 </span>
                 <div className={cn("w-2 h-2 rounded-full", wf.active ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
              </div>
              <h3 className="text-sm font-bold truncate">{wf.name}</h3>
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t bg-background">
          <button className="w-full py-3 bg-muted/50 hover:bg-muted text-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-dashed border-border">
            <Plus className="w-4 h-4" /> Nouveau Processus
          </button>
        </div>
      </aside>

      {/* MAIN CANVAS AREA */}
      <main className="flex-1 flex flex-col relative bg-[#f8fafc] dark:bg-[#0a0a0a]">
        {/* Canvas Header */}
        <header className="h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-black tracking-tight">{activeWf.name}</h2>
             <span className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border", activeWf.active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-100 text-slate-500 border-slate-200")}>
               {activeWf.active ? 'Actif (En Production)' : 'Brouillon'}
             </span>
          </div>
          <div className="flex items-center gap-2">
             <button className="px-4 py-2 text-xs font-bold bg-muted hover:bg-muted/80 rounded-xl transition-colors flex items-center gap-2">
               <Play className="w-3.5 h-3.5" /> Simuler
             </button>
             <button className="px-5 py-2 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2">
               <Save className="w-3.5 h-3.5" /> Sauvegarder
             </button>
          </div>
        </header>

        {/* BPMN CANVAS */}
        <div className="flex-1 relative overflow-auto" onClick={() => { setSelectedNode(null); setSelectedEdge(null); }}>
          {/* Grid Background */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(150, 150, 150, 0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          {activeWf.id === 'wf_interventions' ? (
            <div className="relative w-[1500px] h-[1000px]">
              
              {/* SVG LAYER FOR EDGES */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                  </marker>
                  <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
                  </marker>
                </defs>
                {INTERVENTION_EDGES.map(edge => {
                  const source = INTERVENTION_NODES.find(n => n.id === edge.source);
                  const target = INTERVENTION_NODES.find(n => n.id === edge.target);
                  if (!source || !target) return null;
                  
                  const isSelected = selectedEdge?.id === edge.id;
                  const path = generatePath(source, target);
                  
                  return (
                    <g key={edge.id} className="cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); setSelectedEdge(edge); setSelectedNode(null); }}>
                      {/* Invisible wider path for easier clicking */}
                      <path d={path} stroke="transparent" strokeWidth="20" fill="none" />
                      
                      {/* Main Stroke */}
                      <path 
                        d={path} 
                        stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} 
                        strokeWidth={isSelected ? 3 : 2} 
                        fill="none" 
                        strokeOpacity={isSelected ? 1 : 0.3}
                        markerEnd={`url(#${isSelected ? 'arrowhead-selected' : 'arrowhead'})`}
                        className="transition-all duration-300"
                      />
                      
                      {/* Animated Pulse on active workflow */}
                      {activeWf.active && (
                        <motion.path
                          d={path}
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="4 12"
                          initial={{ strokeDashoffset: 100 }}
                          animate={{ strokeDashoffset: 0 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          opacity={0.6}
                        />
                      )}
                      
                      {/* Edge Label */}
                      {edge.label && (
                        <foreignObject 
                          x={(source.x + target.x) / 2 + 30} 
                          y={(source.y + target.y) / 2 + 20} 
                          width="120" 
                          height="30"
                        >
                          <div className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-background/80 backdrop-blur rounded border text-center whitespace-nowrap",
                            isSelected ? "border-primary text-primary" : "border-border text-muted-foreground"
                          )}>
                            {edge.label}
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* HTML LAYER FOR NODES */}
              {INTERVENTION_NODES.map(node => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div 
                    key={node.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedNode(node); setSelectedEdge(null); }}
                    className={cn(
                      "absolute flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all duration-200 z-10 w-[160px] h-[80px]",
                      "bg-card border-2 shadow-xl",
                      isSelected ? "border-primary ring-4 ring-primary/20 scale-105" : "border-border hover:border-muted-foreground/50",
                      node.type === 'start' && "rounded-full w-[100px] h-[100px]",
                      node.type === 'end' && "rounded-full border-[4px]"
                    )}
                    style={{ left: node.x, top: node.y }}
                  >
                    <node.icon className={cn("w-6 h-6 mb-1", node.color)} />
                    <span className="text-[10px] font-black tracking-widest uppercase">{node.label}</span>
                  </div>
                );
              })}
              
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
               <GitBranch className="w-16 h-16 mb-4" />
               <h3 className="text-xl font-black uppercase tracking-widest">Workflow en construction</h3>
               <p className="text-sm font-medium mt-2">Sélectionnez un processus actif</p>
            </div>
          )}
        </div>

        {/* RIGHT PROPERTY PANEL (Slides in when a node/edge is selected) */}
        {(selectedNode || selectedEdge) && (
          <aside className="absolute right-0 top-16 bottom-0 w-80 bg-background border-l shadow-2xl z-20 flex flex-col animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
               <h3 className="font-black text-sm uppercase tracking-widest">
                 {selectedNode ? 'Propriétés État' : 'Règle de Transition'}
               </h3>
               <button onClick={() => { setSelectedNode(null); setSelectedEdge(null); }} className="p-1 hover:bg-muted rounded text-muted-foreground"><Settings className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
               {selectedNode && (
                 <>
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Code Statut</label>
                     <input type="text" value={selectedNode.label} className="w-full mt-1 bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm font-bold" readOnly />
                   </div>
                   
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                       <Shield className="w-3 h-3" /> Permissions d'Accès
                     </label>
                     <div className="space-y-2">
                        <label className="flex items-center gap-3 p-2 border rounded-lg bg-muted/20">
                          <input type="checkbox" checked className="rounded text-primary focus:ring-primary" readOnly />
                          <span className="text-xs font-bold">Techniciens</span>
                        </label>
                        <label className="flex items-center gap-3 p-2 border rounded-lg bg-muted/20">
                          <input type="checkbox" checked className="rounded text-primary focus:ring-primary" readOnly />
                          <span className="text-xs font-bold">Administrateurs</span>
                        </label>
                        <label className="flex items-center gap-3 p-2 border rounded-lg">
                          <input type="checkbox" className="rounded text-primary focus:ring-primary" readOnly />
                          <span className="text-xs font-bold text-muted-foreground">Clients</span>
                        </label>
                     </div>
                   </div>

                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                       <Zap className="w-3 h-3 text-amber-500" /> Actions Automatiques
                     </label>
                     <div className="p-3 border border-dashed border-amber-500/30 bg-amber-500/5 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-400">
                        Au passage à cet état :
                        <ul className="list-disc pl-4 mt-2 space-y-1">
                          <li>Notifier le client par email</li>
                          <li>Mettre en pause le chronomètre SLA</li>
                        </ul>
                     </div>
                   </div>
                 </>
               )}

               {selectedEdge && (
                 <>
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Condition de passage</label>
                     <input type="text" value={selectedEdge.label || ''} className="w-full mt-1 bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm font-bold" readOnly />
                   </div>
                   <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex flex-col gap-2">
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">Source</span>
                      <span className="text-xs font-bold">{selectedEdge.source}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground my-1" />
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">Destination</span>
                      <span className="text-xs font-bold">{selectedEdge.target}</span>
                   </div>
                 </>
               )}
            </div>
            
            <div className="p-4 border-t bg-muted/10">
              <button className="w-full py-2 bg-foreground text-background font-black uppercase tracking-widest text-xs rounded-xl shadow-lg hover:scale-[1.02] transition-transform">
                Appliquer
              </button>
            </div>
          </aside>
        )}

      </main>
    </div>
  );
}
