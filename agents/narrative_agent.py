import json
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GEMINI_MODEL = "gemini-2.5-flash"


def cluster_claims_llm(claims: list[str]) -> list[dict]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)

    claims_text = "\n".join(f"- {c}" for c in claims)

    prompt = f"""You are analyzing online discourse.

Group the following claims into 3-5 narrative themes.

A narrative theme represents a broader storyline or belief.

Claims:
{claims_text}

Return ONLY a valid JSON object in this exact format, with no markdown or extra text:
{{
  "narratives": [
    {{
      "theme": "short theme name",
      "claims": ["claim1", "claim2"]
    }}
  ]
}}"""

    response = model.generate_content(prompt)
    raw = response.text.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    data = json.loads(raw)
    return data.get("narratives", [])


def narrative_agent(context: dict) -> None:
    if not context["claims"]:
        return

    if context["narratives"]:
        return

    # Flatten all claims from all documents
    claims = []
    for item in context["claims"]:
        for claim in item.get("claims", []):
            claims.append(claim)

    print("\nRunning Narrative Agent")
    print("Total claims:", len(claims))

    if not claims:
        return

    narratives = cluster_claims_llm(claims)

    context["narratives"] = narratives

    print("\nNarratives discovered:")
    for n in narratives:
        print("-", n["theme"])
