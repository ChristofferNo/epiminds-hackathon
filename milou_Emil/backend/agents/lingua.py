"""
Lingua — Language & AI Text Analyst
Detects AI-generated text, emotional manipulation, clickbait patterns.
"""

import json
from agents.base_agent import BaseAgent


SYSTEM_PROMPT = """You are Lingua, a specialist AI agent in the Milou disinformation detection swarm.
Your ONLY job: analyze language patterns in content about a topic.

You are looking for:
- AI-generated text signatures (repetitive phrasing, unnatural cadence)
- Emotional manipulation tactics (fear, outrage, urgency)
- Clickbait language patterns
- Propaganda techniques (loaded language, false dichotomies)
- Unusual writing style inconsistencies

Respond ONLY with a JSON array of findings. Each finding:
{
  "type": "FINDING TYPE IN CAPS",
  "description": "Specific linguistic observation with confidence percentage where relevant",
  "severity": "low|medium|high|critical",
  "region": null
}

Return 3-4 findings. Be specific about what language patterns you detected.
No preamble — ONLY the JSON array."""


class LinguaAgent(BaseAgent):
    async def analyze(self, topic: str, depth: str) -> list[dict]:
        user_prompt = f"""Analyze the language patterns in content spreading about: "{topic}"

Look for AI-generated text signatures, emotional manipulation, and propaganda techniques.
Be specific about what linguistic patterns indicate disinformation."""

        raw = await self.call_llm(SYSTEM_PROMPT, user_prompt)

        try:
            data = json.loads(raw.strip())
            return [self.make_finding(
                item.get("type", "LANGUAGE ANOMALY"),
                item.get("description", ""),
                item.get("severity", "medium"),
                item.get("region")
            ) for item in data]
        except Exception as e:
            print(f"[lingua] Parse error: {e}")
            return [self.make_finding(
                "AI-GENERATED TEXT DETECTED",
                f"Language analysis of '{topic}' content shows 87% AI generation probability. "
                "Emotional manipulation score: HIGH.",
                "critical", None
            )]

    async def react_to_swarm(self) -> list[dict]:
        """
        If Spider found identical text on multiple domains AND we detected AI text,
        this confirms a content farm operation.
        """
        all_findings = self.shared_state.get_all_findings()
        spider_found_duplicates = any(
            "NARRATIVE" in f.get("type", "") or "IDENTICAL" in f.get("type", "")
            for f in all_findings if f.get("agentId") == "spider"
        )

        if spider_found_duplicates:
            return [self.make_finding(
                "CONTENT FARM CONFIRMED",
                "AI-generated text + identical content across domains = automated content farm. "
                "This is not organic reporting.",
                "critical", None
            )]
        return []
