import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:8000';

interface ResultsPageProps {
  topic: string;
}

interface BackendDoc {
  url: string;
  title: string;
  text: string;
}

interface BackendClaimGroup {
  url: string;
  title: string;
  claims: string[];
}

interface BackendNarrative {
  theme: string;
  claims: string[];
}

interface NarrativeDisplay {
  theme: string;
  claims: string[];
  sources: { title: string; url: string }[];
  credibilityScore: number;
  label: 'Highly Credible' | 'Contested' | 'Unverified';
}

function computeNarratives(
  narratives: BackendNarrative[],
  claimGroups: BackendClaimGroup[],
  documents: BackendDoc[]
): NarrativeDisplay[] {
  // Build a map: claim text → which source URLs contain it
  const claimToSources: Record<string, Set<string>> = {};
  for (const group of claimGroups) {
    for (const claim of group.claims) {
      const key = claim.toLowerCase().trim();
      if (!claimToSources[key]) claimToSources[key] = new Set();
      claimToSources[key].add(group.url);
    }
  }

  // Build url → doc map
  const urlToDoc: Record<string, BackendDoc> = {};
  for (const doc of documents) {
    urlToDoc[doc.url] = doc;
  }

  return narratives.map(nar => {
    // Find which sources contribute claims to this narrative
    const sourceUrls = new Set<string>();
    for (const claim of nar.claims) {
      const key = claim.toLowerCase().trim();
      const srcs = claimToSources[key];
      if (srcs) srcs.forEach(u => sourceUrls.add(u));
    }

    const sources = Array.from(sourceUrls).map(url => ({
      title: urlToDoc[url]?.title || url,
      url,
    }));

    // Credibility score heuristic:
    // - More claims = higher density = more credible
    // - More independent sources backing it = higher credibility
    // - Single source = less credible
    const claimDensity = Math.min(nar.claims.length / 3, 1); // normalized 0-1
    const sourceMultiplier = Math.min(sources.length / 2, 1); // 2+ sources = full credit
    const rawScore = Math.round((claimDensity * 60 + sourceMultiplier * 40));
    const credibilityScore = Math.max(10, Math.min(95, rawScore));

    let label: 'Highly Credible' | 'Contested' | 'Unverified';
    if (credibilityScore >= 65) label = 'Highly Credible';
    else if (credibilityScore >= 35) label = 'Contested';
    else label = 'Unverified';

    return { theme: nar.theme, claims: nar.claims, sources, credibilityScore, label };
  });
}

function computeAlignmentScore(narrativeDisplays: NarrativeDisplay[]): number {
  if (narrativeDisplays.length === 0) return 0;
  // How much do sources overlap across narratives?
  // High alignment = same sources appearing in multiple narratives
  const allSourceUrls = new Set<string>();
  let overlapCount = 0;
  const seenInNarratives: Record<string, number> = {};

  for (const nar of narrativeDisplays) {
    for (const src of nar.sources) {
      allSourceUrls.add(src.url);
      seenInNarratives[src.url] = (seenInNarratives[src.url] || 0) + 1;
    }
  }

  for (const count of Object.values(seenInNarratives)) {
    if (count > 1) overlapCount++;
  }

  if (allSourceUrls.size === 0) return 0;
  const ratio = overlapCount / allSourceUrls.size;
  return Math.round(ratio * 100);
}

function computeOverallScore(narrativeDisplays: NarrativeDisplay[]): number {
  if (narrativeDisplays.length === 0) return 0;
  const avg = narrativeDisplays.reduce((sum, n) => sum + n.credibilityScore, 0) / narrativeDisplays.length;
  return Math.round(avg);
}

const ScoreRing = ({ score, size = 160, label }: { score: number; size?: number; label: string }) => {
  const color = score > 65 ? 'critical' : score > 35 ? 'warning' : 'safe';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={`hsl(var(--${color}))`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display text-3xl font-bold text-${color}`}>{score}</span>
          <span className="font-body text-[9px] text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="font-body text-xs font-bold text-foreground mt-2">{label}</span>
    </div>
  );
};

const CredibilityBadge = ({ label }: { label: 'Highly Credible' | 'Contested' | 'Unverified' }) => {
  const styles = {
    'Highly Credible': 'bg-critical/10 text-critical border-critical/20',
    'Contested': 'bg-warning/10 text-warning border-warning/20',
    'Unverified': 'bg-safe/10 text-safe border-safe/20',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold font-body uppercase tracking-wider border ${styles[label]}`}>
      {label}
    </span>
  );
};

