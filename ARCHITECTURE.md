# Architecture Stack

A narrative intelligence system. User enters a topic, a swarm of AI agents scrapes, extracts, clusters, and graphs information, and the frontend visualizes the process live before rendering an intelligence report.

---

## Stack

| Layer     | Tech                                               |
| --------- | -------------------------------------------------- |
| Frontend  | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui |
| Backend   | Python 3, FastAPI, Uvicorn                         |
| Transport | HTTP polling (frontend → backend every 1.5s)       |

---

## System Flow

```
LandingPage  ──►  SwarmPage  ──►  ResultsPage
(topic input)    (live viz)       (report)
                     │
              polls GET /context every 1.5s
                     │
               FastAPI :8000
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼               ▼
scraper_agent  claim_agent  narrative_agent  graph_agent
(documents)    (claims)     (narratives)     (graph)
     └───────────────▼───────────────┘               │
               shared_context  ◄─────────────────────┘
```

---

## Backend

**Blackboard architecture** — all agents read/write a single shared dict. No agent calls another directly.

```python
shared_context = {
    "topic": "",        # set via POST /topic
    "documents": [],    # scraper_agent
    "claims": [],       # claim_agent
    "narratives": [],   # narrative_agent
    "graph": {},        # graph_agent
    "agent_status": { "scraper": "idle|running|done", ... }
}
```

Each agent runs as a daemon `threading.Thread` in true parallel. Agents poll every 2s and act as soon as their required input keys are populated — no sequential gating.

**Endpoints:**

| Method | Path       | Description                       |
| ------ | ---------- | --------------------------------- |
| POST   | `/topic`   | Set topic, kick off pipeline      |
| GET    | `/context` | Return full shared context        |
| POST   | `/reset`   | Clear context, reset agent status |

---

## Frontend Pages

| Page             | Description                                       |
| ---------------- | ------------------------------------------------- |
| `LandingPage`    | Topic input                                       |
| `SwarmPage`      | Live animated agent swarm, polls `/context`       |
| `ResultsPage`    | Intelligence report — narratives, claims, sources |
| `CrimeBoardPage` | Alternative evidence board view                   |

---

## Running Locally

```bash
# Backend
pip install -r requirements.txt
uvicorn Backend.main:app --reload   # http://localhost:8000

# Frontend
cd milou_Emil/frontend
npm install && npm run dev           # http://localhost:5173
```
