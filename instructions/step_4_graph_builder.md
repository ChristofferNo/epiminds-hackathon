# Step 4 — Graph Builder Agent

Follow the architecture defined in **CLAUDE.md**.

In this step we implement the **Graph Builder Agent**.

This agent constructs a **graph structure representing relationships between sources, claims, and narratives**.

The graph will later be used by the **React dashboard** to visualize narrative ecosystems.

---

# Goal

Input (already in shared context):

```json
{
 "documents": [...],
 "claims": [...],
 "narratives": [...]
}
```

Output added to context:

```json
{
 "graph": {
   "nodes": [...],
   "edges": [...]
 }
}
```

The graph should represent the relationships:

```
source → claim → narrative
```

---

# File to Create

Create a new agent file:

```
agents/graph_agent.py
```

---

# Graph Data Structure

The graph will contain:

## Nodes

Three node types:

- **source**
- **claim**
- **narrative**

Example node:

```json
{
  "id": "claim_1",
  "type": "claim",
  "label": "mRNA vaccines alter DNA"
}
```

Example narrative node:

```json
{
  "id": "narrative_1",
  "type": "narrative",
  "label": "DNA alteration fear"
}
```

Example source node:

```json
{
  "id": "source_1",
  "type": "source",
  "label": "https://example.com"
}
```

---

# Edges

Edges represent relationships.

Two types:

```
source → claim
claim → narrative
```

Example:

```json
{
  "source": "source_1",
  "target": "claim_1"
}
```

```json
{
  "source": "claim_1",
  "target": "narrative_1"
}
```

---

# Implementation Steps

The graph agent should:

1. Read **documents, claims, and narratives** from context
2. Create nodes for:
   - sources
   - claims
   - narratives

3. Create edges linking:
   - source → claim
   - claim → narrative

4. Store the result in:

```
context["graph"]
```

5. Print debug output so we can verify the graph was built.

---

# Example Implementation Outline

Example structure:

```python
def graph_agent(context):

    if not context["claims"]:
        return

    if not context["narratives"]:
        return

    if context.get("graph"):
        return

    print("\nRunning Graph Builder Agent")

    nodes = []
    edges = []

    # create source nodes
    # create claim nodes
    # create narrative nodes

    # create edges linking them

    context["graph"] = {
        "nodes": nodes,
        "edges": edges
    }

    print("Graph built")
    print("Nodes:", len(nodes))
    print("Edges:", len(edges))
```

---

# Mapping Logic

To link claims to narratives:

Loop through narratives and check which claims belong to each narrative.

Example:

```
narrative["claims"]
```

Each claim should link to the narrative.

---

# Required Debug Output

When the agent runs we should see something like:

```
Running Graph Builder Agent

Graph built
Nodes: 18
Edges: 22
```

This confirms the graph was successfully created.

---

# Update Shared Context

After the agent runs:

```json
{
 "topic": "...",
 "documents": [...],
 "claims": [...],
 "narratives": [...],
 "graph": {
   "nodes": [...],
   "edges": [...]
 }
}
```

---

# Add Test Endpoint

Add a temporary route in:

```
backend/main.py
```

Route:

```
POST /run-graph
```

Example:

```python
@app.post("/run-graph")
def run_graph():
    graph_agent(shared_context)
    return shared_context
```

---

# How to Test

1. Start backend

```
uvicorn backend.main:app --reload
```

2. Run previous steps:

```
POST /run-scraper
POST /run-claims
POST /run-narratives
```

3. Run graph builder:

```
POST /run-graph
`
```
