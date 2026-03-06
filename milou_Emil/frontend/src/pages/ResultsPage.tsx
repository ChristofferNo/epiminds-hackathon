import { useState } from 'react';
import { agents, mockFindings, regionData, type Finding } from '@/data/mockData';

interface ResultsPageProps {
  topic: string;
}

const WorldMap = () => {
  const [tooltip, setTooltip] = useState<{ name: string; narratives: string[]; x: number; y: number } | null>(null);

  return (
    <div className="relative">
      <svg viewBox="0 0 100 60" className="w-full" style={{ maxHeight: '400px' }}>
        {/* Simplified world map shapes */}
        <rect width="100" height="60" fill="hsl(var(--parchment))" rx="2" />
        {/* Continents - simplified */}
        {/* North America */}
        <path d="M8,10 L22,8 L25,14 L28,18 L22,22 L18,26 L10,22 L6,16 Z" fill="hsl(var(--parchment-light))" stroke="hsl(var(--parchment-dark))" strokeWidth="0.3" />
        {/* South America */}
        <path d="M18,30 L24,28 L28,34 L26,42 L22,48 L18,44 L16,36 Z" fill="hsl(var(--parchment-light))" stroke="hsl(var(--parchment-dark))" strokeWidth="0.3" />
        {/* Europe */}
        <path d="M42,8 L52,6 L54,12 L50,16 L44,14 L42,10 Z" fill="hsl(var(--parchment-light))" stroke="hsl(var(--parchment-dark))" strokeWidth="0.3" />
        {/* Africa */}
        <path d="M42,18 L54,16 L58,24 L56,36 L50,42 L44,38 L40,28 Z" fill="hsl(var(--parchment-light))" stroke="hsl(var(--parchment-dark))" strokeWidth="0.3" />
        {/* Asia */}
        <path d="M54,6 L80,4 L85,14 L82,24 L74,28 L64,22 L58,14 Z" fill="hsl(var(--parchment-light))" stroke="hsl(var(--parchment-dark))" strokeWidth="0.3" />
        {/* SE Asia / Oceania */}
        <path d="M74,28 L84,26 L88,34 L84,40 L78,38 L74,32 Z" fill="hsl(var(--parchment-light))" stroke="hsl(var(--parchment-dark))" strokeWidth="0.3" />
        {/* Australia */}
        <path d="M78,42 L90,40 L92,46 L88,50 L80,48 Z" fill="hsl(var(--parchment-light))" stroke="hsl(var(--parchment-dark))" strokeWidth="0.3" />

        {/* Region bubbles */}
        {regionData.map((region) => (
          <g key={region.name} className="cursor-pointer" onClick={() => setTooltip(tooltip?.name === region.name ? null : { name: region.name, narratives: region.narratives, x: region.cx, y: region.cy })}>
            <circle cx={region.cx} cy={region.cy} r={region.r} fill={`hsl(var(--${region.color}))`} opacity="0.25" />
            <circle cx={region.cx} cy={region.cy} r={region.r * 0.6} fill={`hsl(var(--${region.color}))`} opacity="0.5" />
            <circle cx={region.cx} cy={region.cy} r={region.r * 0.25} fill={`hsl(var(--${region.color}))`} opacity="0.9" />
          </g>
        ))}
      </svg>

      {/* Bubble labels */}
      {regionData.map(region => (
        <div
          key={region.name}
          className="absolute font-body text-[9px] font-bold pointer-events-none"
          style={{ left: `${region.cx}%`, top: `${(region.cy / 60) * 100 + 3}%`, transform: 'translateX(-50%)' }}
        >
          <span className={`text-${region.color}`}>{region.level}: {region.sources} sources</span>
        </div>
      ))}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-background border border-foreground/10 rounded-lg p-3 shadow-lg z-30"
          style={{ left: `${tooltip.x}%`, top: `${(tooltip.y / 60) * 100 - 5}%`, transform: 'translate(-50%, -100%)', width: '200px', animation: 'fade-up 0.2s ease-out' }}
        >
          <h4 className="font-body text-xs font-bold text-foreground mb-1">{tooltip.name}</h4>
          <ul className="space-y-0.5">
            {tooltip.narratives.map((n, i) => (
              <li key={i} className="font-body text-[10px] text-muted-foreground">• {n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ThreatScore = ({ score }: { score: number }) => {
  const color = score > 70 ? 'critical' : score > 30 ? 'warning' : 'safe';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={`hsl(var(--${color}))`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display text-4xl font-bold text-${color}`}>{score}</span>
          <span className="font-body text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <h3 className="font-body text-sm font-bold text-foreground mt-3">Misinformation Risk Score</h3>
      <p className="font-body text-xs text-muted-foreground">Based on 47 findings across 10 agents</p>
    </div>
  );
};

const ResultsPage = ({ topic }: ResultsPageProps) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Images', 'Language', 'Sources', 'Network', 'Social'];

  const filteredFindings = mockFindings.filter(f => {
    if (filter === 'All') return true;
    if (filter === 'Images') return ['pixel', 'reel'].includes(f.agentId);
    if (filter === 'Language') return f.agentId === 'lingua';
    if (filter === 'Sources') return ['scout', 'veritas'].includes(f.agentId);
    if (filter === 'Network') return ['trace', 'ghost', 'spider'].includes(f.agentId);
    if (filter === 'Social') return f.agentId === 'echo';
    return true;
  });

  return (
    <div className="min-h-screen bg-background" style={{ animation: 'fade-up 0.5s ease-out' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Investigation Results</h1>
          <p className="font-body text-muted-foreground">Subject: "{topic}"</p>
        </div>

        {/* Section 1: Threat Score */}
        <section className="mb-16">
          <ThreatScore score={73} />

          {/* Agent cards grid */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
            {agents.map(agent => {
              const color = agent.score > 70 ? 'critical' : agent.score > 30 ? 'warning' : 'safe';
              const isExpanded = expandedAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${isExpanded ? `border-${color} bg-${color}/5` : 'border-foreground/5 bg-background hover:border-foreground/20'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">🐾</span>
                    <span className="font-body text-[11px] font-bold text-foreground">{agent.name}</span>
                  </div>
                  <div className={`font-display text-xl font-bold text-${color}`}>{agent.score}</div>
                  <div className="font-body text-[9px] text-muted-foreground">{agent.role}</div>
                  {isExpanded && (
                    <ul className="mt-2 space-y-1" style={{ animation: 'fade-up 0.3s ease-out' }}>
                      {agent.findings.map((f, i) => (
                        <li key={i} className="font-body text-[10px] text-muted-foreground">• {f}</li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: World Map */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Global Spread</h2>
          <div className="border border-foreground/10 rounded-xl overflow-hidden">
            <WorldMap />
          </div>
        </section>

        {/* Section 3: Findings Explorer */}
        <section>
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">Findings Explorer</h2>
          <div className="flex gap-2 mb-6 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full font-body text-xs font-medium transition-colors ${
                  filter === f ? 'bg-foreground text-primary-foreground' : 'bg-foreground/5 text-foreground hover:bg-foreground/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {filteredFindings.map(f => {
              const severityColor = f.severity === 'critical' ? 'critical' : f.severity === 'high' ? 'warning' : f.severity === 'medium' ? 'warning' : 'safe';
              return (
                <div key={f.id} className="border border-foreground/5 rounded-lg p-4 hover:border-foreground/15 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full bg-${severityColor}`} />
                    <span className="font-body text-[11px] font-bold text-foreground">{f.agentName}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-body uppercase bg-${severityColor}/10 text-${severityColor}`}>
                      {f.type}
                    </span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground mb-2">{f.description}</p>
                  <button className="font-body text-[11px] font-bold text-foreground hover:text-accent transition-colors">
                    View Source →
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="font-body text-xs text-muted-foreground tracking-widest uppercase">
            Milou Intelligence Report • Generated by AI Agent Swarm
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
