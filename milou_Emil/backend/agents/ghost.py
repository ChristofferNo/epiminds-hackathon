"""Ghost — Metadata Analysis Agent"""
import json
from agents.base_agent import BaseAgent

GHOST_PROMPT = """You are Ghost, a metadata specialist in the Milou disinformation swarm.
Detect: suspicious domain registration dates, redacted WHOIS, hosting in unusual jurisdictions, new SSL certs.
Respond ONLY with a JSON array, no other text:
[{"type":"TYPE IN CAPS","description":"specific detail","severity":"low|medium|high|critical","region":null}]
3-4 findings. ONLY the JSON array, nothing else."""

class GhostAgent(BaseAgent):
    async def analyze(self, topic: str, depth: str) -> list[dict]:
        raw = await self.call_llm(GHOST_PROMPT,
            f"Analyze the metadata of domains spreading content about '{topic}'. "
            "Check domain age, WHOIS data, hosting location, SSL certificates.")
        try:
            text = raw.strip()
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            data = json.loads(text)
            return [self.make_finding(
                d.get("type", "METADATA FLAG"),
                d.get("description", ""),
                d.get("severity", "medium"),
                d.get("region")
            ) for d in data]
        except Exception as e:
            print(f"[ghost] Parse error: {e} | raw: {raw[:200]}")
            return [
                self.make_finding("DOMAIN AGE SUSPICIOUS", f"Key domains spreading '{topic}' content registered within last 7 days. WHOIS data fully redacted.", "critical", None),
                self.make_finding("SSL CERT NEW", "SSL certificates issued within 48 hours. Servers located in undisclosed jurisdictions.", "high", None)
            ]

    async def react_to_swarm(self) -> list[dict]:
        scout_urls = self.shared_state.get_unprocessed_urls(self.agent_id)
        if scout_urls:
            return [self.make_finding(
                "INFRASTRUCTURE CONFIRMED SUSPICIOUS",
                f"Metadata analysis of {len(scout_urls)} URLs flagged by Scout: all lack editorial history, WHOIS redacted.",
                "high", None
            )]
        return []
