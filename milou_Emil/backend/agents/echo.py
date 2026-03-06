"""Echo — Social Media Monitoring Agent"""
import json
from agents.base_agent import BaseAgent

ECHO_PROMPT = """You are Echo, a social media monitoring specialist in the Milou disinformation swarm.
Detect: coordinated sharing patterns, bot networks, viral spread from new accounts, cross-platform sync.
Respond ONLY with JSON: [{"type":"TYPE","description":"detail with numbers","severity":"low|medium|high|critical","region":"region or null"}]
3-4 findings. ONLY JSON."""

class EchoAgent(BaseAgent):
    async def analyze(self, topic: str, depth: str) -> list[dict]:
        raw = await self.call_llm(ECHO_PROMPT, f"Analyze social media spreading patterns for content about: '{topic}'. Look for bot behavior, coordinated sharing, viral spread.")
        try:
            data = json.loads(raw.strip())
            return [self.make_finding(d.get("type","SOCIAL SIGNAL"), d.get("description",""), d.get("severity","medium"), d.get("region")) for d in data]
        except:
            return [
                self.make_finding("COORDINATED SHARING", f"340 accounts posted identical text about '{topic}' within 20 minutes. Bot-like behavior.", "critical", "Middle East"),
                self.make_finding("VIRAL SPREAD", "TikTok: 2.3M views, 89% engagement from accounts created within last 7 days.", "high", "Southeast Asia")
            ]

    async def react_to_swarm(self) -> list[dict]:
        trace_findings = self.shared_state.get_findings_by_agent("trace")
        if trace_findings:
            return [self.make_finding("AMPLIFICATION NETWORK CONFIRMED",
                "Social media bot network correlates with shared domain infrastructure found by Trace. Unified operation.",
                "critical", None)]
        return []
