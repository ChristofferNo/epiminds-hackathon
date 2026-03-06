"""Rex — Devil's Advocate Agent"""
import json
from agents.base_agent import BaseAgent

REX_PROMPT = """You are Rex, the devil's advocate in the Milou disinformation swarm.
Your job is the OPPOSITE of the other agents: find evidence that content might be LEGITIMATE.
Look for: credible sources that corroborate the story, real experts who confirm facts, established outlets covering the same topic.
This prevents false positives and keeps the swarm honest.
Respond ONLY with a JSON array, no other text:
[{"type":"TYPE IN CAPS","description":"balancing finding","severity":"low","region":null}]
2-3 findings. ONLY the JSON array, nothing else."""

class RexAgent(BaseAgent):
    async def analyze(self, topic: str, depth: str) -> list[dict]:
        raw = await self.call_llm(REX_PROMPT,
            f"Find evidence that content about '{topic}' might have a legitimate basis. "
            "What parts are true? What credible sources confirm any of this?")
        try:
            text = raw.strip()
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            data = json.loads(text)
            return [self.make_finding(
                d.get("type", "CREDIBILITY FACTOR"),
                d.get("description", ""),
                "low",
                d.get("region")
            ) for d in data]
        except Exception as e:
            print(f"[rex] Parse error: {e} | raw: {raw[:200]}")
            return [
                self.make_finding("PARTIAL TRUTH FOUND", f"Base event for '{topic}' is confirmed by credible sources. Core facts are real — disinformation is in the framing and fabricated details.", "low", None)
            ]

    def calculate_score(self) -> float:
        """Rex's score is inverted — lower means content is MORE suspicious."""
        my_findings = self.shared_state.get_findings_by_agent(self.agent_id)
        return 35.0 if my_findings else 50.0

    async def react_to_swarm(self) -> list[dict]:
        all_findings = self.shared_state.get_all_findings()
        critical = [f for f in all_findings if f.get("severity") == "critical" and f.get("agentId") != self.agent_id]
        if len(critical) >= 3:
            return [self.make_finding(
                "NO CREDIBLE COUNTER-EVIDENCE",
                f"Despite searching thoroughly, I found no credible sources defending this content. Swarm consensus of {len(critical)} critical findings stands.",
                "low", None
            )]
        return []
