# Step 5 — Convert the System into a Non-Hierarchical Agent Network

Follow the architecture defined in **CLAUDE.md**.

Up until now, agents have likely been executed in a **pipeline**, where one step runs after another.

Example pipeline:

```
Scraper → Claim Extraction → Narrative Clustering → Graph Builder
```

This step changes the architecture so the system behaves like a **network of independent agents**.

The system must **NOT contain a hidden orchestrator**.

Instead, agents should:

- read from the shared context
- decide whether they should run
- write results back to the context

This architecture is similar to a **blackboard system**.

---

# Goal

Convert the current pipeline into a **shared-context agent network**.

Agents should run independently and determine **for themselves** whether they should act.

Each agent must:

1. Check if the required input exists
2. Check if the output already exists
3. If both conditions allow it, run
4. Write results back to shared context
5. Print debug output

---

# Shared Context (Reminder)

The shared context lives in:

```
backend/context.py
```

Example structure:

```python
shared_context = {
    "topic": "",
    "documents": [],
    "claims": [],
    "narratives": [],
    "graph": {}
}
```

Agents should **only communicate through this object**.

They should **never call each other directly**.

---

# Modify Agents to Be Self-Triggered

Each agent should check whether it should run.

Example pattern:

```python
def agent(context):

    if required_input_missing:
        return

    if output_already_exists:
        return

    print("Running agent")

    # perform work

    context["output"] = result
```

---

# Example: Scraper Agent Logic

```python
def scraper_agent(context):

    if not context["topic"]:
        return

    if context["documents"]:
        return

    print("Running Scraper Agent")

    documents = scrape_web(context["topic"])

    context["documents"] = documents

    print("Scraper completed:", len(documents), "documents")
```

---

# Example: Claim Agent Logic

```python
def claim_agent(context):

    if not context["documents"]:
        return

    if context["claims"]:
        return

    print("Running Claim Agent")

    claims = extract_claims(context["documents"])

    context["claims"] = claims

    print("Claims extracted:", len(claims))
```

---

# Example: Narrative Agent Logic

```python
def narrative_agent(context):

    if not context["claims"]:
        return

    if context["narratives"]:
        return

    print("Running Narrative Agent")

    narratives = cluster_claims(context["claims"])

    context["narratives"] = narratives

    print("Narratives discovered:", len(narratives))
```

---

# Create an Agent Runner

Create a new file:

```
backend/agent_runner.py
```

This file will run all agents.

Example:

```python
from agents.scraper_agent import scraper_agent
from agents.claim_agent import claim_agent
from agents.narrative_agent import narrative_agent
from agents.graph_agent import graph_agent

agents = [
    scraper_agent,
    claim_agent,
    narrative_agent,
    graph_agent
]

def run_agents(context):

    print("\nStarting agent network\n")

    for agent in agents:
        agent(context)

    print("\nAgent network cycle complete\n")
```

Important:

The runner **does not decide which agents run**.

Agents themselves decide.

---

# Optional: Run Multiple Passes

To simulate agents reacting to new information, run multiple cycles.

Example:

```python
def run_agents(context):

    for i in range(3):

        print(f"\nAgent cycle {i+1}\n")

        for agent in agents:
            agent(context)
```

Example output:

```
Agent cycle 1
Running Scraper Agent

Agent cycle 2
Running Claim Agent

Agent cycle 3
Running Narrative Agent
```

---

# Add Test Endpoint

Add a route in:

```
backend/main.py
```

Endpoint:

```
POST /run-agents
```

Example implementation:

```python
from backend.agent_runner import run_agents

@app.post("/run-agents")
def run_all_agents():
    run_agents(shared_context)
    return shared_context
```

---

# Expected Console Output

Example run:

```
Starting agent network

Running Scraper Agent
Scraper completed: 5 documents

Running Claim Agent
Claims extracted: 12

Running Narrative Agent
Narratives discovered: 4

Running Graph Agent
Graph built

Agent network cycle complete
```

This confirms agents are running correctly.

---

# Important Constraints

Do NOT:

- create an orchestrator agent
- create direct dependencies between agents
- modify frontend logic

Agents must **only communicate via shared context**.

---

# Expected Result

The system is now a **non-hierarchical multi-agent network**.

Architecture now looks like:

```
           Shared Context
                 │
     ┌───────────┼───────────┐
     │           │           │
 Scraper      Claim       Narrative
  Agent        Agent         Agent
     │           │           │
     └───────────┴───────────┘
                 │
             Graph Agent
```

All agents:

```
read context
write context
```

---

# Next Step

Next we will implement **Step 6 — Graph Visualization in the React Dashboard**.

This will visualize:

```
source → claim → narrative
```

and make the system much more compelling for the hackathon demo.
