# Step 3 — Narrative Clustering Agent

Follow the architecture defined in **CLAUDE.md**.

In this step we implement the **Narrative Clustering Agent**.

The purpose of this step is to:

- group extracted claims into **narrative themes**
- store these themes in the shared context
- print the results so we can verify it works

This step transforms **individual claims** into **higher-level narratives**.

---

# Goal

Input (from Step 2):

```json
{
  "claims": [
    {
      "claim": "mRNA vaccines alter DNA",
      "source": "https://example.com"
    },
    {
      "claim": "vaccines are safe and effective",
      "source": "https://example.com"
    }
  ]
}
```

Output added to context:

```json
{
  "narratives": [
    {
      "theme": "DNA alteration fear",
      "claims": ["mRNA vaccines alter DNA"]
    },
    {
      "theme": "vaccine safety",
      "claims": ["vaccines are safe and effective"]
    }
  ]
}
```

---

# File to Create

Create the agent:

```text
agents/narrative_agent.py
```

---

# Agent Responsibilities

The narrative agent should:

1. Read claims from shared context
2. Send the claims to an LLM
3. Ask the LLM to group them into **3–5 narrative themes**
4. Store the narratives in the context
5. Print the results to the console

---

# LLM Model

Use the same model as Step 2

Library:

```python
google-generativeai
```

---

# Prompt Design

Prompt example:

```
You are analyzing online discourse.

Group the following claims into 3–5 narrative themes.

A narrative theme represents a broader storyline or belief.

Claims:
{claims}

Return JSON:

{
 "narratives":[
   {
     "theme": "short theme name",
     "claims": ["claim1","claim2"]
   }
 ]
}
```

---

# Implementation Outline

Example structure:

```python
def narrative_agent(context):

    claims = [c["claim"] for c in context["claims"]]

    print("\nRunning Narrative Agent")
    print("Total claims:", len(claims))

    narratives = cluster_claims_llm(claims)

    context["narratives"] = narratives

    print("\nNarratives discovered:")

    for n in narratives:
        print("-", n["theme"])
```

---

# Required Debug Output

When the agent runs we should see something like:

```
Running Narrative Agent
Total claims: 8

Narratives discovered:

- DNA alteration fear
- Vaccine safety
- Pharmaceutical conspiracy
```

This confirms clustering worked.

---

# Context Update

After the agent runs, the shared context should look like:

```json
{
 "topic": "mRNA vaccines",
 "documents": [...],
 "claims": [...],
 "narratives": [
   {
     "theme": "DNA alteration fear",
     "claims": [...]
   }
 ]
}
```

---

# Add a Test Endpoint

Add a temporary route in:

```
backend/main.py
```

Route:

```
POST /run-narratives
```

Implementation example:

```python
@app.post("/run-narratives")
def run_narratives():
    narrative_agent(shared_context)
    return shared_context
```

---

# How to Test

1. Start backend

```
uvicorn backend.main:app --reload
```

2. Run the previous steps first:

```
POST /run-scraper
POST /run-claims
```

3. Run narrative clustering:

```
POST /run-narratives
```

4. Verify:

- terminal prints narrative themes
- response contains narrative groups

---

# Expected Result

The system now produces a **structured narrative map**:

```
sources → claims → narratives
```

This is the first point where the system starts to resemble a **disinformation narrative analysis tool**.

---

# Important Constraints

Do NOT:

- modify the frontend yet
- implement graph visualization yet
- change earlier agents

Only implement the **Narrative Clustering Agent**.

---

# Next Step

Next we will implement:

**Step 4 — Graph Construction Agent**

This will create the relationships:

```
source → claim → narrative
```

which will power the visualization in the dashboard.
