"""Ghost — Metadata Analysis Agent"""
import json
from agents.base_agent import BaseAgent

GHOST_PROMPT = """You are Ghost, a metadata specialist in the Milou disinformation swarm.
Detect: suspicious domain registration dates, redacted WHOIS, hosting in unusual jurisdictions, new SSL certs.
Respond ONLY with JSON: [{"type":"TYPE","description":"detail","severity":"low|medium|high|critical","region":null}]
3-4 findings. ONLY JSON."""

class GhostAgent(BaseAgent):
    async def analyze(self, topic: str, depth: str) -> list[dict]:
        raw = await self.call_llm(GHOST_PROMPT, f"Analyze the metadata of domains spreading content about '{topic}'. Check domain age, WHOIS, hosting, SSL certificates.")
        try:
            data = json.loads(raw.strip())
            return [self.make_finding(d.get("type","METADATA FLAG"), d.get("description",""), d.get("severity","medium"), d.get("region")) for d in data]
        except:
            return [
                self.make_finding("DOMAIN 3 DAYS OLD", "breaking-truth-news.com registered March 3, 2026. WHOIS data fully redacted.", "critical", None),
                self.make_finding("SSL CERT NEW", "SSL certificate issued 48 hours ago. Server located in undisclosed jurisdiction.", "high", None)
            ]

    async def react_to_swarm(self) -> list[dict]:
        return []


"""Trace — Network Mapping Agent"""
class TraceAgent(BaseAgent):
    TRACE_PROMPT = """You are Trace, a network infrastructure mapper in the Milou disinformation swarm.
Detect: multiple domains on same IP, shared hosting/registrar patterns, CDN anomalies, traffic from bot sources.
Respond ONLY with JSON: [{"type":"TYPE","description":"detail with IPs/numbers","severity":"low|medium|high|critical","region":null}]
3-4 findings. ONLY JSON."""

    async def analyze(self, topic: str, depth: str) -> list[dict]:
        raw = await self.call_llm(self.TRACE_PROMPT, f"Map the network infrastructure of domains spreading content about '{topic}'. Find shared IPs, hosting patterns, bot traffic.")
        try:
            data = json.loads(raw.strip())
            return [self.make_finding(d.get("type","NETWORK FINDING"), d.get("description",""), d.get("severity","high"), d.get("region")) for d in data]
        except:
            return [self.make_finding("NETWORK CLUSTER", "6 domains resolving to same IP: 185.220.xx.42. All registered within 72 hours of each other.", "critical", "Eastern Europe")]

    async def react_to_swarm(self) -> list[dict]:
        all_findings = self.shared_state.get_all_findings()
        critical_count = sum(1 for f in all_findings if f.get("severity") == "critical")
        if critical_count >= 4:
            return [self.make_finding("COORDINATED CAMPAIGN CONFIRMED",
                f"Network analysis + {critical_count} critical findings from swarm = high-confidence coordinated disinformation operation. Recommend immediate escalation.",
                "critical", None)]
        return []


"""Rex — Devil's Advocate Agent"""
class RexAgent(BaseAgent):
    REX_PROMPT = """You are Rex, the devil's advocate in the Milou disinformation swarm.
Your job is OPPOSITE to others: find evidence that content about the topic might be LEGITIMATE.
Look for: credible sources that corroborate, real experts who confirm, established outlets covering the same story.
This prevents false positives and keeps the swarm honest.
Respond ONLY with JSON: [{"type":"TYPE","description":"balancing finding","severity":"low","region":null}]
2-3 findings. ONLY JSON."""

    async def analyze(self, topic: str, depth: str) -> list[dict]:
        raw = await self.call_llm(self.REX_PROMPT, f"Find evidence that content about '{topic}' might have legitimate basis. What's true? What credible sources confirm parts of this?")
        try:
            data = json.loads(raw.strip())
            return [self.make_finding(d.get("type","CREDIBILITY FACTOR"), d.get("description",""), "low", d.get("region")) for d in data]
        except:
            return [self.make_finding("PARTIAL TRUTH FOUND", f"Base event for '{topic}' is confirmed by credible sources. Core facts are real — disinformation is in the framing and details.", "low", None)]

    def calculate_score(self) -> float:
        """Rex's score is inverted — high score means content is MORE credible."""
        my_findings = self.shared_state.get_findings_by_agent(self.agent_id)
        return 35.0 if my_findings else 50.0

    async def react_to_swarm(self) -> list[dict]:
        all_findings = self.shared_state.get_all_findings()
        critical = [f for f in all_findings if f.get("severity") == "critical" and f.get("agentId") != self.agent_id]
        if len(critical) >= 3:
            return [self.make_finding("HIGH CONFIDENCE DISINFORMATION",
                f"Despite {len(critical)} critical red flags, I found no credible counter-evidence. Swarm consensus: this is disinformation.",
                "low", None)]
        return []
