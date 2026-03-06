import { evidenceCards } from '@/data/mockData';

interface CrimeBoardPageProps {
  topic: string;
  onNext: () => void;
}

const cardPositions = [
  { x: 12, y: 15, rot: -3 },
  { x: 65, y: 10, rot: 2 },
  { x: 8, y: 55, rot: -1.5 },
  { x: 38, y: 65, rot: 1.8 },
  { x: 70, y: 58, rot: -2.5 },
  { x: 60, y: 35, rot: 1 },
  { x: 20, y: 78, rot: 3 },
];

const CrimeBoardPage = ({ topic, onNext }: CrimeBoardPageProps) => {
  // Build connection map for SVG lines
  const connections: { from: number; to: number }[] = [];
  evidenceCards.forEach((card, i) => {
    card.connections.forEach(targetId => {
      const j = evidenceCards.findIndex(c => c.id === targetId);
      if (j > i) connections.push({ from: i, to: j });
    });
  });

  return (
    <div className="fixed inset-0 paper-texture overflow-auto" style={{ backgroundColor: 'hsl(39, 30%, 89%)', animation: 'fade-up 0.5s ease-out' }}>
      {/* Grain */}
      <div className="grain-overlay" />

      {/* Header */}
      <div className="absolute top-4 left-6 z-20">
        <h2 className="font-display text-2xl font-bold text-foreground">Evidence Board</h2>
        <p className="font-body text-xs text-muted-foreground">Case: "{topic}"</p>
      </div>
      <button
        onClick={onNext}
        className="absolute top-4 right-6 z-20 px-6 py-2 bg-foreground text-primary-foreground font-body text-xs font-bold rounded hover:bg-foreground/90 transition-colors"
      >
        View Results →
      </button>

      {/* SVG lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {connections.map(({ from, to }, i) => {
          const fp = cardPositions[from];
          const tp = cardPositions[to];
          return (
            <line
              key={i}
              x1={`${fp.x + 10}%`} y1={`${fp.y + 5}%`}
              x2={`${tp.x + 10}%`} y2={`${tp.y + 5}%`}
              stroke="hsl(var(--critical))"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              opacity="0.5"
            />
          );
        })}
        {/* Lines to center subject card */}
        {cardPositions.map((p, i) => (
          <line
            key={`center-${i}`}
            x1={`${p.x + 10}%`} y1={`${p.y + 5}%`}
            x2="50%" y2="42%"
            stroke="hsl(var(--critical))"
            strokeWidth="0.8"
            strokeDasharray="4 6"
            opacity="0.2"
          />
        ))}
      </svg>

      {/* Center subject card */}
      <div
        className="absolute bg-background border-2 border-critical rounded-lg p-4 shadow-lg z-10"
        style={{ left: '50%', top: '42%', transform: 'translate(-50%, -50%) rotate(0.5deg)', width: '220px' }}
      >
        <div className="font-body text-[10px] uppercase tracking-widest text-critical font-bold mb-1">SUBJECT</div>
        <div className="font-display text-lg font-bold text-foreground">{topic}</div>
        <div className="font-body text-[10px] text-muted-foreground mt-1">Under investigation • 14 findings</div>
      </div>

      {/* Evidence cards */}
      {evidenceCards.map((card, i) => {
        const pos = cardPositions[i];
        return (
          <div
            key={card.id}
            className="absolute bg-background/95 border border-foreground/10 rounded p-3 shadow-md z-10"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `rotate(${pos.rot}deg)`,
              width: '200px',
              animation: `fade-up 0.5s ease-out ${i * 0.1}s both`,
            }}
          >
            <div className="text-2xl mb-1">{card.icon}</div>
            <h4 className="font-body text-xs font-bold text-foreground mb-1">{card.title}</h4>
            <p className="font-body text-[10px] text-muted-foreground leading-tight mb-2">{card.detail}</p>
            <div className="inline-block px-1.5 py-0.5 rounded bg-foreground/5 text-[8px] font-body font-bold text-muted-foreground uppercase tracking-wider">
              Agent: {card.agent}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CrimeBoardPage;
