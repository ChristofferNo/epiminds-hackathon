# Step 6 — Graph Visualization in the React Dashboard

Follow the architecture defined in **CLAUDE.md**.

In previous steps we created a **graph structure in the backend** representing relationships between:

```
source → claim → narrative
```

In this step we will build the **visual graph interface in the React dashboard**.

The goal is to make the system visually compelling for the hackathon demo.

---

# Goal

Display the graph stored in the backend context inside the React frontend.

The graph should show:

Nodes:

- sources
- claims
- narratives

Edges:

- source → claim
- claim → narrative

Users should be able to visually explore how narratives emerge from claims and sources.

---

# Graph Library

Use:

**React Flow**

Reason:

- very easy to implement
- interactive
- works well for hackathon demos
- minimal configuration

Install dependency:

```bash
npm install reactflow
```

---

# Backend API

The frontend will fetch the graph from:

```
GET /context
```

The backend already returns:

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

The frontend should read:

```
context.graph
```

---

# Files to Implement

Create or modify the following files.

```
frontend/src/components/GraphView.jsx
frontend/src/api.js
frontend/src/App.jsx
```

---

# GraphView Component

Create:

```
frontend/src/components/GraphView.jsx
```

This component will:

1. Fetch the graph from the backend
2. Convert nodes and edges to React Flow format
3. Render the interactive graph

---

# React Flow Node Format

React Flow requires nodes in this format:

```javascript
{
  id: "node-id",
  data: { label: "Node Label" },
  position: { x: 0, y: 0 }
}
```

Example conversion:

Backend node:

```json
{
  "id": "claim_1",
  "type": "claim",
  "label": "mRNA vaccines alter DNA"
}
```

React Flow node:

```javascript
{
  id: "claim_1",
  data: { label: "mRNA vaccines alter DNA" },
  position: { x: Math.random()*500, y: Math.random()*500 }
}
```

Random positions are fine for the hackathon prototype.

---

# React Flow Edge Format

Edges:

```javascript
{
  id: "edge1",
  source: "source_1",
  target: "claim_1"
}
```

---

# Example GraphView Implementation Outline

```javascript
import React, { useEffect, useState } from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import { getContext } from "../api";

function GraphView() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    async function loadGraph() {
      const context = await getContext();
      const graph = context.graph;

      if (!graph) return;

      const rfNodes = graph.nodes.map((node) => ({
        id: node.id,
        data: { label: node.label },
        position: {
          x: Math.random() * 600,
          y: Math.random() * 400,
        },
      }));

      const rfEdges = graph.edges.map((edge, i) => ({
        id: "e" + i,
        source: edge.source,
        target: edge.target,
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
    }

    loadGraph();
  }, []);

  return (
    <div style={{ height: 500 }}>
      <ReactFlow nodes={nodes} edges={edges} />
    </div>
  );
}

export default GraphView;
```

---

# API Helper

Update:

```
frontend/src/api.js
```

Add:

```javascript
export async function getContext() {
  const res = await fetch("http://localhost:8000/context");
  return res.json();
}
```

---

# Add GraphView to App

Update:

```
frontend/src/App.jsx
```

Example layout:

```javascript
import GraphView from "./components/GraphView";

function App() {
  return (
    <div>
      <h1>Narrative Mapping Dashboard</h1>

      <GraphView />
    </div>
  );
}

export default App;
```

---

# Expected Result

When the page loads:

The dashboard should display a **graph visualization** of the relationships between:

```
Sources
   ↓
Claims
   ↓
Narratives
```

Example layout:

```
[source] → [claim] → [narrative]
```

Nodes should be draggable and interactive.

---

# Optional Improvements (Only If Time Allows)

Color nodes by type.

Example:

Sources → blue
Claims → orange
Narratives → green

Example logic:

```javascript
style: {
  background: "orange";
}
```

---

# Debugging

If the graph does not appear:

1. Check backend:

```
GET /context
```

Confirm `graph` exists.

2. Check browser console for errors.

3. Print graph in frontend:

```javascript
console.log(graph);
```

---

# Expected Hackathon Demo

User flow:

1. Enter topic
2. Agents scrape and analyze content
3. Dashboard displays **narrative graph**
4. User visually explores narrative structure

This is the step that turns the project into a **visual narrative mapping tool**.

---

# Next Step (Optional)

Possible improvements after this step:

- highlight narrative clusters
- filter by source
- timeline of narrative emergence
- sentiment classification of claims
