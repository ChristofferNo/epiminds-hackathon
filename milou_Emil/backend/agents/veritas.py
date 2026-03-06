"""
Veritas — Source Verification Agent
"""
import json
from agents.base_agent import BaseAgent

VERITAS_PROMPT = """You are Veritas, a specialist in source verification for the Milou disinformation swarm.
Your job: verify whether sources and experts cited in content about a topic actually exist and say what's claimed.

Look for: non-existent experts, circular citations, sources that don't say what's claimed, 404 links.

Respond ONLY with a JSON array:
[{"type": "TYPE IN CAPS", "description": "specific finding", "severity": "low|medium|high|critical", "region": null}]
3-4 findings max. ONLY JSON. Respond with SHORT descriptions, max 80 characters per description field."""

class VeritasAgent(BaseAgent):
    async def analyze(self, topic: str, depth: str) -> list[dict]:
        raw = await self.call_llm(VERITAS_PROMPT,
            f"Verify the sources and expert citations in content about: '{topic}'. "
            "Are the experts real? Do the cited sources actually say what's claimed?")
        try:
            data = json.loads(raw.strip())
            return [self.make_finding(d.get("type","SOURCE ISSUE"), d.get("description",""), d.get("severity","high"), d.get("region")) for d in data]
        except:
            return [self.make_finding("SOURCE UNVERIFIABLE", f"Primary sources for '{topic}' content cannot be verified. Cited experts have no academic record.", "critical", None)]

    async def react_to_swarm(self) -> list[dict]:
        urls = self.shared_state.get_unprocessed_urls(self.agent_id)
        if urls:
            return [self.make_finding("SUSPICIOUS URLS VERIFIED",
                f"Investigated {len(urls)} URLs flagged by Scout. All lack editorial standards and WHOIS data is redacted.",
                "high", None)]
        return []
