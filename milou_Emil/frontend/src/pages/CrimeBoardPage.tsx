import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = 'http://localhost:8000';

interface CrimeBoardPageProps {
  topic: string;
  onNext: () => void;
}

interface NarrativeNode {
  id: string;
  theme: string;
}

interface ClaimNode {
  id: string;
  text: string;
  parentNarrativeId: string;
  severity: 'critical' | 'high' | 'safe';
}

interface GraphEdge {
  source: string;
  target: string;
}

interface Pos { x: number; y: number }

// Radial layout: topic at center, narratives in a ring, claims in outer ring clustered by narrative
function computePositions(
  narratives: NarrativeNode[],
  claims: ClaimNode[]
): { topicPos: Pos; sourcePositions: Record<string, Pos>; claimPositions: Record<string, Pos> } {
  const topicPos: Pos = { x: 50, y: 46 };
  const sourcePositions: Record<string, Pos> = {};
  const claimPositions: Record<string, Pos> = {};

  const narrativeRadius = 22; // % from center
  const claimRadius = 40;

  // Distribute narratives radially around center
  narratives.forEach((nar, i) => {
    const angle = (i / Math.max(narratives.length, 1)) * Math.PI * 2 - Math.PI / 2;
    sourcePositions[nar.id] = {
      x: topicPos.x + Math.cos(angle) * narrativeRadius,
      y: topicPos.y + Math.sin(angle) * (narrativeRadius * 0.7),
    };
  });

  // Group claims by narrative, place them in a fan around their parent
  const claimsByNarrative: Record<string, ClaimNode[]> = {};
  for (const c of claims) {
    if (!claimsByNarrative[c.parentNarrativeId]) claimsByNarrative[c.parentNarrativeId] = [];
    claimsByNarrative[c.parentNarrativeId].push(c);
  }

  narratives.forEach((nar) => {
    const narPos = sourcePositions[nar.id];
    if (!narPos) return;
    const narClaims = claimsByNarrative[nar.id] || [];
    const dx = narPos.x - topicPos.x;
    const dy = narPos.y - topicPos.y;
    const baseAngle = Math.atan2(dy, dx);

    narClaims.forEach((claim, ci) => {
      const fanSpread = narClaims.length <= 1 ? 0 : Math.min(Math.PI * 1.2, narClaims.length * 0.22);
      const offsetAngle = narClaims.length > 1
        ? baseAngle + (ci / (narClaims.length - 1) - 0.5) * fanSpread
        : baseAngle;
      const r = claimRadius + Math.floor(ci / 2) * 6;
      claimPositions[claim.id] = {
        x: Math.max(3, Math.min(97, topicPos.x + Math.cos(offsetAngle) * r)),
        y: Math.max(6, Math.min(94, topicPos.y + Math.sin(offsetAngle) * (r * 0.65))),
      };
    });
  });

  return { topicPos, sourcePositions, claimPositions };
}

// Find cross-source correlations: same claim text from different sources, or graph edges between claims of different sources
function findCorrelations(
  claims: ClaimNode[],
  graphEdges: GraphEdge[]
): { claimA: string; claimB: string; sourceA: string; sourceB: string }[] {
  const correlations: { claimA: string; claimB: string; sourceA: string; sourceB: string }[] = [];
  const seen = new Set<string>();

  // Text-based duplicates
  const textMap: Record<string, ClaimNode[]> = {};
  for (const c of claims) {
    const key = c.text.toLowerCase().trim();
    if (!textMap[key]) textMap[key] = [];
    textMap[key].push(c);
  }
  for (const group of Object.values(textMap)) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (group[i].parentNarrativeId !== group[j].parentNarrativeId) {
          const k = [group[i].id, group[j].id].sort().join('-');
          if (!seen.has(k)) {
            seen.add(k);
            correlations.push({
              claimA: group[i].id, claimB: group[j].id,
              sourceA: group[i].parentNarrativeId, sourceB: group[j].parentNarrativeId,
            });
          }
        }
      }
    }
  }

  // Graph-edge based
  for (const edge of graphEdges) {
    const a = claims.find(c => c.id === edge.source);
    const b = claims.find(c => c.id === edge.target);
    if (a && b && a.parentNarrativeId !== b.parentNarrativeId) {
      const k = [a.id, b.id].sort().join('-');
      if (!seen.has(k)) {
        seen.add(k);
        correlations.push({
          claimA: a.id, claimB: b.id,
          sourceA: a.parentNarrativeId, sourceB: b.parentNarrativeId,
        });
      }
    }
  }

  return correlations;
}

