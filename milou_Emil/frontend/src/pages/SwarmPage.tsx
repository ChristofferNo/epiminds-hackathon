import { useState, useEffect, useRef, useCallback } from 'react';
import { swarmAgents, type Finding, type Agent } from '@/data/mockData';

const API_BASE = 'http://localhost:8000';

interface SwarmPageProps {
  topic: string;
  onComplete: () => void;
}

interface Trace {
  fromX: number; fromY: number; toX: number; toY: number;
  key: number; age: number;
}

// Map backend context into Finding[] items
function contextToFindings(ctx: Record<string, unknown>): Finding[] {
  const findings: Finding[] = [];
  let idCounter = 0;

  const docs = (ctx.documents as Array<{ url: string; title: string; text: string }>) || [];
  for (const doc of docs) {
    findings.push({
      id: `doc-${idCounter++}`,
      agentId: 'scraper',
      agentName: 'Scraper',
      type: 'SOURCE FOUND',
      description: `${doc.title || 'Untitled'} — ${doc.url}`,
      timestamp: 'just now',
      severity: 'low',
    });
  }

  const claims = (ctx.claims as Array<{ url: string; title: string; claims: string[] }>) || [];
  for (const group of claims) {
    for (const claim of group.claims || []) {
      findings.push({
        id: `claim-${idCounter++}`,
        agentId: 'claims',
        agentName: 'Claims',
        type: 'CLAIM EXTRACTED',
        description: claim,
        timestamp: 'just now',
        severity: 'medium',
      });
    }
  }

  const narratives = (ctx.narratives as Array<{ theme: string; claims: string[] }>) || [];
  for (const n of narratives) {
    findings.push({
      id: `nar-${idCounter++}`,
      agentId: 'narrative',
      agentName: 'Narrative',
      type: 'NARRATIVE CLUSTER',
      description: `${n.theme} (${n.claims?.length || 0} claims)`,
      timestamp: 'just now',
      severity: 'high',
    });
  }

  const graph = ctx.graph as { nodes?: unknown[] } | undefined;
  if (graph && graph.nodes && graph.nodes.length > 0) {
    findings.push({
      id: `graph-${idCounter++}`,
      agentId: 'graph',
      agentName: 'Graph',
      type: 'KNOWLEDGE GRAPH BUILT',
      description: `Graph constructed with ${graph.nodes.length} nodes`,
      timestamp: 'just now',
      severity: 'critical',
    });
  }

  return findings;
}

