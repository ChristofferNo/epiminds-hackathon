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

  // Initialize positions at kennel
  useEffect(() => {
    const kennelPos = { x: 25, y: 50 };
    const initial: Record<string, { x: number; y: number }> = {};
    agentStates.forEach(a => { initial[a.id] = { ...kennelPos }; });
    setAgentPositions(initial);
    
    // Deploy after a brief moment
    const t = setTimeout(() => {
      setDeployed(true);
      const deployed: Record<string, { x: number; y: number }> = {};
      agentStates.forEach(a => { deployed[a.id] = { x: a.zone.x, y: a.zone.y }; });
      setAgentPositions(deployed);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // Findings feed
  useEffect(() => {
    if (!deployed) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i >= mockFindings.length) { clearInterval(interval); return; }
      const finding = mockFindings[i];
      setFindings(prev => [finding, ...prev]);
      setFindingCount(prev => prev + 1);
      
      // Flash the agent
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

  // Communication lines
  useEffect(() => {
    if (!deployed) return;
    const interval = setInterval(() => {
      const activeAgents = agentStates.filter(a => a.active);
      if (activeAgents.length < 2) return;
      const a1 = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      let a2 = a1;
      while (a2.id === a1.id) a2 = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      const key = commKeyRef.current++;
      setCommLines(prev => [...prev, { from: a1.id, to: a2.id, key }]);
      setTimeout(() => {
        setCommLines(prev => prev.filter(l => l.key !== key));
      }, 2000);
    }, 2500);
    return () => clearInterval(interval);
  }, [deployed, agentStates]);

  // Show complete button after 15s
  useEffect(() => {
    const t = setTimeout(() => setShowCompleteBtn(true), 15000);
    return () => clearTimeout(t);
  }, []);

  const toggleAgent = useCallback((id: string) => {
    setAgentStates(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }, []);

  const getPos = (id: string) => agentPositions[id] || { x: 25, y: 50 };

  return (
    <div className="fixed inset-0 bg-parchment-light flex" style={{ animation: 'fade-up 0.4s ease-out' }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-foreground/5 backdrop-blur-sm flex items-center px-6 z-20 border-b border-foreground/10">
        <div className="flex items-center gap-2">
          <span className="font-body text-xs uppercase tracking-widest text-muted-foreground">Shared State:</span>
          <span className="font-body text-xs font-bold text-foreground">LIVE</span>
          <span className="w-2 h-2 rounded-full bg-safe" style={{ animation: 'pulse-ring 2s infinite' }} />
        </div>
        <div className="ml-8 font-body text-xs text-muted-foreground">
          Findings: <span className="font-bold text-foreground">{findingCount}</span>
        </div>
        <div className="ml-auto font-body text-sm text-muted-foreground">
          Investigating: <span className="font-bold text-foreground italic">"{topic}"</span>
        </div>
      </div>

      {/* Main canvas */}
      <div ref={containerRef} className="flex-1 relative mt-12 mb-0">
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {/* Communication lines */}
          {commLines.map(line => {
            const from = getPos(line.from);
            const to = getPos(line.to);
            return (
              <line
                key={line.key}
                x1={`${from.x}%`} y1={`${from.y}%`}
                x2={`${to.x}%`} y2={`${to.y}%`}
                stroke="hsl(var(--foreground))"
                strokeWidth="1"
                strokeDasharray="4 4"
                style={{ animation: 'comm-line 2s ease-in-out forwards' }}
              />
            );
          })}
        </svg>

        {/* Kennel */}
        <div className="absolute" style={{ left: '25%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
          <svg width="60" height="50" viewBox="0 0 60 50">
            <polygon points="30,2 58,22 2,22" fill="hsl(var(--foreground))" />
            <rect x="8" y="22" width="44" height="26" fill="hsl(var(--foreground))" />
            <rect x="20" y="30" width="20" height="18" rx="10" fill="hsl(var(--parchment-light))" />
          </svg>
          <div className="text-center mt-1 font-body text-xs font-bold text-foreground uppercase tracking-widest">HQ</div>
        </div>

        {/* Agents */}
        {agentStates.map((agent, i) => {
          const pos = getPos(agent.id);
          const isFlashing = flashingAgents.has(agent.id);
          return (
            <div
              key={agent.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                transition: `all ${1.5 + i * 0.15}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                zIndex: 5,
              }}
            >
              {/* Pulse rings */}
              {agent.active && deployed && pos.x !== 25 && (
                <>
                  <div className="absolute w-6 h-6 rounded-full border border-foreground/20" style={{ animation: 'pulse-ring 3s infinite' }} />
                  <div className="absolute w-6 h-6 rounded-full border border-foreground/10" style={{ animation: 'pulse-ring 3s infinite 1s' }} />
                </>
              )}
              
              {/* Agent circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-colors duration-300 ${
                  agent.active ? (isFlashing ? 'bg-critical' : 'bg-foreground') : 'bg-muted-foreground/40'
                }`}
              >
                <span className={agent.active ? 'text-primary-foreground' : 'text-muted'}>🐾</span>
              </div>
              
              {/* Finding badge */}
              {isFlashing && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-critical text-critical-foreground text-[8px] flex items-center justify-center font-bold" style={{ animation: 'fade-up 0.3s ease-out' }}>
                  +1
                </div>
              )}
              
              {/* Label */}
              <span className={`mt-1 font-body text-[10px] font-bold whitespace-nowrap ${!agent.active ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {agent.name}
              </span>
              <span className="font-body text-[8px] text-muted-foreground whitespace-nowrap">{agent.role}</span>
              {!agent.active && (
                <span className="text-[8px] text-warning font-bold mt-0.5">⚠ offline</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Kill Switch Panel */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-foreground/10 rounded-lg p-3 z-20 w-52">
        <h3 className="font-body text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-bold">Agent Control</h3>
        <div className="space-y-1">
          {agentStates.map(agent => (
            <div key={agent.id} className="flex items-center justify-between">
              <span className={`font-body text-[11px] ${!agent.active ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {agent.name}
              </span>
              <button
                onClick={() => toggleAgent(agent.id)}
                className={`w-8 h-4 rounded-full transition-colors duration-200 relative ${agent.active ? 'bg-safe' : 'bg-muted-foreground/30'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-background absolute top-0.5 transition-transform duration-200 ${agent.active ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Feed */}
      <div className="w-72 bg-background/90 backdrop-blur-sm border-l border-foreground/10 mt-12 z-20 flex flex-col">
        <div className="p-3 border-b border-foreground/10 flex items-center gap-2">
          <h3 className="font-body text-xs font-bold uppercase tracking-widest text-foreground">Evidence Board</h3>
          <span className="w-2 h-2 rounded-full bg-critical" style={{ animation: 'pulse-ring 1.5s infinite' }} />
          <span className="font-body text-[10px] text-muted-foreground">LIVE</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {findings.map((f) => (
            <div
              key={f.id}
              className="bg-parchment-light/50 border border-foreground/5 rounded p-2"
              style={{ animation: 'slide-in-right 0.4s ease-out' }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2 h-2 rounded-full ${f.severity === 'critical' ? 'bg-critical' : f.severity === 'high' ? 'bg-warning' : 'bg-safe'}`} />
                <span className="font-body text-[10px] font-bold text-foreground">{f.agentName}</span>
              </div>
              <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-body uppercase tracking-wider mb-1 ${
                f.severity === 'critical' ? 'bg-critical/10 text-critical' : f.severity === 'high' ? 'bg-warning/10 text-warning' : 'bg-safe/10 text-safe'
              }`}>
                {f.type}
              </div>
              <p className="font-body text-[10px] text-muted-foreground leading-tight">{f.description}</p>
              <span className="font-body text-[8px] text-muted-foreground/60 mt-1 block">{f.timestamp}</span>
            </div>
          ))}
          {findings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-body text-xs">
              Deploying agents...
            </div>
          )}
        </div>

        {showCompleteBtn && (
          <div className="p-3 border-t border-foreground/10">
            <button
              onClick={onComplete}
              className="w-full py-2 bg-foreground text-primary-foreground font-body text-xs font-bold rounded hover:bg-foreground/90 transition-colors"
            >
              View Evidence Board →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwarmPage;
