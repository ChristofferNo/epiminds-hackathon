import { useState } from 'react';
import LandingPage from './LandingPage';
import SwarmPage from './SwarmPage';
import CrimeBoardPage from './CrimeBoardPage';
import ResultsPage from './ResultsPage';

type AppPage = 'landing' | 'swarm' | 'crime' | 'results';

const Index = () => {
  const [page, setPage] = useState<AppPage>('landing');
  const [topic, setTopic] = useState('');

  const handleSearch = (searchTopic: string) => {
    setTopic(searchTopic);
    setPage('swarm');
  };

  // Helper to render the active page
  const renderPage = () => {
    switch (page) {
      case 'swarm':
        return <SwarmPage topic={topic} onComplete={() => setPage('crime')} />;
      case 'crime':
        return <CrimeBoardPage topic={topic} onNext={() => setPage('results')} />;
      case 'results':
        return <ResultsPage topic={topic} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-critical/20">
      {/* Visual Grain Effect */}
      <div className="grain-overlay" />

      {page === 'landing' ? (
        <LandingPage onSearch={handleSearch} />
      ) : (
        <div className="flex flex-col h-screen">
          {/* Persistent Swarm Navigation */}
          <nav className="fixed top-0 left-0 right-0 h-14 bg-background/60 backdrop-blur-xl border-b border-foreground/5 z-[100] flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-critical animate-pulse" />
                <span className="font-display font-bold text-sm tracking-tighter uppercase">Milou Swarm</span>
              </div>
              <div className="h-4 w-[1px] bg-foreground/10" />
              <span className="font-body text-[10px] text-muted-foreground uppercase tracking-widest truncate max-w-[200px]">
                Case: <span className="text-foreground font-bold italic">"{topic}"</span>
              </span>
            </div>

            <div className="flex items-center gap-6">
              {[
                { id: 'swarm', label: '1. Neural Swarm' },
                { id: 'crime', label: '2. Evidence Board' },
                { id: 'results', label: '3. Intelligence Report' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id as AppPage)}
                  className={`font-body text-[10px] font-bold uppercase tracking-widest transition-all hover:text-foreground ${page === item.id
                      ? 'text-foreground border-b border-foreground pb-1'
                      : 'text-muted-foreground'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage('landing')}
              className="font-body text-[10px] text-muted-foreground hover:text-critical transition-colors uppercase font-bold"
            >
              Terminate Session
            </button>
          </nav>

          {/* Page Container */}
          <main className="flex-1 pt-14 relative overflow-hidden">
            {renderPage()}
          </main>
        </div>
      )}
    </div>
  );
};

export default Index;