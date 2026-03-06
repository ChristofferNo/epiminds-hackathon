import { useState, useEffect, useRef, useCallback } from 'react';
import { agents as initialAgents, mockFindings, type Finding, type Agent } from '@/data/mockData';

interface SwarmPageProps {
  topic: string;
  onComplete: () => void;
}

const SwarmPage = ({ topic, onComplete }: SwarmPageProps) => {
  const [agentStates, setAgentStates] = useState<Agent[]>(initialAgents.map(a => ({ ...a, active: true })));
  const [agentPositions, setAgentPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingCount, setFindingCount] = useState(0);
  const [commLines, setCommLines] = useState<{ from: string; to: string; key: number }[]>([]);
  const [flashingAgents, setFlashingAgents] = useState<Set<string>>(new Set());
  const [showCompleteBtn, setShowCompleteBtn] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const commKeyRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Initialize positions at Center HQ and Deploy
  useEffect(() => {
    const hqPos = { x: 50, y: 50 };
    const initial: Record<string, { x: number; y: number }> = {};
    agentStates.forEach(a => { initial[a.id] = { ...hqPos }; });
    setAgentPositions(initial);
    
    const t = setTimeout(() => {
      setDeployed(true);
      const deployedPositions: Record<string, { x: number; y: number }> = {};
      agentStates.forEach(a => { 
        deployedPositions[a.id] = { x: a.zone.x, y: a.zone.y }; 
      });
      setAgentPositions(deployedPositions);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // 2. Intelligence Feed
  useEffect(() => {
    if (!deployed) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i >= mockFindings.length) { clearInterval(interval); return; }
      const finding = mockFindings[i];
      setFindings(prev => [finding, ...prev]);
      setFindingCount(prev => prev + 1);
      
      setFlashingAgents(prev => new Set(prev).add(finding.agentId));
      setTimeout(() => {
        setFlashingAgents(prev => {
          const next = new Set(prev);
          next.delete(finding.agentId);
          return next;
        });
      }, 600);
      
      i++;
    }, 1800);
    return () => clearInterval(interval);
  }, [deployed]);

  // 3. High-Frequency Chatter (Comm Lines)
  useEffect(() => {
    if (!deployed) return;
    const interval = setInterval(() => {
      const activeAgents = agentStates.filter(a => a.active);
      if (activeAgents.length < 2) return;
      
      const a1 = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      let a2 = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      
      const toHQ = Math.random() > 0.7;

      const key = commKeyRef.current++;
      setCommLines(prev => [...prev, { 
        from: a1.id, 
        to: toHQ ? 'HQ_ANCHOR' : a2.id, 
        key 
      }]);

      setTimeout(() => {
        setCommLines(prev => prev.filter(l => l.key !== key));
      }, 1200);
    }, 800); 

    return () => clearInterval(interval);
  }, [deployed, agentStates]);

  useEffect(() => {
    const t = setTimeout(() => setShowCompleteBtn(true), 15000);
    return () => clearTimeout(t);
  }, []);

  const toggleAgent = useCallback((id: string) => {
    setAgentStates(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }, []);

  const getPos = (id: string) => {
    if (id === 'HQ_ANCHOR') return { x: 50, y: 50 };
    return agentPositions[id] || { x: 50, y: 50 };
  };

  return (
    <div className="fixed inset-0 bg-parchment-light flex overflow-hidden font-sans">
      {/* INJECTED ANIMATIONS */}
      <style>{`
        @keyframes comm-line {
          0% { stroke-dashoffset: 40; opacity: 0; }
          20% { opacity: 0.8; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }

        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }

        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* HUD Header */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-white/60 backdrop-blur-xl flex items-center px-6 z-50 border-b border-black/5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Swarm Protocol Active</span>
          </div>
          <div className="h-4 w-[1px] bg-black/10" />
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            Topic: <span className="text-foreground italic">"{topic}"</span>
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={containerRef} className="flex-1 relative mt-12 overflow-hidden bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:30px_30px]">
        
        {/* Radar Sweep Effect */}
        <div 
          className="absolute top-1/2 left-1/2 w-[150%] h-[150%] pointer-events-none opacity-[0.03]"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, currentColor 40deg, transparent 41deg)',
            transformOrigin: 'top left',
            animation: 'radar-sweep 6s linear infinite',
            zIndex: 1
          }}
        />

        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
          {commLines.map(line => {
            const from = getPos(line.from);
            const to = getPos(line.to);
            return (
              <line
                key={line.key}
                x1={`${from.x}%`} y1={`${from.y}%`}
                x2={`${to.x}%`} y2={`${to.y}%`}
                stroke="currentColor"
                className="text-foreground/40"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                style={{ animation: 'comm-line 1.2s linear forwards' }}
              />
            );
          })}
        </svg>

        {/* Command HQ */}
        <div className="absolute transition-all duration-1000" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full border border-foreground/10" style={{ animation: 'pulse-ring 3s infinite' }} />
          <div className="relative bg-foreground p-5 rounded-2xl shadow-2xl border-4 border-white flex flex-col items-center group cursor-help">
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🏢</span>
            <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Command</span>
          </div>
        </div>

        {/* Agents Swarm */}
        {agentStates.map((agent, i) => {
          const pos = getPos(agent.id);
          const isFlashing = flashingAgents.has(agent.id);
          const isAtHQ = pos.x === 50 && pos.y === 50;

          return (
            <div
              key={agent.id}
              className="absolute flex flex-col items-center transition-all"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                transitionDuration: `${1.5 + i * 0.2}s`,
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 20,
              }}
            >
              {agent.active && deployed && !isAtHQ && (
                <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-foreground/10 rounded-full" style={{ animation: 'pulse-ring 2s infinite' }} />
              )}
              
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xl ${
                  agent.active ? (isFlashing ? 'bg-critical scale-125 border-white rotate-12' : 'bg-white border-foreground hover:scale-110') : 'bg-muted border-muted-foreground opacity-40'
                }`}
              >
                <span className="text-xl">{agent.active ? '🤖' : '💤'}</span>
              </div>
              
              {isFlashing && (
                <div className="absolute -top-6 bg-critical text-white text-[9px] px-2 py-0.5 rounded-md font-black animate-bounce shadow-lg z-30">
                  NEW DATA
                </div>
              )}
              
              <div className="mt-3 text-center pointer-events-none">
                <div className={`text-[10px] font-black uppercase tracking-tighter leading-none ${!agent.active ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {agent.name}
                </div>
                <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60 italic">{agent.role}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Panel (Bottom Left) */}
      <div className="absolute bottom-8 left-8 w-64 space-y-4 z-50">
        <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-2xl p-5 shadow-2xl animate-[fade-up_0.6s_ease-out]">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-foreground/30">Manual Control</h3>
          <div className="space-y-3">
            {agentStates.map(agent => (
              <div key={agent.id} className="flex items-center justify-between group">
                <span className={`text-[11px] font-bold transition-all ${!agent.active ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                  {agent.name}
                </span>
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className={`w-10 h-5 rounded-full transition-all relative p-1 ${agent.active ? 'bg-safe' : 'bg-muted-foreground/20'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${agent.active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Sidebar (Right) */}
      <div className="w-80 bg-white/90 backdrop-blur-2xl border-l border-black/5 mt-12 z-50 flex flex-col shadow-2xl animate-[fade-up_0.8s_ease-out]">
        <div className="p-5 border-b border-black/5 bg-black/[0.02]">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Intel Stream</h3>
            <div className="text-[10px] font-black px-2 py-1 bg-foreground text-white rounded shadow-sm">{findingCount}</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {findings.map((f) => (
            <div
              key={f.id}
              className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-[fade-up_0.4s_ease-out]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-tighter text-foreground/40">{f.agentName}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${f.severity === 'critical' ? 'bg-critical shadow-[0_0_8px_#ef4444]' : f.severity === 'high' ? 'bg-warning' : 'bg-safe'}`} />
              </div>
              <p className="text-[11px] text-foreground font-semibold leading-relaxed mb-3">
                {f.description}
              </p>
              <div className="flex justify-between items-center opacity-30 text-[8px] font-bold uppercase tracking-widest">
                <span>{f.timestamp}</span>
                <span>ID: {f.id.slice(0, 4)}</span>
              </div>
            </div>
          ))}
        </div>

        {showCompleteBtn && (
          <div className="p-6 border-t border-black/5 bg-foreground/[0.02]">
            <button
              onClick={onComplete}
              className="w-full py-4 bg-foreground text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-foreground/90 transition-all shadow-xl hover:translate-y-[-2px] active:translate-y-[0px]"
            >
              Finalize & Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwarmPage;