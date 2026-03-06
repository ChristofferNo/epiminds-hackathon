export interface Agent {
  id: string;
  name: string;
  role: string;
  zone: { x: number; y: number }; // percentage positions
  active: boolean;
  score: number;
  findings: string[];
}

// Swarm agents matching the real backend pipeline
export const swarmAgents: Agent[] = [
  { id: 'scraper', name: 'Scraper', role: 'Web Search & Scraping', zone: { x: 50, y: 15 }, active: true, score: 0, findings: [] },
  { id: 'claims', name: 'Claims', role: 'Claim Extraction', zone: { x: 85, y: 50 }, active: true, score: 0, findings: [] },
  { id: 'narrative', name: 'Narrative', role: 'Narrative Clustering', zone: { x: 50, y: 85 }, active: true, score: 0, findings: [] },
  { id: 'graph', name: 'Graph', role: 'Knowledge Graph', zone: { x: 15, y: 50 }, active: true, score: 0, findings: [] },
];

// Legacy agents used by CrimeBoardPage and ResultsPage
export const agents: Agent[] = [
  { id: 'scout', name: 'Scout', role: 'News Sources', zone: { x: 50, y: 12 }, active: true, score: 82, findings: ['Found 12 articles from unverified news sites', 'breaking-truth-news.com registered 3 days ago', 'rapidinfo24.net has no editorial policy'] },
  { id: 'pixel', name: 'Pixel', role: 'Image Analysis', zone: { x: 80, y: 18 }, active: true, score: 91, findings: ['2 images show AI generation artifacts', 'Reverse image search: 0 prior results', 'EXIF data stripped from all images'] },
  { id: 'reel', name: 'Reel', role: 'Video Analysis', zone: { x: 90, y: 42 }, active: true, score: 67, findings: ['Audio deepfake confidence: 34%', 'Video splice detected at 0:43', 'Original footage source unverified'] },
  { id: 'echo', name: 'Echo', role: 'Social Media', zone: { x: 82, y: 72 }, active: true, score: 78, findings: ['Viral on TikTok: 2.3M views in 6 hours', '340 accounts sharing identical text', 'Coordinated posting pattern detected'] },
  { id: 'lingua', name: 'Lingua', role: 'Language Analysis', zone: { x: 58, y: 88 }, active: true, score: 85, findings: ['AI-generated text probability: 89%', 'Emotional manipulation score: HIGH', 'Clickbait language patterns detected'] },
  { id: 'veritas', name: 'Veritas', role: 'Source Verification', zone: { x: 30, y: 88 }, active: true, score: 72, findings: ['Primary source: UNVERIFIABLE', '3 of 5 cited experts don\'t exist', 'Domain WHOIS data redacted'] },
  { id: 'spider', name: 'Spider', role: 'Cross-Reference', zone: { x: 12, y: 72 }, active: true, score: 64, findings: ['Narrative matches 4 other domains', 'Identical article on rapidinfo24.net', 'Content syndication network detected'] },
  { id: 'ghost', name: 'Ghost', role: 'Metadata', zone: { x: 8, y: 42 }, active: true, score: 58, findings: ['Server located in undisclosed jurisdiction', 'SSL certificate issued 2 days ago', 'No cached versions found'] },
  { id: 'trace', name: 'Trace', role: 'Network Mapping', zone: { x: 18, y: 18 }, active: true, score: 76, findings: ['6 domains share same IP address', 'Ad network linked to known disinfo', 'Traffic spike from bot-like sources'] },
  { id: 'rex', name: 'Rex', role: "Devil's Advocate", zone: { x: 50, y: 50 }, active: true, score: 45, findings: ['Some claims have partial basis in fact', 'Timeline of events is plausible', 'Counter-narrative exists from credible sources'] },
];

export interface Finding {
  id: string;
  agentId: string;
  agentName: string;
  type: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  region?: string;
}

