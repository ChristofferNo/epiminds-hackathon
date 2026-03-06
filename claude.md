# CLAUDE.md

## Project Context

This project is being built during a **4-hour hackathon**.

The goal is to prototype a system that maps **online narratives and potential disinformation** around a **user-chosen topic** using a **network of AI agents**.

The system will:

1. Scrape content from the web
2. Extract claims from the content
3. Cluster those claims into narratives
4. Visualize relationships between **sources → claims → narratives** in a dashboard

The key concept of the project is:

> A **non-hierarchical network of agents** that collaborate through a **shared context store**, without a hidden orchestrator.

All agents must:

- read from a **shared context**
- write results back to the same context
- never control other agents directly
- communicate only through shared state

This architecture is similar to a **blackboard system**.

However, the **first milestone (Step 0)** will **NOT include agents yet**.
We will start with a **minimal working skeleton** and build functionality step-by-step.

---

# Target Demo

Final demo flow:

1. User enters a **topic**
2. Agents scrape web sources
3. Claims are extracted
4. Claims are grouped into narratives
5. The dashboard displays:
   - narratives
   - claims
   - sources
   - a simple relationship graph

For the hackathon prototype we will only process **~5 sources**.

---

# Technology Stack

To make the demo visually compelling and easy to extend, we will use a **Python backend** and a **React frontend dashboard**.

## Backend

Language:

- Python

Framework:

- FastAPI

Purpose:

- Provide API endpoints
- Store and expose shared context
- Run agents that read/write the shared context

Libraries:

requests
beautifulsoup4
pydantic

LLM integration may be added later.

---

## Frontend

Framework:

- React

Recommended tooling:

- React
- Vite
- Axios (for API calls)
- React Flow **or** Cytoscape.js for graph visualization later

Purpose:

The frontend serves as the **interactive dashboard** where users:

1. Enter a topic
2. Trigger analysis
3. View discovered narratives
4. Explore claims and sources
5. Eventually explore a narrative graph

---

# Project Structure

Start with this minimal structure:

```text
project/
│
├─ backend/
│  ├─ main.py
│  └─ context.py
│
├─ frontend/
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
│      ├─ App.jsx
│      ├─ api.js
│      └─ components/
│          ├─ TopicInput.jsx
│          ├─ NarrativeList.jsx
│          └─ GraphView.jsx
│
├─ agents/
│  └─ (empty for now)
│
├─ requirements.txt
│
└─ CLAUDE.md
```

Explanation:

- **backend/** contains the FastAPI API and shared context
- **frontend/** contains the React dashboard
- **agents/** will later contain agent implementations
- **CLAUDE.md** explains the system to coding agents

---

# Shared Context Design

All agents will eventually collaborate through a **shared context object**.

Initial structure:

```python
shared_context = {
    "topic": "",
    "documents": [],
    "claims": [],
    "narratives": []
}
```

This will initially live in:

```text
backend/context.py
```

Later, agents will read from and write to this object.

---

# Step 0 — Skeleton System

Goal:

Create a **minimal working system** where:

- user enters a topic
- backend stores the topic
- frontend displays placeholder results

No agents yet.

The purpose of this step is simply to confirm:

**Frontend → Backend → Shared Context → Frontend works correctly.**

---

# Step 0 Implementation

## 1. Create the Shared Context

File:

```
backend/context.py
```

```python
shared_context = {
    "topic": "",
    "documents": [],
    "claims": [],
    "narratives": []
}
```

---

## 2. Create the FastAPI Backend

File:

```
backend/main.py
```

The backend should expose two endpoints.

### POST `/topic`

Stores the topic in the shared context.

Example request:

```json
{
  "topic": "mRNA vaccines"
}
```

Update:

```
shared_context["topic"]
```

---

### GET `/context`

Returns the full shared context.

Example response:

```json
{
  "topic": "mRNA vaccines",
  "documents": [],
  "claims": [],
  "narratives": []
}
```

---

## 3. Create the React Frontend

The React app should provide a **very simple interface**.

### Topic Input Component

UI example:

```
Enter Topic
[ mRNA vaccines ]

[ Analyze ]
```

When the button is clicked:

Send a POST request to:

```
POST /topic
```

---

## 4. Placeholder Narrative Display

Below the topic input display:

```
Narratives discovered

• Narrative A
• Narrative B
• Narrative C
```

These can be **hardcoded placeholders** for Step 0.

Later these will come from the backend.

---

## 5. Create API Helper

File:

```
frontend/src/api.js
```

Create helper functions:

```
setTopic(topic)
getContext()
```

Backend URL:

```
http://localhost:8000
```

---

# Requirements File

Create:

```
requirements.txt
```

Include:

```
fastapi
uvicorn
requests
beautifulsoup4
pydantic
```

---

# Development Commands

Start backend:

```
uvicorn backend.main:app --reload
```

Start frontend:

```
npm install
npm run dev
```

---

# Expected Result (Step 0)

A working demo where:

1. The user enters a topic
2. The frontend sends it to the backend
3. The backend stores it in the shared context
4. The frontend displays placeholder narratives

This confirms the **core system pipeline works**.

---

# Next Steps (Future Steps)

After Step 0 we will implement agents incrementally.

Step 1 — Web Scraper Agent
Step 2 — Claim Extraction Agent
Step 3 — Narrative Clustering Agent
Step 4 — Graph Construction
Step 5 — Convert pipeline to multi-agent shared context system
Step 6 — Graph visualization in the dashboard

---

# Important Architectural Constraint

There must **never be a hidden orchestrator agent**.

All agents must:

- read the shared context
- write to the shared context
- operate independently

Agents communicate **only through shared state**.

This constraint is essential to the design of the system.

---

# Documentation

Whenever you make a change that affects how a developer sets up, runs, or understands the project (new dependencies, new scripts, changed ports, new environment variables, new steps to run, etc.), you **must update `README.md`** to reflect that change.
