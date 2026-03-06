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
import os
import aiohttp
from shared_state import SharedState


class BaseAgent:
    def __init__(self, agent_id: str, shared_state: SharedState, broadcast_fn):
        self.agent_id = agent_id
        self.shared_state = shared_state
        self.broadcast = broadcast_fn
        self.model = "gemini-2.5-flash"

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
            await self.broadcast({
                "type": "new_finding",
                "data": stored
            })
            await asyncio.sleep(0.5)

        # Phase 2: React to OTHER agents' findings (emergence)
        await asyncio.sleep(3)
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
        raise NotImplementedError

    async def react_to_swarm(self) -> list[dict]:
        return []

    def calculate_score(self) -> float:
        my_findings = self.shared_state.get_findings_by_agent(self.agent_id)
        if not my_findings:
            return 50.0
        severity_map = {"critical": 90, "high": 75, "medium": 55, "low": 35}
        scores = [severity_map.get(f.get("severity", "low"), 50) for f in my_findings]
        return round(sum(scores) / len(scores), 1)

    def make_finding(self, finding_type: str, description: str,
                     severity: str, region: str = None) -> dict:
        agent_info = self.shared_state.agent_definitions.get(self.agent_id, {})
        return {
            "agentId": self.agent_id,
            "agentName": agent_info.get("name", self.agent_id),
            "type": finding_type,
            "description": description,
            "severity": severity,
            "region": region,
        }

    async def call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """
        Calls Google Gemini API.
        Reads GEMINI_API_KEY from .env file.
        """
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            print(f"[{self.agent_id}] No GEMINI_API_KEY found in .env, using mock response")
            return self._mock_llm_response()

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={api_key}"

        headers = {"Content-Type": "application/json"}

        # Gemini combines system + user prompt like this:
        body = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"{system_prompt}\n\n{user_prompt}"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 1500,
            }
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=body) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        print(f"[{self.agent_id}] Gemini error {resp.status}: {error_text[:200]}")
                        return self._mock_llm_response()
                    data = await resp.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    if "```" in text:
                        text = text.split("```")[1]
                        if text.startswith("json"):
                            text = text[4:]
                        text = text.split("```")[0]
                    return text.strip()
        except Exception as e:
            print(f"[{self.agent_id}] LLM call failed: {e}")
            return self._mock_llm_response()

    async def search_web(self, query: str) -> list[dict]:
        """
        DuckDuckGo search — no API key needed!
        Returns list of {title, url, snippet} results.
        """
        url = "https://api.duckduckgo.com/"
        params = {
            "q": query,
            "format": "json",
            "no_html": "1",
            "skip_disambig": "1"
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as resp:
                    data = await resp.json(content_type=None)
                    results = []
                    # Related topics as results
                    for item in data.get("RelatedTopics", [])[:5]:
                        if "Text" in item:
                            results.append({
                                "title": item.get("Text", "")[:100],
                                "url": item.get("FirstURL", ""),
                                "snippet": item.get("Text", "")
                            })
                    return results
        except Exception as e:
            print(f"[{self.agent_id}] DuckDuckGo search failed: {e}")
            return []

    def _mock_llm_response(self) -> str:
        """Fallback when no API key available."""
        return json.dumps([{
            "type": "MOCK FINDING",
            "description": f"Mock finding from {self.agent_id} — check GEMINI_API_KEY in .env",
            "severity": "medium",
            "region": "Unknown"
        }])
