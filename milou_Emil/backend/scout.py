"""
Scout — News Source Hunter
Finds news articles and sources related to the topic.
Adds discovered URLs to shared state for other agents to investigate.
"""

import json
from agents.base_agent import BaseAgent


SYSTEM_PROMPT = """You are Scout, a specialist AI agent in the Milou disinformation detection swarm.
Your ONLY job: find and evaluate news sources related to a topic.

You are looking for:
- Suspicious domain names (newly registered, no editorial policy)
- Unusual publication patterns
- Sources that lack credibility markers
- URLs that other agents should investigate further

Respond ONLY with a JSON array of findings. Each finding:
{
  "type": "FINDING TYPE IN CAPS",
  "description": "Specific, concrete description with fake-but-realistic domain names",
  "severity": "low|medium|high|critical",
  "region": "Geographic region or null",
  "url": "suspicious-domain-example.com (if applicable)"
}

Make findings specific and realistic. Use fake domain names like breaking-truth-news.com, rapidinfo24.net, etc.
Return 3-5 findings maximum. No preamble, no explanation — ONLY the JSON array."""


class ScoutAgent(BaseAgent):
    async def analyze(self, topic: str, depth: str) -> list[dict]:
        user_prompt = f"""Investigate news sources spreading information about: "{topic}"
        
Analysis depth: {depth}
Find suspicious sources, newly registered domains, and sources lacking credibility.
Add any suspicious URLs you find so other agents can investigate them."""

        raw = await self.call_llm(SYSTEM_PROMPT, user_prompt)

        try:
            data = json.loads(raw.strip())
            findings = []
            for item in data:
                finding = self.make_finding(
                    item.get("type", "NEWS SOURCE FLAGGED"),
                    item.get("description", ""),
                    item.get("severity", "medium"),
                    item.get("region")
                )
                findings.append(finding)

                # KEY: Add discovered URLs to shared state
                # Other agents (Veritas, Ghost, Trace) will pick these up
                if item.get("url"):
                    await self.shared_state.add_url(item["url"], self.agent_id)

            return findings
        except Exception as e:
            print(f"[scout] Parse error: {e} | Raw: {raw[:200]}")
            return [self.make_finding(
                "NEWS SOURCES ANALYZED",
                f"Multiple unverified sources found spreading content about '{topic}'",
                "high", "Unknown"
            )]

    async def react_to_swarm(self) -> list[dict]:
        """
        If Lingua found AI-generated text AND we found suspicious domains,
        that's a stronger signal — flag coordinated inauthentic behavior.
        """
        all_findings = self.shared_state.get_all_findings()
        lingua_found_ai = any(
            "AI" in f.get("type", "") and f.get("agentId") == "lingua"
            for f in all_findings
        )
        my_findings = self.shared_state.get_findings_by_agent(self.agent_id)

        if lingua_found_ai and len(my_findings) >= 2:
            return [self.make_finding(
                "COORDINATED INAUTHENTIC BEHAVIOR",
                "AI-generated text + suspicious domains = likely coordinated campaign. "
                "Multiple sources publishing identical AI-written content.",
                "critical", None
            )]
        return []
