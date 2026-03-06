import json
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GEMINI_MODEL = "gemini-2.0-flash"


def check_credibility(context: dict) -> None:
    claims_list = context.get("claims", [])

    if len(claims_list) < 2:
        print("Credibility agent: need at least 2 sources to cross-check, skipping.")
        return

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)

    print("\nRunning credibility checks...\n")

    results = []

    for i, source in enumerate(claims_list):
        other_sources = [s for j, s in enumerate(claims_list) if j != i]

        other_sources_text = "\n\n".join(
            f"Source: {s['url']}\nClaims:\n" + "\n".join(f"  - {c}" for c in s["claims"])
            for s in other_sources
        )

        this_claims_text = "\n".join(f"  - {c}" for c in source["claims"])

        prompt = f"""You are a source credibility analyst.

Source being evaluated:
URL: {source['url']}
Title: {source['title']}
Claims:
{this_claims_text}

Other sources on the same topic:
{other_sources_text}

For each claim of the source being evaluated, check whether other sources corroborate or contradict it.
Then give an overall credibility score from 0.0 (not credible) to 1.0 (very credible).

Return ONLY valid JSON in this exact format, no markdown:
{{
  "url": "{source['url']}",
  "title": "{source['title']}",
  "score": 0.0,
  "verdict": "one sentence summary of credibility",
  "claim_checks": [
    {{
      "claim": "the claim text",
      "status": "corroborated" or "contradicted" or "unverified",
      "detail": "brief explanation"
    }}
  ]
}}"""

        try:
            response = model.generate_content(prompt)
            raw = response.text.strip()

            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            result = json.loads(raw)
            results.append(result)
            print(f"Checked: {source['title'] or source['url']}")
            print(f"  Score: {result['score']} — {result['verdict']}")
        except Exception as e:
            print(f"  Failed credibility check for {source['url']}: {e}")
            results.append({
                "url": source["url"],
                "title": source["title"],
                "score": None,
                "verdict": "Check failed",
                "claim_checks": []
            })

    context["credibility"] = results
    print(f"\nCredibility checks done for {len(results)} sources.")
