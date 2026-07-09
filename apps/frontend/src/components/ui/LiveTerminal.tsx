import { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export const LiveTerminal = ({ onTriggerDemo }: { onTriggerDemo: () => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const baseLogs = [
    "[SYS] Connecting to Secure Node V2.1...",
    "[SEC] Handshake AES-256 Verified.",
    "[NET] WebSocket Synchronized.",
    "[SYS] Velora Ecosystem Ready.",
    "Type 'velora start' to execute launch protocol."
  ];

  useEffect(() => {
    let delay = 0;
    baseLogs.forEach((log) => {
      delay += Math.random() * 600 + 400;
      setTimeout(() => {
        setLogs(prev => [...prev, log]);
      }, delay);
    });
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-xl bg-[#010206]/80 backdrop-blur-xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-sm relative z-20 mb-20">
      <div className="bg-[#050814] border-b border-slate-800 px-4 py-3 flex items-center gap-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/50" />
          <div className="w-3 h-3 rounded-full bg-amber-500/50" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
        </div>
        <div className="flex-1 text-center text-xs text-slate-500 flex justify-center items-center gap-2"><Terminal className="w-3 h-3"/> velora_deploy_v2.sh</div>
      </div>
      <div ref={containerRef} className="p-6 h-64 overflow-y-auto text-emerald-500/80 custom-scrollbar space-y-2 text-[13px]">
        {logs.map((log, i) => <div key={i}>{log}</div>)}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-blue-500 whitespace-nowrap">root@velora:~$</span>
          <input 
            type="text" 
            className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 w-full" 
            autoComplete="off"
            spellCheck="false"
            onKeyDown={(e) => {
              if(e.key === 'Enter') {
                const val = e.currentTarget.value.toLowerCase().trim();
                setLogs(prev => [...prev, `> ${val}`]);
                if (val === 'velora start') {
                  setLogs(prev => [...prev, "[EXEC] Bypass granted. Initiating UI..."]);
                  setTimeout(onTriggerDemo, 800);
                } else if(val) {
                  setLogs(prev => [...prev, `Command not found: ${val}`]);
                }
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