const ResultsPage = ({ topic }: ResultsPageProps) => {
  const [narrativeDisplays, setNarrativeDisplays] = useState<NarrativeDisplay[]>([]);
  const [alignmentScore, setAlignmentScore] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [docCount, setDocCount] = useState(0);
  const [claimCount, setClaimCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchContext = useCallback(() => {
    fetch(`${API_BASE}/context`)
      .then(res => res.json())
      .then((ctx) => {
        const documents = (ctx.documents || []) as BackendDoc[];
        const claimGroups = (ctx.claims || []) as BackendClaimGroup[];
        const narratives = (ctx.narratives || []) as BackendNarrative[];

        setDocCount(documents.length);
        setClaimCount(claimGroups.reduce((sum, g) => sum + (g.claims?.length || 0), 0));

        if (narratives.length > 0) {
          const displays = computeNarratives(narratives, claimGroups, documents);
          setNarrativeDisplays(displays);
          setAlignmentScore(computeAlignmentScore(displays));
          setOverallScore(computeOverallScore(displays));
          setLoading(false);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchContext();
    pollRef.current = setInterval(fetchContext, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchContext]);

  useEffect(() => {
    if (!loading && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Compiling Intelligence Report...</h2>
          <p className="font-body text-sm text-muted-foreground">Waiting for narrative analysis to complete</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ animation: 'fade-up 0.5s ease-out' }}>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Intelligence Report</h1>
          <p className="font-body text-muted-foreground">Subject: "{topic}"</p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            {docCount} sources analyzed — {claimCount} claims extracted — {narrativeDisplays.length} narratives identified
          </p>
        </div>

        {/* Top scores row */}
        <section className="mb-14 flex flex-wrap items-center justify-center gap-12 py-8 border border-foreground/5 rounded-2xl bg-foreground/[0.02]">
          <ScoreRing score={overallScore} label="Overall Credibility" />
          <ScoreRing score={alignmentScore} size={120} label="Source Alignment" />
          <div className="text-center max-w-[200px]">
            <div className="font-display text-5xl font-bold text-foreground">{narrativeDisplays.length}</div>
            <div className="font-body text-xs text-muted-foreground mt-1">Distinct Narratives</div>
          </div>
          <div className="text-center max-w-[200px]">
            <div className="font-display text-5xl font-bold text-foreground">{docCount}</div>
            <div className="font-body text-xs text-muted-foreground mt-1">Sources Scraped</div>
          </div>
        </section>

        {/* Narrative Columns */}
        <section className="mb-14">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Narrative Breakdown</h2>
          <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${Math.min(narrativeDisplays.length, 4)}, 1fr)` }}>
            {narrativeDisplays.map((nar, i) => {
              const color = nar.label === 'Highly Credible' ? 'critical' : nar.label === 'Contested' ? 'warning' : 'safe';
              return (
                <div
                  key={i}
                  className="border border-foreground/10 rounded-xl bg-background overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  style={{ animation: `fade-up 0.5s ease-out ${i * 0.1}s both` }}
                >
                  {/* Narrative header */}
                  <div className={`p-4 border-b border-foreground/5 bg-${color}/5`}>
                    <div className="flex items-center justify-between mb-2">
                      <CredibilityBadge label={nar.label} />
                      <span className={`font-display text-lg font-bold text-${color}`}>{nar.credibilityScore}%</span>
                    </div>
                    <h3 className="font-display text-sm font-bold text-foreground leading-tight">{nar.theme}</h3>
                  </div>

                  {/* Claims */}
                  <div className="p-4 border-b border-foreground/5">
                    <div className="font-body text-[8px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                      Claims ({nar.claims.length})
                    </div>
                    <ul className="space-y-2">
                      {nar.claims.map((claim, ci) => (
                        <li key={ci} className="flex gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 mt-1.5 flex-shrink-0" />
                          <span className="font-body text-[11px] text-foreground/70 leading-tight">{claim}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Contributing sources */}
                  <div className="p-4">
                    <div className="font-body text-[8px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                      Sources ({nar.sources.length})
                    </div>
                    {nar.sources.length > 0 ? (
                      <ul className="space-y-1.5">
                        {nar.sources.map((src, si) => (
                          <li key={si} className="flex items-start gap-2">
                            <span className="font-body text-[10px] text-muted-foreground">#{si + 1}</span>
                            <span className="font-body text-[10px] text-foreground/60 leading-tight line-clamp-2">{src.title}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="font-body text-[10px] text-muted-foreground italic">No direct source link found</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-16 text-center pb-8">
          <p className="font-body text-xs text-muted-foreground tracking-widest uppercase">
            Milou Intelligence Report — Generated by AI Agent Swarm
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
