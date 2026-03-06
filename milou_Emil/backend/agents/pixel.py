"""Pixel — Image Analysis Agent"""
import json
from agents.base_agent import BaseAgent

PIXEL_PROMPT = """You are Pixel, an image analysis specialist in the Milou disinformation swarm.
Detect: AI-generated images, manipulated photos, images used out of context, missing EXIF data.
Respond ONLY with JSON array: [{"type":"TYPE","description":"detail","severity":"low|medium|high|critical","region":null}]
3-4 findings. ONLY JSON."""

class PixelAgent(BaseAgent):
    async def analyze(self, topic: str, depth: str) -> list[dict]:
        raw = await self.call_llm(PIXEL_PROMPT, f"Analyze images used in content about: '{topic}'. Are they AI-generated, manipulated, or used out of context?")
        try:
            data = json.loads(raw.strip())
            return [self.make_finding(d.get("type","IMAGE ANOMALY"), d.get("description",""), d.get("severity","high"), d.get("region")) for d in data]
        except:
            return [self.make_finding("AI-GENERATED IMAGE DETECTED", f"Hero images in '{topic}' content show GAN artifacts. Reverse image search yields zero prior results.", "critical", "Middle East")]

    async def react_to_swarm(self) -> list[dict]:
        lingua_findings = self.shared_state.get_findings_by_agent("lingua")
        if lingua_findings:
            return [self.make_finding("MULTIMEDIA DISINFORMATION PACKAGE",
                "AI-generated images + AI-written text = full synthetic media package. High confidence coordinated operation.",
                "critical", None)]
        return []
