"""
SharedState — The collective brain of the Milou swarm.

Every agent reads from and writes to this object.
No agent tells another what to do — they react to what they see here.
This is stigmergy: like ant pheromones, but for AI.
"""

import asyncio
from datetime import datetime
from typing import Any


class SharedState:
    def __init__(self):
        self.topic: str = ""
        self.findings: list[dict] = []
        self.agent_scores: dict[str, float] = {}
        self.agent_status: dict[str, bool] = {}  # agent_id -> active
        self.urls_to_investigate: list[str] = []  # agents add URLs here for others to pick up
        self.narratives_found: list[str] = []
        self.regions_affected: list[str] = []
        self.threat_score: float = 0.0
        self._lock = asyncio.Lock()

        # Agent definitions (matches frontend mockData.ts)
        self.agent_definitions = {
            "scout":   {"name": "Scout",   "role": "News Sources"},
            "pixel":   {"name": "Pixel",   "role": "Image Analysis"},
            "reel":    {"name": "Reel",    "role": "Video Analysis"},
            "echo":    {"name": "Echo",    "role": "Social Media"},
            "lingua":  {"name": "Lingua",  "role": "Language Analysis"},
            "veritas": {"name": "Veritas", "role": "Source Verification"},
            "spider":  {"name": "Spider",  "role": "Cross-Reference"},
            "ghost":   {"name": "Ghost",   "role": "Metadata"},
            "trace":   {"name": "Trace",   "role": "Network Mapping"},
            "rex":     {"name": "Rex",     "role": "Devil's Advocate"},
        }

    def reset(self, topic: str):
        """Reset for a new investigation."""
        self.topic = topic
        self.findings = []
        self.agent_scores = {k: 0.0 for k in self.agent_definitions}
        self.agent_status = {k: True for k in self.agent_definitions}
        self.urls_to_investigate = []
        self.narratives_found = []
        self.regions_affected = []
        self.threat_score = 0.0

    async def add_finding(self, finding: dict) -> dict:
        """
        Add a finding to the shared board.
        All agents can see all findings at all times.

        finding dict should match frontend Finding interface:
        {
            agentId: str,
            agentName: str,
            type: str,          # e.g. "AI IMAGE DETECTED"
            description: str,
            severity: "low" | "medium" | "high" | "critical",
            region: str (optional)
        }
        """
        async with self._lock:
            finding["id"] = f"{finding['agentId']}-{len(self.findings)}"
            finding["timestamp"] = datetime.now().isoformat()
            self.findings.append(finding)
            self._recalculate_threat_score()
            return finding

    async def add_url(self, url: str, discovered_by: str):
        """
        Agent adds a URL it found for other agents to investigate.
        This is how emergence happens — Scout finds a URL,
        Veritas sees it and goes to check it, Trace maps its network, etc.
        """
        async with self._lock:
            if url not in self.urls_to_investigate:
                self.urls_to_investigate.append(url)
                print(f"[SharedState] {discovered_by} added URL for swarm: {url}")

    def get_unprocessed_urls(self, agent_id: str) -> list[str]:
        """Get URLs that this agent type should investigate."""
        return self.urls_to_investigate.copy()

    async def update_agent_score(self, agent_id: str, score: float):
        async with self._lock:
            self.agent_scores[agent_id] = score
            self._recalculate_threat_score()

    def set_agent_status(self, agent_id: str, active: bool):
        self.agent_status[agent_id] = active

    def get_findings_by_agent(self, agent_id: str) -> list[dict]:
        return [f for f in self.findings if f["agentId"] == agent_id]

    def get_all_findings(self) -> list[dict]:
        return self.findings.copy()

    def _recalculate_threat_score(self):
        """
        Threat score emerges from what agents have collectively found.
        Not set by any single agent — it's a function of all findings.
        """
        if not self.findings:
            self.threat_score = 0.0
            return

        severity_weights = {"critical": 1.0, "high": 0.7, "medium": 0.4, "low": 0.1}
        total = sum(severity_weights.get(f.get("severity", "low"), 0) for f in self.findings)
        max_possible = len(self.findings) * 1.0
        self.threat_score = min(100, (total / max_possible) * 100) if max_possible > 0 else 0

    def get_full_state(self) -> dict:
        """Complete state snapshot — sent to frontend on connect."""
        return {
            "topic": self.topic,
            "findings": self.findings,
            "agentScores": self.agent_scores,
            "agentStatus": self.agent_status,
            "threatScore": self.threat_score,
            "urlsFound": len(self.urls_to_investigate),
            "narrativesFound": self.narratives_found,
            "regionsAffected": self.regions_affected,
        }
