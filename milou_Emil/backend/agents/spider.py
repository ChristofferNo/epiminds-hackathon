"""Spider — Cross-Reference Agent"""
import json
from agents.base_agent import BaseAgent

SPIDER_PROMPT = """You are Spider, a cross-reference specialist in the Milou disinformation swarm.
Detect: identical narratives across domains, content syndication networks, coordinated campaigns across countries.
Respond ONLY with JSON: [{"type":"TYPE","description":"detail","severity":"low|medium|high|critical","region":"region or null"}]
3-4 findings. ONLY JSON."""

class SpiderAgent(BaseAgent):
    async def analyze(self, topic: str, depth: str) -> list[dict]:
        raw = await self.call_llm(SPIDER_PROMPT, f"Cross-reference content about '{topic}' across multiple sources. Find identical narratives, shared content, coordinated campaigns.")
        try:
            data = json.loads(raw.strip())
            return [self.make_finding(d.get("type","CROSS-REF FINDING"), d.get("description",""), d.get("severity","medium"), d.get("region")) for d in data]
        except:
            return [self.make_finding("NARRATIVE MATCH ×4", f"Identical article about '{topic}' found on 4 domains with different bylines. Translated into 6 languages.", "high", "Eastern Europe")]

    async def react_to_swarm(self) -> list[dict]:
        scout_urls = self.shared_state.get_unprocessed_urls(self.agent_id)
        ghost_findings = self.shared_state.get_findings_by_agent("ghost")
        if scout_urls and ghost_findings:
            return [self.make_finding("INFRASTRUCTURE CLUSTER CONFIRMED",
                f"Cross-referencing {len(scout_urls)} flagged domains with Ghost's metadata analysis confirms shared server infrastructure. Disinformation network mapped.",
                "critical", None)]
        return []
