// ============================================================
// MILOU FRONTEND — WebSocket integration
// Replace mock data in SwarmPage.tsx with this
// ============================================================

// 1. ADD THIS HOOK: src/hooks/useSwarm.ts
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Finding, Agent } from '@/data/mockData';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useSwarm() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [agentScores, setAgentScores] = useState<Record<string, number>>({});
  const [agentStatus, setAgentStatus] = useState<Record<string, boolean>>({});
  const [threatScore, setThreatScore] = useState(0);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log('[Milou] Connected to swarm');
      setConnected(true);
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'state_snapshot':
          // Full state on connect
          setFindings(msg.data.findings || []);
          setAgentScores(msg.data.agentScores || {});
          setAgentStatus(msg.data.agentStatus || {});
          setThreatScore(msg.data.threatScore || 0);
          break;

        case 'new_finding':
          // Real-time finding from an agent
          setFindings(prev => [msg.data, ...prev]);
          break;

        case 'agent_score_update':
          setAgentScores(prev => ({ ...prev, [msg.agent_id]: msg.score }));
          break;

        case 'agent_killed':
          setAgentStatus(prev => ({ ...prev, [msg.agent_id]: false }));
          break;
      }
    };

    socket.onclose = () => {
      setConnected(false);
      console.log('[Milou] Disconnected from swarm');
    };

    return () => socket.close();
  }, []);

  // Start a new investigation
  const investigate = useCallback(async (topic: string, depth: 'quick' | 'deep') => {
    const res = await fetch(`${API_URL}/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, depth })
    });
    return res.json();
  }, []);

  // Kill switch — disable an agent live during demo
  const killAgent = useCallback((agentId: string) => {
    ws?.send(JSON.stringify({ type: 'kill_agent', agent_id: agentId }));
  }, [ws]);

  // Revive a killed agent
  const reviveAgent = useCallback((agentId: string) => {
    ws?.send(JSON.stringify({ type: 'revive_agent', agent_id: agentId }));
  }, [ws]);

  return {
    findings,
    agentScores,
    agentStatus,
    threatScore,
    connected,
    investigate,
    killAgent,
    reviveAgent,
  };
}


// ============================================================
// 2. HOW TO USE IN SwarmPage.tsx
// ============================================================
// Replace the mock setInterval logic with:
//
// const { findings, agentStatus, threatScore, investigate, killAgent } = useSwarm();
//
// useEffect(() => {
//   if (topic) investigate(topic, 'deep');
// }, [topic]);
//
// Pass killAgent to your Kill Switch panel:
// <KillSwitchPanel agents={agentStates} onKill={killAgent} />
//
// The findings array will update in real-time from the backend.
// Everything else in your UI stays the same — just swap mockFindings for findings.


// ============================================================
// 3. ADD TO vite.config.ts (for local dev CORS):
// ============================================================
// server: {
//   proxy: {
//     '/api': 'http://localhost:8000',
//     '/ws': { target: 'ws://localhost:8000', ws: true }
//   }
// }


// ============================================================
// 4. ADD TO .env in your Lovable/frontend project:
// ============================================================
// VITE_WS_URL=ws://localhost:8000/ws
// VITE_API_URL=http://localhost:8000
//
// For production (GCP):
// VITE_WS_URL=wss://your-cloud-run-url/ws
// VITE_API_URL=https://your-cloud-run-url