function severityColor(s: string): string {
  if (s === 'critical') return 'hsl(var(--critical))';
  if (s === 'high') return 'hsl(var(--warning))';
  return 'hsl(var(--safe))';
}

function severityBorderClass(s: string): string {
  if (s === 'critical') return 'border-critical/60';
  if (s === 'high') return 'border-warning/60';
  return 'border-safe/60';
}

function severityBgClass(s: string): string {
  if (s === 'critical') return 'bg-critical/5';
  if (s === 'high') return 'bg-warning/5';
  return 'bg-safe/5';
}

const CrimeBoardPage = ({ topic, onNext }: CrimeBoardPageProps) => {
  const [docs, setDocs] = useState<NarrativeNode[]>([]);
  const [claims, setClaims] = useState<ClaimNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCorrelation, setHoveredCorrelation] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Assign severity to a claim by simple heuristic on text keywords
  const assignSeverity = (text: string): 'critical' | 'high' | 'safe' => {
    const lower = text.toLowerCase();
    if (lower.includes('fake') || lower.includes('fabricat') || lower.includes('false') || lower.includes('unverif') || lower.includes('deepfake') || lower.includes('manipulat'))
      return 'critical';
    if (lower.includes('mislead') || lower.includes('disputed') || lower.includes('exaggerat') || lower.includes('unconfirm') || lower.includes('contradic'))
      return 'high';
    return 'safe';
  };

  const fetchContext = useCallback(() => {
    fetch(`${API_BASE}/context`)
      .then(res => res.json())
      .then((ctx) => {
        const narrativeGroups = (ctx.narratives || []) as Array<{ theme: string; claims: string[] }>;
        const narrativeNodes: NarrativeNode[] = narrativeGroups.map((n, i) => ({
          id: `narrative_${i}`,
          theme: n.theme,
        }));
        setDocs(narrativeNodes);

        const claimNodes: ClaimNode[] = [];
        let claimIdx = 0;
        for (let ni = 0; ni < narrativeGroups.length; ni++) {
          const parentId = `narrative_${ni}`;
          for (const text of (narrativeGroups[ni].claims || [])) {
            claimNodes.push({
              id: `claim_${claimIdx}`,
              text,
              parentNarrativeId: parentId,
              severity: assignSeverity(text),
            });
            claimIdx++;
          }
        }
        setClaims(claimNodes);

        const graph = ctx.graph as { edges?: GraphEdge[] } | undefined;
        setGraphEdges(graph?.edges || []);

        if (narrativeNodes.length > 0) setLoading(false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchContext();
    pollRef.current = setInterval(fetchContext, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchContext]);

  useEffect(() => {
    if (!loading && claims.length > 0 && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [loading, claims.length]);

  const { topicPos, sourcePositions, claimPositions } = computePositions(docs, claims);
  const correlations = findCorrelations(claims, graphEdges);

  // Determine which nodes are highlighted from a hovered correlation
  const highlightedNodes = new Set<string>();
  const highlightedSources = new Set<string>();
  if (hoveredCorrelation !== null && correlations[hoveredCorrelation]) {
    const c = correlations[hoveredCorrelation];
    highlightedNodes.add(c.claimA);
    highlightedNodes.add(c.claimB);
    highlightedSources.add(c.sourceA);
    highlightedSources.add(c.sourceB);
  }
  const hasHighlight = highlightedNodes.size > 0;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'hsl(39, 30%, 89%)' }}>
        <div className="grain-overlay" />
        <div className="text-center z-10">
          <div className="w-10 h-10 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Building Evidence...</h2>
          <p className="font-body text-sm text-muted-foreground">Waiting for agents to finish analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: 'hsl(39, 30%, 89%)' }}>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes draw-line {
          from { stroke-dashoffset: 300; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 2px hsl(var(--critical))); }
          50% { filter: drop-shadow(0 0 8px hsl(var(--critical))); }
        }
      `}</style>

      <div className="grain-overlay" />

      {/* Header */}
      <div className="absolute top-4 left-6 z-30">
        <h2 className="font-display text-2xl font-bold text-foreground">Evidence Board</h2>
        <p className="font-body text-xs text-muted-foreground">
          Case: "{topic}" — {docs.length} narratives, {claims.length} claims
          {correlations.length > 0 && <span className="text-critical font-bold"> — {correlations.length} cross-source correlation{correlations.length > 1 ? 's' : ''}</span>}
        </p>
      </div>
      <button
        onClick={onNext}
        className="absolute top-4 right-6 z-30 px-6 py-2 bg-foreground text-primary-foreground font-body text-xs font-bold rounded hover:bg-foreground/90 transition-colors shadow-lg"
      >
        View Results →
      </button>

      {/* SVG edge layer */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }}>
        {/* Topic → Source edges */}
        {docs.map((doc, i) => {
          const from = topicPos;
          const to = sourcePositions[doc.id];
          if (!to) return null;
          const dimmed = hasHighlight && !highlightedSources.has(doc.id);
          return (
            <line
              key={`ts-${i}`}
              x1={`${from.x}%`} y1={`${from.y}%`}
              x2={`${to.x}%`} y2={`${to.y}%`}
              stroke="hsl(var(--foreground))"
              strokeWidth={highlightedSources.has(doc.id) ? 2.5 : 1.5}
              strokeDasharray="8 4"
              opacity={dimmed ? 0.08 : highlightedSources.has(doc.id) ? 0.6 : 0.25}
              style={{ animation: `draw-line 1s ease-out ${i * 0.1}s both`, transition: 'opacity 0.3s' }}
            />
          );
        })}

        {/* Source → Claim edges */}
        {claims.map((claim, i) => {
          const from = sourcePositions[claim.parentNarrativeId];
          const to = claimPositions[claim.id];
          if (!from || !to) return null;
          const dimmed = hasHighlight && !highlightedNodes.has(claim.id);
          return (
            <line
              key={`sc-${i}`}
              x1={`${from.x}%`} y1={`${from.y}%`}
              x2={`${to.x}%`} y2={`${to.y}%`}
              stroke={severityColor(claim.severity)}
              strokeWidth={highlightedNodes.has(claim.id) ? 2 : 0.8}
              strokeDasharray="3 3"
              opacity={dimmed ? 0.05 : highlightedNodes.has(claim.id) ? 0.7 : 0.2}
              style={{ animation: `draw-line 0.8s ease-out ${0.3 + i * 0.03}s both`, transition: 'opacity 0.3s' }}
            />
          );
        })}

        {/* Cross-source correlation edges (Source A → Claim A ↔ Claim B → Source B) */}
        {correlations.map((cor, i) => {
          const posA = claimPositions[cor.claimA];
          const posB = claimPositions[cor.claimB];
          if (!posA || !posB) return null;
          const isHovered = hoveredCorrelation === i;
          return (
            <g key={`cor-${i}`} style={isHovered ? { animation: 'pulse-glow 1.5s ease-in-out infinite' } : {}}>
              <line
                x1={`${posA.x}%`} y1={`${posA.y}%`}
                x2={`${posB.x}%`} y2={`${posB.y}%`}
                stroke="hsl(var(--critical))"
                strokeWidth={isHovered ? 3 : 2}
                strokeDasharray="6 3"
                opacity={hasHighlight && !isHovered ? 0.15 : 0.7}
                style={{ transition: 'opacity 0.3s, stroke-width 0.3s' }}
              />
              {/* Midpoint indicator */}
              <circle
                cx={`${(posA.x + posB.x) / 2}%`}
                cy={`${(posA.y + posB.y) / 2}%`}
                r={isHovered ? 5 : 3}
                fill="hsl(var(--critical))"
                opacity={isHovered ? 0.9 : 0.5}
                style={{ transition: 'all 0.3s' }}
              />
            </g>
          );
        })}

        {/* Highlighted full path: Source A → Claim A and Source B → Claim B */}
        {hoveredCorrelation !== null && correlations[hoveredCorrelation] && (() => {
          const cor = correlations[hoveredCorrelation];
          const srcA = sourcePositions[cor.sourceA];
          const srcB = sourcePositions[cor.sourceB];
          const clmA = claimPositions[cor.claimA];
          const clmB = claimPositions[cor.claimB];
          if (!srcA || !srcB || !clmA || !clmB) return null;
          return (
            <>
              <line x1={`${srcA.x}%`} y1={`${srcA.y}%`} x2={`${clmA.x}%`} y2={`${clmA.y}%`}
                stroke="hsl(var(--critical))" strokeWidth="2.5" strokeDasharray="6 3" opacity="0.8" />
              <line x1={`${srcB.x}%`} y1={`${srcB.y}%`} x2={`${clmB.x}%`} y2={`${clmB.y}%`}
                stroke="hsl(var(--critical))" strokeWidth="2.5" strokeDasharray="6 3" opacity="0.8" />
            </>
          );
        })()}
      </svg>

      {/* TOPIC node — center */}
      <div
        className="absolute z-20 bg-foreground text-primary-foreground rounded-xl p-5 shadow-2xl border-2 border-white/10"
        style={{
          left: `${topicPos.x}%`, top: `${topicPos.y}%`,
          transform: 'translate(-50%, -50%)',
          maxWidth: '260px',
          animation: 'fade-up 0.5s ease-out both',
        }}
      >
        <div className="font-body text-[9px] uppercase tracking-[0.25em] opacity-50 mb-1">Subject Under Investigation</div>
        <div className="font-display text-lg font-bold leading-tight">{topic}</div>
        <div className="font-body text-[9px] opacity-40 mt-2">{docs.length} narratives • {claims.length} claims</div>
      </div>

      {/* SOURCE nodes — ring around center */}
      {docs.map((doc, i) => {
        const pos = sourcePositions[doc.id];
        if (!pos) return null;
        const dimmed = hasHighlight && !highlightedSources.has(doc.id);
        return (
          <div
            key={doc.id}
            className={`absolute z-20 bg-background border-2 rounded-lg p-3 shadow-lg transition-all duration-300 ${
              highlightedSources.has(doc.id) ? 'border-critical/50 shadow-critical/20 shadow-xl scale-105' : 'border-foreground/15'
            }`}
            style={{
              left: `${pos.x}%`, top: `${pos.y}%`,
              transform: `translate(-50%, -50%) rotate(${(i % 2 === 0 ? -1 : 1) * (0.5 + i * 0.4)}deg)`,
              maxWidth: '180px',
              opacity: dimmed ? 0.25 : 1,
              animation: `fade-up 0.5s ease-out ${0.15 + i * 0.08}s both`,
            }}
          >
            <div className="font-body text-[8px] uppercase tracking-[0.15em] text-muted-foreground font-bold mb-1">Narrative</div>
            <div className="font-body text-[11px] font-bold text-foreground leading-tight line-clamp-2">{doc.theme}</div>
          </div>
        );
      })}

      {/* CLAIM nodes — outer ring, severity color-coded */}
      {claims.map((claim, i) => {
        const pos = claimPositions[claim.id];
        if (!pos) return null;
        const dimmed = hasHighlight && !highlightedNodes.has(claim.id);
        const isCorrelated = correlations.some(c => c.claimA === claim.id || c.claimB === claim.id);
        const corIdx = correlations.findIndex(c => c.claimA === claim.id || c.claimB === claim.id);
        return (
          <div
            key={claim.id}
            className={`absolute z-20 rounded p-2 shadow-md border transition-all duration-300 cursor-default ${severityBorderClass(claim.severity)} ${severityBgClass(claim.severity)} ${
              highlightedNodes.has(claim.id) ? 'scale-110 shadow-xl ring-2 ring-critical/30' : ''
            }`}
            style={{
              left: `${pos.x}%`, top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              maxWidth: '160px',
              opacity: dimmed ? 0.15 : 1,
              animation: `fade-up 0.4s ease-out ${0.3 + i * 0.04}s both`,
            }}
            onMouseEnter={() => isCorrelated && setHoveredCorrelation(corIdx)}
            onMouseLeave={() => setHoveredCorrelation(null)}
          >
            {/* Severity dot */}
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: severityColor(claim.severity) }} />
              <span className="font-body text-[8px] uppercase tracking-widest font-bold" style={{ color: severityColor(claim.severity) }}>
                {claim.severity}
              </span>
              {isCorrelated && (
                <span className="font-body text-[7px] uppercase tracking-wider font-bold text-critical ml-auto">correlated</span>
              )}
            </div>
            <p className="font-body text-[10px] text-foreground/80 leading-tight line-clamp-3">{claim.text}</p>
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-4 left-6 z-30 bg-background/80 backdrop-blur-sm border border-foreground/10 rounded-lg p-3 shadow-lg">
        <div className="font-body text-[8px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Severity Legend</div>
        <div className="flex items-center gap-4">
          {(['critical', 'high', 'safe'] as const).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: severityColor(s) }} />
              <span className="font-body text-[9px] capitalize text-foreground/70">{s}</span>
            </div>
          ))}
          {correlations.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-foreground/10">
              <div className="w-4 h-0.5 bg-critical rounded" />
              <span className="font-body text-[9px] text-foreground/70">Cross-source link</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrimeBoardPage;
