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

  return (
    <div className="grain-overlay">
      {page === 'landing' && <LandingPage onSearch={handleSearch} />}
      {page === 'swarm' && <SwarmPage topic={topic} onComplete={() => setPage('crime')} />}
      {page === 'crime' && <CrimeBoardPage topic={topic} onNext={() => setPage('results')} />}
      {page === 'results' && <ResultsPage topic={topic} />}
    </div>
  );
};

export default Index;
