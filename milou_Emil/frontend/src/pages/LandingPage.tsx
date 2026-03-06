import { useState } from 'react';
import milouSvg from '@/assets/milou.svg';

interface LandingPageProps {
  onSearch: (topic: string, mode: 'quick' | 'deep') => void;
}

const LandingPage = ({ onSearch }: LandingPageProps) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (mode: 'quick' | 'deep') => {
    onSearch(topic || "War in Iran", mode);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" style={{ animation: 'fade-up 0.6s ease-out' }}>
      <div className="flex flex-col items-center px-6 max-w-2xl w-full">
        <h1 className="font-display text-[80px] md:text-[120px] font-black tracking-tight text-foreground leading-none mb-6">
          Milou
        </h1>

        <img
          src={milouSvg}
          alt="Milou the watchdog"
          className="w-[150px] h-auto mb-8"
        />

        <p className="font-body italic text-[22px] text-muted-foreground text-center mb-10 leading-relaxed">
          "The AI watchdog that sniffs out misinformation before it bites."
        </p>

        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic... e.g. 'War in Iran' or 'Election 2025'"
          className="w-full max-w-[600px] px-6 py-4 rounded-full border-2 border-foreground bg-background text-foreground font-body text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent mb-6"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit('deep')}
        />

        <div className="flex gap-4 mb-12">
          <button
            onClick={() => handleSubmit('quick')}
            className="px-8 py-3 rounded-full border-2 border-foreground text-foreground font-body font-medium text-sm hover:bg-foreground hover:text-primary-foreground transition-all duration-200"
          >
            Quick Sniff
          </button>
          <button
            onClick={() => handleSubmit('deep')}
            className="px-8 py-3 rounded-full bg-foreground text-primary-foreground font-body font-medium text-sm hover:bg-foreground/90 transition-all duration-200"
          >
            Deep Investigation
          </button>
        </div>

        <p className="text-muted-foreground font-body text-xs tracking-widest uppercase">
          Powered by a swarm of autonomous AI agents
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
