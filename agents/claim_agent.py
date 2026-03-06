import json
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GEMINI_MODEL = "gemini-3-flash-preview"


def extract_claims_for_document(doc: dict, topic: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)

    prompt = f"""You are a fact-extraction assistant.

Topic: {topic}

Article title: {doc['title']}

Article text:
{doc['text']}

Extract the key factual claims from this article that are relevant to the topic.
Return ONLY a valid JSON object in this exact format, with no markdown or extra text:
{{
  "url": "{doc['url']}",
  "title": "{doc['title']}",
  "claims": [
    "claim one",
    "claim two"
  ]
}}
"""

    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)


def claim_agent(context: dict) -> None:
    topic = context["topic"]
    documents = context["documents"]

    if not documents:
        print("Claim agent: no documents to process, skipping.")
        return

    print("\nRunning claim extraction...\n")

    for doc in documents:
        if not doc.get("text"):
            continue

        print(f"Document: {doc['title'] or doc['url']}")
        try:
            result = extract_claims_for_document(doc, topic)
            claims = result.get("claims", [])
            for claim in claims:
                print(f"  - {claim}")
            context["claims"].append(result)
        except Exception as e:
            print(f"  Failed to extract claims: {e}")

        print()

    print(f"Total claim sets extracted: {len(context['claims'])}")
