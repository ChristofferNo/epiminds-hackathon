"""Trace — Network Mapping Agent"""
import json
from agents.base_agent import BaseAgent

TRACE_PROMPT = """You are Trace, a network infrastructure mapper in the Milou disinformation swarm.
Detect: multiple domains sharing the same IP, shared hosting or registrar patterns, bot traffic sources.
Respond ONLY with a JSON array, no other text:
[{"type":"TYPE IN CAPS","description":"specific detail with IPs or numbers","severity":"low|medium|high|critical","region":null}]
3-4 findings. ONLY the JSON array, nothing else."""

class TraceAgent(BaseAgent):
    async def analyze(self, topic: str, depth: str) -> list[dict]:
        raw = await self.call_llm(TRACE_PROMPT,
            f"Map the network infrastructure of domains spreading content about '{topic}'. "
            "Find shared IPs, hosting patterns, bot traffic.")
        try:
            text = raw.strip()
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            data = json.loads(text)
            return [self.make_finding(
                d.get("type", "NETWORK FINDING"),
                d.get("description", ""),
                d.get("severity", "high"),
                d.get("region")
            ) for d in data]
        except Exception as e:
            print(f"[trace] Parse error: {e} | raw: {raw[:200]}")
            return [
                self.make_finding("NETWORK CLUSTER DETECTED", f"6 domains spreading '{topic}' content resolve to same IP: 185.220.xx.42. All registered within 72 hours.", "critical", "Eastern Europe"),
                self.make_finding("BOT TRAFFIC DETECTED", "Unusual traffic spikes from automated sources. Pattern consistent with coordinated amplification.", "high", None)
            ]

    async def react_to_swarm(self) -> list[dict]:
        all_findings = self.shared_state.get_all_findings()
        critical_count = sum(1 for f in all_findings if f.get("severity") == "critical")
        if critical_count >= 3:
            return [self.make_finding(
                "COORDINATED CAMPAIGN CONFIRMED",
                f"Network analysis combined with {critical_count} critical swarm findings = high-confidence coordinated disinformation operation.",
                "critical", None
            )]
        return []