const SwarmPage = ({ topic, onComplete }: SwarmPageProps) => {
  const [agentStates, setAgentStates] = useState<Agent[]>(swarmAgents.map(a => ({ ...a, active: true })));
  const [agentPositions, setAgentPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [findings, setFindings] = useState<Finding[]>([]);
  const [commLines, setCommLines] = useState<{ from: string; to: string; key: number }[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [flashingAgents, setFlashingAgents] = useState<Set<string>>(new Set());
  const [showCompleteBtn, setShowCompleteBtn] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const commKeyRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevFindingCountRef = useRef(0);

  // Initialize positions at kennel then deploy
  useEffect(() => {
    const kennelPos = { x: 25, y: 50 };
    const initial: Record<string, { x: number; y: number }> = {};
    agentStates.forEach(a => { initial[a.id] = { ...kennelPos }; });
    setAgentPositions(initial);

    const t = setTimeout(() => {
      setDeployed(true);
      const deployedPos: Record<string, { x: number; y: number }> = {};
      agentStates.forEach(a => { deployedPos[a.id] = { x: a.zone.x, y: a.zone.y }; });
      setAgentPositions(deployedPos);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // Trigger backend on deploy
  useEffect(() => {
    if (!deployed) return;
    setBackendStatus('running');

    // Set the topic, then run agents
    fetch(`${API_BASE}/topic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    })
      .then(() => fetch(`${API_BASE}/run-agents`, { method: 'POST' }))
      .then(() => setBackendStatus('done'))
      .catch((err) => {
        console.error('Backend error:', err);
        setBackendStatus('done');
      });
  }, [deployed, topic]);

  // Poll backend context for live findings
  useEffect(() => {
    if (!deployed) return;
    const interval = setInterval(() => {
      fetch(`${API_BASE}/context`)
        .then(res => res.json())
        .then((ctx) => {
          const newFindings = contextToFindings(ctx);
          setFindings(newFindings);

          // Flash agents that have new findings
          if (newFindings.length > prevFindingCountRef.current) {
            const newOnes = newFindings.slice(0, newFindings.length - prevFindingCountRef.current);
            const agentIds = new Set(newOnes.map(f => f.agentId));
            setFlashingAgents(agentIds);
            setTimeout(() => setFlashingAgents(new Set()), 600);
          }
          prevFindingCountRef.current = newFindings.length;

          // Show complete button once we have graph data or agents are done
          if (ctx.graph && (ctx.graph as { nodes?: unknown[] }).nodes?.length) {
            setShowCompleteBtn(true);
          }
        })
        .catch(() => { /* backend not ready yet */ });
    }, 1500);
    return () => clearInterval(interval);
  }, [deployed]);

  // Also show complete btn after 60s as fallback
  useEffect(() => {
    const t = setTimeout(() => setShowCompleteBtn(true), 60000);
    return () => clearTimeout(t);
  }, []);

  // HIGH-FREQUENCY communication lines + traces
  useEffect(() => {
    if (!deployed) return;
    const interval = setInterval(() => {
      const activeAgents = agentStates.filter(a => a.active);
      if (activeAgents.length < 2) return;

      const burstCount = Math.floor(Math.random() * 2) + 2;
      for (let b = 0; b < burstCount; b++) {
        const a1 = activeAgents[Math.floor(Math.random() * activeAgents.length)];
        let a2 = a1;
        while (a2.id === a1.id) a2 = activeAgents[Math.floor(Math.random() * activeAgents.length)];

        const key = commKeyRef.current++;
        const fromPos = agentPositions[a1.id] || { x: 25, y: 50 };
        const toPos = agentPositions[a2.id] || { x: 25, y: 50 };

        setCommLines(prev => [...prev, { from: a1.id, to: a2.id, key }]);
        setTraces(prev => [...prev, {
          fromX: fromPos.x, fromY: fromPos.y,
          toX: toPos.x, toY: toPos.y,
          key, age: 0
        }]);

        setTimeout(() => {
          setCommLines(prev => prev.filter(l => l.key !== key));
        }, 1000);
      }
    }, 350);

    return () => clearInterval(interval);
  }, [deployed, agentStates, agentPositions]);

  // Fade out traces
  useEffect(() => {
    const interval = setInterval(() => {
      setTraces(prev =>
        prev.map(t => ({ ...t, age: t.age + 1 })).filter(t => t.age < 12)
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const toggleAgent = useCallback((id: string) => {
    setAgentStates(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }, []);

  const getPos = (id: string) => agentPositions[id] || { x: 25, y: 50 };

  return (
    <div className="fixed inset-0 bg-parchment-light flex overflow-hidden" style={{ animation: 'fade-up 0.4s ease-out' }}>
      {/* Injected animations */}
      <style>{`
        @keyframes comm-line {
          0% { stroke-dashoffset: 40; opacity: 0; }
          15% { opacity: 0.7; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes flow-field {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(-120px) translateY(-80px); }
        }
      `}</style>

      {/* Subtle flowing background pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <svg
          className="absolute"
          style={{
            width: 'calc(100% + 240px)',
            height: 'calc(100% + 160px)',
            top: '-80px',
            left: '-120px',
            animation: 'flow-field 8s linear infinite',
            opacity: 0.035,
          }}
        >
          <defs>
            <pattern id="flow-arrows" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M20 30 L30 20 L40 30" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 45 L30 35 L40 45" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#flow-arrows)" />
        </svg>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-foreground/5 backdrop-blur-sm flex items-center px-6 z-20 border-b border-foreground/10">
        <div className="flex items-center gap-2">
          <span className="font-body text-xs uppercase tracking-widest text-muted-foreground">Backend:</span>
          <span className={`font-body text-xs font-bold ${backendStatus === 'running' ? 'text-warning' : backendStatus === 'done' ? 'text-safe' : 'text-muted-foreground'}`}>
            {backendStatus === 'running' ? 'PROCESSING...' : backendStatus === 'done' ? 'COMPLETE' : 'IDLE'}
          </span>
          <span className={`w-2 h-2 rounded-full ${backendStatus === 'running' ? 'bg-warning animate-pulse' : 'bg-safe'}`} />
        </div>
        <div className="ml-8 font-body text-xs text-muted-foreground">
          Findings: <span className="font-bold text-foreground">{findings.length}</span>
        </div>
        <div className="ml-auto font-body text-sm text-muted-foreground">
          Investigating: <span className="font-bold text-foreground italic">"{topic}"</span>
        </div>
      </div>

      {/* Main canvas */}
      <div ref={containerRef} className="flex-1 relative mt-12 mb-0">
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {/* Lingering traces */}
          {traces.map(trace => (
            <line
              key={`trace-${trace.key}`}
              x1={`${trace.fromX}%`} y1={`${trace.fromY}%`}
              x2={`${trace.toX}%`} y2={`${trace.toY}%`}
              stroke="hsl(var(--foreground))"
              strokeWidth="0.5"
              opacity={Math.max(0, 0.15 - trace.age * 0.013)}
            />
          ))}

          {/* Active communication lines */}
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
                style={{ animation: 'comm-line 1s ease-in-out forwards' }}
              />
            );
          })}
        </svg>

        {/* Kennel / HQ */}
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
              {agent.active && deployed && pos.x !== 25 && (
                <>
                  <div className="absolute w-6 h-6 rounded-full border border-foreground/20" style={{ animation: 'pulse-ring 3s infinite' }} />
                  <div className="absolute w-6 h-6 rounded-full border border-foreground/10" style={{ animation: 'pulse-ring 3s infinite 1s' }} />
                </>
              )}

              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-colors duration-300 ${agent.active ? (isFlashing ? 'bg-critical' : 'bg-foreground') : 'bg-muted-foreground/40'
                  }`}
              >
                <span className={agent.active ? 'text-primary-foreground' : 'text-muted'}>🐾</span>
              </div>

              {isFlashing && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-critical text-critical-foreground text-[8px] flex items-center justify-center font-bold" style={{ animation: 'fade-up 0.3s ease-out' }}>
                  +1
                </div>
              )}

              <span className={`mt-1 font-body text-[10px] font-bold whitespace-nowrap ${!agent.active ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {agent.name}
              </span>
              <span className="font-body text-[8px] text-muted-foreground whitespace-nowrap">{agent.role}</span>
              {!agent.active && (
                <span className="text-[8px] text-warning font-bold mt-0.5">offline</span>
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
          <span className="w-2 h-2 rounded-full bg-critical animate-pulse" />
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
                <div className={`w-2 h-2 rounded-full ${f.severity === 'critical' ? 'bg-critical' : f.severity === 'high' ? 'bg-warning' : f.severity === 'medium' ? 'bg-warning/60' : 'bg-safe'}`} />
                <span className="font-body text-[10px] font-bold text-foreground">{f.agentName}</span>
              </div>
              <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-body uppercase tracking-wider mb-1 ${f.severity === 'critical' ? 'bg-critical/10 text-critical' : f.severity === 'high' ? 'bg-warning/10 text-warning' : 'bg-safe/10 text-safe'
                }`}>
                {f.type}
              </div>
              <p className="font-body text-[10px] text-muted-foreground leading-tight">{f.description}</p>
              <span className="font-body text-[8px] text-muted-foreground/60 mt-1 block">{f.timestamp}</span>
            </div>
          ))}
          {findings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-body text-xs">
              {backendStatus === 'running' ? 'Agents working... findings will appear here' : 'Deploying agents...'}
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
