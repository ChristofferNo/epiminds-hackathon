"""
BaseAgent — The template for all Milou swarm agents.

Key design principle:
- Each agent has its OWN system prompt and personality
- Each agent reads shared_state FREELY (sees everything)
- Each agent writes findings back to shared_state
- NO agent tells another what to do
- Agents react to each other's findings organically
"""

import asyncio
import json
from datetime import datetime
from shared_state import SharedState


class BaseAgent:
    def __init__(self, agent_id: str, shared_state: SharedState, broadcast_fn):
        self.agent_id = agent_id
        self.shared_state = shared_state
        self.broadcast = broadcast_fn
        self.api_key = None  # Set via environment variable
        self.model = "gpt-4o-mini"  # Use mini for speed; swap to gpt-4o for quality

    async def run(self, topic: str, depth: str = "deep"):
        """
        Main agent loop. Override analyze() in each subclass.
        The agent runs, then reacts to other agents' findings.
        """
        print(f"[{self.agent_id}] Starting investigation: {topic}")

        # Phase 1: Initial analysis of the topic
        findings = await self.analyze(topic, depth)

        for finding in findings:
            stored = await self.shared_state.add_finding(finding)
            # Broadcast each finding to frontend in real-time
            await self.broadcast({
                "type": "new_finding",
                "data": stored
            })
            await asyncio.sleep(0.5)  # Stagger slightly for visual effect

        # Phase 2: React to OTHER agents' findings (emergence)
        await asyncio.sleep(3)  # Wait for other agents to post initial findings
        cross_findings = await self.react_to_swarm()

        for finding in cross_findings:
            stored = await self.shared_state.add_finding(finding)
            await self.broadcast({
                "type": "new_finding",
                "data": stored
            })
            await asyncio.sleep(0.5)

        # Update this agent's final score
        score = self.calculate_score()
        await self.shared_state.update_agent_score(self.agent_id, score)
        await self.broadcast({
            "type": "agent_score_update",
            "agent_id": self.agent_id,
            "score": score
        })

        print(f"[{self.agent_id}] Done. Score: {score}")

    async def analyze(self, topic: str, depth: str) -> list[dict]:
        """
        Override this in each agent subclass.
        Returns a list of finding dicts.
        """
        raise NotImplementedError

    async def react_to_swarm(self) -> list[dict]:
        """
        Look at what OTHER agents have found and add cross-findings.
        This is where emergence happens.
        Override in subclasses for richer behavior.
        """
        return []

    def calculate_score(self) -> float:
        """
        Calculate this agent's confidence score based on its findings
        AND what the rest of the swarm found.
        """
        my_findings = self.shared_state.get_findings_by_agent(self.agent_id)
        if not my_findings:
            return 50.0

        severity_map = {"critical": 90, "high": 75, "medium": 55, "low": 35}
        scores = [severity_map.get(f.get("severity", "low"), 50) for f in my_findings]
        return round(sum(scores) / len(scores), 1)

    def make_finding(self, finding_type: str, description: str,
                     severity: str, region: str = None) -> dict:
        """Helper to create a properly formatted finding."""
        agent_info = self.shared_state.agent_definitions.get(self.agent_id, {})
        return {
            "agentId": self.agent_id,
            "agentName": agent_info.get("name", self.agent_id),
            "type": finding_type,
            "description": description,
            "severity": severity,  # "low" | "medium" | "high" | "critical"
            "region": region,
        }

    async def call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """
        Call the LLM API. Uses OpenAI by default.
        Swap out for Anthropic or Gemini as needed.
        """
        import os
        import aiohttp

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print(f"[{self.agent_id}] No API key found, using mock response")
            return self._mock_llm_response()

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 800,
            "temperature": 0.3
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=body
                ) as resp:
                    data = await resp.json()
                    return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[{self.agent_id}] LLM call failed: {e}")
            return self._mock_llm_response()

    def _mock_llm_response(self) -> str:
        """Fallback mock response when no API key is available."""
        return json.dumps([{
            "type": "MOCK FINDING",
            "description": f"Mock finding from {self.agent_id} — add API key for real analysis",
            "severity": "medium",
            "region": "Unknown"
        }])