export const mockFindings: Finding[] = [
  { id: '1', agentId: 'pixel', agentName: 'Pixel', type: 'AI IMAGE DETECTED', description: 'Hero image shows GAN artifacts in facial features', timestamp: '2s ago', severity: 'critical', region: 'Middle East' },
  { id: '2', agentId: 'scout', agentName: 'Scout', type: 'DOMAIN 3 DAYS OLD', description: 'breaking-truth-news.com registered on March 3, 2026', timestamp: '4s ago', severity: 'high', region: 'Eastern Europe' },
  { id: '3', agentId: 'lingua', agentName: 'Lingua', type: 'CLICKBAIT LANGUAGE', description: 'Title uses 4 emotional trigger words', timestamp: '6s ago', severity: 'medium', region: 'Middle East' },
  { id: '4', agentId: 'veritas', agentName: 'Veritas', type: 'SOURCE UNVERIFIABLE', description: 'Quoted "Dr. James Werner" has no academic record', timestamp: '8s ago', severity: 'critical', region: 'Middle East' },
  { id: '5', agentId: 'spider', agentName: 'Spider', type: 'NARRATIVE MATCH ×4', description: 'Identical article found on 4 domains with different bylines', timestamp: '10s ago', severity: 'high', region: 'Southeast Asia' },
  { id: '6', agentId: 'echo', agentName: 'Echo', type: 'COORDINATED SHARING', description: '340 accounts posted identical text within 20 minutes', timestamp: '12s ago', severity: 'critical', region: 'Middle East' },
  { id: '7', agentId: 'ghost', agentName: 'Ghost', type: 'METADATA STRIPPED', description: 'All images have EXIF data completely removed', timestamp: '14s ago', severity: 'medium', region: 'Eastern Europe' },
  { id: '8', agentId: 'trace', agentName: 'Trace', type: 'NETWORK CLUSTER', description: '6 domains resolving to same IP: 185.xx.xx.42', timestamp: '16s ago', severity: 'high', region: 'Eastern Europe' },
  { id: '9', agentId: 'reel', agentName: 'Reel', type: 'VIDEO SPLICE', description: 'Cut detected at 0:43 — audio doesn\'t match lip movement', timestamp: '18s ago', severity: 'high', region: 'Middle East' },
  { id: '10', agentId: 'rex', agentName: 'Rex', type: 'PARTIAL TRUTH', description: 'Base event confirmed but details are fabricated', timestamp: '20s ago', severity: 'low', region: 'Western Europe' },
  { id: '11', agentId: 'pixel', agentName: 'Pixel', type: 'REVERSE IMAGE FAIL', description: 'No prior results found — likely original fabrication', timestamp: '22s ago', severity: 'critical', region: 'Southeast Asia' },
  { id: '12', agentId: 'echo', agentName: 'Echo', type: 'VIRAL SPREAD', description: 'TikTok: 2.3M views, 89% engagement from new accounts', timestamp: '24s ago', severity: 'high', region: 'Southeast Asia' },
  { id: '13', agentId: 'lingua', agentName: 'Lingua', type: 'AI-GENERATED TEXT', description: 'GPT detection confidence: 89% across all paragraphs', timestamp: '26s ago', severity: 'critical', region: 'Middle East' },
  { id: '14', agentId: 'scout', agentName: 'Scout', type: 'NO EDITORIAL POLICY', description: 'rapidinfo24.net has no about page, no editorial standards', timestamp: '28s ago', severity: 'medium', region: 'Western Europe' },
];

export const regionData = [
  { name: 'Middle East', level: 'HIGH', sources: 89, color: 'critical', cx: 58, cy: 38, r: 18, narratives: ['Fabricated military escalation reports', 'AI-generated casualty images', 'Fake diplomatic statements'] },
  { name: 'Eastern Europe', level: 'MEDIUM', sources: 34, color: 'warning', cx: 52, cy: 25, r: 12, narratives: ['Coordinated domain network', 'Translated disinformation', 'Bot amplification detected'] },
  { name: 'Southeast Asia', level: 'MEDIUM', sources: 28, color: 'warning', cx: 75, cy: 45, r: 11, narratives: ['Viral TikTok campaigns', 'Cross-platform narrative sync', 'Local language adaptations'] },
  { name: 'Western Europe', level: 'LOW', sources: 12, color: 'safe', cx: 47, cy: 28, r: 8, narratives: ['Fact-checks already published', 'Mainstream media covering debunks', 'Low social media traction'] },
];

export const evidenceCards = [
  { id: 'e1', icon: '🖼', title: 'AI-Generated Image Detected', detail: 'GAN artifacts found in hero image facial features. No reverse image matches.', agent: 'Pixel', connections: ['e3', 'e7'] },
  { id: 'e2', icon: '🔗', title: 'Missing Source Links', detail: '3 of 5 cited sources return 404. Remaining 2 are circular references.', agent: 'Veritas', connections: ['e4'] },
  { id: 'e3', icon: '⚡', title: 'Language Patterns: AI-generated', detail: 'GPT detection confidence: 89%. Emotional manipulation score: HIGH.', agent: 'Lingua', connections: ['e1', 'e5'] },
  { id: 'e4', icon: '📅', title: 'Domain registered 3 days ago', detail: 'breaking-truth-news.com — WHOIS redacted, SSL cert issued 48hrs ago.', agent: 'Scout', connections: ['e2', 'e6'] },
  { id: 'e5', icon: '🌐', title: 'Narrative spreading in 6 countries', detail: 'Identical text found translated into Arabic, Russian, Thai, Hindi, Spanish, French.', agent: 'Spider', connections: ['e3', 'e6'] },
  { id: 'e6', icon: '📱', title: 'Viral on TikTok: 2.3M views', detail: '89% engagement from accounts created within last 7 days.', agent: 'Echo', connections: ['e4', 'e5'] },
  { id: 'e7', icon: '🔄', title: 'Identical text on 4 domains', detail: 'rapidinfo24.net, breaking-truth-news.com, worldalert-now.org, newsflash-global.com', agent: 'Spider', connections: ['e1'] },
];
